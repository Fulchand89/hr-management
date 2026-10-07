const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PROBATION: 'probation',
  NOTICE_PERIOD: 'notice_period',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned'
};

const ALL_STATUSES = Object.values(USER_STATUS);

module.exports = {
  USER_STATUS,
  ALL_STATUSES
};
