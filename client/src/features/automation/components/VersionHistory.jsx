import { memo, useMemo } from 'react';
import {
  History, RotateCcw, Copy, GitCompare, Clock, User, FileEdit, Archive, Upload, Play,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

const CHANGE_TYPE_CONFIG = {
  created: { icon: Play, label: 'Created', color: 'text-green-400', bg: 'bg-green-500/10' },
  updated: { icon: FileEdit, label: 'Updated', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  duplicated: { icon: Copy, label: 'Duplicated', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  imported: { icon: Upload, label: 'Imported', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  rollback: { icon: RotateCcw, label: 'Rollback', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  activated: { icon: Play, label: 'Activated', color: 'text-green-400', bg: 'bg-green-500/10' },
  archived: { icon: Archive, label: 'Archived', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

/**
 * Version history panel — shows all versions of a flow with restore/compare capabilities.
 */
const VersionHistory = ({
  history = [],
  currentVersion,
  isLoading,
  onRestore,
  onDuplicate,
  onCompare,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No version history</p>
        <p className="text-xs text-muted-foreground/60 mt-1">History is tracked on each save</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground">Version History</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{history.length} versions</span>
      </div>

      <div className="space-y-1.5">
        {history.map((entry) => {
          const changeConfig = CHANGE_TYPE_CONFIG[entry.changeType] || CHANGE_TYPE_CONFIG.updated;
          const ChangeIcon = changeConfig.icon;
          const isCurrent = entry.version === currentVersion;

          return (
            <div
              key={entry._id || entry.version}
              className={cn(
                'border rounded-lg p-3 transition-all',
                isCurrent
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-border/30 hover:border-border/60 bg-card/30'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn('w-5 h-5 rounded flex items-center justify-center', changeConfig.bg)}>
                  <ChangeIcon className={cn('w-3 h-3', changeConfig.color)} />
                </div>
                <span className="text-xs font-medium text-foreground">v{entry.version}</span>
                {isCurrent && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', changeConfig.bg, changeConfig.color)}>
                  {changeConfig.label}
                </span>
              </div>

              {/* Change log */}
              {entry.changeLog && (
                <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-2">{entry.changeLog}</p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
                {entry.changedBy && (
                  <span className="flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {entry.changedBy.name || 'Unknown'}
                  </span>
                )}
                {entry.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                  </span>
                )}
              </div>

              {/* Actions */}
              {!isCurrent && (
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => onRestore?.(entry.version)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-medium transition-all"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Restore
                  </button>
                  <button
                    onClick={() => onDuplicate?.(entry.version)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:bg-muted/80 text-[10px] font-medium transition-all"
                  >
                    <Copy className="w-2.5 h-2.5" /> Duplicate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(VersionHistory);
