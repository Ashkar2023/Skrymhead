const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    
    category:{
        type:String,
        required:true
    },
    listed:{
        type:Boolean,
        default:true
    },
    created_On:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model("category",categorySchema)