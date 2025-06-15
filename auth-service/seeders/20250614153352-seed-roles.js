'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Roles', [
      { id: 1, name: 'admin', createdAt: new Date() },
      { id: 2, name: 'moderator', createdAt: new Date() },
      { id: 3, name: 'user', createdAt: new Date() },
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
  },
};