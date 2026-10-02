'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company_assets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      assetName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      serialNumber: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      category: {
        type: Sequelize.ENUM('laptop', 'desktop', 'monitor', 'mobile', 'tablet', 'furniture', 'peripherals', 'other'),
        defaultValue: 'laptop',
        allowNull: false
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      returnedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      condition: {
        type: Sequelize.ENUM('new', 'good', 'fair', 'damaged'),
        defaultValue: 'good',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('available', 'allocated', 'under_repair', 'retired'),
        defaultValue: 'available',
        allowNull: false
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

    await queryInterface.addIndex('company_assets', ['serialNumber'], {
      unique: true,
      name: 'company_assets_serial_unique_idx'
    });
    await queryInterface.addIndex('company_assets', ['assignedTo'], {
      name: 'company_assets_assigned_to_idx'
    });
    await queryInterface.addIndex('company_assets', ['status'], {
      name: 'company_assets_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('company_assets');
  }
};
