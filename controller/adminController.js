const { db } = require("../helpers/dbConnection");

module.exports = {
    login: async function (req, res, next) {
        try {
            // Insert the new customer information
            db.query(
                'INSERT INTO customer SET ?',
                {
                    full_name: req.body.full_name,
                    email: req.body.email,
                    address_line_1: req.body.address_line_1,
                    address_line_2: req.body.address_line_2,
                    city: req.body.city,
                    state: req.body.state,
                    zipcode: req.body.zipcode,
                    phone: req.body.phone,
                },
                (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    } else {
                        // Retrieve the inserted customer information
                        db.query('SELECT * FROM customer WHERE customer_id = ?', [result.insertId], (selectErr, selectResult) => {
                            if (selectErr) {
                                return res.status(500).json({ error: 'Internal Server Error' });
                            };
                            const jsonString = JSON.stringify(selectResult[0].customer_id);
                            const base64EncodedCustomerId = btoa(jsonString);
                            const queryString = `?cid=${base64EncodedCustomerId}`;
                            // const queryString = '?id=' + encodeURIComponent(JSON.stringify(selectResult[0].customer_id));
                            return res.redirect("/select-event" + queryString);
                        });
                    }
                }
            );
        } catch (error) {
            next(error);
        }
    },
}