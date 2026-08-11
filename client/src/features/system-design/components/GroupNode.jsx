import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Lock, Boxes } from 'lucide-react';
import { BOUNDARY_TYPES } from '../constants/architecture';
import { cn } from '@/lib/utils';

/**
 * Group boundary node. Renders a labeled, dashed boundary rectangle with the
 * given boundary type badge. Resizable via the handle; dragging is handled by
 * the editor hook (translates all contained nodes).
 */
const GroupNode = memo(({ data, selected }) => {
  const group = data?.group;
  const boundaryType = group?.boundaryType || 'logical';
  const boundaryDef = BOUNDARY_TYPES[boundaryType] || BOUNDARY_TYPES.logical;
  const color = group?.color || boundaryDef?.color || '#6366f1';
  const isLocked = Boolean(group?.locked);

  return (
    <div
      className={cn(
        'h-full w-full rounded-xl border-2 border-dashed bg-background/40 transition-shadow',
        selected && 'ring-2 ring-primary/60'
      )}
      style={{ borderColor: color }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={120}
        lineClassName="border-primary/50"
        handleClassName="!h-2.5 !w-2.5 !bg-primary !border-2 !border-background !rounded-sm"
      />
      <div
        className="pointer-events-none absolute left-3 top-2 flex max-w-[85%] items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {boundaryDef?.icon && <boundaryDef.icon size={11} />}
        <span className="truncate">{group?.name || boundaryDef?.label || 'Boundary'}</span>
        {boundaryType !== 'logical' && (
          <span className="rounded bg-black/25 px-1 font-normal">{boundaryType}</span>
        )}
        {isLocked && <Lock size={10} className="opacity-80" />}
      </div>
      <div className="absolute bottom-2 right-2 text-muted-foreground/40">
        <Boxes size={14} />
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';
export default GroupNode;
