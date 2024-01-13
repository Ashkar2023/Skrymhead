const express = require("express")
const fs = require("fs");
const admin_router = express.Router();
const path = require("path")
const bodyParser = require("body-parser");
const adminController = require("../controllers/adminController");
const adminAuth = require("../authentication/adminAuth");
const multer = require("multer")

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
        console.log(name)
        cb(null,name);
    }
})

const uploads2 = multer({storage:storage2});

const formStorage = multer.memoryStorage();
const formUploads = multer({storage:formStorage});

//routes
admin_router.get('/login',adminAuth.adminNotIn,adminController.getLogin);
admin_router.post('/login',adminController.verifyLogin);

admin_router.get("/dashboard",adminAuth.adminIn,adminController.getDashboard);
admin_router.get("/products",adminAuth.adminIn,adminController.getProducts);
admin_router.put("/editproduct/lou",adminAuth.adminIn,adminController.LOUproducts);

admin_router.get("/addproduct",adminAuth.adminIn,adminController.getAddProduct);
admin_router.post("/addproduct",adminAuth.adminIn,uploads.array("images",7),adminController.addProduct);


admin_router.get("/editproduct",adminAuth.adminIn,adminController.getEditProduct);
admin_router.put("/editproduct",adminAuth.adminIn,formUploads.none(),adminController.editProduct);
admin_router.post("/editproduct/addvariant",adminAuth.adminIn,uploads.none(),adminController.addVariant);
admin_router.put("/updatevariants",adminAuth.adminIn,adminController.updateVariants);
admin_router.delete("/editproduct/deleteimg/:imgurl",adminAuth.adminIn,adminController.deleteImage);
admin_router.post("/editproduct/addimages",adminAuth.adminIn,adminController.setProduct,uploads2.array("images",7),adminController.addImages);

admin_router.get("/category",adminAuth.adminIn,adminController.getCategories);
admin_router.get("/addcategory",adminAuth.adminIn,adminController.addCategory);
admin_router.post("/addcategory",adminAuth.adminIn,adminController.addToCategories);

admin_router.put("/category/toggle/:id",adminAuth.adminIn,adminController.toggleCategory);
admin_router.get("/editcategory",adminAuth.adminIn,adminController.getEditCategory);
admin_router.post("/editcategory",adminAuth.adminIn,adminController.postEditCategory);

admin_router.get("/orders",adminAuth.adminIn,adminController.getOrders);
admin_router.get("/orderdetails/:id",adminAuth.adminIn,adminController.orderDetails);
admin_router.put("/cancelorder",adminAuth.adminIn,adminController.cancelOrder);
admin_router.put("/markasdelivered",adminAuth.adminIn,adminController.markAsDelivered);

admin_router.get("/users",adminAuth.adminIn,adminController.getUsers);
admin_router.get("/users/block",adminAuth.adminIn,adminController.userBlock);
admin_router.get("/users/unblock",adminAuth.adminIn,adminController.userUnblock);

admin_router.get("/logout",adminAuth.adminIn,adminController.logout)

module.exports = admin_router;