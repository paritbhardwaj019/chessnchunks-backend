const express = require('express');
const taskController = require('../controllers/task.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');

const taskRouter = express.Router();

taskRouter.post('/', checkJWT, taskController.createTask);

taskRouter.get('/', checkJWT, taskController.getAllTasks);

taskRouter.get('/:taskId', taskController.getTaskById);

taskRouter.put(
  '/:taskId',
  checkPermission('update', '/dashboard/tasks/puzzles'),
  taskController.updateTask
);

taskRouter.delete(
  '/:taskId',
  checkPermission('delete', '/dashboard/tasks/puzzles'),
  taskController.deleteTask
);

module.exports = taskRouter;
