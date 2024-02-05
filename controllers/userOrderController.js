const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Variant = require("../models/variantModel");
const { payment , order : orderEnums} = require("../config/enums")

const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function aggregateTotal(id) {
	try {

		const CART = await Cart.aggregate([
			{
			  $match: {
				user_id: new ObjectId(id),
			  },
			},
			{
			  $unwind: "$items",
			},
			{
			  $lookup: {
				from: "products",
				localField: "items.product_id",
				foreignField: "_id",
				as: "items.product_id",
			  },
			},
			{
			  $lookup: {
				from: "categories",
				localField: "items.product_id.category",
				foreignField: "_id",
				as: "items.category",
			  },
			},
			{
			  $lookup: {
				from: "variants",
				localField: "items.variant_id",
				foreignField: "_id",
				as: "items.variant_id",
			  },
			},
			{
			  $addFields: {
				"items.product_id": {
				  $arrayElemAt: ["$items.product_id", 0],
				},
				"items.variant_id": {
				  $arrayElemAt: ["$items.variant_id", 0],
				},
				"items.category": {
				  $arrayElemAt: ["$items.category", 0],
				},
			  },
			},
			{
			  $addFields: {
				"items.greater_offer": {
				  $max: [
					"$items.product_id.product_offer",
					"$items.category.offer",
				  ],
				},
			  },
			},
			{
			  $addFields: {
				"items.offer_price": {
				  $cond: {
					if: {
					  $gt: ["$items.greater_offer", 0],
					},
					then: {
					  $subtract: [
						"$items.variant_id.price",
						{
						  $multiply: [
							{
							  $divide: [
								"$items.greater_offer",
								100,
							  ],
							},
							"$items.variant_id.price",
						  ],
						},
					  ],
					},
					else: "$items.variant_id.price",
				  },
				},
			  },
			},
			{
			  $group: {
				_id: "$_id",
				discount: {
				  $first: "$discount",
				},
				user_id: {
				  $first: "$user_id",
				},
				items: {
				  $push: "$items",
				},
				total: {
				  $sum:{
						$multiply: [
						  "$items.quantity",
						  "$items.offer_price",
						],
					  },
					},
				},
			},
			{
				$addFields: {
					total: {
						$subtract: ["$total", "$discount"],
					},
				},
			},
		  ]);

		return CART;
	} catch (error) {
		console.log(error.message)
	}
}

let sseClient = null;

const sseSetup = (req,res)=>{
	res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no");

	sseClient = res;

	console.log("connection opened");

    req.on("close", () => {
        sseClient = null;
    });
}

const createOrder = async(req,res)=>{
	let session = await mongoose.startSession();
	session.startTransaction();

	try{
        const body = req.body;
		const user = req.session.userid;

		const lastOrder = await Order.findOne({}).sort({order_id:-1})
        const newOrderId = lastOrder ? lastOrder.order_id+1 : 1001;
        const address = await User.findOne({
            _id:new ObjectId(user),
            "addresses._id":new ObjectId(body.address)
        },
		{
			"addresses.$":1,_id:0
		});
        const selectedAddress = address.addresses[0];

        const CART = await aggregateTotal(user);

		try{
			await checkStock(CART[0].items);
		}catch(error){
			console.log(error.message)
			res.status(400).json({ message: error.message, success: false });
			session.abortTransaction();
			return;
		}

        const currentOrder = new Order({
            order_id:newOrderId,
            customer_id:user,
            payment_type:body.payment,
            address:selectedAddress,
            totalPrice:CART[0].total,
            items: [],
			payment_status: payment.PENDING
        })

        const { order_id } = await currentOrder.save();

		if (body.payment==="COD") {
			await updateOrder(order_id, user, payment.PENDING, null);
		}

        await session.commitTransaction()
        res.status(200).json({message:"Order successful!\nStocks were updated",success:true,orderId:order_id});

    }catch(error){
        await session.abortTransaction();
        console.log(error.message)
        res.status(500).send("Internal server error!");
    }finally{
        session.endSession();
	}
}

async function updateOrder(newOrderId, user, paymentStatus, paymentID) {	
	try {
		const cart = await Cart.findOne({ user_id: new ObjectId(user) });
		const items = cart.items;

		if (paymentStatus === "Paid" || paymentStatus === "Pending") {
			const order = await Order.findOneAndUpdate({ order_id: newOrderId }, { $set: { payment_status: paymentStatus, items: items, payment_ref: paymentID } }, { new: true });

			const updatePromises = items.map((item) => {
				return Variant.findByIdAndUpdate(item.variant_id, { $inc: { "stock": -item.quantity } }, { new: true });
			});
			const stockUpdated = await Promise.all(updatePromises);

			if (stockUpdated.some(update => update instanceof Error)) {
				throw new Error("Not all stock updates were successful.");
			}

			const removeItems = await Cart.findOneAndUpdate({ user_id: new ObjectId(user) }, { $set: { items: [] } });

		} else if (paymentStatus === "payment failed") {
			const order = await Order.findOneAndUpdate({ order_id: newOrderId }, { $set: { payment_status: payment.FAILED, payment_ref: paymentID, items: items, status: orderEnums.FAILED } });
		}

		cart.coupon=null;
		cart.discount = 0;
		cart.price_limit = 0;
		cart.save();

	} catch (error) {
		console.log("From UpdateOrder: ", error.message);
	}
}


function checkStock(items) {
    return new Promise((resolve, reject) => {
        let promises = [];

        items.forEach(item => {
            promises.push(
                Variant.findOne({ _id: item.variant_id }).populate("product_id")
	                .then(data => {
                        if (!(data && data.stock >= item.quantity)) {
							const prd = data.product_id;
                            throw new Error(`Insufficient stock for variant ${prd.brand+" "+prd.model}`);
                        }
                    })
            );
        });

        Promise.all(promises)
            .then(() => resolve(true)) // All stock checks passed
            .catch(error => reject(error)); // Propagate the error
    });
}



const createPaymentIntent = async (req, res) => {
	try {
		const cart = await Order.findOne({order_id:req.body.newOrderId});

		const paymentIntent = await stripe.paymentIntents.create({
			amount: cart.totalPrice * 100,
			currency: "inr",
			automatic_payment_methods: { enabled: true },
			metadata:{
				order_id:req.body.newOrderId,
				user_id:req.session.userid
			}
		})

		if (paymentIntent) {
			res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, orderId:req.body.newOrderId })
		} else {
			req.status(400).json({ success: false, message: "couldn't create a payment intent" });
		}
	} catch (error) {
		console.log(error.message)
		res.status(500).send("Internal server Error");
	}
}

const listenToStripe = async(req,res)=>{
	try{
		let event = req.body;

		let message,metadata,orderID,paymentId;
		metadata = event?.data.object.metadata;
		paymentId = event?.data.object.id;
		orderID = metadata?.order_id;
		switch (event.type) {
			case "payment_intent.created":
				message = "payment order created";
				break;
			case 'payment_intent.requires_action':
				message = 'payment details submitted';
				break;
			case 'charge.succeeded':
				message = payment.PAID;
				updateOrder( orderID , metadata.user_id, message,paymentId)
				break;
			case "payment_intent.succeeded":
				message = "payment succeeded";
				break;
			case "payment_intent.payment_failed":
				message = "payment failed";
				updateOrder(orderID, metadata.user_id, message, paymentId);
				break;
			default:
				console.log(`Unhandled event type ${event.type}`);
		}
		console.log(message,"\n",event,"\n",event.object,metadata?.user_id,"\n",orderID,"\n",paymentId);

		if (sseClient) {
            sseClient.write(`data:${JSON.stringify({message,orderID})}\n\n`, (err) => {
                if (err) {
                    console.error(`Error writing to SSE client: ${err.message}`);
                }
            });
        }

		res.json({received: true});
	}catch(error){
		res.json({received: false});
		console.log(error.message)
	}
}


module.exports = {
    createOrder,
    createPaymentIntent,
	listenToStripe,
	sseSetup
}