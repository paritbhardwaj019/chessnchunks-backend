const express = require('express');
const {
  verifyAcademyAdminHandler,
} = require('../../../services/superAdmin.service');
const stripe = require('../../../config/stripe');
const config = require('../../../config');
const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const sendMail = require('../../../utils/sendEmail');
const db = require('../../../database/prisma');
const hashPassword = require('../../../utils/hashPassword');

const router = express.Router();

router.use(
  ['/stripe', '/stripe/student'],
  express.raw({ type: 'application/json' })
);

const sendCredentialsEmail = async (email, password, firstName, lastName) => {
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
      intro:
        'Welcome to Chess in Chunks! Your account has been created successfully.',
      dictionary: {
        Email: email,
        Password: password,
      },
      outro: [
        'Please login with these credentials and change your password immediately.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    email,
    'Welcome to Chess in Chunks - Your Account Credentials',
    emailText,
    emailBody
  );
};

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      'whsec_wtd4irorY3RM7DTg0I4GWnFakizCYgnE'
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { token, domain } = session.metadata;

      try {
        await verifyAcademyAdminHandler(token, domain);
      } catch (error) {
        console.error('Admin verification failed:', error);
        return res.json({ received: true });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Admin webhook error:', err);
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }
});

router.post('/stripe/student', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      'whsec_MwQoMoEjH7n4yDlHF7O7G0jls4W3naHI'
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { programId, userEmail } = session.metadata;

      const signup = await db.userSignup.findFirst({
        where: { email: userEmail },
        include: {
          interestedBatch: true,
        },
      });

      if (!signup) {
        console.error(`No signup found for email: ${userEmail}`);
        return res.json({ received: true });
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(tempPassword, 10);

      await db.$transaction(async (prisma) => {
        const studentProfile = await prisma.profile.create({
          data: {
            firstName: signup.firstName,
            lastName: signup.lastName,
            middleName: signup.middleName,
            dateOfBirth: signup.dateOfBirth,
            phoneNumber: signup.phoneNumber,
            addressLine1: signup.addressLine1,
            addressLine2: signup.addressLine2,
            city: signup.city,
            state: signup.state,
            country: signup.country,
            parentName: signup.parentName,
            parentEmail: signup.parentEmail,
            chessComId: signup.chessComId,
            lichessId: signup.lichessId,
            uscfId: signup.uscfId,
          },
        });

        const userCount = await prisma.user.count();
        const newCode = `U${(userCount + 1).toString().padStart(5, '0')}`;

        const studentRole = await prisma.role.findFirst({
          where: { name: 'STUDENT' },
        });

        const user = await prisma.user.create({
          data: {
            email: signup.email,
            password: hashedPassword,
            code: newCode,
            roleId: studentRole.id,
            profile: {
              connect: { id: studentProfile.id },
            },
            assignedToAcademyId: signup.academyId,
            studentOfBatches: signup.interestedBatch
              ? { connect: { id: signup.interestedBatch.id } }
              : undefined,
          },
        });

        const program = await prisma.academyProgram.findUnique({
          where: { id: programId },
        });

        if (program) {
          const endDate =
            program.duration === 'MONTHLY'
              ? new Date(new Date().setMonth(new Date().getMonth() + 1))
              : new Date(new Date().setMonth(new Date().getMonth() + 4));

          const now = new Date();

          await prisma.studentSubscription.create({
            data: {
              userId: user.id,
              academyPlanId: programId,
              startDate: now,
              endDate,
              status: 'ACTIVE',
              autoRenew: true,
              paymentStatus: 'COMPLETED',
              lastBillingDate: now,
              nextBillingDate: endDate,
            },
          });
        }

        await prisma.userSignup.update({
          where: { id: signup.id },
          data: {
            signupStatus: 'CONFIRMED',
            signupStage: 'POST_ACTIVATION',
            paymentStatus: 'COMPLETED',
            userId: user.id,
            paymentAmount: program?.price,
            paymentDate: new Date(),
          },
        });

        await sendCredentialsEmail(
          signup.email,
          tempPassword,
          signup.firstName,
          signup.lastName
        );
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.log(err);
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
