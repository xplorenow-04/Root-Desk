import api from '@/services/api';

/**
 * System Design Studio API — mirrors server/src/routes/systemDesigns.js
 * All calls return the unwrapped `{ success, message, data }` body.
 */

export const listDesigns = (projectId) => api.get('/system-designs', { params: { projectId } });

export const getDesign = (id) => api.get(`/system-designs/${id}`);

export const createDesign = (payload) => api.post('/system-designs', payload);

export const updateDesign = (id, payload) => api.patch(`/system-designs/${id}`, payload);

export const deleteDesign = (id) => api.delete(`/system-designs/${id}`);

export const validateDesign = (id, data) => api.post(`/system-designs/${id}/validate`, { data });

export const exportDesign = (id) => api.get(`/system-designs/${id}/export`);

export const importDesign = (projectId, payload) => api.post('/system-designs/import', { projectId, payload });

export const listTemplates = () => api.get('/system-designs/templates');

export const useTemplate = (templateId, projectId) => api.post(`/system-designs/templates/${templateId}/use`, { projectId });

export const listVersions = (id) => api.get(`/system-designs/${id}/versions`);

export const createVersion = (id, body) => api.post(`/system-designs/${id}/versions`, body);

export const restoreVersion = (id, versionNumber) => api.post(`/system-designs/${id}/versions/restore/${versionNumber}`);

export const compareVersions = (id, a, b) => api.post(`/system-designs/${id}/versions/compare`, { a, b });

// ── Practice ──

export const listPracticeProblems = (difficulty) => api.get('/system-designs/practice/problems', { params: { difficulty } });

export const getPracticeProblem = (problemId) => api.get(`/system-designs/practice/problems/${problemId}`);

export const submitPractice = (problemId, data, hintsUsed = []) =>
  api.post(`/system-designs/practice/problems/${problemId}/submit`, { data, hintsUsed });
