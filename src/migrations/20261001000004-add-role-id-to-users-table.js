'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'roleId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('users', ['roleId'], {
      name: 'users_role_id_idx'
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('users', 'users_role_id_idx');
    } catch (err) {
      // index might not exist in some dialects
    }
    await queryInterface.removeColumn('users', 'roleId');
  }
};
