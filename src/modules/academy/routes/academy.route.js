const express = require('express');
const academyController = require('../controllers/academy.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const uploadFile = require('../../../middlewares/uploadFile');

const academyRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Academy
 *   description: Endpoints for managing academies
 */

/**
 * @swagger
 * /academy/{id}/settings:
 *   patch:
 *     summary: Update academy settings
 *     description: Update the settings of an academy, including uploading a logo.
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo file to upload
 *               signUpFee:
 *                 type: number
 *                 description: Sign-up fee for the academy
 *     responses:
 *       200:
 *         description: Academy settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedAcademy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     signUpFee:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or file upload failed
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 *       404:
 *         description: Academy not found
 */
academyRouter
  .route('/:id/settings')
  .patch(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    uploadFile.single('logo'),
    academyController.updateAcademySettings
  );

/**
 * @swagger
 * /academy/{id}:
 *   put:
 *     summary: Update academy by ID
 *     description: Update an academy's details by its ID.
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the academy
 *               domain:
 *                 type: string
 *                 description: Domain of the academy
 *               isActive:
 *                 type: boolean
 *                 description: Whether the academy is active
 *     responses:
 *       200:
 *         description: Academy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedAcademy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     domain:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 *       404:
 *         description: Academy not found
 *   get:
 *     summary: Fetch academy by ID
 *     description: Fetch an academy's details by its ID.
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy to fetch
 *     responses:
 *       200:
 *         description: Academy details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 academy:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     fullName:
 *                       type: array
 *                       items:
 *                         type: string
 *                     email:
 *                       type: array
 *                       items:
 *                         type: string
 *                     students:
 *                       type: number
 *                     coaches:
 *                       type: number
 *                     batches:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 *       404:
 *         description: Academy not found
 */
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

/**
 * @swagger
 * /academy/domain/{domain}:
 *   get:
 *     summary: Get academy by domain
 *     description: Fetch an academy's details by its domain.
 *     tags: [Academy]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain of the academy to fetch
 *     responses:
 *       200:
 *         description: Academy details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     domain:
 *                       type: string
 *                 navigation:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       label:
 *                         type: string
 *                       url:
 *                         type: string
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 *                 pages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                       metaTitle:
 *                         type: string
 *                       metaDescription:
 *                         type: string
 *                       isHome:
 *                         type: boolean
 *                       components:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             type:
 *                               type: string
 *                             props:
 *                               type: object
 *                             order:
 *                               type: number
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                 homePage:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     metaTitle:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     isHome:
 *                       type: boolean
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           props:
 *                             type: object
 *                           order:
 *                             type: number
 *                     publishedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Academy not found
 */
academyRouter
  .route('/domain/:domain')
  .get(academyController.getAcademyByDomain);

/**
 * @swagger
 * /academy/domain/{domain}/pages/{slug}:
 *   get:
 *     summary: Get public page by slug
 *     description: Fetch a public page of an academy by its slug.
 *     tags: [Academy]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain of the academy
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the page to fetch
 *     responses:
 *       200:
 *         description: Public page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 description:
 *                   type: string
 *                 metaTitle:
 *                   type: string
 *                 metaDescription:
 *                   type: string
 *                 components:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       props:
 *                         type: object
 *                       order:
 *                         type: number
 *                 publishedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Page not found
 */
academyRouter
  .route('/domain/:domain/pages/:slug(*)')
  .get(academyController.getPublicPageBySlug);

/**
 * @swagger
 * /academy/domain/{domain}/pages/{pageId}/components/{componentId}:
 *   put:
 *     summary: Update component by ID
 *     description: Update a component of a page by its ID.
 *     tags: [Academy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain of the academy
 *       - in: path
 *         name: pageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the page containing the component
 *       - in: path
 *         name: componentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the component to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of the component
 *               props:
 *                 type: object
 *                 description: Props of the component
 *               order:
 *                 type: number
 *                 description: Order of the component in the page
 *     responses:
 *       200:
 *         description: Component updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 component:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                     props:
 *                       type: object
 *                     order:
 *                       type: number
 *                 page:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     metaTitle:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           props:
 *                             type: object
 *                           order:
 *                             type: number
 *                     publishedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 *       404:
 *         description: Component not found
 */
academyRouter
  .route('/domain/:domain/pages/:pageId/components/:componentId')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    academyController.updateComponentById
  );

module.exports = academyRouter;
