import Flow from '../models/Flow.js';
import FlowNode from '../models/FlowNode.js';
import FlowEdge from '../models/FlowEdge.js';
import FlowHistory from '../models/FlowHistory.js';
import FlowTemplate from '../models/FlowTemplate.js';
import ApiError from '../utils/ApiError.js';

export const createFlow = async ({ name, description, tags, entryPoints, permissions, variables, metadata, createdBy }) => {
  const flow = await Flow.create({
    name,
    description,
    tags,
    entryPoints,
    permissions,
    variables,
    metadata,
    createdBy,
    version: 1,
  });

  await FlowHistory.create({
    flowId: flow._id,
    version: 1,
    name,
    description,
    snapshot: { nodes: [], edges: [], variables: [], config: {} },
    changeLog: 'Flow created',
    changedBy: createdBy,
    changeType: 'created',
  });

  return flow;
};

export const getFlows = async ({ page = 1, limit = 20, status, search, sort, userId, includeDeleted = false }) => {
  const query = {};
  if (!includeDeleted) query.isDeleted = false;
  if (status) query.status = status;
  if (userId) query.createdBy = userId;

  if (search) {
    query.$text = { $search: search };
  }

  const sortOptions = {
    name: { name: 1 },
    createdAt: { createdAt: -1 },
    updatedAt: { updatedAt: -1 },
    status: { status: 1 },
  };

  const sortOption = sortOptions[sort] || { updatedAt: -1 };

  const total = await Flow.countDocuments(query);
  const flows = await Flow.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'name email')
    .populate('nodeCount')
    .populate('executionCount')
    .lean();

  return {
    flows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getFlowById = async (id) => {
  const flow = await Flow.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .lean();

  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  const nodes = await FlowNode.find({ flowId: id }).lean();
  const edges = await FlowEdge.find({ flowId: id }).lean();

  return { ...flow, nodes, edges };
};

export const updateFlow = async (id, updateData, userId) => {
  const flow = await Flow.findById(id);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  Object.assign(flow, updateData, { updatedBy: userId });
  await flow.save();

  return flow.toObject();
};

export const deleteFlow = async (id) => {
  const flow = await Flow.findById(id);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  flow.isDeleted = true;
  flow.deletedAt = new Date();
  flow.status = 'archived';
  await flow.save();

  return { id };
};

export const duplicateFlow = async (id, userId) => {
  const original = await Flow.findById(id);
  if (!original || original.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  const nodes = await FlowNode.find({ flowId: id }).lean();
  const edges = await FlowEdge.find({ flowId: id }).lean();

  const newFlow = await Flow.create({
    name: `${original.name} (Copy)`,
    description: original.description,
    tags: original.tags,
    status: 'draft',
    entryPoints: original.entryPoints,
    permissions: original.permissions,
    variables: original.variables ? original.variables.map(v => ({ ...v })) : [],
    metadata: { ...original.metadata },
    createdBy: userId,
    version: 1,
  });

  const nodeIdMap = new Map();
  const newNodes = [];

  for (const node of nodes) {
    const newNodeId = new mongoose.Types.ObjectId();
    nodeIdMap.set(node._id.toString(), newNodeId);
    newNodes.push({
      ...node,
      _id: newNodeId,
      flowId: newFlow._id,
    });
  }

  if (newNodes.length > 0) {
    const nodesToInsert = newNodes.map(({ _id, flowId, type, label, position, config, variables, metadata }) => ({
      _id, flowId, type, label, position, config, variables, metadata,
    }));
    await FlowNode.insertMany(nodesToInsert);
  }

  if (edges.length > 0) {
    const newEdges = edges.map(edge => ({
      flowId: newFlow._id,
      sourceNodeId: nodeIdMap.get(edge.sourceNodeId.toString()) || edge.sourceNodeId,
      targetNodeId: nodeIdMap.get(edge.targetNodeId.toString()) || edge.targetNodeId,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      condition: edge.condition,
      conditionExpression: edge.conditionExpression,
      edgeType: edge.edgeType,
      animated: edge.animated,
      style: edge.style,
    }));
    await FlowEdge.insertMany(newEdges);
  }

  await FlowHistory.create({
    flowId: newFlow._id,
    version: 1,
    name: newFlow.name,
    description: newFlow.description,
    snapshot: { nodes: newNodes, edges, variables: newFlow.variables, config: {} },
    changeLog: `Duplicated from "${original.name}"`,
    changedBy: userId,
    changeType: 'duplicated',
  });

  return newFlow.toObject();
};

export const saveFlowData = async (id, { nodes, edges, variables, changeLog }, userId) => {
  const flow = await Flow.findById(id);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  if (nodes) {
    await FlowNode.deleteMany({ flowId: id });
    if (nodes.length > 0) {
      const nodeDocs = nodes.map((n, i) => ({
        flowId: id,
        type: n.type,
        label: n.label || n.data?.label || `Node ${i + 1}`,
        position: n.position || { x: 0, y: 0 },
        config: n.data?.config || n.config || {},
        variables: n.data?.variables || n.variables || [],
        metadata: n.data?.metadata || n.metadata || {},
      }));
      await FlowNode.insertMany(nodeDocs);
    }
  }

  if (edges) {
    await FlowEdge.deleteMany({ flowId: id });
    if (edges.length > 0) {
      const edgeDocs = edges.map((e, i) => ({
        flowId: id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        label: e.label || e.data?.label || '',
        condition: e.data?.condition || '',
        conditionExpression: e.data?.conditionExpression || '',
        edgeType: e.data?.edgeType || 'default',
        animated: e.animated || false,
        style: e.style || {},
      }));
      await FlowEdge.insertMany(edgeDocs);
    }
  }

  if (variables) {
    flow.variables = variables;
  }

  flow.version += 1;
  flow.updatedBy = userId;
  await flow.save();

  const savedNodes = await FlowNode.find({ flowId: id }).lean();
  const savedEdges = await FlowEdge.find({ flowId: id }).lean();

  await FlowHistory.create({
    flowId: id,
    version: flow.version,
    name: flow.name,
    description: flow.description,
    snapshot: { nodes: savedNodes, edges: savedEdges, variables: flow.variables, config: {} },
    changeLog: changeLog || `Version ${flow.version} saved`,
    changedBy: userId,
    changeType: 'updated',
  });

  return {
    flow: flow.toObject(),
    nodes: savedNodes,
    edges: savedEdges,
  };
};

export const archiveFlow = async (id, userId) => {
  const flow = await Flow.findById(id);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  flow.status = flow.status === 'archived' ? 'draft' : 'archived';
  flow.updatedBy = userId;
  await flow.save();

  await FlowHistory.create({
    flowId: id,
    version: flow.version,
    name: flow.name,
    description: flow.description,
    snapshot: {},
    changeLog: `Flow ${flow.status === 'archived' ? 'archived' : 'restored from archive'}`,
    changedBy: userId,
    changeType: flow.status === 'archived' ? 'archived' : 'activated',
  });

  return flow.toObject();
};

export const getFlowHistory = async (flowId, { page = 1, limit = 20 }) => {
  const total = await FlowHistory.countDocuments({ flowId });
  const history = await FlowHistory.find({ flowId })
    .sort({ version: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('changedBy', 'name email')
    .lean();

  return {
    history,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const restoreFlowVersion = async (flowId, version, userId) => {
  const historyEntry = await FlowHistory.findOne({ flowId, version });
  if (!historyEntry) {
    throw new ApiError(404, 'Version not found');
  }

  const flow = await Flow.findById(flowId);
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  const { nodes, edges, variables } = historyEntry.snapshot;

  if (nodes && nodes.length > 0) {
    await FlowNode.deleteMany({ flowId });
    const restoredNodes = nodes.map(n => ({
      flowId,
      type: n.type,
      label: n.label,
      position: n.position,
      config: n.config || {},
      variables: n.variables || [],
      metadata: n.metadata || {},
    }));
    await FlowNode.insertMany(restoredNodes);
  }

  if (edges && edges.length > 0) {
    await FlowEdge.deleteMany({ flowId });
    const restoredEdges = edges.map(e => ({
      flowId,
      sourceNodeId: e.sourceNodeId || e.source,
      targetNodeId: e.targetNodeId || e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      label: e.label || '',
      condition: e.condition || '',
      conditionExpression: e.conditionExpression || '',
      edgeType: e.edgeType || 'default',
      animated: e.animated || false,
      style: e.style || {},
    }));
    await FlowEdge.insertMany(restoredEdges);
  }

  if (variables) {
    flow.variables = variables;
  }

  flow.version += 1;
  flow.updatedBy = userId;
  await flow.save();

  const savedNodes = await FlowNode.find({ flowId }).lean();
  const savedEdges = await FlowEdge.find({ flowId }).lean();

  await FlowHistory.create({
    flowId,
    version: flow.version,
    name: flow.name,
    description: flow.description,
    snapshot: { nodes: savedNodes, edges: savedEdges, variables: flow.variables, config: {} },
    changeLog: `Restored to version ${version}`,
    changedBy: userId,
    changeType: 'rollback',
  });

  return {
    flow: flow.toObject(),
    nodes: savedNodes,
    edges: savedEdges,
  };
};

export const exportFlow = async (id) => {
  const flow = await Flow.findById(id).lean();
  if (!flow || flow.isDeleted) {
    throw new ApiError(404, 'Flow not found');
  }

  const nodes = await FlowNode.find({ flowId: id }).lean();
  const edges = await FlowEdge.find({ flowId: id }).lean();

  return {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    flow: {
      name: flow.name,
      description: flow.description,
      tags: flow.tags,
      entryPoints: flow.entryPoints,
      permissions: flow.permissions,
      variables: flow.variables,
      metadata: flow.metadata,
    },
    nodes: nodes.map(n => ({
      type: n.type,
      label: n.label,
      position: n.position,
      config: n.config,
      variables: n.variables,
      metadata: n.metadata,
    })),
    edges: edges.map(e => ({
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      condition: e.condition,
      conditionExpression: e.conditionExpression,
      edgeType: e.edgeType,
      animated: e.animated,
      style: e.style,
    })),
  };
};

export const importFlow = async (data, userId) => {
  const { name, description, tags, entryPoints, permissions, variables, metadata, nodes, edges } = data;

  const flow = await Flow.create({
    name,
    description: description || '',
    tags: tags || [],
    status: 'draft',
    entryPoints: entryPoints || [],
    permissions: permissions || { allowedRoles: ['admin'] },
    variables: variables || [],
    metadata: metadata || {},
    createdBy: userId,
    version: 1,
  });

  if (nodes && nodes.length > 0) {
    const nodeDocs = nodes.map(n => ({
      flowId: flow._id,
      type: n.type,
      label: n.label,
      position: n.position || { x: 0, y: 0 },
      config: n.config || {},
      variables: n.variables || [],
      metadata: n.metadata || {},
    }));
    await FlowNode.insertMany(nodeDocs);
  }

  if (edges && edges.length > 0) {
    const savedNodes = await FlowNode.find({ flowId: flow._id }).lean();
    const nodeLabelMap = {};
    for (const node of savedNodes) {
      nodeLabelMap[node.label] = node._id;
    }

    const edgeDocs = edges.map(e => {
      const sourceId = typeof e.source === 'string' && e.source.length === 24 ? e.source : nodeLabelMap[e.source];
      const targetId = typeof e.target === 'string' && e.target.length === 24 ? e.target : nodeLabelMap[e.target];

      return {
        flowId: flow._id,
        sourceNodeId: sourceId || e.source,
        targetNodeId: targetId || e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        label: e.label || '',
        condition: e.condition || '',
        conditionExpression: e.conditionExpression || '',
        edgeType: e.edgeType || 'default',
        animated: e.animated || false,
        style: e.style || {},
      };
    });
    await FlowEdge.insertMany(edgeDocs);
  }

  await FlowHistory.create({
    flowId: flow._id,
    version: 1,
    name: flow.name,
    description: flow.description,
    snapshot: { nodes: nodes || [], edges: edges || [], variables: flow.variables, config: {} },
    changeLog: 'Flow imported',
    changedBy: userId,
    changeType: 'imported',
  });

  return flow.toObject();
};

export const getTemplates = async ({ category, page = 1, limit = 20 }) => {
  const query = {};
  if (category) query.category = category;

  const total = await FlowTemplate.countDocuments(query);
  const templates = await FlowTemplate.find(query)
    .sort({ 'metadata.popularity': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    templates,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const createFlowFromTemplate = async (templateId, userId) => {
  const template = await FlowTemplate.findById(templateId);
  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  const flow = await Flow.create({
    name: template.name,
    description: template.description,
    tags: template.metadata?.tags || [],
    status: 'draft',
    entryPoints: ['manual'],
    permissions: { allowedRoles: ['admin'] },
    variables: template.snapshot?.variables || [],
    metadata: {
      icon: template.icon,
      color: template.color,
      category: template.category,
    },
    createdBy: userId,
    version: 1,
  });

  const { nodes, edges } = template.snapshot;

  if (nodes && nodes.length > 0) {
    const nodeDocs = nodes.map(n => ({
      flowId: flow._id,
      type: n.type,
      label: n.label,
      position: n.position || { x: 0, y: 0 },
      config: n.config || {},
      variables: n.variables || [],
      metadata: n.metadata || {},
    }));
    await FlowNode.insertMany(nodeDocs);
  }

  if (edges && edges.length > 0) {
    const savedNodes = await FlowNode.find({ flowId: flow._id }).lean();
    const nodeLabelMap = {};
    for (const node of savedNodes) {
      nodeLabelMap[node.label] = node._id;
    }

    const edgeDocs = edges.map(e => ({
      flowId: flow._id,
      sourceNodeId: typeof e.source === 'string' ? (nodeLabelMap[e.source] || e.source) : e.source,
      targetNodeId: typeof e.target === 'string' ? (nodeLabelMap[e.target] || e.target) : e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      label: e.label || '',
      condition: e.condition || '',
      edgeType: e.edgeType || 'default',
      animated: e.animated || false,
      style: e.style || {},
    }));
    await FlowEdge.insertMany(edgeDocs);
  }

  await FlowHistory.create({
    flowId: flow._id,
    version: 1,
    name: flow.name,
    description: flow.description,
    snapshot: { nodes: nodes || [], edges: edges || [], variables: flow.variables, config: {} },
    changeLog: `Created from template "${template.name}"`,
    changedBy: userId,
    changeType: 'created',
  });

  template.metadata.popularity = (template.metadata.popularity || 0) + 1;
  await template.save();

  return flow.toObject();
};

import mongoose from 'mongoose';
