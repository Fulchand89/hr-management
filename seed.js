const { sequelize, User } = require('./src/models');
const { ROLES } = require('./src/constants/roles');
const { USER_STATUS } = require('./src/constants/status');
const { closeConnection } = require('./src/config/db');
const logger = require('./src/config/logger');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connected to database. Starting seeding...');

    // Synchronize or check User table
    await sequelize.sync();

    // 1. Super Admin
    const adminEmail = 'admin@hrmanagement.com';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        password: 'AdminPassword@123',
        role: ROLES.ADMIN,
        department: 'Executive',
        designation: 'Chief Technology Officer',
        phone: '+1-555-0100',
        status: USER_STATUS.ACTIVE
      });
      logger.success(`Seeded Admin User: ${admin.email} (Password: AdminPassword@123)`);
    } else {
      logger.info(`Admin user already exists: ${adminEmail}`);
    }

    // 2. HR Manager
    const hrEmail = 'hr@hrmanagement.com';
    let hr = await User.findOne({ where: { email: hrEmail } });
    if (!hr) {
      hr = await User.create({
        firstName: 'Sarah',
        lastName: 'Connor',
        email: hrEmail,
        password: 'HrPassword@123',
        role: ROLES.HR,
        department: 'Human Resources',
        designation: 'HR Lead Specialist',
        phone: '+1-555-0101',
        status: USER_STATUS.ACTIVE
      });
      logger.success(`Seeded HR User: ${hr.email} (Password: HrPassword@123)`);
    } else {
      logger.info(`HR user already exists: ${hrEmail}`);
    }

    // 3. Sample Employee
    const empEmail = 'john.doe@hrmanagement.com';
    let emp = await User.findOne({ where: { email: empEmail } });
    if (!emp) {
      emp = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: empEmail,
        password: 'UserPassword@123',
        role: ROLES.EMPLOYEE,
        department: 'Engineering',
        designation: 'Full Stack Developer',
        phone: '+1-555-0102',
        status: USER_STATUS.ACTIVE
      });
      logger.success(`Seeded Employee User: ${emp.email} (Password: UserPassword@123)`);
    } else {
      logger.info(`Employee user already exists: ${empEmail}`);
    }

    logger.success('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
};

seedDatabase();
