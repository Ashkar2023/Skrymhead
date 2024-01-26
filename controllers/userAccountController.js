const User = require("../models/userModel");
const Variant = require("../models/variantModel");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
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

accountController.changeDP = async(req,res)=>{
    try{
        const image = req.file.filename;

        const updated = await User.findOneAndUpdate({_id:req.session.userid},{$set:{image_url:image}})

        if(updated){
            res.status(200).json({success:true,message:"profile image updated",newImageUrl:image});
        }else{
            throw new Error("Error");
        }
        
    }catch(error){
        res.status(500).send("Internal server error");
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
            res.status(400).json({message:"Old password don't match",success:false});
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
        const user = await User.findOne({_id:req.session.userid});

        const addressFound = await User.findOne({email:userEmail,"addresses.address_name":req.body.name});
        if(!addressFound){
            
            const newAddress = {
                address_name:req.body.name,
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

            if(userData){
              res.status(200).json({success:true,message:"Address added successfully!",user:userData})
            }
        }else{
            res.status(200).json({message:'address with the name already exists!',success:false});
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
        const orders = await Order.find({customer_id:req.session.userid}).populate("customer_id").populate("items.product_id").populate("items.variant_id").sort({order_id:-1})
        res.render("user/orders",{orders:orders});
    }catch(error){
        console.log(error.message)
    }
}

accountController.orderDetails = async(req,res)=>{
    try{
        const ID = req.params.id;
        const order = await Order.findOne({order_id:ID}).populate("customer_id").populate("items.product_id").populate("items.variant_id");
        res.render("user/orderDetails",{order:order});
    }catch(error){
        console.log(error.message)
    }
}

accountController.cancelOrder = async(req,res)=>{
    try{
        const orderId = req.body.orderId
        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.CANCELLED
            }
        })
            
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

accountController.returnOrder = async(req,res)=>{
    let session = await mongoose.startSession();
    session.startTransaction();

    try{
        const orderId = req.body.orderId
        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.RETURNED
            }},{new:true});

        const trnsctnObj = {date:Date.now(),type:"credit",amount:order.totalPrice,order_id:order.order_id};

        const wallet = await Wallet.findOneAndUpdate({user_id:new ObjectId(order.customer_id)},
            {$inc:{balance:order.totalPrice},$push:{transactions:trnsctnObj}},
            {new:true}
        );   

        const promiseArray = order.items.map((item)=>{
            return Variant.findOneAndUpdate({_id:item.variant_id},{$inc:{stock:item.quantity}});
        })

        const StockUpdated = Promise.all(promiseArray);

        if (order && wallet && StockUpdated) {
            session.commitTransaction();
            console.log("success")
            res.status(200).json({message:"Order Return initiated!\nFunds will shortly credit into your wallet.",success:true});
        } else {
            session.abortTransaction();
            res.status(400).json({message:"Order Return request failed!",success:false});
        }
        
    }catch(error){
        session.abortTransaction();
        res.status(500).send("Internal server error");
        console.log(error.message)
    }finally{
        session.endSession();
    }
}


accountController.getWalletPage = async(req,res)=>{
    try{
        const wallet = await Wallet.aggregate([
            {
                $match:{
                    user_id:new ObjectId(req.session.userid)
                }
            },
            {
                $unwind:"$transactions"
            },
            {
                $sort:{"transactions.date":-1}
            },
            {
                $group:{
                    _id:"$_id",
                    user_id:{$first:"$user_id"},
                    balance:{$first:"$balance"},
                    transactions:{$push:"$transactions"}
                }
            }
        ])

        res.render("user/wallet",{ wallet :wallet[0] });
    }catch(error){
        console.log(error.message)
    }
}

module.exports = accountController ;