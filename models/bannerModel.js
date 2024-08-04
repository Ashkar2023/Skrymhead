const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
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