const mongoose = require("mongoose");
const address = require("../models/addressModel");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    image_url:{
        type:String,
        default:"1.png"
    },
    addresses:[address.schema]
})


module.exports = mongoose.model("user",userSchema)