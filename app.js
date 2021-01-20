const createError = require('http-errors');
const express = require('express');
const path = require('path');
const Horo = require('./services/horo');
const Telegram = require('./telegram');
const cron = require('node-cron');

const horoInstance = new Horo();
const telegram = new Telegram();

horoInstance.updateHoros();

cron.schedule('0 1 * * *', () => {
    telegram.sendHoroscopes();
});

cron.schedule('30 0 * * *', () => {
    horoInstance.updateHoros();
});
var indexRouter = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
