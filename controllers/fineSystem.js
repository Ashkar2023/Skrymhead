const mongoose = require("mongoose");
const adminModel = require("../models/adminModel");
const { dev : Dev, fineLog : FineLog } = require("../models/fineSystemModel");

exports.getPage = async(req,res)=>{
    try{
        const fines = await Dev.find({});
        res.render("fineSystem/home",{ fines : fines});
    }catch(error){
        console.log(error.message)
    }
}

exports.addFive = async(req,res)=>{
    try{
        const fined = await Dev.findByIdAndUpdate(req.body.ID ,{$inc:{dailyTotal:5, total:5 }},{new:true});

        if(fined){
            res.status(200).json({message:"Fined",success:true, update:fined });
        }else{
            res.status(400).json({message:"Failed to impose fine",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server Error");
        console.log(error.message)
    }
}

exports.subFive = async(req,res)=>{
    try{
        const fined = await Dev.findByIdAndUpdate(req.body.ID ,{$inc:{dailyTotal:-5, total:-5 }},{new:true});

        if(fined){
            res.status(200).json({message:"hmmmmm",success:true, update:fined });
        }else{
            res.status(400).json({message:"Failed to decrement fine",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server Error");
        console.log(error.message)
    }
}

exports.cleanUpTotal = async(req,res)=>{
    try{
        const cleaned = await Dev.findByIdAndUpdate(req.body.id ,{$set:{ total:0 }},{new:true});

        if(cleaned){
            res.status(200).json({message:"Cleaned",success:true});
        }else{
            res.status(400).json({message:"Failed to clean total",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server Error");
        console.log(error.message)
    }
}

