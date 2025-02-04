const express = require('express');
const superAdminController = require('../controllers/superAdmin.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const uploadFile = require('../../../middlewares/uploadFile');
const ROLE_CONSTANT = require('../../../constants');

/**
 * Express router for super admin routes
 * @type {import('express').Router}
 */
const superAdminRouter = express.Router();

/**
 * Route for inviting academy admin
 * @name POST /invite-academy-admin
 * @function
 * @memberof module:routes/superAdmin
 * @param {Object} body - Request body
 * @param {string} body.firstName - Admin's first name
 * @param {string} body.lastName - Admin's last name
 * @param {string} body.email - Admin's email
 * @param {string} body.academyName - Academy name
 * @param {File} body.logo - Academy logo file
 * @requires authentication
 * @requires role:SUPER_ADMIN
 */
superAdminRouter.post(
  '/invite-academy-admin',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
  uploadFile.single('logo'),
  superAdminController.inviteAcademyAdminHandler
);

/**
 * Route for verifying academy admin
 * @name POST /verify-academy-admin
 * @function
 * @memberof module:routes/superAdmin
 * @param {string} query.token - Verification token
 * @param {string} body.domain - Academy domain
 * @public
 */
superAdminRouter.post(
  '/verify-academy-admin',
  superAdminController.verifyAcademyAdminHandler
);

/**
 * Route for fetching all admins by academy ID
 * @name GET /all-admins
 * @function
 * @memberof module:routes/superAdmin
 * @param {string} query.academyId - Academy ID
 * @param {number} [query.page=1] - Page number
 * @param {number} [query.limit=10] - Items per page
 * @requires authentication
 * @requires role:SUPER_ADMIN
 */
superAdminRouter.get(
  '/all-admins',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
  superAdminController.fetchAllAdminsByAcademyId
);

/**
 * Route for fetching all academies
 * @name GET /all-academies
 * @function
 * @memberof module:routes/superAdmin
 * @param {number} [query.page=1] - Page number
 * @param {number} [query.limit=10] - Items per page
 * @param {string} [query.query] - Search query
 * @requires authentication
 * @requires role:SUPER_ADMIN,ADMIN,COACH
 */
superAdminRouter.get(
  '/all-academies',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
  ]),
  superAdminController.fetchAllAcademiesHandler
);

/**
 * Route for creating a plan
 * @name POST /plans
 * @function
 * @memberof module:routes/superAdmin
 * @param {Object} body - Plan data
 * @param {string} body.name - Plan name
 * @param {number} body.maxUsers - Maximum users allowed
 * @param {number} body.academyPrice - Academy price
 * @param {number} body.subscriberPrice - Subscriber price
 * @requires authentication
 * @requires role:SUPER_ADMIN
 */
superAdminRouter.post(
  '/plans',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
  superAdminController.createPlanHandler
);

/**
 * Route for updating a plan
 * @name PUT /plans/:planId
 * @function
 * @memberof module:routes/superAdmin
 * @param {string} params.planId - Plan ID to update
 * @param {Object} body - Plan update data
 * @param {string} [body.name] - Updated plan name
 * @param {number} [body.maxUsers] - Updated maximum users
 * @param {number} [body.academyPrice] - Updated academy price
 * @param {number} [body.subscriberPrice] - Updated subscriber price
 * @param {Array} [body.features] - Updated plan features
 * @param {boolean} [body.isFeatured] - Updated featured status
 * @requires authentication
 * @requires role:SUPER_ADMIN
 */
superAdminRouter.put(
  '/plans/:planId',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
  superAdminController.updatePlanHandler
);

/**
 * Route for fetching all plans
 * @name GET /plans
 * @function
 * @memberof module:routes/superAdmin
 * @param {number} [query.page=1] - Page number
 * @param {number} [query.limit=10] - Items per page
 * @param {string} [query.type] - Plan type filter
 * @param {string} [query.search] - Search query
 * @param {string} [query.signupId] - Signup ID for discount calculation
 * @public
 */
superAdminRouter.get('/plans', superAdminController.fetchAllPlansHandler);

/**
 * Route for checking domain availability
 * @name GET /check-domain
 * @function
 * @memberof module:routes/superAdmin
 * @param {string} query.domain - Domain to check
 * @public
 */
superAdminRouter.get(
  '/check-domain',
  superAdminController.checkDomainAvailability
);

/**
 * Route for selecting an academy plan
 * @name POST /select-plan
 * @function
 * @memberof module:routes/superAdmin
 * @param {Object} body - Plan selection data
 * @param {string} body.signupId - Signup ID
 * @param {string} body.planId - Selected plan ID
 * @param {string} body.domain - Requested academy domain
 * @public
 */
superAdminRouter.post('/select-plan', superAdminController.selectAcademyPlan);

/**
 * Route for creating a checkout session
 * @name POST /create-checkout-session
 * @function
 * @memberof module:routes/superAdmin
 * @param {Object} body - Checkout session data
 * @param {string} body.signupId - Signup ID
 * @param {string} body.planId - Selected plan ID
 * @param {string} body.domain - Academy domain
 * @param {string} body.token - Authentication token
 * @public
 */
superAdminRouter.post(
  '/create-checkout-session',
  superAdminController.createCheckoutSession
);

/**
 * Route for deleting a plan
 * @name DELETE /plans/:planId
 * @function
 * @memberof module:routes/superAdmin
 * @param {string} params.planId - Plan ID to delete
 * @requires authentication
 * @requires role:SUPER_ADMIN
 */
superAdminRouter.delete(
  '/plans/:planId',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
  superAdminController.deletePlanHandler
);

/**
 * Route for creating a super admin
 * @name POST /create
 * @function
 * @memberof module:routes/superAdmin
 * @param {Object} body - Super admin data
 * @param {string} body.authCode - Authorization code
 * @param {string} body.firstName - First name
 * @param {string} body.lastName - Last name
 * @param {string} body.email - Email address
 * @param {string} body.password - Password
 * @param {string} body.dateOfBirth - Date of birth
 * @param {string} body.cicId - Chess in Chunks ID
 * @public
 */
superAdminRouter.post('/create', superAdminController.createSuperAdminHandler);

module.exports = superAdminRouter;
