const express = require('express');
const dotenv = require('dotenv');
const http = require("http");
require("dotenv").config();
const { initDbConnection } = require("./helpers/dbConnection");
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const server = http.createServer(app);

// DB connection
global.clientConnection = initDbConnection();

app.use(express.static('public'));

app.use(express.urlencoded({extended: 'false'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

// Cors
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Api-Key, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

// Render ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Routes
app.use("/", require("./routes/packageRoute"));

server.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.BASE_URL}`);
});