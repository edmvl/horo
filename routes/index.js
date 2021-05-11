const express = require('express');
const router = express.Router();
const Horoscope = require('../services/horo');

router.get('/', async function (req, res, next) {
    const horoInstance = new Horoscope();
    const horos = await horoInstance.getActualHoro();
    const {signes} = horoInstance;
    res.render('index', {
        title: 'Horo',
        horos,
        signes: signes
    });
});

module.exports = router;
