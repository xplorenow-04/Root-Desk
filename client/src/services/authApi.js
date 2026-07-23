import api from './api';

/**
 * Register a new user.
 */
export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

/**
 * Log in an existing user.
 */
export const login = async (credentials) => {
  return api.post('/auth/login', credentials);
};

/**
 * Log out the current user.
 */
export const logout = async () => {
  return api.post('/auth/logout');
};

/**
 * Fetch current user profile from active session cookie.
 */
export const getMe = async () => {
  return api.get('/auth/me');
};

/**
 * Update user profile details.
 */
export const updateProfile = async (profileData) => {
  return api.put('/auth/profile', profileData);
};

/**
 * Update user password.
 */
export const updatePassword = async (passwordData) => {
  return api.put('/auth/password', passwordData);
};
