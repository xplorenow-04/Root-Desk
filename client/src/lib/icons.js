import * as LucideIcons from 'lucide-react';

/**
 * Preset map of icon names to their Lucide React components.
 * Kept for quick access and backwards compatibility.
 */
const ICON_MAP = {
  Folder: LucideIcons.Folder,
  Code: LucideIcons.Code,
  Globe: LucideIcons.Globe,
  Smartphone: LucideIcons.Smartphone,
  Database: LucideIcons.Database,
  Shield: LucideIcons.Shield,
  Zap: LucideIcons.Zap,
  Rocket: LucideIcons.Rocket,
  Briefcase: LucideIcons.Briefcase,
  BookOpen: LucideIcons.BookOpen,
  Palette: LucideIcons.Palette,
  Server: LucideIcons.Server,
  Layout: LucideIcons.Layout,
  Terminal: LucideIcons.Terminal,
  Box: LucideIcons.Box,
  Layers: LucideIcons.Layers,
};

/**
 * Get a Lucide icon component by name.
 * Returns the Folder icon as default fallback.
 */
export function getIcon(name) {
  if (!name) return LucideIcons.Folder;
  return LucideIcons[name] || ICON_MAP[name] || LucideIcons.Folder;
}

/**
 * Get all preset icon entries for the basic project picker.
 */
export function getAvailableIcons() {
  return Object.entries(ICON_MAP).map(([name, Icon]) => ({ name, Icon }));
}

/**
 * Get all available Lucide icons for the searchable icon pack picker.
 * Filters out internal helpers or non-component exports.
 */
export function getAllAvailableIcons() {
  return Object.entries(LucideIcons)
    .filter(([name, component]) => {
      return (
        component &&
        name[0] === name[0].toUpperCase() &&
        name !== 'Icon' &&
        name !== 'createReactComponent'
      );
    })
    .map(([name, Icon]) => ({ name, Icon }));
}

export default ICON_MAP;
