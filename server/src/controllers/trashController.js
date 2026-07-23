import Project from '../models/Project.js';
import Node from '../models/Node.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all soft-deleted projects and nodes for the logged-in user.
 */
const getTrash = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const projects = await Project.find({ createdBy: userId, isDeleted: true }).sort({ deletedAt: -1 });
  const nodes = await Node.find({ createdBy: userId, isDeleted: true })
    .populate('projectId', 'name color')
    .sort({ deletedAt: -1 });

  ApiResponse.success({ projects, nodes }, 'Trash retrieved successfully').send(res);
});

/**
 * Restore a soft-deleted project or node.
 */
const restoreItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { type } = req.query; // 'project' or 'node'

  if (type === 'project') {
    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: userId, isDeleted: true },
      { $set: { isDeleted: false }, $unset: { deletedAt: 1 } },
      { new: true }
    );

    if (!project) {
      throw ApiError.notFound('Deleted project not found');
    }

    ApiResponse.success(project, 'Project restored successfully').send(res);
  } else if (type === 'node') {
    const node = await Node.findOne({ _id: id, createdBy: userId, isDeleted: true });
    if (!node) {
      throw ApiError.notFound('Deleted node not found');
    }

    // Helper to recursively restore descendants
    const recursiveRestore = async (currentNodeId) => {
      await Node.findOneAndUpdate(
        { _id: currentNodeId, createdBy: userId, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: 1 } }
      );

      // Find children that are currently marked deleted
      const children = await Node.find({ parentId: currentNodeId, createdBy: userId, isDeleted: true });
      for (const child of children) {
        await recursiveRestore(child._id);
      }
    };

    await recursiveRestore(id);
    ApiResponse.success(node, 'Node and its descendants restored successfully').send(res);
  } else {
    throw ApiError.badRequest('Invalid item type. Must be project or node');
  }
});

/**
 * Permanently delete a project or node.
 */
const permanentDelete = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { type } = req.query; // 'project' or 'node'

  if (type === 'project') {
    const project = await Project.findOneAndDelete({ _id: id, createdBy: userId, isDeleted: true });
    if (!project) {
      throw ApiError.notFound('Deleted project not found');
    }

    // Permanently delete all nodes of this project
    await Node.deleteMany({ projectId: id, createdBy: userId });

    ApiResponse.success(null, 'Project and all of its tasks permanently deleted').send(res);
  } else if (type === 'node') {
    const node = await Node.findOne({ _id: id, createdBy: userId, isDeleted: true });
    if (!node) {
      throw ApiError.notFound('Deleted node not found');
    }

    // Helper to recursively permanent delete descendants
    const recursivePermanentDelete = async (currentNodeId) => {
      // Find all children first
      const children = await Node.find({ parentId: currentNodeId, createdBy: userId });
      for (const child of children) {
        await recursivePermanentDelete(child._id);
      }
      // Delete current node
      await Node.findOneAndDelete({ _id: currentNodeId, createdBy: userId });
    };

    await recursivePermanentDelete(id);
    ApiResponse.success(null, 'Node and its descendants permanently deleted').send(res);
  } else {
    throw ApiError.badRequest('Invalid item type. Must be project or node');
  }
});

/**
 * Empty all trash (permanently delete all soft-deleted projects and nodes).
 */
const emptyTrash = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all deleted projects first to delete their nodes
  const deletedProjects = await Project.find({ createdBy: userId, isDeleted: true });
  const deletedProjectIds = deletedProjects.map((p) => p._id);

  // Delete all projects
  await Project.deleteMany({ createdBy: userId, isDeleted: true });

  // Delete nodes of deleted projects, and any other nodes marked as deleted
  await Node.deleteMany({
    createdBy: userId,
    $or: [
      { projectId: { $in: deletedProjectIds } },
      { isDeleted: true },
    ],
  });

  ApiResponse.success(null, 'Trash emptied successfully').send(res);
});

export default {
  getTrash,
  restoreItem,
  permanentDelete,
  emptyTrash,
};
