const { ObjectId } = require("mongodb");
const mongoose = require("mongoose")

const walletSchema = new mongoose.Schema({
    user_id:{
        type:ObjectId,
        ref:"user",
        required:true
    },
    balance:{
        type:Number,
        default:0
    },
    transactions:[{
        date:{
            type:Date,
            required:true
        },
        type:{
            type:String,
            enum:["debit","credit"],
            required:true
        },
        amount:{
            type:Number,
            required:true
        },
        order_id:{
            type:Number,
            required:false
        }
    }]
})

module.exports = mongoose.model("wallet",walletSchema)