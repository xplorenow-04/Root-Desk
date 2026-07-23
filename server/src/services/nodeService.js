import Node from '../models/Node.js';
import ApiError from '../utils/ApiError.js';

const ALLOWED_CHILD_TYPES = {
  module: ['feature'],
  feature: ['task'],
  task: [],
};

const validateHierarchy = async (type, parentId, projectId, userId) => {
  if (parentId) {
    const parentNode = await Node.findOne({
      _id: parentId,
      projectId,
      createdBy: userId,
      isDeleted: false,
    });
    if (!parentNode) {
      throw ApiError.badRequest('Parent node not found or belongs to a different project');
    }

    const allowed = ALLOWED_CHILD_TYPES[parentNode.type];
    if (!allowed || !allowed.includes(type)) {
      throw ApiError.badRequest(
        `Invalid hierarchy: a ${parentNode.type} cannot contain a ${type}. Allowed children of ${parentNode.type}: ${allowed.length > 0 ? allowed.join(', ') : 'none'}`
      );
    }
  } else if (type !== 'module') {
    throw ApiError.badRequest('Root nodes must be of type "module"');
  }
};

const getNodesByProject = async (projectId, userId) => {
  return Node.find({ projectId, createdBy: userId, isDeleted: false }).sort({ order: 1, createdAt: 1 });
};

const createNode = async (nodeData, userId) => {
  await validateHierarchy(nodeData.type, nodeData.parentId, nodeData.projectId, userId);

  return Node.create({
    ...nodeData,
    createdBy: userId,
  });
};

const updateNode = async (nodeId, nodeData, userId) => {
  if (nodeData.parentId && String(nodeData.parentId) === String(nodeId)) {
    throw ApiError.badRequest('A node cannot be its own parent');
  }

  const node = await Node.findOne({ _id: nodeId, createdBy: userId, isDeleted: false });
  if (!node) {
    throw ApiError.notFound('Node not found');
  }

  const resolvedType = nodeData.type || node.type;
  const resolvedParentId = nodeData.parentId !== undefined ? nodeData.parentId : node.parentId;

  if (nodeData.type && nodeData.type !== node.type) {
    const hasChildren = await Node.countDocuments({ parentId: nodeId, createdBy: userId, isDeleted: false });
    if (hasChildren > 0) {
      const allowedAsParent = ALLOWED_CHILD_TYPES[nodeData.type];
      if (!allowedAsParent || allowedAsParent.length === 0) {
        throw ApiError.badRequest(
          `Cannot change type to "${nodeData.type}" because this node has ${hasChildren} child node(s)`
        );
      }
    }
  }

  await validateHierarchy(resolvedType, resolvedParentId, node.projectId, userId);

  const updatedNode = await Node.findOneAndUpdate(
    { _id: nodeId, createdBy: userId, isDeleted: false },
    { $set: nodeData },
    { new: true, runValidators: true }
  );

  if (!updatedNode) {
    throw ApiError.notFound('Node not found or you do not have permission to edit it');
  }

  return updatedNode;
};

const softDeleteNode = async (nodeId, userId) => {
  const node = await Node.findOne({ _id: nodeId, createdBy: userId, isDeleted: false });
  if (!node) {
    throw ApiError.notFound('Node not found or you do not have permission to delete it');
  }

  const deletedAt = new Date();

  const recursiveSoftDelete = async (currentId) => {
    await Node.findOneAndUpdate(
      { _id: currentId, createdBy: userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt } }
    );

    const children = await Node.find({ parentId: currentId, createdBy: userId, isDeleted: false });

    for (const child of children) {
      await recursiveSoftDelete(child._id);
    }
  };

  await recursiveSoftDelete(nodeId);

  return node;
};

export default {
  getNodesByProject,
  createNode,
  updateNode,
  softDeleteNode,
};
