import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Timer, Trophy, Lightbulb, RotateCcw, Send, ChevronLeft, Target, Loader2, FileText, TrafficCone } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { usePracticeProblem, useSubmitPractice } from '../hooks/useSystemDesigns';
import { useSystemDesignEditor } from '../hooks/useSystemDesignEditor';
import ArchitectureCanvas from '../components/ArchitectureCanvas';
import ComponentLibrary from '../components/ComponentLibrary';
import { cn } from '@/lib/utils';

const DIFFICULTY_META = {
  beginner: { cls: 'text-green-500 border-green-500/30 bg-green-500/10', label: 'Beginner' },
  intermediate: { cls: 'text-sky-500 border-sky-500/30 bg-sky-500/10', label: 'Intermediate' },
  advanced: { cls: 'text-amber-500 border-amber-500/30 bg-amber-500/10', label: 'Advanced' },
  expert: { cls: 'text-red-500 border-red-500/30 bg-red-500/10', label: 'Expert' },
};

const DIM_LABELS = {
  requirements: 'Requirements',
  scalability: 'Scalability',
  availability: 'Availability',
  performance: 'Performance',
  dataDesign: 'Data design',
};

const PracticeInner = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();
  const { data: problem, isLoading, isError } = usePracticeProblem(problemId);
  const submitMutation = useSubmitPractice();

  const editor = useSystemDesignEditor();
  const {
    document, dirty, loadDocument, buildDocument,
    nodes, edges,
    onNodesChange, onEdgesChange, onSelectionChange, onNodeClick, onEdgeClick, onPaneClick, onConnect,
    addNode, addGroup, insertPattern,
    selectedNodeIds, selectedEdgeId, selectedGroupId,
    setSelectedNodeIds, setSelectedGroupId, removeEdge,
  } = editor;

  const [elapsed, setElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [statementOpen, setStatementOpen] = useState(true);
  const [placeOffset, setPlaceOffset] = useState(0);
  const canvasWrapRef = useRef(null);

  useEffect(() => {
    if (problem) {
      setElapsed(0);
      setHintsUsed([]);
      setResult(null);
    }
  }, [problem]);

  useEffect(() => {
    if (!problem || result) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [problem, result]);

  const timeStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsed]);

  const useHint = (id) => {
    if (!hintsUsed.includes(id)) setHintsUsed((h) => [...h, id]);
  };

  const handleSubmit = useCallback(() => {
    if (!problemId) return;
    setSubmitting(true);
    submitMutation.mutate(
      { problemId, data: buildDocument(), hintsUsed },
      {
        onSuccess: (res) => setResult(res.data?.result || null),
        onError: () => setSubmitting(false),
      }
    );
  }, [problemId, buildDocument, hintsUsed, submitMutation]);

  const tryAgain = () => {
    setElapsed(0);
    setHintsUsed([]);
    setResult(null);
  };

  const placeComponentAtCenter = useCallback(
    (type) => {
      const el = canvasWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cascade = (placeOffset % 7) * 28;
      setPlaceOffset((o) => o + 1);
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2 + cascade,
        y: rect.top + rect.height / 2 + cascade,
      });
      addNode(type, position);
    },
    [screenToFlowPosition, placeOffset, addNode]
  );

  if (isLoading) return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading problem…" /></div>;
  if (isError || !problem) {
    return (
      <ErrorState
        title="Problem not found"
        description="This practice problem may have been removed."
        action={<button onClick={() => navigate('/system-design/practice')} className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground">Back to practice</button>}
      />
    );
  }

  const dim = result?.scorecard?.dimensions || {};
  const overall = result?.scorecard?.overall ?? 0;
  const hintPenalty = result?.scorecard?.hintPenalty ?? 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/40 bg-card/80 px-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate('/system-design/practice')}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft size={14} /> All problems
        </button>
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-foreground">{problem.title}</span>
        </div>
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', DIFFICULTY_META[problem.difficulty]?.cls || DIFFICULTY_META.intermediate.cls)}>
          {DIFFICULTY_META[problem.difficulty]?.label || problem.difficulty}
        </span>
        <span className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 font-mono text-xs text-foreground">
          <Timer size={12} className="text-primary" /> {timeStr}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || Boolean(result)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Submit for review
        </button>
      </div>

      {/* hint strip */}
      <div className="flex h-10 shrink-0 items-center gap-3 overflow-x-auto border-b border-border/40 bg-muted/20 px-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hints ({hintsUsed.length}/{problem.hints?.length || 0} used)
          </span>
          {(problem.hints || []).map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => useHint(h.id)}
              disabled={hintsUsed.includes(h.id)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                hintsUsed.includes(h.id)
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-amber-500/40 hover:text-amber-500'
              )}
              title={hintsUsed.includes(h.id) ? h.text : `Reveal hint (${h.strength || 'moderate'}) — −${h.penalty || 1} pt`}
            >
              <Lightbulb size={9} /> {hintsUsed.includes(h.id) ? h.text : `${h.strength || 'hint'} −${h.penalty || 1}`}
            </button>
          ))}
          {(problem.hints || []).length === 0 && <span className="text-[10px] text-muted-foreground">no hints available</span>}
        </div>
      </div>

      {result ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto bg-background/95 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 text-center shadow-xl">
            <Trophy size={32} className={cn('mx-auto', overall >= 16 ? 'text-amber-500' : overall >= 10 ? 'text-sky-500' : 'text-red-500')} />
            <h2 className="mt-2 text-2xl font-bold text-foreground">{overall}/20</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {overall >= 16 ? 'Excellent design — interview-ready.' : overall >= 10 ? 'Solid attempt — tighten the weak spots below.' : 'Needs work — review the criteria and retry.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
              {Object.entries(DIM_LABELS).map(([key, label]) => {
                const s = dim[key] || { score: 0, max: 20 };
                return (
                  <div key={key} className="rounded-lg border border-border/40 bg-muted/20 p-2 text-center">
                    <div className={cn('text-lg font-bold', s.score >= 16 ? 'text-green-500' : s.score >= 10 ? 'text-amber-500' : 'text-red-500')}>
                      {s.score}
                      <span className="text-xs text-muted-foreground">/{s.max || 20}</span>
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
                  </div>
                );
              })}
            </div>

            {hintPenalty > 0 && (
              <p className="mt-3 text-[11px] text-amber-600">
                {result.scorecard.hintsUsed} hint{result.scorecard.hintsUsed !== 1 ? 's' : ''} used — {hintPenalty} pt penalty applied.
              </p>
            )}

            <div className="mt-4 space-y-2 text-left">
              {result.strengths?.length > 0 && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-green-500">Strengths</div>
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5 text-[11px] leading-snug text-foreground">
                      <span className="mt-0.5 text-green-500">✓</span> {s}
                    </div>
                  ))}
                </div>
              )}
              {result.problems?.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">Problems</div>
                  {result.problems.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5 text-[11px] leading-snug text-foreground">
                      <span className="mt-0.5 text-amber-500">✗</span> {s}
                    </div>
                  ))}
                </div>
              )}
              {result.suggestions?.length > 0 && (
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-sky-500">Improve</div>
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5 text-[11px] leading-snug text-foreground">
                      <span className="mt-0.5 text-sky-500">→</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={tryAgain}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
              >
                <RotateCcw size={13} /> Try again
              </button>
              <button
                type="button"
                onClick={() => navigate('/system-design/practice')}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                More problems
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {leftOpen && (
            <aside className="flex w-52 shrink-0 flex-col border-r border-border/40 bg-card/50">
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/40 px-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Library</span>
                <button type="button" onClick={() => setLeftOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <ComponentLibrary customComponents={document.customComponents} onSelect={placeComponentAtCenter} />
            </aside>
          )}

          <div className="relative min-w-0 flex-1" ref={canvasWrapRef}>
            <ArchitectureCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(e, n) => {
                if (n.type === 'groupNode') setSelectedGroupId(n.id.replace('group:', ''));
                else onNodeClick?.(e, n);
              }}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onSelectionChange={onSelectionChange}
              onDropComponent={(type, position) => {
                const createdId = addNode(type, position);
                if (createdId) setSelectedNodeIds([createdId]);
              }}
              onDropPattern={(pid, position) => {
                const pattern = (problem.expectedPatterns || []).find((x) => x.id === pid);
                if (pattern) insertPattern(pattern, position);
              }}
            />
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              <span className="pointer-events-auto rounded-full border border-border/60 bg-background/90 px-2.5 py-1 text-[10px] text-muted-foreground shadow-md">
                Drag components from the library onto the canvas
              </span>
            </div>
          </div>

          {/* problem statement drawer */}
          {statementOpen && (
            <aside className="flex w-72 shrink-0 flex-col border-l border-border/40 bg-card/60">
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/40 px-3">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText size={10} /> Problem statement
                </span>
                <button type="button" onClick={() => setStatementOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                <p className="text-[11px] leading-relaxed text-foreground">{problem.description}</p>

                <div>
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-primary">Functional requirements</div>
                  <div className="space-y-1">
                    {(problem.functionalRequirements || []).map((r) => (
                      <div key={r.key} className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5">
                        <div className="text-[11px] font-medium leading-snug text-foreground">
                          {r.label} {r.weight > 1 && <span className="ml-1 font-mono text-[9px] text-muted-foreground">×{r.weight}</span>}
                        </div>
                        <div className="mt-0.5 text-[9px] leading-snug text-muted-foreground">
                          {(r.matches || []).map((m) => m.label || m.value).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(problem.nonFunctionalRequirements || []).length > 0 && (
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-primary">Non-functional</div>
                    <div className="space-y-1">
                      {(problem.nonFunctionalRequirements || []).map((nfr, i) => (
                        <div key={i} className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5">
                          <div className="text-[11px] font-medium text-foreground">{nfr.name}</div>
                          <div className="text-[9px] leading-snug text-muted-foreground">{nfr.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(problem.traffic || problem.storage || problem.availability || problem.latency) && (
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                      <TrafficCone size={9} /> Capacity & constraints
                    </div>
                    <div className="space-y-1">
                      {problem.traffic && Object.keys(problem.traffic).length > 0 && (
                        <div className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Traffic</div>
                          <div className="mt-0.5 space-y-0.5 text-[10px] text-foreground">
                            {Object.entries(problem.traffic).map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="font-mono">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {problem.storage && Object.keys(problem.storage).length > 0 && (
                        <div className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Storage</div>
                          <div className="mt-0.5 space-y-0.5 text-[10px] text-foreground">
                            {Object.entries(problem.storage).map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="font-mono">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(problem.availability || problem.latency) && (
                        <div className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5 text-[10px] text-foreground">
                          {problem.availability && (
                            <div><span className="text-muted-foreground">Availability: </span><span className="font-mono">{problem.availability}</span></div>
                          )}
                          {problem.latency && (
                            <div><span className="text-muted-foreground">Latency: </span><span className="font-mono">{problem.latency}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(problem.evaluationCriteria || []).length > 0 && (
                  <div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-primary">Evaluation criteria</div>
                    <div className="space-y-1">
                      {problem.evaluationCriteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] leading-snug text-foreground">
                          <Target size={9} className="mt-0.5 shrink-0 text-primary" /> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
};

const SystemDesignPracticePage = () => (
  <ReactFlowProvider>
    <PracticeInner />
  </ReactFlowProvider>
);

export default SystemDesignPracticePage;
