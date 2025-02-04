const httpStatus = require('http-status');
const _ = require('lodash');
const superAdminService = require('../services/superAdmin.service');
const ApiError = require('../../../utils/apiError');
const catchAsync = require('../../../utils/catchAsync');
const config = require('../../../config');

/**
 * Handles academy admin invitation
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.firstName - Admin's first name
 * @param {string} req.body.lastName - Admin's last name
 * @param {string} req.body.email - Admin's email
 * @param {string} req.body.academyName - Academy name
 * @param {Object} req.file - Uploaded logo file
 * @param {Object} req.user - Logged in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const inviteAcademyAdminHandler = catchAsync(async (req, res) => {
  const academyAdminInvitation =
    await superAdminService.inviteAcademyAdminHandler(
      req.body,
      req.user,
      req.file
    );

  res.status(httpStatus.CREATED).send(academyAdminInvitation);
});

/**
 * Verifies academy admin
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.query.token - Verification token
 * @param {string} req.body.domain - Academy domain
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const verifyAcademyAdminHandler = catchAsync(async (req, res) => {
  const verifyAcademyAdminData =
    await superAdminService.verifyAcademyAdminHandler(
      req.query.token,
      req.body.domain
    );

  res.status(httpStatus.OK).send(verifyAcademyAdminData);
});

/**
 * Fetches all admins for a specific academy
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {string} req.query.academyId - Academy ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
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

/**
 * Fetches all academies with pagination and filtering
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page] - Page number
 * @param {number} [req.query.limit] - Items per page
 * @param {string} [req.query.query] - Search query
 * @param {Object} req.user - Logged in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
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

/**
 * Fetches all plans with pagination and filtering
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Items per page
 * @param {string} [req.query.type] - Plan type filter
 * @param {string} [req.query.search] - Search query
 * @param {string} [req.query.signupId] - Signup ID for discount calculation
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const fetchAllPlansHandler = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    search,
    signupId,
  } = _.pick(req.query, ['page', 'limit', 'type', 'search', 'signupId']);

  const filters = {
    type,
    search,
    signupId,
  };

  const plans = await superAdminService.fetchAllPlansHandler(
    filters,
    parseInt(page),
    parseInt(limit)
  );

  res.status(httpStatus.OK).send(plans);
});

/**
 * Creates a new plan
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Plan data
 * @param {string} req.body.name - Plan name
 * @param {number} req.body.maxUsers - Maximum users allowed
 * @param {number} req.body.academyPrice - Academy price
 * @param {number} req.body.subscriberPrice - Subscriber price
 * @param {Array} req.body.features - Plan features
 * @param {boolean} req.body.isFeatured - Whether plan is featured
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
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

/**
 * Checks domain availability
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.domain - Domain to check
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {ApiError} If domain parameter is missing
 */
const checkDomainAvailability = catchAsync(async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Domain is required');
  }

  const result = await superAdminService.checkDomainAvailabilityHandler(domain);
  res.status(httpStatus.OK).send(result);
});

/**
 * Selects an academy plan
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.signupId - Signup ID
 * @param {string} req.body.planId - Plan ID
 * @param {string} req.body.domain - Academy domain
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {ApiError} If required parameters are missing
 */
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

/**
 * Updates an existing plan
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.planId - Plan ID to update
 * @param {Object} req.body - Plan update data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
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

/**
 * Creates a checkout session for plan purchase
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.signupId - Signup ID
 * @param {string} req.body.planId - Plan ID
 * @param {string} req.body.domain - Academy domain
 * @param {string} req.body.token - Authentication token
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {ApiError} If required parameters are missing
 */
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

/**
 * Deletes a plan
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.planId - Plan ID to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deletePlanHandler = catchAsync(async (req, res) => {
  const { planId } = req.params;

  const deletedPlan = await superAdminService.deletePlanHandler(planId);
  res.status(httpStatus.OK).send(deletedPlan);
});

/**
 * Creates a super admin user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.authCode - Authorization code
 * @param {Object} req.body.userData - User data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {ApiError} If authorization code is invalid
 */
const createSuperAdminHandler = catchAsync(async (req, res) => {
  const { authCode, ...userData } = req.body;

  if (authCode !== config.superAdminAuthCode) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid authorization code');
  }

  const result = await superAdminService.createSuperAdminHandler(userData);
  res.status(httpStatus.CREATED).send(result);
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
  deletePlanHandler,
  createSuperAdminHandler,
};

module.exports = superAdminController;
