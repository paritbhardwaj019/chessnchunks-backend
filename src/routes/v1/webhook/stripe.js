const express = require('express');
const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const config = require('../../../config');
const stripe = require('../../../config/stripe');
const db = require('../../../database/prisma');
const {
  verifyAcademyAdminHandler,
} = require('../../../modules/superAdmin/services/superAdmin.service');
const { getDomainFromAdmin } = require('../../../utils/getDomainFromAdmin');
const hashPassword = require('../../../utils/hashPassword');
const sendMail = require('../../../utils/sendEmail');
const logger = require('../../../utils/logger');
const ROLE_CONSTANT = require('../../../constants');
const {
  SIGNUP_STATUS,
  REGISTRATION_STAGE,
  PAYMENT_STATUS,
} = require('@prisma/client');
const { seedSystemConfigs } = require('../../../utils/systemConfig');
const { processWaitingList } = require('../../../utils/processWaitingList');

const stripeWebhookRouter = express.Router();

stripeWebhookRouter.use(
  ['/stripe', '/stripe/student'],
  express.raw({ type: 'application/json' })
);

const sendCredentialsEmail = async (
  email,
  password,
  firstName,
  lastName,
  domain,
  cicId
) => {
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
        Academy: domain,
        'Chess in Chunks ID': cicId,
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

const setupAcademySubscription = async (
  academyId,
  stripeCustomerId,
  planId,
  user
) => {
  const plan = await db.plan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  const subscription = await db.subscription.create({
    data: {
      customer: stripeCustomerId,
      items: [{ price: plan.academyStripePlanId }],
      metadata: {
        academyId,
        planId,
      },
      user: {
        connect: { id: user.id },
      },
      plan: {
        connect: {
          id: planId,
        },
      },
      academy: {
        connect: {
          id: academyId,
        },
      },
    },
  });

  await db.purchasedPlan.create({
    data: {
      academyId,
      planId,
      totalPrice: plan.academyPrice,
      startDate: new Date(),
      isActive: true,
    },
  });

  await db.academy.update({
    where: {
      id: academyId,
    },
    data: {
      planId,
    },
  });

  return subscription;
};

stripeWebhookRouter.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  req.headers['bypass-tunnel-reminder'] = 'true';

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { token, domain, planId } = session.metadata;

      try {
        const result = await verifyAcademyAdminHandler(
          token,
          domain,
          session.customer,
          planId
        );

        await setupAcademySubscription(
          result.newAcademy.id,
          session.customer,
          planId,
          result.academyAdmin
        );

        await seedSystemConfigs(result.newAcademy.id);
      } catch (error) {
        logger.error(`Admin verification failed: ${error.message || error}`);
        return res.json({ received: true });
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(`Admin webhook error: ${err.message || err}`);
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }
});

stripeWebhookRouter.post('/stripe/student', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  req.headers['bypass-tunnel-reminder'] = 'true';

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.studentWebhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const { programId, type, planId, userEmail } = session.metadata;

      console.log('METADATA', session.metadata);

      if (type === 'PORTAL_SUBSCRIPTION') {
        try {
          const signup = await db.userSignup.findFirst({
            where: { email: userEmail },
          });

          if (!signup) {
            return res.json({ received: true });
          }

          const plan = await db.plan.findUnique({
            where: { id: planId },
          });

          if (!plan) {
            return res.json({ received: true });
          }

          const hashedPassword = await hashPassword(signup.password, 10);

          await db.$transaction(async (prisma) => {
            const academy = await prisma.academy.findFirst({
              where: {
                isDefault: true,
              },
            });

            const profile = await prisma.profile.create({
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
                cicId: signup.cicId,
              },
            });

            const userCount = await prisma.user.count();
            const newCode = `U${(userCount + 1).toString().padStart(5, '0')}`;

            const subscriberRole = await prisma.role.findFirst({
              where: { name: ROLE_CONSTANT.ROLE.SUBSCRIBER },
            });

            const user = await prisma.user.create({
              data: {
                email: signup.email,
                password: hashedPassword,
                code: newCode,
                roleId: subscriberRole.id,
                profile: {
                  connect: { id: profile.id },
                },
                assignedToAcademyId: academy.id,
                mfaEnabled: signup.mfaEnabled,
                studentStatus: 'ACTIVE',
              },
            });

            await prisma.paymentHistory.create({
              data: {
                userSignupId: signup.id,
                amount: plan.subscriberPrice,
                dueDate: new Date(),
                paidDate: new Date(),
                status: 'COMPLETED',
              },
            });

            await prisma.subscription.create({
              data: {
                userId: user.id,
                planId: plan.id,
                academyId: academy.id,
              },
            });

            await prisma.purchasedPlan.create({
              data: {
                academyId: academy.id,
                planId: plan.id,
                totalPrice: plan.subscriberPrice,
                startDate: new Date(),
                isActive: true,
              },
            });

            await prisma.userSignup.update({
              where: { id: signup.id },
              data: {
                signupStatus: SIGNUP_STATUS.CONFIRMED,
                signupStage: REGISTRATION_STAGE.POST_ACTIVATION,
                paymentStatus: PAYMENT_STATUS.COMPLETED,
                userId: user.id,
                academyId: academy.id,
                paymentAmount: plan.subscriberPrice,
                paymentDate: new Date(),
                nextPaymentDue: new Date(
                  new Date().setMonth(new Date().getMonth() + 1)
                ),
                studentStatus: 'ACTIVE',
                lastPaymentDate: new Date(),
              },
            });

            await sendCredentialsEmail(
              signup.email,
              signup.password,
              signup.firstName,
              signup.lastName,
              getDomainFromAdmin(academy.domain),
              signup.cicId
            );
          });
        } catch (error) {
          logger.error(`Portal subscription error: ${error.message || error}`);
          return res.json({ received: true });
        }
      } else {
        const signup = await db.userSignup.findFirst({
          where: { email: userEmail },
          include: {
            interestedBatch: true,
          },
        });

        console.log('SIGNUP', signup);

        if (!signup) {
          return res.json({ received: true });
        }

        const hashedPassword = await hashPassword(signup.password, 10);

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
              cicId: signup.cicId,
            },
          });

          const userCount = await prisma.user.count();
          const newCode = `U${(userCount + 1).toString().padStart(5, '0')}`;

          const studentRole = await prisma.role.findFirst({
            where: { name: ROLE_CONSTANT.ROLE.STUDENT },
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
              status: 'ACTIVE',
            },
          });

          const program = await prisma.academyProgram.findUnique({
            where: { id: programId },
            include: {
              academy: true,
            },
          });

          if (program) {
            const now = new Date();
            const endDate =
              program.duration === 'MONTHLY'
                ? new Date(now.setMonth(now.getMonth() + 1))
                : new Date(now.setMonth(now.getMonth() + 4));

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

            await prisma.paymentHistory.create({
              data: {
                userSignupId: signup.id,
                amount: program.monthlyPrice,
                dueDate: now,
                paidDate: now,
                status: 'COMPLETED',
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
              paymentAmount: program?.monthlyPrice,
              paymentDate: new Date(),
              nextPaymentDue: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
              studentStatus: 'ACTIVE',
              lastPaymentDate: new Date(),
              spotStatus: 'CONFIRMED',
            },
          });

          await sendCredentialsEmail(
            signup.email,
            signup.password,
            signup.firstName,
            signup.lastName,
            getDomainFromAdmin(program.academy.domain),
            signup.cicId
          );

          if (signup.interestedBatch) {
            await processWaitingList(signup.interestedBatch.id);
          }
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.log(err);
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }
});

module.exports = stripeWebhookRouter;
