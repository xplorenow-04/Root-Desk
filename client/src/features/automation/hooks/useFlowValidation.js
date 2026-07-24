import { useMemo, useCallback } from 'react';

/**
 * Client-side flow graph validation.
 * Detects disconnected nodes, dead ends, cycles, missing configs, etc.
 */
export const useFlowValidation = (nodes, edges) => {
  const validate = useCallback(() => {
    const errors = [];
    const warnings = [];

    if (!nodes || nodes.length === 0) {
      errors.push({ type: 'empty', message: 'Flow has no nodes', severity: 'error' });
      return { errors, warnings, isValid: false };
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // ── Check for Start node ──
    const startNodes = nodes.filter(n =>
      ['start', 'trigger_schedule', 'trigger_webhook', 'trigger_event', 'trigger_deeplink', 'trigger_qrscan', 'trigger_module'].includes(n.data?.nodeType)
    );
    if (startNodes.length === 0) {
      errors.push({ type: 'no_start', message: 'Flow must have at least one trigger/start node', severity: 'error' });
    }

    // ── Check for End node ──
    const endNodes = nodes.filter(n =>
      ['end', 'end_success', 'end_failure', 'end_cancel', 'end_terminate'].includes(n.data?.nodeType)
    );
    if (endNodes.length === 0) {
      warnings.push({ type: 'no_end', message: 'Flow has no end node — execution may not terminate cleanly', severity: 'warning' });
    }

    // ── Build adjacency graph ──
    const outgoing = new Map(); // nodeId → Set of target nodeIds
    const incoming = new Map(); // nodeId → Set of source nodeIds

    for (const nodeId of nodeIds) {
      outgoing.set(nodeId, new Set());
      incoming.set(nodeId, new Set());
    }

    for (const edge of (edges || [])) {
      const src = edge.source;
      const tgt = edge.target;

      // Check for broken connections
      if (!nodeIds.has(src)) {
        errors.push({ type: 'broken_edge', message: `Edge references non-existent source node`, nodeId: src, edgeId: edge.id, severity: 'error' });
        continue;
      }
      if (!nodeIds.has(tgt)) {
        errors.push({ type: 'broken_edge', message: `Edge references non-existent target node`, nodeId: tgt, edgeId: edge.id, severity: 'error' });
        continue;
      }

      outgoing.get(src)?.add(tgt);
      incoming.get(tgt)?.add(src);
    }

    // ── Disconnected nodes (non-utility, non-trigger, no incoming edges) ──
    const utilityTypes = ['comment', 'sticky_note', 'group'];
    const triggerTypes = ['start', 'trigger_schedule', 'trigger_webhook', 'trigger_event', 'trigger_deeplink', 'trigger_qrscan', 'trigger_module'];

    for (const node of nodes) {
      const nt = node.data?.nodeType;
      if (utilityTypes.includes(nt)) continue; // skip utility nodes

      if (!triggerTypes.includes(nt) && (incoming.get(node.id)?.size || 0) === 0) {
        warnings.push({
          type: 'disconnected',
          message: `Node "${node.data?.label || nt}" has no incoming connections`,
          nodeId: node.id,
          severity: 'warning',
        });
      }
    }

    // ── Dead ends (non-utility, non-end, no outgoing edges) ──
    const endTypes = ['end', 'end_success', 'end_failure', 'end_cancel', 'end_terminate'];

    for (const node of nodes) {
      const nt = node.data?.nodeType;
      if (utilityTypes.includes(nt) || endTypes.includes(nt)) continue;

      if ((outgoing.get(node.id)?.size || 0) === 0) {
        warnings.push({
          type: 'dead_end',
          message: `Node "${node.data?.label || nt}" has no outgoing connections`,
          nodeId: node.id,
          severity: 'warning',
        });
      }
    }

    // ── Cycle detection (Kahn's algorithm) ──
    const inDegree = new Map();
    const filteredNodes = nodes.filter(n => !utilityTypes.includes(n.data?.nodeType));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    for (const id of filteredNodeIds) {
      inDegree.set(id, 0);
    }

    for (const edge of (edges || [])) {
      if (filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
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
        if (!filteredNodeIds.has(target)) continue;
        const newDeg = (inDegree.get(target) || 0) - 1;
        inDegree.set(target, newDeg);
        if (newDeg === 0) queue.push(target);
      }
    }

    if (visited < filteredNodeIds.size) {
      errors.push({ type: 'cycle', message: 'Flow contains circular dependencies', severity: 'error' });
    }

    // ── Duplicate IDs ──
    const idCounts = new Map();
    for (const node of nodes) {
      idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
    }
    for (const [id, count] of idCounts) {
      if (count > 1) {
        errors.push({ type: 'duplicate_id', message: `Duplicate node ID: ${id}`, nodeId: id, severity: 'error' });
      }
    }

    // ── Missing required config for specific node types ──
    for (const node of nodes) {
      const nt = node.data?.nodeType;
      const cfg = node.data?.config || {};

      if (nt === 'api' && !cfg.apiEndpoint) {
        warnings.push({ type: 'missing_config', message: `API node "${node.data?.label}" missing endpoint`, nodeId: node.id, severity: 'warning' });
      }
      if (nt === 'decision' && !cfg.condition && !cfg.conditionExpression) {
        warnings.push({ type: 'missing_config', message: `Decision node "${node.data?.label}" missing condition`, nodeId: node.id, severity: 'warning' });
      }
      if (nt === 'page' && !cfg.page) {
        warnings.push({ type: 'missing_config', message: `Page node "${node.data?.label}" missing page selection`, nodeId: node.id, severity: 'warning' });
      }
      if (nt === 'notification' && !cfg.notificationMessage) {
        warnings.push({ type: 'missing_config', message: `Notification node "${node.data?.label}" missing message`, nodeId: node.id, severity: 'warning' });
      }
      if (nt === 'delay' && (!cfg.delay || cfg.delay <= 0)) {
        warnings.push({ type: 'missing_config', message: `Delay node "${node.data?.label}" needs positive duration`, nodeId: node.id, severity: 'warning' });
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
      totalIssues: errors.length + warnings.length,
    };
  }, [nodes, edges]);

  const validationResult = useMemo(() => validate(), [validate]);

  return {
    ...validationResult,
    validate,
  };
};

export default useFlowValidation;
