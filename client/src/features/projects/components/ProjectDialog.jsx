import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Tag } from 'lucide-react';
import { getAvailableIcons } from '@/lib/icons';
import DynamicIcon from '@/components/shared/DynamicIcon';

const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().trim().max(500, 'Description must be under 500 characters').default(''),
  status: z.enum(['active', 'completed', 'archived', 'on-hold']).default('active'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code').default('#6366f1'),
  icon: z.string().default('Folder'),
});

const PRESET_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Slate', hex: '#64748b' },
];

const ProjectDialog = ({ isOpen, onClose, onSubmit, project = null, isSubmitting = false }) => {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const availableIcons = getAvailableIcons();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      color: '#6366f1',
      icon: 'Folder',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  // Load project details if editing
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        color: project.color,
        icon: project.icon,
      });
      setTags(project.tags || []);
    } else {
      reset({
        name: '',
        description: '',
        status: 'active',
        color: '#6366f1',
        icon: 'Folder',
      });
      setTags([]);
    }
  }, [project, reset, isOpen]);

  const handleFormSubmit = async (data) => {
    await onSubmit({
      ...data,
      tags,
    });
    reset();
    setTags([]);
    onClose();
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase();
      if (cleaned && !tags.includes(cleaned) && tags.length < 10) {
        setTags([...tags, cleaned]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
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

          {/* Dialog Body */}
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
                  {project ? 'Edit Project' : 'New Project'}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Scroll Container */}
              <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-5 overflow-y-auto py-4 flex-1 scrollbar-none pr-1"
              >
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Website Redesign"
                    {...register('name')}
                    className={`flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-155 ${
                      errors.name ? 'border-destructive focus-visible:ring-destructive' : 'focus:border-primary/50'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/90">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief summary of the workspace..."
                    {...register('description')}
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary/50 transition-all duration-155 resize-none"
                  />
                  {errors.description && (
                    <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                  )}
                </div>

                {/* Status (Only when editing) */}
                {project && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/90">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155 cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                )}

                {/* Color Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/90">
                    Theme Color
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setValue('color', c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className="group relative flex h-7 w-7 items-center justify-center rounded-full hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                      >
                        {selectedColor === c.hex && (
                          <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                        )}
                        <span className="absolute bottom-8 scale-0 group-hover:scale-100 rounded bg-popover border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-popover-foreground shadow-md transition-all origin-bottom whitespace-nowrap">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/90">
                    Project Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2 border border-border/40 rounded-xl bg-background/30 p-2.5 max-h-[140px] overflow-y-auto scrollbar-none">
                    {availableIcons.map(({ name }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setValue('icon', name)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted border hover:text-foreground active:scale-95 transition-all cursor-pointer ${
                          selectedIcon === name
                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                            : 'border-transparent text-muted-foreground'
                        }`}
                        title={name}
                      >
                        <DynamicIcon name={name} className="h-4.5 w-4.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/90">
                    Tags
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                      <Tag className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Add tag and hit Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155"
                    />
                  </div>

                  {/* Render tag list */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary/80 border border-border/40 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
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
                    {isSubmitting ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
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

export default ProjectDialog;
