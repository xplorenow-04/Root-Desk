import api from './api';

export const getDiagrams = (projectId) => api.get(`/database-studio?projectId=${projectId}`);
export const getDiagram = (id) => api.get(`/database-studio/${id}`);
export const createDiagram = (data) => api.post('/database-studio', data);
export const updateDiagram = (id, data) => api.patch(`/database-studio/${id}`, data);
export const deleteDiagram = (id) => api.delete(`/database-studio/${id}`);
export const restoreDiagramVersion = (id, versionNumber) => api.post(`/database-studio/${id}/restore/${versionNumber}`);
