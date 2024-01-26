const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    brand:{
        type:String,
        required:true,
        index:true
    },
    model:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    category:{
        type:mongoose.Types.ObjectId,
        ref:"category",
        required:true
    },
    specification:{
        type:String,
        required:true
    },
    images:[{
        url:{
            type:String,
            required:true
        }    
    }],
    listed:{
        type:Boolean,
        default:true
    },
    product_offer:{
        type:Number,
        default:0
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    variants:[{
            type:mongoose.Types.ObjectId,
            ref:"variant"
    }],
    sales:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model("product",productSchema)