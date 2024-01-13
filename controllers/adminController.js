const sharp = require("sharp")
const fs = require("fs")
const mongoose = require("mongoose");
const admin = require("../models/adminModel")
const path = require("path")
const User = require("../models/userModel")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const Variant = require("../models/variantModel")
const Order = require("../models/orderModel")
const {payment , order:orderStatus} = require("../config/enums");
const { ObjectId } = require("mongodb");

const getLogin = (req, res) => {
    try {
        error = req.session.adminErrMsg;
        res.render("admin/adminLogin", { alert: error });
        delete error;
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await admin.findOne({ admin_id: email })

    if (adminData) {
        if (adminData.password === password) {
            req.session.admin = email;
            res.redirect("/admin/dashboard");
            return;
        } else {
            req.session.adminErrMsg = "password incorrect";
            res.redirect("/admin/login");
            return;
        }
    } else {
        req.session.adminErrMsg = "not authorized";
        console.log('no')
        res.redirect("/admin/login");
        return;
    }

}

const getDashboard = async (req, res) => {
    try {
        res.render("admin/dashboard");
    } catch (error) {
        console.log(error.message)
    }
}


const getProducts = async (req, res) => {
    try {
        delete req.session.productId;
        const Products = await Product.find({}).populate("variants").populate("category");
        res.render("admin/products", { products: Products })
    } catch (error) {
        console.log(error.message)
    }
}

const LOUproducts = async(req,res)=>{
    try{
        const BOOL = JSON.parse(req.body.bool)
        const product = await Product.findOne({_id:new ObjectId(req.body.id)});
        product.listed = !BOOL;
        const saveProduct = await product.save();

        if(saveProduct){
            res.status(200).json({message:`Product ${ product.listed?"Listed":"Unlisted" } successfully`,success:true,listed:!BOOL});
        }else{
            res.status(400).json();
        }
    }catch(error){
        console.log(error.message)
        res.status(400).send("Internal server error");
    }
}

const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({listed:true})
        res.render("admin/addproduct", { categories: categories })
    } catch (error) {
        console.log(error.message)
    }
}



const processImages = async (images, destination) => {
    const processedImages = [];
    const imagesToDelete = [];
    for (const image of images) {
        const imagePath = path.join(destination, image.filename);
        imagesToDelete.push(imagePath);
        const imageOutPath = path.join(destination, "sharp" + image.filename);

        try {
            await sharp(imagePath)
                .resize({ width: 800, height: 800, fit: sharp.fit.cover }) // Adjust the dimensions as needed
                .toFile(imageOutPath);

            processedImages.push(imageOutPath);

        } catch (error) {
            console.error("Error in processing image with sharp")
        }

    }

    return {
        first: processedImages,
        second: imagesToDelete
    }
}

const addProduct = async (req, res) => {
    try {
        const destination = path.join(__dirname, `../public/products/${req.body.brand} ${req.body.model}`)
        const object = await processImages(req.files, destination);

        const processedImages = object.first;
        const imagesToDelete = object.second;

        imagesToDelete.forEach(image => {
            try {
                fs.unlinkSync(image);
            } catch (error) {
                console.error("Error deleting file : " + error.message)
            }
        })

        const variantArray = [];
        for (let i = 1; i <= req.body.variant; i++) {
            variantArray.push({
                color: req.body["color" + i],
                stock: req.body["stock" + i],
                price: req.body["price" + i]
            })
        }

        const brand = req.body.brand.trim().toUpperCase();
        const model = req.body.model.trim().slice(0,1).toUpperCase()+req.body.model.slice(1).toLowerCase()
        const product = new Product({
            brand: brand,
            model: model,
            category: new ObjectId(req.body.category),
            specification: req.body.specification,
            images: processedImages.map(image => ({ url: path.basename(image) }))
        })
        const productData = await product.save();
        
        let i=1;
        variantArray.forEach(async variant=>{

            const variantAdd = new Variant({
                product_id:productData._id,
                v_name:`V${i++}`,
                color:variant.color,
                stock:variant.stock,
                price:variant.price
            })

            const variantsaved = await variantAdd.save();
            const variantPush = await Product.updateOne({_id:productData._id},
                {$push:{variants:variantsaved._id}});
        })

        res.redirect("/admin/products?success=true");
    } catch (error) {
        console.log(error.message)
    }
}

const getEditProduct = async (req, res) => {
    try {
        req.session.productId = req.query.id;
        const productData = await Product.findOne({ _id: req.query.id }).populate("variants");
        const categoriesData = await Category.find({listed:true});
        res.render("admin/editProduct", { product: productData, categories: categoriesData });
    } catch (error) {
        console.log(error.message)
    }
}

const editProduct = async (req, res) => {
    try {
        const body = req.body;
        const {brand :oldBrand, model:oldModel }  = await Product.findOne({_id:req.session.productId});
        const parentFolder = "C:/Users/hp/Documents/Brototype/Skrymhead";
        const oldPath = path.join(parentFolder, 'public', 'products', oldBrand+" "+oldModel);
        const newPath = path.join(parentFolder, 'public', 'products', body.brand+" "+body.model);
        
        const productData = await Product.findOneAndUpdate({ _id: req.session.productId },{$set:{
            brand:body.brand,
            model:body.model,
            category:body.category,
            specification:body.specification
        }},{new:true});

        if(productData){
            console.log(oldPath,newPath)
            fs.rename(oldPath,newPath,(err)=>{
                err? console.log("failed renaming") :console.log("successfully renamed");
            })
            res.status(200).json({message:"Details updated successfully",success:true})
        }else{
            res.status(200).json({message:"Couldn't find/update the product!",success:false})
        }
    } catch (error) {
        res.status(500).send("Internal server error!")
        console.log(error.message)
    }
}

const updateProductDetails = async (req, res) => {
    try {
    } catch (error) {
        console.log(error.message)
    }
}

const addVariant = async(req,res)=>{
    try{
        const product = new ObjectId(req.session.productId);        
        const LV = await Variant.aggregate([
            {$match:{product_id:product}},
            {$project:{v_name:1,_id:0}}
        ])
        const vArray = LV.map(el=>parseInt(el.v_name.slice(1)));
        const largest = Math.max(...vArray);
        
        const newVariant = new Variant({
            product_id:product,
            v_name:`V${largest+1}`,
            color:req.body.newcolor,
            stock:req.body.newstock,
            price:req.body.newprice
        })
        const added = await newVariant.save();
        
        const prdAdded = await Product.findOneAndUpdate({_id:product},{$push:{variants:added._id}},{new:true})
        if(added && prdAdded){
            res.status(200).json({message:"Variant added successfully",success:true})
        }else{
            res.status(400).json();
        }

    }catch(error){
        res.status(500).json("Internal server error")
        console.log(error.message)
    }
}

const updateVariants = async (req, res) => {
    const session = await mongoose.startSession()
    try {
        session.startTransaction();
        const changedVariants = JSON.parse(req.body.changedVariants);
        const product = await Product.findById(req.session.productId); 
        const allChanged = [];

        for(const variant of changedVariants){
            let color = "color" + variant,
                stock = "stock" + variant,
                price = "price" + variant;
            
            const changed = await Variant.findOneAndUpdate({ product_id: product._id, v_name: variant },
                {
                    $set:
                    {
                        color: req.body[color],
                        price: req.body[price]
                    },
                    $inc:
                        { stock: req.body[stock] || 0 }
                },
                {new:true}
            )
            allChanged.push(changed) 
            console.log(changed);
        }

        if(allChanged.length===changedVariants.length && !allChanged.some(el=>el===null)){
            session.commitTransaction();
            res.status(200).json({message:"All updates were successful",success:true})
            console.log("update successfull")
        }else{
            session.abortTransaction();
            res.status(400).json();
        }
        
    } catch (error) {
        session.abortTransaction();
        res.status(500).send("Internal server error!");
    }finally{
        session.endSession();
    }
}

const deleteImage = async(req,res)=>{
    try{
        const imageURL = req.params.imgurl;
        const productId = new ObjectId(req.session.productId);
        const product = await Product.findById(productId);

        if(product.images.length===1){
            res.status(400).json({success:false,message:"At least 1 image must remain!"})
            return;
        }

        const deleted = await Product.findOneAndUpdate({_id:productId},{$pull:{images:{url:imageURL}}},{new:true});
        const imageToDelete = path.join(__dirname, `../public/products/${deleted.brand} ${deleted.model}/${imageURL}`)
    
        if(deleted){
            fs.unlinkSync(imageToDelete)
            res.status(200).json({success:true,message:"Image removed successfully!"})
        }else{
            res.status(400).json({success:false,message:"Couldn't find the product/image!"})
        }
    }catch(error){
        res.status(500).send("Internal server error!")
        console.log(error.message)
    }
}

const processImages2 = async (images, destination) => {
    console.log("b")
    const processedImages = [];
    const imagesToDelete = [];
    
    for (const image of images) {
        const imagePath = path.join(destination, image.filename);
        imagesToDelete.push(imagePath);
        const imageOutPath = path.join(destination, "sharp" + image.filename);
        
        try {
            await sharp(imagePath)
            .resize({ width: 800, height: 800, fit: sharp.fit.cover }) // Adjust the dimensions as needed
            .toFile(imageOutPath);
            
            processedImages.push(imageOutPath);
            
        } catch (error) {
            console.error("Error in processing image with sharp")
        }

    }

    return {
        first: processedImages,
        second: imagesToDelete
    }
}
const setProduct = async(req,res,next)=>{
    try{
        console.log("INNNN")
        const product = await Product.findById(new ObjectId(req.session.productId));
        req.product = product;
        next();
    }catch(error){
        console.log(error.message)
    }
}

const addImages = async(req,res)=>{
    try{
        console.log("1");
        const productId = new ObjectId(req.session.productId)
        const product = await Product.findById(productId);
        const destination = path.join(__dirname, `../public/products/${product.brand} ${product.model}`)

        const object = await processImages2(req.files, destination);
        
        const processedImages = object.first.map(image=>({ url:path.basename(image)}));
        const imagesToDelete = object.second;
        console.log(processedImages)
        imagesToDelete.forEach(image => {
            try {
                fs.unlinkSync(image);
            } catch (error) {
                console.error("Error deleting file : " + error.message)
            }
        })
        
        product.images =  product.images.concat(processedImages);
        const saved = await product.save();
        
        if(saved){
            res.status(200).json({success:true,message:"Successfully added the images."})
        }else{
            res.status(400).json({success:false,message:"Adding images failed!"})
        }
    }catch(error){
        console.log(error.message)
        res.status(500).send("internal server error!")
    }
} 

const getCategories = async (req, res) => {
    try {
        const Categories = await Category.find({});
        res.render("admin/category", { categories: Categories });
    } catch (error) {
        console.log(error.message)
    }
}

const addCategory = (req, res) => {
    try {
        res.render("admin/addCategory");
    } catch (error) {
        console.log(error.message)
    }
}

const addToCategories = async (req, res) => {
    try {
        const newCategory = req.body.category;
        const catEdited = newCategory.charAt(0).toUpperCase() + newCategory.slice(1).replace(/\s+/g, '-');
        const regexx = new RegExp(catEdited, "i");
        const isFound = await Category.findOne({ category: { $regex: regexx } })

        if (isFound) {
            req.session.categoryMsg = "Category already found!";
            console.log("isfound")
            res.redirect("/admin/category");
        } else {
            const newCat = new Category({
                category: catEdited
            })
            console.log("cat in")
            const catData = await newCat.save()
            req.session.categoryMsg = "New Category Saved";
            res.redirect("/admin/category");
        }

    } catch (error) {
        console.log(error.message)
    }
}


const toggleCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.listed = !category.listed;
        await category.save();

        res.status(200).json({ success: true, category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const postEditCategory = async (req, res) => {
    try {
        const categoryId = req.session.newid;
        const newCategory = req.body.category;
        const catEdited = newCategory.charAt(0).toUpperCase() + newCategory.slice(1).replace(/\s+/g, '-');
        const regexx = new RegExp(catEdited, "i");

        // Check if the new category already exists
        const isFound = await Category.findOne({ category: { $regex: regexx } });

        if (isFound) {
            req.session.categoryMsg = "Category already found!";
            res.redirect("/admin/category");
        } else {
            // Update the category
            const updatedCategory = await Category.findByIdAndUpdate(categoryId, { category: catEdited }, { new: true });

            if (updatedCategory) {
                req.session.categoryMsg = "Category updated!";
                res.redirect("/admin/category");
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};


const getEditCategory = async (req, res) => {
    try {
        req.session.newid = req.query.id;
        const category = await Category.findOne({ _id: req.query.id })
        res.render("admin/editCategory", { category: category })
    } catch (error) {
        console.log(error.message)
    }
}


const getOrders = async(req,res)=>{
    try{
        const orders = await Order.find({}).populate("customer_id").sort({order_id:-1})
        res.render('admin/orders',{orders:orders});
    }catch(error){
        console.log(error.message)
    }
}

const orderDetails = async(req,res)=>{
    try{
        const ID = req.params.id;
        const order = await Order.findOne({order_id:ID}).populate("customer_id").populate("items.product_id").populate("items.variant_id");
        res.render("admin/orderDetails",{order:order});
    }catch(error){
        console.log(error.message)
    }
}

const cancelOrder = async(req,res)=>{
    try{
        const orderId = req.body.orderId;
        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.CBA,
                CBA:true
            }})
            
        if (order) {
            res.status(200).json({message:"Order marked delivered!",success:true});
        } else {
            res.status(400).json({message:"Marking delivered failed!",success:false});
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json("Internal server error!");
    }
}

const markAsDelivered = async(req,res)=>{
    try{
        const orderId = req.body.orderId;
        const order = await Order.findOneAndUpdate({order_id:orderId},{$set:{
                status:orderStatus.DELIVERED
            }})
            
        if (order) {
            res.status(200).json({message:"Order cancelled!",success:true});
        } else {
            res.status(400).json({message:"Order cancellation failed!",success:false});
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json("Internal server error!");
    }
}

const getUsers = async (req, res) => {
    try {
        const userslist = await User.find({});
        res.render("admin/users", { users: userslist });
    } catch (error) {
        console.log(error.message)
    }
}

const userBlock = async (req, res) => {
    try {
        const userid = req.query.userid;
        const userData = await User.findOneAndUpdate({ _id: userid }, { $set: { isBlocked: true } });
        res.redirect("/admin/users");
    } catch (error) {
        console.log(error.message)
    }
}

const userUnblock = async (req, res) => {
    try {
        const userid = req.query.userid;
        const userData = await User.findOneAndUpdate({ _id: userid }, { $set: { isBlocked: false } });
        res.redirect("/admin/users");
    } catch (error) {
        console.log(error.message)
    }

}


const logout = async (req, res) => {
    try {
        delete req.session.admin;
        res.redirect("/admin/login");
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    getLogin,
    verifyLogin,
    getDashboard,
    getProducts,
    LOUproducts,
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    updateProductDetails,
    updateVariants,
    addVariant,
    deleteImage,
    setProduct,
    addImages,
    getCategories,
    addToCategories,
    addCategory,
    toggleCategory,
    getEditCategory,
    postEditCategory,
    getOrders,
    orderDetails,
    cancelOrder,
    markAsDelivered,
    getUsers,
    userBlock,
    userUnblock,
    logout

}