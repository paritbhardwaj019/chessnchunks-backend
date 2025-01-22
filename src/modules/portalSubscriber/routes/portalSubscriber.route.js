const express = require('express');

const portalSubscriberController = require('../../../modules/portalSubscriber/controllers/portalSubscriber.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router
  .route('/')
  .post(portalSubscriberController.createPortalSignupHandler)
  .get(checkJWT, portalSubscriberController.fetchAllPortalSignups);

router
  .route('/:id')
  .get(portalSubscriberController.fetchPortalSignupById)
  .put(checkJWT, portalSubscriberController.updateSignupHandler);

router.route('/:id/verify').post(portalSubscriberController.verifyEmailHandler);

router
  .route('/:id/resend-verification')
  .post(portalSubscriberController.resendVerificationEmail);

router
  .route('/:id/complete')
  .post(checkJWT, portalSubscriberController.completeSignupHandler);

router
  .route('/check/email')
  .post(portalSubscriberController.checkEmailAvailability);

router
  .route('/check/cic-id')
  .post(portalSubscriberController.checkCicIdAvailability);

router
  .route('/check/chess-com-id')
  .post(portalSubscriberController.checkChessComIdAvailability);

router
  .route('/subscription/purchase')
  .post(checkJWT, portalSubscriberController.addSubscriptionPurchase);

router
  .route('/subscription/checkout')
  .post(portalSubscriberController.createCheckoutSession);

router
  .route('/subscriptions')
  .get(checkJWT, portalSubscriberController.getActiveSubscriptions);

module.exports = router;
