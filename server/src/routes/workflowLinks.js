import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getWorkflowLinks,
  createWorkflowLink,
  updateWorkflowLink,
  deleteWorkflowLink,
  toggleWorkflowLink,
  getLinkedWorkflows,
} from '../controllers/workflowLinkController.js';
import {
  createWorkflowLinkValidator,
  updateWorkflowLinkValidator,
  getWorkflowLinksValidator,
} from '../validators/workflowLinkValidator.js';

const router = Router();

// All routes require authentication
router.use(auth);

// GET    /api/workflow-links — List workflow links (filterable)
router.get('/', getWorkflowLinksValidator, getWorkflowLinks);

// GET    /api/workflow-links/active — Get active linked workflows for a module
router.get('/active', getLinkedWorkflows);

// POST   /api/workflow-links — Create a new workflow link
router.post('/', createWorkflowLinkValidator, createWorkflowLink);

// PUT    /api/workflow-links/:id — Update a workflow link
router.put('/:id', updateWorkflowLinkValidator, updateWorkflowLink);

// PATCH  /api/workflow-links/:id/toggle — Toggle enabled/disabled
router.patch('/:id/toggle', toggleWorkflowLink);

// DELETE /api/workflow-links/:id — Delete a workflow link
router.delete('/:id', deleteWorkflowLink);

export default router;
