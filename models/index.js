const {Sequelize} = require("sequelize");

let sequelize = null;
try {
    sequelize = new Sequelize('postgres://horo:12345678@192.168.0.12:5432/horo');
} catch (e) {
    console.log(e)
}
const User = require("./user")(sequelize, Sequelize);
const Horo = require("./horo")(sequelize, Sequelize);
module.exports = {
    User,
    Horo
}
