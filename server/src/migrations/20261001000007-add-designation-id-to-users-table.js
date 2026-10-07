'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'designationId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'designations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('users', ['designationId'], {
      name: 'users_designation_id_idx'
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('users', 'users_designation_id_idx');
    } catch (err) {
      // index may not exist in some dialects
    }
    await queryInterface.removeColumn('users', 'designationId');
  }
};
