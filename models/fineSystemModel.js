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
    },
    paid:{
        type:Boolean,
        default:false
    },
    log:[
        {
            date:{
                type:Date,
                default:Date.now,
            },
            amount:{
                type:Number,
                default:0
            },
            pending:{
                type:Number,
                default:0
            },paid:{
                type:Boolean,
                default:false
            }
        }
    ]
})


module.exports = mongoose.model("dev",devSchema);