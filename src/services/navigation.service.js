// services/navigation.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status');

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

module.exports = {
  listNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  getNavigationItemBySlug,
  reorderNavigationItems,
};
