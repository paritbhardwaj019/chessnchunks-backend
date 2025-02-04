const httpStatus = require('http-status');
const _ = require('lodash');

const academyService = require('../services/academy.service');
const catchAsync = require('../../../utils/catchAsync');
const { resolveAcademyDomain } = require('../../../utils/domainResolution');

/**
 * Updates academy by ID
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Academy ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Logged in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const updatedAcademy = await academyService.updateAcademyByIdHandler(
    req.body,
    id,
    req.user
  );

  res.status(httpStatus.OK).send(updatedAcademy);
});

/**
 * Fetches academy by ID
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Academy ID
 * @param {Object} req.user - Logged in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const fetchAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const academy = await academyService.fetchAcademyByIdHandler(id, req.user);

  res.status(httpStatus.OK).send(academy);
});

/**
 * Gets academy by domain
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.domain - Academy domain
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAcademyByDomain = catchAsync(async (req, res) => {
  const { domain } = req.params;
  const academyData = await academyService.getAcademyByDomain(domain);
  res.status(httpStatus.OK).send(academyData);
});

/**
 * Gets public page by slug
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.domain - Academy domain
 * @param {string} req.params.slug - Page slug
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getPublicPageBySlug = catchAsync(async (req, res) => {
  const { domain, slug } = req.params;

  const resolvedDomain = await resolveAcademyDomain(domain);

  const pageData = await academyService.getPublicPageBySlug(
    resolvedDomain,
    slug
  );
  res.status(httpStatus.OK).send(pageData);
});

/**
 * Updates component by ID
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.pageId - Page ID
 * @param {string} req.params.componentId - Component ID
 * @param {Object} req.body - Component update data
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateComponentById = catchAsync(async (req, res) => {
  const { pageId, componentId } = req.params;

  const updatedComponent = await academyService.updateComponentById(
    pageId,
    componentId,
    req.body
  );

  res.status(httpStatus.OK).send(updatedComponent);
});

/**
 * Updates academy settings
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Academy ID
 * @param {Object} req.body - Request body
 * @param {number} req.body.signUpFee - Academy signup fee
 * @param {Object} req.file - Uploaded logo file
 * @param {Object} req.user - Logged in user
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateAcademySettings = catchAsync(async (req, res) => {
  const { id } = req.params;
  const settingsData = _.pick(req.body, ['signUpFee']);
  const logoFile = req.file;

  const result = await academyService.updateAcademySettings(
    id,
    settingsData,
    logoFile,
    req.user
  );

  res.status(httpStatus.OK).send(result);
});

const academyController = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
  getAcademyByDomain,
  getPublicPageBySlug,
  updateComponentById,
  updateAcademySettings,
};

module.exports = academyController;
