const mysql = require("mysql");

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "pesach",
	port:3308
});

 //const db = mysql.createConnection({
 //    host: "195.35.53.22",
 //    user: "u100608698_pesach",
 //    password: "M^fDQpd4",
 //    database: "u100608698_pesach"
 //});

const initDbConnection = async () => {
    try {
        db.connect((error) => {
            if(error) {
                console.log(error)
            } else {
                console.log("MySQL connected!")
            }
        });
    } catch (error) {
        console.log('ERROR CONNECTING TO DB', error);
    }
};

module.exports = {
    db,
    initDbConnection
};