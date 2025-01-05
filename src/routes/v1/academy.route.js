const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const academyController = require('../../controllers/academy.controller');
const uploadFile = require('../../middlewares/uploadFile');

const academyRouter = express.Router();

academyRouter
  .route('/:id/settings')
  .patch(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    uploadFile.single('logo'),
    academyController.updateAcademySettings
  );

academyRouter
  .route('/:id')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN']),
    academyController.updateAcademyByIdHandler
  )
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    academyController.fetchAcademyByIdHandler
  );

academyRouter
  .route('/domain/:domain')
  .get(academyController.getAcademyByDomain);

academyRouter
  .route('/domain/:domain/pages/:slug(*)')
  .get(academyController.getPublicPageBySlug);

academyRouter
  .route('/domain/:domain/pages/:pageId/components/:componentId')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    academyController.updateComponentById
  );

module.exports = academyRouter;
