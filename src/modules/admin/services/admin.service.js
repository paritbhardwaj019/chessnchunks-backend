const crypto = require('crypto');

const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const config = require('../../../config');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const createToken = require('../../../utils/createToken');
const hashPassword = require('../../../utils/hashPassword');
const sendMail = require('../../../utils/sendEmail');
const academyService = require('../../academy/services/academy.service');

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Chess in Chunks',
    link: config.frontendUrl,
  },
});

const createAdminHandler = async (data, loggedInUser) => {
  const {
    firstName,
    lastName,
    email,
    contactNumber,
    adminRole = 'ACADEMY_ADMIN',
  } = data;

  const academy = await academyService.getSingleAcademyForUser(loggedInUser);
  const academyId = academy.id;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }

  if (adminRole === 'MASTER_ADMIN') {
    const existingMasterAdmin = await db.user.findFirst({
      where: {
        adminRole: 'MASTER_ADMIN',
        adminOfAcademies: {
          some: { id: academyId },
        },
      },
    });

    if (existingMasterAdmin) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Academy already has a Master Admin'
      );
    }
  }

  const adminRoleData = await db.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRoleData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin role not found');
  }

  try {
    const newAdmin = await db.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          code: `ADM${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          status: 'INACTIVE',
          adminRole,
          roleId: adminRoleData.id,
          profile: {
            create: {
              firstName,
              lastName,
              phoneNumber: contactNumber,
            },
          },
          adminOfAcademies: {
            connect: {
              id: academyId,
            },
          },
        },
        include: {
          profile: true,
          role: true,
          adminOfAcademies: true,
        },
      });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.emailVerification.create({
        data: {
          email,
          otp,
          type: 'ADMIN_SETUP',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const token = await createToken(
        { email, purpose: 'ADMIN_SETUP' },
        config.jwt.secret,
        '24h'
      );

      const setupUrl = `${
        academy.domain
      }/admin/setup?token=${token}&email=${encodeURIComponent(email)}`;

      const emailContent = {
        body: {
          name: `${firstName} ${lastName}`,
          intro: [
            'Welcome to Chess in Chunks!',
            `You have been invited to be an admin for ${academy.name}.`,
            'Please follow these steps to complete your account setup:',
          ],
          table: {
            data: [
              {
                item: 'Your OTP',
                description: otp,
              },
              {
                item: 'Expires In',
                description: '24 hours',
              },
            ],
          },
          action: {
            instructions:
              'Click the button below to complete your account setup:',
            button: {
              color: '#22BC66',
              text: 'Complete Setup',
              link: setupUrl,
            },
          },
          outro: [
            'After completing the setup, you will be able to access the admin dashboard.',
            'If you did not request this invitation, please ignore this email.',
          ],
          signature: 'Best regards',
        },
      };

      const emailBody = mailGenerator.generate(emailContent);
      const emailText = mailGenerator.generatePlaintext(emailContent);

      await sendMail(
        email,
        'Complete Your Admin Account Setup - Chess in Chunks',
        emailText,
        emailBody
      );

      return { user, otp, token };
    });

    return newAdmin;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create admin'
    );
  }
};

const verifyAdminOTPHandler = async (data) => {
  const { code, email } = data;

  const verification = await db.emailVerification.findFirst({
    where: {
      email,
      otp: code,
      verified: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verification) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  await db.emailVerification.update({
    where: { id: verification.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  });

  const token = createToken(
    { email, purpose: 'admin-setup' },
    config.jwt.secret,
    '1h'
  );

  return { token };
};

const setAdminPasswordHandler = async (data) => {
  const { email, password } = data;

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status === 'ACTIVE') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Account already activated');
  }

  const hashedPassword = await hashPassword(password, 10);

  await db.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      status: 'ACTIVE',
    },
  });

  return { message: 'Password set successfully' };
};

const transferOwnershipHandler = async (data, loggedInUser) => {
  const { fromAdminId, toAdminId } = data;
  const { academyId } = loggedInUser;

  try {
    await db.$transaction(async (prisma) => {
      const [fromAdmin, toAdmin] = await Promise.all([
        prisma.user.findFirst({
          where: {
            id: fromAdminId,
            adminRole: 'MASTER_ADMIN',
            adminOfAcademies: { some: { id: academyId } },
          },
        }),
        prisma.user.findFirst({
          where: {
            id: toAdminId,
            adminRole: 'ACADEMY_ADMIN',
            adminOfAcademies: { some: { id: academyId } },
          },
        }),
      ]);

      if (!fromAdmin || !toAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid admin IDs');
      }

      await Promise.all([
        prisma.user.update({
          where: { id: fromAdminId },
          data: { adminRole: 'ACADEMY_ADMIN' },
        }),
        prisma.user.update({
          where: { id: toAdminId },
          data: { adminRole: 'MASTER_ADMIN' },
        }),
      ]);
    });

    return { message: 'Ownership transferred successfully' };
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to transfer ownership'
    );
  }
};

const fetchAllAdmins = async (loggedInUser, { page, limit, query }) => {
  const filter = {
    role: { name: 'ADMIN' },
    adminOfAcademies: {
      some: {
        id: loggedInUser.academyId,
      },
    },
    id: {
      not: loggedInUser.id,
    },
    ...(query && {
      OR: [
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          profile: {
            OR: [
              {
                firstName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ],
    }),
  };

  return db.user.findMany({
    where: filter,
    include: {
      profile: true,
      role: true,
      adminOfAcademies: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: page ? (page - 1) * limit : undefined,
    take: limit ? Number(limit) : undefined,
  });
};

const deleteAdminHandler = async (id, loggedInUser) => {
  const admin = await db.user.findFirst({
    where: {
      id,
      adminRole: 'ACADEMY_ADMIN',
      adminOfAcademies: {
        some: {
          id: loggedInUser.academyId,
        },
      },
    },
  });

  if (!admin) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Admin not found or cannot be deleted'
    );
  }

  await db.user.delete({ where: { id } });
  return { message: 'Admin deleted successfully' };
};

const adminService = {
  createAdminHandler,
  verifyAdminOTPHandler,
  setAdminPasswordHandler,
  transferOwnershipHandler,
  fetchAllAdmins,
  deleteAdminHandler,
};

module.exports = adminService;
