'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Messages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mediaTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mediaUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      replyToMessageId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    });
    await queryInterface.addIndex("Messages", ["conversationId", "createdAt"]);
    await queryInterface.addIndex("Messages", ["senderId"]);
    await queryInterface.addIndex("Messages", ["mediaTypeId"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Messages");
  },
};
