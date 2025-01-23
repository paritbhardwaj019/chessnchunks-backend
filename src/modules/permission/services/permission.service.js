const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');

const fetchUserPermission = async (loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');

  const allPermissions = user.role.rolePermissions.map((el) => ({
    resource: el.permission.resource,
    action: el.permission.action,
  }));

  return allPermissions;
};

const fetchAllRoles = async () => {
  const allRoles = await db.role.findMany({
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });
  return allRoles;
};

const updateRolePermission = async (roleId, permissions) => {
  return await db.$transaction(async (prisma) => {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Role not found!');
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    const permissionIds = await Promise.all(
      permissions.map(async (permission) => {
        const existingPermission = await prisma.permission.findFirst({
          where: {
            resource: permission.resource,
            action: permission.action,
          },
        });

        if (existingPermission) {
          return existingPermission.id;
        }

        const newPermission = await prisma.permission.create({
          data: {
            resource: permission.resource,
            action: permission.action,
          },
        });

        return newPermission.id;
      })
    );

    const rolePermissionsData = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    const updateRolePermissions = await prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    return updateRolePermissions;
  });
};

const permissionService = {
  fetchUserPermission,
  fetchAllRoles,
  updateRolePermission,
};

module.exports = permissionService;
