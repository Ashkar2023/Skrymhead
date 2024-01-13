const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose")
const { ObjectId } = require("mongodb");

// models/schema
const User = require("../models/userModel")
const Cart = require("../models/cartModel")
const TempUser = require("../models/tempUserModel")
const Products = require("../models/productModel");


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
    try {
        const userData = await User.findOne({ email: Email });
        const tempUser = await TempUser.findOne({ email: Email });
        if (userData) {
            req.session.signupErrMsg = "Email is already in use!";
            res.redirect("/signup");
        } else if (tempUser) {
            req.session.Email = Email;
            let OTP = generateOTP();
            const updateComplete = await TempUser.findOneAndUpdate({ email: tempUser.email }, { $set: { otp: OTP, expireAt: Date.now() + 60 * 1000 } });
            
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
        const index = Math.floor(Math.random() * digits.length);
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
                user: "ashkarmuhammed5@gmail.com",
                pass: 'zyfa sozl zhgw znsf'
            }
        });

        const mailOptions = {
            from: "muhammedashkar2023@gmail.com",
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
        const updateComplete = await TempUser.findOneAndUpdate({ email: Email }, { $set: { otp: OTP, expireAt: Date.now() + 60 * 1000 } });
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

const verifyOTP = async (req, res) => {
    try {
        const Email = req.session.Email;
        const formData = req.body;

        const tempUser = await TempUser.findOne({ email: Email })

        if (req.body.otp === tempUser.otp) {

            const hashPassword = await securePassword(req.body.password);

            let newUser = new User({
                email: Email,
                name: formData.name,
                phone: formData.phone,
                password: hashPassword
            })

            let insertUser = await newUser.save();

            if(insertUser){
                const user = await User.findOne({email:Email}); 
                const newCart = new Cart({user_id:user._id,products:[]})
                await newCart.save();
                
                delete Email;
                let deleteTemp = await TempUser.findOneAndDelete({email:Email});
                res.redirect("/login");
            }

        } else {
            req.session.otpErrMsg = "Invalid OTP!"
            res.redirect('/verifyotp');
        }

    } catch (error) {
        console.log(error.message)
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

        const products = await Products.find({listed:true}).populate("variants");
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});
        console.log(cart)
        res.render('user/home', { products: products, cartitems: cart.items.length })
    } catch (error) {
        console.log(error.message)
    }
}

const getShop = async (req, res) => {
    try {
        const product = await Products.find({listed:true}).populate("variants")
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});

        res.render('user/shop', { products: product, cartitems: cart.items.length})
    } catch (error) {
        console.log(error.message)
    }
}

const getProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const prd = await Products.findOne({ _id: id }).populate("variants").populate("category");
        const cart = await Cart.findOne({user_id:new ObjectId(req.session.userid)});
        const specification = prd.specification.split(".");
        
        res.render("user/product", { product: prd, details: specification, cartitems: cart.items.length })
    } catch (error) {
        console.log(error.message)
        res.status(500).send("internal server error");
    }
}
const getVariant = async (req, res) => {
    try {
        const index = Number(req.params.index);
        const prd = await Products.findById({ _id:req.query.id }).populate("variants");
        const variantDetails = index ? prd.variants[index] : prd.variants[0];

        if(variantDetails){
            res.status(200).json({variantData :variantDetails,success:true,index:index})
        }else{
            res.status(400).json({message:"Can't find the product!",success:true})
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
    getShop,
    getVariant,
    getProduct,
    updateOTP,
    verifyLogin,
    getSignUp,
    insertTempUser,
    getOTP,
    verifyOTP,
    logout
}