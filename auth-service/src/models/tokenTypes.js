const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const TokenTypes = sequelize.define(
    "TokenTypes",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "TokenTypes",
      timestamps: true,
    }
  );
  return TokenTypes;
};
