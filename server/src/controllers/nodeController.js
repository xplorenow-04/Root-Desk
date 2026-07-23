import { validationResult } from 'express-validator';
import nodeService from '../services/nodeService.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all nodes of a specific project.
 */
const getNodesByProject = asyncHandler(async (req, res) => {
  const nodes = await nodeService.getNodesByProject(req.params.projectId, req.user._id);
  ApiResponse.success({ nodes }, 'Nodes retrieved successfully').send(res);
});

/**
 * Create a new node.
 */
const createNode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const node = await nodeService.createNode(req.body, req.user._id);
  ApiResponse.created({ node }, 'Node created successfully').send(res);
});

/**
 * Update an existing node.
 */
const updateNode = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }

  const node = await nodeService.updateNode(req.params.id, req.body, req.user._id);
  ApiResponse.success({ node }, 'Node updated successfully').send(res);
});

/**
 * Delete a node (recursive soft delete).
 */
const deleteNode = asyncHandler(async (req, res) => {
  const node = await nodeService.softDeleteNode(req.params.id, req.user._id);
  ApiResponse.success({ node }, 'Node and descendants deleted successfully').send(res);
});

export default {
  getNodesByProject,
  createNode,
  updateNode,
  deleteNode,
};
