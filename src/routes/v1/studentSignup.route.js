const express = require('express');
const studentSignupController = require('../../controllers/studentSignup.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router.route('/:id/setup-mfa').post(studentSignupController.setupMFAHandler);

router
  .route('/')
  .post(checkJWT, studentSignupController.createSignupHandler)
  .get(checkJWT, studentSignupController.fetchAllSignups);

router
  .route('/:id')
  .get(studentSignupController.fetchSignupById)
  .put(studentSignupController.updateSignupHandler);

router
  .route('/:id/verify-email')
  .post(checkJWT, studentSignupController.verifyEmailHandler);

router
  .route('/:id/reserve')
  .post(checkJWT, studentSignupController.setReservationHandler);

router
  .route('/:id/confirm')
  .post(checkJWT, studentSignupController.confirmSignupHandler);

router
  .route('/batch/:batchId/waitlist')
  .get(checkJWT, studentSignupController.handleWaitlistHandler);

router
  .route('/program/purchase')
  .post(checkJWT, studentSignupController.addProgramPurchase);

router.route('/checkout').post(studentSignupController.checkoutSession);

router
  .route('/credits')
  .get(checkJWT, studentSignupController.getProgramCredits);

router
  .route('/subscriptions')
  .get(checkJWT, studentSignupController.getActiveSubscriptions);

router
  .route('/:id/update-password')
  .put(studentSignupController.updatePasswordHandler);

module.exports = router;
