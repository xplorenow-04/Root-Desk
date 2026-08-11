import { useState } from 'react';
import { Plus, X, FileText, LayoutGrid, Layers } from 'lucide-react';
import { ARCH_LEVELS } from '../constants/architecture';
import { cn } from '@/lib/utils';

/**
 * Horizontal page tab bar. Click to switch, right-click or X to remove,
 * small "+" adds a page. Each page's level (HLD/LLD) is shown as a chip.
 */
const PagesBar = ({ pages, activePageId, onSwitch, onAdd, onRename, onRemove, onSetLevel }) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (page) => {
    setEditingId(page.pageId);
    setDraft(page.name);
  };

  const commitEdit = (page) => {
    if (draft.trim() && draft !== page.name) onRename(page, draft.trim());
    setEditingId(null);
  };

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-border/40 bg-card/60 px-2 backdrop-blur-sm">
      <LayoutGrid size={13} className="mr-1 shrink-0 text-muted-foreground" />
      {pages.map((page) => {
        const active = page.pageId === activePageId;
        const levelDef = ARCH_LEVELS.find((l) => l.id === page.level) || ARCH_LEVELS[0];
        return (
          <div
            key={page.pageId}
            onClick={() => onSwitch(page.pageId)}
            className={cn(
              'group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
              active
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-transparent text-muted-foreground hover:border-border/50 hover:text-foreground'
            )}
            title={`${page.level.toUpperCase()} page — click to switch`}
          >
            <FileText size={11} className={active ? 'text-primary' : ''} />
            {editingId === page.pageId ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commitEdit(page)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(page);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 rounded border border-primary/40 bg-background px-1 text-xs focus:outline-none"
              />
            ) : (
              <span onDoubleClick={(e) => { e.stopPropagation(); startEdit(page); }} className="max-w-[120px] truncate font-medium">
                {page.name}
              </span>
            )}
            <span
              className={cn('rounded px-1 text-[9px] font-semibold uppercase', active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}
              onClick={(e) => {
                e.stopPropagation();
                const next = page.level === 'hld' ? 'lld' : 'hld';
                onSetLevel(page, next);
              }}
              title="Toggle HLD / LLD"
            >
              {page.level}
            </span>
            {pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(page.pageId);
                }}
                className="hidden text-muted-foreground hover:text-destructive group-hover:inline"
                title="Remove page"
              >
                <X size={10} />
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex shrink-0 items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
        title="Add page"
      >
        <Plus size={11} /> Page
      </button>
      <div className="ml-auto flex items-center gap-1 pr-1 text-[10px] text-muted-foreground/70">
        <Layers size={10} /> {pages.length} page{pages.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default PagesBar;
