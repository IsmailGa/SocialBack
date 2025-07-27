const { Message, MediaType } = require("../models");
const logger = require("../utils/logger");
const { Conversation, ConversationParticipant } = require("../models");
const { axiosUser } = require("../utils/api/axios");
const path = require('path');

// Получить список чатов пользователя
const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const checkUser = axiosUser
      .get(`/${userId}`)
      .then((res) => res.data)
      .catch((err) => logger.error(err.message));

    logger.info("Потдвердил пользователя", checkUser);

    // Находим все чаты, где участвует пользователь
    const participants = await ConversationParticipant.findAll({
      where: { userId },
    });

    if (!participants) {
      logger.error("Нет такого пользователя в чате");
      return;
    }
    // Находим все существующие айдишки с чатом
    const conversationIds = participants.map((p) => p.conversationId);

    if (!conversationIds) {
      logger.error("Нет чата");
      return;
    }
    // Находим все существующие чаты к которому привязан пользователь
    const conversations = await Conversation.findAll({
      where: { id: conversationIds },
    });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// Получить историю сообщений в чате
const getConversationMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    // Проверяем, что пользователь участник чата
    const userId = req.user.id;
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId },
    });
    if (!isParticipant)
      return res.status(403).json({ message: "Not a participant" });
    const messages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// Отправить сообщение (создаёт чат, если его нет)
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, replyToMessageId } = req.body;
    const senderId = req.user.id;
    // Валидация
    if (!recipientId || (!content && !req.file)) {
      return res.status(400).json({ message: "recipientId и content или файл обязательны" });
    }
    if (recipientId === senderId) {
      return res.status(400).json({ message: "Нельзя отправить сообщение самому себе" });
    }
    let conversation;
    // Ищем существующий личный чат только между этими двумя пользователями
    const senderChats = await ConversationParticipant.findAll({ where: { userId: senderId } });
    const recipientChats = await ConversationParticipant.findAll({ where: { userId: recipientId } });
    const senderChatIds = senderChats.map(e => e.conversationId);
    const recipientChatIds = recipientChats.map(e => e.conversationId);
    const commonChatId = senderChatIds.find(id => recipientChatIds.includes(id));
    if (commonChatId) {
      const conv = await Conversation.findOne({ where: { id: commonChatId, isGroup: false } });
      if (conv) conversation = conv;
    }
    if (!conversation) {
      // Создаём новый чат и участников
      conversation = await Conversation.create({ isGroup: false });
      await ConversationParticipant.bulkCreate([
        { conversationId: conversation.id, userId: senderId },
        { conversationId: conversation.id, userId: recipientId },
      ]);
    }
    // Сохраняем файл, если он есть
    let mediaUrl = null;
    let mediaTypeId = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      // Определяем тип файла по расширению
      const ext = path.extname(req.file.originalname).toLowerCase();
      let type = null;
      if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) type = "image";
      else if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) type = "video";
      else if ([".mp3", ".wav", ".ogg", ".aac", ".flac"].includes(ext)) type = "audio";
      else if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".zip", ".rar"].includes(ext)) type = "document";
      // Можно добавить другие типы
      if (type) {
        const mediaType = await MediaType.findOne({ where: { type } });
        if (mediaType) mediaTypeId = mediaType.id;
      }
    }
    // Создаём сообщение
    const message = await Message.create({
      conversationId: conversation.id,
      senderId,
      content,
      mediaTypeId,
      createdAt: new Date(),
      isRead: false,
      isDeleted: false,
      mediaUrl,
      replyToMessageId: replyToMessageId || null,
    });
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserConversations,
  getConversationMessages,
  sendMessage,
};
