'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      documentType: {
        type: Sequelize.ENUM('resume', 'offer_letter', 'id_proof', 'address_proof', 'education', 'experience', 'tax_doc', 'other'),
        defaultValue: 'id_proof',
        allowNull: false
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
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

    await queryInterface.addIndex('employee_documents', ['userId'], {
      name: 'employee_documents_user_id_idx'
    });
    await queryInterface.addIndex('employee_documents', ['documentType'], {
      name: 'employee_documents_type_idx'
    });
    await queryInterface.addIndex('employee_documents', ['verificationStatus'], {
      name: 'employee_documents_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_documents');
  }
};
