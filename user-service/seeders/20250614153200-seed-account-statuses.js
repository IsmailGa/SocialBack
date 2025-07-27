"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "AccountStatuses",
      [
        {
          status: "active",
          createdAt: new Date(),
        },
        {
          status: "inactive",
          createdAt: new Date(),
        },
        {
          status: "suspended",
          createdAt: new Date(),
        },
        {
          status: "banned",
          createdAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("AccountStatuses", null, {});
  },
};
