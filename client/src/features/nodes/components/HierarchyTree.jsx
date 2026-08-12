import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Layers, CheckCircle2, SlidersHorizontal, X, Calendar, GitBranch } from 'lucide-react';
import { useNodeTree, useNodeMutations } from '@/hooks/useNodes';
import { useWorkflowLinks } from '@/features/automation/hooks/useWorkflowLinks';
import { ALLOWED_CHILDREN, getNodeTypeConfig } from '@/constants/nodeTypes';
import TreeNodeRow from './TreeNodeRow';
import NodeDialog from './NodeDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';

const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const HierarchyTree = ({ projectId }) => {
  const { tree, flatNodes, isLoading, error, refetch } = useNodeTree(projectId);
  const { createNode, updateNode, deleteNode } = useNodeMutations(projectId);

  // Fetch all workflow links once (shared across all NodeFlowLink instances)
  const { data: workflowLinksData } = useWorkflowLinks({ limit: 1000 });
  const allLinks = workflowLinksData?.links || [];
  const linkedFlowMap = useMemo(() => {
    const map = {};
    for (const link of allLinks) {
      if (link.targetType && link.targetId) {
        map[`${link.targetType}:${link.targetId}`] = link;
      }
    }
    return map;
  }, [allLinks]);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeNode, setActiveNode] = useState(null); // null means creating
  const [defaultParentId, setDefaultParentId] = useState(null);

  // Confirm delete dialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Drag & Drop states
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { id, position }

  const dragNode = useMemo(
    () => flatNodes.find((n) => String(n._id) === String(dragId)),
    [flatNodes, dragId]
  );

  // ── Per-node progress (recursive descendants) ──
  const progressMap = useMemo(() => {
    const counts = {};
    const buildCounts = (node) => {
      let total = 1;
      let completed = node.status === 'completed' ? 1 : 0;
      for (const child of node.children || []) {
        const childCounts = buildCounts(child);
        total += childCounts.total;
        completed += childCounts.completed;
      }
      counts[node._id] = { total, completed, percent: Math.round((completed / total) * 100) };
      return counts[node._id];
    };
    for (const root of tree) buildCounts(root);
    return counts;
  }, [tree]);

  // ── Drag & Drop helpers ──
  const isDescendant = useMemo(
    () => (ancestorId, nodeId) => {
      let current = flatNodes.find((n) => String(n._id) === String(nodeId));
      while (current && current.parentId) {
        if (String(current.parentId) === String(ancestorId)) return true;
        current = flatNodes.find((n) => String(n._id) === String(current.parentId));
      }
      return false;
    },
    [flatNodes]
  );

  if (isLoading) {
    return <LoadingSpinner message="Generating task hierarchy tree..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load task tree'} onRetry={refetch} />;
  }

  // ── Progress stats (workspace-wide) ──
  const totalTasks = flatNodes.length;
  const completedTasks = flatNodes.filter((n) => n.status === 'completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const computeDropPosition = (e, target) => {
    if (!dragNode || String(dragNode._id) === String(target._id)) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;

    const canInside =
      (ALLOWED_CHILDREN[target.type] || []).includes(dragNode.type) &&
      !isDescendant(dragNode._id, target._id);

    const targetParent = flatNodes.find((n) => String(n._id) === String(target.parentId));
    const canSibling = target.parentId
      ? (ALLOWED_CHILDREN[targetParent?.type] || []).includes(dragNode.type)
      : dragNode.type === 'module';

    if (y < 0.3 && canSibling) return 'before';
    if (y > 0.7 && canSibling) return 'after';
    if (canInside) return 'inside';
    if (canSibling) return y < 0.5 ? 'before' : 'after';
    return null;
  };

  const handleDragStartRow = (e, node) => {
    if (e.target.closest('button, a, input, select, textarea')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node._id);
    setDragId(node._id);
  };

  const handleDragOverRow = (e, node) => {
    e.preventDefault();
    const position = computeDropPosition(e, node);
    setDropTarget(position ? { id: node._id, position } : null);
  };

  const resetDrag = () => {
    setDragId(null);
    setDropTarget(null);
  };

  const performMove = async (target, position) => {
    if (!dragNode || String(target._id) === String(dragNode._id)) return;

    let newParentId;
    let siblings;

    if (position === 'inside') {
      // Drop as a child of the target (appended at the end)
      if (String(dragNode.parentId || '') === String(target._id)) return;
      newParentId = target._id;
      siblings = flatNodes
        .filter((n) => String(n.parentId || '') === String(target._id))
        .filter((n) => String(n._id) !== String(dragNode._id));
      siblings.push(dragNode);
    } else {
      // Drop before/after the target within its own sibling group
      newParentId = target.parentId || null;
      siblings = flatNodes.filter((n) => String(n.parentId || '') === String(newParentId || ''));
      const withoutDrag = siblings.filter((n) => String(n._id) !== String(dragNode._id));
      const idx = withoutDrag.findIndex((n) => String(n._id) === String(target._id));
      withoutDrag.splice(idx + (position === 'after' ? 1 : 0), 0, dragNode);
      siblings = withoutDrag;
    }

    const patches = [];
    siblings.forEach((n, i) => {
      const isDragged = String(n._id) === String(dragNode._id);
      const newOrder = i;
      const newParent = isDragged ? (newParentId ? String(newParentId) : null) : n.parentId ? String(n.parentId) : null;
      const oldOrder = n.order || 0;
      const oldParent = n.parentId ? String(n.parentId) : null;
      if (newOrder !== oldOrder || newParent !== oldParent) {
        const data = {};
        if (newOrder !== oldOrder) data.order = newOrder;
        if (newParent !== oldParent) data.parentId = newParent;
        patches.push({ id: n._id, data });
      }
    });

    if (patches.length === 0) return;
    try {
      for (const patch of patches) {
        await updateNode(patch);
      }
    } catch (err) {
      console.error('Failed to reorder node:', err);
    }
  };

  const handleDropRow = async (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    const position = computeDropPosition(e, node);
    if (dragNode && position) {
      await performMove(node, position);
    }
    resetDrag();
  };

  const handleDragEndRow = () => resetDrag();

  const dndProps = {
    draggingId: dragId,
    dropTargetId: dropTarget?.id,
    dropPosition: dropTarget?.position,
    onDragStartRow: handleDragStartRow,
    onDragOverRow: handleDragOverRow,
    onDropRow: handleDropRow,
    onDragEndRow: handleDragEndRow,
  };

  const handleAddClick = (parentId = null) => {
    setActiveNode(null);
    setDefaultParentId(parentId);
    setIsDialogOpen(true);
  };

  const handleEditClick = (node) => {
    setActiveNode(node);
    setDefaultParentId(null);
    setIsDialogOpen(true);
  };

  const handleToggleDone = async (node) => {
    const nextStatus = node.status === 'completed' ? 'todo' : 'completed';
    try {
      await updateNode({ id: node._id, data: { status: nextStatus } });
    } catch (err) {
      console.error('Failed to toggle node status:', err);
    }
  };

  const handleDialogSubmit = async (formData) => {
    try {
      if (activeNode) {
        await updateNode({ id: activeNode._id, data: formData });
      } else {
        await createNode({ ...formData, projectId });
      }
    } catch (err) {
      console.error('Failed to save node:', err);
    }
  };

  const handleDeleteClick = (id) => {
    setNodeToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (nodeToDelete) {
      try {
        await deleteNode(nodeToDelete);
      } catch (err) {
        console.error('Failed to delete node:', err);
      } finally {
        setNodeToDelete(null);
      }
    }
  };

  // Check if any filters are active
  const isFilteringActive =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  // Enhanced search matching (title, description, labels, status, priority, assignee, type)
  const filteredFlatNodes = flatNodes.filter((node) => {
    const q = normalize(searchQuery);
    const matchesSearch = (() => {
      if (!q) return true;
      const fields = [node.title, node.description, node.type, node.status, node.priority];
      if (fields.some((v) => normalize(v).includes(q))) return true;
      if ((node.labels || []).some((l) => normalize(l).includes(q))) return true;
      if (node.assignee) {
        const assigneeText =
          typeof node.assignee === 'object'
            ? `${node.assignee.name || ''} ${node.assignee.email || ''}`
            : String(node.assignee);
        if (normalize(assigneeText).includes(q)) return true;
      }
      const qNoSpace = q.replace(/\s+/g, '');
      if (normalize(node.status).replace(/-/g, '').includes(qNoSpace)) return true;
      if (normalize(node.priority).replace(/-/g, '').includes(qNoSpace)) return true;
      return false;
    })();

    const matchesType = typeFilter === 'all' || node.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || node.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Helper to trace parent path for search results list view
  const getParentPath = (node) => {
    const path = [];
    let parentId = node.parentId;
    while (parentId) {
      const parent = flatNodes.find((n) => String(n._id) === String(parentId));
      if (parent) {
        path.unshift(parent.title);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    return path.join(' › ');
  };

  const renderTypeBadge = (node) => {
    const config = getNodeTypeConfig(node.type);
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.bgColor} ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Sticky Toolbar: Search & Actions ── */}
      <div className="sticky top-0 z-20 rounded-xl border border-border/40 bg-background/85 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search title, labels, status, priority, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-2 pl-10 text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/40 transition-all duration-155"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold hover:bg-muted active:scale-95 transition-all cursor-pointer ${
                showFilters
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-primary/20'
                  : 'text-foreground border-border'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => handleAddClick(null)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Module</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 mt-3 border-t border-border/20 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background/60 px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="module">Module</option>
                <option value="feature">Feature</option>
                <option value="page">Page</option>
                <option value="task">Task</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background/60 px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background/60 px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Progress Stats Bar ── */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 sm:p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Workspace Completion</span>
          </div>
          <span className="text-sm font-mono font-bold text-primary">
            {completedTasks}/{totalTasks} Nodes ({progressPercentage}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"
          />
        </div>
      </div>

      {/* ── Node Hierarchy List Frame ── */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 sm:p-5 backdrop-blur-sm min-h-[300px]">
        {flatNodes.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Tree is empty"
            description="Start building your nested workspace by creating a module, feature, page, or task."
            actionLabel="Add Module"
            onAction={() => handleAddClick(null)}
          />
        ) : isFilteringActive ? (
          /* Render search list flat view */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <span className="text-xs font-semibold text-muted-foreground">
                Search Results: Found {filteredFlatNodes.length} matching nodes
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
            {filteredFlatNodes.length > 0 ? (
              <div className="divide-y divide-border/20">
                {filteredFlatNodes.map((node) => (
                  <div
                    key={node._id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors group"
                  >
                    <div className="min-w-0 pr-2 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">{node.title}</span>
                        {renderTypeBadge(node)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-px text-[9px] font-semibold ${
                            node.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : node.status === 'in-progress'
                              ? 'bg-primary/10 text-primary'
                              : node.status === 'on-hold'
                              ? 'bg-amber-500/10 text-amber-500'
                              : node.status === 'in-review'
                              ? 'bg-violet-500/10 text-violet-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {node.status.replace(/-/g, ' ')}
                        </span>
                        {node.priority !== 'none' && (
                          <span className="rounded px-1.5 py-px bg-secondary/60 text-secondary-foreground font-semibold uppercase">
                            {node.priority}
                          </span>
                        )}
                        {node.assignee && typeof node.assignee === 'object' && node.assignee.name && (
                          <span>Assigned to {node.assignee.name}</span>
                        )}
                        {node.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(node.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {node.parentId && (
                          <span className="font-mono truncate text-muted-foreground/70">Path: {getParentPath(node)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(node)}
                        className="px-2 py-1 rounded text-[10px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(node._id)}
                        className="px-2 py-1 rounded text-[10px] font-bold text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No nodes match the active search filters.
              </div>
            )}
          </div>
        ) : (
          /* Render tree hierarchy view */
          <div className="w-full overflow-x-auto scrollbar-none">
            <div className="space-y-0">
              {tree.map((rootNode) => (
                <TreeNodeRow
                  key={rootNode._id}
                  node={rootNode}
                  depth={0}
                  onAddSubNode={handleAddClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onToggleDone={handleToggleDone}
                  linkedFlowMap={linkedFlowMap}
                  progressMap={progressMap}
                  dnd={dndProps}
                />
              ))}
            </div>
            {flatNodes.length > 0 && dragNode && (
              <p className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                <GitBranch className="h-3 w-3" />
                Drag rows to reorder or re-parent. Drop on the middle of a row to nest it inside.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Form Dialog Modals ── */}
      <NodeDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        node={activeNode}
        flatNodes={flatNodes}
        defaultParentId={defaultParentId}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setNodeToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Node"
        description="Are you sure you want to delete this node and all of its nested children? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

export default HierarchyTree;
