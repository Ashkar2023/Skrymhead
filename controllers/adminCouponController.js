const mongoose = require("mongoose");
const Coupon = require("../models/couponModel");


const getCoupons = async(req,res)=>{
    try{
        const coupons = await Coupon.find({})
        res.render("admin/coupons",{coupons : coupons})
    }catch(error){
        console.log(error.message)
    }
}

const addCoupon = async(req,res)=>{
    try{
        let exists = await Coupon.findOne({code:req.body.code})
        
        if(exists){
            res.status(400).json({message:"coupon already exists",success:false});
        }else{
            let coupon = await Coupon.create({...req.body});
            coupon ? res.status(200).json({message:"Successfully created!",success:true}) : res.status(400).json({message:"creation failed",success:false});
        }
        
    }catch(error){
        res.status(500).send("Internal serve error!")
        console.log(error.message)
    }
}

const changeCouponStatus = async(req,res)=>{
    try{
        const {id} = req.params;
        let coupon = await Coupon.findById(id);
        coupon.active = !coupon.active;
        await coupon.save();

        if(coupon){
            return res.status(200).json({ message:'Coupon Status changed',success:true,status: coupon.active })
        }else{
            return res.status(400).json({ message:"couldn't find Coupon",success:false})
        }

    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error!")
    }
}

module.exports = {
    getCoupons,
    addCoupon,
    changeCouponStatus
}