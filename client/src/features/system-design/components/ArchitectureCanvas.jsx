import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ArchitectureNode from './ArchitectureNode';
import ArchitectureEdge from './ArchitectureEdge';
import GroupNode from './GroupNode';

const NODE_TYPES = { architectureNode: ArchitectureNode, groupNode: GroupNode };
const EDGE_TYPES = { archEdge: ArchitectureEdge };
const DEFAULT_EDGE_OPTIONS = { type: 'archEdge' };
const SNAP_GRID = [8, 8];
const FIT_VIEW_OPTIONS = { padding: 0.2, maxZoom: 1 };

const nodeColor = (node) => {
  const color = node.data?.node?.style?.color || node.data?.group?.color;
  return color || '#6366f1';
};

/**
 * The React Flow canvas for the system design studio. Owns rendering only —
 * all state lives in the editor hook. Supports drag-and-drop of catalog
 * components and patterns via dataTransfer, plus a context menu hook.
 */
const ArchitectureCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onSelectionChange,
  onDropComponent,
  onDropPattern,
  onEdgeContextMenu,
  onNodeContextMenu,
  onPaneContextMenu,
  snapToGrid = true,
  showMinimap = true,
  simulate = false,
  className = '',
  children,
}) => {
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onDragOver = (ev) => {
      if (
        ev.dataTransfer.types.includes('application/system-design-component') ||
        ev.dataTransfer.types.includes('application/system-design-pattern')
      ) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      }
    };
    el.addEventListener('dragover', onDragOver);
    return () => el.removeEventListener('dragover', onDragOver);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      const type = event.dataTransfer.getData('application/system-design-component');
      const patternId = event.dataTransfer.getData('application/system-design-pattern');
      if (!type && !patternId) return;
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      if (type) onDropComponent?.(type, position);
      if (patternId) onDropPattern?.(patternId, position);
    },
    [screenToFlowPosition, onDropComponent, onDropPattern]
  );

  return (
    <div ref={wrapperRef} className={`h-full w-full ${className}`} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.15}
        maxZoom={2.5}
        snapToGrid={snapToGrid}
        snapGrid={SNAP_GRID}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift', 'Meta']}
        panOnScroll
        zoomOnDoubleClick={false}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        nodesConnectable={!simulate}
        nodesDraggable={!simulate}
        elementsSelectable={!simulate}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(148,163,184,0.18)" />
        {showMinimap && (
          <MiniMap
            pannable
            zoomable
            nodeColor={nodeColor}
            nodeStrokeColor="#1e293b"
            maskColor="rgba(15,23,42,0.55)"
            className="!bg-muted/80 !border !border-border/60 !rounded-lg !m-3 overflow-hidden"
          />
        )}
        <Controls className="!border !border-border/60 !rounded-lg !shadow-sm overflow-hidden" showInteractive={false} />
        <Panel position="top-right">{children}</Panel>
      </ReactFlow>
    </div>
  );
};

export default ArchitectureCanvas;
