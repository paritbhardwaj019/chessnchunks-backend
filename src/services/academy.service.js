const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinary.utils');
const fs = require('fs');

const updateAcademyByIdHandler = async (data, id, loggedInUser) => {
  console.log(data, id, loggedInUser);

  if (loggedInUser.role === 'SUPER_ADMIN') {
    const updatedAcademy = await db.academy.update({
      where: {
        id,
      },
      data,
    });

    return {
      updatedAcademy,
    };
  } else if (loggedInUser.role === 'ADMIN') {
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

const fetchAcademyByIdHandler = async (id, loggedInUser) => {
  if (loggedInUser.role === 'SUPER_ADMIN') {
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
  } else if (loggedInUser.role === 'ADMIN') {
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

    console.log('academy', academy);

    return {
      academy,
    };
  }
};

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

  if (user.role.name === 'ADMIN') {
    academyIds = user.adminOfAcademies.map((academy) => academy.id);
  } else if (user.role.name === 'COACH') {
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

  // Get home page
  const homePage = academy.pages.find((page) => page.isHome);
  if (!homePage) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Home page not found for this academy'
    );
  }

  // Organize navigation into a tree structure
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
    loggedInUser.role !== 'SUPER_ADMIN' &&
    !academy.admins.some((admin) => admin.id === loggedInUser.id)
  ) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "User isn't authorized to perform this action"
    );
  }

  const updateData = {};

  console.log(logoFile);

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
