const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const MediaType = sequelize.define(
    "MediaType",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      indexes: [{ unique: true, fields: ["type"] }],
      timestamps: false,
    }
  );
  return MediaType;
};
