'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const sequelize = require(path.join(__dirname, '../../config/database.js'));
const db = {};

fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Определение связей
db.AccountStatus.hasMany(db.User, { foreignKey: 'accountStatusId' });
db.User.belongsTo(db.AccountStatus, { foreignKey: 'accountStatusId' });

db.Role.hasMany(db.User, { foreignKey: 'roleId' });
db.User.belongsTo(db.Role, { foreignKey: 'roleId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;