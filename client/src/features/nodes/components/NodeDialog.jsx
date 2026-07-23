import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Calendar, LayoutGrid } from 'lucide-react';
import { ALLOWED_CHILDREN } from '@/constants/nodeTypes';

const nodeFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be under 150 characters'),
  description: z.string().trim().max(1000, 'Description must be under 1000 characters').default(''),
  type: z.enum(['module', 'feature', 'task']).default('module'),
  status: z.enum(['todo', 'in-progress', 'in-review', 'on-hold', 'completed', 'cancelled', 'archived']).default('todo'),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).default('medium'),
  parentId: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
});

const NodeDialog = ({
  isOpen,
  onClose,
  onSubmit,
  node = null,
  flatNodes = [],
  defaultParentId = null,
  isSubmitting = false,
}) => {
  const [labels, setLabels] = useState([]);
  const [labelText, setLabelText] = useState('');

  // Determine which types are allowed for the current parent context
  const allowedTypes = useMemo(() => {
    if (!defaultParentId) return ['module'];
    const parentNode = flatNodes.find((n) => String(n._id) === String(defaultParentId));
    if (!parentNode) return ['module'];
    return ALLOWED_CHILDREN[parentNode.type] || [];
  }, [defaultParentId, flatNodes]);

  const defaultType = allowedTypes.length > 0 ? allowedTypes[0] : 'module';

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: defaultType,
      status: 'todo',
      priority: 'medium',
      parentId: null,
      dueDate: '',
    },
  });

  // Calculate eligible parent nodes to prevent circular referencing
  const eligibleParents = React.useMemo(() => {
    if (!node) return flatNodes;

    // Recursive helper to get all descendants of current node
    const getDescendantIds = (list, rootId) => {
      let ids = [String(rootId)];
      const children = list.filter((n) => String(n.parentId) === String(rootId));
      for (const child of children) {
        ids = [...ids, ...getDescendantIds(list, child._id)];
      }
      return ids;
    };

    const excludedIds = getDescendantIds(flatNodes, node._id);
    return flatNodes.filter((n) => !excludedIds.includes(String(n._id)));
  }, [flatNodes, node]);

  // Handle Form State Initialization
  useEffect(() => {
    if (isOpen) {
      if (node) {
        // Edit mode
        reset({
          title: node.title,
          description: node.description || '',
          type: node.type,
          status: node.status,
          priority: node.priority,
          parentId: node.parentId ? String(node.parentId) : '',
          dueDate: node.dueDate ? new Date(node.dueDate).toISOString().split('T')[0] : '',
        });
        setLabels(node.labels || []);
      } else {
        // Create mode
        reset({
          title: '',
          description: '',
          type: defaultType,
          status: 'todo',
          priority: 'medium',
          parentId: defaultParentId ? String(defaultParentId) : '',
          dueDate: '',
        });
        setLabels([]);
      }
    }
  }, [node, defaultParentId, reset, isOpen, defaultType]);

  const handleFormSubmit = async (data) => {
    const formatted = {
      ...data,
      parentId: data.parentId === '' ? null : data.parentId,
      dueDate: data.dueDate === '' ? null : data.dueDate,
      labels,
    };
    await onSubmit(formatted);
    reset();
    setLabels([]);
    onClose();
  };

  const handleAddLabel = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleaned = labelText.trim().toLowerCase();
      if (cleaned && !labels.includes(cleaned) && labels.length < 10) {
        setLabels([...labels, cleaned]);
        setLabelText('');
      }
    }
  };

  const handleRemoveLabel = (lbl) => {
    setLabels(labels.filter((l) => l !== lbl));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-2xl backdrop-blur-md flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/30 pb-4">
                <h2 className="text-xl font-bold text-foreground">
                  {node ? 'Edit Node' : 'Add Node'}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scroll Form Container */}
              <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-4 overflow-y-auto py-4 flex-1 scrollbar-none pr-1"
              >
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Node Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Implement user login API"
                    {...register('title')}
                    className={`flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-155 ${
                      errors.title ? 'border-destructive focus-visible:ring-destructive' : 'focus:border-primary/50'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about this task, feature or module..."
                    {...register('description')}
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary/50 transition-all duration-155 resize-none"
                  />
                  {errors.description && (
                    <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                  )}
                </div>

                {/* Type, Status, Priority row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Type
                    </label>
                    <select
                      {...register('type')}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all cursor-pointer"
                    >
                      {allowedTypes.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="in-review">In Review</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all cursor-pointer"
                    >
                      <option value="none">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Parent Node Selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Parent Node (Nesting)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <select
                      {...register('parentId')}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all cursor-pointer"
                    >
                      <option value="">None (Root Level Node)</option>
                      {eligibleParents.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.type.toUpperCase()}: {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Due Date
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155"
                    />
                  </div>
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/90">
                    Labels
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                      <Tag className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Add label and hit Enter..."
                      value={labelText}
                      onChange={(e) => setLabelText(e.target.value)}
                      onKeyDown={handleAddLabel}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155"
                    />
                  </div>

                  {/* Render label badges */}
                  {labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {labels.map((lbl) => (
                        <span
                          key={lbl}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary/80 border border-border/40 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                        >
                          <span>{lbl}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLabel(lbl)}
                            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground p-0.5 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Action Block */}
                <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : node ? 'Save Changes' : 'Add Node'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NodeDialog;
