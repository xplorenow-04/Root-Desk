import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Timer, Target, Network } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { usePracticeProblems } from '../hooks/useSystemDesigns';
import { cn } from '@/lib/utils';

const DIFFICULTY_META = {
  beginner: { cls: 'text-green-500 border-green-500/30 bg-green-500/10', label: 'Beginner', order: 0 },
  intermediate: { cls: 'text-sky-500 border-sky-500/30 bg-sky-500/10', label: 'Intermediate', order: 1 },
  advanced: { cls: 'text-amber-500 border-amber-500/30 bg-amber-500/10', label: 'Advanced', order: 2 },
  expert: { cls: 'text-red-500 border-red-500/30 bg-red-500/10', label: 'Expert', order: 3 },
};

/**
 * Practice lobby: browse interview-style design problems, filter by
 * difficulty, and start one. Each problem seeds a starting template.
 */
const SystemDesignPracticeLobbyPage = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('');
  const { data: problems = [], isLoading } = usePracticeProblems(difficulty);

  const sorted = [...problems].sort(
    (a, b) => (DIFFICULTY_META[a.difficulty]?.order ?? 1) - (DIFFICULTY_META[b.difficulty]?.order ?? 1)
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <PageHeader
          title="Practice mode"
          description="Solve interview-style system design problems. Your design is scored against expected components and architecture best practices."
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDifficulty('')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              !difficulty ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDifficulty(key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                difficulty === key
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:text-foreground'
              )}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {isLoading && <LoadingSpinner message="Loading problems…" />}
          {!isLoading && sorted.length === 0 && (
            <EmptyState icon={Target} title="No problems here" description="Try a different difficulty filter." />
          )}
          {sorted.map((p) => (
            <button
              key={p._id || p.id}
              type="button"
              onClick={() => navigate(`/system-design/practice/${p._id || p.id}`)}
              className="group flex w-full items-center gap-4 rounded-xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Network size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{p.title}</span>
                  <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase', DIFFICULTY_META[p.difficulty]?.cls)}>
                    {DIFFICULTY_META[p.difficulty]?.label || p.difficulty}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target size={9} /> {(p.functionalRequirements || []).length} requirements
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer size={9} /> ~{(p.estimatedMinutes || 60)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Network size={9} /> {(p.expectedPatterns || []).length} patterns
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemDesignPracticeLobbyPage;
