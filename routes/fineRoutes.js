const express = require("express");
const fine_router = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const fineSystem = require("../controllers/fineSystem");

// MIDDLEWARES
fine_router.use(cookieParser());

const adminIn = (req,res,next)=>{
    if(!req.cookies.jwt) {
        res.redirect("/fine/login");
    }else{
        jwt.verify(req.cookies.jwt,process.env.JWT_SECRET_KEY,(error)=>{
            if(error){
                res.status(401).json({success:false,message: "Auth failed"});
            }else{
                next();
            }
        })
    }
}

const adminNotIn = (req,res,next)=>{
    if(req.cookies.jwt) {
        res.redirect("/fine");
    }else{
        next();
    }
}

// ROUTES
fine_router.get("/",adminIn,fineSystem.getPage);
fine_router.get("/login",adminNotIn,fineSystem.getLogin);
fine_router.post("/login",adminNotIn,fineSystem.verifyLogin);
fine_router.get("/logout",adminIn,fineSystem.logout);

fine_router.post("/getdetails",adminIn,fineSystem.getDetails);
fine_router.post("/addfive",adminIn,fineSystem.addFive);
fine_router.post("/subfive",adminIn,fineSystem.subFive);

module.exports = fine_router;