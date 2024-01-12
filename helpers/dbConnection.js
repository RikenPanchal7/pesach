const mysql = require("mysql");
// const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    connectionLimit: 100, //important
    host: '195.35.53.22',
    user: 'u100608698_pesach',
    password: 'A]RFVTm$3',
    database: 'u100608698_pesach',
    debug: false
});

// var pool = mysql.createPool({
//     host: '195.35.53.22',
//     user: 'u100608698_pesach',
//     password: 'A]RFVTm$3',
//     database: "u100608698_pesach"
// });

var getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        callback(err, connection);
    });
};

// const db = mysql.createConnection({
//     host: "195.35.53.22",
//     user: "u100608698_pesach",
//     password: "A]RFVTm$3",
//     database: "u100608698_pesach",
// });

// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "pesach",
// });

//const db = mysql.createConnection({
//    host: "195.35.53.22",
//    user: "u100608698_pesach",
//    password: "M^fDQpd4",
//    database: "u100608698_pesach"
//});

// const initDbConnection = async () => {
//     try {
//         db.connect((error) => {
//             if (error) {
//                 console.log(error)
//             } else {
//                 console.log("MySQL connected!")
//             }
//         });
//     } catch (error) {
//         console.log('ERROR CONNECTING TO DB', error);
//     }
// };

module.exports = {
    pool
    // getConnection
    // db,
    // initDbConnection
};