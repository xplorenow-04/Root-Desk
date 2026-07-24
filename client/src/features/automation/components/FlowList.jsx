import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Workflow, MoreHorizontal, Play, Copy, Archive, Download, Trash2,
  ExternalLink, Clock, User, Tag,
} from 'lucide-react';
import { FLOW_STATUSES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import EmptyState from '../../../components/shared/EmptyState';

const FlowList = ({
  flows,
  isLoading,
  onRun,
  onDuplicate,
  onArchive,
  onExport,
  onDelete,
  pagination,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  if (isLoading) return <LoadingSpinner />;

  if (!flows || flows.length === 0) {
    return (
      <EmptyState
        icon={Workflow}
        title="No flows found"
        description="Create your first automation flow to get started."
      />
    );
  }

  const handleMenuToggle = (e, id) => {
    e.stopPropagation();
    setOpenMenu(openMenu === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {flows.map((flow) => {
        const statusConfig = FLOW_STATUSES.find(s => s.value === flow.status) || FLOW_STATUSES[0];
        const status = statusConfig;

        return (
          <div
            key={flow._id}
            onClick={() => navigate(`/automation/flows/${flow._id}`)}
            className="group relative rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-4 hover:bg-card/60 hover:border-indigo-500/30 transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  status.bgColor
                )}>
                  <Workflow className={cn('w-5 h-5', status.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {flow.name}
                    </h3>
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                      status.bgColor,
                      status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                  {flow.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {flow.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {flow.createdBy?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(flow.updatedAt || flow.createdAt), { addSuffix: true })}
                    </span>
                    {flow.nodeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Workflow className="w-3 h-3" />
                        {flow.nodeCount} nodes
                      </span>
                    )}
                    {flow.tags?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {flow.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => handleMenuToggle(e, flow._id)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {openMenu === flow._id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-50 py-1">
                    {flow.status === 'active' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRun(flow._id); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" /> Run Flow
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/automation/flows/${flow._id}`); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Editor
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicate(flow._id); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchive(flow._id); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all"
                    >
                      <Archive className="w-3.5 h-3.5" /> {flow.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onExport(flow._id); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <div className="border-t border-border/40 my-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(flow._id); setOpenMenu(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                pagination.page === i + 1
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowList;
