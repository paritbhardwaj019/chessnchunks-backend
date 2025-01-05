const defaultPages = require('../data/defaultPages');
const db = require('../database/prisma');

const createDefaultPagesForAcademy = async (academyId) => {
  return await db.$transaction(async (prisma) => {
    const pages = await Promise.all(
      defaultPages.map(async (pageData) => {
        const page = await prisma.page.create({
          data: {
            title: pageData.title,
            slug: pageData.slug,
            status: pageData.status,
            academyId,
            components: {
              create: pageData.components.create.map((component) => ({
                type: component.type,
                props: component.props,
                order: component.order,
              })),
            },
          },
          include: {
            components: true,
          },
        });
        return page;
      })
    );

    return pages;
  });
};

module.exports = createDefaultPagesForAcademy;
