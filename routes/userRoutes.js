const express = require("express")
const user_router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const userController = require("../controllers/userController");
const accountController = require("../controllers/accountController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const auth = require("../authentication/userAuth");

//middlewares
user_router.use(bodyParser.json());
user_router.use(bodyParser.urlencoded({extended:true}));

const storage = multer.memoryStorage();
const upload = multer({storage:storage});

// -------------------------Routes--------------------------------

// Signup
user_router.get("/signup",auth.userNotIn,userController.getSignUp)
user_router.post("/signup",userController.insertTempUser)
user_router.get("/verifyotp",auth.userNotIn,userController.getOTP)
user_router.post("/verifyotp",auth.userNotIn,userController.verifyOTP)
user_router.put("/updateotp",auth.userNotIn,userController.updateOTP)

// login
user_router.get("/login",auth.userNotIn,userController.getLogin);
user_router.post("/login",userController.verifyLogin);

// User Pages
user_router.get("/home",auth.userValid,auth.userIn,userController.getHome);
user_router.get("/shop",auth.userValid,auth.userIn,userController.getShop);
user_router.get("/shop/product",auth.userValid,auth.userIn,userController.getProduct);
user_router.get("/product/variant/:index",auth.userValid,auth.userIn,userController.getVariant);


// cart
user_router.get("/cart",auth.userValid,auth.userIn,cartController.getCart);
user_router.put("/addtocart",auth.userValid,auth.userIn,cartController.addToCart);
user_router.put("/productaddtocart",auth.userValid,auth.userIn,cartController.productAddToCart);
user_router.patch("/updatecart",auth.userValid,auth.userIn,cartController.updateCart);
user_router.delete("/deletecartitem",auth.userValid,auth.userIn,cartController.cartItemDelete);
user_router.get("/checkout",auth.userValid,auth.userIn,cartController.getCheckout);
user_router.post("/checkoutaddaddress",auth.userValid,auth.userIn,upload.none(),cartController.checkoutAddAddress);

// order
user_router.put("/order",auth.userValid,auth.userIn,orderController.createOrder);


//account
user_router.get("/profile",auth.userValid,auth.userIn,accountController.getAccountPage)
user_router.post("/updateprofile",auth.userValid,auth.userIn,accountController.editProfile)

user_router.get("/password",auth.userValid,auth.userIn,accountController.getChangePassword)
user_router.post("/changepassword",auth.userValid,auth.userIn,accountController.changePassword)

user_router.get("/address",auth.userValid,auth.userIn,accountController.getAddress)
user_router.put("/addaddress",auth.userValid,auth.userIn,accountController.addAddress)
user_router.delete("/deleteaddress",auth.userValid,auth.userIn,accountController.deleteAddress)

user_router.get("/orders",auth.userValid,auth.userIn,accountController.getOrders)
user_router.get("/orderdetails/:id",auth.userValid,auth.userIn,accountController.orderDetails)
user_router.put("/cancelorder",auth.userValid,auth.userIn,accountController.cancelOrder)

// logout
user_router.get("/logout",auth.userValid,userController.logout);


user_router.get("/",(req,res)=>{
    res.redirect("/login");
})

module.exports = user_router;