const express = require('express');
const app = express();
const args = require('./opts.js').argv;

app.use(express.static(__dirname + '/web'));

app.listen(8080);

module.exports = app;