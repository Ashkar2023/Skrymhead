const cron = require("node-schedule");
const TempUser = require("./models/tempUserModel");
const Coupon = require("./models/couponModel");
const { dev : Dev} = require("./models/fineSystemModel");

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

let total = cron.scheduleJob("46 12 * * *",async()=>{
    try{
        const calculated = await Dev.updateMany({},[ { $set: {total: {$add :["$dailyTotal","$total"] },dailyTotal : 0 } } ] );
        console.log(calculated);
    }catch(error){
        console.log(error.message)
    }
})

module.exports = {
    schedule,
    total
}

