'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add departmentId
    await queryInterface.addColumn('designations', 'departmentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Add minSalary
    await queryInterface.addColumn('designations', 'minSalary', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });

    // 3. Add maxSalary
    await queryInterface.addColumn('designations', 'maxSalary', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });

    // 4. Add level
    await queryInterface.addColumn('designations', 'level', {
      type: Sequelize.ENUM(
        'entry',
        'junior',
        'mid',
        'senior',
        'lead',
        'manager',
        'executive',
        'director'
      ),
      defaultValue: 'mid',
      allowNull: false
    });

    // 5. Add index on departmentId
    await queryInterface.addIndex('designations', ['departmentId'], {
      name: 'designations_department_id_idx'
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('designations', 'designations_department_id_idx');
    } catch (err) {
      // ignore if index removal fails
    }
    await queryInterface.removeColumn('designations', 'departmentId');
    await queryInterface.removeColumn('designations', 'minSalary');
    await queryInterface.removeColumn('designations', 'maxSalary');
    await queryInterface.removeColumn('designations', 'level');
  }
};
