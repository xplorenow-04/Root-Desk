import express from 'express';
import databaseStudioController from '../controllers/databaseStudioController.js';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = express.Router();

// Apply auth middleware to protect all endpoints
router.use(auth);

// Get diagrams for a project or create a new diagram
router.route('/')
  .get(databaseStudioController.getDiagramsByProject)
  .post(databaseStudioController.createDiagram);

// Get, update, or delete an individual diagram
router.route('/:id')
  .get(validateObjectId('id'), databaseStudioController.getDiagramById)
  .patch(validateObjectId('id'), databaseStudioController.updateDiagram)
  .delete(validateObjectId('id'), databaseStudioController.deleteDiagram);

// Restore a specific version of a diagram
router.post('/:id/restore/:versionNumber', validateObjectId('id'), databaseStudioController.restoreDiagramVersion);

export default router;
