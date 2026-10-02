const { DataTypes, Model } = require('sequelize');

class CompanyAsset extends Model {}

const initCompanyAssetModel = (sequelize) => {
  CompanyAsset.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      assetName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      serialNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      category: {
        type: DataTypes.ENUM('laptop', 'desktop', 'monitor', 'mobile', 'tablet', 'furniture', 'peripherals', 'other'),
        defaultValue: 'laptop',
        allowNull: false
      },
      assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      assignedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      returnedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      condition: {
        type: DataTypes.ENUM('new', 'good', 'fair', 'damaged'),
        defaultValue: 'good',
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('available', 'allocated', 'under_repair', 'retired'),
        defaultValue: 'available',
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'CompanyAsset',
      tableName: 'company_assets',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['serialNumber'] },
        { fields: ['assignedTo'] },
        { fields: ['status'] }
      ]
    }
  );

  return CompanyAsset;
};

module.exports = { CompanyAsset, initCompanyAssetModel };
