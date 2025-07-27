const sendMessage = async (data) => {
  try {
    const { recipientId, content, replyToMessageId } = data;
    const senderId = req.user.id;
    // Валидация
    if (!recipientId || !content) {
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
      // Определяем тип файла через утилиту
      const ext = path.extname(req.file.originalname).toLowerCase();
      const type = getMediaTypeByExtension(ext);
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
    sendMessage
}