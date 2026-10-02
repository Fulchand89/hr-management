const { DataTypes, Model } = require('sequelize');

class EmployeeDocument extends Model {}

const initEmployeeDocumentModel = (sequelize) => {
  EmployeeDocument.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      documentType: {
        type: DataTypes.ENUM('resume', 'offer_letter', 'id_proof', 'address_proof', 'education', 'experience', 'tax_doc', 'other'),
        defaultValue: 'id_proof',
        allowNull: false
      },
      fileUrl: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      verificationStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'EmployeeDocument',
      tableName: 'employee_documents',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['documentType'] },
        { fields: ['verificationStatus'] }
      ]
    }
  );

  return EmployeeDocument;
};

module.exports = { EmployeeDocument, initEmployeeDocumentModel };
