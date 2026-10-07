'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'India',
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
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

    await queryInterface.addIndex('branches', ['name'], {
      unique: true,
      name: 'branches_name_unique_idx'
    });
    await queryInterface.addIndex('branches', ['city'], {
      name: 'branches_city_idx'
    });
    await queryInterface.addIndex('branches', ['status'], {
      name: 'branches_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('branches');
  }
};
