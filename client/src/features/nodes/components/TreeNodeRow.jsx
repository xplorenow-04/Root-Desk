import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Layers, Zap, CheckSquare, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALLOWED_CHILDREN, ALLOWED_CHILD_LABELS } from '@/constants/nodeTypes';

const TreeNodeRow = ({ node, depth = 0, onAddSubNode, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'module':
        return <Layers className="h-4 w-4 text-violet-500 shrink-0" />;
      case 'feature':
        return <Zap className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />;
      default:
        return <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const canHaveChildren = ALLOWED_CHILDREN[node.type] && ALLOWED_CHILDREN[node.type].length > 0;
  const childLabel = ALLOWED_CHILD_LABELS[node.type];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25';
      case 'cancelled':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20 line-through';
      case 'on-hold':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'in-progress':
        return 'bg-primary/10 text-primary border border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border border-border/50';
    }
  };

  return (
    <div className="w-full">
      {/* Node Entry Row */}
      <div
        className="flex items-center justify-between border-b border-border/25 py-2.5 hover:bg-muted/40 transition-colors duration-150 group"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {/* Left Side: Chevron, Type Icon, Title */}
        <div className="flex items-center gap-2 min-w-0 pr-4">
          {/* Collapse/Expand Toggle */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-transform"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-border/80 mx-auto" />
            )}
          </div>

          {/* Type Icon */}
          {getTypeIcon(node.type)}

          {/* Title and Labels */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate select-text">
              {node.title}
            </span>

            {/* Labels preview */}
            {node.labels && node.labels.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {node.labels.slice(0, 2).map((lbl) => (
                  <span
                    key={lbl}
                    className="rounded bg-secondary/50 border border-border/20 px-1.5 py-0.5 text-[9px] font-bold text-secondary-foreground uppercase tracking-wider"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Status, Priority, Date, Action Toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Due date if near */}
          {node.dueDate && (
            <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
              <Calendar className="h-3 w-3" />
              <span>{new Date(node.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {/* Priority */}
          {node.priority !== 'none' && (
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityStyle(node.priority)}`}>
              {node.priority}
            </span>
          )}

          {/* Status */}
          <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(node.status)}`}>
            {node.status === 'in-progress' ? 'In Progress' : node.status === 'in-review' ? 'In Review' : node.status === 'on-hold' ? 'On Hold' : node.status}
          </span>

          {/* Inline Action Buttons (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-l border-border/30 pl-2">
            {/* Add child */}
            {canHaveChildren && (
              <button
                onClick={() => onAddSubNode(node._id)}
                title={`Add ${childLabel}`}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer active:scale-90 transition-transform"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Edit */}
            <button
              onClick={() => onEdit(node)}
              title="Edit node"
              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer active:scale-90 transition-transform"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            {/* Delete */}
            <button
              onClick={() => onDelete(node._id)}
              title="Delete node"
              className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer active:scale-90 transition-transform"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recursive Children Rows */}
      {hasChildren && isExpanded && (
        <div className="w-full">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child._id}
              node={child}
              depth={depth + 1}
              onAddSubNode={onAddSubNode}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNodeRow;
