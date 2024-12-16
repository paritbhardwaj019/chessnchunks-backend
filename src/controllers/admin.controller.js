const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const adminService = require('../services/admin.service');

const createAdminHandler = catchAsync(async (req, res) => {
  const data = _.pick(req.body, [
    'firstName',
    'lastName',
    'email',
    'contactNumber',
    'adminRole',
  ]);

  const newAdmin = await adminService.createAdminHandler(data, req.user);
  res.status(httpStatus.CREATED).send(newAdmin);
});

const verifyAdminOTP = catchAsync(async (req, res) => {
  const data = _.pick(req.body, ['code', 'email']);

  const verificationResult = await adminService.verifyAdminOTPHandler(data);
  res.status(httpStatus.OK).send(verificationResult);
});

const setAdminPassword = catchAsync(async (req, res) => {
  const data = _.pick(req.body, ['email', 'password']);

  const result = await adminService.setAdminPasswordHandler(data);
  res.status(httpStatus.OK).send(result);
});

const transferOwnership = catchAsync(async (req, res) => {
  const data = _.pick(req.body, ['fromAdminId', 'toAdminId']);

  const result = await adminService.transferOwnershipHandler(data, req.user);
  res.status(httpStatus.OK).send(result);
});

const getAllAdmins = catchAsync(async (req, res) => {
  const { page, limit, query } = _.pick(req.query, ['page', 'limit', 'query']);

  const admins = await adminService.fetchAllAdmins(req.user, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    query,
  });

  res.status(httpStatus.OK).send(admins);
});

const deleteAdmin = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const result = await adminService.deleteAdminHandler(id, req.user);
  res.status(httpStatus.OK).send(result);
});

const adminController = {
  createAdminHandler,
  verifyAdminOTP,
  setAdminPassword,
  transferOwnership,
  getAllAdmins,
  deleteAdmin,
};

module.exports = adminController;
