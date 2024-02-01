const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    otp:{
        type:String,
        default:""
    },
    expireAt:{
        type:Date      
    },
    referred_by:{
        type:String
    }
})

module.exports = mongoose.model("tempUser",tempUserSchema)