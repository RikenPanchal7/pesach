const { db } = require("../helpers/dbConnection");
const path = require("path");
const Service = require("../helpers/index");
const send = Service.sendResponse;
const {HttpStatus, ErrorCode} = require("../helpers/code");
const { Msg } = require("../helpers/localization");
const { error } = require("console");

module.exports = {
    saveCustomerInfo: async function (req, res, next) {
        try{
            db.query('SELECT * FROM customer WHERE email = ?', [req.body.email], async (error, result) => {
                if(error){
                    console.log(error)
                };
                if( result.length > 0 ) {
                    return res.render('booking-info', { message: 'Email already exist' })
                };
                db.query('INSERT INTO customer SET?', {
                    full_name: req.body.full_name, 
                    email: req.body.email, 
                    address_line_1: req.body.address_line_1, 
                    address_line_2: req.body.address_line_2,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    phone: req.body.phone,
                }, 
                (err, result) => {
                if(err) {
                    console.log(err)
                } else {
                    return res.redirect("/select-event");
                }
                });
            });
        }catch(error){
            next(error)
        }
    },
    getEventDetail: async function (req, res, next) {
        try{
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
            
                        const getDiningQuery = `SELECT * FROM dining`;
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
        }catch(error){
            next(error)
        }
    },
    getPackageInfo: async function (ids) {
        console.log("req.body.ids", ids);
    
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
                console.log("in else");
                reject(new Error("Invalid or empty IDs"));
            }
        });
    },
    
}