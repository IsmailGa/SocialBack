const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      replyToMessageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Message",
          key: "id",
        },
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fileUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mediaTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      indexes: [
        { fields: ["conversationId", "createdAt"] },
        { fields: ["senderId"] },
        { fields: ["mediaTypeId"] },
      ],
      timestamps: false,
    }
  );
  return Message;
};
