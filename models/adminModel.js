const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

adminSchema.methods.comparePwd = async(inputPwd, adminPwd)=>{
    return await bcrypt.compare(inputPwd, adminPwd);    
}

module.exports = mongoose.model("admin",adminSchema)