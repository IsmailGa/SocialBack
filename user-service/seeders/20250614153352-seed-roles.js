'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Roles', [
      { id: 1, role: 'admin', createdAt: new Date() },
      { id: 2, role: 'moderator', createdAt: new Date() },
      { id: 3, role: 'user', createdAt: new Date() },
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
  },
};