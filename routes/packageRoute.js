const e = require("express");
const packageController = require("../controller/packageController");
const express = require('express');
const router = express.Router();

router.get("/index", async (req, res, next) => {
    try {
        const eventData = await packageController.getEventDetail();
        const originalDate = eventData.event_date;
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const event_date = originalDate.toLocaleDateString('en-US', options);

        res.render('index', { data: eventData, event_date: event_date });
    } catch (error) {
        next(error);
    }
});

router.get("/booking-info", (req, res) => {
    res.render("booking-info")
});

router.post("/booking-info", packageController.saveCustomerInfo);

router.post("/getPackageInfo", packageController.getPackageInfo);

router.get("/select-event", async (req, res) => {
    const customer_id = req.query.id;
    const eventData = await packageController.getEventDetail();
    const originalDate = eventData.event_date;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const event_date = originalDate.toLocaleDateString('en-US', options);
    let cust_id = customer_id.replace(/"/g, '');
    res.render('select-event', { data: eventData, event_date: event_date, customer_id: cust_id });
});

router.get("/select-room", async (req, res) => {
    const ids = req.query.ids;
    var idsArray = JSON.parse(ids);

    var cleanedIds = idsArray.map(function (value) {
        return value.replace(/"/g, ''); // Replace double quotes globally in the string
    });

    const idArr = JSON.parse(req.query.ids || '[]');
    const customer_id = idArr[0];

    idArr.shift();
    try {
        const roomData = await packageController.getPackageInfo(idArr);
        res.render('select-room', { data: roomData, customer_id: customer_id, ids: cleanedIds });
    } catch (error) {
        console.error('Error in /select-room route:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/createOrder", async (req, res) => {
    try {
        var arr = req.body.data.split(',');
        const orderData = await packageController.createOrder(arr[0]);
        arr.shift();
        res.render('select-room', { ids: arr, orderData: orderData.order_id, customer_id: orderData.customer_id });
    } catch (error) {
        console.error("Error:", error);
    }

});

router.get("/package-tickets", async (req, res) => {
    var arr = req.query.ids.split(',');
    const customer_id = arr[0];
    var decodedString = atob(req.query.data);
    var decodedData = JSON.parse(decodedString);

    try {
        const roomData = await packageController.getRoomInfo(decodedData);
        res.render('package-tickets', { data: roomData, customer_id: customer_id, ids: arr });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.post("/createOrderRooms", async (req, res) => {
    try {
        const package_idArr = req.body.ids;
        const selectedValues = req.body.selectedValues;
        const customer_id = package_idArr[0];
        package_idArr.shift();
        const orderRoomData = await packageController.createOrderRooms(customer_id, selectedValues, package_idArr);
        // res.render('dining-info', { orderData: orderData.order_id, customer_id: orderData.customer_id});
    } catch (error) {
        console.error("Error:", error);
        // Handle the error
    }
});

router.get("/dining-info", async (req, res) => {
    let stringWithoutQuotes = req.query.ids.replace(/"/g, '');
    try {
        const diningInfo = await packageController.getDiningInfo();
        const diningData = diningInfo[0];
        res.render('dining-info', { data: diningInfo, customer_id: stringWithoutQuotes });
    } catch (error) {
        console.error(error);
    }
});

router.post("/createOrderDining", async (req, res) => {
    try {
        const selectedValues = req.body.selectedValues;
        const customer_id = req.body.customer_id;
        const orderDiningData = await packageController.createOrderDining(customer_id, selectedValues);
    } catch (error) {
        console.error("Error:", error);
    }
});

router.get("/bill-summary", async (req, res) => {
    const customer_id = req.query.ids
    try {
        const todayDate = new Date();
        const formattedDate = todayDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const billInfo = await packageController.getBillInfo(customer_id);
        res.render('bill-summary', {
            curentDate: formattedDate,
            customer_id: billInfo.customer_id,
            subTotal: billInfo.subTotal,
            roomInfo: billInfo.room_info,
            roomInnerInfo: billInfo.roomInnerInfo,
            totalBillAmount: billInfo.totalBillAmount,
            diningOrderResult: billInfo.diningOrderResult
        });
    } catch (error) {
        console.error("Error:", error);
    }
});

router.get("/success", async (req, res) => {
    res.render('success');
});

router.post("/updateOrder", async (req, res) => {
    const totalAmount = req.body.totalAmount;
    const selectedValue = req.body.selectedValue;
    const customer_id = req.body.customer_id;
    console.log('req totalAmount', req.body.totalAmount);
    console.log('req selectedValue', req.body.selectedValue);
    console.log('req customer_id', req.body.customer_id);
    const updateOrder = await packageController.updateOrder(totalAmount, selectedValue, customer_id)
    res.render('success');
});

module.exports = router