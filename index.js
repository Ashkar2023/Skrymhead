const express = require("express")
const session = require("express-session")
const app = express()
const path = require("path")
const nocache = require("nocache")
require("dotenv").config()
const mongoose = require("mongoose")
const deleteOTPs = require("./otpDeleter"); 

const port = process.env.PORT || 8000

// Database connect
const mongoDBconnect = async () => {
    try {
        await mongoose.connect(process.env.DB_KEY)
        console.log("MongoDB connected")

        app.listen(port, () => {
            console.log(`Server On :\n => http://localhost:${port} \n => http://localhost:${port}/admin/login`)
        })
    } catch (error) {
        console.log("Mongodb connection failed : ", error.message)
    }
}
mongoDBconnect()

// Middlewares
app.set("view engine", "ejs")
app.set("views", "./views")

app.use(
    session({
        secret: process.env.SESSIONSECRET,
        resave: true,
        saveUninitialized: false,
    }),
)

app.use(nocache())
app.use(express.static(path.join(__dirname, "public")))

// Routers
const userRouter = require("./routes/userRoutes")
app.use("/", userRouter)

const adminRouter = require("./routes/adminRoutes")
app.use("/admin", adminRouter)

deleteOTPs;

