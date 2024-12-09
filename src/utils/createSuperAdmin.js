const prompt = require('prompt');
const db = require('../database/prisma');
const logger = require('./logger');
const _ = require('lodash');
const hashPassword = require('./hashPassword');
const formatNumberWithPrefix = require('./formatNumberWithPrefix');

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
      dateOfBirth: {
        type: 'string',
        required: true,
        message: 'Date of birth required (YYYY-MM-DD)',
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

  prompt.get(
    schema,
    async (err, { firstName, lastName, password, email, dateOfBirth }) => {
      if (err) {
        logger.error(err);
        return;
      }

      const isEmailAlreadyExists = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (isEmailAlreadyExists) {
        throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
      }

      const userCount = await db.user.count();
      const newCode = formatNumberWithPrefix('U', userCount);

      const hashedPassword = await hashPassword(password, 10);

      const superAdminProfile = await db.profile.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
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
        select: {
          id: true,
        },
      });

      if (!_.isEmpty(superAdmin)) {
        logger.info('Superadmin created successfully');
      }
    }
  );
}

if (flag === '-cu') {
  createSuperAdmin();
}
