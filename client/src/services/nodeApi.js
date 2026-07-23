import api from './api';

/**
 * Fetch all nodes for a specific project.
 */
export const getNodes = async (projectId) => {
  return api.get(`/nodes/project/${projectId}`);
};

/**
 * Create a new node.
 */
export const createNode = async (nodeData) => {
  return api.post('/nodes', nodeData);
};

/**
 * Update an existing node.
 */
export const updateNode = async (id, nodeData) => {
  return api.patch(`/nodes/${id}`, nodeData);
};

/**
 * Delete a node (recursive soft delete on backend).
 */
export const deleteNode = async (id) => {
  return api.delete(`/nodes/${id}`);
};
