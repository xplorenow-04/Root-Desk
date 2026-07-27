import React, { useState, useMemo } from 'react';
import { Search, Check, RefreshCw } from 'lucide-react';
import { getAllAvailableIcons } from '@/lib/icons';

const PRESET_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Slate', hex: '#64748b' },
];

// Curated categories containing real-world, high-value feature icons
const ICON_CATEGORIES = {
  All: [],
  Core: [
    'Home', 'Settings', 'Trash2', 'Edit3', 'Plus', 'Folder', 'FolderOpen', 'Layout', 
    'LayoutGrid', 'Layers', 'Bell', 'Star', 'Info', 'HelpCircle', 'Sliders', 'Activity', 
    'Shield', 'Trophy', 'Gift', 'Flag', 'Wrench', 'Calendar', 'Clock', 'AlarmClock'
  ],
  Users: [
    'User', 'Users', 'UserPlus', 'UserCheck', 'Lock', 'Key', 'Fingerprint', 'ShieldCheck',
    'LogIn', 'LogOut', 'Contact', 'UserCog', 'KeyRound', 'ShieldAlert'
  ],
  Commerce: [
    'CreditCard', 'ShoppingBag', 'ShoppingCart', 'DollarSign', 'Wallet', 'Percent', 
    'Tag', 'Receipt', 'Coins', 'Banknote', 'PiggyBank', 'TrendingUp', 'Store', 'Briefcase'
  ],
  Analytics: [
    'BarChart3', 'PieChart', 'LineChart', 'AreaChart', 'Activity', 'Database', 'Cpu',
    'TrendingUp', 'Presentation', 'FileText', 'Server', 'FileSpreadsheet', 'HardDrive'
  ],
  Media: [
    'Image', 'Video', 'Music', 'Play', 'Pause', 'Film', 'Camera', 'Mic', 'Headphones',
    'Radio', 'Tv', 'Volume2', 'Bookmark', 'Compass'
  ],
  Chat: [
    'MessageSquare', 'Send', 'Phone', 'Share2', 'Mail', 'Hash', 'Globe', 'Megaphone', 
    'Heart', 'Smile', 'MessageCircle', 'AtSign', 'ThumbsUp'
  ],
  Automation: [
    'Zap', 'Workflow', 'GitBranch', 'GitFork', 'Play', 'Pause', 'RefreshCw', 'CheckSquare',
    'Code', 'Timer', 'Activity', 'Shuffle'
  ],
  Maps: [
    'MapPin', 'Map', 'Navigation', 'Truck', 'Plane', 'Car', 'Clock', 
    'Anchor', 'Bicycle', 'Train'
  ],
  Education: [
    'GraduationCap', 'School', 'BookOpen', 'Book', 'Notebook', 'Pencil', 'PenTool',
    'ClipboardList', 'Calculator', 'Award', 'Trophy', 'Bus', 'Scroll', 'Library',
    'Users', 'User', 'Calendar', 'Clock', 'Bell', 'MessageSquare'
  ],
};

/**
 * Reusable icon and color picker.
 * Features:
 * - Search query filtering across all 1400+ Lucide icons.
 * - 9 curated categories covering standard real-world feature types.
 * - Optimized DOM rendering capped at 120 matching results.
 * - Curated premium preset colors + Custom hex picker.
 * - Real-time styled previews.
 */
const IconPicker = ({ value, color, onChange, onColorChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Cache all icons from library
  const allIcons = useMemo(() => getAllAvailableIcons(), []);

  // Filter icons based on search query and category
  const filteredIcons = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    // 1. Filter by category
    let list = allIcons;
    if (activeCategory !== 'All') {
      const allowedNames = ICON_CATEGORIES[activeCategory] || [];
      list = allIcons.filter(({ name }) => allowedNames.includes(name));
    }

    // 2. Filter by search query
    if (cleanSearch) {
      list = list.filter(({ name }) => name.toLowerCase().includes(cleanSearch));
    }

    // 3. Return capped results
    return list.slice(0, 120);
  }, [allIcons, searchTerm, activeCategory]);

  // Handle icon selection
  const handleIconSelect = (iconName) => {
    onChange(iconName);
    // If no color is assigned, give a nice default color
    if (!color) {
      onColorChange('#6366f1');
    }
  };

  // Reset icon and color back to defaults
  const handleClear = () => {
    onChange(null);
    onColorChange(null);
  };

  // Resolve currently active icon component
  const SelectedIconComponent = useMemo(() => {
    if (!value) return null;
    const found = allIcons.find(({ name }) => name === value);
    return found ? found.Icon : null;
  }, [allIcons, value]);

  // Check if current color is custom (not in presets)
  const isCustomColor = useMemo(() => {
    if (!color) return false;
    return !PRESET_COLORS.some((c) => c.hex.toLowerCase() === color.toLowerCase());
  }, [color]);

  return (
    <div className="space-y-4 border border-border/40 rounded-xl bg-background/25 p-4 shadow-inner">
      {/* ── Header: Active Icon Preview & Clear Action ── */}
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-all duration-300"
            style={{
              backgroundColor: color ? `${color}15` : 'rgba(var(--primary-rgb), 0.1)',
              borderColor: color ? `${color}35` : 'rgba(var(--primary-rgb), 0.3)',
              color: color || 'var(--foreground)',
            }}
          >
            {SelectedIconComponent ? (
              <SelectedIconComponent className="h-6 w-6" />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">None</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight">
              {value ? `${value} Icon` : 'Default Node Icon'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {value ? 'Custom icon configuration' : 'Inherits default type layout'}
            </p>
          </div>
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </button>
        )}
      </div>

      {/* ── Color Palette Row ── */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Icon Color Accent
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onColorChange(c.hex)}
              style={{ backgroundColor: c.hex }}
              className="group relative flex h-7 w-7 items-center justify-center rounded-full hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer border border-white/10"
            >
              {color?.toLowerCase() === c.hex.toLowerCase() && (
                <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] pointer-events-none" />
              )}
              <span className="absolute bottom-8 scale-0 group-hover:scale-100 rounded bg-popover border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold text-popover-foreground shadow-md transition-all duration-155 origin-bottom whitespace-nowrap z-10">
                {c.name}
              </span>
            </button>
          ))}

          {/* Hex Custom Color Picker Picker */}
          <div
            className="relative flex items-center justify-center h-7 w-7 rounded-full border border-border/60 hover:scale-110 active:scale-95 transition-all cursor-pointer overflow-hidden shadow-sm hover:border-foreground/50"
            style={{
              backgroundColor: isCustomColor ? color : '#333',
            }}
            title="Custom Hex Color"
          >
            <input
              type="color"
              value={color || '#6366f1'}
              onChange={(e) => onColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
            />
            {isCustomColor ? (
              <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] pointer-events-none" />
            ) : (
              <span className="text-xs text-white font-black pointer-events-none leading-none select-none">+</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Input, Curated Tabs & Icon Grid ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Search & Filter Icons
          </label>
          <span className="text-[9px] font-semibold text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded">
            Showing {filteredIcons.length} of {activeCategory === 'All' ? allIcons.length : (ICON_CATEGORIES[activeCategory]?.length || 0)}
          </span>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search all or select a feature category below..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 pl-9 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155"
          />
        </div>

        {/* Curated Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-b border-border/10 max-w-full">
          {Object.keys(ICON_CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                  : 'text-muted-foreground/75 hover:bg-muted/70 hover:text-foreground border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Icon Grid */}
        <div className="grid grid-cols-6 gap-2 border border-border/20 rounded-xl bg-background/40 p-2.5 max-h-[170px] overflow-y-auto scrollbar-thin">
          {filteredIcons.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleIconSelect(name)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border active:scale-95 transition-all duration-150 cursor-pointer ${
                value === name
                  ? 'bg-primary/15 border-primary text-primary shadow-sm hover:bg-primary/20'
                  : 'border-transparent text-muted-foreground hover:bg-muted/85 hover:text-foreground'
              }`}
              title={name}
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic">
              No matching icons. Check search terms or try another category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
