const mongoose = require("mongoose");

const devSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    dailyTotal:{
        type:Number,
        default:0,
        required:true
    },
    total:{
        type:Number,
        default:0,
        required:true
    },
    image_url:{
        type:String,
        required:true
    }
})

const fineLogSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    Log:[
        {
            date:{
                type:Date,
                required:true
            },
            amount:{
                type:Number,
                default:0,
            }
        }
    ]
},{collection : "fineLog"})

module.exports = {
    dev : mongoose.model("dev",devSchema),
    fineLog : mongoose.model("fineLog",fineLogSchema)
} 