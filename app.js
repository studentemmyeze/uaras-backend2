const express = require('express');
// https://medium.com/swlh/node-js-how-to-access-mysql-remotely-using-ssh-d45e21221039
const morgan = require('morgan');
// const bodyParser = require("body-parser");
const http = require('http');
const https = require('https');
const reader = require('xlsx')
const crypto = require('crypto')
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
// const morgan = require('morgan')
const fetch = require('node-fetch');
var fs = require('fs');
require('dotenv/config');


const app = express();
app.listen(3000,()=> {
    console.log('server is running @ !');
})
// Middleware
app.use(express.json());
app.use(morgan('tiny'));