import { useEffect, useState } from 'react';
import { X, LayoutTemplate, Loader2, Layers, Check } from 'lucide-react';
import { useSystemDesignTemplates, useUseSystemDesignTemplate } from '../hooks/useSystemDesigns';
import { cn } from '@/lib/utils';

/**
 * Template browser modal. Lists server-side templates; clicking "Use"
 * instantiates a copy into the selected project and closes the modal.
 */
const TemplatesModal = ({ projectId, onClose, onCreated }) => {
  const { data: templates, isLoading } = useSystemDesignTemplates();
  const useTemplate = useUseSystemDesignTemplate(projectId);
  const [usedId, setUsedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleUse = (templateId) => {
    setError(null);
    setUsedId(templateId);
    useTemplate.mutate(templateId, {
      onSuccess: (res) => {
        onCreated?.(res.data?.design?.id);
        onClose();
      },
      onError: (err) => {
        setError(err?.response?.data?.error || err?.message || 'Could not instantiate template');
        setUsedId(null);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-60 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border/40 bg-card p-5 shadow-2xl">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={18} className="text-primary" />
          <h3 className="text-base font-bold text-foreground">Design templates</h3>
          <button type="button" onClick={onClose} className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Instantiate a battle-tested starting architecture, then customize it in the editor.
        </p>
        {error && <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading templates…
            </div>
          )}
          {!isLoading && (templates || []).length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No templates available yet.</p>
          )}
          {(templates || []).map((t) => (
            <div key={t._id || t.id} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-colors hover:border-primary/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.category || 'general'}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{t.description}</p>
                {(t.componentCount !== undefined || t.nodeCount !== undefined) && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                    {t.nodeCount ?? t.componentCount ?? 0} components · {t.level || 'hld'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleUse(t._id || t.id)}
                disabled={usedId === (t._id || t.id)}
                className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {usedId === (t._id || t.id) ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Check size={12} /> Use
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
