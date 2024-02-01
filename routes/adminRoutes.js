const express = require("express")
const fs = require("fs");
const admin_router = express.Router();
const path = require("path")
const bodyParser = require("body-parser");
const multer = require("multer");

const adminAuth = require("../authentication/adminAuth");
const adminController = require("../controllers/adminController");
const adminCategoryController = require("../controllers/adminCategoryController");
const adminProductController = require("../controllers/adminProductController");
const adminOrderController = require("../controllers/adminOrderController");
const adminCouponController = require("../controllers/adminCouponController");
const adminBannerController = require("../controllers/adminBannerController");

//middlewares
admin_router.use(express.json());
admin_router.use(bodyParser.urlencoded({extended:true}));

//multer
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        const folder = path.join(__dirname,`../public/products/${req.body.brand+" "+req.body.model}`)
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
            console.log("path created!")
        }else{
            console.log("path already exists!")
        }
        cb(null,folder)
    },
    filename:function(req,file,cb){
        const date = new Date();
        const day = String(date.getDate()).padStart(2,"0");
        const month = String(date.getMonth()+1).padStart(2,"0");
        const year = String(date.getFullYear())
        const name = `${day+"-"+month+"-"+year}`+"-"+file.originalname;
        cb(null,name);
    }
})

const uploads = multer({storage:storage});

const storage2 = multer.diskStorage({
    destination:function(req,file,cb){
        const folder = path.join(__dirname,`../public/products/${req.product.brand} ${req.product.model}`);
        if(!fs.existsSync(folder)){
            fs.mkdirSync(folder);
            console.log("path created!")
        }

        cb(null,folder)
    },
    filename:function(req,file,cb){
        const date = new Date();
        const day = String(date.getDate()).padStart(2,"0");
        const month = String(date.getMonth()+1).padStart(2,"0");
        const year = String(date.getFullYear())

        const name = (file.originalname.slice(0,5) === "sharp" || file.originalname.slice(0,5) === "cropp" )? `cropp${day+"-"+month+"-"+year}`+"-"+file.originalname.slice(16) : `${day+"-"+month+"-"+year}`+"-"+file.originalname ;
        req.body.pname = name;
        cb(null,name);
    }
})

const uploads2 = multer({storage:storage2});

const formStorage = multer.memoryStorage();
const formUploads = multer({storage:formStorage});

const bannerStorage = multer.diskStorage({
    destination:function(req,file,cb){
        const folder = path.join(__dirname,"../public/images");
        cb(null,folder)
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    }
})

const bannerUploads = multer({storage:bannerStorage});

// Basic ROUTES
admin_router.get('/login',adminAuth.adminNotIn,adminController.getLogin);
admin_router.post('/login',adminController.verifyLogin);
admin_router.post('/salesreport',adminAuth.adminIn,adminController.salesReport);
admin_router.get("/dashboard",adminAuth.adminIn,adminController.getDashboard);
admin_router.get("/logout",adminAuth.adminIn,adminController.logout)

// coupon ROUTES
admin_router.get("/coupons",adminAuth.adminIn,adminCouponController.getCoupons);
admin_router.post("/coupons/add",adminAuth.adminIn,formUploads.none(),adminCouponController.addCoupon);
admin_router.put("/coupons/status/:id",adminAuth.adminIn,adminCouponController.changeCouponStatus);


// user ROUTES 
admin_router.get("/users",adminAuth.adminIn,adminController.getUsers);
admin_router.get("/users/block",adminAuth.adminIn,adminController.userBlock);
admin_router.get("/users/unblock",adminAuth.adminIn,adminController.userUnblock);

// product ROUTES
admin_router.get("/products",adminAuth.adminIn,adminProductController.getProducts);
admin_router.put("/editproduct/lou",adminAuth.adminIn,adminProductController.listOrUnlistProducts);
admin_router.get("/addproduct",adminAuth.adminIn,adminProductController.getAddProduct);
admin_router.post("/addproduct",adminAuth.adminIn,uploads.array("images",7),adminProductController.addProduct);
admin_router.get("/editproduct",adminAuth.adminIn,adminProductController.getEditProduct);
admin_router.put("/editproduct",adminAuth.adminIn,formUploads.none(),adminProductController.editProduct);
admin_router.post("/editproduct/addvariant",adminAuth.adminIn,uploads.none(),adminProductController.addVariant);
admin_router.put("/updatevariants",adminAuth.adminIn,adminProductController.updateVariants);
admin_router.put("/addprodoff",adminAuth.adminIn,adminProductController.addOffer);
admin_router.delete("/remprodoff",adminAuth.adminIn,adminProductController.removeOffer);
admin_router.delete("/editproduct/deleteimg/:imgurl",adminAuth.adminIn,adminProductController.deleteImage);
admin_router.post("/editproduct/addimages",adminAuth.adminIn,adminProductController.setProduct,uploads2.array("images",7),adminProductController.addImages);
admin_router.post("/cropimages",adminAuth.adminIn,adminProductController.setProduct,uploads2.single("image"),adminProductController.cropImages);

// category ROUTES
admin_router.get("/category",adminAuth.adminIn,adminCategoryController.getCategories);
admin_router.get("/addcategory",adminAuth.adminIn,adminCategoryController.addCategory);
admin_router.post("/addcategory",adminAuth.adminIn,adminCategoryController.addToCategories);
admin_router.put("/category/toggle/:id",adminAuth.adminIn,adminCategoryController.toggleCategory);
admin_router.get("/editcategory",adminAuth.adminIn,adminCategoryController.getEditCategory);
admin_router.post("/editcategory",adminAuth.adminIn,adminCategoryController.postEditCategory);
admin_router.delete("/remcatoff",adminAuth.adminIn,adminCategoryController.removeCategoryOffer);

// Orders ROUTES
admin_router.get("/orders",adminAuth.adminIn,adminOrderController.getOrders);
admin_router.get("/orderdetails/:id",adminAuth.adminIn,adminOrderController.orderDetails);
admin_router.put("/cancelorder",adminAuth.adminIn,adminOrderController.cancelOrder);
admin_router.put("/markasdelivered",adminAuth.adminIn,adminOrderController.markAsDelivered);

// Banner ROUTES
admin_router.get("/banner",adminAuth.adminIn,adminBannerController.getBanner)
admin_router.post("/banner/addimages",adminAuth.adminIn,bannerUploads.array("images",5),adminBannerController.addImages)
admin_router.post("/banner/deleteimage",adminAuth.adminIn,adminBannerController.deleteImage)
admin_router.post("/banner/updateurl",adminAuth.adminIn,adminBannerController.updateUrl)



module.exports = admin_router;