const { pool } = require("../helpers/dbConnection");
// const dbConnection = require('./dbConnection');
const mailService = require("../helpers/email");
const QRCode = require('qrcode');

module.exports = {
    saveCustomerInfo: async function (req, res, next) {
        try {
            // Insert the new customer information

            pool.query(
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
                        pool.query('SELECT * FROM customer WHERE customer_id = ?', [result.insertId], (selectErr, selectResult) => {
                            if (selectErr) {
                                return res.status(500).json({ error: 'Internal Server Error' });
                            };
                            const jsonString = JSON.stringify(selectResult[0].customer_id);
                            const base64EncodedCustomerId = btoa(jsonString);
                            const queryString = `?cid=${base64EncodedCustomerId}`;
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
                pool.query('SELECT * FROM event WHERE event_id = ?', [1], (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        let event_data;
                        const initialResult = result[0];
                        event_data = {
                            event_name: initialResult.event_name,
                            event_date: initialResult.event_start_date,
                        };
                        // const getDiningQuery = `SELECT d.*, dd.dining_date FROM dining d LEFT JOIN dining_date dd ON d.dining_id = dd.dining_id`;
                        // const diningPromise = new Promise((innerResolve, innerReject) => {
                        //     pool.query(getDiningQuery, (innerError, innerResult) => {
                        //         if (innerError) {
                        //             innerReject(innerError);
                        //         } else {
                        //             event_data.dining_data = innerResult;
                        //             innerResolve(innerResult);
                        //         }
                        //     });
                        // });

                        let package_data = [];
                        const getPackageQuery = `SELECT * FROM package WHERE event_id = ${1}`;
                        const packagePromise = new Promise((innerResolve, innerReject) => {
                            pool.query(getPackageQuery, (innerError, innerResult) => {
                                if (innerError) {
                                    innerReject(innerError);
                                } else {
                                    package_data = package_data.concat(innerResult);
                                    innerResolve(innerResult);
                                }
                            });
                        });

                        // Wait for all promises to be resolved
                        // Promise.all([diningPromise, packagePromise])
                        Promise.all([packagePromise])
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

                pool.query(query, ids, (error, results) => {
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
                                pool.query(roomQuery, [packageElement.package_id], (innerError, innerResult) => {
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

            // const query = `SELECT * FROM package_rooms WHERE room_id = ${room_id} AND package_id = ${package_id}`;
            const query = `SELECT pr.*, p.package_name FROM package_rooms pr LEFT JOIN package p ON p.package_id = pr.package_id WHERE room_id = ${room_id} AND pr.package_id = ${package_id}`;
            // `SELECT r.*,pr.room_price FROM room r LEFT JOIN package_rooms pr ON r.room_id = pr.room_id  WHERE r.room_id = ${room_id}`;
            const promise = new Promise((resolve, reject) => {
                pool.query(query, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        const currentDate = new Date();
                        const earlyBirdSpecialDate = new Date('2024-01-15');

                        const isBeforeEarlyBirdSpecialDate = currentDate < earlyBirdSpecialDate;

                        const room_price = isBeforeEarlyBirdSpecialDate
                            ? (result[0].early_bird_special_price === 0 ? result[0].room_price : result[0].early_bird_special_price)
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
                    pool.query(query, (error, result) => {
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
            pool.query(
                'SELECT * FROM orders WHERE customer_id = ?',
                [customer_id],
                (selectErr, selectResult) => {
                    if (selectErr) {
                        reject('Internal Server Error');
                    } else if (selectResult.length > 0) {
                        // Order already exists, perform an update
                        const orderId = selectResult[0].order_id;
                        pool.query(
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
                        pool.query(
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
                pool.query(queryString, (error, results, fields) => {
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
                            room_price: (new Date() < new Date('2024-01-15')) ?
                                (roomEntries[0].early_room_price === 0 ? roomEntries[0].room_price : roomEntries[0].early_room_price) :
                                roomEntries[0].room_price,
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
                    pool.query(queryString, (error, results, fields) => {
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
                        let placeholders;

                        if (order_room_id.length === 1) {
                            placeholders = order_room_id[0];
                        } else {
                            placeholders = order_room_id.join(', ');
                        }
                        const guestDeleteQuery = `DELETE FROM order_room_guest WHERE order_room_id IN (${placeholders})`;

                        // Execute the delete query with the array of IDs
                        pool.query(guestDeleteQuery, (error, results) => {
                            if (error) {
                                console.error('Error deleting rows:', error);
                            } else {
                            }
                        });
                    }
                    const deleteQuery = `DELETE FROM order_room WHERE order_id IN (${order_id})`;
                    pool.query(deleteQuery, (error, results) => {
                        if (error) {
                            console.error('Error deleting rows:', error);
                        } else {
                        }
                    });

                    setTimeout(async () => {
                        for (let i = 0; i < resultArray.length; i++) {
                            pool.query(
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
                    }, 500)
                    // return
                    // add guestInfo
                    setTimeout(async () => {
                        if (guestObj != '') {
                            let filteredData = guestObj.filter(item => item.fname !== '' || item.lname !== '' || item.age !== '');
                            filteredData.forEach(async (value) => {
                                let orderRoom_id;
                                const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
                                const results = await new Promise((resolve, reject) => {
                                    pool.query(queryString, (error, results, fields) => {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(results);
                                        }
                                    });
                                });
                                orderRoom_id = results[0].order_room_id;
                                pool.query(
                                    'INSERT INTO order_room_guest SET ?',
                                    {
                                        order_room_id: orderRoom_id,
                                        guest_first_name: value.fname,
                                        guest_last_name: value.lname,
                                        guest_age: value.age,
                                    }
                                );
                            })
                        } else {
                        }
                    }, 1000)

                } else {
                    for (let i = 0; i < resultArray.length; i++) {
                        pool.query(
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
                        setTimeout(async () => {
                            filteredData.forEach(async (value) => {
                                let order_room_id;
                                const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
                                const results = await new Promise(async (resolve, reject) => {
                                    await pool.query(queryString, (error, results, fields) => {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(results);
                                        }
                                    });
                                });
                                order_room_id = results[0].order_room_id;
                                await pool.query(
                                    'INSERT INTO order_room_guest SET ?',
                                    {
                                        order_room_id: order_room_id,
                                        guest_first_name: value.fname,
                                        guest_last_name: value.lname,
                                        guest_age: value.age,
                                    }
                                );
                            })
                        }, 1000)
                    } else {
                    }
                }
            } else {
            }
        } catch (error) {
            console.error('Error executing SELECT query:', error);
        }
    },
    // createOrderRooms: async function (customer_id, selectedValues, package_idArr, guestObj, selectedRoomInfo) {
    //     try {
    //         const currentDate = new Date();
    //         let order_id;
    //         const queryString = `SELECT * FROM orders WHERE customer_id = ${customer_id}`;
    //         const results = await new Promise((resolve, reject) => {
    //             pool.query(queryString, (error, results, fields) => {
    //                 if (error) {
    //                     reject(error);
    //                 } else {
    //                     resolve(results);
    //                 }
    //             });
    //         });
    //         order_id = results[0].order_id;
    //         if (selectedValues.length != 0) {
    //             const uniquePackageIds = new Set();
    //             const separatedData = package_idArr.flatMap(packageId => {
    //                 if (uniquePackageIds.has(packageId)) {
    //                     return [];
    //                 }
    //                 uniquePackageIds.add(packageId);
    //                 const filteredData = selectedValues.filter(item => item.package_id === packageId);
    //                 const separatedByRoomName = {};
    //                 filteredData.forEach(item => {
    //                     const { room_name } = item;
    //                     if (!separatedByRoomName[room_name]) {
    //                         separatedByRoomName[room_name] = [];
    //                     }
    //                     separatedByRoomName[room_name].push(item);
    //                 });
    //                 const separatedDataForPackage = {
    //                     package_id: packageId,
    //                     data: separatedByRoomName,
    //                 };
    //                 return [separatedDataForPackage];
    //             });
    //             const response = separatedData.map(packageData => {
    //                 const { package_id, data } = packageData;
    //                 const roomData = Object.keys(data).map(roomName => {
    //                     const roomEntries = data[roomName];
    //                     return {
    //                         package_id: package_id,
    //                         room_price: (new Date() < new Date('2024-01-15')) ?
    //                             (roomEntries[0].early_room_price === 0 ? roomEntries[0].room_price : roomEntries[0].early_room_price) :
    //                             roomEntries[0].room_price,
    //                         room_id: roomEntries[0].room_id,
    //                         room_unique_id: roomEntries[0].room_unique_id,
    //                         room_name: roomName,
    //                         additional_data: roomEntries.reduce((acc, entry) => {
    //                             if (entry.name == 'cribCheckbox' || entry.name == 'cotCheckbox') {
    //                                 acc[entry.name] = entry.selected_value;
    //                                 if (entry.is_checked) {
    //                                     acc[`${entry.name}_price`] = entry.price;
    //                                 } else {
    //                                     acc[`${entry.name}_price`] = null;
    //                                 }
    //                                 return acc;
    //                             } else {
    //                                 acc[entry.name] = entry.selected_value;
    //                                 acc[`${entry.name}_price`] = entry.price;
    //                                 return acc;
    //                             }
    //                         }, {}),
    //                     };
    //                 });
    //                 return {
    //                     data: {
    //                         room: roomData,
    //                     },
    //                 };
    //             });
    //             const resultArray = [];
    //             response.forEach(item => {
    //                 const dataArray = item.data.room;
    //                 resultArray.push(...dataArray);
    //             });
    //             let order_room_id;
    //             const queryString = `SELECT * FROM order_room WHERE order_id = ${order_id}`;
    //             const results = await new Promise((resolve, reject) => {
    //                 pool.query(queryString, (error, results, fields) => {
    //                     if (error) {
    //                         reject(error);
    //                     } else {
    //                         resolve(results);
    //                     }
    //                 });
    //             });
    //             if (results != '') {
    //                 order_id = results[0].order_id;
    //                 const order_room_id = [];
    //                 results.forEach((value) => {
    //                     order_room_id.push(value.order_room_id)
    //                 });
    //                 if (order_room_id != '') {
    //                     const placeholders = order_room_id.map(() => '?').join(',');
    //                     const deleteQuery = `DELETE FROM order_room_guest WHERE order_room_id IN (${placeholders})`;

    //                     // Execute the delete query with the array of IDs
    //                     pool.query(deleteQuery, order_room_id, (error, results) => {
    //                         if (error) {
    //                             console.error('Error deleting rows:', error);
    //                         } else {
    //                         }
    //                     });
    //                 }
    //                 const deleteQuery = `DELETE FROM order_room WHERE order_id = ${order_id}`;

    //                 // Connect to the database and execute the delete query
    //                 pool.query(deleteQuery, (error, results) => {
    //                     if (error) {
    //                         console.error('Error deleting rows:', error);
    //                     } else {
    //                     }
    //                 });

    //                 for (let i = 0; i < resultArray.length; i++) {
    //                     pool.query(
    //                         'INSERT INTO order_room SET ?',
    //                         {
    //                             order_id: order_id,
    //                             room_id: resultArray[i].room_id,
    //                             room_unique_id: resultArray[i].room_unique_id,
    //                             room_price: resultArray[i].room_price,
    //                             package_id: resultArray[i].package_id,
    //                             age_group: resultArray[i].additional_data.age_group,
    //                             no_of_additional_adult: resultArray[i].additional_data.no_of_additional_adult,
    //                             no_of_additional_adult_price: resultArray[i].additional_data.no_of_additional_adult_price,
    //                             no_of_kids_age_11_18: resultArray[i].additional_data.no_of_kids_age_11_18,
    //                             kids_age_11_18_price: resultArray[i].additional_data.no_of_kids_age_11_18_price,
    //                             no_of_kids_age_6_10: resultArray[i].additional_data.no_of_kids_age_6_10,
    //                             kids_age_6_10_price: resultArray[i].additional_data.no_of_kids_age_6_10_price,
    //                             no_of_kids_age_3_5: resultArray[i].additional_data.no_of_kids_age_3_5,
    //                             kids_age_3_5_price: resultArray[i].additional_data.no_of_kids_age_3_5_price,
    //                             no_of_kids_age_1_2: resultArray[i].additional_data.no_of_kids_age_1_2,
    //                             kids_age_1_2_price: resultArray[i].additional_data.no_of_kids_age_1_2_price,
    //                             cot_price: resultArray[i].additional_data.cotCheckbox_price,
    //                             crib_price: resultArray[i].additional_data.cribCheckbox_price,
    //                             additional_beds: resultArray[i].additional_data.additional_beds,
    //                             early_check_in_price_status: resultArray[i].additional_data.early_check_in_price_status,
    //                             early_check_in_price: resultArray[i].additional_data.early_check_in_price,
    //                             check_in: resultArray[i].additional_data.check_in,
    //                             created_date: currentDate,
    //                         }
    //                     );
    //                 }
    //                 // add guestInfo
    //                 if (guestObj != '') {
    //                     let filteredData = guestObj.filter(item => item.fname !== '' || item.lname !== '' || item.age !== '');
    //                     filteredData.forEach(async (value) => {
    //                         let order_room_id;
    //                         const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
    //                         const results = await new Promise((resolve, reject) => {
    //                             pool.query(queryString, (error, results, fields) => {
    //                                 if (error) {
    //                                     reject(error);
    //                                 } else {
    //                                     resolve(results);
    //                                 }
    //                             });
    //                         });
    //                         order_room_id = results[0].order_room_id;
    //                         pool.query(
    //                             'INSERT INTO order_room_guest SET ?',
    //                             {
    //                                 order_room_id: order_room_id,
    //                                 guest_first_name: value.fname,
    //                                 guest_last_name: value.lname,
    //                                 guest_age: value.age,
    //                             }
    //                         );
    //                     })
    //                 } else {
    //                 }

    //             } else {
    //                 for (let i = 0; i < resultArray.length; i++) {
    //                     pool.query(
    //                         'INSERT INTO order_room SET ?',
    //                         {
    //                             order_id: order_id,
    //                             room_id: resultArray[i].room_id,
    //                             room_unique_id: resultArray[i].room_unique_id,
    //                             room_price: resultArray[i].room_price,
    //                             package_id: resultArray[i].package_id,
    //                             age_group: resultArray[i].additional_data.age_group,
    //                             no_of_additional_adult: resultArray[i].additional_data.no_of_additional_adult,
    //                             no_of_additional_adult_price: resultArray[i].additional_data.no_of_additional_adult_price,
    //                             no_of_kids_age_11_18: resultArray[i].additional_data.no_of_kids_age_11_18,
    //                             kids_age_11_18_price: resultArray[i].additional_data.no_of_kids_age_11_18_price,
    //                             no_of_kids_age_6_10: resultArray[i].additional_data.no_of_kids_age_6_10,
    //                             kids_age_6_10_price: resultArray[i].additional_data.no_of_kids_age_6_10_price,
    //                             no_of_kids_age_3_5: resultArray[i].additional_data.no_of_kids_age_3_5,
    //                             kids_age_3_5_price: resultArray[i].additional_data.no_of_kids_age_3_5_price,
    //                             no_of_kids_age_1_2: resultArray[i].additional_data.no_of_kids_age_1_2,
    //                             kids_age_1_2_price: resultArray[i].additional_data.no_of_kids_age_1_2_price,
    //                             cot_price: resultArray[i].additional_data.cotCheckbox_price,
    //                             crib_price: resultArray[i].additional_data.cribCheckbox_price,
    //                             additional_beds: resultArray[i].additional_data.additional_beds,
    //                             early_check_in_price_status: resultArray[i].additional_data.early_check_in_price_status,
    //                             early_check_in_price: resultArray[i].additional_data.early_check_in_price,
    //                             check_in: resultArray[i].additional_data.check_in,
    //                             created_date: currentDate,
    //                         }
    //                     );
    //                 }
    //                 // add guestInfo
    //                 if (guestObj != '') {
    //                     let filteredData = guestObj.filter(item => item.fname !== '' || item.lname !== '' || item.age !== '');
    //                     filteredData.forEach(async (value) => {
    //                         let order_room_id;
    //                         const queryString = `SELECT * FROM order_room WHERE room_unique_id = ${value.room_unique_id}`;
    //                         const results = await new Promise((resolve, reject) => {
    //                             pool.query(queryString, (error, results, fields) => {
    //                                 if (error) {
    //                                     reject(error);
    //                                 } else {
    //                                     resolve(results);
    //                                 }
    //                             });
    //                         });
    //                         order_room_id = results[0].order_room_id;
    //                         pool.query(
    //                             'INSERT INTO order_room_guest SET ?',
    //                             {
    //                                 order_room_id: orderRoom_id,
    //                                 guest_first_name: value.fname,
    //                                 guest_last_name: value.lname,
    //                                 guest_age: value.age,
    //                             }
    //                         );
    //                     })
    //                 } else {
    //                 }
    //             }
    //         } else {
    //         }
    //     } catch (error) {
    //         console.error('Error executing SELECT query:', error);
    //     }
    // },
    getDiningInfo: async function () {
        const query = "SELECT d.*, dd.dining_date FROM dining d LEFT JOIN dining_date dd ON d.dining_id = dd.dining_id WHERE d.dining_id = 1;"
        return new Promise((resolve, reject) => {
            pool.query(query, (error, result) => {
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
                pool.query(`SELECT * FROM orders WHERE customer_id = ${customer_id}`, (error, results, fields) => {
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
                    pool.query(
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
                                        pool.query(
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
                    pool.query(checkOrderDining, (error, results, fields) => {
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
                    pool.query(deleteQuery, (error, results) => {
                        if (error) {
                            console.error('Error deleting rows:', error);
                        } else {
                        }
                    });
                    Object.keys(selectedValues).forEach(async (key) => {
                        const values = selectedValues[key];
                        pool.query(
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
                        pool.query(
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
                pool.query(getOrderQuery, (error, result) => {
                    if (error) {
                        innerReject(error);
                    } else {

                        const orderId = result[0].order_id;
                        // Execute another query using the orderId
                        const orderRoomQuery = `SELECT * FROM order_room WHERE order_id = ${orderId}`;

                        pool.query(orderRoomQuery, (anotherError, orderResult) => {
                            if (anotherError) {
                                innerReject(anotherError);
                            } else {
                                if (orderResult == '') {
                                    const results = new Promise((diningresolve, reject) => {
                                        pool.query(`SELECT od.*, d.dining_name FROM order_dining_table od LEFT JOIN dining d ON od.dining_id = d.dining_id WHERE customer_id = ${customer_id} AND order_id=${orderId}`
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

                                    // const packageRoomQuery = `SELECT * FROM package_rooms WHERE room_id IN (${roomIds.join(',')}) AND package_id IN (${packageIds.join(',')})`;

                                    const packageRoomQuery = `SELECT pr.*, p.package_name FROM package_rooms pr LEFT JOIN package p ON p.package_id = pr.package_id WHERE pr.room_id IN (${roomIds.join(',')}) AND pr.package_id IN (${packageIds.join(',')})`;

                                    pool.query(packageRoomQuery, (packageRoomError, packageRoomResult) => {
                                        if (packageRoomError) {
                                            innerReject(packageRoomError);
                                        } else {
                                            const getDiningQuery = `SELECT * FROM dining`;
                                            const diningPromise = new Promise((diningResolve, diningReject) => {
                                                pool.query(getDiningQuery, (diningError, diningResult) => {
                                                    if (diningError) {
                                                        diningReject(diningError);
                                                    } else {
                                                        const dininOrderQuery = `SELECT odt.*, d.dining_name FROM order_dining_table odt LEFT JOIN dining d ON d.dining_id = odt.dining_id WHERE odt.dining_id = ${diningResult[0].dining_id} AND odt.customer_id = ${customer_id}`;
                                                        pool.query(dininOrderQuery, (diningOrderError, diningOrderResult) => {
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

                                                                pool.query(roomQuery, (roomError, roomResult) => {
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
                                                                                    package_name: packageRoom.package_name,
                                                                                    room_price: (today < new Date('2024-01-15')) ?
                                                                                        (packageRoom.early_bird_special_price === 0 ? packageRoom.room_price : packageRoom.early_bird_special_price) :
                                                                                        packageRoom.room_price,
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
                                                                                    room_name: item.room_name + ' : ' + item.package_name,
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
            pool.query(updateQuery, (error, results, fields) => {
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
            let customerInfo;
            let customer_name;
            const customerInfoQuery = `SELECT * FROM customer WHERE customer_id = ${ciddecodedData}`;
            const customerInfoResult = await new Promise((resolve, reject) => {
                pool.query(customerInfoQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            customerInfo = customerInfoResult[0]
            customer_name = customerInfoResult[0].full_name;
            let order_id;
            let order_date;
            const orderQuery = `SELECT * FROM orders WHERE customer_id = ${ciddecodedData}`;
            const orderResult = await new Promise((resolve, reject) => {
                pool.query(orderQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            order_id = orderResult[0].order_id;
            order_date = orderResult[0].created_date;
            const originalDate = order_date;
            const options = { month: 'long', day: 'numeric' };
            const order_Modify_date = originalDate.toLocaleDateString('en-US', options);
            pool.query(
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
            const getOrderInfoQuery = `SELECT odr.*, r.room_name, p.package_name FROM order_room odr LEFT JOIN room r ON r.room_id = odr.room_id LEFT JOIN package p ON p.package_id = odr.package_id WHERE odr.order_id = ${order_id} `;
            const orderInfo = await new Promise((resolve, reject) => {
                pool.query(getOrderInfoQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });

            const orderInfoByPackage = orderInfo.reduce((acc, curr) => {
                if (!acc[curr.package_name]) {
                    acc[curr.package_name] = [];
                }
                acc[curr.package_name].push(curr);
                return acc;
            }, {});
            let totalRoomPrice = 0;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        totalRoomPrice += room.room_price;
                    }
                }
            }

            const obj = {};
            let allInnerRoomTotal = 0; // Initialize allInnerRoomTotal

            for (const packageKey in orderInfoByPackage) {
                const packageData = orderInfoByPackage[packageKey];

                for (const roomData of packageData) {
                    const roomName = roomData.room_name;

                    // Calculate values based on your specified conditions
                    const adultsPrice = roomData.no_of_additional_adult * roomData.no_of_additional_adult_price;
                    const age11to18Price = roomData.no_of_kids_age_11_18 * roomData.kids_age_11_18_price;
                    const age6to10Price = roomData.no_of_kids_age_6_10 * roomData.kids_age_6_10_price;
                    const age3to5Price = roomData.no_of_kids_age_3_5 * roomData.kids_age_3_5_price;
                    const age1to2Price = roomData.no_of_kids_age_1_2 * roomData.kids_age_1_2_price;
                    const crib_price = roomData.crib_price;
                    const cot_price = roomData.cot_price;

                    // Create object properties
                    obj[`${roomName} + Age 18+ Adults`] = adultsPrice;
                    obj[`${roomName} + Ages 11 to 18`] = age11to18Price;
                    obj[`${roomName} + Ages 6 to 10`] = age6to10Price;
                    obj[`${roomName} + Ages 3 to 5`] = age3to5Price;
                    obj[`${roomName} + Ages 1 to 2`] = age1to2Price;
                    obj[`${roomName} + crib`] = roomData.crib_price;
                    obj[`${roomName} + cot`] = roomData.cot_price;
                    const sumPricesForRoom = adultsPrice + age11to18Price + age6to10Price + age3to5Price + age1to2Price + crib_price + cot_price;

                    // Accumulate the total sum across all rooms and packages
                    allInnerRoomTotal += sumPricesForRoom;
                }
            }
            const totalBill = totalRoomPrice + allInnerRoomTotal
            const getDiningInfoQuery = `SELECT * FROM order_dining_table WHERE order_id = ${order_id} AND customer_id = ${ciddecodedData}`;
            const diningInfo = await new Promise((resolve, reject) => {
                pool.query(getDiningInfoQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });

            var html = `<div id="mail" trans="" style="width: 100%;
                margin: auto;">
                    <div>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td align="left">
                       <img style="max-height: 100px; max-width: 100%; margin: 0; display: inline-block"
                src="https://pesach-f1e07e08d4c1.herokuapp.com/images/Asset%204.png" alt="logo">
                    </td>
                </tr>
                <tr>
                    <td>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td>
                                        <h1>
                                            Here's your tickets, ${customer_name}! </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p>
                                            <span>${order_Modify_date}</span>
                                        </p>
                                    </td>
                                </tr>`;
            let room_count = 0;
            let attachments;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    html += `
                    <tr>
                    <td>
                            <h3>
                     <a href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/Sx7FWR3GrcUEtrtMH_wSksVH2CGgPh-Y_1zK6HHVqqqLJPlZQuR1_y6mAWE5eTkweKWcTLIFQip3fhKrNxvjXCbRr77OxpcdI_zm3ll1cT3wCiEHHmemMNjq2pCoYES3jHPgFUPOEQuzoy1zeKwEDU0G0IxrHJJ5iHz0Or6wDlFg1VWkPoFfpT3jZP6aIuQ-X9XrXocGNTg-7dawNXyhdvvo2q3MjIy4qCEotUsomGNmF7KJ15XXswLrhjAMqIas_RdCGoi0YZnQTe1fb9DK4O9CbMzoBQkEp19L"
                     target="_blank" rel="noopener noreferrer">
                     ${packageName}</a>
                     </h3>
                     </td>
                     </tr>`;

                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        const room_id = room.room_id.toString();

                        const qrCodeDataUrl = await QRCode.toDataURL(room_id);
                        const imageBuffer = Buffer.from(qrCodeDataUrl.split(';base64,').pop(), 'base64');

                        attachments = [{
                            filename: 'qrcode.png',  // Replace with your desired filename and extension
                            content: imageBuffer,
                            encoding: 'base64',
                            cid: 'unique_image_cid'
                        }];

                        room_count++;
                        html += `
                        <tr>
                        <td>${room_count} Ticket
                        </td>
                    </tr>
                        <tr>
                        <td style="padding: 0">
                        <table style="width: 100%;">
                                <tbody>
                        <tr style="background: #2d2e33;color: white;">
                                        <td>
                                            <table style="width: 100%;">
                                                <tbody>
                                                    <tr>
                                                        <td style="color: white;padding: 10px;">
                        <h2>
                            ${customer_name} </h2>
                                <div>
                                    ${room.room_name}
                                </div>
                            </td>
                            <td rowspan="2"
                                style="text-align: center;padding: 10px;">
                                <img src="cid:unique_image_cid" alt="QR Code Image">
                            </td>
                        </tr>
                        <tr style="color: white;">
                            <td style="padding: 10px;">
                                <div>
                                    ${room.room_id}
                                </div>
                            </td>
                        </tr>
                        </tbody >
                        </table >

                        <div style="padding: 10px;">
                              Ticket ${room_count} of ${room_count}</div>
                          <div>
                              <table style="width: 100%;color: white;padding: 10px;">
                                  <tbody>
                                      <tr>
                                      ${room.no_of_additional_adult == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Age 18+ Adults $${room.no_of_additional_adult_price}</div>
                                            <div>
                                                ${room.no_of_additional_adult}</div>
                                          </td>`
                            }
                                      ${room.no_of_kids_age_11_18 == 0 ? '' :
                                `<td style="width: 50%;">
                                                <div>
                                                    Ages 11 to 18 $${room.kids_age_11_18_price}</div>
                                                <div>
                                                    ${room.no_of_kids_age_11_18}</div>
                                            </td>`
                            }
                    </tr>
                    <tr>
                                        ${room.no_of_kids_age_6_10 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 6 to 10 $${room.kids_age_6_10_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_6_10}</div>
                                          </td>`
                            }
                                        ${room.no_of_kids_age_3_5 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 3 to 5 Adults $${room.kids_age_3_5_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_3_5}</div>
                                          </td>`
                            }
                    </tr>
                    <tr>
                                        ${room.no_of_kids_age_1_2 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 1 to 2 Adults $${room.kids_age_1_2_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_1_2}</div>
                                          </td>`
                            }
                                        ${room.crib_price == '' || room.crib_price == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Crib $${room.crib_price}</div>
                                          </td>`
                            }
                    </tr>
                    <tr>
                                    ${room.cot_price == '' || room.cot_price == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Cot $${room.cot_price}</div>
                                          </td>`
                            }
                     ${room.check_in_date == '' || room.check_in_date == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Cot $${room.check_in_date}</div>
                                                <div>
                                              Friday Check-in</div>
                                          </td>`
                            }

                            </tr>
                        </tbody>
                        </table>
                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            `;

                    }
                }
            }
            html += `<tr>
                                    <td>
                                        <table style="width: 100%;">
                                            <tbody>
                                                <tr>
                                                    <td align="center">

                                                        <a target="_blank" rel="noopener noreferrer"
                                                            style="margin-right: 3%;"
                                                            href="https://poconos.igiene.in/event/shabbos/?ical=1">
                                                            Add event to iCal</a>


                                                        <a target="_blank" rel="noopener noreferrer"
                                                            style="margin-left: 3%;"
                                                            href="https://www.google.com/calendar/event?action=TEMPLATE&amp;dates=20240131T000000/20240131T235959&amp;text=Shabbos%20Package%28All%20Inclusive%29&amp;details=%3C%21--+wp%3Atribe%2Fevent-datetime+%2F--%3E%3C%21--+wp%3Atribe%2Ffeatured-image+%2F--%3E%3C%21--+wp%3Atribe%2Ftickets+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets%22%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1627%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1630%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1633%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets+--%3E&amp;trp=false&amp;ctz=UTC+0&amp;sprop=website:https://poconos.igiene.in">
                                                            Add event to Google Calendar</a>

                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr style="background: #50b078;">
                    <td>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td align="right">
                                        Powered by <a
                                            href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/gERqG11VEljLz9Vafus_Phd8sSiZpstaoa03rdUxG0eelB3KVZmhhKDxLK8kSWUQsKn2jNBbIh3dVkYdB2oL6BRxnYJDm3FZ4M6bz7ST1IpESQVWcgBkim3w-VRf8tUT481RGH2GR6JwCEQ2i2FzUYK3C0puwHjZHK-my0hEXkG_BjdmoaqgeeB2HJvRz-3jM4zc8dnUaj_sagrjnrBN7yiO_6R3rJppBzJhVXy7j47b_q7mE4Uhp4lFPC7RI_ekRNbaXJco-04mCw7P7Fe0a9p4ldK0">Event
                                            Tickets</a> </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`;

            let mainOptions;
            mainOptions = {
                from: process.env.EMAIL_FROM,
                to: customerInfo.email,
                subject: 'Booking Information - Pesach',
                text: 'This is a test email from pesach.',
                html: html,
                attachments: attachments
            };
            await mailService.sendMail(mainOptions);


            // order-mail
            var orderEmailhtml = `
            <div id="mail">
    <div>
        <table width="100%" style="background-color: rgba(247, 247, 247, 1)" bgcolor="#f7f7f7">
            <tbody>
                <tr>
                    <td></td>
                    <td width="600">
                        <div dir="ltr" style="margin: 0 auto; padding: 70px 0; width: 100%; max-width: 600px"
                            width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                                <tbody>
                                    <tr>
                                        <td align="center" valign="top">
                                            <div>
                                            </div>
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                style="background-color: rgba(255, 255, 255, 1); border: 1px solid rgba(222, 222, 222, 1); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); border-radius: 3px"
                                                bgcolor="#fff">
                                                <tbody>
                                                    <tr>
                                                        <td align="center" valign="top">

                                                            <table border="0" cellpadding="0" cellspacing="0"
                                                                width="100%"
                                                                style="background-color: rgba(127, 84, 179, 1); color: rgba(255, 255, 255, 1); border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; border-radius: 3px 3px 0 0"
                                                                bgcolor="#7f54b3">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 36px 48px; display: block">
                                                                            <h1 style="font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: 300; line-height: 150%; margin: 0; text-align: left; text-shadow: 0 1px rgba(153, 118, 194, 1); color: rgba(255, 255, 255, 1); background-color: inherit"
                                                                                bgcolor="inherit">Thank you for your
                                                                                order</h1>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                        </td>
                                                    </tr>
                                                    <tr>`
            orderEmailhtml += `
            <tr>
                <td align="center" valign="top">

                    <table border="0" cellpadding="0" cellspacing="0"
                        width="100%">
                        <tbody>
                            <tr>
                                <td valign="top"
                                    style="background-color: rgba(255, 255, 255, 1)"
                                    bgcolor="#fff">

                                    <table border="0" cellpadding="20"
                                        cellspacing="0" width="100%">
                    <tbody>
                        <tr>
                            <td valign="top"
                                style="padding: 48px 48px 32px">
                                <div style="color: rgba(99, 99, 99, 1); font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left"
                                    align="left">

                                    <p
                                        style="margin: 0 0 16px">
                                        ${customer_name},</p>
                                    <p
                                        style="margin: 0 0 16px">
                                        Just to let you know
                                        — we've received
                                        your order #${order_id},
                                        and it is now being
                                        processed:</p>

                                    <p
                                        style="margin: 0 0 16px">
                                        Pay with cash upon
                                        delivery.</p>


                                    <h2
                                        style="color: rgba(127, 84, 179, 1); display: block; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 18px; font-weight: bold; line-height: 130%; margin: 0 0 18px; text-align: left">
                                        [Order #${order_id}]
                                        (${order_Modify_date})
                                    </h2>

                                    <div
                                        style="margin-bottom: 40px">
                                        <table
                                            cellspacing="0"
                                            cellpadding="6"
                                            border="1"
                                            style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; width: 100%; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                                            width="100%">
                                            <thead>
                                                <tr>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Product
                                                    </th>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Quantity
                                                    </th>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Price
                                                    </th>
                                                </tr>
            
                                                </thead> `

            // let room_count = 0;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        room_count++;

                        orderEmailhtml += `
            <tbody>
                <tr>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; word-wrap: break-word"
                        align="left">
                        ${room.room_name}
                        <div>
                            <a href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/Nec9vmhocM1Dc0J0uyfmRdh8ZLZLTOCL3LKBomgBe0HCPSQ2AL5F1s0QZSeW4aYROrzGC2Jk8Up9_xKphrK5QAUSQbdh6suWWF1DqUmonHAIkgykO4yRaEeBPrTTdB3lvmbVZ2fr675zcZ3yWZ8jKRkZYEcQdkoA38jnXEWqWzt8dAu4vh4fOtjxrrCQDNxavcymefdtDEkhzz5Kvh02d1ovaek77qA8Q4obJxrEc12a_83oYqBGxqTfMLYHni-SbSB-rAtfJiApkXiw3DF5kndnXXvP2ZdZThkU"
                                style="color: rgba(127, 84, 179, 1); font-weight: normal; text-decoration: underline">${room.package_name}</a><br><em><span>${order_Modify_date}</span></em><br><span>
                            </span>
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td
                                        style="padding: 12px; width:50%; ">
                                        <strong>Ticket
                                            ID</strong>
                                    </td>
                                    <td
                                        style="padding: 12px">
                                        <strong>${order_id}</strong>
                                    </td>
                                </tr>
                                <tr>
                                ${room.no_of_additional_adult == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Age 18+ Adults $${room.no_of_additional_adult_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_additional_adult}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_11_18 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 11 to 18 $${room.kids_age_11_18_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_11_18}
                                    </td>`
                            }
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_6_10 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 6 to 10 $${room.kids_age_6_10_price}</div>
                                          </td>
                                           <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_6_10}
                                    </td>`
                            }
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_3_5 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 3 to 5 $${room.kids_age_3_5_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_3_5}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_1_2 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 1 to 2 $${room.kids_age_1_2_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_1_2}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.crib_price == '' || room.crib_price == null ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Crib $${room.crib_price}</div>
                                          </td>`
                            }
                                    
                                </tr>
                                <tr>
                                   ${room.cot_price == '' || room.cot_price == null ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Cot $${room.cot_price}</div>
                                          </td>`
                            }
                                </tr>
                                
                            </tbody>
                        </table>
                    </td>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                        align="left">
                        1
                    </td>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                        align="left">
                        <span><span>$</span>${room.room_price}</span>
                    </td>
                </tr>


            </tbody>
            `
                    }
                }
            }

            orderEmailhtml += `
            <tfoot>
                        <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border-top: 4px solid rgba(229, 229, 229, 1); border-right: 1px solid rgba(229, 229, 229, 1); border-bottom: 1px solid rgba(229, 229, 229, 1); border-left: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Subtotal:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border-top: 4px solid rgba(229, 229, 229, 1); border-right: 1px solid rgba(229, 229, 229, 1); border-bottom: 1px solid rgba(229, 229, 229, 1); border-left: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                <span><span>$</span>${totalRoomPrice.toFixed(2)}</span>
                            </td>
                        </tr>`
            const categoryTotals = {};
            for (const [key, value] of Object.entries(obj)) {
                const category = key.split(" + ")[0];
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                }
                categoryTotals[category] += value;
            }

            for (const key in obj) {
                // Check if obj[key] is 0, an empty string, or null before adding to HTML
                if (obj[key] !== 0 && obj[key] !== '' && obj[key] !== null) {
                    orderEmailhtml += `
            <tr>
                <th scope="row"
                    colspan="2"
                    style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                    align="left">
                    ${key} ${obj[key]}
                </th>
                <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                    align="left">
                    <span><span>$</span>${obj[key]}</span>
                </td>
            </tr>
        `;
                }
            }


            orderEmailhtml += `
            <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Payment
                                method:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                ACH
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Total:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                <span><span>$</span>${totalBill}</span>
                            </td>
                        </tr>
                    </tfoot>`
            orderEmailhtml += `
                                    </table>
                            </div>

                            <br>You'll receive your
                            tickets in another
                            email.<table
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="width: 100%; vertical-align: top; margin-bottom: 40px; padding: 0"
                                width="100%">
                                <tbody>
                                    <tr>
                                        <td valign="top"
                                            width="50%"
                                            style="text-align: left; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; border: 0; padding: 0"
                                            align="left">
                                            <h2
                                                style="color: rgba(127, 84, 179, 1); display: block; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 18px; font-weight: bold; line-height: 130%; margin: 0 0 18px; text-align: left">
                                                Billing
                                                address
                                            </h2>

                                            <address
                                                style="padding: 12px; color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1)">
                                                ${customer_name}<br>${customerInfo.address_line_1}<br>${customerInfo.address_line_2}<br>${customerInfo.city}
                                                ${customerInfo.zipcode}<br>${customerInfo.state}
                                                <br><a
                                                    href="tel:${customerInfo.phone}"
                                                    style="color: rgba(127, 84, 179, 1); font-weight: normal; text-decoration: underline">${customerInfo.phone}</a>
                                                <br>${customerInfo.email}
                                            </address>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p
                                style="margin: 0 0 16px">
                                Thanks for using
                                Pesach
                            </p>
                        </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                            </td>
                        </tr>
                    </tbody>
                </table>

            </td>
        </tr>
            `
            orderEmailhtml += `
             <tr>
                                        <td align="center" valign="top">

                                            <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                                <tbody>
                                                </tbody>
                                            </table>

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
            `


            mainOptions = {
                from: process.env.EMAIL_FROM,
                to: customerInfo.email,
                subject: 'Thank you for your Order - Pesach',
                text: 'This is a test email from pesach.',
                html: orderEmailhtml,
            }
            await mailService.sendMail(mainOptions);

        } catch (error) {

        }

    },
    createCreditInfo: async function (cust_info) {
        try {
            const customerId = cust_info.cid;
            const ciddecodedString = atob(customerId);
            const ciddecodedData = JSON.parse(ciddecodedString);
            let customerInfo;
            let customer_name;
            const customerInfoQuery = `SELECT * FROM customer WHERE customer_id = ${ciddecodedData}`;
            const customerInfoResult = await new Promise((resolve, reject) => {
                pool.query(customerInfoQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            customerInfo = customerInfoResult[0]
            customer_name = customerInfoResult[0].full_name;
            let order_id;
            let order_date;
            const orderQuery = `SELECT * FROM orders WHERE customer_id = ${ciddecodedData}`;
            const orderResult = await new Promise((resolve, reject) => {
                pool.query(orderQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
            order_id = orderResult[0].order_id;
            order_date = orderResult[0].created_date;
            const originalDate = order_date;
            const options = { month: 'long', day: 'numeric' };
            const order_Modify_date = originalDate.toLocaleDateString('en-US', options);
            pool.query(
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
            const getOrderInfoQuery = `SELECT odr.*, r.room_name, p.package_name FROM order_room odr LEFT JOIN room r ON r.room_id = odr.room_id LEFT JOIN package p ON p.package_id = odr.package_id WHERE odr.order_id = ${order_id} `;
            const orderInfo = await new Promise((resolve, reject) => {
                pool.query(getOrderInfoQuery, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });

            const orderInfoByPackage = orderInfo.reduce((acc, curr) => {
                if (!acc[curr.package_name]) {
                    acc[curr.package_name] = [];
                }
                acc[curr.package_name].push(curr);
                return acc;
            }, {});
            let totalRoomPrice = 0;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        totalRoomPrice += room.room_price;
                    }
                }
            }

            const obj = {};
            let allInnerRoomTotal = 0; // Initialize allInnerRoomTotal

            for (const packageKey in orderInfoByPackage) {
                const packageData = orderInfoByPackage[packageKey];

                for (const roomData of packageData) {
                    const roomName = roomData.room_name;

                    // Calculate values based on your specified conditions
                    const adultsPrice = roomData.no_of_additional_adult * roomData.no_of_additional_adult_price;
                    const age11to18Price = roomData.no_of_kids_age_11_18 * roomData.kids_age_11_18_price;
                    const age6to10Price = roomData.no_of_kids_age_6_10 * roomData.kids_age_6_10_price;
                    const age3to5Price = roomData.no_of_kids_age_3_5 * roomData.kids_age_3_5_price;
                    const age1to2Price = roomData.no_of_kids_age_1_2 * roomData.kids_age_1_2_price;

                    // Create object properties
                    obj[`${roomName} + Age 18+ Adults`] = adultsPrice;
                    obj[`${roomName} + Ages 11 to 18`] = age11to18Price;
                    obj[`${roomName} + Ages 6 to 10`] = age6to10Price;
                    obj[`${roomName} + Ages 3 to 5`] = age3to5Price;
                    obj[`${roomName} + Ages 1 to 2`] = age1to2Price;
                    obj[`${roomName} + crib`] = roomData.crib_price;
                    obj[`${roomName} + cot`] = roomData.cot_price;
                    const sumPricesForRoom = adultsPrice + age11to18Price + age6to10Price + age3to5Price + age1to2Price;

                    // Accumulate the total sum across all rooms and packages
                    allInnerRoomTotal += sumPricesForRoom;
                }
            }
            const totalBill = totalRoomPrice + allInnerRoomTotal

            var html = `<div id="mail" trans="" style="width: 100%;
                margin: auto;">
                    <div>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td align="left">
                        <img style="max-height: 100px; max-width: 100%; margin: 0; display: inline-block"
                            src="https://pesach-f1e07e08d4c1.herokuapp.com/images/Asset%204.png" alt="logo">
                    </td>
                </tr>
                <tr>
                    <td>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td>
                                        <h1>
                                            Here's your tickets, ${customer_name}! </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <p>
                                            <span>${order_Modify_date}</span>
                                        </p>
                                    </td>
                                </tr>`;
            let room_count = 0;
            let attachments;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    html += `
                    <tr>
                    <td>
                            <h3>
                     <a href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/Sx7FWR3GrcUEtrtMH_wSksVH2CGgPh-Y_1zK6HHVqqqLJPlZQuR1_y6mAWE5eTkweKWcTLIFQip3fhKrNxvjXCbRr77OxpcdI_zm3ll1cT3wCiEHHmemMNjq2pCoYES3jHPgFUPOEQuzoy1zeKwEDU0G0IxrHJJ5iHz0Or6wDlFg1VWkPoFfpT3jZP6aIuQ-X9XrXocGNTg-7dawNXyhdvvo2q3MjIy4qCEotUsomGNmF7KJ15XXswLrhjAMqIas_RdCGoi0YZnQTe1fb9DK4O9CbMzoBQkEp19L"
                     target="_blank" rel="noopener noreferrer">
                     ${packageName}</a>
                     </h3>
                     </td>
                     </tr>`;

                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        const room_id = room.room_id.toString();

                        const qrCodeDataUrl = await QRCode.toDataURL(room_id);
                        const imageBuffer = Buffer.from(qrCodeDataUrl.split(';base64,').pop(), 'base64');

                        attachments = [{
                            filename: 'qrcode.png',  // Replace with your desired filename and extension
                            content: imageBuffer,
                            encoding: 'base64',
                            cid: 'unique_image_cid'
                        }];
                        room_count++;
                        html += `
                        <tr>
                        <td>${room_count} Ticket
                        </td>
                    </tr>
                        <tr>
                        <td style="padding: 0">
                        <table style="width: 100%;">
                                <tbody>
                        <tr style="background: #2d2e33;color: white;">
                                        <td>
                                            <table style="width: 100%;">
                                                <tbody>
                                                    <tr>
                                                        <td style="color: white;padding: 10px;">
                        <h2>
                            ${customer_name} </h2>
                                <div>
                                    ${room.room_name}
                                </div>
                            </td>
                            <td rowspan="2"
                                style="text-align: center;padding: 10px;">
                                <img src="cid:unique_image_cid" alt="QR Code Image">
                            </td>
                        </tr>
                        <tr style="color: white;">
                            <td style="padding: 10px;">
                                <div>
                                    ${room.room_id}
                                </div>
                            </td>
                        </tr>
                        </tbody >
                        </table >

                        <div style="padding: 10px;">
                              Ticket ${room_count} of ${room_count}</div>
                          <div>
                              <table style="width: 100%;color: white;padding: 10px;">
                                  <tbody>
                                      <tr>
                                      ${room.no_of_additional_adult == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Age 18+ Adults $${room.no_of_additional_adult_price}</div>
                                            <div>
                                                ${room.no_of_additional_adult}</div>
                                          </td>`
                            }
                                      ${room.no_of_kids_age_11_18 == 0 ? '' :
                                `<td style="width: 50%;">
                                                <div>
                                                    Ages 11 to 18 $${room.kids_age_11_18_price}</div>
                                                <div>
                                                    ${room.no_of_kids_age_11_18}</div>
                                            </td>`
                            }
                    </tr>
                    <tr>
                                        ${room.no_of_kids_age_6_10 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 6 to 10 $${room.kids_age_6_10_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_6_10}</div>
                                          </td>`
                            }
                                        ${room.no_of_kids_age_3_5 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 3 to 5 Adults $${room.kids_age_3_5_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_3_5}</div>
                                          </td>`
                            }
                    </tr>
                    <tr>
                                        ${room.no_of_kids_age_1_2 == 0 ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Ages 1 to 2 Adults $${room.kids_age_1_2_price}</div>
                                            <div>
                                                ${room.no_of_kids_age_1_2}</div>
                                          </td>`
                            }
                                        ${room.crib_price == '' || room.crib_price == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Crib $${room.crib_price}</div>
                                          </td>`
                            }
                    </tr>
                    <tr>
                                    ${room.cot_price == '' || room.cot_price == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Cot $${room.cot_price}</div>
                                          </td>`
                            }
                     ${room.check_in_date == '' || room.check_in_date == null ? '' :
                                `<td style="width: 50%;">
                                            <div>
                                                Cot $${room.check_in_date}</div>
                                                <div>
                                              Friday Check-in</div>
                                          </td>`
                            }

                            </tr>
                        </tbody>
                        </table>
                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            `;

                    }
                }
            }
            html += `<tr>
                                    <td>
                                        <table style="width: 100%;">
                                            <tbody>
                                                <tr>
                                                    <td align="center">

                                                        <a target="_blank" rel="noopener noreferrer"
                                                            style="margin-right: 3%;"
                                                            href="https://poconos.igiene.in/event/shabbos/?ical=1">
                                                            Add event to iCal</a>


                                                        <a target="_blank" rel="noopener noreferrer"
                                                            style="margin-left: 3%;"
                                                            href="https://www.google.com/calendar/event?action=TEMPLATE&amp;dates=20240131T000000/20240131T235959&amp;text=Shabbos%20Package%28All%20Inclusive%29&amp;details=%3C%21--+wp%3Atribe%2Fevent-datetime+%2F--%3E%3C%21--+wp%3Atribe%2Ffeatured-image+%2F--%3E%3C%21--+wp%3Atribe%2Ftickets+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets%22%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1627%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1630%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%21--+wp%3Atribe%2Ftickets-item+%7B%22hasBeenCreated%22%3Atrue%2C%22ticketId%22%3A1633%7D+--%3E%3Cdiv+class%3D%22wp-block-tribe-tickets-item%22%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets-item+--%3E%3C%2Fdiv%3E%3C%21--+%2Fwp%3Atribe%2Ftickets+--%3E&amp;trp=false&amp;ctz=UTC+0&amp;sprop=website:https://poconos.igiene.in">
                                                            Add event to Google Calendar</a>

                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr style="background: #50b078;">
                    <td>
                        <table style="width: 100%;">
                            <tbody>
                                <tr>
                                    <td align="right">
                                        Powered by <a
                                            href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/gERqG11VEljLz9Vafus_Phd8sSiZpstaoa03rdUxG0eelB3KVZmhhKDxLK8kSWUQsKn2jNBbIh3dVkYdB2oL6BRxnYJDm3FZ4M6bz7ST1IpESQVWcgBkim3w-VRf8tUT481RGH2GR6JwCEQ2i2FzUYK3C0puwHjZHK-my0hEXkG_BjdmoaqgeeB2HJvRz-3jM4zc8dnUaj_sagrjnrBN7yiO_6R3rJppBzJhVXy7j47b_q7mE4Uhp4lFPC7RI_ekRNbaXJco-04mCw7P7Fe0a9p4ldK0">Event
                                            Tickets</a> </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`;

            let mainOptions;
            mainOptions = {
                from: process.env.EMAIL_FROM,
                to: customerInfo.email,
                subject: 'Booking Information - Pesach',
                text: 'This is a test email from pesach.',
                html: html,
                attachments: attachments
            }
            await mailService.sendMail(mainOptions);


            // order-mail
            var orderEmailhtml = `
            <div id="mail">
    <div>
        <table width="100%" style="background-color: rgba(247, 247, 247, 1)" bgcolor="#f7f7f7">
            <tbody>
                <tr>
                    <td></td>
                    <td width="600">
                        <div dir="ltr" style="margin: 0 auto; padding: 70px 0; width: 100%; max-width: 600px"
                            width="100%">
                            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                                <tbody>
                                    <tr>
                                        <td align="center" valign="top">
                                            <div>
                                            </div>
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                style="background-color: rgba(255, 255, 255, 1); border: 1px solid rgba(222, 222, 222, 1); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); border-radius: 3px"
                                                bgcolor="#fff">
                                                <tbody>
                                                    <tr>
                                                        <td align="center" valign="top">

                                                            <table border="0" cellpadding="0" cellspacing="0"
                                                                width="100%"
                                                                style="background-color: rgba(127, 84, 179, 1); color: rgba(255, 255, 255, 1); border-bottom: 0; font-weight: bold; line-height: 100%; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; border-radius: 3px 3px 0 0"
                                                                bgcolor="#7f54b3">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 36px 48px; display: block">
                                                                            <h1 style="font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 30px; font-weight: 300; line-height: 150%; margin: 0; text-align: left; text-shadow: 0 1px rgba(153, 118, 194, 1); color: rgba(255, 255, 255, 1); background-color: inherit"
                                                                                bgcolor="inherit">Thank you for your
                                                                                order</h1>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                        </td>
                                                    </tr>
                                                    <tr>`
            orderEmailhtml += `
            <tr>
                <td align="center" valign="top">

                    <table border="0" cellpadding="0" cellspacing="0"
                        width="100%">
                        <tbody>
                            <tr>
                                <td valign="top"
                                    style="background-color: rgba(255, 255, 255, 1)"
                                    bgcolor="#fff">

                                    <table border="0" cellpadding="20"
                                        cellspacing="0" width="100%">
                    <tbody>
                        <tr>
                            <td valign="top"
                                style="padding: 48px 48px 32px">
                                <div style="color: rgba(99, 99, 99, 1); font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 14px; line-height: 150%; text-align: left"
                                    align="left">

                                    <p
                                        style="margin: 0 0 16px">
                                        ${customer_name},</p>
                                    <p
                                        style="margin: 0 0 16px">
                                        Just to let you know
                                        — we've received
                                        your order #${order_id},
                                        and it is now being
                                        processed:</p>

                                    <p
                                        style="margin: 0 0 16px">
                                        Pay with cash upon
                                        delivery.</p>


                                    <h2
                                        style="color: rgba(127, 84, 179, 1); display: block; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 18px; font-weight: bold; line-height: 130%; margin: 0 0 18px; text-align: left">
                                        [Order #${order_id}]
                                        (${order_Modify_date})
                                    </h2>

                                    <div
                                        style="margin-bottom: 40px">
                                        <table
                                            cellspacing="0"
                                            cellpadding="6"
                                            border="1"
                                            style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; width: 100%; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                                            width="100%">
                                            <thead>
                                                <tr>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Product
                                                    </th>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Quantity
                                                    </th>
                                                    <th scope="col"
                                                        style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                                        align="left">
                                                        Price
                                                    </th>
                                                </tr>
            
                                                </thead> `

            // let room_count = 0;
            for (const packageName in orderInfoByPackage) {
                if (orderInfoByPackage.hasOwnProperty(packageName)) {
                    const packageRooms = orderInfoByPackage[packageName];
                    for (const room of packageRooms) {
                        room_count++;

                        orderEmailhtml += `
            <tbody>
                <tr>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; word-wrap: break-word"
                        align="left">
                        ${room.room_name}
                        <div>
                            <a href="https://efegdcg.r.af.d.sendibt2.com/tr/cl/Nec9vmhocM1Dc0J0uyfmRdh8ZLZLTOCL3LKBomgBe0HCPSQ2AL5F1s0QZSeW4aYROrzGC2Jk8Up9_xKphrK5QAUSQbdh6suWWF1DqUmonHAIkgykO4yRaEeBPrTTdB3lvmbVZ2fr675zcZ3yWZ8jKRkZYEcQdkoA38jnXEWqWzt8dAu4vh4fOtjxrrCQDNxavcymefdtDEkhzz5Kvh02d1ovaek77qA8Q4obJxrEc12a_83oYqBGxqTfMLYHni-SbSB-rAtfJiApkXiw3DF5kndnXXvP2ZdZThkU"
                                style="color: rgba(127, 84, 179, 1); font-weight: normal; text-decoration: underline">${room.package_name}</a><br><em><span>${order_Modify_date}</span></em><br><span>
                            </span>
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td
                                        style="padding: 12px; width:50%; ">
                                        <strong>Ticket
                                            ID</strong>
                                    </td>
                                    <td
                                        style="padding: 12px">
                                        <strong>${order_id}</strong>
                                    </td>
                                </tr>
                                <tr>
                                ${room.no_of_additional_adult == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Age 18+ Adults $${room.no_of_additional_adult_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_additional_adult}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_11_18 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 11 to 18 $${room.kids_age_11_18_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_11_18}
                                    </td>`
                            }
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_6_10 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 6 to 10 $${room.kids_age_6_10_price}</div>
                                          </td>
                                           <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_6_10}
                                    </td>`
                            }
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_3_5 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 3 to 5 $${room.kids_age_3_5_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_3_5}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.no_of_kids_age_1_2 == 0 ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Ages 1 to 2 $${room.kids_age_1_2_price}</div>
                                          </td>
                                          <td
                                        style="padding: 12px">
                                        ${room.no_of_kids_age_1_2}
                                    </td>`
                            }
                                    
                                </tr>
                                <tr>
                                    ${room.crib_price == '' || room.crib_price == null ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Crib $${room.crib_price}</div>
                                          </td>`
                            }
                                    
                                </tr>
                                <tr>
                                   ${room.cot_price == '' || room.cot_price == null ? '' :
                                `<td style="padding: 12px">
                                            <div>
                                                Cot $${room.cot_price}</div>
                                          </td>`
                            }
                                </tr>
                                
                            </tbody>
                        </table>
                    </td>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                        align="left">
                        1
                    </td>
                    <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); padding: 12px; text-align: left; vertical-align: middle; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif"
                        align="left">
                        <span><span>$</span>${room.room_price}</span>
                    </td>
                </tr>


            </tbody>
            `
                    }
                }
            }

            orderEmailhtml += `
            <tfoot>
                        <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border-top: 4px solid rgba(229, 229, 229, 1); border-right: 1px solid rgba(229, 229, 229, 1); border-bottom: 1px solid rgba(229, 229, 229, 1); border-left: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Subtotal:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border-top: 4px solid rgba(229, 229, 229, 1); border-right: 1px solid rgba(229, 229, 229, 1); border-bottom: 1px solid rgba(229, 229, 229, 1); border-left: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                <span><span>$</span>${totalRoomPrice.toFixed(2)}</span>
                            </td>
                        </tr>`
            const categoryTotals = {};
            for (const [key, value] of Object.entries(obj)) {
                const category = key.split(" + ")[0];
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                }
                categoryTotals[category] += value;
            }

            for (const key in obj) {
                // Check if obj[key] is 0, an empty string, or null before adding to HTML
                if (obj[key] !== 0 && obj[key] !== '' && obj[key] !== null) {
                    orderEmailhtml += `
            <tr>
                <th scope="row"
                    colspan="2"
                    style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                    align="left">
                    ${key} ${obj[key]}
                </th>
                <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                    align="left">
                    <span><span>$</span>${obj[key]}</span>
                </td>
            </tr>
        `;
                }
            }


            orderEmailhtml += `
            <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Payment
                                method:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Credit Card
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"
                                colspan="2"
                                style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                Total:
                            </th>
                            <td style="color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1); vertical-align: middle; padding: 12px; text-align: left"
                                align="left">
                                <span><span>$</span>${totalBill}</span>
                            </td>
                        </tr>
                    </tfoot>`
            orderEmailhtml += `
                                    </table>
                            </div>

                            <br>You'll receive your
                            tickets in another
                            email.<table
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="width: 100%; vertical-align: top; margin-bottom: 40px; padding: 0"
                                width="100%">
                                <tbody>
                                    <tr>
                                        <td valign="top"
                                            width="50%"
                                            style="text-align: left; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; border: 0; padding: 0"
                                            align="left">
                                            <h2
                                                style="color: rgba(127, 84, 179, 1); display: block; font-family: &quot;Helvetica Neue&quot;, Helvetica, Roboto, Arial, sans-serif; font-size: 18px; font-weight: bold; line-height: 130%; margin: 0 0 18px; text-align: left">
                                                Billing
                                                address
                                            </h2>

                                            <address
                                                style="padding: 12px; color: rgba(99, 99, 99, 1); border: 1px solid rgba(229, 229, 229, 1)">
                                                ${customer_name}<br>${customerInfo.address_line_1}<br>${customerInfo.address_line_2}<br>${customerInfo.city}
                                                ${customerInfo.zipcode}<br>${customerInfo.state}
                                                <br><a
                                                    href="tel:${customerInfo.phone}"
                                                    style="color: rgba(127, 84, 179, 1); font-weight: normal; text-decoration: underline">${customerInfo.phone}</a>
                                                <br>${customerInfo.email}
                                            </address>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p
                                style="margin: 0 0 16px">
                                Thanks for using
                                Pesach
                            </p>
                        </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                            </td>
                        </tr>
                    </tbody>
                </table>

            </td>
        </tr>
            `
            orderEmailhtml += `
             <tr>
                                        <td align="center" valign="top">

                                            <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                                <tbody>
                                                </tbody>
                                            </table>

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
            `


            mainOptions = {
                from: process.env.EMAIL_FROM,
                to: customerInfo.email,
                subject: 'Thank you for your Order - Pesach',
                text: 'This is a test email from pesach.',
                html: orderEmailhtml,
            }
            await mailService.sendMail(mainOptions);

        } catch (error) {

        }

    },
}