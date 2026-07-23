import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get all active projects for a user.
 */
const getProjects = async (userId) => {
  return Project.find({ createdBy: userId, isDeleted: false }).sort({ updatedAt: -1 });
};

/**
 * Get a single project by ID for a user.
 */
const getProject = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, createdBy: userId, isDeleted: false });
  if (!project) {
    throw ApiError.notFound('Project not found or you do not have permission to access it');
  }
  return project;
};

/**
 * Create a new project for a user.
 */
const createProject = async (projectData, userId) => {
  return Project.create({
    ...projectData,
    createdBy: userId,
  });
};

/**
 * Update an existing project for a user.
 */
const updateProject = async (projectId, projectData, userId) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, createdBy: userId, isDeleted: false },
    { $set: projectData },
    { new: true, runValidators: true }
  );

  if (!project) {
    throw ApiError.notFound('Project not found or you do not have permission to edit it');
  }

  return project;
};

/**
 * Soft delete a project for a user.
 */
const softDeleteProject = async (projectId, userId) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, createdBy: userId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );

  if (!project) {
    throw ApiError.notFound('Project not found or you do not have permission to delete it');
  }

  return project;
};

/**
 * Toggle favorite status of a project.
 */
const toggleFavorite = async (projectId, userId) => {
  // First find the project
  const project = await Project.findOne({ _id: projectId, createdBy: userId, isDeleted: false });
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Toggle favorite flag
  project.isFavorite = !project.isFavorite;
  await project.save();

  return project;
};

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  softDeleteProject,
  toggleFavorite,
};
