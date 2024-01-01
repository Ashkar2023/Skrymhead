const Order = require("../models/orderModel");
const User = require("../models/userModel");
const productModel = require("../models/productModel");
const Cart = require("../models/cartModel");
const Variant = require("../models/variantModel");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");


const createOrder = async(req,res)=>{
    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const body = req.body;
        const cart = await Cart.findOne({user_id:req.session.userid});
        const items = cart.items;
        const lastOrder = await Order.findOne({}).sort({order_id:-1})
        const newOrderId = lastOrder ? lastOrder.order_id+1 : 1001;

        const currentOrder = new Order({
            order_id:newOrderId,
            customer_id:req.session.userid,
            payment_type:body.payment,
            address:body.address,
            totalPrice:body.total,
            items:items.map((item)=>item)
        })

        await currentOrder.save();

        const updatePromises = items.map(async(item) => {
            return Variant.findByIdAndUpdate(item.variant_id,{$inc:{"stock":-item.quantity}},{new:true});
        })

        const stockUpdated = await Promise.all(updatePromises);

        if (stockUpdated.some(update=>update instanceof Error)) {
            throw new Error("Not all stock updates were successful.");
        }
        
        const removeItems = await Cart.findOneAndUpdate({user_id:req.session.userid},{$set:{items:[]}})

        await session.commitTransaction()
        session.endSession();

        res.status(200).json({message:"Order successful!\nStocks were updated",success:true,orderId:currentOrder.order_id});
    }catch(error){
        await session.abortTransaction()
        session.endSession();
        console.log(error.message)
        res.status(500).json({message: "An error occurred during the order process.",success: false,});
    }
}

module.exports = {
    createOrder
}