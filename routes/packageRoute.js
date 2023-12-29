const packageController = require("../controller/packageController");
const express = require('express');
const router = express.Router();

router.get("/index", async (req, res, next) => {
    try {
        const eventData = await packageController.getEventDetail();
        const originalDate = eventData.event_date;
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const event_date = originalDate.toLocaleDateString('en-US', options);
        
        res.render('index', { data: eventData, event_date: event_date  });
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
    const eventData = await packageController.getEventDetail();
        const originalDate = eventData.event_date;
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const event_date = originalDate.toLocaleDateString('en-US', options);
        
        res.render('select-event', { data: eventData, event_date: event_date  });
});

router.get("/select-room", async (req, res) => {

    const ids = req.query.ids ? JSON.parse(req.query.ids) : [];
    console.log("Received IDs on the server:", ids);

    try {
        const roomData = await packageController.getPackageInfo(ids);
        console.log("roomData",roomData.package_data)
        res.render('select-room', { data: roomData });
    } catch (error) {
        console.error('Error in /select-room route:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/package-tickets", async (req, res) => {
        res.render('package-tickets');
});

router.get("/event-booking", async (req, res) => {
    const eventData = await packageController.getEventDetail();
    const originalDate = eventData.event_date;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const event_date = originalDate.toLocaleDateString('en-US', options);
    
    res.render('event-booking', { data: eventData, event_date: event_date  });
});



module.exports = router