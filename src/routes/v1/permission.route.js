const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const permissionController = require('../../controllers/permission.controller');

const permissionRouter = express.Router();

permissionRouter.get('/roles', checkJWT, permissionController.fetchAllRoles);

permissionRouter
  .route('/')
  .get(checkJWT, permissionController.fetchUserPermission)
  .put(checkJWT, permissionController.updatePermission);

module.exports = permissionRouter;
