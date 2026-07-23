import {
  Folder,
  Code,
  Globe,
  Smartphone,
  Database,
  Shield,
  Zap,
  Rocket,
  Briefcase,
  BookOpen,
  Palette,
  Server,
  Layout,
  Terminal,
  Box,
  Layers,
} from 'lucide-react';

/**
 * Map of icon names to their Lucide React components.
 * This replaces the `import * as LucideIcons` anti-pattern
 * that would import 1000+ icons and bloat the bundle.
 */
const ICON_MAP = {
  Folder,
  Code,
  Globe,
  Smartphone,
  Database,
  Shield,
  Zap,
  Rocket,
  Briefcase,
  BookOpen,
  Palette,
  Server,
  Layout,
  Terminal,
  Box,
  Layers,
};

/**
 * Get a Lucide icon component by name.
 * Returns the Folder icon as default fallback.
 */
export function getIcon(name) {
  return ICON_MAP[name] || Folder;
}

/**
 * Get all available icon entries for the icon picker.
 */
export function getAvailableIcons() {
  return Object.entries(ICON_MAP).map(([name, Icon]) => ({ name, Icon }));
}

export default ICON_MAP;
