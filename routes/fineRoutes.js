const express = require("express");
const fine_router = express.Router();
const { adminIn, adminNotIn } = require("../authentication/adminAuth");
const fineSystem = require("../controllers/fineSystem");

fine_router.get("/",fineSystem.getPage);
fine_router.post("/addfive",fineSystem.addFive);
fine_router.post("/subfive",fineSystem.subFive);
fine_router.post("/cleantotal",fineSystem.cleanUpTotal);

module.exports = fine_router;