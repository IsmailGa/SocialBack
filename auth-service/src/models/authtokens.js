const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const AuthToken = sequelize.define(
    "AuthToken",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tokenTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "TokenTypes",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "AuthTokens",
      timestamps: true,
    }
  );
  return AuthToken;
};
