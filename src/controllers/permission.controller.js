const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const permissionService = require('../services/permission.service');

const fetchUserPermission = catchAsync(async (req, res) => {
  const userPermission = await permissionService.fetchUserPermission(req.user);
  res.status(httpStatus.OK).send(userPermission);
});

const fetchAllRoles = catchAsync(async (req, res) => {
  const allRoles = await permissionService.fetchAllRoles();
  res.status(httpStatus.OK).send(allRoles);
});

const updatePermission = catchAsync(async (req, res) => {
  const updatedPermission = await permissionService.updateRolePermission(
    req.body.roleId,
    req.body.permissions
  );
  res.status(httpStatus.OK).send(updatedPermission);
});

const permissionController = {
  fetchUserPermission,
  fetchAllRoles,
  updatePermission,
};

module.exports = permissionController;
