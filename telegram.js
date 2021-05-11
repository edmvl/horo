const {User} = require('./models');
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
        User.sync();
        this.bot.on("polling_error", console.log);
        this.bot.on("message", async (msg) => {
            const chatId = msg.chat.id;
            const {first_name, last_name, username} = msg.from;
            const users = await User.findAll({
                where: {telegram_id: chatId}
            });
            if (msg.text == "/start") {
                if (users.length > 0) {
                    this.bot.sendMessage(chatId, 'Вы уже подписаны на гороскопы').catch((err) => {
                        console.log(err);
                    });
                } else {
                    User.create({
                        telegram_id: chatId,
                        first_name: first_name,
                        last_name: last_name,
                        username: username,
                    })
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
                User.remove({
                    where: {telegram_id: chatId}
                })
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
            User.update(
                {sign},
                {
                    where: {telegram_id: chatId}
                }
            );
        });
    }

    async sendHoroscopes(chatId = null) {
        let props = {};
        if (chatId !== null) {
            props.where = {telegram_id: chatId}
        }
        let users = await User.findAll(props);
        const {signes} = this.horoInstance;
        for (let i = 0; i < users.length; i++) {
            const userEntry = users[i].dataValues;
            let actualHoro = await this.horoInstance.getActualHoro(userEntry.sign);
            for (let i = 0; i < actualHoro.length; i++) {
                let text = `Гороскоп на  ${this.getDateInRussiaLocale()} \n ${signes[actualHoro[i].sign].rus}\n${actualHoro[i].text}`;
                this.bot.sendMessage(userEntry.telegram_id, text + "\n");
            }
        }
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
