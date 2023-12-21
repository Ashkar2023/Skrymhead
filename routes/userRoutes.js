const express = require("express")
const user_router = express.Router();
const bodyParser = require("body-parser");
const userController = require("../controllers/userController");
const accountController = require("../controllers/accountController");
const cartController = require("../controllers/cartController");
const auth = require("../authentication/userAuth");

//middlewares
user_router.use(bodyParser.json());
user_router.use(bodyParser.urlencoded({extended:true}));

//Routes
user_router.get("/signup",auth.userNotIn,userController.getSignUp)
user_router.post("/signup",userController.insertTempUser)
user_router.get("/verifyotp",auth.userNotIn,userController.getOTP)
user_router.put("/updateotp",auth.userNotIn,userController.updateOTP)
user_router.post("/verifyotp",auth.userNotIn,userController.verifyOTP)

user_router.get("/login",auth.userNotIn,userController.getLogin);
user_router.post("/login",userController.verifyLogin);

user_router.get("/home",auth.userValid,auth.userIn,userController.getHome);

user_router.get("/cart",auth.userValid,auth.userIn,cartController.getCart);
user_router.put("/addtocart",auth.userValid,auth.userIn,cartController.addToCart);
user_router.put("/productaddtocart",auth.userValid,auth.userIn,cartController.productAddToCart);
user_router.put("/updatecart",auth.userValid,auth.userIn,cartController.updateCart);
user_router.delete("/deletecartitem",auth.userValid,auth.userIn,cartController.cartItemDelete);

user_router.get("/shop",auth.userValid,auth.userIn,userController.getShop);
user_router.get("/shop/product",auth.userValid,auth.userIn,userController.getProduct);
user_router.get("/product/variant/:index",auth.userValid,auth.userIn,userController.getVariant);

//accountController
user_router.get("/profile",auth.userValid,auth.userIn,accountController.getAccountPage)
user_router.get("/password",auth.userValid,auth.userIn,accountController.getChangePassword)

user_router.get("/address",auth.userValid,auth.userIn,accountController.getAddress)
user_router.put("/addaddress",auth.userValid,auth.userIn,accountController.addAddress)
user_router.get("/orders",auth.userValid,auth.userIn,accountController.getOrders)

user_router.get("/logout",auth.userValid,userController.logout);

user_router.get("/",(req,res)=>{
    res.redirect("/login");
})



module.exports = user_router;