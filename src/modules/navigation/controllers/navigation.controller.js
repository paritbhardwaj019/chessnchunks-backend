const httpStatus = require('http-status');
const academyService = require('../../academy/services/academy.service');
const navigationService = require('../services/navigation.service');
const ApiError = require('../../../utils/apiError');
const catchAsync = require('../../../utils/catchAsync');
const { resolveAcademyDomain } = require('../../../utils/domainResolution');
const pick = require('../../../utils/pick');

const getAndValidateAcademy = async (loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);
  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found for user');
  }
  return academy;
};

const getNavigationItems = catchAsync(async (req, res) => {
  const academy = await getAndValidateAcademy(req.user);

  const filters = pick(req.query, ['search', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await navigationService.listNavigationItems(academy.id, {
    ...filters,
    ...options,
  });

  result?.results;

  res.send(result);
});

const createNavigationItem = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const requiredFields = ['title', 'slug'];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  const navItem = await navigationService.createNavigationItem({
    ...req.body,
    academyId,
  });

  res.status(httpStatus.CREATED).send(navItem);
});

const updateNavigationItem = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  if (req.body.slug) {
    const existingNav = await navigationService.getNavigationItemBySlug(
      academyId,
      req.body.slug
    );
    if (existingNav && existingNav.id !== req.params.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already exists');
    }
  }

  const navItem = await navigationService.updateNavigationItem(
    req.params.id,
    academyId,
    req.body
  );

  res.send(navItem);
});

const deleteNavigationItem = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  await navigationService.deleteNavigationItem(req.params.id, academyId);

  res.status(httpStatus.NO_CONTENT).send();
});

const reorderNavigationItems = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  if (!Array.isArray(req.body.items)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Items must be an array');
  }

  await navigationService.reorderNavigationItems(academyId, req.body.items);

  res.status(httpStatus.OK).send({ success: true });
});

const toggleNavigationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const updatedItem = await navigationService.toggleNavigationStatus(
    id,
    isActive
  );

  res.status(httpStatus.OK).send(updatedItem);
});

const getAllActiveNavigationByDomain = catchAsync(async (req, res) => {
  const { domain } = req.params;

  if (!domain) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Domain is required');
  }

  const resolvedDomain = await resolveAcademyDomain(domain);

  const activeNavigation =
    await navigationService.getAllActiveNavigationByDomain(resolvedDomain);

  res.status(httpStatus.OK).send(activeNavigation);
});

const navigationController = {
  getNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  reorderNavigationItems,
  toggleNavigationStatus,
  getAllActiveNavigationByDomain,
};

module.exports = navigationController;
