const httpStatus = require('http-status');
const superAdminService = require('../services/superAdmin.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const ApiError = require('../utils/apiError');

const inviteAcademyAdminHandler = catchAsync(async (req, res) => {
  const academyAdminInvitation =
    await superAdminService.inviteAcademyAdminHandler(
      { logo: req.file.path, ...req.body },
      req.user
    );

  res.status(httpStatus.CREATED).send(academyAdminInvitation);
});

const verifyAcademyAdminHandler = catchAsync(async (req, res) => {
  const verifyAcademyAdminData =
    await superAdminService.verifyAcademyAdminHandler(
      req.query.token,
      req.body.domain
    );

  res.status(httpStatus.OK).send(verifyAcademyAdminData);
});

const fetchAllAdminsByAcademyId = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    academyId,
  } = _.pick(req.query, ['page', 'limit', 'academyId']);

  const result = await superAdminService.fetchAllAdminsByAcademyId(
    page,
    limit,
    academyId
  );

  res.status(httpStatus.OK).send(result);
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

const fetchAllPlansHandler = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    search,
  } = _.pick(req.query, ['page', 'limit', 'type', 'search']);

  const filters = {
    type,
    search,
  };

  const plans = await superAdminService.fetchAllPlansHandler(
    filters,
    parseInt(page),
    parseInt(limit)
  );

  res.status(httpStatus.OK).send(plans);
});

const createPlanHandler = catchAsync(async (req, res) => {
  const planData = _.pick(req.body, [
    'name',
    'maxUsers',
    'academyPrice',
    'subscriberPrice',
    'features',
    'isFeatured',
  ]);

  const plan = await superAdminService.createPlanHandler(planData);
  res.status(httpStatus.CREATED).send(plan);
});

const checkDomainAvailability = catchAsync(async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Domain is required');
  }

  const result = await superAdminService.checkDomainAvailabilityHandler(domain);
  res.status(httpStatus.OK).send(result);
});

const selectAcademyPlan = catchAsync(async (req, res) => {
  const { signupId, planId, domain } = req.body;

  if (!signupId || !planId || !domain) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'SignupId, planId and domain are required'
    );
  }

  const result = await superAdminService.selectAcademyPlanHandler(
    signupId,
    planId,
    domain
  );
  res.status(httpStatus.OK).send(result);
});

const updatePlanHandler = catchAsync(async (req, res) => {
  const { planId } = req.params;

  const planData = _.pick(req.body, [
    'name',
    'maxUsers',
    'academyPrice',
    'subscriberPrice',
    'features',
    'isFeatured',
  ]);

  const updatedPlan = await superAdminService.updatePlanHandler(
    planId,
    planData
  );
  res.status(httpStatus.OK).send(updatedPlan);
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const { signupId, planId, domain, token } = req.body;

  if (!signupId || !planId || !domain || !token) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'signupId, planId, domain, and token are required'
    );
  }

  const session = await superAdminService.createCheckoutSessionHandler(
    signupId,
    planId,
    domain,
    token
  );
  res.status(httpStatus.OK).send({ url: session.url });
});

const superAdminController = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllAcademiesHandler,
  createPlanHandler,
  fetchAllPlansHandler,
  checkDomainAvailability,
  selectAcademyPlan,
  updatePlanHandler,
  createCheckoutSession,
};

module.exports = superAdminController;
