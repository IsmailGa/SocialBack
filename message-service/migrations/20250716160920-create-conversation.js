'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Conversations", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      isGroup: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    await queryInterface.addIndex("Conversations", ["isGroup", "createdAt"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Conversations");
  },
};
