const packageController = require("../controller/packageController");
const express = require('express');
const router = express.Router();
const ejs = require('ejs');

// router.get("/index", async (req, res, next) => {
//     try {
//         const eventData = await packageController.getEventDetail();
//         const originalDate = eventData.event_date;
//         const options = { year: 'numeric', month: 'long', day: 'numeric' };
//         const event_date = originalDate.toLocaleDateString('en-US', options);

//         res.render('index', { data: eventData, event_date: event_date });
//     } catch (error) {
//         next(error);
//     }
// });

router.get("/index", (req, res) => {
    res.render("index")
});

router.post("/booking-info", packageController.saveCustomerInfo);

router.post("/getPackageInfo", packageController.getPackageInfo);

router.get("/select-event", async (req, res) => {
    const customer_id = req.query.cid;
    const eventData = await packageController.getEventDetail();
    const originalDate = eventData.event_date;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const event_date = originalDate.toLocaleDateString('en-US', options);
    res.render('select-event', { data: eventData, event_date: event_date, customer_id: customer_id });
});

router.get("/select-room", async (req, res) => {
    const decodedString = atob(req.query.pids);
    const idArr = JSON.parse(decodedString);
    try {
        const roomData = await packageController.getPackageInfo(idArr);
        res.render('select-room', { data: roomData, cid: req.query.cid, pids: req.query.pids });
    } catch (error) {
        console.error('Error in /select-room route:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/createOrder", async (req, res) => {
    try {
        const customer_id = req.body.cid;
        const package_id = req.body.pid;
        const orderData = await packageController.createOrder(customer_id, package_id);
        // res.render('select-room', { ids: arr, orderData: orderData.order_id, customer_id: orderData.customer_id });
    } catch (error) {
        console.error("Error:", error);
    }

});

router.get("/package-tickets", async (req, res) => {
    var decodedString = atob(req.query.data);
    var decodedData = JSON.parse(decodedString);
    try {
        const roomData = await packageController.getRoomInfo(decodedData);
        // res.render('package-tickets', { data: roomData, customer_id: req.query.cid, pids: req.query.pids, selectedRoomInfo: decodedData });
        res.render('package-tickets', { data: roomData, customer_id: req.query.cid, pids: req.query.pids, selectedRoomInfo: req.query.data });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.post("/createOrderRooms", async (req, res) => {
    try {
        const package_idArr = req.body.pids;
        const selectedValues = req.body.selectedValues;
        const guestObj = req.body.guestInfo;
        const customer_id = req.body.customer_id;
        const orderRoomData = await packageController.createOrderRooms(
            customer_id, selectedValues, package_idArr, guestObj);
        // res.render('dining-info', { orderData: orderData.order_id, customer_id: orderData.customer_id});
    } catch (error) {
        console.error("Error:", error);
        // Handle the error
    }
});

// router.get("/dining-info", async (req, res) => {
//     try {
//         const diningInfo = await packageController.getDiningInfo();
//         const diningData = diningInfo[0];
//         res.render('dining-info', { diningData: diningInfo, cid: req.query.cid, pids: req.query.pids, data: req.query.data });
//     } catch (error) {
//         console.error(error);
//     }
// });

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
    const customer_id = req.query.cid
    const ciddecodedString = atob(req.query.cid);
    const ciddecodedData = JSON.parse(ciddecodedString);
    try {
        const todayDate = new Date();
        const formattedDate = todayDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const billInfo = await packageController.getBillInfo(ciddecodedData);
        res.render('bill-summary', {
            curentDate: formattedDate,
            customer_id: billInfo.customer_id,
            subTotal: billInfo.subTotal,
            totalRoomCount: billInfo.totalRoomCount,
            roomInfo: billInfo.room_info,
            roomInnerInfo: billInfo.roomInnerInfo,
            totalBillAmount: billInfo.totalBillAmount,
            diningOrderResult: billInfo.diningOrderResult,
            cid: req.query.cid,
            pids: req.query.pids,
            data: req.query.data,
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
    const updateOrder = await packageController.updateOrder(totalAmount, selectedValue, customer_id)
    res.render('success');
});

router.get("/ach", async (req, res) => {
    res.render('ach', { cid: req.query.cid, pids: req.query.pids, data: req.query.data, amount: req.query.amount });
});

router.post("/createAchInfo", async (req, res) => {
    const cust_info = req.body.cust_info;
    const getAchInfo = await packageController.createAchInfo(cust_info);
});

router.get("/credit-card", async (req, res) => {
    res.render('credit-card', { cid: req.query.cid, pids: req.query.pids, data: req.query.data, amount: req.query.amount });
});

router.post("/createCreditInfo", async (req, res) => {
    const cust_info = req.body.cust_info;
    const getAchInfo = await packageController.createCreditInfo(cust_info);
});

router.get("/email", async (req, res) => {
    res.render('email');
});

router.get("/order-email", async (req, res) => {
    res.render('order-email');
});

module.exports = router