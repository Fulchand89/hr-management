const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
const { initUserModel } = require('./User');

// Initialize models
const User = initUserModel(sequelize);

// Model registry
const db = {
  sequelize,
  Sequelize,
  User
};

module.exports = db;
