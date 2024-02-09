const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

exports.getLogin = async(req,res)=>{
    try{
        res.render("fineSystem/login");
    }catch(error){
        console.log(error.message)
    }
}

exports.logout = async(req,res)=>{
    try{
        res.cleearCookie("jwt");
        res.render("fineSystem/login");
    }catch(error){
        console.log(error.message)
    }
}

exports.verifyLogin = async(req,res)=>{
    try{
        const { email, password } = req.body;
        const admin = await adminModel.findOne({ admin_id:email});
        let verified = admin.password===password;
        let token = ''; 

        if(verified){
            token = jwt.sign({admin:admin._id},process.env.JWT_SECRET_KEY,{ expiresIn:"3d" })
            res.cookie("jwt", token, { httpOnly : true});
            res.status(200).json({success:true, url:"/fine"});
        }else{
            res.status(401).json({success:false,message:"who are you?"})
        }

    }catch(error){
        console.log(error.message)
    }
}

exports.addFive = async(req,res)=>{
    try{
        const fined = await Dev.findByIdAndUpdate(req.body.ID ,{$inc:{dailyTotal:5 }},{new:true});

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
        const fined = await Dev.findOneAndUpdate({_id:req.body.ID, dailyTotal:{$gte:5} },
            {
                $inc:{dailyTotal:-5 }
            },
            {new:true});

        if(fined){
            res.status(200).json({message:"hmmmmm",success:true, update:fined });
        }else{
            res.status(400).json({message:"Not possible",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server Error");
        console.log(error.message)
    }
}


