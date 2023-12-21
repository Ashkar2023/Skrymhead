const mongoose = require("mongoose");

const paymentsSchema = new mongoose.Schema({
    types:[{
        name:{
            type:String,
            required:true
        }
    }]
})

module.exports = mongoose.model("payments",paymentsSchema)