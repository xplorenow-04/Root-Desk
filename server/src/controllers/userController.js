import User from '../models/User.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * List all registered users (id, name, email, avatar) for assignment pickers.
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email avatar').sort({ name: 1 });
  ApiResponse.success({ users }, 'Users retrieved successfully').send(res);
});

export default {
  getUsers,
};
