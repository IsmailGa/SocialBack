const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const ConversationParticipant = sequelize.define(
    "ConversationParticipant",
    {
      conversationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      indexes: [
        { unique: true, fields: ["conversationId", "userId"] },
        { fields: ["userId"] },
      ],
      timestamps: false,
    }
  );
  return ConversationParticipant;
};
