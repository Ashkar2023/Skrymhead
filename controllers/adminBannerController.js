const { ObjectId } = require("mongodb");
const Banner = require("../models/bannerModel");
const fs = require("fs");
const path = require("path");

exports.getBanner = async(req,res)=>{
    try{
        const banner = await Banner.findOne({name:"home"});

        res.render("admin/banner",{banner:banner})
    }catch(error){
        console.log(error.message)
    }
}

exports.addImages = async(req,res)=>{
    try{
        const files = req.files.map(file=>({url : file.filename}));
        const updated = await Banner.findOneAndUpdate({name:"home"},{$push : {images : {$each : files } }},{new:true});

        if(updated){
            res.status(200).json({message:"added successfully",success:true});
        }else{
            res.status(400).json({message:"couldn't add images!",success:false});
        }

    }catch(error){
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

exports.deleteImage = async(req,res)=>{
    try{
        const updated = await Banner.findOneAndUpdate({name:"home"},{$pull:{images:{_id:new ObjectId(req.body.index)}} });
        const imagePath = updated.images.filter(image=>image._id.equals(new ObjectId(req.body.index)));

        if(updated){
            fs.unlinkSync(path.resolve(__dirname,"../public/images",imagePath[0].url));
            res.status(200).json({message:"deleted successfully",success:true});
        }else{
            res.status(400).json({message:"couldn't delete image!",success:false});
        }

    }catch(error){
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

exports.updateUrl = async(req,res)=>{
    try{
        const updated = await Banner.findOneAndUpdate({name:"home","images._id":new ObjectId(req.body.index)},{$set:{"images.$.link": req.body.url } },{new:true});
        if(updated){
            res.status(200).json({message:"url added successfully",success:true});
        }else{
            res.status(400).json({message:"couldn't add url!",success:false});
        }

    }catch(error){
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}