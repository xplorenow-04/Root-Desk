import api from './api';

export const getFlows = (params) => api.get('/flows', { params });
export const getFlow = (id) => api.get(`/flows/${id}`);
export const createFlow = (data) => api.post('/flows', data);
export const updateFlow = (id, data) => api.put(`/flows/${id}`, data);
export const deleteFlow = (id) => api.delete(`/flows/${id}`);
export const duplicateFlow = (id) => api.post(`/flows/${id}/duplicate`);
export const saveFlowData = (id, data) => api.post(`/flows/${id}/save`, data);
export const archiveFlow = (id) => api.patch(`/flows/${id}/archive`);
export const getFlowHistory = (id, params) => api.get(`/flows/${id}/history`, { params });
export const restoreFlowVersion = (id, version) => api.post(`/flows/${id}/restore/${version}`);
export const exportFlow = (id) => api.post(`/flows/${id}/export`);
export const importFlow = (data) => api.post('/flows/import', data);
export const getTemplates = (params) => api.get('/flows/templates', { params });
export const createFlowFromTemplate = (id) => api.post(`/flows/templates/${id}/use`);
export const validateFlow = (id) => api.post(`/flows/${id}/validate`);

export const runFlow = (id, data) => api.post(`/flows/${id}/run`, data);
export const getFlowExecutions = (id, params) => api.get(`/flows/${id}/executions`, { params });
export const getExecution = (executionId) => api.get(`/flow-executions/${executionId}`);
export const advanceExecution = (executionId, data) => api.post(`/flow-executions/${executionId}/advance`, data);
export const pauseExecution = (executionId) => api.post(`/flow-executions/${executionId}/pause`);
export const resumeExecution = (executionId) => api.post(`/flow-executions/${executionId}/resume`);
export const cancelExecution = (executionId) => api.post(`/flow-executions/${executionId}/cancel`);
export const restartExecution = (executionId) => api.post(`/flow-executions/${executionId}/restart`);
export const retryExecution = (executionId) => api.post(`/flow-executions/${executionId}/retry`);
export const deleteExecution = (executionId) => api.delete(`/flow-executions/${executionId}`);
