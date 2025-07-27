"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "MediaTypes",
      [
        {
          id: 1,
          type: "image",
          description: "Картинка/Фото",
          createdAt: new Date(),
        },
        { id: 2, type: "video", description: "Видео", createdAt: new Date() },
        { id: 3, type: "audio", description: "Аудио", createdAt: new Date() },
        {
          id: 4,
          type: "document",
          description: "Документ/Файл",
          createdAt: new Date(),
        },
        {
          id: 5,
          type: "voice",
          description: "Голосовое сообщение",
          createdAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("MediaTypes", null, {});
  },
};
