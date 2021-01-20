const sqlite = require('sqlite-sync');
const TelegramBot = require('node-telegram-bot-api');
const Horoscope = require('./services/horo');

class Telegram {
    bot;
    horoInstance;

    constructor() {
        this.horoInstance = new Horoscope();
        this.bot = new TelegramBot(process.env.horo_telegram_bot_token, {
            polling: true,
            filepath: false,
        });
        sqlite.connect('./horo.db');
        sqlite.run(`
        CREATE TABLE IF NOT EXISTS users(
              telegram_id INTEGER NOT NULL UNIQUE,
              first_name  TEXT,
              last_name   TEXT,
              username    TEXT,
              sign        TEXT
            );`, (res) => {
            if (res.error) {
                console.log(res.error);
            }
        });

        this.bot.on("polling_error", console.log);
        this.bot.on("message", (msg) => {
            const chatId = msg.chat.id;
            const first_name = msg.from.first_name;
            const last_name = msg.from.last_name;
            const username = msg.from.username;
            const users = sqlite.run(
                "SELECT * FROM users where telegram_id = ?", [chatId]);
            if (msg.text == "/start") {
                if (users.length > 0) {
                    this.bot.sendMessage(chatId, 'Вы уже подписаны на гороскопы').catch((err) => {
                        console.log(err);
                    });
                } else {
                    sqlite.insert("users", {
                        telegram_id: chatId,
                        first_name: first_name,
                        last_name: last_name,
                        username: username,
                    }, (res) => {
                        if (res.error) {
                            console.log(res.error);
                        }
                    });
                    let keyboard = [];
                    let keyboardData = [];
                    let counter = 0;
                    for (let sign in this.horoInstance.signes) {
                        keyboardData.push({
                            text: this.horoInstance.signes[sign].rus,
                            callback_data: JSON.stringify({
                                sign,
                                chatId
                            })
                        });
                        counter++;
                        if (counter > 3) {
                            counter = 0;
                            keyboard.push(keyboardData);
                            keyboardData = [];
                        }
                    }
                    const opt = {
                        parse_mode: 'markdown',
                        disable_web_page_preview: true,
                        reply_markup: JSON.stringify({
                            inline_keyboard: keyboard
                        })
                    };
                    this.bot.sendMessage(chatId, 'Выберите знак зодиака', opt);
                }
            } else if (msg.text == "/stop") {
                sqlite.run(
                    "DELETE FROM users WHERE `telegram_id` = ?",
                    [chatId]);
                this.bot.sendMessage(chatId, 'Вы отписались от гороскопов');
            } else if (msg.text == "/get") {
                this.sendHoroscopes(chatId)
            }
        });
        this.bot.on('callback_query', (msg) => {
            const answer = msg.data.split('_');
            const data = JSON.parse(answer[0]);
            const {sign, chatId} = data;
            this.bot.sendMessage(chatId,
                `Вы выбрали: ${this.horoInstance.signes[sign].rus} \nПолучить гороскоп на сегодня: /get`);
            sqlite.update('users', {sign: sign}, {telegram_id: chatId})
        });
    }

    sendHoroscopes(chatId = null) {
        let statement = "SELECT * FROM users";
        if (chatId !== null) {
            statement += ` where telegram_id=${chatId}`
        }
        let users = sqlite.run(statement);
        users.forEach((userEntry) => {
            const signes = this.horoInstance.signes;
            let actualHoro = this.horoInstance.getActualHoro(userEntry.sign);
            for (let i = 0; i < actualHoro.length; i++) {
                let text = `Гороскоп на  ${this.getDateInRussiaLocale()} \n ${signes[actualHoro[i][1]].rus}\n${actualHoro[i][2]}`;
                this.bot.sendMessage(userEntry.telegram_id, text + "\n");
            }
        });
    }

    getDateInRussiaLocale() {
        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth();
        const monthes = [
            "Января", "Февраля", "Марта",
            "Апреля", "Мая", "Июня",
            "Июля", "Августа", "Сентября",
            "Октября", "Ноября", "Декабря"
        ];
        return day + " " + monthes[month];
    }
}

module.exports = Telegram;
