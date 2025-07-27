const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      indexes: [{ fields: ["isGroup", "createdAt"] }],
      timestamps: false,
    }
  );
  return Conversation;
};
