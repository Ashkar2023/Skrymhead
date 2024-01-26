const admin = require("../models/adminModel")
const User = require("../models/userModel")

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
    getUsers,
    userBlock,
    userUnblock,
    logout
}