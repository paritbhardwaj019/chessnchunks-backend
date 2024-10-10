const httpStatus = require('http-status');
const superAdminService = require('../services/superAdmin.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');

const inviteAcademyAdminHandler = catchAsync(async (req, res) => {
  const academyAdminInvitation =
    await superAdminService.inviteAcademyAdminHandler(req.body, req.user);

  res.status(httpStatus.CREATED).send(academyAdminInvitation);
});

const verifyAcademyAdminHandler = catchAsync(async (req, res) => {
  const verifyAcademyAdminData =
    await superAdminService.verifyAcademyAdminHandler(req.query.token);

  res.status(httpStatus.OK).send(verifyAcademyAdminData);
});

const fetchAllAdminsByAcademyId = catchAsync(async (req, res) => {
  const { page, limit, academyId } = _.pick(req.query, [
    'page',
    'limit',
    'academyId',
  ]);

  const allUsers = await superAdminService.fetchAllAdminsByAcademyId(
    page,
    limit,
    academyId
  );

  res.status(httpStatus.OK).send(allUsers);
});

const fetchAllAcademiesHandler = catchAsync(async (req, res) => {
  const { page, limit, query } = _.pick(req.query, ['page', 'limit', 'query']);

  const allAcademies = await superAdminService.fetchAllAcademiesHandler(
    page,
    limit,
    query,
    req.user
  );

  res.status(httpStatus.OK).send(allAcademies);
});

const superAdminController = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllAcademiesHandler,
};

module.exports = superAdminController;
