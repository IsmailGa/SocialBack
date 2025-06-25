'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('AccountStatuses', [
      {
        name: 'active',
        createdAt: new Date(),
      },
      {
        name: 'inactive',
        createdAt: new Date(),
      },
      {
        name: 'suspended',
        createdAt: new Date(),
      },
      {
        name: 'banned',
        createdAt: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('AccountStatuses', null, {});
  }
}; 