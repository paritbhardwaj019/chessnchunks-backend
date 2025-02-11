const { prisma } = require('../helpers/prisma');
const app = require('../../src/app');
const { afterEach, beforeEach } = require('mocha');
const ROLE_CONSTANT = require('../../src/constants');
const config = require('../../src/config');
const hashPassword = require('../../src/utils/hashPassword');
const request = require('supertest')(app);
const jwt = require('jsonwebtoken');
const { expect } = require('chai');
const { SIGNUP_STATUS } = require('@prisma/client');

const DAYS_OF_WEEK = [
  { value: 'Monday', code: 'MON', label: 'Monday' },
  { value: 'Tuesday', code: 'TUE', label: 'Tuesday' },
  { value: 'Wednesday', code: 'WED', label: 'Wednesday' },
  { value: 'Thursday', code: 'THU', label: 'Thursday' },
  { value: 'Friday', code: 'FRI', label: 'Friday' },
  { value: 'Saturday', code: 'SAT', label: 'Saturday' },
  { value: 'Sunday', code: 'SUN', label: 'Sunday' },
];

async function createTestSystemConfigs(academyId) {
  const systemConfigs = [];

  for (const day of DAYS_OF_WEEK) {
    const config = await prisma.systemConfig.create({
      data: {
        type: 'BATCH_DAY',
        code: day.code,
        label: day.label,
        description: `${day.label} Classes`,
        order: DAYS_OF_WEEK.indexOf(day) + 1,
        isActive: true,
        academyId,
      },
    });
    systemConfigs.push(config);
  }

  return systemConfigs;
}

describe('Student Signup Integration Tests', () => {
  let testAcademy;
  let testBatch;
  let testUser;
  let adminRole;
  let batchDayConfig;
  let authToken;
  let studentRole;

  const createSignup = async (batchId, overrides = {}) => {
    const baseSignupData = {
      email: `student-${Date.now()}@yopmail.com`,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '1234567890',
      userRole: 'STUDENT',
      batchInterestId: batchId,
      reservationPeriodHours: 72,
      dateOfBirth: '2000-01-01',
      middleName: 'A.',
      parentName: 'Jane Doe',
      parentEmail: 'parent@example.com',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      password: 'securepassword123',
    };

    const signupData = { ...baseSignupData, ...overrides };

    const response = await request
      .post('/api/v1/student-signups')
      .send(signupData)
      .set('x-auth-token', authToken)
      .expect(201);

    return response.body;
  };

  const createStudentAndAssignToBatch = async (batchId, overrides = {}) => {
    const profileData = {
      firstName: overrides.firstName || 'John',
      lastName: overrides.lastName || 'Doe',
      phoneNumber: overrides.phoneNumber || '1234567890',
      dateOfBirth: overrides.dateOfBirth || new Date('2000-01-01'),
    };

    const profile = await prisma.profile.create({
      data: profileData,
    });

    const hashedPassword = await hashPassword('testpassword123', 10);
    const userData = {
      email: overrides.email || `student-${Date.now()}@example.com`,
      password: hashedPassword,
      code: `USER-${Date.now()}`,
      roleId: studentRole.id,
      profile: {
        connect: { id: profile.id },
      },
      assignedToAcademyId: testAcademy.id,
      studentOfBatches: {
        connect: { id: batchId },
      },
    };

    const user = await prisma.user.create({
      data: userData,
      include: {
        profile: true,
      },
    });

    return user;
  };

  beforeEach(async () => {
    await prisma.studentQuizAnswer.deleteMany();
    await prisma.studentQuizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.task.deleteMany();

    await prisma.studentWeeklyGoal.deleteMany();
    await prisma.weeklyGoal.deleteMany();
    await prisma.monthlyGoal.deleteMany();
    await prisma.seasonalGoal.deleteMany();
    await prisma.target.deleteMany();

    await prisma.paymentHistory.deleteMany();
    await prisma.studentProgramCredit.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.studentSubscription.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.purchasedPlan.deleteMany();
    await prisma.academyProgram.deleteMany();

    await prisma.channelMessage.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.friendRequest.deleteMany();

    await prisma.userBatchHistory.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.userSignup.deleteMany();
    await prisma.batch.deleteMany();

    await prisma.pageComponent.deleteMany();
    await prisma.page.deleteMany();
    await prisma.academyNavigation.deleteMany();
    await prisma.academySignup.deleteMany();
    await prisma.systemConfig.deleteMany();

    await prisma.emailVerificationToken.deleteMany();
    await prisma.signupOTP.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    await prisma.academy.deleteMany();

    adminRole = await prisma.role.create({
      data: {
        name: ROLE_CONSTANT.ROLE.ADMIN,
      },
    });

    studentRole = await prisma.role.create({
      data: { name: ROLE_CONSTANT.ROLE.STUDENT },
    });

    const hashedPassword = await hashPassword('test123', 10);

    testUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        status: 'ACTIVE',
        code: `USER-${Date.now()}`,
        roleId: adminRole.id,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Admin',
          },
        },
      },
      include: {
        profile: true,
        role: true,
      },
    });

    testAcademy = await prisma.academy.create({
      data: {
        name: 'Test Academy',
        isDefault: false,
        domain: 'http://testacademy.localhost:3001',
        status: 'ACTIVE',
        admins: {
          connect: {
            id: testUser.id,
          },
        },
      },
    });

    const systemConfigs = await createTestSystemConfigs(testAcademy.id);
    batchDayConfig = systemConfigs[0];

    testBatch = await prisma.batch.create({
      data: {
        batchCode: `TEST-${Date.now()}`,
        studentCapacity: 5,
        academyId: testAcademy.id,
        warningCutoff: 4,
        currentClass: 'Class A',
        startLevel: 'l1',
        currentLevel: 'l1',
        batchDayId: batchDayConfig.id,
        startTime: '09:00',
        startDate: new Date(),
        isActive: true,
        createdBy: testUser.id,
        modifiedBy: testUser.id,
      },
    });

    authToken = await jwt.sign(
      {
        id: testUser.id,
        role: testUser.role.name,
        academyDomain: 'http://testacademy.localhost:3001',
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await prisma.studentQuizAnswer.deleteMany();
    await prisma.studentQuizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.task.deleteMany();

    await prisma.studentWeeklyGoal.deleteMany();
    await prisma.weeklyGoal.deleteMany();
    await prisma.monthlyGoal.deleteMany();
    await prisma.seasonalGoal.deleteMany();
    await prisma.target.deleteMany();

    await prisma.paymentHistory.deleteMany();
    await prisma.studentProgramCredit.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.studentSubscription.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.purchasedPlan.deleteMany();
    await prisma.academyProgram.deleteMany();

    await prisma.channelMessage.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.message.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.event.deleteMany();
    await prisma.friendRequest.deleteMany();

    await prisma.userBatchHistory.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.userSignup.deleteMany();
    await prisma.batch.deleteMany();

    await prisma.pageComponent.deleteMany();
    await prisma.page.deleteMany();
    await prisma.academyNavigation.deleteMany();
    await prisma.academySignup.deleteMany();
    await prisma.systemConfig.deleteMany();

    await prisma.emailVerificationToken.deleteMany();
    await prisma.signupOTP.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    await prisma.academy.deleteMany();
  });

  describe('Initial Signup Process', () => {
    it('should create new signup with RESERVED status', async () => {
      const signupData = {
        email: 'jaladhijoshi@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        userRole: 'STUDENT',
        batchInterestId: testBatch.id,
        reservationPeriodHours: 72,
        middleName: 'A.',
        dateOfBirth: '2000-01-01',
        parentName: 'Jane Doe',
        parentEmail: 'parent@example.com',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        chessComId: 'chesscom123',
        lichessId: 'lichess456',
        uscfId: 'uscf789',
        password: 'securepassword123',
        cicId: 'cic123456',
      };

      const response = await request
        .post('/api/v1/student-signups')
        .send(signupData)
        .set('x-auth-token', authToken)
        .expect(201);

      expect(response.body.signupStatus).to.equal('RESERVED');
      expect(response.body.reservationPeriodHours).to.equal(72);

      expect(response.body.reservationTime).to.exist;
      const reservationTime = new Date(response.body.reservationTime);
      expect(reservationTime).to.be.a('date');

      const reservationExpiry = new Date(response.body.reservationExpiry);
      const expectedExpiry = new Date(
        reservationTime.getTime() + 72 * 60 * 60 * 1000
      );
      expect(reservationExpiry.getTime()).to.be.closeTo(
        expectedExpiry.getTime(),
        1000
      );

      expect(response.body.email).to.equal(signupData.email);
      expect(response.body.firstName).to.equal(signupData.firstName);
      expect(response.body.lastName).to.equal(signupData.lastName);
      expect(response.body.phoneNumber).to.equal(signupData.phoneNumber);
      expect(response.body.userRole).to.equal(signupData.userRole);
      expect(response.body.batchInterestId).to.equal(
        signupData.batchInterestId
      );
    });
  });

  describe('Batch Capacity and Waiting List Scenarios', () => {
    it('should create waiting list entry when batch is full', async () => {
      for (let i = 0; i < 5; i++) {
        await createStudentAndAssignToBatch(testBatch.id, {
          email: `student${i}@example.com`,
        });
      }

      const waitingSignup = await createSignup(testBatch.id, {
        email: 'waitinglist@example.com',
      });

      expect(waitingSignup.signupStatus).to.equal(SIGNUP_STATUS.WAITING);
      expect(waitingSignup.batchInterestId).to.equal(testBatch.id);
    });
  });
});
