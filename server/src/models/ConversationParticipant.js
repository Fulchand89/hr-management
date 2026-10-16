const { DataTypes, Model } = require('sequelize');

class ConversationParticipant extends Model {}

const initConversationParticipantModel = (sequelize) => {
  ConversationParticipant.init(
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member'
      },
      unreadCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      lastReadMessageId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isMuted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      clearedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ConversationParticipant',
      tableName: 'conversation_participants',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['conversationId', 'userId'] },
        { fields: ['userId'] }
      ]
    }
  );

  return ConversationParticipant;
};

module.exports = { ConversationParticipant, initConversationParticipantModel };
