const mongoose = require("mongoose")
const mongo = require("mongodb")

const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique: true
    },
    discount:{
        type:Number,
        required: true
    },
    price_limit:{
        type:Number,
        required:true
    },
    active:{
        type:Boolean,
        default:true
    },
    expire_in_days:{
        type:Number,
        required:true
    },
    expiry_date:{
        type:Date
    }
})

couponSchema.pre("save",function(next){
    if(this.code && this.expire_in_days){
        this.code = this.code.trim();
        this.code = this.code.toUpperCase();
        let roundedDate = new Date( new Date().getTime()+this.expire_in_days * 60 * 60 * 24 * 1000 )
        this.expiry_date = roundedDate.setHours(23,59,59,999) 
    }
    next();
})

module.exports = mongoose.model("coupon",couponSchema);