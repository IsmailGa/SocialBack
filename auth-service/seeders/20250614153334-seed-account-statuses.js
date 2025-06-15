'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('AccountStatuses', [
      { id: 1, name: 'active', createdAt: new Date() },
      { id: 2, name: 'banned', createdAt: new Date() },
      { id: 3, name: 'deleted', createdAt: new Date() },
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('AccountStatuses', null, {});
  },
};