'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      targetId: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      details: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('activity_logs', ['userId'], {
      name: 'activity_logs_user_id_idx'
    });
    await queryInterface.addIndex('activity_logs', ['action'], {
      name: 'activity_logs_action_idx'
    });
    await queryInterface.addIndex('activity_logs', ['module'], {
      name: 'activity_logs_module_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  }
};
