const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    
    category:{
        type:String,
        required:true
    },
    offer:{
        type:Number,
        default:0
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