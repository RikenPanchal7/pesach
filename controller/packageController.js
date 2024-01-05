const { db } = require("../helpers/dbConnection");

module.exports = {
    saveCustomerInfo: async function (req, res, next) {
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
    getEventDetail: async function (req, res, next) {
        try {
            return new Promise((resolve, reject) => {
                db.query('SELECT * FROM event WHERE event_id = ?', [1], (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        let event_data;
                        const initialResult = result[0];
                        event_data = {
                            event_name: initialResult.event_name,
                            event_date: initialResult.event_start_date,
                        };
                        const getDiningQuery = `SELECT d.*, dd.dining_date FROM dining d LEFT JOIN dining_date dd ON d.dining_id = dd.dining_id`;
                        const diningPromise = new Promise((innerResolve, innerReject) => {
                            db.query(getDiningQuery, (innerError, innerResult) => {
                                if (innerError) {
                                    innerReject(innerError);
                                } else {
                                    event_data.dining_data = innerResult;
                                    innerResolve(innerResult);
                                }
                            });
                        });

                        let package_data = [];
                        const getPackageQuery = `SELECT * FROM package WHERE event_id = ${1}`;
                        const packagePromise = new Promise((innerResolve, innerReject) => {
                            db.query(getPackageQuery, (innerError, innerResult) => {
                                if (innerError) {
                                    innerReject(innerError);
                                } else {
                                    package_data = package_data.concat(innerResult);
                                    innerResolve(innerResult);
                                }
                            });
                        });

                        // Wait for all promises to be resolved
                        Promise.all([diningPromise, packagePromise])
                            .then(() => {
                                event_data.package_data = package_data;
                                resolve(event_data);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    }
                });
            });
        } catch (error) {
            next(error)
        }
    },
    getPackageInfo: async function (ids) {
        return new Promise((resolve, reject) => {
            if (ids != '' && ids != []) {
                const placeholders = ids.map(() => '?').join(',');
                const query = `SELECT * FROM package WHERE package_id IN (${placeholders})`;

                db.query(query, ids, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        let package_data = []; // Initialize package_data as an empty array

                        const roomPromises = results.map(packageElement => {
                            const roomQuery = `
                                SELECT package_rooms.*, room.*
                                FROM package_rooms
                                INNER JOIN room ON package_rooms.room_id = room.room_id
                                WHERE package_rooms.package_id = ?;
                            `;

                            return new Promise((innerResolve, innerReject) => {
                                db.query(roomQuery, [packageElement.package_id], (innerError, innerResult) => {
                                    if (innerError) {
                                        innerReject(innerError);
                                    } else {
                                        const package_info = packageElement;
                                        const room_info = innerResult;

                                        const packageDataElement = {
                                            package_info: package_info,
                                            room_data: room_info,
                                        };

                                        // Push the individual packageDataElement into the package_data array
                                        package_data.push(packageDataElement);
                                        innerResolve(innerResult);
                                    }
                                });
                            });
                        });

                        Promise.all(roomPromises)
                            .then(() => {
                                // Resolve the outer promise with an object containing the package_data array
                                resolve({ package_data: package_data });
                            })
                            .catch(innerError => {
                                console.error('Error in room query promises:', innerError);
                                reject(innerError);
                            });
                    }
                });
            } else {
                reject(new Error("Invalid or empty IDs"));
            }
        });
    },
    getRoomInfo: async function (decodedData) {
        const promises = [];
        const room_ids = decodedData.map(obj => obj.r);
        const package_ids = decodedData.map(obj => obj.p);
        const quantities = decodedData.map(obj => obj.q);

        let totalQuantity = 0; // Initialize total quantity
        let totalPrice = 0; // Initialize total price

        for (let i = 0; i < Math.min(room_ids.length, package_ids.length, quantities.length); i++) {
            const room_id = room_ids[i];
            const package_id = package_ids[i];
            const quantity = quantities[i];

            totalQuantity += quantity; // Add quantity to totalQuantity

            const query = `SELECT * FROM package_rooms WHERE room_id = ${room_id} AND package_id = ${package_id}`;

            const promise = new Promise((resolve, reject) => {
                db.query(query, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        const currentDate = new Date();
                        const earlyBirdSpecialDate = new Date('2024-01-15');

                        const isBeforeEarlyBirdSpecialDate = currentDate < earlyBirdSpecialDate;

                        const room_price = isBeforeEarlyBirdSpecialDate
                            ? result[0].early_bird_special_price
                            : result[0].room_price;

                        const totalRoomPrice = quantity * room_price;
                        totalPrice += totalRoomPrice;
                        resolve({ result, quantity, totalRoomPrice, room_price });
                    }
                });
            });

            promises.push(promise);
        }

        try {
            const allResults = await Promise.all(promises);

            const roomInfoPromises = allResults.map(async (value) => {
                const room_id = value.result[0].room_id;
                const query = `SELECT r.*,pr.room_price FROM room r LEFT JOIN package_rooms pr ON r.room_id = pr.room_id  WHERE r.room_id = ${room_id}`;

                return new Promise((resolve, reject) => {
                    db.query(query, (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                roomInfos: result[0],
                                combinedResults: value.result[0],
                                quantity: value.quantity, // Include quantity in the final result
                                totalRoomPrice: value.totalRoomPrice, // Include totalRoomPrice in the final result
                            });
                        }
                    });
                });
            });

            const roomInfos = await Promise.all(roomInfoPromises);
            return { roomInfos, totalQuantity, totalPrice }; // Return both roomInfos, totalQuantity, and totalPrice
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    createOrder: async function (customer_id, package_id) {
        const currentDate = new Date();

        return new Promise((resolve, reject) => {
            // Check if the order already exists for the customer
            db.query(
                'SELECT * FROM orders WHERE customer_id = ?',
                [customer_id],
                (selectErr, selectResult) => {
                    if (selectErr) {
                        reject('Internal Server Error');
                    } else if (selectResult.length > 0) {
                        // Order already exists, perform an update
                        const orderId = selectResult[0].order_id;
                        db.query(
                            'UPDATE orders SET payment_type=?, payment_status=?, total_amount=?, order_date=? WHERE order_id = ?',
                            ["ACH", "PENDING", '00', currentDate, orderId],
                            (updateErr, updateResult) => {
                                if (updateErr) {
                                    console.log(updateErr);
                                    reject('Internal Server Error');
                                } else {
                                    resolve({ customer_id: customer_id, order_id: orderId });
                                }
                            }
                        );
                    } else {
                        // Order doesn't exist, perform an insert
                        db.query(
                            'INSERT INTO orders SET ?',
                            {
                                customer_id: customer_id,
                                payment_type: "ACH",
                                payment_status: "PENDING",
                                total_amount: '00',
                                order_date: currentDate,
                                created_date: currentDate,
                            },
                            (insertErr, insertResult) => {
                                if (insertErr) {
                                    console.log(insertErr);
                                    reject('Internal Server Error');
                                } else {
                                    resolve({ customer_id: customer_id, order_id: insertResult.insertId });
                                }
                            }
                        );
                    }
                }
            );
        });
    },
    createOrderRooms: async function (customer_id, selectedValues, package_idArr, guestObj, selectedRoomInfo) {
        try {
            const currentDate = new Date();
            let order_id;
            const queryString = `SELECT * FROM orders WHERE customer_id = ${customer_id}`;
            const results = await new Promise((resolve, reject) => {
                db.query(queryString, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            order_id = results[0].order_id;
            if (selectedValues.length != 0) {
                const uniquePackageIds = new Set();
                const separatedData = package_idArr.flatMap(packageId => {
                    if (uniquePackageIds.has(packageId)) {
                        return [];
                    }
                    uniquePackageIds.add(packageId);
                    const filteredData = selectedValues.filter(item => item.package_id === packageId);
                    const separatedByRoomName = {};
                    filteredData.forEach(item => {
                        const { room_name } = item;
                        if (!separatedByRoomName[room_name]) {
                            separatedByRoomName[room_name] = [];
                        }
                        separatedByRoomName[room_name].push(item);
                    });
                    const separatedDataForPackage = {
                        package_id: packageId,
                        data: separatedByRoomName,
                    };
                    return [separatedDataForPackage];
                });
                const response = separatedData.map(packageData => {
                    const { package_id, data } = packageData;
                    const roomData = Object.keys(data).map(roomName => {
                        const roomEntries = data[roomName];
                        return {
                            package_id: package_id,
                            room_price: (new Date() < new Date('2024-01-15')) ? roomEntries[0].early_room_price : roomEntries[0].room_price,
                            room_id: roomEntries[0].room_id,
                            room_unique_id: roomEntries[0].room_unique_id,
                            room_name: roomName,
                            additional_data: roomEntries.reduce((acc, entry) => {
                                if (entry.name == 'cribCheckbox' || entry.name == 'cotCheckbox') {
                                    acc[entry.name] = entry.selected_value;
                                    if (entry.is_checked) {
                                        acc[`${entry.name}_price`] = entry.price;
                                    } else {
                                        acc[`${entry.name}_price`] = null;
                                    }
                                    return acc;
                                } else {
                                    acc[entry.name] = entry.selected_value;
                                    acc[`${entry.name}_price`] = entry.price;
                                    return acc;
                                }
                            }, {}),
                        };
                    });
                    return {
                        data: {
                            room: roomData,
                        },
                    };
                });
                const resultArray = [];
                response.forEach(item => {
                    const dataArray = item.data.room;
                    resultArray.push(...dataArray);
                });
                let order_room_id;
                const queryString = `SELECT * FROM order_room WHERE order_id = ${order_id}`;
                const results = await new Promise((resolve, reject) => {
                    db.query(queryString, (error, results, fields) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
                if (results != '') {
                    order_id = results[0].order_id;
                    const order_room_id = [];
                    results.forEach((value) => {
                        order_room_id.push(value.order_room_id)
                    });
                    if (order_room_id != '') {
                        const placeholders = order_room_id.map(() => '?').join(',');
                        const deleteQuery = `DELETE FROM order_room_guest WHERE order_room_id IN (${placeholders})`;

                        // Execute the delete query with the array of IDs
                        db.query(deleteQuery, order_room_id, (error, results) => {
                            if (error) {
                                console.error('Error deleting rows:', error);
                            } else {
                                console.log('Rows deleted successfully:', results.affectedRows);
                            }
                        });
                    }
                    const deleteQuery = `DELETE FROM order_room WHERE order_id = ${order_id}`;

                    // Connect to the database and execute the delete query
                    db.query(deleteQuery, (error, results) => {
                        if (error) {
                            console.error('Error deleting rows:', error);
                        } else {
                            console.log('Rows deleted successfully:', results.affectedRows);
                        }
                    });

                    for (let i = 0; i < resultArray.length; i++) {
                        db.query(
                            'INSERT INTO order_room SET ?',
                            {
                                order_id: order_id,
                                room_id: resultArray[i].room_id,
                                room_unique_id: resultArray[i].room_unique_id,
                                room_price: resultArray[i].room_price,
                                package_id: resultArray[i].package_id,
                                age_group: resultArray[i].additional_data.age_group,
                                no_of_additional_adult: resultArray[i].additional_data.no_of_additional_adult,
                                no_of_additional_adult_price: resultArray[i].additional_data.no_of_additional_adult_price,
                                no_of_kids_age_11_18: resultArray[i].additional_data.no_of_kids_age_11_18,
                                kids_age_11_18_price: resultArray[i].additional_data.no_of_kids_age_11_18_price,
                                no_of_kids_age_6_10: resultArray[i].additional_data.no_of_kids_age_6_10,
                                kids_age_6_10_price: resultArray[i].additional_data.no_of_kids_age_6_10_price,
                                no_of_kids_age_3_5: resultArray[i].additional_data.no_of_kids_age_3_5,
                                kids_age_3_5_price: resultArray[i].additional_data.no_of_kids_age_3_5_price,
                                no_of_kids_age_1_2: resultArray[i].additional_data.no_of_kids_age_1_2,
                                kids_age_1_2_price: resultArray[i].additional_data.no_of_kids_age_1_2_price,
                                cot_price: resultArray[i].additional_data.cotCheckbox_price,
                                crib_price: resultArray[i].additional_data.cribCheckbox_price,
                                additional_beds: resultArray[i].additional_data.additional_beds,
                                early_check_in_price_status: resultArray[i].additional_data.early_check_in_price_status,
                                early_check_in_price: resultArray[i].additional_data.early_check_in_price,
                                check_in: resultArray[i].additional_data.check_in,
                                created_date: currentDate,
                            }
                        );
                    }
                    // add guestInfo
                    if (guestObj != '') {
                        let filteredData = guestObj.filter(item => item.fname !== '' || item.lname !== '' || item.age !== '');
                        filteredData.forEach(async (value) => {
                            let order_room_id;
                            const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
                            const results = await new Promise((resolve, reject) => {
                                db.query(queryString, (error, results, fields) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(results);
                                    }
                                });
                            });
                            order_room_id = results[0].order_room_id;
                            db.query(
                                'INSERT INTO order_room_guest SET ?',
                                {
                                    order_room_id: order_room_id,
                                    guest_first_name: value.fname,
                                    guest_last_name: value.lname,
                                    guest_age: value.age,
                                }
                            );
                        })
                    } else {
                        console.log("in else")
                    }

                } else {
                    for (let i = 0; i < resultArray.length; i++) {
                        db.query(
                            'INSERT INTO order_room SET ?',
                            {
                                order_id: order_id,
                                room_id: resultArray[i].room_id,
                                room_unique_id: resultArray[i].room_unique_id,
                                room_price: resultArray[i].room_price,
                                package_id: resultArray[i].package_id,
                                age_group: resultArray[i].additional_data.age_group,
                                no_of_additional_adult: resultArray[i].additional_data.no_of_additional_adult,
                                no_of_additional_adult_price: resultArray[i].additional_data.no_of_additional_adult_price,
                                no_of_kids_age_11_18: resultArray[i].additional_data.no_of_kids_age_11_18,
                                kids_age_11_18_price: resultArray[i].additional_data.no_of_kids_age_11_18_price,
                                no_of_kids_age_6_10: resultArray[i].additional_data.no_of_kids_age_6_10,
                                kids_age_6_10_price: resultArray[i].additional_data.no_of_kids_age_6_10_price,
                                no_of_kids_age_3_5: resultArray[i].additional_data.no_of_kids_age_3_5,
                                kids_age_3_5_price: resultArray[i].additional_data.no_of_kids_age_3_5_price,
                                no_of_kids_age_1_2: resultArray[i].additional_data.no_of_kids_age_1_2,
                                kids_age_1_2_price: resultArray[i].additional_data.no_of_kids_age_1_2_price,
                                cot_price: resultArray[i].additional_data.cotCheckbox_price,
                                crib_price: resultArray[i].additional_data.cribCheckbox_price,
                                additional_beds: resultArray[i].additional_data.additional_beds,
                                early_check_in_price_status: resultArray[i].additional_data.early_check_in_price_status,
                                early_check_in_price: resultArray[i].additional_data.early_check_in_price,
                                check_in: resultArray[i].additional_data.check_in,
                                created_date: currentDate,
                            }
                        );
                    }
                    // add guestInfo
                    if (guestObj != '') {
                        let filteredData = guestObj.filter(item => item.fname !== '' || item.lname !== '' || item.age !== '');
                        filteredData.forEach(async (value) => {
                            let order_room_id;
                            const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
                            const results = await new Promise((resolve, reject) => {
                                db.query(queryString, (error, results, fields) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(results);
                                    }
                                });
                            });
                            order_room_id = results[0].order_room_id;
                            db.query(
                                'INSERT INTO order_room_guest SET ?',
                                {
                                    order_room_id: order_room_id,
                                    guest_first_name: value.fname,
                                    guest_last_name: value.lname,
                                    guest_age: value.age,
                                }
                            );
                        })
                    } else {
                        console.log("in else")
                    }
                }
            } else {
                console.log("in else----------------------------------------------------------", selectedRoomInfo)
            }
        } catch (error) {
            console.error('Error executing SELECT query:', error);
        }
    },
    getDiningInfo: async function () {
        const query = "SELECT d.*, dd.dining_date FROM dining d LEFT JOIN dining_date dd ON d.dining_id = dd.dining_id WHERE d.dining_id = 1;"
        return new Promise((resolve, reject) => {
            db.query(query, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },
    createOrderDining: async function (customer_id, selectedValues) {
        try {
            const currentDate = new Date();
            let order_id;

            // Use a promise to get results from the first query
            const results = await new Promise((resolve, reject) => {
                db.query(`SELECT * FROM orders WHERE customer_id = ${customer_id}`, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            // Check if the results array is empty
            if (results != '') {
                order_id = results[0].order_id
            }
            if (results.length === 0) {
                // Use another promise to perform the insert into the 'orders' table
                const addOrder = await new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO orders SET ?',
                        {
                            customer_id: customer_id,
                            payment_type: "ACH",
                            payment_status: "PENDING",
                            total_amount: '00',
                            order_date: currentDate,
                            created_date: currentDate,
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                order_id = result.insertId;
                                // Use Promise.all to handle multiple asynchronous operations concurrently
                                Promise.all(Object.keys(selectedValues).map(async (key) => {
                                    const values = selectedValues[key];
                                    // Use another promise to perform the insert into the 'order_dining_table' table
                                    await new Promise((resolve, reject) => {
                                        db.query(
                                            'INSERT INTO order_dining_table SET ?',
                                            {
                                                dining_id: 1, // Set your dining_id value
                                                customer_id: customer_id,
                                                order_id: order_id,
                                                dining_date: values.dining_date,
                                                above_12_count: values.above_12_count,
                                                above_12_price: values.above_12_price,
                                                bet_3_11_count: values.bet_3_11_count,
                                                bet_3_11_price: values.bet_3_11_price,
                                                bet_1_2_count: values.bet_1_2_count,
                                                bet_1_2_price: values.bet_1_2_price,
                                                highchairs: values.highchair,
                                                total_seats: values.total_seat,
                                                created_date: currentDate,
                                            },
                                            (error, result) => {
                                                if (error) {
                                                    reject(error);
                                                } else {
                                                    resolve(result);
                                                }
                                            }
                                        );
                                    });
                                }));
                                resolve({ customer_id: customer_id, order_id: order_id });
                            }
                        }
                    );
                });
            } else {
                const currentDate = new Date();
                const checkOrderDining = `SELECT * FROM order_dining_table WHERE order_id = ${order_id}`;
                const orderDiningResult = new Promise((resolve, reject) => {
                    db.query(checkOrderDining, (error, results, fields) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
                if (orderDiningResult != '') {
                    const deleteQuery = `DELETE FROM order_dining_table WHERE order_id = ${order_id}`;

                    // Connect to the database and execute the delete query
                    db.query(deleteQuery, (error, results) => {
                        if (error) {
                            console.error('Error deleting rows:', error);
                        } else {
                            console.log('Rows deleted successfully:', results.affectedRows);
                        }
                    });
                    Object.keys(selectedValues).forEach(async (key) => {
                        const values = selectedValues[key];
                        db.query(
                            'INSERT INTO order_dining_table SET ?',
                            {
                                dining_id: 1, // Set your dining_id value
                                customer_id: customer_id,
                                order_id: order_id,
                                dining_date: values.dining_date,
                                above_12_count: values.above_12_count,
                                above_12_price: values.above_12_price,
                                bet_3_11_count: values.bet_3_11_count,
                                bet_3_11_price: values.bet_3_11_price,
                                bet_1_2_count: values.bet_1_2_count,
                                bet_1_2_price: values.bet_1_2_price,
                                highchairs: values.highchair,
                                total_seats: values.total_seat,
                                created_date: currentDate,
                            }
                        );
                    });
                } else {
                    Object.keys(selectedValues).forEach(async (key) => {
                        const values = selectedValues[key];
                        db.query(
                            'INSERT INTO order_dining_table SET ?',
                            {
                                dining_id: 1, // Set your dining_id value
                                customer_id: customer_id,
                                order_id: order_id,
                                dining_date: values.dining_date,
                                above_12_count: values.above_12_count,
                                above_12_price: values.above_12_price,
                                bet_3_11_count: values.bet_3_11_count,
                                bet_3_11_price: values.bet_3_11_price,
                                bet_1_2_count: values.bet_1_2_count,
                                bet_1_2_price: values.bet_1_2_price,
                                highchairs: values.highchair,
                                total_seats: values.total_seat,
                                created_date: currentDate,
                            }
                        );
                    });
                }
            }
        } catch (error) {
            console.error('Error executing query:', error);
        }
    },
    getBillInfo: async function (customer_id) {
        return new Promise((resolve, reject) => {
            const getOrderQuery = `SELECT * FROM orders WHERE customer_id = ${customer_id}`;
            const orderPromise = new Promise((innerResolve, innerReject) => {
                db.query(getOrderQuery, (error, result) => {
                    if (error) {
                        innerReject(error);
                    } else {

                        const orderId = result[0].order_id;
                        // Execute another query using the orderId
                        const orderRoomQuery = `SELECT * FROM order_room WHERE order_id = ${orderId}`;

                        db.query(orderRoomQuery, (anotherError, orderResult) => {
                            if (anotherError) {
                                innerReject(anotherError);
                            } else {
                                if (orderResult == '') {
                                    const results = new Promise((diningresolve, reject) => {
                                        db.query(`SELECT od.*, d.dining_name FROM order_dining_table od LEFT JOIN dining d ON od.dining_id = d.dining_id WHERE customer_id = ${customer_id} AND order_id=${orderId}`
                                            , (error, results, fields) => {
                                                if (error) {
                                                    reject(error);
                                                } else {
                                                    let totalPrice = 0;
                                                    let totalRoomCount = 0;

                                                    // Calculate total price and count for each object in the result array
                                                    let dining_name;
                                                    results.forEach(item => {
                                                        dining_name = item.dining_name
                                                        if (item.above_12_count > 0) {
                                                            totalPrice += item.above_12_count * item.above_12_price;
                                                            totalRoomCount += item.above_12_count;
                                                        }

                                                        if (item.bet_3_11_count > 0) {
                                                            totalPrice += item.bet_3_11_count * item.bet_3_11_price;
                                                            totalRoomCount += item.bet_3_11_count;
                                                        }
                                                    });
                                                    const room_info = result.map((item, index) => {
                                                        return {
                                                            [`data_${index + 1}`]: {
                                                                room_name: dining_name,
                                                                room_price: 0, // Replace with the actual room price
                                                                total_room: 0, // Replace with the actual total room count
                                                                total_price: 0 // Replace with the actual total price
                                                            }
                                                        };
                                                    });
                                                    diningresolve({
                                                        customer_id: customer_id,
                                                        // subTotal: totalPrice,
                                                        room_info: room_info,
                                                        roomInnerInfo: [],
                                                        totalBillAmount: totalPrice,
                                                        diningOrderResult: results
                                                    });
                                                }
                                            });
                                    });
                                    results.then((resolve1) => {
                                        resolve(resolve1);
                                    }).catch((error) => {
                                        console.error("Error:", error);
                                    });
                                } else {
                                    const roomIds = orderResult.map(room => room.room_id);
                                    const packageIds = orderResult.map(room => room.package_id);
                                    // Execute another query (package_room) using room_ids and package_ids
                                    const packageRoomQuery = `SELECT * FROM package_rooms WHERE room_id IN (${roomIds.join(',')}) AND package_id IN (${packageIds.join(',')})`;

                                    db.query(packageRoomQuery, (packageRoomError, packageRoomResult) => {
                                        if (packageRoomError) {
                                            innerReject(packageRoomError);
                                        } else {
                                            const getDiningQuery = `SELECT * FROM dining`;
                                            const diningPromise = new Promise((diningResolve, diningReject) => {
                                                db.query(getDiningQuery, (diningError, diningResult) => {
                                                    if (diningError) {
                                                        diningReject(diningError);
                                                    } else {
                                                        const dininOrderQuery = `SELECT odt.*, d.dining_name FROM order_dining_table odt LEFT JOIN dining d ON d.dining_id = odt.dining_id WHERE odt.dining_id = ${diningResult[0].dining_id} AND odt.customer_id = ${customer_id}`;
                                                        db.query(dininOrderQuery, (diningOrderError, diningOrderResult) => {
                                                            if (diningOrderError) {
                                                                reject(diningOrderError);
                                                            } else {
                                                                const modifiedDiningOrderResult = diningOrderResult.map(order => {
                                                                    if (order.above_12_count == 0) {
                                                                        delete order.above_12_count;
                                                                        delete order.above_12_price;
                                                                    }

                                                                    if (order.bet_3_11_count == 0) {
                                                                        delete order.bet_3_11_count;
                                                                        delete order.bet_3_11_price;
                                                                    }

                                                                    if (order.bet_1_2_count >= 0) {

                                                                        delete order.bet_1_2_count;
                                                                        delete order.bet_1_2_price;
                                                                    }

                                                                    if (order.highchairs >= 0) {
                                                                        delete order.highchairs;
                                                                    }

                                                                    if (order.total_seats >= 0) {
                                                                        delete order.total_seats;
                                                                    }

                                                                    return order;
                                                                });
                                                                const diningBill = modifiedDiningOrderResult.map(order => {
                                                                    let total = 0;

                                                                    if (order.above_12_count) {
                                                                        total += order.above_12_count * order.above_12_price;
                                                                    }

                                                                    if (order.bet_3_11_count) {
                                                                        total += order.bet_3_11_count * order.bet_3_11_price;
                                                                    }

                                                                    return total;
                                                                });
                                                                const totalDiningBill = diningBill.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                                                                const packageRoomRoomIds = packageRoomResult.map(room => room.room_id);

                                                                // Execute another query (room) using packageRoomRoomIds
                                                                const roomQuery = `SELECT * FROM room WHERE room_id IN (${packageRoomRoomIds.join(',')})`;

                                                                db.query(roomQuery, (roomError, roomResult) => {
                                                                    if (roomError) {
                                                                        innerReject(roomError);
                                                                    } else {
                                                                        //------------------------------------------------

                                                                        const findRoomById = (roomId) => {
                                                                            return roomResult.find((room) => room.room_id === roomId);
                                                                        };

                                                                        // Function to find a package_room entry by room_id and package_id
                                                                        const findPackageRoomEntry = (roomId, packageId) => {
                                                                            return packageRoomResult.find(
                                                                                (packageRoom) => packageRoom.room_id === roomId && packageRoom.package_id === packageId
                                                                            );
                                                                        };

                                                                        const responseObj = {};
                                                                        const today = new Date();
                                                                        orderResult.forEach((order) => {
                                                                            const room = findRoomById(order.room_id);
                                                                            const packageRoom = findPackageRoomEntry(order.room_id, order.package_id);
                                                                            const roomPackageKey = `${order.room_id}-${order.package_id}`;

                                                                            if (!responseObj[roomPackageKey]) {
                                                                                // Initialize properties for the room if not already present
                                                                                responseObj[roomPackageKey] = {
                                                                                    room_name: room.room_name,
                                                                                    room_price: (today < new Date('2024-01-15')) ? packageRoom.early_bird_special_price : packageRoom.room_price,
                                                                                    total_room: 0,
                                                                                    no_of_additional_adult: 0,
                                                                                    no_of_additional_adult_price: 0,
                                                                                    no_of_kids_age_11_18: 0,
                                                                                    kids_age_11_18_price: 0,
                                                                                    no_of_kids_age_6_10: 0,
                                                                                    kids_age_6_10_price: 0,
                                                                                    no_of_kids_age_3_5: 0,
                                                                                    kids_age_3_5_price: 0,
                                                                                    no_of_kids_age_1_2: 0,
                                                                                    kids_age_1_2_price: 0,
                                                                                    crib_price: 0,
                                                                                    cot_price: 0,
                                                                                };
                                                                            }

                                                                            // Update the counts and prices based on order data
                                                                            responseObj[roomPackageKey].total_room += 1; // Increment total_room by 1 for each booking
                                                                            responseObj[roomPackageKey].no_of_additional_adult += order.no_of_additional_adult;
                                                                            responseObj[roomPackageKey].no_of_additional_adult_price = order.no_of_additional_adult_price;
                                                                            responseObj[roomPackageKey].no_of_kids_age_11_18 += order.no_of_kids_age_11_18;
                                                                            responseObj[roomPackageKey].kids_age_11_18_price += order.kids_age_11_18_price;
                                                                            responseObj[roomPackageKey].no_of_kids_age_6_10 += order.no_of_kids_age_6_10;
                                                                            responseObj[roomPackageKey].kids_age_6_10_price += order.kids_age_6_10_price;
                                                                            responseObj[roomPackageKey].no_of_kids_age_3_5 += order.no_of_kids_age_3_5;
                                                                            responseObj[roomPackageKey].kids_age_3_5_price += order.kids_age_3_5_price;
                                                                            responseObj[roomPackageKey].no_of_kids_age_1_2 += order.no_of_kids_age_1_2;
                                                                            responseObj[roomPackageKey].kids_age_1_2_price += order.kids_age_1_2_price;
                                                                            responseObj[roomPackageKey].crib_price += order.crib_price || 0;
                                                                            responseObj[roomPackageKey].cot_price += order.cot_price || 0;
                                                                        });
                                                                        const responseArray = Object.values(responseObj);
                                                                        const subTotal = responseArray.reduce((total, obj) => {
                                                                            const roomTotalCost = obj.room_price * obj.total_room;
                                                                            return total + roomTotalCost;
                                                                        }, 0);

                                                                        const room_info = responseArray.map((item, index) => {
                                                                            return {
                                                                                [`data_${index + 1}`]: {
                                                                                    room_name: item.room_name,
                                                                                    room_price: item.room_price,
                                                                                    total_room: item.total_room,
                                                                                    total_price: item.room_price * item.total_room
                                                                                }
                                                                            };
                                                                        });

                                                                        const response = {
                                                                            subprice: 0,
                                                                            data_1: [],
                                                                            data_2: [],
                                                                        };

                                                                        responseArray.forEach((item, index) => {
                                                                            const roomData = {};
                                                                            if (item.no_of_additional_adult > 0) {
                                                                                roomData.field_1 = {
                                                                                    room_name: `${item.room_name} Additional adult`,
                                                                                    person: item.no_of_additional_adult,
                                                                                    total_price: item.no_of_additional_adult_price * item.no_of_additional_adult,
                                                                                };
                                                                            }
                                                                            if (item.no_of_kids_age_11_18 > 0) {
                                                                                roomData.field_2 = {
                                                                                    room_name: `${item.room_name} 11-18 Age Child`,
                                                                                    person: item.no_of_kids_age_11_18,
                                                                                    total_price: item.kids_age_11_18_price * item.no_of_kids_age_11_18,
                                                                                };
                                                                            }

                                                                            if (item.no_of_kids_age_6_10 > 0) {
                                                                                roomData.field_3 = {
                                                                                    room_name: `${item.room_name} 6-10 Age Child`,
                                                                                    person: item.no_of_kids_age_6_10,
                                                                                    total_price: item.kids_age_6_10_price * item.no_of_kids_age_6_10,
                                                                                };
                                                                            }

                                                                            if (item.no_of_kids_age_3_5 > 0) {
                                                                                roomData.field_4 = {
                                                                                    room_name: `${item.room_name} 3-5 Age Child`,
                                                                                    person: item.no_of_kids_age_3_5,
                                                                                    total_price: item.kids_age_3_5_price * item.no_of_kids_age_3_5,
                                                                                };
                                                                            }

                                                                            if (item.no_of_kids_age_1_2 > 0) {
                                                                                roomData.field_5 = {
                                                                                    room_name: `${item.room_name} 1-2 Age Child`,
                                                                                    person: item.no_of_kids_age_1_2,
                                                                                    total_price: item.kids_age_1_2_price * item.no_of_kids_age_1_2,
                                                                                };
                                                                            }

                                                                            if (item.crib_price > 0) {
                                                                                roomData.field_6 = {
                                                                                    room_name: `${item.room_name} crib`,
                                                                                    total_price: item.crib_price,
                                                                                };
                                                                            }

                                                                            if (item.cot_price > 0) {
                                                                                roomData.field_7 = {
                                                                                    room_name: `${item.room_name} cot`,
                                                                                    total_price: item.cot_price,
                                                                                };
                                                                            }
                                                                            response.subprice += Object.values(roomData).reduce((acc, field) => acc + field.total_price, 0);
                                                                            response[`data_${index + 1}`] = Object.values(roomData);
                                                                        });

                                                                        const subprice = response.subprice;
                                                                        const totalBillAmount = subTotal + subprice + totalDiningBill;
                                                                        const totalRoomCount = room_info.reduce((total, room) => {
                                                                            // Assuming each entry in room_info has a property containing room information
                                                                            const roomData = Object.values(room)[0];
                                                                            return total + roomData.total_room;
                                                                        }, 0);
                                                                        innerResolve({
                                                                            customer_id: customer_id,
                                                                            subTotal: subTotal,
                                                                            totalRoomCount: totalRoomCount,
                                                                            room_info, room_info,
                                                                            roomInnerInfo: response,
                                                                            totalBillAmount: totalBillAmount,
                                                                            diningOrderResult: diningOrderResult
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            });
            orderPromise.then(result => {
                resolve(result);
            }).catch(error => {
                reject(error);
            });
        });
    },
    updateOrder: async function (totalAmount, selectedValue, customer_id) {
        try {
            var d = new Date(),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            const date = [year, month, day].join('-');
            // Insert the new customer information
            const updateQuery = `UPDATE orders SET payment_type = '${selectedValue}', total_amount = ${totalAmount},payment_status ='PAID',
            order_date = '${date}'  WHERE customer_id  = ${customer_id}`;

            // Execute the update query
            db.query(updateQuery, (error, results, fields) => {
                if (error) {
                    console.error('Error executing update query:', error);
                    throw error;
                }
            });
        } catch (error) {

        }

    },
    createAchInfo: async function (cust_info) {
        try {
            const customerId = cust_info.cid;
            const ciddecodedString = atob(customerId);
            const ciddecodedData = JSON.parse(ciddecodedString);

            let order_id;
            const orderQuery = `SELECT * FROM orders WHERE customer_id = ${ciddecodedData}`;
            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            order_id = orderResult[0].order_id;

            db.query(
                'INSERT INTO ach SET ?',
                {
                    name: cust_info.name,
                    email: cust_info.email,
                    address: cust_info.address,
                    city: cust_info.city,
                    state: cust_info.state,
                    routing_number: cust_info.routing_number,
                    account_number: cust_info.account_number,
                    ach_date: cust_info.ach_date,
                    ach_type: cust_info.ach_type,
                    amount: cust_info.amount,
                    order_id: order_id,
                    customer_id: ciddecodedData,
                },
                (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {

                    }
                }
            );
        } catch (error) {

        }

    },
    createCreditInfo: async function (cust_info) {
        try {
            const customerId = cust_info.cid;
            const ciddecodedString = atob(customerId);
            const ciddecodedData = JSON.parse(ciddecodedString);

            let order_id;
            const orderQuery = `SELECT * FROM orders WHERE customer_id = ${ciddecodedData}`;
            const orderResult = await new Promise((resolve, reject) => {
                db.query(orderQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            order_id = orderResult[0].order_id;

            db.query(
                'INSERT INTO credit_card SET ?',
                {
                    card_number: cust_info.card_number,
                    card_holder_name: cust_info.card_holder_name,
                    card_expiry_date: cust_info.card_expiry_date,
                    cvv: cust_info.cvv,
                    amount: cust_info.amount,
                    order_id: order_id,
                    customer_id: ciddecodedData,
                },
                (err, result) => {
                    if (err) {
                        console.log(err);
                    } else {

                    }
                }
            );
        } catch (error) {

        }
    }
}