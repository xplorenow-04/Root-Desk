import {
  LayoutDashboard,
  FolderKanban,
  Star,
  Clock,
  Trash2,
  Settings,
  Workflow,
  LayoutTemplate,
} from 'lucide-react';

/**
 * Sidebar navigation configuration — single source of truth.
 * Eliminates the duplication between constants/index.js and Sidebar.jsx.
 */
export const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Projects', path: '/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'Favorites', path: '/favorites', icon: Star },
      { label: 'Recent', path: '/recent', icon: Clock },
    ],
  },
  {
    label: 'Automation',
    items: [
      { label: 'Flows', path: '/automation/flows', icon: Workflow },
      { label: 'Templates', path: '/automation/templates', icon: LayoutTemplate },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Trash', path: '/trash', icon: Trash2 },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

/**
 * Keyboard shortcuts display list.
 * These are for display in the Settings page.
 */
export const SHORTCUTS = [
  { keys: ['Ctrl', 'B'], label: 'Toggle sidebar' },
  { keys: ['Ctrl', 'K'], label: 'Command palette' },
  { keys: ['Ctrl', 'N'], label: 'New project' },
  { keys: ['Ctrl', '/'], label: 'Keyboard shortcuts' },
];
