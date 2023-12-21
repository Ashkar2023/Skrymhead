const mongoose = require("mongoose");
const tempUserSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    otp:{
        type:String,
        default:""
    },
    expireAt:{
        type:Date      
    }
})


module.exports = mongoose.model("tempUser",tempUserSchema)