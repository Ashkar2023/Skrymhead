const admin = require("../models/adminModel")
const User = require("../models/userModel")
const Order = require("../models/orderModel")


const getLogin = (req, res) => {
    try {
        error = req.session.adminErrMsg;
        res.render("admin/login", { alert: error });
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
        const aggregateOrders = await Order.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%m/%d/%Y",
                            date: "$order_date",
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                    total_price: {
                        $sum: "$totalPrice",
                    },
                },
            },
            {
                $sort: {
                    _id: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    orders: {
                        $push: {
                            date: "$_id",
                            count: "$count",
                            total_price:"$total_price"
                        },
                    },
                    total_count: {
                        $sum: "$count",
                    },
                    revenue: {
                        $sum: "$total_price",
                    },
                    daily_avg:{
                        $avg:"$total_price"
                    }
                }
            }
        ])

        const findUsers = await User.find({}).count();
        const [ orders, users ] = await Promise.all([aggregateOrders,findUsers]);

        res.render("admin/dashboard", { orders: orders[0], users: users });
    } catch (error) {
        console.log(error.message)
    }
}

const salesReport = async(req,res)=>{
    try{
        const dates = req.body.date.map((newDate,index)=>{
            let date = new Date(newDate);
            if(index===1){
                return new Date(date.getFullYear(), date.getMonth(), date.getDate()+1,5,29,59);
            }else{
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(),5,30);
            }
        });

        const sales = await Order.aggregate([
            {
                $match:{
                    order_date:{$gte:dates[0],$lte:dates[1]},
                    status: 'Delivered'
                }
            },
            {
                $lookup:{
                    from:"users",
                    foreignField:"_id",
                    localField:"customer_id",
                    as:"customer"
                }
            },
            {
                $addFields:{
                    "customer":{$arrayElemAt:["$customer",0]}
                }
            },
            {
                $project:{
                    order_date:1,
                    status:1,
                    totalPrice:1,
                    payment_type:1,
                    customer:1,
                    order_id:1
                }
            }
        ])

        res.status(200).json({sales:sales,success:true})

    }catch(error){
        res.status(500).json({ message: "Internal server error", success: false });
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
    salesReport,
    getUsers,
    userBlock,
    userUnblock,
    logout
}