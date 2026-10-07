const { Op } = require('sequelize');
const { Department, User, ActivityLog } = require('../models');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');

class DepartmentService {
  /**
   * 1. Get all departments with search, status filtering, head details, and employee count
   */
  async getAllDepartments(query = {}) {
    const { search, status, sortBy = 'name', order = 'ASC' } = query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: User,
          as: 'departmentHead',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email', 'avatar']
        },
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email', 'designation', 'status']
        }
      ],
      order: [[sortBy, order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']]
    });

    // Augment with employee count
    return departments.map((dept) => {
      const json = dept.toJSON();
      json.employeeCount = json.employees ? json.employees.length : 0;
      return json;
    });
  }

  /**
   * 2. Get single department with 360° overview and member roster
   */
  async getDepartmentById(id) {
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'departmentHead',
          attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email', 'avatar', 'phone']
        },
        {
          model: User,
          as: 'employees',
          attributes: [
            'id',
            'employeeCode',
            'firstName',
            'lastName',
            'email',
            'designation',
            'status',
            'avatar',
            'joiningDate'
          ]
        }
      ]
    });

    if (!department) {
      throw new NotFoundError(`Department not found with ID ${id}`);
    }

    const json = department.toJSON();
    json.employeeCount = json.employees ? json.employees.length : 0;
    return json;
  }

  /**
   * 3. Create a new department
   */
  async createDepartment(payload, actor = null) {
    const trimmedName = payload.name.trim();

    // Check name uniqueness
    const existingName = await Department.findOne({ where: { name: trimmedName } });
    if (existingName) {
      throw new ConflictError(`Department with name '${trimmedName}' already exists`);
    }

    // Check code uniqueness if provided
    let trimmedCode = payload.code ? payload.code.trim().toUpperCase() : null;
    if (trimmedCode) {
      const existingCode = await Department.findOne({ where: { code: trimmedCode } });
      if (existingCode) {
        throw new ConflictError(`Department with code '${trimmedCode}' already exists`);
      }
    } else {
      // Auto-generate 3-letter code if not provided
      trimmedCode = trimmedName.slice(0, 3).toUpperCase();
      const codeExists = await Department.findOne({ where: { code: trimmedCode } });
      if (codeExists) {
        trimmedCode = `${trimmedCode}${Math.floor(Math.random() * 90 + 10)}`;
      }
    }

    // Verify Head User if provided
    if (payload.headId) {
      const headUser = await User.findByPk(payload.headId);
      if (!headUser) {
        throw new NotFoundError(`Selected Department Head user not found with ID ${payload.headId}`);
      }
    }

    const department = await Department.create({
      name: trimmedName,
      code: trimmedCode,
      headId: payload.headId || null,
      description: payload.description || null,
      status: payload.status || 'active'
    });

    // Audit log
    if (ActivityLog) {
      try {
        await ActivityLog.create({
          userId: actor ? actor.id : null,
          action: 'CREATE_DEPARTMENT',
          module: 'DEPARTMENT',
          targetId: department.id,
          ipAddress: 'INTERNAL',
          details: `Created new department '${department.name}' (${department.code})`
        });
      } catch (e) {
        // non-blocking
      }
    }

    return await this.getDepartmentById(department.id);
  }

  /**
   * 4. Update department details
   */
  async updateDepartment(id, payload, actor = null) {
    const department = await Department.findByPk(id);
    if (!department) {
      throw new NotFoundError(`Department not found with ID ${id}`);
    }

    // Check name uniqueness if updated
    if (payload.name && payload.name.trim() !== department.name) {
      const trimmedName = payload.name.trim();
      const existingName = await Department.findOne({ where: { name: trimmedName } });
      if (existingName) {
        throw new ConflictError(`Department with name '${trimmedName}' already exists`);
      }
      department.name = trimmedName;
    }

    // Check code uniqueness if updated
    if (payload.code && payload.code.trim().toUpperCase() !== department.code) {
      const trimmedCode = payload.code.trim().toUpperCase();
      const existingCode = await Department.findOne({ where: { code: trimmedCode } });
      if (existingCode) {
        throw new ConflictError(`Department with code '${trimmedCode}' already exists`);
      }
      department.code = trimmedCode;
    }

    // Verify Head User if updated
    if (payload.headId !== undefined) {
      if (payload.headId) {
        const headUser = await User.findByPk(payload.headId);
        if (!headUser) {
          throw new NotFoundError(`Selected Department Head user not found with ID ${payload.headId}`);
        }
        department.headId = payload.headId;
      } else {
        department.headId = null;
      }
    }

    if (payload.description !== undefined) department.description = payload.description;
    if (payload.status !== undefined) department.status = payload.status;

    await department.save();

    // Audit log
    if (ActivityLog) {
      try {
        await ActivityLog.create({
          userId: actor ? actor.id : null,
          action: 'UPDATE_DEPARTMENT',
          module: 'DEPARTMENT',
          targetId: department.id,
          ipAddress: 'INTERNAL',
          details: `Updated department '${department.name}' details`
        });
      } catch (e) {
        // non-blocking
      }
    }

    return await this.getDepartmentById(department.id);
  }

  /**
   * 5. Delete department (Protected against deleting departments with active members)
   */
  async deleteDepartment(id, actor = null) {
    const department = await Department.findByPk(id, {
      include: [{ model: User, as: 'employees', attributes: ['id', 'firstName', 'lastName'] }]
    });

    if (!department) {
      throw new NotFoundError(`Department not found with ID ${id}`);
    }

    // Protection rule: cannot delete if employees belong to this department
    if (department.employees && department.employees.length > 0) {
      throw new BadRequestError(
        `Cannot delete department '${department.name}' because it has ${department.employees.length} active employee(s). Please reassign them to another department first.`
      );
    }

    const deptName = department.name;
    await department.destroy();

    // Audit log
    if (ActivityLog) {
      try {
        await ActivityLog.create({
          userId: actor ? actor.id : null,
          action: 'DELETE_DEPARTMENT',
          module: 'DEPARTMENT',
          targetId: id,
          ipAddress: 'INTERNAL',
          details: `Deleted department '${deptName}'`
        });
      } catch (e) {
        // non-blocking
      }
    }

    return {
      success: true,
      message: `Department '${deptName}' was deleted successfully.`
    };
  }
}

module.exports = new DepartmentService();
