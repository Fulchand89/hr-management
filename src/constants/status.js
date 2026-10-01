const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

const ALL_STATUSES = Object.values(USER_STATUS);

module.exports = {
  USER_STATUS,
  ALL_STATUSES
};
