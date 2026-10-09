const { DataTypes, Model } = require('sequelize');

class CompanyPolicy extends Model {}

const initCompanyPolicyModel = (sequelize) => {
  CompanyPolicy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      policyCode: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'general'
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT('long'),
        allowNull: false
      },
      currentVersion: {
        type: DataTypes.STRING(15),
        defaultValue: '1.0',
        allowNull: false
      },
      attachmentUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isMandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      targetAudience: {
        type: DataTypes.STRING(50),
        defaultValue: 'all',
        allowNull: false
      },
      targetDepartmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      effectiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'published',
        allowNull: false
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      }
    },
    {
      sequelize,
      modelName: 'CompanyPolicy',
      tableName: 'company_policies',
      timestamps: true,
      indexes: [
        { fields: ['policyCode'], unique: true },
        { fields: ['category'] },
        { fields: ['status'] },
        { fields: ['isMandatory'] }
      ]
    }
  );

  return CompanyPolicy;
};

module.exports = { CompanyPolicy, initCompanyPolicyModel };
