import { Box, Puzzle, FileText, CheckSquare } from 'lucide-react';

/**
 * Node type definitions — single source of truth.
 * Hierarchy: module → feature → page → task.
 */
export const NODE_TYPES = [
  { value: 'module', label: 'Module', icon: Box, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', description: 'Top-level grouping' },
  { value: 'feature', label: 'Feature', icon: Puzzle, color: 'text-violet-500', bgColor: 'bg-violet-500/10', description: 'Feature within a module' },
  { value: 'page', label: 'Page', icon: FileText, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', description: 'Screen or page within a feature' },
  { value: 'task', label: 'Task', icon: CheckSquare, color: 'text-sky-500', bgColor: 'bg-sky-500/10', description: 'Actionable task' },
];

/**
 * Get a node type config by value.
 */
export function getNodeTypeConfig(value) {
  return NODE_TYPES.find((t) => t.value === value) || NODE_TYPES[0];
}

/**
 * Allowed children types per parent type.
 */
export const ALLOWED_CHILDREN = {
  module: ['module', 'feature'],
  feature: ['page'],
  page: ['task'],
  task: [],
};

export const ALLOWED_CHILD_LABELS = {
  module: 'Sub-Module / Feature',
  feature: 'Page',
  page: 'Task',
  task: null,
};
