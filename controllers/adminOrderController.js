const Order = require("../models/orderModel")
const { order:orderStatus} = require("../config/enums"); // there was payment varaible assign before, if there's comes an error lookout


const getOrders = async(req,res)=>{
    try{
        const orders = await Order.find({}).populate("customer_id").sort({order_id:-1})
        res.render('admin/orders',{orders:orders});
    }catch(error){
        console.log(error.message)
    }
}

const orderDetails = async(req,res)=>{
    try{
        const ID = req.params.id;
        const order = await Order.findOne({order_id:ID}).populate("customer_id").populate("items.product_id").populate("items.variant_id");
        res.render("admin/orderDetails",{order:order});
    }catch(error){
        console.log(error.message)
    }
}

const cancelOrder = async(req,res)=>{
    try{
        const orderId = req.body.orderId;
        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.CBA,
                CBA:true
            }})
            
        if (order) {
            res.status(200).json({message:"Order marked delivered!",success:true});
        } else {
            res.status(400).json({message:"Marking delivered failed!",success:false});
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json("Internal server error!");
    }
}

const markAsDelivered = async(req,res)=>{
    try{
        const orderId = req.body.orderId;
        const returnDate = new Date(new Date().setSeconds(new Date().getSeconds() + 7 * 24 * 60 * 60));

        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.DELIVERED,return_date: returnDate,delivered_date:Date.now()
            }})
            
        if (order) {
            res.status(200).json({message:"Order cancelled!",success:true});
        } else {
            res.status(400).json({message:"Order cancellation failed!",success:false});
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json("Internal server error!");
    }
}


module.exports = {
    getOrders,
    orderDetails,
    cancelOrder,
    markAsDelivered
}