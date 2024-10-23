// services/coach.service.js

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

const inviteCoachHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, academyId: providedAcademyId } = data;

  let academyId;

  // Handle academyId based on user role
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

  // Check for existing invitations
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

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'A user with this email already exists.'
    );
  }

  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  // Retrieve academy details
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { name: true },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found.');
  }

  const academyName = academy.name;

  // Create coach invitation
  const coachInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        email,
        academyId,
        subRole: data.subRole, // Retain subRole if it's still relevant
        password: hashedPassword,
      },
      email,
      type: 'ACADEMY_COACH', // Updated invitation type
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days
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
      version: true, // Include version if needed
    },
  });

  // Create token for invitation
  const token = await createToken(
    {
      id: coachInvitation.id,
      version: coachInvitation.version, // Include version in token
    },
    config.jwt.invitationSecret,
    '3d'
  );

  // Construct activation URL
  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=ACADEMY_COACH&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academyName}`
  )}&token=${token}`;

  // Generate email content
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
      intro: `You are invited to join the academy "${academyName}" as a coach!`,
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

  // Send the invitation email
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

  const coachInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      data: true,
      type: true,
      status: true,
      version: true,
    },
  });

  if (!coachInvitation)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation not found!');

  if (coachInvitation.type !== 'ACADEMY_COACH')
    // Updated invitation type check
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid invitation type!');

  if (coachInvitation.status === 'ACCEPTED')
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );

  const { firstName, lastName, email, academyId, subRole, password, version } =
    coachInvitation.data;

  // Verify token version
  if (data.version !== coachInvitation.version) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid or expired invitation link.'
    );
  }

  // Check if academy exists
  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!academy)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');

  // Check if email already exists
  const isEmailAlreadyExists = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (isEmailAlreadyExists) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
  }

  // Create coach profile
  const coachProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
    },
  });

  // Generate unique coach code
  const userCount = await db.user.count();
  const newCode = formatNumberWithPrefix('C', userCount + 1); // Prefix 'C' for Coach

  // Create the coach user within a transaction
  const newCoach = await db.$transaction(async (prisma) => {
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
        role: 'COACH',
        subRole: subRole, // Assign subRole if applicable
        hasPassword: true,
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

    // Update the invitation status to 'ACCEPTED' or delete it
    await prisma.invitation.delete({
      where: { id: coachInvitation.id },
    });

    return coach;
  });

  return {
    newCoach,
  };
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
        dob: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        parentName: true,
        parentEmailId: true,
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

  if (loggedInUser.role === 'SUPER_ADMIN') {
    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'ADMIN') {
    const adminWithAcademies = await db.user.findUnique({
      where: { id: loggedInUser.id },
      select: {
        adminOfAcademies: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !adminWithAcademies ||
      adminWithAcademies.adminOfAcademies.length === 0
    ) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Admin is not associated with any academy'
      );
    }

    const academyIds = adminWithAcademies.adminOfAcademies.map(
      (academy) => academy.id
    );

    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
        coachOfBatches: {
          some: {
            academyId: { in: academyIds },
          },
        },
      },
      select: selectFields,
    });
  }

  return coaches;
};

const coachService = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
};

module.exports = coachService;
