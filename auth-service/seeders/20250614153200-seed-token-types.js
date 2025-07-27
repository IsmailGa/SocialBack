"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "TokenTypes",
      [
        {
          token: "emailVerification",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          token: "passwordReset",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("TokenTypes", null, {});
  },
};
