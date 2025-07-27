'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MediaTypes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    await queryInterface.addIndex("MediaTypes", ["type"], { unique: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("MediaTypes");
  },
};
