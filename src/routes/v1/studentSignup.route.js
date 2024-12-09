const express = require('express');
const studentSignupController = require('../../controllers/studentSignup.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router
  .route('/')
  .post(checkJWT, studentSignupController.createSignupHandler)
  .get(checkJWT, studentSignupController.fetchAllSignups);

router
  .route('/:id')
  .get(studentSignupController.fetchSignupById)
  .put(checkJWT, studentSignupController.updateSignupHandler);

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

router
  .route('/checkout')
  .post(checkJWT, studentSignupController.checkoutSession);

router
  .route('/credits')
  .get(checkJWT, studentSignupController.getProgramCredits);

router
  .route('/subscriptions')
  .get(checkJWT, studentSignupController.getActiveSubscriptions);

module.exports = router;
