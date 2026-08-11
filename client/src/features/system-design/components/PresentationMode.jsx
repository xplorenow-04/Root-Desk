import { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation } from 'lucide-react';
import { getComponentDef } from '../constants/architecture';

/**
 * Fullscreen presentation mode: walks through the design one page at a time
 * with a summary of components, connections, boundaries, and requirements —
 * suitable for design reviews.
 */
const PresentationMode = ({ design, document, onClose }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = useMemo(() => document.pages || [], [document.pages]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setPageIndex((i) => Math.min(pages.length - 1, i + 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPageIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pages.length]);

  const page = pages[pageIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 text-foreground">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2">
          <Presentation size={16} className="text-primary" />
          <span className="text-sm font-semibold">{design?.name || document.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {pageIndex + 1} / {pages.length}
          </span>
          <button
            type="button"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex === 0}
            className="rounded-md border border-white/10 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
            disabled={pageIndex === pages.length - 1}
            className="rounded-md border border-white/10 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 p-1.5 text-muted-foreground hover:text-destructive">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xl font-bold">{page?.name}</h2>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {page?.level}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-wrap content-start items-start gap-3 overflow-y-auto">
            {(page?.nodes || []).map((n) => {
              const def = getComponentDef(n.type, document.customComponents) || {};
              const color = n.style?.color || def.color || '#6366f1';
              return (
                <div
                  key={n.id}
                  className="w-56 rounded-xl border-2 bg-slate-900 p-3"
                  style={{ borderColor: color }}
                >
                  <div className="text-sm font-semibold">{n.name}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {n.category} · {def.label}
                  </div>
                  {n.description && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">{n.description}</p>}
                  {n.properties?.requestsPerSec && (
                    <div className="mt-2 font-mono text-[10px] text-primary">{n.properties.requestsPerSec.toLocaleString()} req/s</div>
                  )}
                </div>
              );
            })}
            {(page?.nodes || []).length === 0 && (
              <p className="text-sm text-muted-foreground">This page has no components yet.</p>
            )}
          </div>
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 p-4">
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Connections</h3>
            <div className="space-y-1">
              {(page?.edges || []).map((e) => {
                const src = (page.nodes || []).find((n) => n.id === e.source)?.name || e.source;
                const tgt = (page.nodes || []).find((n) => n.id === e.target)?.name || e.target;
                return (
                  <div key={e.id} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px]">
                    <span className="font-medium">{src}</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className="font-medium">{tgt}</span>
                    <span className="ml-1 font-mono text-[9px] text-violet-300">{e.protocol}{e.syncMode === 'async' ? '~' : ''}</span>
                  </div>
                );
              })}
              {(page?.edges || []).length === 0 && <p className="text-[11px] text-muted-foreground">No connections.</p>}
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Boundaries</h3>
            {(page?.groups || []).map((g) => (
              <div key={g.id} className="mb-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px]">
                {g.name} <span className="font-mono text-[9px] text-muted-foreground">({g.boundaryType})</span>
              </div>
            ))}
            {(page?.groups || []).length === 0 && <p className="text-[11px] text-muted-foreground">None.</p>}
          </div>
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Requirements</h3>
            {(document.requirements || []).map((r) => (
              <div key={r.id} className="mb-1 text-[11px] leading-snug">- {r.text}</div>
            ))}
            {(document.requirements || []).length === 0 && <p className="text-[11px] text-muted-foreground">None.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationMode;
