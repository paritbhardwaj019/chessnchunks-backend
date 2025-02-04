const express = require('express');
const academyController = require('../controllers/academy.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const uploadFile = require('../../../middlewares/uploadFile');
const ROLE_CONSTANT = require('../../../constants');

/**
 * Express router for academy routes
 * @type {import('express').Router}
 */
const academyRouter = express.Router();

/**
 * Route for updating academy settings
 * @name PATCH /:id/settings
 * @function
 * @memberof module:routes/academy
 * @param {string} id - Academy ID
 * @param {Object} body - Request body with settings data
 * @param {number} body.signUpFee - Academy signup fee
 * @param {File} body.logo - Academy logo file
 * @requires authentication
 * @requires role:SUPER_ADMIN,ADMIN
 */
academyRouter
  .route('/:id/settings')
  .patch(
    checkJWT,
    checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
    uploadFile.single('logo'),
    academyController.updateAcademySettings
  );

/**
 * Routes for managing academy by ID
 * @name /:id
 * @function
 * @memberof module:routes/academy
 * @param {string} id - Academy ID
 * @requires authentication
 */
academyRouter
  .route('/:id')
  .put(
    checkJWT,
    checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
    academyController.updateAcademyByIdHandler
  )
  .get(
    checkJWT,
    checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
    academyController.fetchAcademyByIdHandler
  );

/**
 * Route for getting academy by domain
 * @name GET /domain/:domain
 * @function
 * @memberof module:routes/academy
 * @param {string} domain - Academy domain
 * @public
 */
academyRouter
  .route('/domain/:domain')
  .get(academyController.getAcademyByDomain);

/**
 * Route for getting public page by slug
 * @name GET /domain/:domain/pages/:slug
 * @function
 * @memberof module:routes/academy
 * @param {string} domain - Academy domain
 * @param {string} slug - Page slug
 * @public
 */
academyRouter
  .route('/domain/:domain/pages/:slug(*)')
  .get(academyController.getPublicPageBySlug);

/**
 * Route for updating component by ID
 * @name PUT /domain/:domain/pages/:pageId/components/:componentId
 * @function
 * @memberof module:routes/academy
 * @param {string} domain - Academy domain
 * @param {string} pageId - Page ID
 * @param {string} componentId - Component ID
 * @requires authentication
 * @requires role:SUPER_ADMIN,ADMIN
 */
academyRouter
  .route('/domain/:domain/pages/:pageId/components/:componentId')
  .put(
    checkJWT,
    checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
    academyController.updateComponentById
  );

module.exports = academyRouter;
