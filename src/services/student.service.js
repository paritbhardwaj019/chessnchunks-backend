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
        role: 'STUDENT',
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

    await prisma.invitation.delete({
      where: { id: studentInvitation.id },
    });

    return student;
  });

  return {
    newStudent,
  };
};

const fetchAllStudentsHandler = async (loggedInUser) => {
  const selectFields = {
    id: true,
    email: true,
    role: true,
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
    studentOfBatches: {
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

  let students;

  if (loggedInUser.role === 'SUPER_ADMIN') {
    students = await db.user.findMany({
      where: {
        role: 'STUDENT',
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'ADMIN') {
    const academy = await getSingleAcademyForUser(loggedInUser);

    students = await db.user.findMany({
      where: {
        role: 'STUDENT',
        assignedToAcademyId: academy.id,
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'COACH') {
    students = await db.user.findMany({
      where: {
        role: 'STUDENT',
        studentOfBatches: {
          some: {
            coaches: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
      select: selectFields,
    });
  }

  return students;
};

const fetchAllStudentsByBatchId = async (batchId, { query }) => {
  console.log('BATCH ID', batchId);

  const batchExists = await db.batch.findUnique({
    where: { id: batchId },
    select: { id: true },
  });

  if (!batchExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  const selectFields = {
    id: true,
    email: true,
    role: true,
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
    studentOfBatches: {
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
    createdAt: true,
  };

  const whereClause = {
    role: 'STUDENT',
    studentOfBatches: {
      some: {
        id: batchId,
      },
    },
  };

  if (query) {
    whereClause.OR = [
      { email: { contains: query } },
      {
        profile: { firstName: { contains: query } },
      },
      { profile: { lastName: { contains: query } } },
      {
        profile: { middleName: { contains: query } },
      },
    ];
  }

  const students = await db.user.findMany({
    where: whereClause,
    select: selectFields,
  });

  return students;
};

const moveStudentToBatchHandler = async (studentId, fromBatchId, toBatchId) => {
  console.log(studentId, fromBatchId, toBatchId);

  const fromBatch = await db.batch.findUnique({
    where: { id: fromBatchId },
    select: { id: true },
  });

  if (!fromBatch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Source batch not found');
  }

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

  const updatedStudent = await db.$transaction(async (prisma) => {
    await prisma.user.update({
      where: { id: studentId },
      data: {
        studentOfBatches: {
          disconnect: { id: fromBatchId },
        },
      },
    });

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
    message: 'Student moved successfully.',
    batchCode: toBatch.batchCode,
  };

  if (warning) {
    response.warning = true;
    response.remainingCapacity = remainingCapacity;
  }

  return response;
};
const studentService = {
  inviteStudentHandler,
  verifyStudentHandler,
  fetchAllStudentsHandler,
  fetchAllStudentsByBatchId,
  moveStudentToBatchHandler,
};

module.exports = studentService;
