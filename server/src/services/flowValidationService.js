import FlowNode from '../models/FlowNode.js';
import FlowEdge from '../models/FlowEdge.js';
import ApiError from '../utils/ApiError.js';

/**
 * Server-side flow graph validation service.
 * Validates graph structure, detects cycles, disconnected nodes, dead ends, etc.
 */

const TRIGGER_TYPES = ['start', 'trigger_schedule', 'trigger_webhook', 'trigger_event', 'trigger_deeplink', 'trigger_qrscan', 'trigger_module'];
const END_TYPES = ['end', 'end_success', 'end_failure', 'end_cancel', 'end_terminate'];
const UTILITY_TYPES = ['comment', 'sticky_note', 'group'];

export const validateFlowGraph = async (flowId) => {
  const nodes = await FlowNode.find({ flowId }).lean();
  const edges = await FlowEdge.find({ flowId }).lean();

  const errors = [];
  const warnings = [];

  if (nodes.length === 0) {
    errors.push({ type: 'empty', message: 'Flow has no nodes' });
    return { errors, warnings, isValid: false };
  }

  const nodeIds = new Set(nodes.map(n => n._id.toString()));

  // ── Check for start node ──
  const startNodes = nodes.filter(n => TRIGGER_TYPES.includes(n.type));
  if (startNodes.length === 0) {
    errors.push({ type: 'no_start', message: 'Flow must have at least one trigger/start node' });
  }

  // ── Check for end node ──
  const endNodes = nodes.filter(n => END_TYPES.includes(n.type));
  if (endNodes.length === 0) {
    warnings.push({ type: 'no_end', message: 'Flow has no end node' });
  }

  // ── Build adjacency graph ──
  const outgoing = new Map();
  const incoming = new Map();
  for (const id of nodeIds) {
    outgoing.set(id, new Set());
    incoming.set(id, new Set());
  }

  for (const edge of edges) {
    const src = edge.sourceNodeId.toString();
    const tgt = edge.targetNodeId.toString();

    if (!nodeIds.has(src)) {
      errors.push({ type: 'broken_edge', message: `Edge references non-existent source node`, edgeId: edge._id });
      continue;
    }
    if (!nodeIds.has(tgt)) {
      errors.push({ type: 'broken_edge', message: `Edge references non-existent target node`, edgeId: edge._id });
      continue;
    }

    outgoing.get(src)?.add(tgt);
    incoming.get(tgt)?.add(src);
  }

  // ── Disconnected nodes ──
  for (const node of nodes) {
    if (UTILITY_TYPES.includes(node.type) || TRIGGER_TYPES.includes(node.type)) continue;
    if ((incoming.get(node._id.toString())?.size || 0) === 0) {
      warnings.push({
        type: 'disconnected',
        message: `Node "${node.label}" has no incoming connections`,
        nodeId: node._id,
      });
    }
  }

  // ── Dead ends ──
  for (const node of nodes) {
    if (UTILITY_TYPES.includes(node.type) || END_TYPES.includes(node.type)) continue;
    if ((outgoing.get(node._id.toString())?.size || 0) === 0) {
      warnings.push({
        type: 'dead_end',
        message: `Node "${node.label}" has no outgoing connections`,
        nodeId: node._id,
      });
    }
  }

  // ── Cycle detection (Kahn's algorithm) ──
  const functionalNodes = nodes.filter(n => !UTILITY_TYPES.includes(n.type));
  const functionalIds = new Set(functionalNodes.map(n => n._id.toString()));

  const inDegree = new Map();
  for (const id of functionalIds) inDegree.set(id, 0);

  for (const edge of edges) {
    const tgt = edge.targetNodeId.toString();
    if (functionalIds.has(tgt)) {
      inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
    }
  }

  const queue = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length > 0) {
    const nodeId = queue.shift();
    visited++;
    for (const target of (outgoing.get(nodeId) || [])) {
      if (!functionalIds.has(target)) continue;
      const newDeg = (inDegree.get(target) || 0) - 1;
      inDegree.set(target, newDeg);
      if (newDeg === 0) queue.push(target);
    }
  }

  if (visited < functionalIds.size) {
    errors.push({ type: 'cycle', message: 'Flow contains circular dependencies' });
  }

  // ── Duplicate labels check ──
  const labelCounts = new Map();
  for (const node of nodes) {
    if (UTILITY_TYPES.includes(node.type)) continue;
    const key = node.label?.toLowerCase();
    labelCounts.set(key, (labelCounts.get(key) || 0) + 1);
  }
  for (const [label, count] of labelCounts) {
    if (count > 1) {
      warnings.push({ type: 'duplicate_label', message: `Duplicate node label: "${label}"` });
    }
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    totalIssues: errors.length + warnings.length,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
};
