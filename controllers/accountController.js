const User = require("../models/userModel");
const Address = require("../models/addressModel");
const accountController = {};

accountController.getAccountPage = async(req,res)=>{
    try{
        const user = req.session.user;
        const userData = await User.findOne({email:user});
        res.render("user/account",{userData:userData});
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
        const address = req.body;
        const userEmail = req.session.user;
        const user = await User.findOne({email:userEmail});
        
        if(user){

            const newAddress = {
                address_name: req.body.name,
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
            
            if(userData){
                res.status(200).json({success:true,user:userData})
            }else{
                res.status(500).json({success:false,message:"failed to save user data"})
            }
            
        }else{
            res.status(404).json({success:false,message:"User not found"})
        }
        
    }catch(error){
        console.log(error.message)
        res.status(500).json({success:false,message:"Internal server error"})
    }
}

accountController.getOrders = async(req,res)=>{
    try{
        res.render("user/orders");
    }catch(error){
        console.log(error.message)
    }
}


module.exports = accountController ;