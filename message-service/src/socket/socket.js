const logger = require("../utils/logger")
const { authenticateSocket, joinChat, sendMessage } = require("./socketControllers");

const socketHandler = (io) => {
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    logger.info(`Пользователь ${socket.user?.id} подключился по сокету`);
    joinChat(socket);
    sendMessage(io, socket);
    socket.on("disconnect", () => {
      logger.info(`Пользователь ${socket.user?.id} отключился`);
    });
  });
};

module.exports = {
    socketHandler
}