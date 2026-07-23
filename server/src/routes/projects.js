import express from 'express';
import projectController from '../controllers/projectController.js';
import { createProjectValidator, updateProjectValidator } from '../validators/projectValidator.js';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = express.Router();

// Apply auth middleware to protect all project endpoints
router.use(auth);

// Get all projects / Create a new project
router.route('/')
  .get(projectController.getProjects)
  .post(createProjectValidator, projectController.createProject);

// Get, update, or soft-delete an individual project
router.route('/:id')
  .get(validateObjectId('id'), projectController.getProject)
  .patch(validateObjectId('id'), updateProjectValidator, projectController.updateProject)
  .delete(validateObjectId('id'), projectController.deleteProject);

// Toggle favorite flag on a project
router.patch('/:id/favorite', validateObjectId('id'), projectController.toggleFavorite);

export default router;
