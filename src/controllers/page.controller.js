const httpStatus = require('http-status');
const academyService = require('../services/academy.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const pageService = require('../services/page.service');

const getAndValidateAcademy = async (loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);
  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found for user');
  }
  return academy.id;
};

const getPages = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const pages = await pageService.getAllPages(academyId);

  res.status(httpStatus.OK).send(pages);
});

const getPage = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const { slug } = req.params;

  const page = await pageService.getPageBySlug(academyId, slug);

  res.status(httpStatus.OK).send(page);
});

const updatePage = catchAsync(async (req, res) => {
  await getAndValidateAcademy(req.user);
  const { pageId } = req.params;

  const requiredFields = ['title', 'status'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(req.body.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid page status');
  }

  if (req.body.components) {
    if (!Array.isArray(req.body.components)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Components must be an array');
    }

    req.body.components.forEach((component) => {
      if (!component.type) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Each component must have a type'
        );
      }
    });
  }

  const page = await pageService.updatePage(pageId, req.body);

  res.status(httpStatus.OK).send(page);
});

const updateComponentOrder = catchAsync(async (req, res) => {
  await getAndValidateAcademy(req.user);
  const { pageId } = req.params;
  const { componentOrders } = req.body;

  if (!Array.isArray(componentOrders)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Component orders must be an array'
    );
  }

  componentOrders.forEach((order) => {
    if (!order.id || !order.order) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Each component order must have id and order'
      );
    }
  });

  const updatedComponents = await pageService.updateComponentOrder(
    pageId,
    componentOrders
  );

  res.status(httpStatus.OK).send(updatedComponents);
});

module.exports = {
  updateComponentOrder,
  updatePage,
  getPages,
  getPage,
};
