const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const httpStatus = require('http-status');
const ApiError = require('../../../utils/apiError');

/**
 * List all navigation items for an academy
 * @param {string} academyId
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const listNavigationItems = async (academyId, options) => {
  const { search, isActive, sortBy = 'order', page = 1, limit = 10 } = options;

  const whereClause = {
    academyId,
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const items = await prisma.academyNavigation.findMany({
    where: whereClause,
    orderBy: {
      [sortBy]: sortBy === 'order' ? 'asc' : 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      children: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  const total = await prisma.academyNavigation.count({ where: whereClause });

  return {
    results: items,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

/**
 * Create a navigation item
 * @param {Object} navData
 * @returns {Promise<Object>}
 */
const createNavigationItem = async (navData) => {
  // Check if slug exists
  const existingNav = await prisma.academyNavigation.findFirst({
    where: {
      academyId: navData.academyId,
      slug: navData.slug,
    },
  });

  if (existingNav) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Slug already exists');
  }

  const maxOrder = await prisma.academyNavigation.findFirst({
    where: {
      academyId: navData.academyId,
      parentId: navData.parentId || null,
    },
    orderBy: {
      order: 'desc',
    },
  });

  const order = maxOrder ? maxOrder.order + 1 : 1;

  return prisma.academyNavigation.create({
    data: {
      ...navData,
      order,
    },
  });
};

/**
 * Update a navigation item
 * @param {string} id
 * @param {string} academyId
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateNavigationItem = async (id, academyId, updateData) => {
  const navItem = await prisma.academyNavigation.findFirst({
    where: {
      id,
      academyId,
    },
  });

  if (!navItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Navigation item not found');
  }

  return prisma.academyNavigation.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a navigation item
 * @param {string} id
 * @param {string} academyId
 * @returns {Promise}
 */
const deleteNavigationItem = async (id, academyId) => {
  const navItem = await prisma.academyNavigation.findFirst({
    where: {
      id,
      academyId,
    },
    include: {
      children: true,
    },
  });

  if (!navItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Navigation item not found');
  }

  if (navItem.children.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete item with children'
    );
  }

  await prisma.academyNavigation.delete({
    where: { id },
  });
};

/**
 * Get navigation item by slug
 * @param {string} academyId
 * @param {string} slug
 * @returns {Promise<Object>}
 */
const getNavigationItemBySlug = async (academyId, slug) => {
  return prisma.academyNavigation.findFirst({
    where: {
      academyId,
      slug,
    },
  });
};

/**
 * Reorder navigation items
 * @param {string} academyId
 * @param {Array} items
 * @returns {Promise}
 */
const reorderNavigationItems = async (academyId, items) => {
  const updates = items.map((item, index) =>
    prisma.academyNavigation.update({
      where: {
        id: item.id,
        academyId,
      },
      data: {
        order: index + 1,
      },
    })
  );

  await prisma.$transaction(updates);
};

/**
 * Toggle navigation item status
 * @param {string} id
 * @param {string} academyId
 * @param {boolean} isActive
 * @returns {Promise<Object>}
 */

const toggleNavigationStatus = async (id, isActive) => {
  'ID', id;

  const navItem = await prisma.academyNavigation.findFirst({
    where: {
      id,
    },
  });

  if (!navItem) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Navigation item not found');
  }

  return prisma.academyNavigation.update({
    where: { id },
    data: { isActive },
  });
};

/**
 * Get all active navigation items for an academy by domain
 * @param {string} domain
 * @returns {Promise<Array>}
 */
const getAllActiveNavigationByDomain = async (domain) => {
  const academy = await prisma.academy.findFirst({
    where: { domain },
  });

  if (!academy) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Academy not found for this domain'
    );
  }

  const navigationItems = await prisma.academyNavigation.findMany({
    where: {
      academyId: academy.id,
      isActive: true,
      parentId: null,
    },
    orderBy: {
      order: 'asc',
    },
    include: {
      children: {
        where: {
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  return navigationItems;
};

const navigationService = {
  listNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  getNavigationItemBySlug,
  reorderNavigationItems,
  toggleNavigationStatus,
  getAllActiveNavigationByDomain,
};

module.exports = navigationService;
