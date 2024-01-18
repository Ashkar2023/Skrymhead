const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Variant = require("../models/variantModel");
const {payment} = require("../config/enums")

const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function aggregateTotal(id) {
	try {

		const CART = await Cart.aggregate([
			{
				$match: { "user_id": new ObjectId(id) }
			},
			{
				$unwind: "$items"
			},
			{
				$lookup: {
					from: "variants",
					localField: "items.variant_id",
					foreignField: "_id",
					as: "items.variant_id"
				}
			},
			{
				$lookup: {
					from: "products",
					localField: "items.product_id",
					foreignField: "_id",
					as: "items.product_id"
				}
			},
			{
				$addFields: {
					"items.variant_id": { $arrayElemAt: ["$items.variant_id", 0] }
				}
			},
			{
				$group: {
					_id: "$_id",
					user_id: { $first: "$user_id" },
					items: { $push: "$items" },
					total: {
						$sum: {
							$multiply: [
								"$items.quantity",
								"$items.variant_id.price"
							]
						}
					}
				}
			}
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
	
	sseClient = res;

	console.log("connection opened");

    req.on("close", () => {
        sseClient = null;
    });
}


const createOrder = async(req,res)=>{
    const session = await mongoose.startSession();
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
		{"addresses.$":1,_id:0});
        const selectedAddress = address.addresses[0];

        const CART = await aggregateTotal(user);

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
			await updateOrder(order_id, user);
		}

        await session.commitTransaction()
        session.endSession();

        res.status(200).json({message:"Order successful!\nStocks were updated",success:true,orderId:order_id});
    }catch(error){
        await session.abortTransaction()
        session.endSession();
        console.log(error.message)
        res.status(500).json({message: "An error occurred during the order process.",success: false,});
    }
}

async function updateOrder(newOrderId, user, paymentStatus = payment.PENDING) {	
	try {
		const cart = await Cart.findOne({ user_id: new ObjectId(user) });
		const items = cart.items;


		if (paymentStatus === "payment charged") {
			const order = await Order.findOneAndUpdate({ order_id: newOrderId }, { $set: { payment_status: payment.PAID, items: items } });

			const updatePromises = items.map((item) => {
				return Variant.findByIdAndUpdate(item.variant_id, { $inc: { "stock": -item.quantity } }, { new: true });
			});
			const stockUpdated = await Promise.all(updatePromises);

			if (stockUpdated.some(update => update instanceof Error)) {
				throw new Error("Not all stock updates were successful.");
			}

			const removeItems = await Cart.findOneAndUpdate({ user_id: user }, { $set: { items: [] } });
			console.log("successfully updated order!");

		} else if (paymentStatus === "payment failed") {

			const order = await Order.findOneAndUpdate({ order_id: newOrderId }, { $set: { payment_status: payment.FAILED, items: items, status: payment.FAILED } });
		}

	} catch (error) {
		console.log(error);
	}
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

		let message,metadata,orderID;
		metadata = event?.data.object.metadata;
		orderID = metadata?.order_id;
		switch (event.type) {
			case "payment_intent.created":
				message = "payment order created";
				break;
			case 'payment_intent.requires_action':
				message = 'payment details submitted';
				break;
			case 'charge.succeeded':
				message = 'payment charged';
				updateOrder( orderID , metadata.user_id, message)
				break;
			case "payment_intent.succeeded":
				message = "payment succeeded";
				break;
			case "payment_intent.payment_failed":
				message = "payment failed";
				updateOrder(orderID, metadata.user_id, message);
				break;
			default:
				console.log(`Unhandled event type ${event.type}`);
		}
		console.log(message,"\n",metadata?.user_id,"\n",orderID);

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
