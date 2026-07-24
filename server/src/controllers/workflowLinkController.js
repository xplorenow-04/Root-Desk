import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as workflowLinkService from '../services/workflowLinkService.js';

/**
 * Controller for workflow-module link CRUD operations.
 */

export const getWorkflowLinks = asyncHandler(async (req, res) => {
  const { targetType, targetId, flowId, page, limit } = req.query;
  const result = await workflowLinkService.getWorkflowLinks({
    targetType,
    targetId,
    flowId,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.json(new ApiResponse(200, result, 'Workflow links fetched'));
});

export const createWorkflowLink = asyncHandler(async (req, res) => {
  const { flowId, targetType, targetId, targetLabel, triggerOn, priority, entryNode, versionSelection, specificVersion, status, conditions, permissions } = req.body;
  const link = await workflowLinkService.createWorkflowLink({
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
    createdBy: req.user.id,
  });
  res.status(201).json(new ApiResponse(201, link, 'Workflow link created'));
});

export const updateWorkflowLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const link = await workflowLinkService.updateWorkflowLink(id, req.body);
  res.json(new ApiResponse(200, link, 'Workflow link updated'));
});

export const deleteWorkflowLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await workflowLinkService.deleteWorkflowLink(id);
  res.json(new ApiResponse(200, result, 'Workflow link deleted'));
});

export const toggleWorkflowLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const link = await workflowLinkService.toggleWorkflowLink(id);
  res.json(new ApiResponse(200, link, 'Workflow link toggled'));
});

export const getLinkedWorkflows = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;
  const links = await workflowLinkService.getLinkedWorkflows(targetType, targetId);
  res.json(new ApiResponse(200, links, 'Linked workflows fetched'));
});
