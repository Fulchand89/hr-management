'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Conversations Table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastMessageId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('conversations', ['lastMessageAt'], {
      name: 'idx_conversations_last_message_at'
    });
    await queryInterface.addIndex('conversations', ['type'], {
      name: 'idx_conversations_type'
    });

    // 2. Conversation Participants Table
    await queryInterface.createTable('conversation_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member'
      },
      unreadCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      lastReadMessageId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      lastReadAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isMuted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      clearedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('conversation_participants', ['conversationId', 'userId'], {
      unique: true,
      name: 'uk_conv_participants_conv_user'
    });
    await queryInterface.addIndex('conversation_participants', ['userId'], {
      name: 'idx_conv_participants_user_id'
    });

    // 3. Chat Messages Table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      messageType: {
        type: Sequelize.ENUM('text', 'image', 'document', 'audio', 'system'),
        allowNull: false,
        defaultValue: 'text'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      fileSize: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      replyToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'read'),
        allowNull: false,
        defaultValue: 'sent'
      },
      isDeletedForEveryone: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('chat_messages', ['conversationId', 'createdAt'], {
      name: 'idx_chat_messages_conv_created'
    });
    await queryInterface.addIndex('chat_messages', ['senderId'], {
      name: 'idx_chat_messages_sender_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('conversation_participants');
    await queryInterface.dropTable('conversations');
  }
};
