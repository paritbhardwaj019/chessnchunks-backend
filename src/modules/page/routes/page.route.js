const express = require('express');
const pageController = require('../controllers/page.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const pageRouter = express.Router();

pageRouter.route('/').get(checkJWT, pageController.getPages);

pageRouter.route('/:pageId').put(checkJWT, pageController.updatePage);

pageRouter
  .route('/:pageId/components/order')
  .put(checkJWT, pageController.updateComponentOrder);

pageRouter.route('/:slug').get(checkJWT, pageController.getPage);

module.exports = pageRouter;
