import express from 'express';
import userController from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(auth);

// List all users
router.get('/', userController.getUsers);

export default router;
