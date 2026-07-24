import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getExecutionById,
  advanceExecution,
  pauseExecution,
  resumeExecution,
  cancelExecution,
  restartExecution,
  retryFailedNode,
  deleteExecution,
} from '../controllers/flowExecutionController.js';

const router = Router();

router.use(auth);

router.get('/:executionId', getExecutionById);
router.post('/:executionId/advance', advanceExecution);
router.post('/:executionId/pause', pauseExecution);
router.post('/:executionId/resume', resumeExecution);
router.post('/:executionId/cancel', cancelExecution);
router.post('/:executionId/restart', restartExecution);
router.post('/:executionId/retry', retryFailedNode);
router.delete('/:executionId', deleteExecution);

export default router;
