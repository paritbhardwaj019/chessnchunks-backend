const express = require('express');
const pageController = require('../../controllers/page.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router.route('/').get(checkJWT, pageController.getPages);

router.route('/:pageId').put(checkJWT, pageController.updatePage);

router
  .route('/:pageId/components/order')
  .put(checkJWT, pageController.updateComponentOrder);

router.route('/:slug').get(checkJWT, pageController.getPage);

module.exports = router;
