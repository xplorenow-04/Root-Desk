import {
  Circle,
  Loader2,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Archive,
} from 'lucide-react';

/**
 * Node status configuration — single source of truth.
 * Used by tree rows, status dropdowns, filters, and dashboard stats.
 */
export const NODE_STATUSES = [
  { value: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-400', bgColor: 'bg-slate-400/10' },
  { value: 'in-progress', label: 'In Progress', icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'in-review', label: 'In Review', icon: PlayCircle, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { value: 'on-hold', label: 'On Hold', icon: PauseCircle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { value: 'archived', label: 'Archived', icon: Archive, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
];

/** Project status configuration */
export const PROJECT_STATUSES = [
  { value: 'active', label: 'Active', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { value: 'completed', label: 'Completed', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'archived', label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  { value: 'on-hold', label: 'On Hold', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
];

/**
 * Get a status config by value.
 */
export function getStatusConfig(value, type = 'node') {
  const list = type === 'project' ? PROJECT_STATUSES : NODE_STATUSES;
  return list.find((s) => s.value === value) || list[0];
}
