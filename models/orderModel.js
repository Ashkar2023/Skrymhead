const mongoose = require("mongoose");
const { payment, order } = require("../config/enums");

const orderSchema = new mongoose.Schema({
    order_id:{
        type:Number,
        required:true
    },
    customer_id:{
        type:mongoose.Types.ObjectId,
        ref:'user',
        requierd:true
    },
    status:{
        type:String,
        enum:Object.values(order),
        required:true
    },
    payment_type:{
        type:mongoose.Types.ObjectId,
        ref:"payments",
        required:true
    },
    payment_status:{
        type:String,
        enum:Object.values(payment),
        required:true,
        default:"pending"
    },
    totalPrice:{
        type:Number,
        required:true
    },
    address:{
        type:mongoose.Types.ObjectId,
        ref:"address",
        required:true
    },
    order_date:{
        type:Date,
        default:Date.now
    },
    delivered_date:{
        type:Date
    },
    items:[
        {
            product_id:{
                type:mongoose.Types.ObjectId,
                required:true,
                ref:"product"
            },
            variant_id:{
                type:mongoose.Types.ObjectId,
                required:true,
                ref:"variant"
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ]


})