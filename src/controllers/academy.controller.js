const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const academyService = require('../services/academy.service');

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
  const pageData = await academyService.getPublicPageBySlug(
    `http://${domain}.localhost:3001`,
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

const academyController = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
  getAcademyByDomain,
  getPublicPageBySlug,
  updateComponentById,
};

module.exports = academyController;
