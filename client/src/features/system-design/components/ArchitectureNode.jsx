import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Lock, EyeOff } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { getComponentDef, CATEGORY_MAP } from '../constants/architecture';
import { cn } from '@/lib/utils';

/**
 * Typed architecture node. The semantic node object (data.node) drives
 * everything: type, category, properties, lock/hidden state. Icon and colors
 * come from the component definition system.
 */

const stripBase = {
  borderRadius: 0,
  background: 'transparent',
  border: 'none',
  minWidth: 0,
  minHeight: 0,
  margin: 0,
  zIndex: 6,
};

const leftStrip = { ...stripBase, top: '50%', left: 0, transform: 'translate(0,-50%)', width: 18, height: 'calc(100% - 24px)' };
const rightStrip = { ...stripBase, top: '50%', right: 0, transform: 'translate(0,-50%)', width: 18, height: 'calc(100% - 24px)' };
const topStrip = { ...stripBase, top: 0, left: '50%', transform: 'translate(-50%,0)', width: 'calc(100% - 24px)', height: 16 };
const bottomStrip = { ...stripBase, top: 'auto', bottom: 0, left: '50%', transform: 'translate(-50%,0)', width: 'calc(100% - 24px)', height: 16 };

const Dot = ({ className = '' }) => (
  <span
    className={`pointer-events-none absolute z-10 h-2 w-2 rounded-full border-2 bg-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 ${className}`}
    style={{ borderColor: 'currentColor' }}
  />
);

const ArchitectureNode = memo(({ data, selected, id }) => {
  const node = data?.node;
  const def = getComponentDef(node?.type, data?.customComponents) || {};
  const Icon = getIcon(def.icon || node?.metadata?.icon);
  const category = CATEGORY_MAP[node?.category] || CATEGORY_MAP.custom;
  const color = node?.style?.color || def.color || category.color || '#6366f1';
  const isLocked = Boolean(node?.locked);
  const isHidden = Boolean(node?.hidden);
  const simStatus = data?.simStatus; // 'down' | 'overloaded' | 'ok' | 'impacted'

  const badge = (key, label) => {
    const v = node?.properties?.[key];
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'number' && !isFinite(v)) return null;
    return (
      <span className="truncate rounded border border-border/50 bg-muted/60 px-1 py-px font-mono text-[10px] leading-tight text-muted-foreground">
        {label}
        {typeof v === 'number' ? v.toLocaleString() : v}
      </span>
    );
  };

  return (
    <div
      className={cn(
        'group relative h-full w-full rounded-xl border-2 bg-card/90 shadow-sm backdrop-blur-sm transition-shadow',
        'hover:shadow-md',
        isHidden && 'opacity-40',
        isLocked && 'opacity-80',
        selected && 'shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background',
        simStatus === 'down' && '!border-red-500 ring-2 ring-red-500/60',
        simStatus === 'overloaded' && '!border-orange-500',
        simStatus === 'impacted' && 'ring-2 ring-orange-400/50'
      )}
      style={{ borderColor: color }}
    >
      <NodeResizer isVisible={selected} minWidth={140} minHeight={56} lineClassName="border-primary/60" handleClassName="!h-2.5 !w-2.5 !bg-primary !border-2 !border-background !rounded-sm" />
      <Handle type="target" position={Position.Left} className="rf-flow-strip" style={{ ...leftStrip, color }}>
        <Dot className="left-0 top-1/2 -translate-y-1/2" />
      </Handle>
      <Handle type="target" position={Position.Top} id="top" className="rf-flow-strip" style={{ ...topStrip, color }}>
        <Dot className="top-0 left-1/2 -translate-x-1/2" />
      </Handle>
      <Handle type="source" position={Position.Right} className="rf-flow-strip" style={{ ...rightStrip, color }}>
        <Dot className="right-0 top-1/2 -translate-y-1/2" />
      </Handle>
      <Handle type="source" position={Position.Bottom} id="bottom" className="rf-flow-strip" style={{ ...bottomStrip, color }}>
        <Dot className="bottom-0 left-1/2 -translate-x-1/2" />
      </Handle>

      <div className="flex h-full flex-col overflow-hidden rounded-xl p-2">
        <div className="flex items-start gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            <Icon size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-tight text-foreground">
              {node?.name || def.label || 'Component'}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {category.label} · {def.label}
            </div>
          </div>
          {isLocked && <Lock size={12} className="mt-0.5 shrink-0 text-muted-foreground" />}
          {isHidden && <EyeOff size={12} className="mt-0.5 shrink-0 text-muted-foreground" />}
        </div>

        {node?.description && (
          <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground/80">{node.description}</p>
        )}

        {(badge('requestsPerSec', '') || badge('readsPerSec', 'R:') || badge('writesPerSec', 'W:') || badge('throughput', '')) && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {badge('requestsPerSec', 'req/s ')}
            {badge('readsPerSec', 'R ')}
            {badge('writesPerSec', 'W ')}
            {badge('throughput', 'msg/s ')}
          </div>
        )}

        {simStatus === 'down' && (
          <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-red-500/90 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-white">
            Down
          </div>
        )}
        {simStatus === 'overloaded' && (
          <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-orange-500/90 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-white">
            Overloaded
          </div>
        )}
      </div>
    </div>
  );
});

ArchitectureNode.displayName = 'ArchitectureNode';
export default ArchitectureNode;
