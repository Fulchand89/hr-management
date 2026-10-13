const { CompanyAsset, User } = require('../models');
const ApiResponse = require('../utils/apiResponse');

const getAllAssets = async (req, res, next) => {
  try {
    const assets = await CompanyAsset.findAll({
      include: [
        {
          model: User,
          as: 'assignedEmployee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return ApiResponse.success(res, {
      message: 'Company assets retrieved successfully',
      data: assets
    });
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await CompanyAsset.create(req.body);
    return ApiResponse.created(res, {
      message: 'Company asset registered successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await CompanyAsset.destroy({ where: { id: req.params.id } });
    return ApiResponse.success(res, {
      message: 'Company asset removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAssets,
  createAsset,
  deleteAsset
};
