import express from 'express';
import trashController from '../controllers/trashController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all trash endpoints
router.use(auth);

// Get all soft-deleted items
router.get('/', trashController.getTrash);

// Empty trash
router.delete('/empty', trashController.emptyTrash);

// Restore a soft-deleted item
router.put('/:id/restore', trashController.restoreItem);

// Permanently delete an item
router.delete('/:id/permanent', trashController.permanentDelete);

export default router;
