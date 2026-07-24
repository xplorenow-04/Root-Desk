import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, PlayCircle, PauseCircle, StopCircle, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, RotateCcw, User, GitBranch,
} from 'lucide-react';
import { useExecution, useExecuteActions } from '../hooks/useFlowExecution';
import { EXECUTION_STATUSES, NODE_TYPES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { pageVariants } from '../../../lib/animations';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import ErrorState from '../../../components/shared/ErrorState';
import { toast } from 'sonner';

const statusIcons = {
  pending: Clock,
  running: PlayCircle,
  paused: PauseCircle,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: StopCircle,
};

const FlowExecutionDetailPage = () => {
  const { executionId } = useParams();
  const navigate = useNavigate();
  const { data: execution, isLoading, error } = useExecution(executionId);
  const execActions = useExecuteActions();

  const handleAction = async (action) => {
    try {
      await execActions[action](executionId);
      toast.success(`Execution ${action}ed`);
    } catch (err) {
      toast.error(`Failed to ${action} execution`);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={() => navigate('/automation/flows')} />;

  const statusConfig = EXECUTION_STATUSES.find(s => s.value === execution?.status) || EXECUTION_STATUSES[0];
  const StatusIcon = statusIcons[execution?.status] || Clock;
  const nodeResults = execution?.nodeResults || [];
  const failedNodes = nodeResults.filter(nr => nr.status === 'failed');
  const duration = execution?.duration
    ? execution.duration < 1000
      ? `${execution.duration}ms`
      : `${(execution.duration / 1000).toFixed(1)}s`
    : null;

  const getNodeName = (nodeId) => {
    const node = execution?.nodes?.find(n => n._id === nodeId);
    return node?.label || 'Unknown Node';
  };

  const getNodeType = (nodeId) => {
    const node = execution?.nodes?.find(n => n._id === nodeId);
    const typeConfig = NODE_TYPES[node?.type];
    return typeConfig?.icon;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Execution Details</h1>
          <p className="text-xs text-muted-foreground">ID: {executionId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
            <div>
              <p className={cn('text-sm font-semibold', statusConfig.color)}>{statusConfig.label}</p>
              <p className="text-[10px] text-muted-foreground">Status</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Started</span>
              <span>{execution?.startedAt ? format(new Date(execution.startedAt), 'MMM d, HH:mm:ss') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span>{duration || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span>v{execution?.version}</span>
            </div>
            <div className="flex justify-between">
              <span>Triggered By</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {execution?.triggeredBy?.name || 'System'}
              </span>
            </div>
          </div>

          {['running', 'paused', 'failed'].includes(execution?.status) && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
              {execution?.status === 'running' && (
                <>
                  <button onClick={() => handleAction('pause')} className="flex-1 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs font-medium transition-all">
                    <PauseCircle className="w-3.5 h-3.5 inline mr-1" /> Pause
                  </button>
                  <button onClick={() => handleAction('cancel')} className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all">
                    <StopCircle className="w-3.5 h-3.5 inline mr-1" /> Cancel
                  </button>
                </>
              )}
              {execution?.status === 'paused' && (
                <button onClick={() => handleAction('resume')} className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-all">
                  <PlayCircle className="w-3.5 h-3.5 inline mr-1" /> Resume
                </button>
              )}
              {execution?.status === 'failed' && (
                <button onClick={() => handleAction('retry')} className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-all">
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Retry Failed
                </button>
              )}
              <button onClick={() => handleAction('restart')} className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-all">
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Restart
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Node Results</h3>
          <div className="space-y-1">
            {nodeResults.map((nr, i) => {
              const resultStatus = EXECUTION_STATUSES.find(s => s.value === nr.status) || EXECUTION_STATUSES[0];
              const NodeIcon = getNodeType(nr.nodeId) || GitBranch;
              const nodeDuration = nr.duration
                ? nr.duration < 1000 ? `${nr.duration}ms` : `${(nr.duration / 1000).toFixed(1)}s`
                : null;

              return (
                <div
                  key={nr.nodeId}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                    nr.status === 'running' ? 'bg-blue-500/5' : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex-shrink-0">
                    <NodeIcon className={cn('w-4 h-4', resultStatus.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {getNodeName(nr.nodeId)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className={resultStatus.color}>{resultStatus.label}</span>
                      {nodeDuration && <span>{nodeDuration}</span>}
                      {nr.retryCount > 0 && <span>Retry #{nr.retryCount}</span>}
                    </div>
                  </div>
                  {nr.error && (
                    <span className="text-[10px] text-red-400 truncate max-w-[120px]" title={nr.error}>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {nr.error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {execution?.error?.message && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Error</span>
          </div>
          <p className="text-xs text-red-300">{execution.error.message}</p>
          {execution.error.nodeId && (
            <p className="text-[10px] text-red-400/60 mt-1">
              Failed at node: {getNodeName(execution.error.nodeId)}
            </p>
          )}
          {execution.error.stack && (
            <pre className="mt-2 text-[10px] text-red-400/40 overflow-x-auto">{execution.error.stack}</pre>
          )}
        </div>
      )}

      {execution?.variables && (
        <div className="rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Variables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['input', 'output', 'session', 'temporary'].map((scope) => {
              const vars = execution.variables[scope];
              const entries = vars ? Object.entries(vars) : [];
              if (entries.length === 0) return null;
              return (
                <div key={scope}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">{scope}</p>
                  <div className="space-y-1">
                    {entries.map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="text-foreground font-mono">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FlowExecutionDetailPage;
