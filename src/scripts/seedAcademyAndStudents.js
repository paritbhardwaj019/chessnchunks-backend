const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const hashPassword = require('../utils/hashPassword');
const prisma = new PrismaClient();

const academyData = {
  name: 'Chess In Chunks Academy',
  logo: 'https://placeholder.com/logo.png',
  isDefault: true,
  domain: 'http://chess-in-chunks.localhost:3001',
};

const DEFAULT_PASSWORD = 'password1';

const adminData = {
  email: 'admin@chessinchunks.com',
  firstName: 'Admin',
  lastName: 'ChessInChunks',
  dateOfBirth: new Date('1985-01-01'),
  phoneNumber: '+1234567897',
  addressLine1: '123 Admin Street',
  city: 'Chess City',
  state: 'Chess State',
  country: 'USA',
};

const students = [
  {
    email: 'kitten@example.com',
    firstName: 'Kitten',
    lastName: 'Puff',
    chessComId: 'supercutekittenpuff',
    dateOfBirth: new Date('2015-01-01'),
    phoneNumber: '+1234567890',
    addressLine1: '123 Chess Street',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
  },
  {
    email: 'sashwin@example.com',
    firstName: 'Sashwin',
    lastName: 'G',
    chessComId: 'SashwinG',
    dateOfBirth: new Date('2014-05-15'),
    phoneNumber: '+1234567891',
    addressLine1: '456 Chess Avenue',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
  },
  {
    email: 'ranjhana@example.com',
    firstName: 'Ranjhana',
    lastName: 'R',
    chessComId: 'Ranjhannaa',
    dateOfBirth: new Date('2014-08-20'),
    phoneNumber: '+1234567892',
    addressLine1: '789 Chess Boulevard',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
  },
  {
    email: 'nive@example.com',
    firstName: 'Nive',
    lastName: 'Chitti',
    chessComId: 'nive_chitti',
    dateOfBirth: new Date('2015-03-10'),
    phoneNumber: '+1234567893',
    addressLine1: '321 Chess Lane',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
  },
  {
    email: 'rishaan@example.com',
    firstName: 'Rishaan',
    lastName: 'RJ',
    chessComId: 'Rishaan-RJ',
    dateOfBirth: new Date('2015-06-25'),
    phoneNumber: '+1234567894',
    addressLine1: '654 Chess Road',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
  },
];

const coaches = [
  {
    email: 'head.coach@example.com',
    firstName: 'John',
    lastName: 'Master',
    dateOfBirth: new Date('1990-01-01'),
    phoneNumber: '+1234567895',
    addressLine1: '789 Coach Avenue',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
    subRole: 'HEAD_COACH',
  },
  {
    email: 'senior.coach@example.com',
    firstName: 'Sarah',
    lastName: 'Expert',
    dateOfBirth: new Date('1992-05-15'),
    phoneNumber: '+1234567896',
    addressLine1: '456 Coach Street',
    city: 'Chess City',
    state: 'Chess State',
    country: 'USA',
    subRole: 'SENIOR_COACH',
  },
];

const batchData = {
  batchCode: 'BATCH-2024-01',
  description: 'Advanced Chess Training Batch',
  studentCapacity: 20,
  warningCutoff: 15,
  currentClass: 'Advanced',
  startLevel: 'Intermediate',
  currentLevel: 'Advanced',
  batchDay: 'MONDAY',
  startTime: '16:00',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  isActive: true,
};

async function main() {
  try {
    logger.info('Starting the seeding process');

    let hashedPassword;

    try {
      hashedPassword = await hashPassword(DEFAULT_PASSWORD, 10);
      logger.info('Password hashed successfully');
    } catch (hashError) {
      logger.error('Error hashing password:', hashError);
      throw hashError;
    }

    if (!hashedPassword) {
      throw new Error('Failed to hash password');
    }

    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    });

    const studentRole = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT' },
    });

    const coachRole = await prisma.role.upsert({
      where: { name: 'COACH' },
      update: {},
      create: { name: 'COACH' },
    });

    logger.info('Roles created successfully');

    const academy = await prisma.academy.create({
      data: {
        ...academyData,
        domain: academyData.domain,
      },
    });

    logger.info(`Academy created: ${academy.name}`);

    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        status: 'ACTIVE',
        code: `ADMIN${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`,
        roleId: adminRole.id,
        profile: {
          create: {
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            dateOfBirth: adminData.dateOfBirth,
            phoneNumber: adminData.phoneNumber,
            addressLine1: adminData.addressLine1,
            city: adminData.city,
            state: adminData.state,
            country: adminData.country,
          },
        },
        adminOfAcademies: {
          connect: [{ id: academy.id }],
        },
        assignedToAcademyId: academy.id,
      },
      include: {
        profile: true,
      },
    });

    logger.info(`Admin created: ${admin.email}`);

    const createdCoaches = [];
    for (const coachData of coaches) {
      try {
        const coach = await prisma.user.create({
          data: {
            email: coachData.email,
            password: hashedPassword,
            status: 'ACTIVE',
            code: `COACH${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}`,
            roleId: coachRole.id,
            subRole: coachData.subRole,
            assignedToAcademyId: academy.id,
            profile: {
              create: {
                firstName: coachData.firstName,
                lastName: coachData.lastName,
                dateOfBirth: coachData.dateOfBirth,
                phoneNumber: coachData.phoneNumber,
                addressLine1: coachData.addressLine1,
                city: coachData.city,
                state: coachData.state,
                country: coachData.country,
              },
            },
          },
          include: {
            profile: true,
          },
        });
        createdCoaches.push(coach);
        logger.info(`Coach created: ${coach.email} (${coachData.subRole})`);
      } catch (coachError) {
        logger.error(`Error creating coach ${coachData.email}:`, coachError);
        throw coachError;
      }
    }

    const batch = await prisma.batch.create({
      data: {
        ...batchData,
        academyId: academy.id,
        createdBy: admin.id,
        modifiedBy: admin.id,
        coaches: {
          connect: createdCoaches.map((coach) => ({ id: coach.id })),
        },
      },
    });

    logger.info(`Batch created: ${batch.batchCode}`);

    const createdStudents = [];
    for (const studentData of students) {
      try {
        const student = await prisma.user.create({
          data: {
            email: studentData.email,
            password: hashedPassword,
            status: 'ACTIVE',
            code: `STU${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}`,
            roleId: studentRole.id,
            assignedToAcademyId: academy.id,
            studentOfBatches: {
              connect: [{ id: batch.id }],
            },
            profile: {
              create: {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                dateOfBirth: studentData.dateOfBirth,
                phoneNumber: studentData.phoneNumber,
                addressLine1: studentData.addressLine1,
                city: studentData.city,
                state: studentData.state,
                country: studentData.country,
                chessComId: studentData.chessComId,
              },
            },
          },
          include: {
            profile: true,
          },
        });

        createdStudents.push(student);
        logger.info(
          `Student created and added to batch: ${student.email} (ChessComId: ${student.profile.chessComId})`
        );
      } catch (studentError) {
        logger.error(
          `Error creating student ${studentData.email}:`,
          studentError
        );
        throw studentError;
      }
    }

    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        coaches: {
          connect: createdCoaches.map((coach) => ({ id: coach.id })),
        },
        students: {
          connect: createdStudents.map((student) => ({ id: student.id })),
        },
      },
    });

    const finalBatch = await prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        coaches: true,
        students: true,
      },
    });

    logger.info('Final batch status:');
    logger.info(`- Batch Code: ${finalBatch.batchCode}`);
    logger.info(`- Number of coaches: ${finalBatch.coaches.length}`);
    logger.info(`- Number of students: ${finalBatch.students.length}`);

    logger.info('Seeding completed successfully');
    logger.info(`All users created with password: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main execution:', error);
  process.exit(1);
});
