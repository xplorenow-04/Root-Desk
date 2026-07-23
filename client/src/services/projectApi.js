import api from './api';

/**
 * Fetch all active projects.
 */
export const getProjects = async () => {
  return api.get('/projects');
};

/**
 * Fetch a single project by ID.
 */
export const getProject = async (id) => {
  return api.get(`/projects/${id}`);
};

/**
 * Create a new project.
 */
export const createProject = async (projectData) => {
  return api.post('/projects', projectData);
};

/**
 * Update an existing project.
 */
export const updateProject = async (id, projectData) => {
  return api.patch(`/projects/${id}`, projectData);
};

/**
 * Soft delete a project.
 */
export const deleteProject = async (id) => {
  return api.delete(`/projects/${id}`);
};

/**
 * Toggle favorite status of a project.
 */
export const toggleFavorite = async (id) => {
  return api.patch(`/projects/${id}/favorite`);
};
