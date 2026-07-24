import { useState, useMemo, useCallback, memo } from 'react';
import { Search, ChevronDown, ChevronRight, Star, Clock } from 'lucide-react';
import { NODE_TYPES, NODE_CATEGORIES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

/**
 * Dockable side panel for browsing and dragging node types onto the canvas.
 */
const NodePalette = ({ onAddNode, onClose, recentNodes = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    new Set(NODE_CATEGORIES.map(c => c.key))
  );
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('flow_favorite_nodes') || '[]');
    } catch { return []; }
  });

  const toggleFavorite = useCallback((type) => {
    setFavorites(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      localStorage.setItem('flow_favorite_nodes', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCategory = useCallback((key) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return NODE_CATEGORIES;

    const q = searchQuery.toLowerCase();
    return NODE_CATEGORIES.map(cat => ({
      ...cat,
      types: cat.types.filter(type => {
        const config = NODE_TYPES[type];
        return (
          config?.label?.toLowerCase().includes(q) ||
          config?.description?.toLowerCase().includes(q) ||
          type.toLowerCase().includes(q)
        );
      }),
    })).filter(cat => cat.types.length > 0);
  }, [searchQuery]);

  const favoriteNodes = useMemo(() => {
    return favorites.filter(f => NODE_TYPES[f]);
  }, [favorites]);

  const handleDragStart = useCallback((e, type) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const NodeItem = ({ type }) => {
    const config = NODE_TYPES[type];
    if (!config) return null;
    const Icon = config.icon;
    const isFav = favorites.includes(type);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, type)}
        onClick={() => onAddNode?.(type)}
        className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-muted/50 transition-all text-left cursor-grab active:cursor-grabbing group"
      >
        <div
          className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.bgColor)}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{config.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{config.description}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(type); }}
          className={cn(
            'p-0.5 rounded transition-all opacity-0 group-hover:opacity-100',
            isFav ? 'opacity-100 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'
          )}
        >
          <Star className={cn('w-3 h-3', isFav && 'fill-amber-400')} />
        </button>
      </div>
    );
  };

  return (
    <div className="w-64 border-r border-border/40 bg-card/50 backdrop-blur-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/40">
        <h3 className="text-xs font-semibold text-foreground mb-2">Node Palette</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-none">
        {/* Favorites section */}
        {favoriteNodes.length > 0 && !searchQuery && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('favorites')}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left"
            >
              {expandedCategories.has('favorites') ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Favorites
              </span>
            </button>
            {expandedCategories.has('favorites') && (
              <div className="ml-1">
                {favoriteNodes.map(type => <NodeItem key={type} type={type} />)}
              </div>
            )}
          </div>
        )}

        {/* Recent section */}
        {recentNodes.length > 0 && !searchQuery && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('recent')}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left"
            >
              {expandedCategories.has('recent') ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </span>
            </button>
            {expandedCategories.has('recent') && (
              <div className="ml-1">
                {recentNodes.slice(0, 5).map(type => <NodeItem key={type} type={type} />)}
              </div>
            )}
          </div>
        )}

        {/* Category sections */}
        {filteredCategories.map(category => {
          const isExpanded = expandedCategories.has(category.key);
          const CatIcon = category.icon;

          return (
            <div key={category.key}>
              <button
                onClick={() => toggleCategory(category.key)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left hover:bg-muted/30 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
                {CatIcon && <CatIcon className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </span>
                <span className="text-[9px] text-muted-foreground/50 ml-auto">
                  {category.types.length}
                </span>
              </button>
              {isExpanded && (
                <div className="ml-1">
                  {category.types.map(type => <NodeItem key={type} type={type} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Drag nodes onto canvas or click to add
        </p>
      </div>
    </div>
  );
};

export default memo(NodePalette);
