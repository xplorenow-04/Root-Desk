import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Service to handle user registration.
 */
const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password, // will be hashed automatically by pre-save hook in User model
  });

  // Fetch the user again to exclude the password field (since password has select: false, but create() might return it depending on mongoose version, or to be safe, select it out)
  const safeUser = await User.findById(user._id);

  return safeUser;
};

/**
 * Service to handle user login.
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Remove password from user object before returning
  const safeUser = user.toObject();
  delete safeUser.password;

  return safeUser;
};

/**
 * Service to update user profile.
 */
const updateProfile = async (userId, { name, email }) => {
  const emailTaken = await User.findOne({ email, _id: { $ne: userId } });
  if (emailTaken) {
    throw new ApiError(400, 'Email is already taken by another account');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, email },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

/**
 * Service to update user password.
 */
const updatePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    throw new ApiError(400, 'Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  return true;
};

export default {
  registerUser,
  loginUser,
  updateProfile,
  updatePassword,
};
