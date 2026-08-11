import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, RefreshCw, Target, X } from 'lucide-react';
import { useValidateSystemDesign } from '../hooks/useSystemDesigns';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS = {
  scalability: 'Scalability',
  availability: 'Availability',
  performance: 'Performance',
  security: 'Security',
  reliability: 'Reliability',
  data: 'Data',
};

const SEVERITY_META = {
  critical: { label: 'Critical', icon: AlertOctagon, cls: 'text-red-500 border-red-500/30 bg-red-500/10', bar: 'bg-red-500' },
  warning: { label: 'Warning', icon: AlertTriangle, cls: 'text-amber-500 border-amber-500/30 bg-amber-500/10', bar: 'bg-amber-500' },
  suggestion: { label: 'Suggestion', icon: Info, cls: 'text-sky-500 border-sky-500/30 bg-sky-500/10', bar: 'bg-sky-500' },
};

const scoreColor = (score) => (score >= 16 ? 'text-green-500' : score >= 10 ? 'text-amber-500' : 'text-red-500');
const ringColor = (score) => (score >= 16 ? '#22c55e' : score >= 10 ? '#f59e0b' : '#ef4444');

/**
 * Live validation panel. Runs the server-side engine against the current
 * document state; clicking a finding highlights the affected nodes/edges.
 */
const ValidationPanel = ({ designId, getData, onHighlight }) => {
  const validateMutation = useValidateSystemDesign(designId);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = () => {
    setError(null);
    validateMutation.mutate(
      { data: getData() },
      {
        onSuccess: (res) => setResult(res.data?.result || res.data || null),
        onError: (err) => setError(err?.response?.data?.error || err?.message || 'Validation failed'),
      }
    );
  };

  useEffect(() => {
    if (!result) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findings = useMemo(() => (result?.findings || []).slice(), [result]);
  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, suggestion: 0 };
    for (const f of findings) c[f.severity] = (c[f.severity] || 0) + 1;
    return c;
  }, [findings]);

  const score = result?.score ?? 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/40 p-3">
        <div className="flex items-center gap-2">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke={ringColor(score)} strokeWidth="3"
                strokeLinecap="round" strokeDasharray={`${(score / 20) * 100} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-xl font-bold', scoreColor(score))}>{score}/20</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">overall</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Target size={13} className="text-primary" /> Architecture health
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(SEVERITY_META).map(([sev, meta]) => (
                <span key={sev} className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', meta.cls)}>
                  <meta.icon size={9} /> {counts[sev] || 0} {meta.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={run}
              disabled={validateMutation.isPending}
              className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw size={10} className={validateMutation.isPending ? 'animate-spin' : ''} /> Re-validate
            </button>
          </div>
        </div>

        {result?.categories && (
          <div className="mt-3 space-y-1">
            {Object.entries(result.categories).map(([key, cat]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground">{CATEGORY_LABELS[key] || key}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', scoreColor(cat.score))}
                    style={{ width: `${(cat.score / 20) * 100}%` }}
                  />
                </div>
                <span className={cn('w-8 shrink-0 text-right text-[10px] font-mono', scoreColor(cat.score))}>{cat.score}/20</span>
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[10px] text-destructive">{error}</p>}
      </div>

      <div className="flex-1 space-y-1.5 p-2">
        {result === null && !validateMutation.isPending && (
          <div className="p-4 text-center text-xs text-muted-foreground">Run validation to see findings.</div>
        )}
        {findings.length === 0 && result && (
          <div className="flex flex-col items-center gap-1 p-6 text-center">
            <CheckCircle2 size={22} className="text-green-500" />
            <p className="text-xs font-medium text-foreground">No issues found</p>
            <p className="text-[10px] text-muted-foreground">This design passes all checks.</p>
          </div>
        )}
        {findings.map((f) => {
          const meta = SEVERITY_META[f.severity] || SEVERITY_META.suggestion;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onHighlight?.(f.affectedNodes || [], f.affectedEdges || [])}
              className="block w-full rounded-lg border border-border/50 bg-card/60 p-2 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-1.5">
                <meta.icon size={12} className={cn('mt-0.5 shrink-0', f.severity === 'critical' ? 'text-red-500' : f.severity === 'warning' ? 'text-amber-500' : 'text-sky-500')} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-foreground">{f.title}</div>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{f.description}</p>
                  {f.recommendation && (
                    <p className="mt-1 text-[10px] leading-snug text-primary/80">
                      <span className="font-semibold">Fix: </span>{f.recommendation}
                    </p>
                  )}
                </div>
                <span className={cn('shrink-0 rounded-full px-1.5 text-[8px] font-bold uppercase', meta.cls)}>{f.severity}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ValidationPanel;
