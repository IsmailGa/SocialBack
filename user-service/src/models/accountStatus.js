const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const AccountStatus = sequelize.define('AccountStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'AccountStatuses',
    timestamps: true,
    updatedAt: false,
  });
  return AccountStatus;
};