const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user_id:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"user"
    },
    coupon:{
        type:String
    },
    discount:{
        type:Number,
        default:0
    },
    price_limit:{
        type:Number
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

module.exports = mongoose.model("cart",cartSchema);