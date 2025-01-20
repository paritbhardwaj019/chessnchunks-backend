const _ = require('lodash');
const prompt = require('prompt');

const { defaultNavigation } = require('../data/defaultNavigation');
const db = require('../database/prisma');
const createDefaultPagesForAcademy = require('../utils/createDefaultPages');

const formatNumberWithPrefix = require('./formatNumberWithPrefix');
const hashPassword = require('./hashPassword');
const logger = require('./logger');

const createNavigationItems = async (items, academyId, parentId = null) => {
  for (const item of items) {
    const navItem = await db.academyNavigation.create({
      data: {
        title: item.title,
        slug: item.slug,
        order: item.order,
        isActive: true,
        parentId,
        academyId,
      },
    });

    if (item.subItems && item.subItems.length > 0) {
      await createNavigationItems(item.subItems, academyId, navItem.id);
    }
  }
};

function createSuperAdmin() {
  prompt.message = 'Create Superadmin';
  prompt.start();

  const schema = {
    properties: {
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      email: {
        type: 'string',
        format: 'email',
        required: true,
      },
      dateOfBirth: {
        type: 'string',
        required: true,
        message: 'Date of birth required (YYYY-MM-DD)',
      },
      cicId: {
        type: 'string',
        required: true,
        message: 'Chess in Chunks ID required',
      },
      password: {
        type: 'string',
        hidden: true,
        required: true,
      },
      confirmPassword: {
        type: 'string',
        hidden: true,
        required: true,
        conform: (confirm) => {
          const pass = prompt.history('password').value;
          return confirm === pass;
        },
        message: 'Passwords do not match',
      },
    },
  };

  prompt.get(
    schema,
    async (
      err,
      { firstName, lastName, password, email, dateOfBirth, cicId }
    ) => {
      const academyName = 'Chess in Chunks';

      if (err) {
        logger.error(err);
        return;
      }

      try {
        const isEmailAlreadyExists = await db.user.findUnique({
          where: {
            email,
          },
        });

        if (isEmailAlreadyExists) {
          throw new Error('Email is already taken.');
        }

        const isCicIdExistsInProfile = await db.profile.findUnique({
          where: {
            cicId,
          },
        });

        if (isCicIdExistsInProfile) {
          throw new Error('Chess in Chunks ID is already taken.');
        }

        const userCount = await db.user.count();
        const newCode = formatNumberWithPrefix('U', userCount);

        const hashedPassword = await hashPassword(password, 10);

        const superAdminProfile = await db.profile.create({
          data: {
            firstName,
            lastName,
            dateOfBirth: new Date(dateOfBirth),
            cicId,
          },
          select: {
            id: true,
          },
        });

        const superAdminRole = await db.role.findUnique({
          where: { name: 'SUPER_ADMIN' },
        });

        const superAdmin = await db.user.create({
          data: {
            email,
            password: hashedPassword,
            profile: {
              connect: {
                id: superAdminProfile.id,
              },
            },
            code: newCode,
            role: {
              connect: {
                id: superAdminRole.id,
              },
            },
            status: 'ACTIVE',
          },
        });

        const newAcademy = await db.academy.create({
          data: {
            name: academyName,
            domain: `http://${academyName
              .toLowerCase()
              .replace(/\s+/g, '')}.localhost:3001`,
            admins: {
              connect: [{ id: superAdmin.id }],
            },
            status: 'ACTIVE',
            isDefault: true,
          },
        });

        await createNavigationItems(defaultNavigation, newAcademy.id);

        await createDefaultPagesForAcademy(newAcademy.id);

        await db.user.update({
          where: { id: superAdmin.id },
          data: {
            adminOfAcademies: {
              connect: [{ id: newAcademy.id }],
            },
          },
        });

        if (!_.isEmpty(superAdmin)) {
          logger.info('Superadmin created successfully');
          logger.info('Default academy created successfully');
        }
      } catch (error) {
        logger.error('Error creating superadmin:', error);
      }
    }
  );
}

if (process.argv[2] === '-cu') {
  createSuperAdmin();
}
