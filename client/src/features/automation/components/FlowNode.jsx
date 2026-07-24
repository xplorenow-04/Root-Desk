import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_TYPES, hasInputHandle, hasOutputHandle, getSourceHandles } from '../../../constants/flowTypes';
import { Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Enhanced flow node component supporting 35+ node types.
 * Renders multiple source handles for decision/switch/loop nodes.
 * Shows execution status overlay, lock indicator, and type-specific badges.
 */
const FlowNode = ({ data, selected, id }) => {
  const nodeType = data?.nodeType || 'action';
  const typeConfig = NODE_TYPES[nodeType] || NODE_TYPES.action;
  const Icon = typeConfig?.icon;
  const isLocked = data?.locked;
  const executionStatus = data?.executionStatus; // 'running' | 'completed' | 'failed' | 'skipped'

  const showInput = hasInputHandle(nodeType);
  const showOutput = hasOutputHandle(nodeType);
  const sourceHandles = getSourceHandles(nodeType);

  // Execution status ring colors
  const execRingClass = executionStatus === 'running'
    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background animate-pulse'
    : executionStatus === 'completed'
      ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background'
      : executionStatus === 'failed'
        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background'
        : '';

  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-xl border-2 backdrop-blur-sm transition-all duration-200',
        typeConfig.borderColor,
        typeConfig.bgColor,
        selected && !executionStatus && 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-background shadow-lg shadow-indigo-500/20',
        execRingClass,
        isLocked && 'opacity-80',
        'hover:shadow-md',
      )}
    >
      {/* Input handle */}
      {showInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-indigo-500 !bg-background !shadow-sm"
        />
      )}

      {/* Output handles */}
      {showOutput && (
        <>
          {/* Decision/Condition nodes: Yes/No handles */}
          {(nodeType === 'decision' || nodeType === 'condition_expression') ? (
            <>
              <Handle
                type="source"
                position={Position.Right}
                id="yes"
                className="!w-3 !h-3 !border-2 !border-green-500 !bg-background !shadow-sm"
                style={{ top: '35%' }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id="no"
                className="!w-3 !h-3 !border-2 !border-red-500 !bg-background !shadow-sm"
                style={{ top: '65%' }}
              />
            </>
          ) : (nodeType === 'loop_foreach' || nodeType === 'loop_while' || nodeType === 'loop_repeat') ? (
            /* Loop nodes: body + done handles */
            <>
              <Handle
                type="source"
                position={Position.Right}
                id="loop_body"
                className="!w-3 !h-3 !border-2 !border-orange-500 !bg-background !shadow-sm"
                style={{ top: '35%' }}
              />
              <Handle
                type="source"
                position={Position.Right}
                id="done"
                className="!w-3 !h-3 !border-2 !border-green-500 !bg-background !shadow-sm"
                style={{ top: '65%' }}
              />
            </>
          ) : (
            /* Default single output handle */
            <Handle
              type="source"
              position={Position.Right}
              className="!w-3 !h-3 !border-2 !border-indigo-500 !bg-background !shadow-sm"
            />
          )}
        </>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-sm z-10">
          <Lock className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Execution status indicator */}
      {executionStatus && (
        <div className={cn(
          'absolute -top-1 -left-1 w-3 h-3 rounded-full z-10 border-2 border-background',
          executionStatus === 'running' && 'bg-blue-500 animate-pulse',
          executionStatus === 'completed' && 'bg-green-500',
          executionStatus === 'failed' && 'bg-red-500',
          executionStatus === 'skipped' && 'bg-slate-500',
        )} />
      )}

      {/* Main content */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', typeConfig.bgColor)}>
          {Icon && <Icon className="w-4 h-4" style={{ color: typeConfig.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {data?.label || typeConfig.label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {typeConfig.label}
          </p>
        </div>
      </div>

      {/* Decision node: Yes/No labels */}
      {(nodeType === 'decision' || nodeType === 'condition_expression') && (
        <div className="flex items-center justify-between px-4 pb-2 gap-2">
          <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Yes</span>
          <span className="text-[10px] font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded">No</span>
        </div>
      )}

      {/* Switch node: Cases */}
      {nodeType === 'condition_switch' && data?.config?.cases && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {data.config.cases.slice(0, 3).map((c, i) => (
            <span key={i} className="text-[10px] font-medium text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">
              {c.label || `Case ${i + 1}`}
            </span>
          ))}
          {data.config.cases.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{data.config.cases.length - 3}</span>
          )}
        </div>
      )}

      {/* Loop nodes: Loop/Done labels */}
      {(nodeType === 'loop_foreach' || nodeType === 'loop_while' || nodeType === 'loop_repeat') && (
        <div className="flex items-center justify-between px-4 pb-2 gap-2">
          <span className="text-[10px] font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">Loop</span>
          <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Done</span>
        </div>
      )}

      {/* Delay badge */}
      {nodeType === 'delay' && data?.config?.delay && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {data.config.delay} {data.config.delayUnit || 'seconds'}
          </span>
        </div>
      )}

      {/* Notification type badge */}
      {(nodeType === 'notification' || nodeType?.startsWith('notification_')) && data?.config?.notificationType && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {data.config.notificationType}
          </span>
        </div>
      )}

      {/* API badge */}
      {nodeType === 'api' && data?.config?.apiEndpoint && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded truncate block max-w-[140px]">
            {data.config.apiMethod || 'GET'} {data.config.apiEndpoint}
          </span>
        </div>
      )}

      {/* Auth role check badge */}
      {nodeType === 'auth_role_check' && data?.config?.allowedRoles?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {data.config.allowedRoles.map(role => (
            <span key={role} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {role}
            </span>
          ))}
        </div>
      )}

      {/* Page badge */}
      {nodeType === 'page' && data?.config?.page && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            → {data.config.page}
          </span>
        </div>
      )}

      {/* Data operation collection badge */}
      {nodeType?.startsWith('data_') && data?.config?.collection && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {data.config.collection}
          </span>
        </div>
      )}

      {/* Form field name badge */}
      {nodeType?.startsWith('form_') && data?.config?.fieldName && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            {data.config.fieldName}
          </span>
        </div>
      )}

      {/* End state message badge */}
      {nodeType === 'end_success' && data?.config?.message && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded truncate block max-w-[140px]">
            {data.config.message}
          </span>
        </div>
      )}
      {nodeType === 'end_failure' && data?.config?.errorMessage && (
        <div className="px-4 pb-2">
          <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded truncate block max-w-[140px]">
            {data.config.errorMessage}
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(FlowNode);
