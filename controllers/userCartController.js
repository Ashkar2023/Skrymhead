const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user_id: req.session.userid }).populate("user_id").populate("items.variant_id").populate("items.product_id")
        res.render("user/cart", { cart: cart });
    } catch (error) {
        console.log(error.message)
    }
}

const addToCart = async (req, res) => {
    try {
        const ID = new ObjectId(req.session.userid);
        const productId = new ObjectId(req.body.product);
        const variantId = new ObjectId(req.body.variant);
        const quantity = req.body.quantity;

        const alreadyIn = await Cart.findOne({ user_id: ID, 'items.variant_id': variantId });

        if (alreadyIn) {
            res.status(409).json({ message: "Item already in cart!", success: false })
        } else {
            const cartUpdated = await Cart.updateOne({ user_id: ID },
                {
                    $push: {
                        items: {
                            product_id: productId,
                            variant_id: variantId,
                            quantity: quantity
                        }
                    }
                }, { new: true })

            if (cartUpdated) {
                return res.status(200).json({ message: "Cart updated successfully!", success: true })
            } else {
                return res.status(400).json({ message: "Couldn't update cart", success: false });
            }
        }
        
    } catch (error) {
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

const productAddToCart = async (req, res) => {
    try {
        const ID = new ObjectId(req.session.userid);
        const productId = new ObjectId(req.body.product);
        const variantIndex = Number(req.body.variant);
        const quantity = req.body.quantity;

        const variantId = (await Product.findById(productId).populate("variants"))
            .variants[variantIndex]._id;

        const alreadyIn = await Cart.findOne({ user_id: ID, 'items.variant_id': variantId });

        if (alreadyIn) {
            res.status(409).json({ message: "Item already in cart!", success: false })
        } else {
            const cartUpdated = await Cart.updateOne({ user_id: ID },
                {
                    $push: {
                        items: {
                            product_id: productId,
                            variant_id: variantId,
                            quantity: quantity
                        }
                    }
                }, { new: true })

            if (cartUpdated) {
                return res.status(200).json({ message: "Cart updated successfully!", success: true })
            } else {
                return res.status(400).json({ message: "Couldn't update cart", success: false });
            }
        }

    } catch (error) {
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

const updateCart = async (req, res) => {
    try {
        const body = req.body;
        const id = new ObjectId(req.body.id);
        const userid = new ObjectId(req.session.userid);
        const cartItem = await Cart.findOneAndUpdate({ user_id: userid, "items.product_id": id }, { $set: { 'items.$.quantity': body.quantity } });

        if (cartItem) {
            res.status(200).json({ message: "Cart quantity updated successfully!", success: true })
        } else {
            res.status(200).json({ message: "Cart quantity updation failed !X", success: false })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal server error!")
    }
}

const cartItemDelete = async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const userid = new ObjectId(req.session.userid);
        const index = req.body.index;

        const deleted = await Cart.findOneAndUpdate({ user_id: userid, "items.variant_id": itemId }, { $pull: { "items": { "variant_id": itemId } } });
        const cart = await Cart.findOne({ user_id: userid });
        let length0 = cart.items.length === 0 ? true : false;

        if (deleted) {
            res.status(200).json({ message: "Cart Item deleted successfully!", success: true, length0 })
        } else {
            res.status(200).json({ message: "Cart Item deleted successfully!", success: false })
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Cart Item deleted successfully!")
    }
}

const getCheckout = async (req, res) => {
    try {
        const cart = await aggregateCart(req.session.userid);
        const user = await User.findById(req.session.userid);

        console.log(cart[0])
        if(cart[0].price_limit >= cart[0].total ){
            console.log("hellp")
            const cart = await Cart.findOne({user_id:req.session.userid})
            cart.discount = 0;
            cart.price_limit = 0;
            cart.coupon = null;
            cart.save();
        }

        if (cart[0].items.length === 0) {
            res.redirect("/cart");
            return
        }
        res.render("user/checkout", { cart: cart[0], addresses: user.addresses });
    } catch (error) {
        console.log(error.message)
    }
}

const checkoutAddAddress = async (req, res) => {
    try {

        const userEmail = req.session.user;
        const user = await User.findOne({ _id: req.session.userid });

        const addressFound = await User.findOne({ email: userEmail, "addresses.address_name": req.body.name });
        if (!addressFound) {

            const newAddress = {
                address_name: req.body.name,
                house_name: req.body.house,
                street_address: req.body.street,
                state: req.body.state,
                city: req.body.city,
                pincode: req.body.pincode,
                phone: req.body.phone,
                alt_phone: req.body.altphone || null
            }

            user.addresses.push(newAddress);
            const userData = await user.save()

            if (userData) {
                res.status(200).json({ success: true, message: "Address added successfully!", user: userData })
            }
        } else {
            res.status(200).json({ message: 'address with name already exists!', success: false });
        }

    }catch (error) {
        res.status(500).send("Internal server Error");
        onsole.log(error.message)
    }
}

const applyCoupon = async(req,res)=>{
    try{
        const { coupon : cartCoupon  } = await Cart.findOne({user_id:req.session.userid});
        const coupon = await Coupon.findOne({code:req.body.coupon, active: true});

        if(cartCoupon){
            return res.status(400).json({message:"A coupon has already been applied.",success:false, color:"#ff9800"});
       
        }else if(coupon && coupon.price_limit <= req.body.total){

            const cart = await Cart.findOneAndUpdate({user_id:req.session.userid},{$set:{coupon:req.body.coupon, discount:coupon.discount, price_limit:coupon.price_limit}});
            return res.status(200).json({message:"Coupon applied successfully",success:true, code: coupon.code, discount: coupon.discount});
        }else if(coupon){
            return res.status(400).json({message:`This coupon's eligiible only for orders o/a ${coupon.price_limit}`,success:false, color:"#ff9800"});
        }else{
            return res.status(400).json({message:"Coupon not found",success:false});min
        }

    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error");
    }
}

const removeCoupon = async(req,res)=>{
    try{
        const cart = await Cart.findOneAndUpdate({user_id:req.session.userid},{$set:{discount:0, price_limit:0},$unset:{coupon:1}});
        
        if(cart){
            res.status(200).json({message:"Coupon removed successfully",success:true});
        }else{
            res.status(400).json({message:"No applied coupons found",success:false});
        }

    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error");
    }
}

async function aggregateCart(id) {
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
                    price_limit:{$first:"$price_limit"},
                    total: {
                        $sum: {
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

module.exports = {
    getCart,
    addToCart,
    productAddToCart,
    updateCart,
    cartItemDelete,
    getCheckout,
    checkoutAddAddress,
    applyCoupon,
    removeCoupon
};