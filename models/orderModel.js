const mongoose = require("mongoose");
const User = require('../models/userModel');
const { payment, order } = require("../config/enums");

const orderSchema = new mongoose.Schema({
    order_id:{
        type:Number,
        required:true,
        unique:true
    },
    customer_id:{
        type:mongoose.Types.ObjectId,
        ref:'user',
        requierd:true
    },
    status:{
        type:String,
        enum:Object.values(order),
        default:order.PROCESSING
    },
    CBA:{
        type:Boolean,
        default:false
    },
    payment_type:{
        type:String,
        required:true
        // type:mongoose.Types.ObjectId,
        // ref:"payment",
        // required:true
    },
    payment_status:{
        type:String,
        enum:Object.values(payment),
        required:true,
        default:payment.PENDING
    },
    totalPrice:{
        type:Number,
        required:true
    },
    address:{
        type:Object,
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

module.exports = mongoose.model("order",orderSchema);