const express = require('express');
const taskController = require('../../controllers/task.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const taskRouter = express.Router();

// Apply JWT middleware to all routes
taskRouter.use(checkJWT);

// Route to create a new task (accessible by coaches and admins)
taskRouter.post(
  '/',
  checkRole(['COACH', 'ADMIN', 'SUPER_ADMIN']),
  taskController.createTask
);

// Route to get all tasks accessible to the user
taskRouter.get('/', taskController.getAllTasks);

// Route to get a specific task by ID
taskRouter.get('/:taskId', taskController.getTaskById);

// Route to update a task (accessible by coaches and admins)
taskRouter.put(
  '/:taskId',
  checkRole(['COACH', 'ADMIN', 'SUPER_ADMIN']),
  taskController.updateTask
);

// Route to delete a task (accessible by coaches and admins)
taskRouter.delete(
  '/:taskId',
  checkRole(['COACH', 'ADMIN', 'SUPER_ADMIN']),
  taskController.deleteTask
);

module.exports = taskRouter;
