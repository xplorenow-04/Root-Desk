import { memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

const nodeToRect = (node) => {
  const w = node?.measured?.width ?? node?.width ?? 180;
  const h = node?.measured?.height ?? node?.height ?? 80;
  const pos = node?.internals?.positionAbsolute ?? node?.position;
  return { x: pos?.x ?? 0, y: pos?.y ?? 0, w, h };
};

const lineRectIntersections = (ax, ay, bx, by, r) => {
  const dx = bx - ax;
  const dy = by - ay;
  const ts = [];
  if (dx !== 0) ts.push((r.x - ax) / dx, (r.x + r.w - ax) / dx);
  if (dy !== 0) ts.push((r.y - ay) / dy, (r.y + r.h - ay) / dy);
  return ts.filter((t) => t > 0 && t < 1).sort((a, b) => a - b);
};

const sideOf = (x, y, r) => {
  if (Math.abs(x - r.x) < 0.5) return 'left';
  if (Math.abs(x - (r.x + r.w)) < 0.5) return 'right';
  if (Math.abs(y - r.y) < 0.5) return 'top';
  return 'bottom';
};

const computeAnchors = ({ sourceX, sourceY, targetX, targetY }, sourceNode, targetNode) => {
  const fallback = { sourceX, sourceY, targetX, targetY };
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
  if (!sourceTs.length || !targetTs.length) return fallback;
  const sT = sourceTs[0];
  const tT = targetTs[targetTs.length - 1];
  const ex = c1x + (c2x - c1x) * sT;
  const ey = c1y + (c2y - c1y) * sT;
  const nx = c1x + (c2x - c1x) * tT;
  const ny = c1y + (c2y - c1y) * tT;
  return {
    sourceX: ex,
    sourceY: ey,
    targetX: nx,
    targetY: ny,
    sourceSide: sideOf(ex, ey, sr),
    targetSide: sideOf(nx, ny, tr),
  };
};

const fmtRps = (rps) => {
  if (!rps || rps <= 0) return '';
  if (rps >= 1e6) return `${(rps / 1e6).toFixed(1)}M`;
  if (rps >= 1e3) return `${(rps / 1e3).toFixed(0)}K`;
  return `${Math.round(rps)}`;
};

/**
 * Architecture edge — first-class semantic connection.
 * Solid = synchronous, dashed = asynchronous, animated = live traffic flow.
 * Shows protocol + traffic + latency labels and a delete affordance.
 */
const ArchitectureEdge = memo(({ id, source, target, sourceX, sourceY, targetX, targetY, data, selected, markerEnd, markerStart }) => {
  const { getNode } = useReactFlow();
  const edge = data?.edge;
  const anchors = useMemo(
    () => computeAnchors({ sourceX, sourceY, targetX, targetY }, getNode(source), getNode(target)),
    [sourceX, sourceY, targetX, targetY, source, target, getNode]
  );
  const [path] = getBezierPath({
    sourceX: anchors.sourceX,
    sourceY: anchors.sourceY,
    targetX: anchors.targetX,
    targetY: anchors.targetY,
    sourcePosition: anchors.sourceSide || 'right',
    targetPosition: anchors.targetSide || 'left',
  });

  const isAsync = edge?.syncMode === 'async';
  const isBidirectional = edge?.direction === 'bidirectional';
  const protocol = edge?.protocol || 'REST';
  const rps = edge?.traffic?.rps ?? 0;
  const peakRps = edge?.traffic?.peakRps ?? 0;
  const p99 = edge?.latency?.p99 ?? 0;
  const color = edge?.style?.color || (isAsync ? '#a78bfa' : '#6366f1');

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={isBidirectional ? markerStart : undefined}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.75,
          strokeDasharray: isAsync ? '7 4' : undefined,
          opacity: selected ? 1 : 0.85,
        }}
        interactionWidth={24}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/90 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-foreground shadow-sm backdrop-blur-sm"
          style={{ transform: `translate(-50%, -50%) translate(${anchors.targetX}px, ${anchors.targetY}px)` }}
        >
          <span className="font-semibold" style={{ color }}>
            {protocol}
          </span>
          {isAsync && <span className="ml-1 text-violet-400">~async</span>}
          {rps > 0 && <span className="ml-1 text-muted-foreground">{fmtRps(rps)}rps</span>}
          {p99 > 0 && <span className="ml-1 text-muted-foreground">p99 {p99}ms</span>}
        </div>
        {selected && (
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              data?.onDelete?.(id);
            }}
            className="absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow hover:bg-destructive hover:text-white"
            style={{ transform: `translate(-50%, -50%) translate(${anchors.targetX}px, ${anchors.targetY + 26}px)` }}
            title="Delete connection"
          >
            <X size={11} />
          </button>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

ArchitectureEdge.displayName = 'ArchitectureEdge';
export default ArchitectureEdge;
