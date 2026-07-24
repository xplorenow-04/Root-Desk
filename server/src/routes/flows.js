import { Router } from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import {
  createFlowValidation,
  updateFlowValidation,
  flowIdValidation,
  saveFlowDataValidation,
  runFlowValidation,
  restoreFlowValidation,
  importFlowValidation,
  listFlowsValidation,
} from '../validators/flowValidator.js';
import {
  createFlow,
  getFlows,
  getFlowById,
  updateFlow,
  deleteFlow,
  duplicateFlow,
  saveFlowData,
  archiveFlow,
  getFlowHistory,
  restoreFlowVersion,
  exportFlow,
  importFlow,
  getTemplates,
  createFlowFromTemplate,
  validateFlow,
} from '../controllers/flowController.js';
import {
  startFlowExecution,
  getFlowExecutions,
} from '../controllers/flowExecutionController.js';

const router = Router();

router.use(auth);

router.get('/', listFlowsValidation, getFlows);
router.post('/', createFlowValidation, createFlow);

router.get('/templates', getTemplates);
router.post('/templates/:id/use', flowIdValidation, createFlowFromTemplate);

router.get('/:id', flowIdValidation, getFlowById);
router.put('/:id', updateFlowValidation, updateFlow);
router.delete('/:id', flowIdValidation, deleteFlow);

router.post('/:id/duplicate', flowIdValidation, duplicateFlow);
router.post('/:id/save', saveFlowDataValidation, saveFlowData);
router.patch('/:id/archive', flowIdValidation, archiveFlow);

router.get('/:id/history', flowIdValidation, getFlowHistory);
router.post('/:id/restore/:version', restoreFlowValidation, restoreFlowVersion);

router.post('/:id/export', flowIdValidation, exportFlow);
router.post('/import', importFlowValidation, importFlow);

router.post('/:id/run', runFlowValidation, startFlowExecution);
router.get('/:id/executions', flowIdValidation, getFlowExecutions);
router.post('/:id/validate', flowIdValidation, validateFlow);

export default router;
