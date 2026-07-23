import express from 'express';
import authController from '../controllers/authController.js';
import { registerValidator, loginValidator, updateProfileValidator, updatePasswordValidator } from '../validators/authValidator.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', registerValidator, authController.register);

// Login a user
router.post('/login', loginValidator, authController.login);

// Logout user (clears cookie)
router.post('/logout', authController.logout);

// Get current user session (requires auth middleware)
router.get('/me', auth, authController.getMe);

// Update user profile (requires auth middleware)
router.put('/profile', auth, updateProfileValidator, authController.updateProfile);

// Update user password (requires auth middleware)
router.put('/password', auth, updatePasswordValidator, authController.updatePassword);

export default router;
