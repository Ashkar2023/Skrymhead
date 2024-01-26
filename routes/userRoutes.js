const express = require("express")
const path = require("path")
const fs = require("fs")
const user_router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const userController = require("../controllers/userController");
const userAccountController = require("../controllers/userAccountController");
const cartController = require("../controllers/cartController");
const userOrderController = require("../controllers/userOrderController");
const auth = require("../authentication/userAuth");


//middlewares
user_router.use(bodyParser.json());
user_router.use(bodyParser.urlencoded({extended:true}));

const storage = multer.memoryStorage();
const upload = multer({storage:storage});

const imageStorage = multer.diskStorage({
    destination:function(req,file,cb){
        const folder = path.join(__dirname,`../public/users`)
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
            console.log("path created!")
        }

        cb(null,folder)
    },
    filename:function(req,file,cb){
        const name = req.session.user+path.extname(file.originalname);
        console.log(name);
        cb(null,name);
    }
})

const imageUpload = multer({storage:imageStorage})

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
user_router.post("/filterproducts",auth.userValid,auth.userIn,upload.none(),userController.getFilteredProducts);
user_router.get("/shop/product",auth.userValid,auth.userIn,userController.getProduct);
user_router.get("/product/variant/:index",auth.userValid,auth.userIn,userController.getVariant);


// cart
user_router.get("/cart",auth.userValid,auth.userIn,cartController.getCart);
user_router.put("/addtocart",auth.userValid,auth.userIn,cartController.addToCart);
user_router.put("/productaddtocart",auth.userValid,auth.userIn,cartController.productAddToCart);
user_router.patch("/updatecart",auth.userValid,auth.userIn,cartController.updateCart);
user_router.delete("/deletecartitem",auth.userValid,auth.userIn,cartController.cartItemDelete);
user_router.post("/applycoupon",auth.userValid,auth.userIn,cartController.applyCoupon);
user_router.delete("/removecoupon",auth.userValid,auth.userIn,cartController.removeCoupon);


// checkout
user_router.get("/checkout",auth.userValid,auth.userIn,cartController.getCheckout);
user_router.post("/checkoutaddaddress",auth.userValid,auth.userIn,upload.none(),cartController.checkoutAddAddress);

// order
user_router.put("/order",auth.userValid,auth.userIn,userOrderController.createOrder);
user_router.post("/create-online-order",auth.userValid,auth.userIn,userOrderController.createOrder);
user_router.post("/create-payment-intent",auth.userValid,auth.userIn,userOrderController.createPaymentIntent);
// webhook & sse
user_router.post("/webhook",express.json({raw:"application/json"}),userOrderController.listenToStripe);
user_router.get("/sseconnect",auth.userValid,auth.userIn,userOrderController.sseSetup);


//account
user_router.get("/profile",auth.userValid,auth.userIn,userAccountController.getAccountPage)
user_router.post("/updateprofile",auth.userValid,auth.userIn,userAccountController.editProfile)
user_router.post("/updatedp",auth.userValid,auth.userIn,imageUpload.single("image"),userAccountController.changeDP)

user_router.get("/password",auth.userValid,auth.userIn,userAccountController.getChangePassword)
user_router.post("/changepassword",auth.userValid,auth.userIn,userAccountController.changePassword)

user_router.get("/address",auth.userValid,auth.userIn,userAccountController.getAddress)
user_router.put("/addaddress",auth.userValid,auth.userIn,userAccountController.addAddress)
user_router.delete("/deleteaddress",auth.userValid,auth.userIn,userAccountController.deleteAddress)

user_router.get("/orders",auth.userValid,auth.userIn,userAccountController.getOrders)
user_router.get("/orderdetails/:id",auth.userValid,auth.userIn,userAccountController.orderDetails)
user_router.put("/cancelorder",auth.userValid,auth.userIn,userAccountController.cancelOrder)
user_router.put("/returnorder",auth.userValid,auth.userIn,userAccountController.returnOrder)

user_router.get("/wallet",auth.userValid,auth.userIn,userAccountController.getWalletPage)


// logout
user_router.get("/logout",auth.userValid,userController.logout);


user_router.get("/",(req,res)=>{
    res.redirect("/login");
})

module.exports = user_router;