import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';

const nodeToRect = (node) => {
  const w = node?.measured?.width ?? node?.width ?? 180;
  const h = node?.measured?.height ?? node?.height ?? 80;
  const pos = node?.internals?.positionAbsolute ?? node?.position;
  const x = pos?.x ?? 0;
  const y = pos?.y ?? 0;
  return { x, y, w, h };
};

/**
 * Returns the sorted t values (0 < t < 1) where the segment A→B crosses the
 * boundaries of a rectangle `r`. Used to find where an edge naturally leaves a
 * source node and enters a target node.
 */
const lineRectIntersections = (ax, ay, bx, by, r) => {
  const dx = bx - ax;
  const dy = by - ay;
  const ts = [];
  if (dx !== 0) {
    ts.push((r.x - ax) / dx, (r.x + r.w - ax) / dx);
  }
  if (dy !== 0) {
    ts.push((r.y - ay) / dy, (r.y + r.h - ay) / dy);
  }
  return ts.filter((t) => t > 0 && t < 1).sort((a, b) => a - b);
};

const sideOf = (x, y, r) => {
  if (Math.abs(x - r.x) < 0.5) return Position.Left;
  if (Math.abs(x - (r.x + r.w)) < 0.5) return Position.Right;
  if (Math.abs(y - r.y) < 0.5) return Position.Top;
  return Position.Bottom;
};

/**
 * Compute natural anchor points so an edge attaches at the point on the source
 * node's side where it departs and the point on the target node's side where it
 * arrives — instead of always landing on the same fixed dots.
 */
const computeAnchors = ({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }, sourceNode, targetNode) => {
  const fallback = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
  if (!sourceNode || !targetNode) return fallback;

  const sr = nodeToRect(sourceNode);
  const tr = nodeToRect(targetNode);
  if (!sr.w || !sr.h || !tr.w || !tr.h) return fallback;

  const c1x = sr.x + sr.w / 2;
  const c1y = sr.y + sr.h / 2;
  const c2x = tr.x + tr.w / 2;
  const c2y = tr.y + tr.h / 2;

  if (Math.abs(c2x - c1x) < 1 && Math.abs(c2y - c1y) < 1) return fallback;

  const sourceTs = lineRectIntersections(c1x, c1y, c2x, c2y, sr);
  const targetTs = lineRectIntersections(c1x, c1y, c2x, c2y, tr);
  if (sourceTs.length === 0 || targetTs.length === 0) return fallback;

  const sT = sourceTs[0]; // first boundary crossed when leaving the source
  const tT = targetTs[targetTs.length - 1]; // last boundary crossed before the target center
  const ex = c1x + (c2x - c1x) * sT;
  const ey = c1y + (c2y - c1y) * sT;
  const nx = c1x + (c2x - c1x) * tT;
  const ny = c1y + (c2y - c1y) * tT;

  return {
    sourceX: ex,
    sourceY: ey,
    sourcePosition: sideOf(ex, ey, sr),
    targetX: nx,
    targetY: ny,
    targetPosition: sideOf(nx, ny, tr),
  };
};

/**
 * Custom edge component with animated styling, labels, delete button, and condition badges.
 * Edges attach at the natural point on each node's border (smart edges) rather than fixed dots.
 */
const CustomEdge = ({
  id,
  source,
  target,
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
  const { getInternalNode, setEdges } = useReactFlow();

  const anchor = computeAnchors(
    { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition },
    getInternalNode(source),
    getInternalNode(target),
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: anchor.sourceX,
    sourceY: anchor.sourceY,
    sourcePosition: anchor.sourcePosition,
    targetX: anchor.targetX,
    targetY: anchor.targetY,
    targetPosition: anchor.targetPosition,
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
