import { validationResult } from 'express-validator';
import projectService from '../services/projectService.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all active projects for current user.
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user._id);
  ApiResponse.success({ projects }, 'Projects retrieved successfully').send(res);
});

/**
 * Get a single project by ID.
 */
const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.params.id, req.user._id);
  ApiResponse.success({ project }, 'Project retrieved successfully').send(res);
});

/**
 * Create a new project.
 */
const createProject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const project = await projectService.createProject(req.body, req.user._id);
  ApiResponse.created({ project }, 'Project created successfully').send(res);
});

/**
 * Update an existing project.
 */
const updateProject = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const project = await projectService.updateProject(req.params.id, req.body, req.user._id);
  ApiResponse.success({ project }, 'Project updated successfully').send(res);
});

/**
 * Soft delete a project.
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.softDeleteProject(req.params.id, req.user._id);
  ApiResponse.success({ project }, 'Project deleted successfully').send(res);
});

/**
 * Toggle favorite status of a project.
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const project = await projectService.toggleFavorite(req.params.id, req.user._id);
  ApiResponse.success({ project }, 'Project favorite status updated').send(res);
});

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleFavorite,
};
