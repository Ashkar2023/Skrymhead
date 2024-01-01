const mongoose = require("mongoose");

const paymentsSchema = new mongoose.Schema({
        name:{
            type:String,
            required:true
        },
        listed:{
            type:Boolean,
            default:true
        }
})

module.exports = mongoose.model("payment",paymentsSchema)