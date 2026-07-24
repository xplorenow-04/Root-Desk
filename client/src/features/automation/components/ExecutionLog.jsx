import { format } from 'date-fns';
import {
  PlayCircle, PauseCircle, StopCircle, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, SkipForward, RotateCcw, User,
} from 'lucide-react';
import { EXECUTION_STATUSES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

const statusIcons = {
  pending: Clock,
  running: PlayCircle,
  paused: PauseCircle,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: StopCircle,
};

const ExecutionLog = ({
  executions = [],
  isLoading,
  onPause,
  onResume,
  onCancel,
  onRestart,
  onRetry,
  onView,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!executions.length) {
    return (
      <div className="text-center py-12">
        <PlayCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No executions yet</p>
        <p className="text-xs text-muted-foreground/60">Run the flow to see execution history</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {executions.map((exec) => {
        const statusConfig = EXECUTION_STATUSES.find(s => s.value === exec.status) || EXECUTION_STATUSES[0];
        const StatusIcon = statusIcons[exec.status] || Clock;
        const failedNodes = exec.nodeResults?.filter(nr => nr.status === 'failed') || [];
        const duration = exec.duration
          ? exec.duration < 1000
            ? `${exec.duration}ms`
            : `${(exec.duration / 1000).toFixed(1)}s`
          : null;

        return (
          <div
            key={exec._id}
            className="rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-4 hover:bg-card/60 transition-all cursor-pointer"
            onClick={() => onView?.(exec._id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <StatusIcon className={cn('w-5 h-5 mt-0.5', statusConfig.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium', statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                    {duration && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {duration}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      v{exec.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {exec.triggeredBy?.name || 'System'}
                    </span>
                    <span>
                      {exec.startedAt && format(new Date(exec.startedAt), 'MMM d, HH:mm:ss')}
                    </span>
                    {failedNodes.length > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        {failedNodes.length} failed
                      </span>
                    )}
                  </div>
                  {exec.error?.message && (
                    <p className="text-[10px] text-red-400 mt-1 truncate">{exec.error.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {exec.status === 'running' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPause?.(exec._id); }}
                      className="p-1.5 rounded-lg hover:bg-orange-500/10 text-orange-400 transition-all"
                      title="Pause"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCancel?.(exec._id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                      title="Cancel"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {exec.status === 'paused' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResume?.(exec._id); }}
                    className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400 transition-all"
                    title="Resume"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                {exec.status === 'failed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRetry?.(exec._id); }}
                    className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-all"
                    title="Retry Failed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {['completed', 'failed', 'cancelled'].includes(exec.status) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestart?.(exec._id); }}
                    className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-all"
                    title="Restart"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExecutionLog;
