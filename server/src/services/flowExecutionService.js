import FlowExecution from '../models/FlowExecution.js';
import Flow from '../models/Flow.js';
import FlowNode from '../models/FlowNode.js';
import FlowEdge from '../models/FlowEdge.js';
import ApiError from '../utils/ApiError.js';

export const startFlowExecution = async (flowId, userId, { variables = {}, entryPoint = 'manual', metadata = {} } = {}) => {
  const flow = await Flow.findById(flowId);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  if (flow.status !== 'active') {
    throw new ApiError(400, 'Flow is not active');
  }

  const nodes = await FlowNode.find({ flowId }).sort({ 'position.y': 1, 'position.x': 1 }).lean();

  if (nodes.length === 0) {
    throw new ApiError(400, 'Flow has no nodes');
  }

  const startNodes = nodes.filter(n => n.type === 'start');
  const firstNode = startNodes.length > 0 ? startNodes[0] : nodes[0];

  const execution = await FlowExecution.create({
    flowId,
    version: flow.version,
    status: 'running',
    triggeredBy: userId,
    entryPoint,
    currentNode: firstNode._id,
    currentNodeIndex: 0,
    nodeResults: nodes.map(n => ({
      nodeId: n._id,
      status: n._id.toString() === firstNode._id.toString() ? 'running' : 'pending',
    })),
    variables: {
      input: variables,
      output: {},
      session: {},
      temporary: {},
    },
    startedAt: new Date(),
    metadata,
  });

  return execution.toObject();
};

export const getFlowExecutions = async (flowId, { page = 1, limit = 20, status } = {}) => {
  const query = { flowId };
  if (status) query.status = status;

  const total = await FlowExecution.countDocuments(query);
  const executions = await FlowExecution.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('triggeredBy', 'name email')
    .lean();

  return {
    executions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getExecutionById = async (executionId) => {
  const execution = await FlowExecution.findById(executionId)
    .populate('triggeredBy', 'name email')
    .populate('currentNode', 'label type')
    .lean();

  if (!execution) {
    throw new ApiError(404, 'Execution not found');
  }

  const nodes = await FlowNode.find({ flowId: execution.flowId }).lean();

  return { ...execution, nodes };
};

import mongoose from 'mongoose';

const resolveVariables = (str, variables) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split('.');
    let val = variables;
    for (const part of parts) {
      if (val == null) return '';
      val = val[part];
    }
    return val !== undefined ? val : '';
  });
};

const evaluateExpression = (expr, variables) => {
  try {
    const context = {
      input: variables.input || {},
      output: variables.output || {},
      session: variables.session || {},
      temporary: variables.temporary || {},
      global: variables.global || {},
    };
    const fn = new Function(...Object.keys(context), `return (${expr});`);
    return fn(...Object.values(context));
  } catch (err) {
    console.error('Expression evaluation error:', err);
    return false;
  }
};

const executeNodeLogic = async (node, variables) => {
  const config = node.config || {};
  const result = { success: true, output: {} };

  try {
    switch (node.type) {
      case 'decision':
      case 'condition_expression': {
        const cond = config.condition || config.conditionExpression || config.expression;
        const isTrue = evaluateExpression(cond, variables);
        result.output = { result: isTrue };
        result.selectedHandle = isTrue ? 'yes' : 'no';
        break;
      }
      case 'api': {
        const url = resolveVariables(config.apiEndpoint, variables);
        const method = config.apiMethod || 'GET';
        const headers = config.apiHeaders ? Object.fromEntries(config.apiHeaders) : {};
        const body = config.apiBody ? JSON.parse(resolveVariables(JSON.stringify(config.apiBody), variables)) : null;

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
        });

        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch { json = { text }; }

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${text}`);
        }
        result.output = json;
        break;
      }
      case 'data_create': {
        const collection = config.collection;
        const data = config.data ? JSON.parse(resolveVariables(JSON.stringify(config.data), variables)) : {};
        const db = mongoose.connection.db;
        const res = await db.collection(collection).insertOne(data);
        result.output = { id: res.insertedId, success: true };
        break;
      }
      case 'data_fetch': {
        const collection = config.collection;
        const filter = config.filter ? JSON.parse(resolveVariables(JSON.stringify(config.filter), variables)) : {};
        const limit = config.limit || 20;
        const db = mongoose.connection.db;
        const items = await db.collection(collection).find(filter).limit(limit).toArray();
        result.output = { items };
        break;
      }
      case 'data_update': {
        const collection = config.collection;
        const filter = config.filter ? JSON.parse(resolveVariables(JSON.stringify(config.filter), variables)) : {};
        const data = config.data ? JSON.parse(resolveVariables(JSON.stringify(config.data), variables)) : {};
        const db = mongoose.connection.db;
        const res = await db.collection(collection).updateMany(filter, { $set: data });
        result.output = { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
        break;
      }
      case 'data_delete': {
        const collection = config.collection;
        const filter = config.filter ? JSON.parse(resolveVariables(JSON.stringify(config.filter), variables)) : {};
        const db = mongoose.connection.db;
        const res = await db.collection(collection).deleteMany(filter);
        result.output = { deletedCount: res.deletedCount };
        break;
      }
      case 'delay': {
        const val = config.delay || 1;
        const unit = config.delayUnit || 'seconds';
        let ms = val * 1000;
        if (unit === 'minutes') ms = val * 60 * 1000;
        if (unit === 'hours') ms = val * 60 * 60 * 1000;
        if (unit === 'days') ms = val * 24 * 60 * 60 * 1000;
        await new Promise(resolve => setTimeout(resolve, Math.min(ms, 5000))); // Cap server blocking to 5s
        result.output = { waitedMs: ms };
        break;
      }
      case 'notification':
      case 'notification_email':
      case 'notification_sms': {
        const msg = resolveVariables(config.notificationMessage || config.body || config.message, variables);
        const title = resolveVariables(config.notificationTitle || config.subject, variables);
        console.log(`[Notification] Title: ${title}, Msg: ${msg}`);
        result.output = { sent: true, msg };
        break;
      }
      default: {
        result.output = { message: `Executed type ${node.type}` };
        break;
      }
    }
  } catch (err) {
    result.success = false;
    result.error = err.message;
  }

  return result;
};

export const advanceExecution = async (executionId, nodeId, manualResult = null) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) {
    throw new ApiError(404, 'Execution not found');
  }

  if (execution.status !== 'running') {
    throw new ApiError(400, 'Execution is not running');
  }

  const nodeResult = execution.nodeResults.find(
    nr => nr.nodeId.toString() === nodeId
  );

  if (!nodeResult) {
    throw new ApiError(404, 'Node not found in execution context');
  }

  const now = new Date();
  const startedAt = nodeResult.startedAt || now;

  // 1. Fetch node info from DB
  const node = await FlowNode.findById(nodeId).lean();
  if (!node) {
    throw new ApiError(404, 'Node not found in database');
  }

  // 2. Execute logic (use manualResult if provided, e.g. from client step-through or forms)
  let result = manualResult;
  if (!result) {
    result = await executeNodeLogic(node, execution.variables);
  }

  nodeResult.status = result.success ? 'completed' : 'failed';
  nodeResult.completedAt = now;
  nodeResult.duration = now - new Date(startedAt).getTime();
  nodeResult.output = result.output || {};

  if (result.error) {
    nodeResult.error = result.error;
  }

  // Store output in temporary variables under the node's label
  const nodeKey = node.label.replace(/\s+/g, '_').toLowerCase();
  execution.variables.temporary[nodeKey] = result.output;
  execution.markModified('variables');
  execution.markModified('nodeResults');

  // 3. Cycle & execution status
  if (!result.success) {
    execution.status = 'failed';
    execution.error = { message: result.error || 'Node execution failed', nodeId };
    execution.completedAt = new Date();
    execution.duration = execution.completedAt - new Date(execution.startedAt).getTime();
    await execution.save();
    return execution.toObject();
  }

  // Find next nodes
  const edges = await FlowEdge.find({ flowId: execution.flowId }).lean();
  const outgoingEdges = edges.filter(e => e.sourceNodeId.toString() === nodeId);

  if (outgoingEdges.length > 0) {
    // If it's a decision node, pick the edge that matches the decision outcome
    let matchingEdges = outgoingEdges;
    if (node.type === 'decision' || node.type === 'condition_expression') {
      const handle = result.selectedHandle || (result.output?.result ? 'yes' : 'no');
      matchingEdges = outgoingEdges.filter(e => e.sourceHandle === handle);
      if (matchingEdges.length === 0) matchingEdges = outgoingEdges; // fallback
    }

    // Parallel execution support: activate all matching next nodes
    for (const edge of matchingEdges) {
      const nextNodeResult = execution.nodeResults.find(
        nr => nr.nodeId.toString() === edge.targetNodeId.toString()
      );
      if (nextNodeResult && nextNodeResult.status === 'pending') {
        nextNodeResult.status = 'running';
        nextNodeResult.startedAt = new Date();
        execution.currentNode = edge.targetNodeId;
      }
    }
    execution.markModified('nodeResults');
  }

  const allCompleted = execution.nodeResults.every(
    nr => nr.status === 'completed' || nr.status === 'skipped' || nr.status === 'pending' // if pending but no active running nodes left, we are done
  );
  const activeNodes = execution.nodeResults.filter(nr => nr.status === 'running');

  if (activeNodes.length === 0) {
    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt - new Date(execution.startedAt).getTime();
  }

  await execution.save();

  // If there is an active node that is auto-runnable (not a form, page, or wait), auto-advance it
  const autoRunnableTypes = ['decision', 'condition_expression', 'api', 'data_create', 'data_fetch', 'data_update', 'data_delete', 'delay', 'notification', 'notification_email', 'notification_sms'];
  
  if (activeNodes.length > 0) {
    for (const activeNodeResult of activeNodes) {
      const activeNode = await FlowNode.findById(activeNodeResult.nodeId).lean();
      if (activeNode && autoRunnableTypes.includes(activeNode.type)) {
        // Auto-run next node asynchronously
        setTimeout(async () => {
          try {
            await advanceExecution(executionId, activeNode._id.toString());
          } catch (err) {
            console.error('Error auto-advancing node:', err);
          }
        }, 10);
      }
    }
  }

  return execution.toObject();
};

export const pauseExecution = async (executionId) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');
  if (execution.status !== 'running') throw new ApiError(400, 'Execution is not running');

  execution.status = 'paused';
  await execution.save();
  return execution.toObject();
};

export const resumeExecution = async (executionId) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');
  if (execution.status !== 'paused') throw new ApiError(400, 'Execution is not paused');

  execution.status = 'running';
  await execution.save();
  return execution.toObject();
};

export const cancelExecution = async (executionId) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');
  if (['completed', 'cancelled'].includes(execution.status)) {
    throw new ApiError(400, 'Execution already finished');
  }

  execution.status = 'cancelled';
  execution.completedAt = new Date();
  execution.duration = execution.completedAt - new Date(execution.startedAt).getTime();
  await execution.save();
  return execution.toObject();
};

export const restartExecution = async (executionId) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');

  const nodes = await FlowNode.find({ flowId: execution.flowId }).sort({ 'position.y': 1, 'position.x': 1 }).lean();
  const startNodes = nodes.filter(n => n.type === 'start');
  const firstNode = startNodes.length > 0 ? startNodes[0] : nodes[0];

  execution.status = 'running';
  execution.currentNode = firstNode._id;
  execution.currentNodeIndex = 0;
  execution.startedAt = new Date();
  execution.completedAt = null;
  execution.duration = null;
  execution.error = null;
  execution.nodeResults = nodes.map(n => ({
    nodeId: n._id,
    status: n._id.toString() === firstNode._id.toString() ? 'running' : 'pending',
  }));
  execution.variables = {
    input: execution.variables?.input || {},
    output: {},
    session: {},
    temporary: {},
  };

  await execution.save();
  return execution.toObject();
};

export const retryFailedNode = async (executionId) => {
  const execution = await FlowExecution.findById(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');
  if (execution.status !== 'failed' && execution.status !== 'running') {
    throw new ApiError(400, 'Execution must be failed or running to retry');
  }

  const failedNode = execution.nodeResults.find(nr => nr.status === 'failed');
  if (!failedNode) {
    throw new ApiError(400, 'No failed nodes found');
  }

  failedNode.status = 'running';
  failedNode.startedAt = new Date();
  failedNode.retryCount = (failedNode.retryCount || 0) + 1;
  execution.status = 'running';
  execution.error = null;
  execution.currentNode = failedNode.nodeId;
  execution.markModified('nodeResults');

  await execution.save();
  return execution.toObject();
};

export const deleteExecution = async (executionId) => {
  const execution = await FlowExecution.findByIdAndDelete(executionId);
  if (!execution) throw new ApiError(404, 'Execution not found');
  return { id: executionId };
};
