const httpStatus = require('http-status');

const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const updatePage = async (pageId, pageData) => {
  return await db.$transaction(async (prisma) => {
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
      include: { components: true },
    });

    if (!existingPage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
    }

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        title: pageData.title,
        description: pageData.description,
        status: pageData.status,
        metaTitle: pageData.metaTitle,
        metaDescription: pageData.metaDescription,
      },
    });

    await prisma.pageComponent.deleteMany({
      where: { pageId },
    });

    const components = await prisma.pageComponent.createMany({
      data: pageData.components.map((component, index) => ({
        pageId,
        ...component,
        order: component.order || index + 1,
      })),
    });

    return {
      ...updatedPage,
      components,
    };
  });
};

const parseSlug = (slug) => {
  const cleanedSlug = slug.replace(/^\/+|\/+$/g, '');
  return `/${cleanedSlug}`;
};

const getPageBySlug = async (academyId, slug) => {
  const parsedSlug = parseSlug(slug);

  const page = await db.page.findFirst({
    where: {
      academyId,
      slug: parsedSlug,
      status: 'PUBLISHED',
    },
    include: {
      components: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!page) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Page not found');
  }

  return page;
};

const getAllPages = async (academyId) => {
  return await db.page.findMany({
    where: { academyId },
    include: {
      components: {
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateComponentOrder = async (pageId, componentOrders) => {
  return await db.$transaction(async (prisma) => {
    const updates = componentOrders.map(({ id, order }) =>
      prisma.pageComponent.update({
        where: { id },
        data: { order },
      })
    );

    return await Promise.all(updates);
  });
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

module.exports = {
  updatePage,
  getPageBySlug,
  getAllPages,
  updateComponentOrder,
  updateComponentById,
};
