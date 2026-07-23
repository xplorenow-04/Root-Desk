import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, AlertTriangle, FolderKanban, Layers, CheckSquare } from 'lucide-react';
import * as trashApi from '@/services/trashApi';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const TrashPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'nodes'

  // ConfirmDialog State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title, description, onConfirm) => {
    setConfirmConfig({
      isOpen: true,
      title,
      description,
      onConfirm,
    });
  };

  // Fetch trash items
  const { data: trash, isLoading, error, refetch } = useQuery({
    queryKey: ['trash'],
    queryFn: async () => {
      const response = await trashApi.getTrash();
      return response.data;
    },
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: ({ id, type }) => trashApi.restoreItem(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Permanent Delete Mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: ({ id, type }) => trashApi.permanentDelete(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Empty Trash Mutation
  const emptyTrashMutation = useMutation({
    mutationFn: trashApi.emptyTrash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleRestore = async (id, type) => {
    try {
      await restoreMutation.mutateAsync({ id, type });
    } catch (err) {
      console.error('Failed to restore item:', err);
    }
  };

  const handlePermanentDelete = (id, type, name) => {
    triggerConfirm(
      'Permanent Deletion',
      `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await permanentDeleteMutation.mutateAsync({ id, type });
        } catch (err) {
          console.error('Failed to permanently delete item:', err);
        }
      }
    );
  };

  const handleEmptyTrash = () => {
    triggerConfirm(
      'Empty All Trash',
      'Are you absolutely sure you want to empty the trash? All projects and task nodes in the trash will be permanently lost.',
      async () => {
        try {
          await emptyTrashMutation.mutateAsync();
        } catch (err) {
          console.error('Failed to empty trash:', err);
        }
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Opening the trash bin..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load trash items'} onRetry={refetch} />;
  }

  const projects = trash?.projects || [];
  const nodes = trash?.nodes || [];
  const hasItems = projects.length > 0 || nodes.length > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Trash"
          description="Recover deleted workspaces and nodes or erase them permanently."
        />
        {hasItems && (
          <button
            onClick={handleEmptyTrash}
            disabled={emptyTrashMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Warning Banner */}
      {hasItems && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-500/90 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 animate-pulse mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Attention</p>
            <p className="text-xs text-amber-500/80 leading-relaxed">
              Items in the trash will remain here indefinitely. Restoring a project automatically makes its associated nodes accessible. Restoring nested nodes will also recover their descendant trees.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border/20">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Projects ({projects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'nodes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Task Nodes ({nodes.length})</span>
        </button>
      </div>

      {/* Items Container */}
      <div className="min-h-[300px]">
        {activeTab === 'projects' ? (
          projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {projects.map((proj) => (
                  <motion.div
                    key={proj._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col justify-between rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm hover:border-border/60 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: proj.color || '#6366f1' }}
                        />
                        <h4 className="text-sm font-bold text-foreground truncate">{proj.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {proj.description || 'No description provided.'}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/60">
                        Deleted: {formatDate(proj.deletedAt)}
                      </p>
                    </div>

                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-border/20">
                      <button
                        onClick={() => handleRestore(proj._id, 'project')}
                        className="inline-flex items-center gap-1 rounded bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all cursor-pointer"
                        title="Restore Project"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(proj._id, 'project', proj.name)}
                        className="inline-flex items-center gap-1 rounded border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-all cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No deleted projects"
              description="Your deleted projects trash bin is currently empty."
            />
          )
        ) : (
          /* Task Nodes List */
          nodes.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Deleted Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-sm">
                  <AnimatePresence>
                    {nodes.map((node) => (
                      <motion.tr
                        key={node._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-foreground truncate max-w-xs">
                          {node.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-secondary/80 border border-border/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                            {node.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: node.projectId?.color || '#6366f1' }}
                            />
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {node.projectId?.name || 'Deleted Project'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground/80">
                          {formatDate(node.deletedAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleRestore(node._id, 'node')}
                              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
                              title="Restore Node"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(node._id, 'node', node.title)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-95 transition-all cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No deleted task nodes"
              description="Your deleted task nodes trash bin is currently empty."
            />
          )
        )}
      </div>

      {/* Custom Confirm Dialog Modal */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
      />
    </div>
  );
};

export default TrashPage;
