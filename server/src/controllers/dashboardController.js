import Project from '../models/Project.js';
import Node from '../models/Node.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Compile aggregate workspace statistics for the dashboard.
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Project metrics
  const totalProjects = await Project.countDocuments({ createdBy: userId, isDeleted: false });
  const favoriteProjectsCount = await Project.countDocuments({ createdBy: userId, isFavorite: true, isDeleted: false });

  // 2. Node metrics
  const totalNodes = await Node.countDocuments({ createdBy: userId, isDeleted: false });
  const completedNodes = await Node.countDocuments({ createdBy: userId, status: 'completed', isDeleted: false });

  // 3. Node grouping by Type
  const nodeTypeStats = await Node.aggregate([
    { $match: { createdBy: userId, isDeleted: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  // Format type statistics for easier consumption
  const typeCounts = {
    module: 0,
    feature: 0,
    task: 0,
  };
  nodeTypeStats.forEach((stat) => {
    if (typeCounts[stat._id] !== undefined) {
      typeCounts[stat._id] = stat.count;
    }
  });

  // 4. Recently updated projects
  const recentProjects = await Project.find({ createdBy: userId, isDeleted: false })
    .sort({ updatedAt: -1 })
    .limit(5);

  // 5. High-priority or recently updated nodes
  const recentNodes = await Node.find({ createdBy: userId, isDeleted: false })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('projectId', 'name color');

  const stats = {
    projects: {
      total: totalProjects,
      favorites: favoriteProjectsCount,
    },
    nodes: {
      total: totalNodes,
      completed: completedNodes,
      pending: totalNodes - completedNodes,
      completionRate: totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0,
      types: typeCounts,
    },
    recentProjects,
    recentNodes,
  };

  ApiResponse.success(stats, 'Dashboard statistics compiled').send(res);
});

export default {
  getStats,
};
