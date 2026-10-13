'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'mysql') {
      try {
        await queryInterface.sequelize.query(
          "ALTER TABLE notifications MODIFY COLUMN type ENUM('info','warning','success','error','announcement','leave','attendance','payroll','resignation') NOT NULL DEFAULT 'info';"
        );
      } catch (err) {
        console.warn('Could not alter notifications ENUM:', err.message);
      }

      try {
        const [columns] = await queryInterface.sequelize.query("SHOW COLUMNS FROM notifications LIKE 'actionUrl';");
        if (!columns || columns.length === 0) {
          await queryInterface.addColumn('notifications', 'actionUrl', {
            type: Sequelize.STRING(255),
            allowNull: true
          });
        }
      } catch (err) {
        console.warn('Could not add actionUrl column:', err.message);
      }
    } else {
      // SQLite fallback
      try {
        await queryInterface.addColumn('notifications', 'actionUrl', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      } catch {}
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('notifications', 'actionUrl');
    } catch {}
  }
};
