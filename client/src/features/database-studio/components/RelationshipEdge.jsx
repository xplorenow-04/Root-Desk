import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

/**
 * Custom ER Diagram Relationship Edge.
 * Renders bezier curved connector lines between fields.
 * Includes text labels representing cardinality (e.g. 1-to-many, 1-to-1).
 */
const RelationshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data = {},
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { type = 'many-to-one' } = data;

  // Resolve relationship label
  let relationshipText = '1..*';
  if (type === 'one-to-one') relationshipText = '1..1';
  if (type === 'one-to-many') relationshipText = '*..1';

  return (
    <>
      <path
        id={id}
        style={{
          stroke: '#818cf8',
          strokeWidth: 2,
          ...style,
        }}
        className="react-flow__edge-path transition-all"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-card border border-border/60 text-[9.5px] font-black font-mono text-indigo-400 px-1.5 py-0.5 rounded shadow-sm select-none"
        >
          {relationshipText}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default RelationshipEdge;
