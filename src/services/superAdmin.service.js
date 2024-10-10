const httpStatus = require('http-status');
const config = require('../config');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const decodeToken = require('../utils/decodeToken');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');

const inviteAcademyAdminHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, academyName } = data;

  const academyAdminInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        academyName,
        email,
      },
      email,
      type: 'CREATE_ACADEMY',
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
    },
  });

  const token = await createToken(
    {
      id: academyAdminInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=CREATE_ACADEMY&name=${encodeURIComponent(
    academyName
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
      intro: 'You are invited to join our academy as an admin!',
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Academy Admin Invitation',
    html: emailBody,
    text: emailText,
  };

  await sendMail(
    email,
    mailOptions.subject,
    mailOptions.text,
    mailOptions.html
  );

  return academyAdminInvitation;
};

const verifyAcademyAdminHandler = async (token) => {
  if (!token) {
    throw new ApiError('Token not present!', httpStatus.BAD_REQUEST);
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const academyAdminInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      data: true,
      type: true,
      status: true,
    },
  });

  if (academyAdminInvitation.type !== 'CREATE_ACADEMY') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }

  if (academyAdminInvitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );
  }

  const { firstName, lastName, email, academyName } =
    academyAdminInvitation.data;

  const academyAdminProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
    },
  });

  const academyAdmin = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: academyAdminProfile.id,
        },
      },
      role: 'ADMIN',
    },
    select: {
      id: true,
      email: true,
    },
  });

  const newAcademy = await db.academy.create({
    data: {
      name: academyName,
      admins: {
        connect: [
          {
            id: academyAdmin.id,
          },
        ],
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await db.user.update({
    where: {
      id: academyAdmin.id,
    },
    data: {
      adminOfAcademies: {
        connect: [{ id: newAcademy.id }],
      },
    },
  });

  await db.invitation.delete({
    where: {
      id: academyAdminInvitation.id,
    },
  });

  return {
    newAcademy,
    academyAdmin,
  };
};

const fetchAllAdminsByAcademyId = async (page, limit, academyId) => {
  const allAdmins = await db.user.findMany({
    where: {
      adminOfAcademies: {
        some: {
          id: academyId,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return allAdmins;
};

const fetchAllAcademiesHandler = async (page, limit, query) => {
  const allAcademies = await db.academy.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          batches: true,
          admins: true,
        },
      },
      createdAt: true,
    },
  });

  return allAcademies;
};

const fetchAllUsersHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page);
  const numberLimit = Number(limit);

  const user = await db.user.findUnique({
    where: {
      id: loggedInUser.id,
    },
    include: {
      adminOfAcademies: true,
    },
  });

  let allUsers = [];

  if (user.role === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: [
          {
            email: {
              contains: query,
            },
          },
          {
            profile: {
              firstName: {
                contains: query,
              },
            },
          },
          {
            profile: {
              lastName: {
                contains: query,
              },
            },
          },
        ],
      },
      select: {
        email: true,
        role: true,
        subRole: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } else if (user.role === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);

    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: [
          {
            adminOfAcademies: {
              some: {
                id: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            studentOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            coachOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
        ],
        AND: [
          {
            OR: [
              { email: { contains: query } },
              { profile: { firstName: { contains: query } } },
              { profile: { lastName: { contains: query } } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
        subRole: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  return {
    allUsers,
  };
};

const superAdminService = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllAcademiesHandler,
  fetchAllUsersHandler,
};

module.exports = superAdminService;
