const cron = require("node-schedule");
const TempUser = require("./models/tempUserModel");
const Coupon = require("./models/couponModel");
const Dev = require("./models/fineSystemModel");

let schedule = cron.scheduleJob("*/30 * * * * *",async()=>{
    try{
        const otpDeleted = await TempUser.updateMany({expireAt:{$lt:Date.now()}},{$set:{otp:""}},{new:true});
        const couponDeleted = await Coupon.deleteMany({expiry_date:{$lt:Date.now()}});

        if(otpDeleted.modifiedCount > 0){
            console.log("\nOTP's deleted\n");
        }
        if(couponDeleted.deletedCount > 0){
            console.log("\nCoupon deleted\n");
        }
    }catch(error){
        console.log(error.message)
    }
})

let total = cron.scheduleJob("* 23 * * *",async()=>{
    try{
        const devs = await Dev.find({});
        const updations = devs.map(dev=> {
            let pending = dev.total+dev.dailyTotal ;
            // let pending = dev.paid? 0 : dev.total+dev.dailyTotal ;
            // let paid = dev.paid? true : false;

            return Dev.findByIdAndUpdate(dev._id,
                {
                    $push:{log: {pending: pending, amount:dev.dailyTotal} },
                    $set: {dailyTotal: 0, total : pending}
                }
            )
        });
        const calculated = await Promise.all(updations)

        if(calculated){
            console.log("Log Updated on "+new Date().toLocaleDateString());
        }

    }catch(error){
        console.log(error.message)
    }
})

module.exports = {
    schedule,
    total
}

