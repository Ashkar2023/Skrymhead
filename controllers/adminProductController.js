const sharp = require("sharp")
const fs = require("fs")
const mongoose = require("mongoose");
const path = require("path")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const Variant = require("../models/variantModel")
const { ObjectId } = require("mongodb");


const getProducts = async (req, res) => {
    try {
        delete req.session.productId;
        const Products = await Product.find({}).populate("variants").populate("category");
        res.render("admin/products", { products: Products })
    } catch (error) {
        console.log(error.message)
    }
}

const listOrUnlistProducts = async(req,res)=>{
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
        const promiseArray = [];

        for(const variant of changedVariants){
            let color = "color" + variant,
                stock = "stock" + variant,
                price = "price" + variant;
            
            const currentVariant = await Variant.findOne({ product_id: product._id, v_name: variant });
            let stockValue = currentVariant.stock + Number(req.body[stock]);
            stockValue < 0 ? stockValue = -currentVariant.stock  : stockValue=req.body[stock];
        
            const changed = await Variant.findOneAndUpdate({ product_id: product._id, v_name: variant },
                {
                    $set:
                    {
                        color: req.body[color],
                        price: req.body[price]
                    },
                    $inc:
                        { stock: stockValue || 0}
                },
                {new:true}
            )
            promiseArray.push(changed) 
        }

        const allChanged = await Promise.all(promiseArray);

        if(allChanged){
            session.commitTransaction();
            res.status(200).json({message:"All updates were successful",success:true})
            console.log("update successfull")
        }else{
            session.abortTransaction();
            res.status(400).json({message:"updation failed, retry!",success:false});
        }
        
    } catch (error) {
        console.log(error.message)
        session.abortTransaction();
        res.status(500).send("Internal server error!");
    }finally{
        session.endSession();
    }
}

const addOffer = async(req,res)=>{
    try{
        const value = Number(req.body.value);
        const added = await Product.findByIdAndUpdate(req.session.productId,{$set:{product_offer:value}},{new:true})

        if(added.product_offer === value){
            res.status(200).json({message:"Offer added successfully",success:true});
        }else{
            res.status(400).json({message:"Offer addition failed",success:false});
        }
    }catch(error){
        console.log(error.message)
    }
}


const removeOffer = async(req,res)=>{
    try{
        const deleted = await Product.findByIdAndUpdate(req.session.productId,{$unset:{product_offer:1}},{new:true});

        if(deleted){
            res.status(200).json({message:"Offer removed successfully",success:true});
        }else{
            res.status(400).json({message:"Offer removal failed",success:false});
        }
    }catch(error){
        res.status(500).send("Internal server error!");
        console.log(error.message)
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
        const imageToDelete = path.join(__dirname, `../public/products/${deleted.brand} ${deleted.model}/${imageURL}`).replace(/\\/g,"/");
    
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
        const product = await Product.findById(new ObjectId(req.session.productId));
        req.product = product;
        next();
    }catch(error){
        console.log(error.message)
    }
}

const addImages = async(req,res)=>{
    try{
        const productId = new ObjectId(req.session.productId)
        const product = await Product.findById(productId);
        const destination = path.join(__dirname, `../public/products/${product.brand} ${product.model}`).replace(/\\/g,"/");

        const object = await processImages2(req.files, destination);
        
        const processedImages = object.first.map(image=>({ url:path.basename(image)}));
        const imagesToDelete = object.second;

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

const cropImages = async(req,res)=>{
    try{
        const image = req.body.pname;
        const oldImage = req.body.oldImage;

        const deleted = Product.findOneAndUpdate({ _id: new ObjectId(req.product), "images.url": oldImage },
        { $pull: { images : { url: oldImage} } }, { new: true });

        const update = Product.findOneAndUpdate({ _id: new ObjectId(req.product)},
        { $push: { images : { url: image} } }, { new: true });

        const OPERATIONS = await Promise.all([deleted,update]);

        const imageToDelete = path.join(__dirname,"..","public","products",OPERATIONS[1].brand+" "+OPERATIONS[1].model,oldImage).split("\\").join("/");
        if(OPERATIONS){
            fs.unlinkSync(imageToDelete);
            res.status(200).json({message:"Successfully cropped the image",success:true, imageUrl:image});
        }else{
            res.status(400).json({message:"Database operation failed",success:false});
        }
        
    }catch(error){
        res.status(500).send("Internal server error");
        console.log(error.message)
    }
}


module.exports = {
    getProducts,
    listOrUnlistProducts,
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    updateVariants,
    addVariant,
    addOffer,
    removeOffer,
    deleteImage,
    setProduct,
    addImages,
    cropImages
}