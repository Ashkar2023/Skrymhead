const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
    
    admin_id:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("admin",adminSchema)