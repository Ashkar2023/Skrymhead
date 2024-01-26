const Category = require("../models/categoryModel")

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


const getEditCategory = async (req, res) => {
    try {
        req.session.newid = req.query.id;
        const category = await Category.findOne({ _id: req.query.id })
        res.render("admin/editCategory", { category: category })
    } catch (error) {
        console.log(error.message)
    }
}


const postEditCategory = async (req, res) => {
    try {
        const categoryId = req.session.newid;
        const newCategory = req.body.category;
        const newOffer = req.body.offer;
        const catEdited = newCategory.charAt(0).toUpperCase() + newCategory.slice(1).replace(/\s+/g, '-');
        const regexx = new RegExp(catEdited, "i");
        console.log(req.body)
        // Check if the new category already exists
        const isFound = await Category.findOne({ category: { $regex: regexx } });

        if (isFound && !newOffer) {
            res.redirect("/admin/category");
        } else {
            // Update the category
            const updatedCategory = await Category.findByIdAndUpdate(categoryId, { category: catEdited, offer: Number(newOffer) }, { new: true });

            if (updatedCategory) {
                delete req.session.newid;
                res.redirect("/admin/category");
            }
        }
    } catch (error) {
        console.log(error.message);
    }
};


const removeCategoryOffer = async(req,res)=>{
    try{
        const categoryId = req.session.newid;
        const deleted = await Category.findByIdAndUpdate(categoryId,{$unset:{offer:1}},{new:true});

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


module.exports = {
    getCategories,
    addToCategories,
    addCategory,
    toggleCategory,
    getEditCategory,
    postEditCategory,
    removeCategoryOffer
}