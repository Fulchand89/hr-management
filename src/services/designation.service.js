const { Op } = require('sequelize');
const { Designation, User } = require('../models');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');

class DesignationService {
  /**
   * Get all designations with search, filtering and sorting
   */
  async getAllDesignations(query = {}) {
    const { search, department, status, sortBy = 'title', order = 'ASC' } = query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } }
      ];
    }

    if (department) where.department = department;
    if (status) where.status = status;

    return await Designation.findAll({
      where,
      include: [
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        }
      ],
      order: [[sortBy, order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']]
    });
  }

  /**
   * Get single designation by ID
   */
  async getDesignationById(id) {
    const designation = await Designation.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'status']
        }
      ]
    });

    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    return designation;
  }

  /**
   * Create a new designation
   */
  async createDesignation({ title, code, department, description, status = 'active' }) {
    const trimmedTitle = title.trim();
    const existingTitle = await Designation.findOne({ where: { title: trimmedTitle } });
    if (existingTitle) {
      throw new ConflictError(`Designation with title '${trimmedTitle}' already exists`);
    }

    if (code) {
      const trimmedCode = code.trim().toUpperCase();
      const existingCode = await Designation.findOne({ where: { code: trimmedCode } });
      if (existingCode) {
        throw new ConflictError(`Designation with code '${trimmedCode}' already exists`);
      }
    }

    return await Designation.create({
      title: trimmedTitle,
      code: code ? code.trim().toUpperCase() : null,
      department: department ? department.trim() : null,
      description,
      status
    });
  }

  /**
   * Update designation
   */
  async updateDesignation(id, updateData) {
    const designation = await Designation.findByPk(id);
    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    if (updateData.title && updateData.title.trim() !== designation.title) {
      const existingTitle = await Designation.findOne({
        where: { title: updateData.title.trim() }
      });
      if (existingTitle) {
        throw new ConflictError(`Designation with title '${updateData.title.trim()}' already exists`);
      }
      designation.title = updateData.title.trim();
    }

    if (updateData.code && updateData.code.trim().toUpperCase() !== designation.code) {
      const existingCode = await Designation.findOne({
        where: { code: updateData.code.trim().toUpperCase() }
      });
      if (existingCode) {
        throw new ConflictError(`Designation with code '${updateData.code.trim().toUpperCase()}' already exists`);
      }
      designation.code = updateData.code.trim().toUpperCase();
    }

    if (updateData.department !== undefined) designation.department = updateData.department;
    if (updateData.description !== undefined) designation.description = updateData.description;
    if (updateData.status !== undefined) designation.status = updateData.status;

    await designation.save();
    return designation;
  }

  /**
   * Delete designation
   */
  async deleteDesignation(id) {
    const designation = await Designation.findByPk(id, {
      include: [{ model: User, as: 'employees', attributes: ['id'] }]
    });

    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    if (designation.employees && designation.employees.length > 0) {
      throw new BadRequestError(
        `Cannot delete designation '${designation.title}' because it is assigned to ${designation.employees.length} employee(s). Reassign them first.`
      );
    }

    await designation.destroy();
    return { success: true, message: `Designation '${designation.title}' deleted successfully` };
  }
}

module.exports = new DesignationService();
