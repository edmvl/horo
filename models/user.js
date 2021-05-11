module.exports = (sequelize, DataTypes) => {
    return sequelize.define("user", {
        id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        telegram_id: DataTypes.INTEGER,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        username: DataTypes.STRING,
        sign: DataTypes.STRING
    });
};

