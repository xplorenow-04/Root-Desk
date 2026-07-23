import {
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Circle,
} from 'lucide-react';

/**
 * Node priority configuration — single source of truth.
 */
export const NODE_PRIORITIES = [
  { value: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { value: 'medium', label: 'Medium', icon: Minus, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'none', label: 'None', icon: Circle, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
];

/**
 * Get a priority config by value.
 */
export function getPriorityConfig(value) {
  return NODE_PRIORITIES.find((p) => p.value === value) || NODE_PRIORITIES[4];
}
