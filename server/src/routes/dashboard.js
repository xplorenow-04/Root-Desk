import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect dashboard endpoints
router.use(auth);

// Get dashboard compilation stats
router.get('/stats', dashboardController.getStats);

export default router;
