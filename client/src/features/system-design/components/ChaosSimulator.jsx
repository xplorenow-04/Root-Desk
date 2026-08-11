import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Play, Square, RotateCcw, Zap, Activity, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n || 0)}`);

/**
 * Chaos + traffic simulator. Runs a tick loop locally:
 * - Applies each component's traffic share, accumulating load
 *   (fraction of configured capacity consumed) with a queue.
 * - Failures: kill / degrade components by hand. Cascading impact follows
 *   dependency edges; queues buffer while producers are down (async absorbs,
 *   sync propagates immediately).
 * - Emits `simStatus` per node so the canvas can render down/overloaded rings.
 */
const ChaosSimulator = ({ nodes, edges, pageId, onSimStatus }) => {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [failures, setFailures] = useState({});
  const [degraded, setDegraded] = useState({});
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const intervalRef = useRef(null);

  const pageNodes = useMemo(() => nodes.filter((n) => n.pageId === pageId), [nodes, pageId]);
  const pageEdges = useMemo(() => edges.filter((e) => e.pageId === pageId), [edges, pageId]);

  const addLog = useCallback((msg) => {
    setLogs((l) => [{ time: new Date().toLocaleTimeString(), msg }, ...l].slice(0, 40));
  }, []);

  const computeStatus = useCallback(() => {
    const byId = {};
    for (const n of pageNodes) byId[n.id] = n;

    // effective state per node: 'down' if failed or unreachable through impact
    const state = {};
    const queue = {};
    for (const n of pageNodes) {
      state[n.id] = failures[n.id] ? 'down' : degraded[n.id] ? 'degraded' : 'ok';
      queue[n.id] = 0;
    }

    // propagate failures across sync edges (async edges buffer instead)
    const syncOut = new Map();
    const asyncOut = new Map();
    const inEdges = new Map();
    for (const e of pageEdges) {
      if (!byId[e.source] || !byId[e.target]) continue;
      if (!syncOut.has(e.source)) syncOut.set(e.source, []);
      if (!asyncOut.has(e.source)) asyncOut.set(e.source, []);
      if (!inEdges.has(e.target)) inEdges.set(e.target, []);
      if (e.syncMode === 'async') asyncOut.get(e.source).push(e.target);
      else syncOut.get(e.source).push(e.target);
      inEdges.get(e.target).push(e);
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const n of pageNodes) {
        if (state[n.id] === 'down') continue;
        const impactedBySync = (syncOut.get(n.id) || []).some((t) => state[t] === 'down');
        if (impactedBySync) {
          state[n.id] = 'down';
          changed = true;
        }
      }
    }

    // traffic + load
    const totalIn = {};
    for (const e of pageEdges) {
      if (!byId[e.target] || !byId[e.source]) continue;
      const rps = e.traffic?.peakRps || e.traffic?.rps || 0;
      totalIn[e.target] = (totalIn[e.target] || 0) + rps;
      // buffer in async queue when the target is down
      if (state[e.target] === 'down') queue[e.target] = (queue[e.target] || 0) + rps * 3;
    }

    const newStats = {};
    for (const n of pageNodes) {
      const rps = totalIn[n.id] || 0;
      let load = 0;
      let status = state[n.id];
      let note = '';
      const props = n.properties || {};

      if (status === 'ok' || status === 'degraded') {
        const cap =
          n.category === 'databases'
            ? Math.max(Number(props.writesPerSec) || 0, Number(props.readsPerSec) || 0, 10000)
            : n.category === 'messaging'
              ? Number(props.throughput) || 10000
              : (Number(props.instances) || 1) * 2000;
        load = Math.min(100, (rps / cap) * 100 + (queue[n.id] > 0 ? 15 : 0));
        if (status === 'degraded') load = Math.min(100, load + 25);
        if (load >= 95 && status === 'ok') {
          status = 'overloaded';
          note = 'Overloaded';
        }
        if (queue[n.id] > 0 && status === 'ok') {
          note = `${fmt(queue[n.id])} in async buffer`;
        }
        if (load >= 70 && status === 'ok') note = 'Elevated load';
      }
      if (status === 'down') note = 'Down';
      if (status === 'degraded') note = 'Degraded';

      newStats[n.id] = {
        status,
        load: Math.round(load),
        rps: Math.round(rps),
        note,
        downstream: (asyncOut.get(n.id) || []).filter((t) => state[t] === 'ok').length,
        buffered: queue[n.id] ? Math.round(queue[n.id]) : 0,
      };
    }

    setStats(newStats);
    onSimStatus?.(Object.fromEntries(Object.entries(newStats).map(([id, s]) => [id, s.status])));
    return newStats;
  }, [pageNodes, pageEdges, failures, degraded, onSimStatus]);

  const step = useCallback(() => {
    const s = computeStatus();
    setTick((t) => t + 1);
    const down = Object.values(s).filter((v) => v.status === 'down' || v.status === 'overloaded');
    if (tick % 5 === 0 && down.length) {
      addLog(`${down.length} component${down.length !== 1 ? 's' : ''} impacted — ${down.map((d) => d.note).join(', ')}`);
    }
    return s;
  }, [computeStatus, tick, addLog]);

  useEffect(() => {
    if (running) {
      computeStatus();
      intervalRef.current = setInterval(() => {
        step();
        // adjust interval by speed
        if (speed !== 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(step, Math.max(120, 600 / speed));
        }
      }, 600 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [running, speed, step, computeStatus]);

  const toggleFailure = (id, name) => {
    setFailures((f) => {
      const next = { ...f };
      if (next[id]) {
        delete next[id];
        addLog(`Recovered ${name} — traffic restored`);
      } else {
        next[id] = true;
        addLog(`Chaos injected: ${name} is DOWN`);
      }
      return next;
    });
  };

  const toggleDegrade = (id, name) => {
    setDegraded((d) => {
      const next = { ...d };
      if (next[id]) {
        delete next[id];
        addLog(`Recovered ${name} — full capacity`);
      } else {
        next[id] = true;
        addLog(`Chaos injected: ${name} degraded (high latency)`);
      }
      return next;
    });
  };

  const reset = () => {
    setFailures({});
    setDegraded({});
    setStats({});
    onSimStatus?.({});
    setLogs([]);
    setTick(0);
  };

  const statusMeta = {
    ok: { cls: 'text-green-500 border-green-500/30 bg-green-500/10', bar: 'bg-green-500', label: 'Healthy' },
    degraded: { cls: 'text-amber-500 border-amber-500/30 bg-amber-500/10', bar: 'bg-amber-500', label: 'Degraded' },
    overloaded: { cls: 'text-orange-500 border-orange-500/30 bg-orange-500/10', bar: 'bg-orange-500', label: 'Overloaded' },
    down: { cls: 'text-red-500 border-red-500/30 bg-red-500/10', bar: 'bg-red-500', label: 'Down' },
  };

  const downCount = Object.values(stats).filter((s) => s.status === 'down' || s.status === 'overloaded').length;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <FlaskConical size={13} className="text-primary" /> Chaos & traffic simulator
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Fire failures and watch cascading impact across sync dependencies; async edges buffer traffic instead.
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {!running ? (
            <button
              type="button"
              onClick={() => {
                setRunning(true);
                addLog('Simulation started');
              }}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Play size={11} /> Run
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                addLog('Simulation paused');
              }}
              className="flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <Square size={11} /> Pause
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={11} /> Reset
          </button>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5">
            <Zap size={10} className="text-amber-500" />
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-transparent text-[10px] text-muted-foreground focus:outline-none"
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>
          {running && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-500">
              <Activity size={10} className="animate-pulse" /> {tick}
            </span>
          )}
        </div>
        {running && downCount > 0 && (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500">
            {downCount} component{downCount !== 1 ? 's' : ''} currently impacted
          </div>
        )}
      </div>

      <div className="flex-1 p-2">
        <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Failover controls
        </div>
        <div className="space-y-1">
          {pageNodes.map((n) => {
            const s = stats[n.id];
            const meta = s ? statusMeta[s.status] : statusMeta.ok;
            return (
              <div key={n.id} className="rounded-lg border border-border/50 bg-card/60 p-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', failures[n.id] ? 'bg-red-500' : degraded[n.id] ? 'bg-amber-500' : 'bg-green-500')}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">{n.name}</span>
                  {s && (
                    <span className={cn('rounded-full border px-1.5 text-[8px] font-bold uppercase', meta.cls)}>{meta.label}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFailure(n.id, n.name)}
                    className={cn(
                      'flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-medium',
                      failures[n.id]
                        ? 'border-red-500/40 bg-red-500/10 text-red-500'
                        : 'border-border/60 text-muted-foreground hover:border-red-500/40 hover:text-red-500'
                    )}
                  >
                    <Power size={8} /> {failures[n.id] ? 'Recover' : 'Kill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDegrade(n.id, n.name)}
                    className={cn(
                      'flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px] font-medium',
                      degraded[n.id]
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                        : 'border-border/60 text-muted-foreground hover:border-amber-500/40 hover:text-amber-500'
                    )}
                    title="Degrade: simulate high latency"
                  >
                    <Activity size={8} /> {degraded[n.id] ? 'Fix' : 'Degrade'}
                  </button>
                </div>
                {s && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', meta.bar)}
                        style={{ width: `${Math.min(100, s.load)}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right font-mono text-[9px] text-muted-foreground">{s.load}%</span>
                  </div>
                )}
                {s?.note && s.status !== 'ok' && (
                  <div className="mt-1 text-[9px] font-medium text-muted-foreground">{s.note}</div>
                )}
                {s?.buffered > 0 && (
                  <div className="mt-0.5 text-[9px] text-violet-400">Buffered: {fmt(s.buffered)} msgs awaiting recovery</div>
                )}
              </div>
            );
          })}
          {pageNodes.length === 0 && <p className="p-3 text-center text-[10px] text-muted-foreground">No components on this page.</p>}
        </div>

        <div className="mt-3 mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Event log</div>
        <div className="space-y-0.5">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-1.5 rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] leading-relaxed text-muted-foreground">
              <span className="shrink-0 text-foreground/40">{l.time}</span>
              <span>{l.msg}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="px-1 text-[10px] text-muted-foreground/60">Start the simulation to begin logging events.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChaosSimulator;
