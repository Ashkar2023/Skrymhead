const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

// models/schema
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const TempUser = require("../models/tempUserModel");
const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const Wallet = require("../models/walletModel");
const Banner = require("../models/bannerModel");

//modules
const {sort} = require("../config/enums");


//Controllers
const getSignUp = async (req, res) => {
    try {
        delete req.session.otpErrMsg;
        delete req.session.userErrMsg;
        res.render("user/signup", { error: req.session.signupErrMsg });
        delete req.session.signupErrMsg;
    } catch (error) {
        console.log(error.message)
    }
}

const securePassword = async (password) => {
    try {
        const hashedPassowrd = await bcrypt.hash(password, 10);
        return hashedPassowrd;
    } catch (error) {
        console.log(error.message)
    }
}

const insertTempUser = async (req, res) => {
    const Email = req.body.email;
    const referral = req.body.referral || null;
    try {
        const userData = await User.findOne({ email: Email });
        const tempUser = await TempUser.findOne({ email: Email });
        if (userData) {
            req.session.signupErrMsg = "Email is already in use!";
            res.redirect("/signup");
        } else if (tempUser) {
            req.session.Email = Email;
            let OTP = generateOTP();
            const updateComplete = await TempUser.findOneAndUpdate({ email: tempUser.email }, { $set: { otp: OTP, expireAt: Date.now() + 90 * 1000 } });
            
            if(updateComplete){
                sendVerifyMail(Email, Email, OTP);
                res.redirect("/verifyotp");
            }
        } else {
            req.session.Email = Email;
            let OTP = generateOTP();
            let date = Date.now() + 90 * 1000;

            let newTempUser = new TempUser({
                email: Email,
                otp: OTP,
                referred_by:referral,
                expireAt: date
            })
            const insertComplete = await newTempUser.save();

            if (insertComplete) {
                sendVerifyMail(Email, Email, OTP);
                res.redirect("/verifyotp");
            }
        }

    } catch (error) {
        console.log(error.message)
    }
}

function generateOTP() {
    let otp = '';
    i = 1;
    let digits = "0123456789"

    while (i <= 4) {
        const index = crypto.randomInt(9)
        otp += digits[index];
        i++;
    }
    console.log(otp);
    return otp
}

const sendVerifyMail = async (name, email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_AUTH_EMAIL,
                pass: process.env.NODEMAILER_AUTH_PWD
            }
        });

        const mailOptions = {
            from: process.env.NODEMAILER_AUTH_EMAIL,
            to: email,
            subject: 'Mail verification',
            text: `Hi ${name}, your account verification OTP is ${otp}. Thank you for being a part of our creation.`
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("Error in sendMail : ", error);
            } else {
                console.log('Email has been sent -', info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

const updateOTP = async (req, res) => {
    try {
        const Email = req.session.Email;
        const OTP = generateOTP();
        const updateComplete = await TempUser.findOneAndUpdate({ email: Email }, { $set: { otp: OTP, expireAt: Date.now() + 60 * 1000, deleteOn: Date.now() } });
        if(updateComplete){
            console.log("otp updated")
            sendVerifyMail(Email, Email, OTP);
            res.status(200).json({message:"OTP updated successfully!"});
        }else{
            res.status(400).json({message:"OTP updation failed!"});
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal server Error!" })
    }
}

function generateRefferral(Email,name){
    let hash = crypto.createHash("sha256");
    let string = Email+name;
    hash.update(string);
    const code = hash.digest("hex").slice(0,10).toUpperCase();

    console.log(code)
    return code;
}

const verifyOTP = async (req, res) => {
    try {
        const Email = req.session.Email;
        const formData = req.body;
        const tempUser = await TempUser.findOne({ email: Email })

        if (formData.otp === tempUser.otp) {

            const hashPassword = await securePassword(req.body.password);

            let newUser = new User({
                email: Email,
                name: formData.name,
                phone: formData.phone,
                password: hashPassword,
                referral_code:generateRefferral(Email,formData.name)
            })

            let insertUser = await newUser.save();

            if(insertUser){
                const user = await User.findOne({email:Email}); 
                const newCart = new Cart({user_id:user._id,products:[]})
                await newCart.save();
                const wallet = new Wallet({user_id:user._id,balance:0, transactions:[]})
                await wallet.save();
                
                delete Email;
                let deleteTemp = await TempUser.findOneAndDelete({email:Email});
                res.redirect("/login");
            }

            if(tempUser.referred_by){
                const referrer = await User.findOne({referral_code:tempUser.referred_by});
                
                if(referrer){
                    const udpateWallet = await Wallet.findOneAndUpdate({user_id:new ObjectId(referrer._id)},{$inc:{balance:500},$push:{transactions:{type:"credit",amount:500,order_id:null}}});
                    console.log(udpateWallet)
                }
            }

        } else {
            req.session.otpErrMsg = "Invalid OTP!"
            res.redirect('/verifyotp');
        }

    } catch (error) {
        console.log(error.message)
        console.log(error.stack)
    }
}


const verifyLogin = async (req, res) => {
    try {
        const Email = req.body.email;
        const Password = req.body.password;

        const userData = await User.findOne({ email: Email })

        if (userData) {
            let passwordMatch = await bcrypt.compare(Password, userData.password)

            if (passwordMatch && !userData.isBlocked) {
                if (userData.isVerified === false) {
                    console.log(userData.isVerified)
                    res.redirect("/verifyotp");

                } else {
                    req.session.user = userData.email;
                    req.session.userid = userData._id;
                    res.redirect("/home");
                }
            } else if (passwordMatch && userData.isBlocked) {
                req.session.userErrMsg = "user blocked";
                res.redirect("/login")
            } else {
                req.session.userErrMsg = "user credentials wrong";
                res.redirect("/login")
            }

        } else {
            req.session.userErrMsg = "user not found";
            res.redirect("/login")
        }



    } catch (error) {
        console.log(error.message)
    }
}


const getLogin = async (req, res) => {
    try {
        res.render("user/login", { error: req.session.userErrMsg });
        delete req.session.userErrMsg;
        delete req.session.otpErrMsg;
        delete req.session.Email;
    } catch (error) {
        console.log(error.message)
    }
}

const getOTP = async (req, res) => {
    try {
        res.render("user/otpverify", { otpError: req.session.otpErrMsg });
        delete req.session.otpErrMsg;
    } catch (error) {
        console.log(error.message)
    }
}

const getHome = async (req, res) => {
    try {
        delete req.session.Email; //Used to store the email for signup

        const products = await Products.find({listed:true}).populate("variants").limit(4);
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});
        const banner = await Banner.findOne({name:"home"});

        res.render('user/home', { products: products, cartitems: cart.items.length, banner: banner })
    } catch (error) {
        console.log(error.message)
    }
}


const search = async(req,res)=>{
    try{
        const search = req.body.search;
        const found = await Products.find({ $or: [ {"brand": { $regex : search, $options :"i" } }, {"model": {$regex : search, $options :"i" } } ] })
                        .select(["brand", "model","category"])
                        .populate("category")
                        .sort([["brand","asc"],["model","asc"]])

        if(found){
            res.status(200);
            res.json({message : "search successfull!", success : true, products : found});
        }else{
            res.status(400).json({message:"couldn't search products", success:true});
        }
        
    }catch(error){
        res.status(500).send("Internal server error!");
        console.log(error.message)
    }
}

const getShop = async (req, res) => {
    try {
        const product = await Products.find({listed:true}).populate("variants").populate("category")
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});
        const categories = await Category.find()

        res.render('user/shop', { products: product, cartitems: cart.items.length, categories : categories})
    } catch (error) {
        console.log(error.message)
    }
}

const getProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const prd = await Products.findOne({ _id: id,listed:true})
                    .populate("variants")
                    .populate("category")
                    .populate({ path: 'reviews.user_id',select:"name image_url"})
                    
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});
        const specification = prd.specification.split(".");

        res.render("user/product", { product: prd, details: specification, cartitems: cart.items.length })
    } catch (error) {
        console.log(error.message)
    }
}

const getFilteredProducts = async(req,res)=>{
    try{
        let priceRanges, categoryFilter ;
        
        const filterPrice = req.body.price;
        const category = req.body.category;
        const sortOption = sort[req.body.sort];

        const categoryArray = category instanceof Array ? category : category==="none" ? ["none"] : [category] ;
        const priceArray = filterPrice === "all" ? null : filterPrice ; 
        
        if(priceArray instanceof Array && priceArray.length !== 1 ){
            priceRanges = priceArray.map((price)=>{
                let temp = price.split("-");
                let [ lower,upper ] = temp.map(Number);
                return {$and:[{$gte:["$$variant.price",lower]}, {$lte:["$$variant.price",upper]}]};
            })
        }else if(filterPrice==="all"){
            priceRanges = {$gte:["$$variant.price",0]};
        }else{
            let temp = filterPrice.split("-");
            let [lower,upper]= temp.map(Number);
            priceRanges = [ {$and:[{$gte:["$$variant.price",lower]}, {$lte:["$$variant.price",upper]}]} ]
        }

        if(categoryArray.includes("none")){
            categoryFilter = {"category.category" :{ $ne : "none" } };
        }else{
            categoryFilter = {"category.category" :{ $in : categoryArray } };
        }

        const PRODUCTS = await Products.aggregate([
            {
                $match:{
                    listed:true
                }
            },
            {
                $lookup: {
                    from: "variants",
                    foreignField: "_id",
                    localField: "variants",
                    as: "variants"
                }
            },
            {
                $lookup: {
                    from: "categories",
                    foreignField: "_id",
                    localField: "category",
                    as: "category"
                }
            },
            {
                $addFields:{
                    "variants":{
                        $filter:{
                            input:"$variants",
                            as:"variant",
                            cond:{
                                $or:priceRanges
                            }
                        }
                    },
                    "category":{
                       $arrayElemAt:["$category",0]
                    }
                }
            },
            {
                $match: {
                    $and: [
                        {
                            variants: {
                                $not: {
                                    $size: 0
                                }
                            }
                        },
                        categoryFilter
                    ]
                }
            },
            {
                $unwind:"$variants"
            },
            {
                $sort:sortOption
            }
        ]);

        
        if(PRODUCTS){
            res.status(200).json({message:"Filtered products successfully",success:true, products: PRODUCTS,});
        }else{
            res.status(400).json({message:"Couldn't find the products",success:false}); 
        }
    }catch(error){
        console.log(error.message)
        res.status(500).send("Internal server error");
    }
}

const getVariant = async (req, res) => {
    try {
        const index = Number(req.params.index);
        const prd = await Products.findById({ _id:req.query.id }).populate("variants").populate("category");
        const variantDetails = index ? prd.variants[index] : prd.variants[0];

        if(variantDetails){
            res.status(200).json({variantData :variantDetails,success:true,index:index})
        }else{
            res.status(400).json({message:"Can't find the product!",success:false})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error");
    }
}

const addReview = async(req,res)=>{
    try{
        const added = await Products.findByIdAndUpdate(req.body.productId,
            {$push :{ reviews: 
                {
                    user_id:req.session.userid,
                    message:req.body.review,
                    rating:Number(req.body.star)
                } 
            }})

        if(added){
            res.status(200).json({success:true,message:"Review added successfully!"})
        }else{
            res.status(400).json({success:false,message:"Can't find the product!"})
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error");
    }
}

const logout = async (req, res) => {
    try {
        delete req.session.user;
        delete req.session.id;
        res.redirect("/login");
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    getLogin,
    getHome,
    search,
    getShop,
    getVariant,
    getProduct,
    getFilteredProducts,
    updateOTP,
    verifyLogin,
    getSignUp,
    insertTempUser,
    getOTP,
    verifyOTP,
    addReview,
    logout
}