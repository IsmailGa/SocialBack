require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const sequelize = require("../config/database.js");
const { errorHandler } = require("./middleware/error.middleware");
const logger = require("./utils/logger");
const {socketHandler} = require("./socket/socket.js");
const messageRoutes = require('./routes/message.routes');
const path = require('path');

const { validateServiceAuth } = require("./middleware/auth.middleware.js");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(errorHandler);

sequelize.sync({ force: false }).then(() => {
  console.log("База данных синхронизирована");
});
// Validation of services
app.use(validateServiceAuth);
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
  });
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Отдаём загруженные файлы
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));
// Подключаем роуты сообщений
app.use('/api/v1/messages', messageRoutes);

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
