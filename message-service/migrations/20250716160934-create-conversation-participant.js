'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ConversationParticipants", {
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      joinedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });
    await queryInterface.addIndex("ConversationParticipants", ["conversationId", "userId"], { unique: true });
    await queryInterface.addIndex("ConversationParticipants", ["userId"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ConversationParticipants");
  },
};
