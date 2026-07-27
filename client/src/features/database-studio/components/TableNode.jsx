import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, Key, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom ER Diagram Table Node for React Flow.
 * Renders database column names, primary/foreign key icons, nullable indicators, and type badges.
 * Provides custom handles on the left and right of every row for precise edge connections.
 */
const TableNode = ({ data, selected }) => {
  const { name, fields = [], color = '#6366f1' } = data;

  return (
    <div
      className={cn(
        'w-[240px] rounded-xl border border-border/40 bg-card/90 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Table Header Accent */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: color }}
      />

      {/* Table Header */}
      <div className="flex items-center justify-between bg-muted/40 px-3.5 py-2.5 border-b border-border/20">
        <span className="font-bold text-sm text-foreground truncate select-none">
          {name}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border/40 px-1.5 py-0.5 rounded">
          Table
        </span>
      </div>

      {/* Columns List */}
      <div className="py-1 divide-y divide-border/10 bg-background/30">
        {fields.map((field) => {
          const isFk = field.isFk || false;

          return (
            <div
              key={field.name}
              className="relative flex items-center justify-between px-3.5 py-1.5 group hover:bg-muted/30"
            >
              {/* Left Handle (Target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={field.name}
                className="!w-2 !h-2 !border !border-border/60 !bg-card hover:!bg-primary transition-colors !top-1/2 !-translate-y-1/2 !-left-1"
              />

              {/* Name & Indicators */}
              <div className="flex items-center gap-1.5 min-w-0">
                {field.isPk && (
                  <Key className="h-3 w-3 text-amber-500 shrink-0" title="Primary Key" />
                )}
                {isFk && (
                  <Link2 className="h-3 w-3 text-indigo-400 shrink-0" title="Foreign Key" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium truncate select-none',
                    field.isPk ? 'text-foreground font-semibold' : 'text-foreground/80'
                  )}
                >
                  {field.name}
                </span>
                {!field.isNullable && !field.isPk && (
                  <span className="text-[9px] text-destructive font-black select-none" title="Not Null">*</span>
                )}
              </div>

              {/* Type Badge */}
              <span className="text-[9.5px] font-semibold font-mono text-muted-foreground shrink-0 bg-muted/65 border border-border/20 px-1 py-0.5 rounded select-none">
                {field.type}
              </span>

              {/* Right Handle (Source) */}
              <Handle
                type="source"
                position={Position.Right}
                id={field.name}
                className="!w-2 !h-2 !border !border-border/60 !bg-card hover:!bg-primary transition-colors !top-1/2 !-translate-y-1/2 !-right-1"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(TableNode);
