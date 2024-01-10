const e = require("express");
const adminController = require("../controller/adminController");
const express = require('express');
const router = express.Router();

router.post("/login", async (req, res) => {
    const cust_info = req.body.cust_info;
    const getAchInfo = await adminController.login(cust_info);
});

module.exports = router