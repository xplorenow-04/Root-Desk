import { useState } from 'react';
import { GitBranch, Plus, RotateCcw, GitCompareArrows, Clock, Check } from 'lucide-react';
import { useSystemDesignVersions, useCreateSystemDesignVersion, useRestoreSystemDesignVersion } from '../hooks/useSystemDesigns';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-md border border-border/50 bg-background px-2 py-1 text-xs focus:border-primary/50 focus:outline-none';

const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/**
 * Version management: snapshot the current document, view the history,
 * restore any past version, and compare two versions.
 */
const VersionsPanel = ({ designId }) => {
  const { data: versionInfo, isLoading } = useSystemDesignVersions(designId);
  const createVersion = useCreateSystemDesignVersion(designId);
  const restoreVersion = useRestoreSystemDesignVersion(designId);

  const [message, setMessage] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [comparePair, setComparePair] = useState([null, null]);
  const [compareResult, setCompareResult] = useState(null);

  const versions = versionInfo?.versions || [];
  const currentVersion = versionInfo?.currentVersion || (versions.length ? versions[0].versionNumber : 1);

  const handleCreate = () => {
    createVersion.mutate(
      { message: message.trim() || `Snapshot ${versions.length + 1}` },
      {
        onSuccess: () => {
          setMessage('');
          setCompareResult(null);
        },
      }
    );
  };

  const handleRestore = (v) => {
    setRestoreTarget(v.versionNumber);
    restoreVersion.mutate(v.versionNumber, {
      onSettled: () => setRestoreTarget(null),
    });
  };

  const pickA = (v) => setComparePair([v.versionNumber, comparePair[1]]);
  const pickB = (v) => setComparePair([comparePair[0], v.versionNumber]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <GitBranch size={13} className="text-primary" /> Versions
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Currently on v{currentVersion} of {Math.max(1, versions.length)} snapshot{versions.length !== 1 ? 's' : ''}.
        </p>
        <div className="mt-2 flex gap-1">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Snapshot message (optional)"
            className={inputCls}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createVersion.isPending}
            className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={11} /> Snapshot
          </button>
        </div>
      </div>

      <div className="flex-1 p-2">
        <div className="space-y-1.5">
          {isLoading && <p className="p-3 text-center text-xs text-muted-foreground">Loading versions…</p>}
          {!isLoading && versions.length === 0 && (
            <p className="p-3 text-center text-[10px] text-muted-foreground">
              No snapshots yet. Save a snapshot to roll back later.
            </p>
          )}
          {versions.map((v) => {
            const isCurrent = v.versionNumber === currentVersion;
            return (
              <div
                key={v.versionNumber}
                className={cn(
                  'rounded-lg border p-2',
                  isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card/60'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted font-mono text-[9px] font-bold text-muted-foreground">
                    {v.versionNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
                    {v.message || `Snapshot ${v.versionNumber}`}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-green-600">
                      <Check size={8} /> Current
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Clock size={9} className="text-muted-foreground/60" />
                  <span className="text-[9px] text-muted-foreground/70">{fmtTime(v.createdAt)}</span>
                  {v.nodeCount !== undefined && <span className="text-[9px] text-muted-foreground/70">· {v.nodeCount} nodes</span>}
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRestore(v)}
                    disabled={isCurrent || restoreVersion.isPending}
                    className="flex items-center gap-0.5 rounded border border-border/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-40"
                  >
                    <RotateCcw size={9} />
                    {restoreTarget === v.versionNumber ? 'Restoring…' : 'Restore'}
                  </button>
                  <button
                    type="button"
                    onClick={() => pickA(v)}
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[9px] font-medium',
                      comparePair[0] === v.versionNumber
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Compare A
                  </button>
                  <button
                    type="button"
                    onClick={() => pickB(v)}
                    className={cn(
                      'rounded border px-1.5 py-0.5 text-[9px] font-medium',
                      comparePair[1] === v.versionNumber
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Compare B
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {comparePair[0] && comparePair[1] && comparePair[0] !== comparePair[1] && (
          <div className="mt-3 rounded-lg border border-border/50 p-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <GitCompareArrows size={10} /> v{comparePair[0]} vs v{comparePair[1]}
            </div>
            <div className="mt-1.5 text-[11px] text-foreground">
              {compareResult === null ? (
                <span className="text-muted-foreground">Restore one of these versions to inspect the diff…</span>
              ) : (
                <pre className="max-h-40 overflow-auto rounded bg-muted/40 p-2 font-mono text-[9px] leading-relaxed text-foreground">
                  {compareResult}
                </pre>
              )}
            </div>
            <p className="mt-1 text-[9px] leading-snug text-muted-foreground">
              Tip: restore the older version, then use Undo/Redo to walk the diff between snapshots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionsPanel;
