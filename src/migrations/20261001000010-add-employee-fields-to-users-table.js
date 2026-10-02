'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'employeeCode', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('users', 'departmentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('users', 'branchId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('users', 'managerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('users', 'joiningDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'salary', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'dob', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: true
    });

    // Add indexes
    await queryInterface.addIndex('users', ['employeeCode'], {
      unique: true,
      name: 'users_employee_code_unique_idx'
    });
    await queryInterface.addIndex('users', ['departmentId'], {
      name: 'users_department_id_idx'
    });
    await queryInterface.addIndex('users', ['branchId'], {
      name: 'users_branch_id_idx'
    });
    await queryInterface.addIndex('users', ['managerId'], {
      name: 'users_manager_id_idx'
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('users', 'users_employee_code_unique_idx');
      await queryInterface.removeIndex('users', 'users_department_id_idx');
      await queryInterface.removeIndex('users', 'users_branch_id_idx');
      await queryInterface.removeIndex('users', 'users_manager_id_idx');
    } catch (e) {}

    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'dob');
    await queryInterface.removeColumn('users', 'salary');
    await queryInterface.removeColumn('users', 'joiningDate');
    await queryInterface.removeColumn('users', 'managerId');
    await queryInterface.removeColumn('users', 'branchId');
    await queryInterface.removeColumn('users', 'departmentId');
    await queryInterface.removeColumn('users', 'employeeCode');
  }
};
