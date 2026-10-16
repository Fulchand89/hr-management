const { DataTypes, Model } = require('sequelize');

class ChatMessage extends Model {}

const initChatMessageModel = (sequelize) => {
  ChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'document', 'audio', 'system'),
        allowNull: false,
        defaultValue: 'text'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      fileUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      fileSize: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      replyToId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read'),
        allowNull: false,
        defaultValue: 'sent'
      },
      isDeletedForEveryone: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ChatMessage',
      tableName: 'chat_messages',
      timestamps: true,
      indexes: [
        { fields: ['conversationId', 'createdAt'] },
        { fields: ['senderId'] }
      ]
    }
  );

  return ChatMessage;
};

module.exports = { ChatMessage, initChatMessageModel };
