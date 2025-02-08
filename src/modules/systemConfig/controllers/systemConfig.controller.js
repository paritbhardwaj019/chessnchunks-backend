const httpStatus = require('http-status');
const _ = require('lodash');
const systemConfigService = require('../services/systemConfig.service');
const catchAsync = require('../../../utils/catchAsync');
const ApiError = require('../../../utils/apiError');

const createSystemConfigHandler = catchAsync(async (req, res) => {
  const systemConfigData = _.pick(req.body, [
    'type',
    'code',
    'label',
    'description',
    'order',
    'isActive',
    'metadata',
    'parentId',
  ]);

  const systemConfig = await systemConfigService.createSystemConfig(
    systemConfigData,
    req.user
  );
  res.status(httpStatus.CREATED).send(systemConfig);
});

const getAllSystemConfigsHandler = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, ...filters } = _.pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
    'type',
    'isActive',
    'parentId',
    'search',
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
    sortOrder,
  };

  const systemConfigs = await systemConfigService.getAllSystemConfigs(
    filters,
    options,
    req.user
  );
  res.status(httpStatus.OK).send(systemConfigs);
});

const getSystemConfigByIdHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const systemConfig = await systemConfigService.getSystemConfigById(
    id,
    req.user
  );
  res.status(httpStatus.OK).send(systemConfig);
});

const updateSystemConfigHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = _.pick(req.body, [
    'type',
    'code',
    'label',
    'description',
    'order',
    'isActive',
    'metadata',
    'parentId',
  ]);

  const updatedSystemConfig = await systemConfigService.updateSystemConfigById(
    id,
    updateData,
    req.user
  );
  res.status(httpStatus.OK).send(updatedSystemConfig);
});

const deleteSystemConfigHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deletedSystemConfig = await systemConfigService.deleteSystemConfigById(
    id,
    req.user
  );
  res.status(httpStatus.OK).send(deletedSystemConfig);
});

const getSystemConfigOptionsByTypeHandler = catchAsync(async (req, res) => {
  const { type } = req.query;

  if (!type) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Type query parameter is required'
    );
  }

  const systemConfigOptions =
    await systemConfigService.getSystemConfigOptionsByType(type, req.user);
  res.status(httpStatus.OK).send(systemConfigOptions);
});

const systemConfigController = {
  createSystemConfigHandler,
  getAllSystemConfigsHandler,
  getSystemConfigByIdHandler,
  updateSystemConfigHandler,
  deleteSystemConfigHandler,
  getSystemConfigOptionsByTypeHandler,
};

module.exports = systemConfigController;
