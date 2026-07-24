import { memo, useState } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Boxes, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Group node — visual container for grouping related nodes.
 * Collapsible, labeled, colored.
 */
const GroupNode = ({ data, selected }) => {
  const [isCollapsed, setIsCollapsed] = useState(data?.config?.collapsed || false);
  const color = data?.config?.color || '#a78bfa';
  const label = data?.config?.label || data?.label || 'Group';

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-violet-400"
        handleClassName="!w-2.5 !h-2.5 !bg-violet-400 !border-violet-500"
      />
      <div
        className={cn(
          'rounded-xl border-2 border-dashed transition-all duration-200',
          isCollapsed ? 'min-w-[200px] min-h-[40px]' : 'min-w-[200px] min-h-[120px]',
          selected && 'ring-2 ring-violet-400/50 ring-offset-2 ring-offset-background',
        )}
        style={{
          borderColor: `${color}60`,
          backgroundColor: `${color}08`,
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t-[10px]"
          style={{ backgroundColor: `${color}15` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <Boxes className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        {!isCollapsed && (
          <div className="p-4 min-h-[80px]">
            {/* Child nodes render inside the group via React Flow parentId */}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(GroupNode);
