const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const academyService = require('../services/academy.service');
const { resolveAcademyDomain } = require('../utils/domainResolution');

const updateAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const updatedAcademy = await academyService.updateAcademyByIdHandler(
    req.body,
    id,
    req.user
  );

  res.status(httpStatus.OK).send(updatedAcademy);
});

const fetchAcademyByIdHandler = catchAsync(async (req, res) => {
  const { id } = _.pick(req.params, ['id']);

  const academy = await academyService.fetchAcademyByIdHandler(id, req.user);

  res.status(httpStatus.OK).send(academy);
});

const getAcademyByDomain = catchAsync(async (req, res) => {
  const { domain } = req.params;
  const academyData = await academyService.getAcademyByDomain(domain);
  res.status(httpStatus.OK).send(academyData);
});

const getPublicPageBySlug = catchAsync(async (req, res) => {
  const { domain, slug } = req.params;

  console.log('DOMAIN', domain);
  console.log('SLUG', slug);

  const resolvedDomain = await resolveAcademyDomain(domain);

  const pageData = await academyService.getPublicPageBySlug(
    resolvedDomain,
    slug
  );
  res.status(httpStatus.OK).send(pageData);
});

const updateComponentById = catchAsync(async (req, res) => {
  const { domain, pageId, componentId } = req.params;

  const updatedComponent = await academyService.updateComponentById(
    pageId,
    componentId,
    req.body
  );

  res.status(httpStatus.OK).send(updatedComponent);
});

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
