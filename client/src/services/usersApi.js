import api from './api';

/**
 * Fetch all registered users (id, name, email, avatar).
 */
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data?.users || [];
};
