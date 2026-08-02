import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Calendar, Clock, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ALLOWED_CHILDREN, ALLOWED_CHILD_LABELS, getNodeTypeConfig } from '@/constants/nodeTypes';
import NodeFlowLink from './NodeFlowLink';
import { getIcon } from '@/lib/icons';

const INDENT = 26;

const STATUS_META = {
  todo: { label: 'To Do', dot: 'bg-muted-foreground', cls: 'bg-muted text-muted-foreground' },
  'in-progress': { label: 'In Progress', dot: 'bg-primary', cls: 'bg-primary/10 text-primary' },
  'in-review': { label: 'In Review', dot: 'bg-violet-500', cls: 'bg-violet-500/10 text-violet-500' },
  'on-hold': { label: 'On Hold', dot: 'bg-amber-500', cls: 'bg-amber-500/10 text-amber-500' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', cls: 'bg-emerald-500/10 text-emerald-500' },
  cancelled: { label: 'Cancelled', dot: 'bg-slate-500', cls: 'bg-slate-500/10 text-slate-400 line-through' },
  archived: { label: 'Archived', dot: 'bg-slate-500', cls: 'bg-slate-500/10 text-slate-400' },
};

const PRIORITY_META = {
  critical: { label: 'Critical', cls: 'bg-red-500/10 text-red-400' },
  high: { label: 'High', cls: 'bg-orange-500/10 text-orange-400' },
  medium: { label: 'Medium', cls: 'bg-amber-500/10 text-amber-400' },
  low: { label: 'Low', cls: 'bg-sky-500/10 text-sky-400' },
  none: { label: 'None', cls: 'bg-slate-500/10 text-slate-400' },
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-violet-500', 'bg-lime-600', 'bg-sky-600',
];

const getAvatarColor = (name = '') => {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getAssigneeName = (assignee) => {
  if (!assignee) return null;
  if (typeof assignee === 'object') return assignee.name || assignee.email || 'Unnamed';
  return null;
};

const TreeNodeRow = ({
  node,
  depth = 0,
  onAddSubNode,
  onEdit,
  onDelete,
  onToggleDone,
  linkedFlowMap = {},
  progressMap = {},
  dnd = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const {
    draggingId,
    dropTargetId,
    dropPosition,
    onDragStartRow,
    onDragOverRow,
    onDropRow,
    onDragEndRow,
  } = dnd;

  const typeConfig = getNodeTypeConfig(node.type);
  const isDragged = draggingId === node._id;
  const isDropInside = dropTargetId === node._id && dropPosition === 'inside';

  const renderNodeIcon = () => {
    if (node.icon) {
      const IconComponent = getIcon(node.icon);
      if (IconComponent) {
        return (
          <IconComponent
            className={`h-4 w-4 shrink-0 ${typeConfig.color}`}
            style={{ color: node.iconColor || undefined }}
          />
        );
      }
    }
    const DefaultIcon = typeConfig.icon;
    return <DefaultIcon className={`h-4 w-4 shrink-0 ${typeConfig.color}`} />;
  };

  const canHaveChildren = ALLOWED_CHILDREN[node.type] && ALLOWED_CHILDREN[node.type].length > 0;
  const childLabel = ALLOWED_CHILD_LABELS[node.type];

  const status = STATUS_META[node.status] || STATUS_META.todo;
  const priority = PRIORITY_META[node.priority] || PRIORITY_META.none;
  const assigneeName = getAssigneeName(node.assignee);
  const progress = progressMap[node._id];
  const isDone = node.status === 'completed';
  const showToggle = node.status === 'todo' || node.status === 'completed';
  const isOverdue =
    node.dueDate && node.status !== 'completed' && node.status !== 'cancelled' && new Date(node.dueDate) < new Date();

  return (
    <div className="w-full">
      {/* Node Entry Row */}
      <div
        draggable
        onDragStart={(e) => onDragStartRow?.(e, node)}
        onDragOver={(e) => onDragOverRow?.(e, node)}
        onDrop={(e) => onDropRow?.(e, node)}
        onDragEnd={onDragEndRow}
        className={`group relative flex items-start gap-2 rounded-xl px-2 py-2 cursor-grab active:cursor-grabbing transition-all duration-150 ${
          node.type === 'module'
            ? 'bg-card/70 border border-border/40 shadow-sm hover:border-border/70'
            : 'hover:bg-muted/40'
        } ${isDragged ? 'opacity-40' : ''} ${
          isDropInside ? 'ring-2 ring-primary/40 bg-primary/5' : ''
        }`}
        style={{ marginLeft: 14 }}
      >
        {/* Drop indicator lines */}
        {dropTargetId === node._id && dropPosition === 'before' && (
          <div className="absolute -top-[2px] inset-x-2 h-[2px] rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
        )}
        {dropTargetId === node._id && dropPosition === 'after' && (
          <div className="absolute -bottom-[2px] inset-x-2 h-[2px] rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
        )}

        {/* Horizontal tree connector */}
        {depth > 0 && (
          <div
            className="absolute top-[18px] h-px w-[14px] bg-border/50"
            style={{ left: -14 }}
          />
        )}

        {/* Drag handle */}
        <div className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Collapse / Expand toggle */}
        <div className="flex w-4 items-center justify-center pt-0.5 shrink-0">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-transform duration-150"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-border/70 mt-1" />
          )}
        </div>

        {/* Type Icon */}
        <div className="mt-[2px] flex h-4 w-4 items-center justify-center shrink-0">{renderNodeIcon()}</div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title line */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Done / Todo toggle */}
            {showToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone?.(node);
                }}
                title={isDone ? 'Mark as to do' : 'Mark as completed'}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150 cursor-pointer active:scale-90 ${
                  isDone
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.25)]'
                    : 'border-border/60 bg-background/40 text-transparent hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <Check className={`h-3 w-3 ${isDone ? 'animate-in fade-in zoom-in-75 duration-150' : 'opacity-0'}`} />
              </button>
            )}

            <span
              className={`text-sm font-semibold truncate select-text transition-colors duration-150 ${
                isDone ? 'text-muted-foreground/70 line-through decoration-muted-foreground/50' : 'text-foreground'
              }`}
            >
              {node.title}
            </span>

            {hasChildren && (
              <span className="shrink-0 rounded-md bg-secondary/70 border border-border/40 px-1.5 py-px text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
              </span>
            )}

            {node.labels && node.labels.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {node.labels.slice(0, 2).map((lbl) => (
                  <span
                    key={lbl}
                    className="rounded bg-secondary/50 border border-border/20 px-1.5 py-px text-[9px] font-bold text-secondary-foreground uppercase tracking-wider"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Metadata line */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[10px] font-semibold ${status.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>

            {node.priority && node.priority !== 'none' && (
              <span className={`rounded-md px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${priority.cls}`}>
                {priority.label}
              </span>
            )}

            {node.dueDate && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[10px] font-semibold ${
                isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-secondary/50 text-muted-foreground'
              }`}>
                <Calendar className="h-3 w-3" />
                {new Date(node.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}

            {node.assignee && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/60 border border-border/40 py-px pl-0.5 pr-1.5 text-[10px] font-semibold text-foreground/80">
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white ${getAvatarColor(assigneeName)}`}>
                  {assigneeName ? assigneeName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
                </span>
                {assigneeName}
              </span>
            )}

            {node.updatedAt && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(node.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Progress bar for structural nodes */}
          {node.type !== 'task' && progress && progress.total > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 w-28 overflow-hidden rounded-full bg-secondary/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`h-full rounded-full ${progress.percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground">
                {progress.completed}/{progress.total} done
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Flow link + actions */}
        <div className="flex items-center gap-1 shrink-0">
          {(node.type === 'module' || node.type === 'feature' || node.type === 'page') && (
            <NodeFlowLink nodeId={node._id} nodeType={node.type} linkedFlow={linkedFlowMap[`${node.type}:${node._id}`]} />
          )}

          <div className="flex items-center gap-0.5 border-l border-border/30 pl-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
            {canHaveChildren && (
              <button
                onClick={() => onAddSubNode(node._id)}
                title={`Add ${childLabel}`}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer active:scale-90 transition-transform"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onEdit(node)}
              title="Edit node"
              className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer active:scale-90 transition-transform"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(node._id)}
              title="Delete node"
              className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer active:scale-90 transition-transform"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recursive Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            key={`children-${node._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="relative overflow-hidden"
            style={{ marginLeft: INDENT }}
          >
            {/* Vertical tree connector */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40" />

            <div className="py-0.5 pl-0">
              {node.children.map((child) => (
                <TreeNodeRow
                  key={child._id}
                  node={child}
                  depth={depth + 1}
                  onAddSubNode={onAddSubNode}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleDone={onToggleDone}
                  linkedFlowMap={linkedFlowMap}
                  progressMap={progressMap}
                  dnd={dnd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreeNodeRow;
