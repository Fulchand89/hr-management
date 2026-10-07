const { Op } = require('sequelize');
const { Designation, User, Department } = require('../models');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');

class DesignationService {
  /**
   * Helper: Auto-generate code from title if not supplied
   */
  _generateCodeFromTitle(title) {
    const words = title.trim().split(/\s+/);
    const acronym = words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `DES-${acronym || 'ROLE'}-${randomSuffix}`;
  }

  /**
   * Get all designations with search, filtering, sorting, and optional pagination
   */
  async getAllDesignations(query = {}) {
    const {
      search,
      departmentId,
      department,
      status,
      level,
      sortBy = 'title',
      order = 'ASC',
      page = 1,
      limit = 20,
      paginate = false
    } = query;

    const where = {};

    // 1. Search filter across title, code, description, department
    if (search && search.trim()) {
      const term = search.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${term}%` } },
        { code: { [Op.like]: `%${term}%` } },
        { description: { [Op.like]: `%${term}%` } },
        { department: { [Op.like]: `%${term}%` } }
      ];
    }

    // 2. Specific filters
    if (departmentId) where.departmentId = departmentId;
    if (department) where.department = department;
    if (level) where.level = level;
    if (status && status !== 'all') where.status = status;

    const orderDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const validSortFields = [
      'title',
      'code',
      'department',
      'level',
      'status',
      'minSalary',
      'maxSalary',
      'createdAt'
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'title';

    const includeOptions = [
      {
        model: Department,
        as: 'departmentDetails',
        attributes: ['id', 'name', 'code'],
        required: false
      },
      {
        model: User,
        as: 'employees',
        attributes: ['id', 'firstName', 'lastName', 'email', 'status', 'employeeCode', 'avatar'],
        required: false
      }
    ];

    // If pagination requested
    if (paginate === true || paginate === 'true' || query.page !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Designation.findAndCountAll({
        where,
        include: includeOptions,
        distinct: true,
        order: [[sortField, orderDirection]],
        limit: limitNum,
        offset
      });

      const formatted = rows.map((item) => {
        const json = item.toJSON();
        json.employeeCount = json.employees ? json.employees.length : 0;
        return json;
      });

      return {
        designations: formatted,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limitNum),
          currentPage: pageNum,
          limit: limitNum
        }
      };
    }

    // Non-paginated (complete list for dropdowns and full views)
    const list = await Designation.findAll({
      where,
      include: includeOptions,
      order: [[sortField, orderDirection]]
    });

    return list.map((item) => {
      const json = item.toJSON();
      json.employeeCount = json.employees ? json.employees.length : 0;
      return json;
    });
  }

  /**
   * Get high-level Designation metrics and analytics
   */
  async getDesignationStats() {
    const all = await Designation.findAll({
      include: [
        {
          model: User,
          as: 'employees',
          attributes: ['id', 'status']
        }
      ]
    });

    const totalDesignations = all.length;
    let activeDesignations = 0;
    let inactiveDesignations = 0;
    let totalAssignedEmployees = 0;
    const levelBreakdown = {};
    const departmentBreakdown = {};

    all.forEach((desig) => {
      if (desig.status === 'active') activeDesignations++;
      else inactiveDesignations++;

      const empCount = desig.employees ? desig.employees.length : 0;
      totalAssignedEmployees += empCount;

      // Level stats
      const lvl = desig.level || 'mid';
      levelBreakdown[lvl] = (levelBreakdown[lvl] || 0) + 1;

      // Department stats
      const deptName = desig.department || 'Unassigned';
      departmentBreakdown[deptName] = (departmentBreakdown[deptName] || 0) + 1;
    });

    return {
      totalDesignations,
      activeDesignations,
      inactiveDesignations,
      totalAssignedEmployees,
      levelBreakdown,
      departmentBreakdown
    };
  }

  /**
   * Get single designation by ID with department details and member list
   */
  async getDesignationById(id) {
    const designation = await Designation.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'departmentDetails',
          attributes: ['id', 'name', 'code', 'status']
        },
        {
          model: User,
          as: 'employees',
          attributes: [
            'id',
            'firstName',
            'lastName',
            'email',
            'employeeCode',
            'department',
            'status',
            'avatar',
            'joiningDate'
          ]
        }
      ]
    });

    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    const json = designation.toJSON();
    json.employeeCount = json.employees ? json.employees.length : 0;
    return json;
  }

  /**
   * Get paginated employees holding this designation
   */
  async getDesignationEmployees(id, query = {}) {
    const designation = await Designation.findByPk(id);
    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    const { page = 1, limit = 20, search } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const where = { designationId: id };

    if (search && search.trim()) {
      const term = search.trim();
      where[Op.or] = [
        { firstName: { [Op.like]: `%${term}%` } },
        { lastName: { [Op.like]: `%${term}%` } },
        { email: { [Op.like]: `%${term}%` } },
        { employeeCode: { [Op.like]: `%${term}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: [
        'id',
        'employeeCode',
        'firstName',
        'lastName',
        'email',
        'phone',
        'department',
        'status',
        'joiningDate',
        'avatar'
      ],
      order: [['firstName', 'ASC']],
      limit: limitNum,
      offset
    });

    return {
      designation: {
        id: designation.id,
        title: designation.title,
        code: designation.code,
        department: designation.department
      },
      employees: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    };
  }

  /**
   * Create a new designation
   */
  async createDesignation(data) {
    const {
      title,
      code,
      departmentId,
      department,
      description,
      minSalary,
      maxSalary,
      level = 'mid',
      status = 'active'
    } = data;

    const trimmedTitle = title.trim();

    // 1. Check title uniqueness (case-insensitive check)
    const existingTitle = await Designation.findOne({
      where: { title: trimmedTitle }
    });
    if (existingTitle) {
      throw new ConflictError(`Designation with title '${trimmedTitle}' already exists`);
    }

    // 2. Resolve code: validate or auto-generate
    let finalCode = code && code.trim() ? code.trim().toUpperCase() : this._generateCodeFromTitle(trimmedTitle);
    const existingCode = await Designation.findOne({ where: { code: finalCode } });
    if (existingCode) {
      if (code) {
        throw new ConflictError(`Designation with code '${finalCode}' already exists`);
      }
      // Regenerate if collision with auto-generated
      finalCode = `${finalCode}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // 3. Resolve department information
    let resolvedDepartmentName = department ? department.trim() : null;
    let resolvedDepartmentId = departmentId || null;

    if (resolvedDepartmentId) {
      const deptRecord = await Department.findByPk(resolvedDepartmentId);
      if (!deptRecord) {
        throw new NotFoundError(`Department not found with ID '${resolvedDepartmentId}'`);
      }
      resolvedDepartmentName = deptRecord.name;
    }

    // 4. Create record
    const created = await Designation.create({
      title: trimmedTitle,
      code: finalCode,
      departmentId: resolvedDepartmentId,
      department: resolvedDepartmentName,
      description: description ? description.trim() : null,
      minSalary: minSalary !== undefined && minSalary !== null ? Number(minSalary) : null,
      maxSalary: maxSalary !== undefined && maxSalary !== null ? Number(maxSalary) : null,
      level,
      status
    });

    return await this.getDesignationById(created.id);
  }

  /**
   * Update existing designation
   */
  async updateDesignation(id, updateData) {
    const designation = await Designation.findByPk(id);
    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    // 1. Title uniqueness
    if (updateData.title && updateData.title.trim() !== designation.title) {
      const trimmedTitle = updateData.title.trim();
      const existingTitle = await Designation.findOne({
        where: {
          title: trimmedTitle,
          id: { [Op.ne]: id }
        }
      });
      if (existingTitle) {
        throw new ConflictError(`Designation with title '${trimmedTitle}' already exists`);
      }
      designation.title = trimmedTitle;
    }

    // 2. Code uniqueness
    if (updateData.code && updateData.code.trim().toUpperCase() !== designation.code) {
      const trimmedCode = updateData.code.trim().toUpperCase();
      const existingCode = await Designation.findOne({
        where: {
          code: trimmedCode,
          id: { [Op.ne]: id }
        }
      });
      if (existingCode) {
        throw new ConflictError(`Designation with code '${trimmedCode}' already exists`);
      }
      designation.code = trimmedCode;
    }

    // 3. Department linkage
    if (updateData.departmentId !== undefined) {
      if (updateData.departmentId) {
        const deptRecord = await Department.findByPk(updateData.departmentId);
        if (!deptRecord) {
          throw new NotFoundError(`Department not found with ID '${updateData.departmentId}'`);
        }
        designation.departmentId = deptRecord.id;
        designation.department = deptRecord.name;
      } else {
        designation.departmentId = null;
        if (updateData.department !== undefined) {
          designation.department = updateData.department;
        }
      }
    } else if (updateData.department !== undefined) {
      designation.department = updateData.department;
    }

    // 4. Salaries and level
    if (updateData.minSalary !== undefined) {
      designation.minSalary =
        updateData.minSalary !== null ? Number(updateData.minSalary) : null;
    }
    if (updateData.maxSalary !== undefined) {
      designation.maxSalary =
        updateData.maxSalary !== null ? Number(updateData.maxSalary) : null;
    }

    if (
      designation.minSalary !== null &&
      designation.maxSalary !== null &&
      designation.minSalary > designation.maxSalary
    ) {
      throw new BadRequestError('Minimum salary cannot be greater than maximum salary');
    }

    if (updateData.description !== undefined) designation.description = updateData.description;
    if (updateData.level !== undefined) designation.level = updateData.level;
    if (updateData.status !== undefined) designation.status = updateData.status;

    await designation.save();
    return await this.getDesignationById(id);
  }

  /**
   * Quick status toggle (active <-> inactive)
   */
  async updateDesignationStatus(id, status) {
    const designation = await Designation.findByPk(id);
    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    designation.status = status;
    await designation.save();

    return {
      id: designation.id,
      title: designation.title,
      status: designation.status,
      message: `Designation status updated to '${status}'`
    };
  }

  /**
   * Delete designation safely (prevent if employees are assigned)
   */
  async deleteDesignation(id) {
    const designation = await Designation.findByPk(id, {
      include: [{ model: User, as: 'employees', attributes: ['id', 'status'] }]
    });

    if (!designation) {
      throw new NotFoundError(`Designation not found with ID ${id}`);
    }

    const employeeCount = designation.employees ? designation.employees.length : 0;
    if (employeeCount > 0) {
      throw new BadRequestError(
        `Cannot delete designation '${designation.title}' because it is assigned to ${employeeCount} employee(s). Please reassign them to another designation first.`
      );
    }

    await designation.destroy();
    return {
      success: true,
      message: `Designation '${designation.title}' deleted successfully`
    };
  }
}

module.exports = new DesignationService();
