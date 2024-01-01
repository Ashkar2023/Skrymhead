const User = require("../models/userModel");
const Order = require("../models/orderModel");
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const Address = require("../models/addressModel");
const {payment, order:orderStatus} = require("../config/enums")
const accountController = {};

accountController.getAccountPage = async(req,res)=>{
    try{
        const user = req.session.user;
        const userData = await User.findOne({email:user});
        res.render("user/profile",{userData:userData});
    }catch(error){
        console.log(error.message)
    }
}

accountController.getChangePassword = async(req,res)=>{
    try{
        res.render("user/password");
    }catch(error){
        console.log(error.message)
    }
}

accountController.changePassword = async(req,res)=>{
    try{
        const body = req.body;

        const user = await User.findById(req.session.userid);
        const passwordMatch = await bcrypt.compare(body.Opwd,user.password);

        if(passwordMatch){
            const newPassword = await bcrypt.hash(body.Npwd,10)
            const passwordChange = await User.findOneAndUpdate({_id:req.session.userid},{$set:{password:newPassword}});
            res.status(200).json({message:"Password change successful",success:true});
        }else{
            res.status(400).json({message:"Old password donot match",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server error!");
        console.log(error.message)
    }
}

accountController.editProfile = async(req,res)=>{
    try{
        const body = req.body;

        const updation = await User.findOneAndUpdate({_id:req.session.userid},{$set:{name:body.name,phone:body.phone}},{new:true});

        if(updation){
            res.status(200).json({message:"Profile updated successfully",success:true});
        }else{
            res.status(404).json({message:"Profile updation failed",success:false});
        }
        
    }catch(error){
        res.status(500).json("Internal Server error!")
        console.log(error.message)
    }
}

//Address
accountController.getAddress = async(req,res)=>{
    try{
        const user = req.session.user;
        const userData = await User.findOne({email:user});
        const address = userData.addresses;
        console.log(address);

        res.render("user/address",{addresses:address});
    }catch(error){
        console.log(error.message)
    }
}

accountController.addAddress = async(req,res)=>{
    try{
        const userEmail = req.session.user;
        const addressName = req.body.name.trim()
        const user = await User.findOne({_id:req.session.userid});

        const addressFound = await User.findOne({email:userEmail,"addresses.address_name":addressName});
        if(!addressFound){
            
            const newAddress = {
                address_name: addressName,
                house_name: req.body.house,
                street_address: req.body.street,
                state: req.body.state,
                city: req.body.city,
                pincode: req.body.pincode,
                phone: req.body.phone,
                alt_phone: req.body.altphone
            }
            
            user.addresses.push(newAddress);
            const userData = await user.save()
            console.log(userData)
            if(userData) res.status(200).json({success:true,message:"Address added successfully!",user:userData})
            
        }else{
            res.status(400).json({message:'address with the name already exists!',success:false});
        }   
        
    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error")
    }
}

accountController.deleteAddress = async(req,res)=>{
    try{
        const addressId = new ObjectId(req.body.elemId);
        const deleted = await User.findOneAndUpdate({_id:req.session.userid},{$pull:{"addresses":{_id:addressId}}});
        if(deleted){
            res.status(200).json({message:"Address deleted successfully!",success:true});
        }else{
            res.status(400).json({message:"Address not found",success:false});
        }
    }catch(error){
        res.status(500).json({message:"Interanl server Error!"});
        console.log(error.message)
    }
}


accountController.getOrders = async(req,res)=>{
    try{
        const orders = await Order.find({customer_id:req.session.userid}).populate("customer_id")
        res.render("user/orders",{orders:orders});
    }catch(error){
        console.log(error.message)
    }
}

accountController.cancelOrder = async(req,res)=>{
    try{
        const orderId = new ObjectId(req.body.orderId)
        const order = await Order.findByIdAndUpdate(orderId,{$set:{
                status:orderStatus.CANCELLED
            }})
            
        if (order) {
            res.status(200).json({message:"Order cancelled!",success:true});
        } else {
            res.status(400).json({message:"Order cancellation failed!",success:false});
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json("Internal server error!");
    }
}


module.exports = accountController ;