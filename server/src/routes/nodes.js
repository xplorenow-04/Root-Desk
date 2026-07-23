import express from 'express';
import nodeController from '../controllers/nodeController.js';
import { createNodeValidator, updateNodeValidator } from '../validators/nodeValidator.js';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = express.Router();

// Apply auth middleware to protect all node endpoints
router.use(auth);

// Create a new node
router.post('/', createNodeValidator, nodeController.createNode);

// Get all nodes for a specific project
router.get('/project/:projectId', validateObjectId('projectId'), nodeController.getNodesByProject);

// Update or delete an individual node
router.route('/:id')
  .patch(validateObjectId('id'), updateNodeValidator, nodeController.updateNode)
  .delete(validateObjectId('id'), nodeController.deleteNode);

export default router;
