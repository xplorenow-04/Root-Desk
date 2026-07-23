import api from './api';

/**
 * Fetch all soft-deleted projects and nodes.
 */
export const getTrash = async () => {
  return api.get('/trash');
};

/**
 * Restore a soft-deleted item.
 * @param {string} id - Item ID
 * @param {'project'|'node'} type - Item type
 */
export const restoreItem = async (id, type) => {
  return api.put(`/trash/${id}/restore?type=${type}`);
};

/**
 * Permanently delete a soft-deleted item.
 * @param {string} id - Item ID
 * @param {'project'|'node'} type - Item type
 */
export const permanentDelete = async (id, type) => {
  return api.delete(`/trash/${id}/permanent?type=${type}`);
};

/**
 * Permanently delete all soft-deleted projects and nodes.
 */
export const emptyTrash = async () => {
  return api.delete('/trash/empty');
};
