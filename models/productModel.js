const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    brand:{
        type:String,
        required:true
    },
    model:{
        type:String,
        required:true
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
    createdOn:{
        type:Date,
        default:Date.now
    },
    variants:[{
            type:mongoose.Types.ObjectId,
            ref:"variant"
    }]
})

module.exports = mongoose.model("product",productSchema)