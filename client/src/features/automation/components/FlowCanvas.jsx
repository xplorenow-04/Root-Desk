import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowNode from './FlowNode';
import StickyNoteNode from './StickyNote';
import GroupNode from './GroupNode';
import CommentNode from './CommentNode';
import CustomEdge from './CustomEdge';
import { NODE_TYPES } from '../../../constants/flowTypes';

// Register all node types
const nodeTypes = {
  flowNode: FlowNode,
  sticky_note: StickyNoteNode,
  group: GroupNode,
  comment: CommentNode,
};

// Register custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'custom',
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
};

const FlowCanvasInner = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onDropNode,
  onDragOver,
  onContextMenu,
  onSelectionChange,
  showMiniMap = true,
  showGrid = true,
  snapToGrid = true,
  fitView: shouldFitView = true,
  onInit,
}) => {
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (onInit) onInit(reactFlowInstance);
  }, [onInit, reactFlowInstance]);

  useEffect(() => {
    if (shouldFitView && nodes.length > 0) {
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, shouldFitView, reactFlowInstance]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(event);
  }, [onDragOver]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !NODE_TYPES[type]) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (onDropNode) onDropNode(type, position);
  }, [reactFlowInstance, onDropNode]);

  const handlePaneContextMenu = useCallback((event) => {
    event.preventDefault();
    if (onContextMenu) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onContextMenu('canvas', null, { x: event.clientX, y: event.clientY }, position);
    }
  }, [onContextMenu, reactFlowInstance]);

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu('node', node, { x: event.clientX, y: event.clientY });
    }
  }, [onContextMenu]);

  const handleEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu('edge', edge, { x: event.clientX, y: event.clientY });
    }
  }, [onContextMenu]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPaneContextMenu={handlePaneContextMenu}
      onNodeContextMenu={handleNodeContextMenu}
      onEdgeContextMenu={handleEdgeContextMenu}
      onSelectionChange={onSelectionChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView={false}
      snapToGrid={snapToGrid}
      snapGrid={[20, 20]}
      selectionMode={SelectionMode.Partial}
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode="Shift"
      panOnDrag={[1, 2]}
      selectionOnDrag
      panOnScroll
      zoomOnScroll
      minZoom={0.1}
      maxZoom={4}
    >
      {showGrid && (
        <Background
          color="hsl(var(--border))"
          gap={20}
        />
      )}
      {showMiniMap && (
        <MiniMap
          nodeStrokeColor="#6366f1"
          nodeColor="var(--card)"
          nodeBorderRadius={8}
          maskColor="rgba(0,0,0,0.1)"
          className="!border !border-border/40 !rounded-xl !shadow-lg !backdrop-blur-sm"
          style={{ background: 'var(--card)' }}
        />
      )}
      <Controls
        className="!border !border-border/40 !rounded-xl !shadow-lg !backdrop-blur-sm"
        showInteractive={false}
      />
    </ReactFlow>
  );
};

const FlowCanvas = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default FlowCanvas;
