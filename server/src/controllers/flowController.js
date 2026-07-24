import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as flowService from '../services/flowService.js';
import { validateFlowGraph } from '../services/flowValidationService.js';

export const createFlow = asyncHandler(async (req, res) => {
  const flow = await flowService.createFlow({
    ...req.body,
    createdBy: req.user._id,
  });
  ApiResponse.created({ flow }, 'Flow created successfully').send(res);
});

export const getFlows = asyncHandler(async (req, res) => {
  const result = await flowService.getFlows({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
    search: req.query.search,
    sort: req.query.sort,
    userId: req.query.userId,
  });
  ApiResponse.success(result, 'Flows retrieved successfully').send(res);
});

export const getFlowById = asyncHandler(async (req, res) => {
  const flow = await flowService.getFlowById(req.params.id);
  ApiResponse.success(flow, 'Flow retrieved successfully').send(res);
});

export const updateFlow = asyncHandler(async (req, res) => {
  const flow = await flowService.updateFlow(req.params.id, req.body, req.user._id);
  ApiResponse.success({ flow }, 'Flow updated successfully').send(res);
});

export const deleteFlow = asyncHandler(async (req, res) => {
  await flowService.deleteFlow(req.params.id);
  ApiResponse.success(null, 'Flow deleted successfully').send(res);
});

export const duplicateFlow = asyncHandler(async (req, res) => {
  const flow = await flowService.duplicateFlow(req.params.id, req.user._id);
  ApiResponse.created({ flow }, 'Flow duplicated successfully').send(res);
});

export const saveFlowData = asyncHandler(async (req, res) => {
  const result = await flowService.saveFlowData(req.params.id, req.body, req.user._id);
  ApiResponse.success(result, 'Flow data saved successfully').send(res);
});

export const archiveFlow = asyncHandler(async (req, res) => {
  const flow = await flowService.archiveFlow(req.params.id, req.user._id);
  ApiResponse.success({ flow }, `Flow ${flow.status === 'archived' ? 'archived' : 'unarchived'} successfully`).send(res);
});

export const getFlowHistory = asyncHandler(async (req, res) => {
  const result = await flowService.getFlowHistory(req.params.id, {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  ApiResponse.success(result, 'Flow history retrieved successfully').send(res);
});

export const restoreFlowVersion = asyncHandler(async (req, res) => {
  const result = await flowService.restoreFlowVersion(
    req.params.id,
    parseInt(req.params.version),
    req.user._id
  );
  ApiResponse.success(result, 'Flow version restored successfully').send(res);
});

export const exportFlow = asyncHandler(async (req, res) => {
  const data = await flowService.exportFlow(req.params.id);
  ApiResponse.success(data, 'Flow exported successfully').send(res);
});

export const importFlow = asyncHandler(async (req, res) => {
  const flow = await flowService.importFlow(req.body, req.user._id);
  ApiResponse.created({ flow }, 'Flow imported successfully').send(res);
});

export const getTemplates = asyncHandler(async (req, res) => {
  const result = await flowService.getTemplates({
    category: req.query.category,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  ApiResponse.success(result, 'Templates retrieved successfully').send(res);
});

export const createFlowFromTemplate = asyncHandler(async (req, res) => {
  const flow = await flowService.createFlowFromTemplate(req.params.id, req.user._id);
  ApiResponse.created({ flow }, 'Flow created from template successfully').send(res);
});

export const validateFlow = asyncHandler(async (req, res) => {
  const result = await validateFlowGraph(req.params.id);
  ApiResponse.success(result, 'Flow validation complete').send(res);
});
