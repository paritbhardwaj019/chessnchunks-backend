const express = require('express');

const navigationController = require('../../controllers/navigation.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router
  .route('/')
  .get(checkJWT, navigationController.getNavigationItems)
  .post(navigationController.createNavigationItem);

router
  .route('/:id')
  .put(navigationController.updateNavigationItem)
  .delete(navigationController.deleteNavigationItem);

router
  .route('/:id/toggle')
  .patch(checkJWT, navigationController.toggleNavigationStatus);

router.route('/reorder').post(navigationController.reorderNavigationItems);

router
  .route('/domain/:domain')
  .get(navigationController.getAllActiveNavigationByDomain);

module.exports = router;
