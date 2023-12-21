const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    address_name:{
        type:String,
        required:true
    },
    house_name:{
        type:String,
        required:true
    },
    street_address:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    alt_phone:{
        type:Number
    }
})

module.exports = mongoose.model("address",addressSchema);