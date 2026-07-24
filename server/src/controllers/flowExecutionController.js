import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as flowExecutionService from '../services/flowExecutionService.js';

export const startFlowExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.startFlowExecution(
    req.params.id,
    req.user._id,
    {
      variables: req.body.variables,
      entryPoint: req.body.entryPoint || 'manual',
      metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
    }
  );
  ApiResponse.created(execution, 'Flow execution started').send(res);
});

export const getFlowExecutions = asyncHandler(async (req, res) => {
  const result = await flowExecutionService.getFlowExecutions(req.params.id, {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    status: req.query.status,
  });
  ApiResponse.success(result, 'Executions retrieved successfully').send(res);
});

export const getExecutionById = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.getExecutionById(req.params.executionId);
  ApiResponse.success(execution, 'Execution retrieved successfully').send(res);
});

export const advanceExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.advanceExecution(
    req.params.executionId,
    req.body.nodeId,
    req.body.result
  );
  ApiResponse.success(execution, 'Execution advanced').send(res);
});

export const pauseExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.pauseExecution(req.params.executionId);
  ApiResponse.success(execution, 'Execution paused').send(res);
});

export const resumeExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.resumeExecution(req.params.executionId);
  ApiResponse.success(execution, 'Execution resumed').send(res);
});

export const cancelExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.cancelExecution(req.params.executionId);
  ApiResponse.success(execution, 'Execution cancelled').send(res);
});

export const restartExecution = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.restartExecution(req.params.executionId);
  ApiResponse.success(execution, 'Execution restarted').send(res);
});

export const retryFailedNode = asyncHandler(async (req, res) => {
  const execution = await flowExecutionService.retryFailedNode(req.params.executionId);
  ApiResponse.success(execution, 'Retrying failed node').send(res);
});

export const deleteExecution = asyncHandler(async (req, res) => {
  await flowExecutionService.deleteExecution(req.params.executionId);
  ApiResponse.success(null, 'Execution deleted').send(res);
});
