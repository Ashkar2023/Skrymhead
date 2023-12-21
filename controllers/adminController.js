const sharp = require("sharp")
const fs = require("fs")
const admin = require("../models/adminModel")
const path = require("path")
const User = require("../models/userModel")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const Variant = require("../models/variantModel")

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
        const Products = await Product.find({}).populate("variants");
        res.render("admin/products", { products: Products })
    } catch (error) {
        console.log(error.message)
    }
}

const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({})
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
        const model = req.body.model.slice(0,1).toUpperCase()+req.body.model.slice(1).toLowerCase()
        const product = new Product({
            brand: brand,
            model: model,
            category: req.body.category,
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
                {$push:{"variants":variantsaved._id}});
        })

        res.redirect("/admin/products");
    } catch (error) {
        console.log(error.message)
    }
}

const getEditProduct = async (req, res) => {
    try {
        req.session.newid = req.query.id;
        console.log(req.session.newid)
        const productData = await Product.findOne({ _id: req.query.id });
        const categoriesData = await Category.find({});
        res.render("admin/editProduct", { product: productData, category: categoriesData });
    } catch (error) {
        console.log(error.message)
    }
}

const editProduct = async (req, res) => {
    try {
        const addStock = parseInt(req.body.stock);
        const updatedData = await Product.updateOne({ _id: req.session.newid },
            {
                $set: {
                    brand: req.body.brand,
                    model: req.body.model,
                    price: req.body.price,
                    category: req.body.category,
                    color: req.body.color,
                    specification: req.body.specification
                },
                $inc: {
                    stock: addStock
                }
            }, { new: true });
        console.log(updatedData);
        if (updatedData) {
            res.redirect("/admin/products");
        }
    } catch (error) {
        console.log(error.message)
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

const addCategory = async (req, res) => {
    try {
        res.render("admin/addCategory");
        delete req
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
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    getCategories,
    addToCategories,
    addCategory,
    toggleCategory,
    getEditCategory,
    postEditCategory,
    getUsers,
    userBlock,
    userUnblock,
    logout

}