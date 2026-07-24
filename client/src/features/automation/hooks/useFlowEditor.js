import { useState, useCallback, useRef } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

const initialNodeConfig = (type, position = { x: 0, y: 0 }) => {
  const isUtility = ['comment', 'sticky_note', 'group'].includes(type);
  const baseConfig = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: isUtility ? type : 'flowNode',
    position,
    data: {
      nodeType: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      config: {},
      variables: [],
      locked: false,
    },
  };
  return baseConfig;
};

export const useFlowEditor = (initialNodes = [], initialEdges = []) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushUndo = useCallback(() => {
    undoStack.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    redoStack.current = [];
    if (undoStack.current.length > 50) undoStack.current.shift();
    updateUndoRedoState();
  }, [nodes, edges, updateUndoRedoState]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      // Filter out position changes for locked nodes
      const filteredChanges = changes.map(change => {
        if (change.type === 'position' && change.id) {
          const node = nds.find(n => n.id === change.id);
          if (node?.data?.locked) {
            return { ...change, dragging: false, position: node.position };
          }
        }
        return change;
      });
      const updated = applyNodeChanges(filteredChanges, nds);
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const updated = applyEdgeChanges(changes, eds);
      return updated;
    });
  }, []);

  const onConnect = useCallback((connection) => {
    pushUndo();
    setEdges((eds) => addEdge({
      ...connection,
      animated: true,
      type: 'custom',
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }, eds));
    setIsDirty(true);
  }, [pushUndo]);

  const addNode = useCallback((type, position) => {
    pushUndo();
    const newNode = initialNodeConfig(type, position);
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
    return newNode;
  }, [pushUndo]);

  const removeNode = useCallback((nodeId) => {
    pushUndo();
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode((prev) => prev?.id === nodeId ? null : prev);
    setIsDirty(true);
  }, [pushUndo]);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev);
    setIsDirty(true);
  }, []);

  const removeEdge = useCallback((edgeId) => {
    pushUndo();
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
    setSelectedEdge(null);
    setIsDirty(true);
  }, [pushUndo]);

  const lockNode = useCallback((nodeId) => {
    updateNodeData(nodeId, { locked: true });
  }, [updateNodeData]);

  const unlockNode = useCallback((nodeId) => {
    updateNodeData(nodeId, { locked: false });
  }, [updateNodeData]);

  const groupNodes = useCallback((nodeIds, groupLabel = 'New Group') => {
    pushUndo();
    const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedNodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 180);
      maxY = Math.max(maxY, n.position.y + 80);
    });

    const padding = 40;
    const groupNode = {
      id: `node_${Date.now()}_group`,
      type: 'group',
      position: { x: minX - padding, y: minY - padding - 40 },
      style: { width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 + 40 },
      data: {
        nodeType: 'group',
        label: groupLabel,
        config: { label: groupLabel, color: '#a78bfa', collapsed: false },
      },
    };

    setNodes(nds => [...nds, groupNode]);
    setIsDirty(true);
  }, [nodes, pushUndo]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    const prev = undoStack.current.pop();
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setIsDirty(true);
    updateUndoRedoState();
  }, [nodes, edges, updateUndoRedoState]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    const next = redoStack.current.pop();
    setNodes(next.nodes);
    setEdges(next.edges);
    setIsDirty(true);
    updateUndoRedoState();
  }, [nodes, edges, updateUndoRedoState]);

  const copySelected = useCallback(() => {
    if (selectedNode) {
      setClipboard({ type: 'node', data: selectedNode });
    } else if (selectedEdge) {
      setClipboard({ type: 'edge', data: selectedEdge });
    }
  }, [selectedNode, selectedEdge]);

  const paste = useCallback(() => {
    if (!clipboard) return;
    pushUndo();
    if (clipboard.type === 'node') {
      const newNode = {
        ...clipboard.data,
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: clipboard.data.position.x + 50,
          y: clipboard.data.position.y + 50,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    setIsDirty(true);
  }, [clipboard, pushUndo]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    pushUndo();
    const newNode = {
      ...selectedNode,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: selectedNode.position.x + 100,
        y: selectedNode.position.y + 100,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  }, [selectedNode, pushUndo]);

  const autoLayout = useCallback(() => {
    pushUndo();
    const spacing = { x: 250, y: 100 };
    const startY = 100;
    const sorted = [...nodes].sort((a, b) => {
      const aType = a.data?.nodeType || a.type;
      const bType = b.data?.nodeType || b.type;
      if (aType === 'start') return -1;
      if (bType === 'start') return 1;
      if (aType === 'end') return 1;
      if (bType === 'end') return -1;
      return 0;
    });

    const updated = sorted.map((node, index) => ({
      ...node,
      position: { x: 100, y: startY + index * spacing.y },
    }));
    setNodes(updated);
    setIsDirty(true);
  }, [nodes, pushUndo]);

  const getFlowData = useCallback(() => {
    const flowNodes = nodes.map(n => ({
      id: n.id,
      type: n.data?.nodeType || n.type,
      label: n.data?.label,
      position: n.position,
      data: n.data,
      style: n.style,
    }));
    const flowEdges = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      animated: e.animated,
      style: e.style,
      edgeType: e.data?.edgeType || 'default',
      condition: e.data?.condition || '',
      conditionExpression: e.data?.conditionExpression || '',
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [nodes, edges]);

  const loadFlowData = useCallback((flowNodes, flowEdges) => {
    const formattedNodes = (flowNodes || []).map(n => {
      const nodeType = n.type || n.data?.nodeType || 'action';
      const isUtility = ['comment', 'sticky_note', 'group'].includes(nodeType);
      return {
        id: n.clientId || n._id || n.id,
        type: isUtility ? nodeType : 'flowNode',
        position: n.position || { x: 0, y: 0 },
        style: n.style || {},
        data: {
          nodeType,
          label: n.label || n.data?.label || nodeType,
          config: n.config || n.data?.config || {},
          variables: n.variables || n.data?.variables || [],
          metadata: n.metadata || n.data?.metadata || {},
          locked: n.locked || n.data?.locked || false,
        },
      };
    });
    const formattedEdges = (flowEdges || []).map(e => ({
      id: e._id || e.id,
      source: e.sourceNodeId?.toString() || e.source,
      target: e.targetNodeId?.toString() || e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      label: e.label || '',
      animated: e.animated !== undefined ? e.animated : true,
      style: e.style || { stroke: '#6366f1', strokeWidth: 2 },
      data: {
        condition: e.condition || '',
        conditionExpression: e.conditionExpression || '',
        edgeType: e.edgeType || 'default',
      },
    }));
    setNodes(formattedNodes);
    setEdges(formattedEdges);
    setIsDirty(false);
    undoStack.current = [];
    redoStack.current = [];
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const clearEditor = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setIsDirty(false);
    undoStack.current = [];
    redoStack.current = [];
    setClipboard(null);
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  return {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    isDirty,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    updateNodeData,
    removeEdge,
    lockNode,
    unlockNode,
    groupNodes,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelected,
    paste,
    duplicateSelected,
    autoLayout,
    getFlowData,
    loadFlowData,
    clearEditor,
    setSelectedNode,
    setSelectedEdge,
  };
};
