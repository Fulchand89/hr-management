const { Role, Permission, RolePermission, UserPermission, User, sequelize } = require('../models');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

class RbacService {
  // ==========================================
  // ROLES MANAGEMENT
  // ==========================================

  /**
   * Get all roles with their associated permissions
   */
  async getAllRoles() {
    return await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'name', 'displayName', 'module']
        }
      ],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'name', 'displayName', 'module', 'description']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'status']
        }
      ]
    });

    if (!role) {
      throw new NotFoundError(`Role not found with ID ${roleId}`);
    }

    return role;
  }

  /**
   * Create a new role and optionally assign permissions
   */
  async createRole({ name, displayName, description, permissionIds = [] }) {
    const normalizedName = name.toLowerCase().trim();
    const existing = await Role.findOne({ where: { name: normalizedName } });
    if (existing) {
      throw new ConflictError(`Role with name '${normalizedName}' already exists`);
    }

    const transaction = await sequelize.transaction();
    try {
      const role = await Role.create(
        {
          name: normalizedName,
          displayName,
          description,
          isSystem: false
        },
        { transaction }
      );

      if (permissionIds.length > 0) {
        const perms = await Permission.findAll({
          where: { id: permissionIds },
          transaction
        });
        await role.setPermissions(perms, { transaction });
      }

      await transaction.commit();
      return await this.getRoleById(role.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId, { name, displayName, description, permissionIds }) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new NotFoundError(`Role not found with ID ${roleId}`);
    }

    if (name && name.toLowerCase().trim() !== role.name) {
      if (role.isSystem) {
        throw new BadRequestError('System roles cannot be renamed');
      }
      const existing = await Role.findOne({ where: { name: name.toLowerCase().trim() } });
      if (existing) {
        throw new ConflictError(`Role with name '${name}' already exists`);
      }
      role.name = name.toLowerCase().trim();
    }

    if (displayName !== undefined) role.displayName = displayName;
    if (description !== undefined) role.description = description;

    const transaction = await sequelize.transaction();
    try {
      await role.save({ transaction });

      if (Array.isArray(permissionIds)) {
        const perms = await Permission.findAll({
          where: { id: permissionIds },
          transaction
        });
        await role.setPermissions(perms, { transaction });
      }

      await transaction.commit();
      return await this.getRoleById(role.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId) {
    const role = await Role.findByPk(roleId, {
      include: [{ model: User, as: 'users', attributes: ['id'] }]
    });

    if (!role) {
      throw new NotFoundError(`Role not found with ID ${roleId}`);
    }

    if (role.isSystem) {
      throw new BadRequestError('Default system roles cannot be deleted');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestError(`Cannot delete role '${role.name}' because it is assigned to ${role.users.length} user(s). Reassign them first.`);
    }

    await role.destroy();
    return { success: true, message: `Role '${role.name}' deleted successfully` };
  }

  /**
   * Assign or replace permissions for a role
   */
  async assignPermissionsToRole(roleId, permissionIds = []) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new NotFoundError(`Role not found with ID ${roleId}`);
    }

    const perms = await Permission.findAll({ where: { id: permissionIds } });
    await role.setPermissions(perms);

    return await this.getRoleById(role.id);
  }

  // ==========================================
  // PERMISSIONS MANAGEMENT
  // ==========================================

  /**
   * Get all permissions
   */
  async getAllPermissions(groupByModule = false) {
    const permissions = await Permission.findAll({
      order: [
        ['module', 'ASC'],
        ['name', 'ASC']
      ]
    });

    if (!groupByModule) {
      return permissions;
    }

    // Group permissions by module
    return permissions.reduce((acc, perm) => {
      const module = perm.module || 'general';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {});
  }

  /**
   * Get a single permission by ID
   */
  async getPermissionById(permissionId) {
    const perm = await Permission.findByPk(permissionId, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'name', 'displayName']
        }
      ]
    });

    if (!perm) {
      throw new NotFoundError(`Permission not found with ID ${permissionId}`);
    }

    return perm;
  }

  /**
   * Create a new permission
   */
  async createPermission({ name, displayName, module, description }) {
    const normalizedName = name.toLowerCase().trim();
    const existing = await Permission.findOne({ where: { name: normalizedName } });
    if (existing) {
      throw new ConflictError(`Permission '${normalizedName}' already exists`);
    }

    return await Permission.create({
      name: normalizedName,
      displayName,
      module: module.toLowerCase().trim(),
      description
    });
  }

  /**
   * Update permission
   */
  async updatePermission(permissionId, { name, displayName, module, description }) {
    const perm = await Permission.findByPk(permissionId);
    if (!perm) {
      throw new NotFoundError(`Permission not found with ID ${permissionId}`);
    }

    if (name && name.toLowerCase().trim() !== perm.name) {
      const existing = await Permission.findOne({ where: { name: name.toLowerCase().trim() } });
      if (existing) {
        throw new ConflictError(`Permission '${name}' already exists`);
      }
      perm.name = name.toLowerCase().trim();
    }

    if (displayName !== undefined) perm.displayName = displayName;
    if (module !== undefined) perm.module = module.toLowerCase().trim();
    if (description !== undefined) perm.description = description;

    await perm.save();
    return perm;
  }

  /**
   * Delete permission
   */
  async deletePermission(permissionId) {
    const perm = await Permission.findByPk(permissionId);
    if (!perm) {
      throw new NotFoundError(`Permission not found with ID ${permissionId}`);
    }

    await perm.destroy();
    return { success: true, message: `Permission '${perm.name}' deleted successfully` };
  }

  // ==========================================
  // USER PERMISSIONS (DIRECT & EFFECTIVE)
  // ==========================================

  /**
   * Get all permissions for a specific user (role-based + direct overrides)
   */
  async getUserPermissions(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roleDetails',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        },
        {
          model: Permission,
          as: 'directPermissions',
          through: { attributes: ['id', 'granted'] }
        }
      ]
    });

    if (!user) {
      throw new NotFoundError(`User not found with ID ${userId}`);
    }

    const effective = await user.getEffectivePermissions();

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        roleDetails: user.roleDetails
      },
      rolePermissions: user.roleDetails ? user.roleDetails.permissions : [],
      directPermissions: user.directPermissions || [],
      effectivePermissions: effective
    };
  }

  /**
   * Assign direct permissions to a user
   */
  async assignUserDirectPermissions(userId, permissionsToAssign) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError(`User not found with ID ${userId}`);
    }

    // permissionsToAssign can be array of IDs or array of { permissionId, granted }
    for (const item of permissionsToAssign) {
      const permissionId = typeof item === 'object' ? item.permissionId : item;
      const granted = typeof item === 'object' && item.granted !== undefined ? item.granted : true;

      const perm = await Permission.findByPk(permissionId);
      if (!perm) continue;

      const [record, created] = await UserPermission.findOrCreate({
        where: { userId, permissionId },
        defaults: { userId, permissionId, granted }
      });

      if (!created && record.granted !== granted) {
        record.granted = granted;
        await record.save();
      }
    }

    return await this.getUserPermissions(userId);
  }

  /**
   * Remove a direct permission from a user
   */
  async removeUserDirectPermission(userId, permissionId) {
    const record = await UserPermission.findOne({
      where: { userId, permissionId }
    });

    if (!record) {
      throw new NotFoundError('Direct permission assignment not found for this user');
    }

    await record.destroy();
    return { success: true, message: 'Direct permission removed from user' };
  }
}

module.exports = new RbacService();
