import { validationResult } from 'express-validator';
import authService from '../services/authService.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import env from '../config/env.js';

// Cookie options helper
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax', // none for cross-origin production, lax for local/normal
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching JWT expiration
  };
};

/**
 * Handle user registration.
 */
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });

  const token = generateToken(user._id);

  // Set HTTP-Only Cookie
  res.cookie('token', token, getCookieOptions());

  ApiResponse.created({ user }, 'Registration successful').send(res);
});

/**
 * Handle user login.
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const { email, password } = req.body;
  const user = await authService.loginUser({ email, password });

  const token = generateToken(user._id);

  // Set HTTP-Only Cookie
  res.cookie('token', token, getCookieOptions());

  ApiResponse.success({ user }, 'Login successful').send(res);
});

/**
 * Handle user logout.
 */
const logout = asyncHandler(async (req, res) => {
  // Clear the cookie by setting maxAge to 0
  res.cookie('token', '', {
    ...getCookieOptions(),
    maxAge: 0,
  });

  ApiResponse.success(null, 'Logged out successfully').send(res);
});

const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  ApiResponse.success({ user: req.user }, 'User session retrieved').send(res);
});

/**
 * Update user profile.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const { name, email } = req.body;
  const user = await authService.updateProfile(req.user._id, { name, email });

  ApiResponse.success({ user }, 'Profile updated successfully').send(res);
});

/**
 * Update user password.
 */
const updatePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const { currentPassword, newPassword } = req.body;
  await authService.updatePassword(req.user._id, { currentPassword, newPassword });

  ApiResponse.success(null, 'Password updated successfully').send(res);
});

export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
};
