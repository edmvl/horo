const sqlite = require('sqlite-sync');
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
        sqlite.connect('./horo.db');
        sqlite.run(`
            CREATE TABLE IF NOT EXISTS horo (
                date TEXT NOT NULL,
                sign TEXT NOT NULL,
                text TEXT NOT NULL
            );
        `, (res) => {
            console.log(res)
        });
    }

    updateHoros() {
        for (let sign in this.signes) {
            request(
                'https://horo.mail.ru/prediction/' + sign + '/today',
                (err, response, body) => {
                    const $ = cheerio.load(body);
                    const text = $('.article__item').text();
                    const date = new Date().toLocaleDateString();
                    if (this.getActualHoro(sign, date).length === 0) {
                        sqlite.insert('horo', {date: date, sign: sign, text: text}, (res) => {
                            console.log(res);
                        })
                    }
                }
            );
        }
    }

    getActualHoro(sign = null, inDate = null) {
        const date = inDate || new Date().toLocaleDateString();
        let statement = `
          SELECT * FROM horo 
          WHERE date='${date}'
        `;
        if (sign) {
            statement += ` AND sign='${sign}'`;
        }
        statement += ";";
        var rows = sqlite.run(statement);
        return rows.length > 0 ? rows[0].values : [];
    }
}

module.exports = Horoscope;
