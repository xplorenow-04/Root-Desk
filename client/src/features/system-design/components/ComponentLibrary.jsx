import { useMemo, useState } from 'react';
import { Search, X, Package, Star, Layers } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { CATALOG_PART_A } from '../constants/componentCatalogA';
import { CATALOG_PART_B } from '../constants/componentCatalogB';
import { CATEGORY_MAP } from '../constants/architecture';
import { cn } from '@/lib/utils';

const CATALOG = [...CATALOG_PART_A, ...CATALOG_PART_B];

/**
 * Draggable component library. Each item carries its semantic type on the
 * dataTransfer so the canvas can instantiate it at the drop point.
 * Also lists user's custom components (added in the editor).
 */
const ComponentLibrary = ({ customComponents = [], selectedTypes = [], onSelect }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favs, setFavs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sd-lib-favs') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFav = (type) => {
    const next = favs.includes(type) ? favs.filter((t) => t !== type) : [...favs, type];
    setFavs(next);
    localStorage.setItem('sd-lib-favs', JSON.stringify(next));
  };

  const items = useMemo(() => {
    const all = [...CATALOG, ...customComponents.map((c) => ({ ...c, custom: true }))];
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (q && !(c.label || '').toLowerCase().includes(q) && !(c.type || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, customComponents]);

  const categories = useMemo(() => {
    const map = new Map();
    CATALOG.forEach((c) => {
      if (!map.has(c.category)) map.set(c.category, CATEGORY_MAP[c.category]?.label || c.category);
    });
    return [...map.entries()];
  }, []);

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/system-design-component', type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleSelect = (type) => {
    onSelect?.(type);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/40 p-2.5">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full rounded-lg border border-border/50 bg-background py-1.5 pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
              category === 'all' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                category === key ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Package size={22} className="opacity-40" />
            <p className="text-xs">No components match.</p>
          </div>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.custom;
            const color = item.color || cat.color || '#6366f1';
            const isSelected = selectedTypes.includes(item.type);
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onDoubleClick={() => toggleFav(item.type)}
                title={`${item.label} — click to add, drag onto canvas, double-click to favorite`}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-1.5 transition-colors hover:border-border/50 hover:bg-muted/40',
                  isSelected && 'border-primary/40 bg-primary/5'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item.type)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-foreground">{item.label}</span>
                    <span className="block truncate font-mono text-[9px] text-muted-foreground">{item.type}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(item.type);
                  }}
                  className="shrink-0 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
                  title="Favorite"
                >
                  <Star
                    size={11}
                    className={cn('transition-colors', favs.includes(item.type) && 'fill-amber-400 opacity-100 text-amber-400')}
                  />
                </button>
              </div>
            );
          })}
        </div>
        {customComponents.length > 0 && (
          <div className="mt-3 border-t border-border/40 pt-2">
            <div className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers size={10} /> Custom ({customComponents.length})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
