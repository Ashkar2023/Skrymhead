const cron = require("node-schedule");
const TempUser = require("./models/tempUserModel");
const { model } = require("mongoose");

let schedule = cron.scheduleJob("*/30 * * * * *",async()=>{
    try{
        const otpDeleted = await TempUser.updateMany({expireAt:{$lt:Date.now()}},{$set:{otp:""}});
        console.log("OTP's deleted\n");
    }catch(error){
        console.log(error.message)
    }
})

module.exports = schedule;

