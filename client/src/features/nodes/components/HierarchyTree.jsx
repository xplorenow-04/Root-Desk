import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Layers, CheckCircle2, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useNodeTree, useNodeMutations } from '@/hooks/useNodes';
import TreeNodeRow from './TreeNodeRow';
import NodeDialog from './NodeDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';

const HierarchyTree = ({ projectId }) => {
  const { tree, flatNodes, isLoading, error, refetch } = useNodeTree(projectId);
  const { createNode, updateNode, deleteNode } = useNodeMutations(projectId);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeNode, setActiveNode] = useState(null); // null means creating
  const [defaultParentId, setDefaultParentId] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="Generating task hierarchy tree..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load task tree'} onRetry={refetch} />;
  }

  // Calculate Progress Stats
  const totalTasks = flatNodes.length;
  const completedTasks = flatNodes.filter((n) => n.status === 'completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this node and all of its nested children?')) {
      try {
        await deleteNode(id);
      } catch (err) {
        console.error('Failed to delete node:', err);
      }
    }
  };

  // Check if any filters are active
  const isFilteringActive =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  // Filter Flat List for Flat Search View
  const filteredFlatNodes = flatNodes.filter((node) => {
    const matchesSearch =
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.labels?.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()));

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
    return path.join(' > ');
  };

  return (
    <div className="space-y-6">
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

      {/* ── Toolbar: Search & Action Actions ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search hierarchy or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-10 text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-155"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted active:scale-95 transition-all cursor-pointer ${
              showFilters ? 'bg-sidebar-accent text-sidebar-accent-foreground border-primary/20' : 'text-foreground'
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

      {/* ── Advanced Filters Drawer ── */}
      {showFilters && (
        <div className="grid grid-cols-3 gap-4 p-4 border border-border/40 rounded-xl bg-card/25 animate-in fade-in duration-200">
          {/* Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="module">Module</option>
              <option value="feature">Feature</option>
              <option value="task">Task</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus:outline-none cursor-pointer"
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

      {/* ── Node Hierarchy List Frame ── */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 sm:p-5 backdrop-blur-sm min-h-[300px]">
        {flatNodes.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Tree is empty"
            description="Start building your nested workspace by creating a module, feature, or task."
            actionLabel="Add Module"
            onAction={() => handleAddClick(null)}
          />
        ) : isFilteringActive ? (
          /* Render search list flat view */
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground pb-2 border-b border-border/20">
              Search Results: Found {filteredFlatNodes.length} matching nodes
            </div>
            {filteredFlatNodes.length > 0 ? (
              <div className="divide-y divide-border/20">
                {filteredFlatNodes.map((node) => (
                  <div
                    key={node._id}
                    className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 rounded-lg transition-colors group"
                  >
                    <div className="min-w-0 pr-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {node.title}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary/80 text-secondary-foreground">
                          {node.type}
                        </span>
                      </div>
                      {node.parentId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>Path:</span>
                          <span className="font-mono truncate">{getParentPath(node)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(node)}
                        className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(node._id)}
                        className="p-1 rounded text-destructive/80 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
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
          /* Render beautiful tree hierarchy view */
          <div className="w-full overflow-x-auto scrollbar-none">
            <div className="min-w-[600px] divide-y divide-border/10">
              {tree.map((rootNode) => (
                <TreeNodeRow
                  key={rootNode._id}
                  node={rootNode}
                  depth={0}
                  onAddSubNode={handleAddClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
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
    </div>
  );
};

export default HierarchyTree;
