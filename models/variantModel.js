const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
    product_id:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"product"
    },
    v_name:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true,
        min:0
    },
    price:{
        type:Number,
        required:true,
        min:1
    }},
    {
        versionKey:false
    })

module.exports = mongoose.model("variant",variantSchema);