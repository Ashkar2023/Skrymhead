const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const { findOneAndDelete } = require("../models/adminModel");
const { userIn } = require("../authentication/userAuth");

const getCart = async (req,res)=>{
    try{ 
        const cart = await Cart.findOne({user_id:req.session.userid }).populate("user_id").populate("items.variant_id").populate("items.product_id")
        res.render("user/cart", {cart:cart});
    }catch(error){
        console.log(error.message)
    }
}

const addToCart = async(req,res)=>{
    try{
        const ID = new ObjectId(req.session.userid);
        const productId = new ObjectId(req.body.product);
        const variantId = new ObjectId(req.body.variant);
        const quantity = req.body.quantity;
        
        const alreadyIn = await Cart.findOne({user_id:ID,'items.variant_id': variantId});

        if(alreadyIn){
            res.status(409).json({message:"Item already in cart!",success:false})
        }else{
            const cartUpdated = await Cart.updateOne({user_id:ID},
                {$push:{
                    items:{
                        product_id:productId,
                        variant_id:variantId,
                        quantity:quantity
                    }
                }
                },{new:true})
                
            if(cartUpdated){
                return res.status(200).json({message:"Cart updated successfully!",success:true})
            }else{
                return res.status(400).json({message:"Couldn't update cart",success:false});
            }
        }
        
        
    }catch(error){
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

const productAddToCart = async(req,res)=>{
    try{
        const ID = new ObjectId(req.session.userid);
        const productId = new ObjectId(req.body.product);
        const variantIndex = Number(req.body.variant);
        const quantity = req.body.quantity;

        const variantId = (await Product.findById(productId).populate("variants"))
        .variants[variantIndex]._id;

        const alreadyIn = await Cart.findOne({user_id:ID,'items.variant_id':variantId});

        if(alreadyIn){
            res.status(409).json({message:"Item already in cart!",success:false})
        }else{
            const cartUpdated = await Cart.updateOne({user_id:ID},
                {$push:{
                    items:{
                        product_id:productId,
                        variant_id:variantId,
                        quantity:quantity
                    }
                }
                },{new:true})
                
            if(cartUpdated){
                return res.status(200).json({message:"Cart updated successfully!",success:true})
            }else{
                return res.status(400).json({message:"Couldn't update cart",success:false});
            }
        }
        
    }catch(error){
        res.status(500).send("Internal server Error!");
        console.log(error.message)
    }
}

const updateCart = async (req,res)=>{
    try{
        const body = req.body;
        const id = new ObjectId(req.body.id);
        const userid = new ObjectId(req.session.userid);
        const cartItem = await Cart.findOneAndUpdate({user_id:userid,"items.product_id":id},{$set:{'items.$.quantity':body.quantity}});
        
        if(cartItem){
            res.status(200).json({message:"Cart quantity updated successfully!",success:true})
        }else{
            res.status(200).json({message:"Cart quantity updation failed !X",success:false})
        }
    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error!")
    }
}

const cartItemDelete = async(req,res)=>{
    try{
        const itemId = req.body.itemId;
        const userid = new ObjectId(req.session.userid);
        const index = req.body.index;

        const deleted = await Cart.findOneAndUpdate({user_id:userid,"items.variant_id":itemId},{$pull:{"items":{"variant_id":itemId}}});
        const cart = await Cart.findOne({user_id:userid});
        let length0 = cart.items.length===0 ? true : false;
        
        if(deleted){
            res.status(200).json({message:"Cart Item deleted successfully!",success:true,length0})
        }else{
            res.status(200).json({message:"Cart Item deleted successfully!",success:false}) 
        }

    }catch(error){
        console.log(error.message)
        res.status(500).send("Cart Item deleted successfully!")         
    }
}

const getCheckout = async(req,res)=>{
    try{
        const cart = await Cart.findOne({user_id:req.session.userid }).populate("user_id").populate("items.variant_id").populate("items.product_id");
        const user = await User.findById(req.session.userid);
        
        res.render("user/checkout", {cart:cart,addresses:user.addresses});
    }catch(error){
        console.log(error.message)
    }
}

module.exports = {
    getCart,
    addToCart,
    productAddToCart,
    updateCart,
    cartItemDelete,
    getCheckout
};