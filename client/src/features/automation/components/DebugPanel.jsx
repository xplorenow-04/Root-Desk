import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bug, Play, Pause, SkipForward, Variable, Clock, Terminal, CheckCircle2,
  XCircle, Loader2, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { NODE_TYPES, EXECUTION_STATUSES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { useState } from 'react';

/**
 * Debug panel for step-by-step flow execution viewing.
 * Shows execution timeline, variable inspector, and console output.
 */
const DebugPanel = ({
  execution,
  nodes = [],
  onStepForward,
  onPause,
  onResume,
  onRestart,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState('timeline');
  const status = execution?.status || 'pending';
  const nodeResults = execution?.nodeResults || [];
  const variables = execution?.variables || {};

  const statusConfig = EXECUTION_STATUSES.find(s => s.value === status);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'running': return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'paused': return <Pause className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    }
  }, [status]);

  const Section = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={cn(
        'flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-all border-b-2',
        activeSection === id
          ? 'border-indigo-500 text-indigo-400'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );

  const NodeResultItem = ({ result, index }) => {
    const [expanded, setExpanded] = useState(false);
    const node = nodes.find(n => n.id === result.nodeId?.toString() || n._id === result.nodeId?.toString());
    const nodeType = node?.data?.nodeType || node?.type;
    const typeConfig = NODE_TYPES[nodeType];

    const resultStatus = result.status || 'pending';
    const resultStatusColors = {
      pending: 'text-yellow-500 bg-yellow-500/10',
      running: 'text-blue-500 bg-blue-500/10',
      completed: 'text-green-500 bg-green-500/10',
      failed: 'text-red-500 bg-red-500/10',
      skipped: 'text-slate-500 bg-slate-500/10',
    };

    return (
      <div className="border border-border/30 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          <span className="text-[10px] text-muted-foreground w-5">{index + 1}</span>
          {typeConfig?.icon && <typeConfig.icon className="w-3 h-3" style={{ color: typeConfig.color }} />}
          <span className="text-xs text-foreground flex-1 truncate">{node?.data?.label || node?.label || 'Node'}</span>
          <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', resultStatusColors[resultStatus])}>
            {resultStatus}
          </span>
        </button>
        {expanded && (
          <div className="px-3 py-2 bg-muted/20 space-y-1.5 border-t border-border/20">
            {result.startedAt && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Started</span>
                <span className="text-foreground">{new Date(result.startedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {result.completedAt && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-foreground">{new Date(result.completedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {result.duration != null && (
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground">{result.duration}ms</span>
              </div>
            )}
            {result.error && (
              <div className="mt-1 p-2 rounded bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] text-red-400 font-mono">{result.error}</p>
              </div>
            )}
            {result.output && (
              <div className="mt-1">
                <p className="text-[10px] text-muted-foreground mb-1">Output</p>
                <pre className="text-[10px] text-foreground bg-muted/50 p-2 rounded font-mono overflow-x-auto max-h-[100px]">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const VariableSection = ({ title, vars }) => {
    if (!vars || (typeof vars === 'object' && Object.keys(vars).length === 0)) return null;

    const entries = vars instanceof Map ? [...vars.entries()] : Object.entries(vars);
    if (entries.length === 0) return null;

    return (
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-[10px] bg-muted/30 px-2 py-1.5 rounded">
              <span className="text-indigo-400 font-mono font-medium shrink-0">{key}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-foreground font-mono break-all">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bug className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No execution data</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Run the flow to see debug information</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20">
        {statusIcon}
        <span className={cn('text-xs font-medium', statusConfig?.color)}>
          {statusConfig?.label || status}
        </span>
        {execution.duration != null && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {(execution.duration / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40">
        {status === 'running' ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-[10px] font-medium transition-all"
          >
            <Pause className="w-3 h-3" /> Pause
          </button>
        ) : status === 'paused' ? (
          <button
            onClick={onResume}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-[10px] font-medium transition-all"
          >
            <Play className="w-3 h-3" /> Resume
          </button>
        ) : null}
        {(status === 'running' || status === 'paused') && (
          <button
            onClick={onStepForward}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-medium transition-all"
          >
            <SkipForward className="w-3 h-3" /> Step
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border/40">
        <Section id="timeline" label="Timeline" icon={Clock} />
        <Section id="variables" label="Variables" icon={Variable} />
        <Section id="console" label="Console" icon={Terminal} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeSection === 'timeline' && (
          <>
            {nodeResults.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No node results yet</p>
            ) : (
              nodeResults.map((result, i) => (
                <NodeResultItem key={result.nodeId?.toString() || i} result={result} index={i} />
              ))
            )}
          </>
        )}

        {activeSection === 'variables' && (
          <div className="space-y-4">
            <VariableSection title="Input" vars={variables.input} />
            <VariableSection title="Output" vars={variables.output} />
            <VariableSection title="Session" vars={variables.session} />
            <VariableSection title="Temporary" vars={variables.temporary} />
            {!variables.input && !variables.output && !variables.session && !variables.temporary && (
              <p className="text-xs text-muted-foreground text-center py-4">No variables</p>
            )}
          </div>
        )}

        {activeSection === 'console' && (
          <div className="font-mono text-[10px] space-y-1">
            {execution.startedAt && (
              <p className="text-green-400">[{new Date(execution.startedAt).toLocaleTimeString()}] Execution started</p>
            )}
            {nodeResults.filter(r => r.status !== 'pending').map((result, i) => {
              const node = nodes.find(n => n.id === result.nodeId?.toString() || n._id === result.nodeId?.toString());
              return (
                <p key={i} className={cn(
                  result.status === 'completed' ? 'text-green-400' :
                  result.status === 'failed' ? 'text-red-400' :
                  result.status === 'running' ? 'text-blue-400' :
                  'text-muted-foreground'
                )}>
                  [{result.startedAt ? new Date(result.startedAt).toLocaleTimeString() : '--:--:--'}] {node?.data?.label || node?.label || 'Node'} → {result.status}
                  {result.error && ` (${result.error})`}
                </p>
              );
            })}
            {execution.completedAt && (
              <p className={cn(
                execution.status === 'completed' ? 'text-green-400' :
                execution.status === 'failed' ? 'text-red-400' :
                'text-slate-400'
              )}>
                [{new Date(execution.completedAt).toLocaleTimeString()}] Execution {execution.status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(DebugPanel);
