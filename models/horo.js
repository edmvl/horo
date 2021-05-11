module.exports = (sequelize, DataTypes) => {
    return sequelize.define("horo", {
        id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
        date: DataTypes.STRING,
        sign: DataTypes.STRING,
        text: DataTypes.TEXT
    });
};
