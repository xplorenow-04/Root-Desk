import WorkflowLink from '../models/WorkflowLink.js';
import Flow from '../models/Flow.js';
import ApiError from '../utils/ApiError.js';

/**
 * Service for managing workflow-module links.
 * Links workflows to pages, buttons, modules, events, etc.
 */

export const createWorkflowLink = async ({ flowId, targetType, targetId, targetLabel, triggerOn, priority, entryNode, versionSelection, specificVersion, status, conditions, permissions, createdBy }) => {
  const flow = await Flow.findById(flowId);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  const link = await WorkflowLink.create({
    flowId,
    targetType,
    targetId,
    targetLabel,
    triggerOn,
    priority,
    entryNode,
    versionSelection,
    specificVersion,
    status,
    conditions,
    permissions,
    createdBy,
  });

  return link.toObject();
};

export const getWorkflowLinks = async ({ targetType, targetId, flowId, page = 1, limit = 20 }) => {
  const query = {};
  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;
  if (flowId) query.flowId = flowId;

  const rawLinks = await WorkflowLink.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('flowId', 'name status version isDeleted')
    .populate('createdBy', 'name email')
    .lean();

  // Filter out links where the referenced flow does not exist or is soft-deleted
  const links = rawLinks.filter(link => link.flowId && !link.flowId.isDeleted);
  
  const total = links.length;
  const paginatedLinks = links.slice((page - 1) * limit, page * limit);

  return {
    links: paginatedLinks,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getLinkedWorkflows = async (targetType, targetId) => {
  const links = await WorkflowLink.find({
    targetType,
    targetId,
    enabled: true,
  })
    .sort({ priority: -1 })
    .populate('flowId', 'name status version entryPoints isDeleted')
    .lean();

  // Only return links where the flow is active and not deleted
  return links.filter(link => link.flowId && link.flowId.status === 'active' && !link.flowId.isDeleted);
};

export const updateWorkflowLink = async (id, updateData) => {
  const link = await WorkflowLink.findById(id);
  if (!link) {
    throw new ApiError(404, 'Workflow link not found');
  }

  Object.assign(link, updateData);
  await link.save();
  return link.toObject();
};

export const deleteWorkflowLink = async (id) => {
  const link = await WorkflowLink.findByIdAndDelete(id);
  if (!link) {
    throw new ApiError(404, 'Workflow link not found');
  }
  return { id };
};

export const toggleWorkflowLink = async (id) => {
  const link = await WorkflowLink.findById(id);
  if (!link) {
    throw new ApiError(404, 'Workflow link not found');
  }

  link.enabled = !link.enabled;
  await link.save();
  return link.toObject();
};
