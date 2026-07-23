import api from './api';

/**
 * Fetch global workspace aggregate statistics.
 */
export const getStats = async () => {
  return api.get('/dashboard/stats');
};
