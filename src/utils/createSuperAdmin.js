const prompt = require('prompt');
const db = require('../database/prisma');
const logger = require('./logger');
const _ = require('lodash');
const hashPassword = require('./hashPassword');

const flag = process.argv[2];

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
        message: 'Password do not match',
      },
    },
  };

  prompt.get(schema, async (err, { firstName, lastName, password, email }) => {
    if (err) {
      logger.error(err);
      return;
    }

    const hashedPassword = await hashPassword(password, 10);

    const superAdminProfile = await db.profile.create({
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
      },
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
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
      },
    });

    if (!_.isEmpty(superAdmin)) {
      logger.info('Superadmin created successfully');
    }
  });
}

if (flag === '-cu') {
  createSuperAdmin();
}
