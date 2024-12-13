const httpStatus = require('http-status');
const db = require('../database/prisma');
const createToken = require('../utils/createToken');
const ApiError = require('../utils/apiError');
const decodeToken = require('../utils/decodeToken');
const config = require('../config');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const crypto = require('crypto');
const hashPassword = require('../utils/hashPassword');
const { getSingleAcademyForUser } = require('./academy.service');

const inviteStudentHandler = async (data, loggedInUser) => {
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
    select: { name: true },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found.');
  }

  const academyName = academy.name;

  const studentInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        email,
        academyId,
        password: hashedPassword,
      },
      email,
      type: 'BATCH_STUDENT',
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
      id: studentInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.chessinChunksUrl
  }/invitation?type=USER_INVITATION&name=${encodeURIComponent(
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
      intro: `You are invited to join the academy "${academyName}" as a student!`,
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
    await sendMail(email, 'Academy Student Invitation', emailText, emailBody);
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send invitation email'
    );
  }

  return { studentInvitation };
};

const verifyStudentHandler = async (token) => {
  if (!token) throw new ApiError(httpStatus.BAD_REQUEST, 'Token not present!');

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const studentInvitation = await db.invitation.findUnique({
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

  if (!studentInvitation)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation not found!');

  if (studentInvitation.type !== 'BATCH_STUDENT')
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid invitation type!');

  if (studentInvitation.status === 'ACCEPTED')
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );

  const { firstName, lastName, email, academyId, password } =
    studentInvitation.data;

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: {
      id: true,
    },
  });

  if (!academy)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');

  const isEmailAlreadyExists = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (isEmailAlreadyExists) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
  }

  const studentProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
  });

  const userCount = await db.user.count();
  const newCode = formatNumberWithPrefix('U', userCount + 1);

  const studentRole = await db.role.findFirst({
    where: {
      name: 'STUDENT',
    },
  });

  const newStudent = await db.$transaction(async (prisma) => {
    const student = await prisma.user.create({
      data: {
        email,
        profile: {
          connect: {
            id: studentProfile.id,
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
            id: studentRole.id,
          },
        },
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

    await prisma.invitation.delete({
      where: { id: studentInvitation.id },
    });

    return student;
  });

  return {
    newStudent,
  };
};

const fetchAllStudentsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const skip = (numberPage - 1) * numberLimit;
  const take = numberLimit;

  const studentRole = await db.role.findFirst({
    where: { name: 'STUDENT' },
  });

  if (!studentRole) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student role not found');
  }

  const baseFilter = {
    roleId: studentRole.id,
    NOT: { id: loggedInUser.id },
    OR: query
      ? [
          { email: { contains: query } },
          { profile: { firstName: { contains: query } } },
          { profile: { lastName: { contains: query } } },
          { profile: { middleName: { contains: query } } },
          { code: { contains: query } },
        ]
      : undefined,
  };

  const selectFields = {
    id: true,
    email: true,
    status: true,
    code: true,
    lastLoginAt: true,
    mfaEnabled: true,
    profile: {
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        parentName: true,
        parentEmail: true,
        chessComId: true,
        lichessId: true,
        uscfId: true,
        imageUrl: true,
      },
    },
    studentOfBatches: {
      select: {
        id: true,
        batchCode: true,
        description: true,
        studentCapacity: true,
        currentClass: true,
        startLevel: true,
        currentLevel: true,
        startDate: true,
        isActive: true,
        academy: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    },
    studentSubscriptions: {
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        academyPlan: {
          select: {
            id: true,
            name: true,
            type: true,
            duration: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
    },
    createdAt: true,
    updatedAt: true,
  };

  let students = [];
  let total = 0;

  if (loggedInUser.role.name === 'SUPER_ADMIN') {
    [students, total] = await Promise.all([
      db.user.findMany({
        where: baseFilter,
        select: selectFields,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where: baseFilter }),
    ]);
  } else {
    const academy = await getSingleAcademyForUser(loggedInUser);
    if (!academy) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'No academy associated with the user'
      );
    }

    [students, total] = await Promise.all([
      db.user.findMany({
        where: {
          ...baseFilter,
          assignedToAcademyId: academy.id,
        },
        select: selectFields,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({
        where: {
          ...baseFilter,
          assignedToAcademyId: academy.id,
        },
      }),
    ]);
  }

  return {
    data: students,
    pagination: {
      total,
      page: numberPage,
      limit: numberLimit,
      totalPages: Math.ceil(total / numberLimit),
    },
  };
};

const fetchAllStudentsByBatchId = async (batchId, { query }) => {
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      academy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  const studentRole = await db.role.findFirst({
    where: { name: 'STUDENT' },
  });

  if (!studentRole) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student role not found');
  }

  const whereClause = {
    roleId: studentRole.id,
    studentOfBatches: {
      some: { id: batchId },
    },
    ...(query && {
      OR: [
        { email: { contains: query } },
        { profile: { firstName: { contains: query } } },
        { profile: { lastName: { contains: query } } },
        { profile: { middleName: { contains: query } } },
        { code: { contains: query } },
      ],
    }),
  };

  const students = await db.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      status: true,
      code: true,
      lastLoginAt: true,
      profile: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          phoneNumber: true,
          parentName: true,
          parentEmail: true,
          chessComId: true,
          lichessId: true,
          uscfId: true,
          imageUrl: true,
        },
      },
      studentOfBatches: {
        where: { id: batchId },
        select: {
          id: true,
          batchCode: true,
          currentClass: true,
          currentLevel: true,
          startDate: true,
        },
      },
      studentGoals: {
        where: {
          weeklyGoal: {
            batch: { id: batchId },
          },
        },
        select: {
          id: true,
          puzzlesTarget: true,
          puzzlesSolved: true,
          puzzlesPassed: true,
          weeklyGoal: {
            select: {
              id: true,
              code: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      batchHistory: {
        where: { batchId },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          fromDate: true,
          oldClass: true,
          newClass: true,
          oldLevel: true,
          newLevel: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      profile: {
        firstName: 'asc',
      },
    },
  });

  return {
    data: students,
    batchInfo: {
      id: batch.id,
      academyId: batch.academy.id,
      academyName: batch.academy.name,
    },
  };
};

const moveStudentToBatchHandler = async (studentId, fromBatchId, toBatchId) => {
  console.log(studentId, fromBatchId, toBatchId);

  // Get source batch with class and level info
  const fromBatch = await db.batch.findUnique({
    where: { id: fromBatchId },
    select: {
      id: true,
      currentClass: true,
      currentLevel: true,
      batchCode: true,
    },
  });

  if (!fromBatch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Source batch not found');
  }

  // Get destination batch with all necessary info
  const toBatch = await db.batch.findUnique({
    where: { id: toBatchId },
    include: {
      students: true,
    },
  });

  if (!toBatch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Destination batch not found');
  }

  const student = await db.user.findUnique({
    where: { id: studentId },
    include: {
      studentOfBatches: {
        where: { id: fromBatchId },
      },
    },
  });

  if (!student || student.studentOfBatches.length === 0) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Student not found in the source batch'
    );
  }

  const isAlreadyInBatch = toBatch.students.some((s) => s.id === studentId);
  if (isAlreadyInBatch) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Student is already in the destination batch.'
    );
  }

  const currentStudentCount = toBatch.students.length;

  if (currentStudentCount >= toBatch.studentCapacity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Batch ${toBatch.batchCode} is full. Cannot add more students.`
    );
  }

  let warning = false;
  let remainingCapacity = toBatch.studentCapacity - (currentStudentCount + 1);

  if (
    toBatch.warningCutoff &&
    currentStudentCount + 1 > toBatch.warningCutoff
  ) {
    warning = true;
    remainingCapacity = toBatch.studentCapacity - (currentStudentCount + 1);
  }

  const currentDate = new Date();

  // Handle everything in a transaction
  const updatedStudent = await db.$transaction(async (prisma) => {
    // Create exit history record
    await prisma.userBatchHistory.create({
      data: {
        userId: studentId,
        batchId: fromBatchId,
        fromDate: student.studentOfBatches[0].createdAt || new Date(), // Use batch assignment date or current date
        toDate: currentDate,
        reason: 'Batch Transfer',
        oldClass: fromBatch.currentClass,
        oldLevel: fromBatch.currentLevel,
        newClass: toBatch.currentClass,
        newLevel: toBatch.currentLevel,
      },
    });

    // Create entry history record
    await prisma.userBatchHistory.create({
      data: {
        userId: studentId,
        batchId: toBatchId,
        fromDate: currentDate,
        reason: 'Batch Transfer',
        oldClass: fromBatch.currentClass,
        oldLevel: fromBatch.currentLevel,
        newClass: toBatch.currentClass,
        newLevel: toBatch.currentLevel,
      },
    });

    // Remove from old batch
    await prisma.user.update({
      where: { id: studentId },
      data: {
        studentOfBatches: {
          disconnect: { id: fromBatchId },
        },
      },
    });

    // Add to new batch
    const updated = await prisma.user.update({
      where: { id: studentId },
      data: {
        studentOfBatches: {
          connect: { id: toBatchId },
        },
      },
      select: {
        id: true,
        email: true,
        studentOfBatches: {
          select: {
            id: true,
            batchCode: true,
          },
        },
      },
    });

    return updated;
  });

  const response = {
    message: `Student moved successfully from batch ${fromBatch.batchCode} to ${toBatch.batchCode}`,
    batchCode: toBatch.batchCode,
  };

  if (warning) {
    response.warning = true;
    response.remainingCapacity = remainingCapacity;
  }

  return response;
};

module.exports = {
  moveStudentToBatchHandler,
};

const studentService = {
  inviteStudentHandler,
  verifyStudentHandler,
  fetchAllStudentsHandler,
  fetchAllStudentsByBatchId,
  moveStudentToBatchHandler,
};

module.exports = studentService;
