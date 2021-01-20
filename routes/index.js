const express = require('express');
const router = express.Router();
const Horoscope = require('../services/horo');

router.get('/', function (req, res, next) {
    let horoInstance = new Horoscope();
    let actualHoro = horoInstance.getActualHoro();
    let signes = horoInstance.signes;
    res.render('index', {title: 'Horo', horos: actualHoro, signes: signes});
});

module.exports = router;
