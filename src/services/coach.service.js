const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const config = require('../config');
const decodeToken = require('../utils/decodeToken');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const hashPassword = require('../utils/hashPassword');
const crypto = require('crypto');
const { getSingleAcademyForUser } = require('./academy.service');
const { getDomainFromAdmin } = require('../utils/getDomainFromAdmin');

const inviteCoachHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, academyId: providedAcademyId } = data;

  let academyId;

  if (loggedInUser.role === 'SUPER_ADMIN') {
    if (!providedAcademyId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'academyId is required for SUPER_ADMIN users.'
      );
    }

    const academyExists = await db.academy.findUnique({
      where: { id: providedAcademyId },
      select: { id: true },
    });

    if (!academyExists) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Provided academyId does not exist.'
      );
    }

    academyId = providedAcademyId;
  } else {
    const academy = await getSingleAcademyForUser(loggedInUser);
    academyId = academy.id;
  }

  const existingInvitation = await db.invitation.findFirst({
    where: {
      email,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'An invitation has already been sent to this email.'
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'A user with this email already exists.'
    );
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: {
      name: true,
      domain: true,
    },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found.');
  }

  const academyName = academy.name;

  const coachInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        email,
        academyId,
        subRole: data.subRole,
        password: hashedPassword,
      },
      email,
      type: 'BATCH_COACH',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdBy: {
        connect: {
          id: loggedInUser.id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      data: true,
      createdBy: true,
      version: true,
    },
  });

  const token = await createToken(
    {
      id: coachInvitation.id,
      version: coachInvitation.version,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  let baseUrl;

  if (data.subRole === 'HEAD_COACH') {
    if (!academy.domain) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Academy domain not configured for HEAD_COACH invitation'
      );
    }
    const domainUrl = academy.domain;

    if (!domainUrl) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid academy domain configuration'
      );
    }
  } else {
    const domain = getDomainFromAdmin(academy.domain);
    baseUrl = domain;
  }

  const ACTIVATION_URL = `${baseUrl}/invitation?type=BATCH_COACH&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academyName}`
  )}&token=${token}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academyName}" as a ${
        data.subRole || 'coach'
      }!`,
      table: {
        data: [
          {
            label: 'Email',
            value: email,
          },
          {
            label: 'Temporary Password',
            value: tempPassword,
          },
        ],
      },
      action: {
        instructions:
          'To accept this invitation, please click the button below:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      outro: 'If you have any questions, feel free to reply to this email.',
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  try {
    await sendMail(email, 'Academy Coach Invitation', emailText, emailBody);
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send invitation email'
    );
  }

  return { coachInvitation };
};

const verifyCoachInvitationHandler = async (token) => {
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token not present!');
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  return await db.$transaction(async (prisma) => {
    const coachInvitation = await prisma.invitation.findFirst({
      where: {
        id: data.id,
        status: 'PENDING',
      },
      select: {
        id: true,
        data: true,
        type: true,
        status: true,
        version: true,
      },
    });

    if (!coachInvitation) {
      throw new ApiError(
        httpStatus.ALREADY_REPORTED,
        'Invitation not found or already processed!'
      );
    }

    if (coachInvitation.type !== 'BATCH_COACH') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid invitation type!');
    }

    const {
      firstName,
      lastName,
      email,
      academyId,
      subRole,
      password,
      version,
    } = coachInvitation.data;

    // Verify token version
    if (data.version !== coachInvitation.version) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid or expired invitation link.'
      );
    }

    // Check if academy exists
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!academy) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');
    }

    // Check if email already exists
    const isEmailAlreadyExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (isEmailAlreadyExists) {
      // If email exists, mark invitation as processed and throw error
      await prisma.invitation.delete({
        where: { id: coachInvitation.id },
      });
      throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
    }

    // Immediately mark the invitation as being processed by deleting it
    // This prevents race conditions
    await prisma.invitation.delete({
      where: { id: coachInvitation.id },
    });

    // Create coach profile
    const coachProfile = await prisma.profile.create({
      data: {
        firstName,
        lastName,
      },
      select: {
        id: true,
      },
    });

    // Generate unique coach code
    const userCount = await prisma.user.count();
    const newCode = formatNumberWithPrefix('C', userCount + 1);

    // Get coach role
    const coachRole = await prisma.role.findFirst({
      where: {
        name: 'COACH',
      },
    });

    if (!coachRole) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Coach role not found!');
    }

    // Create the coach user
    const coach = await prisma.user.create({
      data: {
        email,
        profile: {
          connect: {
            id: coachProfile.id,
          },
        },
        code: newCode,
        assignedToAcademy: {
          connect: {
            id: academy.id,
          },
        },
        role: {
          connect: {
            id: coachRole.id,
          },
        },
        subRole: subRole,
        password,
      },
      select: {
        id: true,
        email: true,
        assignedToAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      newCoach: coach,
    };
  });
};

const fetchAllCoachesHandler = async (loggedInUser) => {
  const selectFields = {
    id: true,
    email: true,
    subRole: true,
    profile: {
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
      },
    },
    coachOfBatches: {
      select: {
        id: true,
        batchCode: true,
        description: true,
        studentCapacity: true,
        currentClass: true,
        currentLevel: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        startDate: true,
        createdAt: true,
      },
    },
  };

  let coaches;

  const coachRole = await db.role.findUnique({
    where: {
      name: 'COACH',
    },
  });

  if (loggedInUser.role === 'SUPER_ADMIN') {
    coaches = await db.user.findMany({
      where: {
        role: {
          id: coachRole.id,
        },
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'ADMIN') {
    const academy = await getSingleAcademyForUser(loggedInUser);

    coaches = await db.user.findMany({
      where: {
        role: {
          id: coachRole.id,
        },
        assignedToAcademyId: academy.id,
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'COACH') {
    coaches = await db.user.findUnique({
      where: { id: loggedInUser.id },
      select: selectFields,
    });

    if (!coaches) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Coach not found');
    }

    coaches = [coaches];
  } else {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to view coaches'
    );
  }

  return coaches;
};

const coachService = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
};

module.exports = coachService;
