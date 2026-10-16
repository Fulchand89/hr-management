const { DataTypes, Model } = require('sequelize');

class Conversation extends Model {}

const initConversationModel = (sequelize) => {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      type: {
        type: DataTypes.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      departmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      lastMessageId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'conversations',
      timestamps: true,
      indexes: [
        { fields: ['lastMessageAt'] },
        { fields: ['type'] }
      ]
    }
  );

  return Conversation;
};

module.exports = { Conversation, initConversationModel };
