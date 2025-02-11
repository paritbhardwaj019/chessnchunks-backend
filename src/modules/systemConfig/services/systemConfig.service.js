const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const academyService = require('../../academy/services/academy.service');

/**
 * Create a new system configuration
 * @param {Object} data - System config creation data
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object>} Created system config
 */
const createSystemConfig = async (data, loggedInUser) => {
  if (!data.type || !data.code || !data.label) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Type, code, and label are required'
    );
  }

  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  const existingConfig = await db.systemConfig.findFirst({
    where: {
      type: data.type,
      code: data.code,
      academyId: academy.id,
      isActive: true,
    },
  });

  if (existingConfig) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'System config with this type and code already exists for this academy'
    );
  }

  return await db.systemConfig.create({
    data: {
      ...data,
      academyId: academy.id,
      order: data.order || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
};

/**
 * Find system configurations with flexible filtering and pagination
 * @param {Object} filters - Filtering options
 * @param {Object} options - Pagination and sorting options
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object>} Paginated system configurations
 */
const getAllSystemConfigs = async (
  filters = {},
  options = {},
  loggedInUser
) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const where = {
    academyId: academy.id,
    ...(filters.type && { type: filters.type }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters.parentId && { parentId: filters.parentId }),
    ...(filters.search && {
      OR: [
        { code: { contains: filters.search } },
        { label: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    }),
  };

  const [types, total, results] = await Promise.all([
    db.systemConfig.findMany({
      where,
      select: { type: true },
      distinct: ['type'],
    }),
    db.systemConfig.count({ where }),
    db.systemConfig.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ type: 'asc' }, { order: 'asc' }, { [sortBy]: sortOrder }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const orderedResults = Object.entries(groupedResults)
    .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
    .reduce((acc, [_, items]) => [...acc, ...items], []); // eslint-disable-line

  return {
    data: orderedResults,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      types: types.map((t) => t.type),
    },
  };
};

/**
 * Get a system configuration by ID
 * @param {string} id - System config ID
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object>} System configuration
 */
const getSystemConfigById = async (id, loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  const systemConfig = await db.systemConfig.findFirst({
    where: {
      id,
      academyId: academy.id,
    },
    include: {
      parent: true,
      children: true,
    },
  });

  if (!systemConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'System configuration not found');
  }

  return systemConfig;
};

/**
 * Update a system configuration
 * @param {string} id - System config ID
 * @param {Object} data - Update data
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object>} Updated system configuration
 */
const updateSystemConfigById = async (id, data, loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  const existingConfig = await db.systemConfig.findFirst({
    where: {
      id,
      academyId: academy.id,
    },
  });

  if (!existingConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'System configuration not found');
  }

  const allConfigs = await db.systemConfig.findMany({
    where: {
      type: existingConfig.type,
      academyId: academy.id,
      id: { not: id },
    },
    orderBy: { order: 'asc' },
  });

  let newOrder = data.order;
  if (typeof data.order === 'number' && data.order !== existingConfig.order) {
    newOrder = Math.max(0, data.order);
    const maxOrder =
      allConfigs.length > 0
        ? Math.max(...allConfigs.map((config) => config.order))
        : 0;
    newOrder = Math.min(newOrder, maxOrder + 1);

    if (newOrder !== existingConfig.order) {
      if (newOrder > existingConfig.order) {
        await db.systemConfig.updateMany({
          where: {
            type: existingConfig.type,
            academyId: academy.id,
            order: {
              gt: existingConfig.order,
              lte: newOrder,
            },
          },
          data: {
            order: { decrement: 1 },
          },
        });
      } else {
        await db.systemConfig.updateMany({
          where: {
            type: existingConfig.type,
            academyId: academy.id,
            order: {
              gte: newOrder,
              lt: existingConfig.order,
            },
          },
          data: {
            order: { increment: 1 },
          },
        });
      }
    }
  }

  delete data.order;
  const { type, code, ...safeUpdateData } = data;

  return await db.systemConfig.update({
    where: { id },
    data: {
      ...safeUpdateData,
      ...(type && { type }),
      ...(code && { code }),
      order: newOrder,
    },
  });
};

/**
 * Delete a system configuration
 * @param {string} id - System config ID
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object>} Deleted system configuration
 */
const deleteSystemConfigById = async (id, loggedInUser) => {
  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  const systemConfig = await db.systemConfig.findFirst({
    where: {
      id,
      academyId: academy.id,
    },
  });

  if (!systemConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'System configuration not found');
  }

  const childConfigs = await db.systemConfig.count({
    where: {
      parentId: id,
      academyId: academy.id,
    },
  });

  if (childConfigs > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete a system configuration with child configurations'
    );
  }

  return await db.systemConfig.delete({ where: { id } });
};

/**
 * Get system configurations by type for dropdown/options
 * @param {string} type - Type of system configuration
 * @param {Object} loggedInUser - Currently logged in user
 * @returns {Promise<Object[]>} List of system configurations
 */
const getSystemConfigOptionsByType = async (type, loggedInUser) => {
  if (!type) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Type is required for fetching system configuration options'
    );
  }

  const academy = await academyService.getSingleAcademyForUser(loggedInUser);

  return await db.systemConfig.findMany({
    where: {
      type,
      academyId: academy.id,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      label: true,
      order: true,
      metadata: true,
    },
    orderBy: [{ order: 'asc' }, { label: 'asc' }],
  });
};

const systemConfigService = {
  getAllSystemConfigs,
  createSystemConfig,
  deleteSystemConfigById,
  updateSystemConfigById,
  getSystemConfigById,
  getSystemConfigOptionsByType,
};

module.exports = systemConfigService;
