const {Horo} = require('../models');
const request = require('request');
const cheerio = require('cheerio');

class Horoscope {
    signes = {
        'aries': {rus: 'Овен'},
        'taurus': {rus: 'Телец'},
        'gemini': {rus: 'Близнецы'},
        'cancer': {rus: 'Рак'},
        'leo': {rus: 'Лев'},
        'virgo': {rus: 'Дева'},
        'libra': {rus: 'Весы'},
        'scorpio': {rus: 'Скорпион'},
        'sagittarius': {rus: 'Стрелец'},
        'capricorn': {rus: 'Козерог'},
        'aquarius': {rus: 'Водолей'},
        'pisces': {rus: 'Рыбы'},
    };

    constructor() {
        Horo.sync();
    }

    updateHoros() {
        for (let sign in this.signes) {
            request(
                'https://horo.mail.ru/prediction/' + sign + '/today',
                async (err, response, body) => {
                    const $ = cheerio.load(body);
                    const text = $('.article__item').text();
                    const date = new Date().toLocaleDateString();
                    const actualHoro = await this.getActualHoro(sign, date);
                    if (actualHoro.length === 0) {
                        Horo.create({
                            date,
                            sign,
                            text
                        })
                    }
                }
            );
        }
    }

    async getActualHoro(sign = null, inDate = null) {
        let where = {
            date: inDate || new Date().toLocaleDateString()
        }
        if (sign) {
            where.sign = sign;
        }
        const res = await Horo.findAll({
            where
        });
        let horos = [];
        for (let i = 0; i < res.length; i++) {
            horos.push(res[i].dataValues)
        }
        return horos;
    }
}

module.exports = Horoscope;
