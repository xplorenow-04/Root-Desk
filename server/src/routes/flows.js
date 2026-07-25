import { Router } from 'express';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';
import {
  createFlowValidation,
  updateFlowValidation,
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
router.post('/templates/:id/use', validateObjectId('id'), createFlowFromTemplate);

router.get('/:id', validateObjectId('id'), getFlowById);
router.put('/:id', updateFlowValidation, updateFlow);
router.delete('/:id', validateObjectId('id'), deleteFlow);

router.post('/:id/duplicate', validateObjectId('id'), duplicateFlow);
router.post('/:id/save', saveFlowDataValidation, saveFlowData);
router.patch('/:id/archive', validateObjectId('id'), archiveFlow);

router.get('/:id/history', validateObjectId('id'), getFlowHistory);
router.post('/:id/restore/:version', restoreFlowValidation, restoreFlowVersion);

router.post('/:id/export', validateObjectId('id'), exportFlow);
router.post('/import', importFlowValidation, importFlow);

router.post('/:id/run', runFlowValidation, startFlowExecution);
router.get('/:id/executions', validateObjectId('id'), getFlowExecutions);
router.post('/:id/validate', validateObjectId('id'), validateFlow);

export default router;
