const httpStatus = require('http-status');
const config = require('../config');
const db = require('../database/prisma');
const decodeToken = require('../utils/decodeToken');

/**
 * Middleware to check if the user has the required permission.
 * @param {string} action - The action to check (e.g., 'view', 'add', 'update', 'delete').
 * @param {string} resource - The resource path to check (e.g., '/dashboard/users').
 * @returns {Function} Express middleware function.
 */

const checkPermission = (action, resource) => {
  return async (req, res, next) => {
    try {
      const token = req.token;

      const decoded = await decodeToken(token, config.jwt.secret);
      const { id } = decoded;

      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: {
            select: { id: true, name: true },
          },
        },
      });

      if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({
          message: 'User not found!',
          statusCode: httpStatus.NOT_FOUND,
        });
      }

      const permission = await db.permission.findUnique({
        where: {
          resource_action: {
            resource: resource,
            action: action,
          },
        },
      });

      if (!permission) {
        return res.status(httpStatus.FORBIDDEN).json({
          message: 'Permission not found!',
          statusCode: httpStatus.FORBIDDEN,
        });
      }

      const rolePermission = await db.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: user.role.id,
            permissionId: permission.id,
          },
        },
      });

      if (!rolePermission) {
        return res.status(httpStatus.FORBIDDEN).json({
          message:
            'You do not have the necessary permissions to perform this action.',
          statusCode: httpStatus.FORBIDDEN,
        });
      }

      req.user = {
        id: user.id,
        role: user.role.name,
      };
      next();
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

module.exports = checkPermission;
