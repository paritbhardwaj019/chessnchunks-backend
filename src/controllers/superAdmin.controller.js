const httpStatus = require('http-status');
const superAdminService = require('../services/superAdmin.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');

const inviteAcademyAdminHandler = catchAsync(async (req, res) => {
  const academyAdminInvitation =
    await superAdminService.inviteAcademyAdminHandler(req.body);

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

const fetchAllInvitationsHandler = catchAsync(async (req, res) => {
  const { page, limit, type } = _.pick(req.query, ['page', 'limit', 'type']);

  const allInvitations = await superAdminService.fetchAllInvitationsHandler(
    page,
    limit,
    type
  );

  res.status(httpStatus.OK).send(allInvitations);
});

const fetchAllAcademiesHandler = catchAsync(async (req, res) => {
  const { page, limit } = _.pick(req.query, ['page', 'limit']);

  const allAcademies = await superAdminService.fetchAllAcademiesHandler(
    page,
    limit
  );

  res.status(httpStatus.OK).send(allAcademies);
});

const fetchAllUsersHandler = catchAsync(async (req, res) => {
  const { page, limit, query } = _.pick(req.query, ['page', 'limit', 'query']);

  const allUsers = await superAdminService.fetchAllUsersHandler(
    page,
    limit,
    query,
    req.user
  );

  res.status(httpStatus.OK).send(allUsers);
});

const superAdminController = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllInvitationsHandler,
  fetchAllAcademiesHandler,
  fetchAllUsersHandler,
};

module.exports = superAdminController;
