const express = require("express");
const router = express.Router();

const { errorHandler } = require("../middleware/error.middleware");
const { validateUserToken } = require("../middleware/auth.middleware");
const {getUserConversations, getConversationMessages, sendMessage} = require("../controllers/message.controller");
const multer = require("multer");
const path = require("path");

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.use(errorHandler);

// Получить список чатов пользователя
router.get('/conversations', validateUserToken, getUserConversations);

// Получить историю сообщений в чате
router.get('/conversations/:id/messages', validateUserToken, getConversationMessages);

// Отправить сообщение (создаёт чат, если его нет), поддержка файлов
router.post('/messages', validateUserToken, upload.single('file'), sendMessage);

module.exports = router;
