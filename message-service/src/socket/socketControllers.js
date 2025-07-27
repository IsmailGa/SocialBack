const {
  Message,
  Conversation,
  ConversationParticipant,
  MediaType,
} = require("../models");
const logger = require("../utils/logger");
const { axiosAuth } = require("../utils/api/axios");
const { getMediaTypeByExtension } = require("../utils/fileType");
const path = require("path");
const fs = require("fs");

// Проверка авторизации пользователя по токену
async function authenticateSocket(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];
  if (!token) {
    return next(new Error("No token provided"));
  }
  try {
    const response = await axiosAuth.post(
      "/validate-token",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    socket.user = response.data.user;
    next();
  } catch (error) {
    logger.warn("Socket token validation failed", { error: error.message });
    next(new Error("Invalid token"));
  }
}

// Присоединение к чату
function joinChat(socket) {
  socket.on("join chat", (conversationId) => {
    socket.join(conversationId);
    logger.info(
      `Пользователь ${socket.user?.id} присоединился к чату ${conversationId}`
    );
  });
}

// Отправка сообщения через сокет
function sendMessage(io, socket) {
  socket.on("send message", async (data) => {
    try {
      const { conversationId, content, replyToMessageId, fileData, fileName } =
        data;
      const senderId = socket.user.id;

      // Проверяем наличие разговора
      const convo = await Conversation.findByPk(conversationId);
      if (!convo) {
        return socket.emit("error", { message: "Conversation not found" });
      }

      // Проверяем, что пользователь участник
      const isParticipant = await ConversationParticipant.findOne({
        where: { conversationId, userId: senderId },
      });
      if (!isParticipant) {
        return socket.emit("error", { message: "Not a participant" });
      }

      let mediaTypeId = null;
      let fileUrl = null;

      if (fileData && fileName) {
        // Определяем расширение и media type
        const ext = path.extname(fileName).slice(1);
        const type = getMediaTypeByExtension(ext);
        if (type) {
          const mediaType = await MediaType.findOne({ where: { type } });
          if (mediaType) mediaTypeId = mediaType.id;
        }

        // Сохраняем файл асинхронно
        const base64Data = fileData.replace(/^data:.+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const uploadPath = path.join("uploads", `${Date.now()}_${fileName}`);
        await fs.promises.writeFile(uploadPath, buffer);
        fileUrl = uploadPath;
      }

      // Сохраняем сообщение
      const message = await Message.create({
        conversationId,
        senderId,
        content: content || "",
        replyToMessageId: replyToMessageId || null,
        mediaTypeId,
        fileUrl, // <-- ссылка в БД
        // createdAt, isRead, isDeleted —
        // если в модели есть defaults, можно не указывать
      });

      io.to(conversationId).emit("new message", message);
      logger.info(`Сообщение отправлено в чат ${conversationId}`);
    } catch (error) {
      logger.error("Ошибка при отправке сообщения через сокет:", error);
      socket.emit("error", { message: "Ошибка при отправке сообщения" });
    }
  });
}

function editMessage(io, socket) {
  socket.on("edit message", async (data) => {
    try {
      const updatedData = data; // conversationId, content, replyToMessageId
      const senderId = socket.user.id;

      if (
        !updatedData.conversationId ||
        !updatedData.content ||
        !updatedData.replyToMessageId
      ) {
        logger.error(
          "Ошибка при получении conversationId, content, replyToMessageId"
        );
      }

      // Проверяем наличие разговора
      const convo = await Conversation.findByPk(updatedData.conversationId);
      if (!convo) {
        return socket.emit("error", { message: "Conversation not found" });
      }

      // Проверяем, что пользователь участник
      const isParticipant = await ConversationParticipant.findOne({
        where: { conversationId: updatedData.conversationId, userId: senderId },
      });
      if (!isParticipant) {
        return socket.emit("error", { message: "Not a participant" });
      }

      // Сохраняем сообщение
      const message = await Message.update(content, {
        where: {conversationId: updatedData.conversationId, senderId: senderId},
      });

      io.to(updatedData.conversationId).emit("new message", message);
      logger.info(`Сообщение отправлено в чат ${updatedData.conversationId}`);
    } catch (error) {
      logger.error("Ошибка при отправке сообщения через сокет:", error);
      socket.emit("error", { message: "Ошибка при отправке сообщения" });
    }
  });
}

module.exports = {
  authenticateSocket,
  joinChat,
  sendMessage,
  editMessage,
};
