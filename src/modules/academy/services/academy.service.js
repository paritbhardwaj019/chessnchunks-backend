const fs = require('fs');

const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../../../utils/cloudinary.utils');
const ROLE_CONSTANT = require('../../../constants');

/**
 * Updates academy by ID
 * @async
 * @param {Object} data - Academy update data
 * @param {string} id - Academy ID
 * @param {Object} loggedInUser - Currently logged in user
 * @param {string} loggedInUser.role - User's role
 * @param {string} loggedInUser.id - User's ID
 * @returns {Promise<Object>} Updated academy data
 * @throws {ApiError} If academy not found or user unauthorized
 */
const updateAcademyByIdHandler = async (data, id, loggedInUser) => {
  if (loggedInUser.role === ROLE_CONSTANT.ROLE.SUPER_ADMIN) {
    const updatedAcademy = await db.academy.update({
      where: {
        id,
      },
      data,
    });

    return {
      updatedAcademy,
    };
  } else if (loggedInUser.role === ROLE_CONSTANT.ROLE.ADMIN) {
    const hasAccess = await db.academy.findFirst({
      where: {
        id,
        admins: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
      select: {
        admins: true,
        id: true,
      },
    });

    if (!hasAccess)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User isn't authorized to perform this action"
      );

    const updatedAcademy = await db.academy.update({
      where: {
        id,
      },
      data,
    });

    return {
      updatedAcademy,
    };
  }
};

/**
 * Fetches academy by ID
 * @async
 * @param {string} id - Academy ID
 * @param {Object} loggedInUser - Currently logged in user
 * @param {string} loggedInUser.role - User's role
 * @param {string} loggedInUser.id - User's ID
 * @returns {Promise<Object>} Academy details
 * @throws {ApiError} If academy not found or user unauthorized
 */
const fetchAcademyByIdHandler = async (id, loggedInUser) => {
  if (loggedInUser.role === ROLE_CONSTANT.ROLE.SUPER_ADMIN) {
    const academy = await db.academy.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            email: true,
          },
        },
        batches: {
          include: {
            students: {
              select: { id: true },
            },
            coaches: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!academy) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
    }

    const totalStudents = academy.batches.reduce(
      (acc, batch) => acc + batch.students.length,
      0
    );
    const totalCoaches = academy.batches.reduce(
      (acc, batch) => acc + batch.coaches.length,
      0
    );

    return {
      academy: {
        name: academy.name,
        fullName: academy.admins.map(
          (admin) => `${admin.profile?.firstName} ${admin.profile?.lastName}`
        ),
        email: academy.admins.map((admin) => admin.email),
        students: totalStudents,
        coaches: totalCoaches,
        batches: academy.batches.length,
        status: academy.status,
        createdAt: academy.createdAt,
      },
    };
  } else if (loggedInUser.role === ROLE_CONSTANT.ROLE.ADMIN) {
    const academy = await db.academy.findFirst({
      where: {
        id,
        admins: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    });

    if (!academy)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User isn't authorized to perform this action"
      );

    'academy', academy;

    return {
      academy,
    };
  }
};

/**
 * Gets single academy for user
 * @async
 * @param {Object} loggedInUser - Currently logged in user
 * @param {string} loggedInUser.id - User's ID
 * @returns {Promise<Object>} Academy details
 * @throws {ApiError} If user not found or not associated with any academy
 */
const getSingleAcademyForUser = async (loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: true,
      coachOfBatches: {
        include: {
          academy: true,
        },
      },
      assignedToAcademy: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  let academyIds = [];

  if (user.role.name === ROLE_CONSTANT.ROLE.ADMIN) {
    academyIds = user.adminOfAcademies.map((academy) => academy.id);
  } else if (
    user.role.name === ROLE_CONSTANT.ROLE.COACH ||
    user.role.name === ROLE_CONSTANT.ROLE.STUDENT
  ) {
    academyIds = [user.assignedToAcademy.id];
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role "${user.role.name}" is not authorized to perform this action.`
    );
  }

  academyIds = [...new Set(academyIds)];

  if (academyIds.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${user.role} is not associated with any academy.`
    );
  }

  if (academyIds.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${user.role} is associated with multiple academies. Please specify the academy.`
    );
  }

  const academy = await db.academy.findUnique({
    where: { id: academyIds[0] },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found.');
  }

  return academy;
};

/**
 * Gets academy by domain
 * @async
 * @param {string} domain - Academy domain
 * @returns {Promise<Object>} Academy data with navigation and pages
 * @throws {ApiError} If academy not found
 */
const getAcademyByDomain = async (domain) => {
  const academy = await db.academy.findUnique({
    where: { domain },
    select: {
      id: true,
      name: true,
      logo: true,
      domain: true,
      navigation: {
        where: {
          isActive: true,
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
      },
      pages: {
        where: {
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          isHome: true,
          components: {
            orderBy: {
              order: 'asc',
            },
            select: {
              id: true,
              type: true,
              props: true,
              order: true,
            },
          },
          publishedAt: true,
        },
      },
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
  }

  const homePage = academy.pages.find((page) => page.isHome);
  if (!homePage) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Home page not found for this academy'
    );
  }

  const organizeNavigation = (items, parentId = null) => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: organizeNavigation(items, item.id),
      }));
  };

  // Structure the response
  const response = {
    academy: {
      id: academy.id,
      name: academy.name,
      logo: academy.logo,
      domain: academy.domain,
    },
    navigation: organizeNavigation(academy.navigation),
    pages: academy.pages,
    homePage,
  };

  return response;
};

const parseSlug = (slug) => {
  const cleanedSlug = slug.replace(/^\/+|\/+$/g, '');
  return `/${cleanedSlug}`;
};

/**
 * Gets public page by slug
 * @async
 * @param {string} domain - Academy domain
 * @param {string} slug - Page slug
 * @returns {Promise<Object>} Page data
 * @throws {ApiError} If page or academy not found
 */
const getPublicPageBySlug = async (domain, slug) => {
  const parsedSlug = parseSlug(slug);

  const academy = await db.academy.findUnique({
    where: { domain },
    select: {
      id: true,
      pages: {
        where: {
          slug: parsedSlug,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          components: {
            orderBy: {
              order: 'asc',
            },
            select: {
              id: true,
              type: true,
              props: true,
              order: true,
            },
          },
          publishedAt: true,
        },
      },
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
  }

  if (!academy.pages.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
  }

  return academy.pages[0];
};

/**
 * Updates component by ID
 * @async
 * @param {string} pageId - Page ID
 * @param {string} componentId - Component ID
 * @param {Object} componentData - Component update data
 * @returns {Promise<Object>} Updated component and page data
 * @throws {ApiError} If page or component not found
 */
const updateComponentById = async (pageId, componentId, componentData) => {
  return await db.$transaction(async (prisma) => {
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        components: {
          where: {
            id: componentId,
          },
        },
      },
    });

    if (!existingPage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
    }

    if (!existingPage.components.length) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Component not found in this page'
      );
    }

    const updatedComponent = await prisma.pageComponent.update({
      where: {
        id: componentId,
      },
      data: {
        type: componentData.type,
        props: componentData.props,
        order: componentData.order,
      },
    });

    const updatedPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        components: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return {
      component: updatedComponent,
      page: updatedPage,
    };
  });
};

/**
 * Updates academy settings
 * @async
 * @param {string} id - Academy ID
 * @param {Object} data - Settings data
 * @param {number} data.signUpFee - Academy signup fee
 * @param {Object} logoFile - Uploaded logo file
 * @param {Object} loggedInUser - Currently logged in user
 * @param {string} loggedInUser.role - User's role
 * @param {string} loggedInUser.id - User's ID
 * @returns {Promise<Object>} Updated academy settings
 * @throws {ApiError} If academy not found or user unauthorized
 */
const updateAcademySettings = async (id, data, logoFile, loggedInUser) => {
  const academy = await db.academy.findUnique({
    where: { id },
    include: {
      admins: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
  }

  if (
    loggedInUser.role !== ROLE_CONSTANT.ROLE.SUPER_ADMIN &&
    !academy.admins.some((admin) => admin.id === loggedInUser.id)
  ) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User isn't authorized to perform this action"
    );
  }

  const updateData = {};

  if (logoFile) {
    try {
      const cloudinaryResponse = await uploadToCloudinary(logoFile.path, {
        folder: 'academy-logos',
        publicId: `academy-${id}-logo`,
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
        maxSize: 5 * 1024 * 1024,
      });

      if (academy.logo) {
        const existingLogoPublicId = academy.logo
          .split('/')
          .slice(-1)[0]
          .split('.')[0];
        if (existingLogoPublicId) {
          await deleteFromCloudinary(existingLogoPublicId);
        }
      }

      updateData.logo = cloudinaryResponse.url;

      await fs.unlinkSync(logoFile.path);
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Logo upload failed - ${error.message}`
      );
    }
  }

  if (data.signUpFee !== undefined) {
    const fee = parseFloat(data.signUpFee);
    if (isNaN(fee) || fee < 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Sign up fee must be a valid non-negative number'
      );
    }
    updateData.signUpFee = fee;
  }

  const updatedAcademy = await db.academy.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      logo: true,
      signUpFee: true,
      updatedAt: true,
    },
  });

  return { updatedAcademy };
};

const academyService = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
  getSingleAcademyForUser,
  getAcademyByDomain,
  getPublicPageBySlug,
  updateComponentById,
  updateAcademySettings,
};

module.exports = academyService;
