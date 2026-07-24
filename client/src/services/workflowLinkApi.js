import api from './api';

export const getWorkflowLinks = (params) => api.get('/workflow-links', { params });
export const getLinkedWorkflows = (targetType, targetId) => api.get('/workflow-links/active', { params: { targetType, targetId } });
export const createWorkflowLink = (data) => api.post('/workflow-links', data);
export const updateWorkflowLink = (id, data) => api.put(`/workflow-links/${id}`, data);
export const toggleWorkflowLink = (id) => api.patch(`/workflow-links/${id}/toggle`);
export const deleteWorkflowLink = (id) => api.delete(`/workflow-links/${id}`);
