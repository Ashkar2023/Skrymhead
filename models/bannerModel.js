const mongoose = require("mongoose");

const bannerSchema = mongoose.Schema({
    names:{
        type:String,
        required:true
    },
    images:[{
        url:{
            type:String
        },
        link:{
            type:String
        }
    }]

})

module.exports = mongoose.model("banner",bannerSchema)