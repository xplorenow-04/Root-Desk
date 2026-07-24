import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';

/**
 * Custom edge component with animated styling, labels, delete button, and condition badges.
 */
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  selected,
  animated,
  label,
  markerEnd,
}) => {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.edgeType || 'default';
  const edgeColors = {
    default: '#6366f1',
    success: '#22c55e',
    failure: '#ef4444',
    condition_true: '#22c55e',
    condition_false: '#ef4444',
    loop_back: '#f97316',
    timeout: '#f59e0b',
    error: '#ef4444',
  };

  const strokeColor = edgeColors[edgeType] || edgeColors.default;

  const handleDelete = (e) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? `drop-shadow(0 0 4px ${strokeColor}50)` : undefined,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {/* Edge label */}
          {(label || data?.condition) && (
            <div className="mb-1 px-2 py-0.5 rounded-md bg-card border border-border/40 text-[10px] font-medium text-muted-foreground shadow-sm whitespace-nowrap">
              {label || data?.condition}
            </div>
          )}

          {/* Edge type badge */}
          {edgeType !== 'default' && (
            <div
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center"
              style={{
                backgroundColor: `${strokeColor}15`,
                color: strokeColor,
              }}
            >
              {edgeType.replace(/_/g, ' ')}
            </div>
          )}

          {/* Delete button — visible on hover/select */}
          {selected && (
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
