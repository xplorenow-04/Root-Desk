import { useMemo } from 'react';
import { Gauge, CircleAlert, Server, Activity } from 'lucide-react';
import { getComponentDef } from '../constants/architecture';
import { cn } from '@/lib/utils';

const fmt = (n) => {
  if (!isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
};

const inputCls =
  'w-full rounded-md border border-border/50 bg-background px-2 py-1 text-xs focus:border-primary/50 focus:outline-none';

const INPUTS = [
  { key: 'totalUsers', label: 'Total users' },
  { key: 'dailyActiveUsers', label: 'Daily active users' },
  { key: 'requestsPerUserPerDay', label: 'Requests / user / day' },
  { key: 'peakToAverageRatio', label: 'Peak-to-average ratio' },
  { key: 'averageRequestSizeKb', label: 'Avg request size (KB)' },
  { key: 'readWriteRatio', label: 'Reads per write' },
  { key: 'growthRatePercent', label: 'Monthly growth (%)' },
  { key: 'storageRetentionMonths', label: 'Retention (months)' },
];

/**
 * Capacity estimation panel. Edits the design-level capacity inputs and
 * estimates per-component load from edge traffic, flagging undersized nodes.
 */
const CapacityPanel = ({ capacityInputs, onUpdateInputs, nodes, edges, pageId }) => {
  const pageEdges = useMemo(() => edges.filter((e) => e.pageId === pageId), [edges, pageId]);
  const pageNodes = useMemo(() => nodes.filter((n) => n.pageId === pageId), [nodes, pageId]);

  const totalUsers = Number(capacityInputs?.totalUsers) || 0;
  const dau = Number(capacityInputs?.dailyActiveUsers) || Math.max(1, totalUsers * 0.2);
  const reqPerUser = Number(capacityInputs?.requestsPerUserPerDay) || 100;
  const peakRatio = Number(capacityInputs?.peakToAverageRatio) || 3;
  const avgKb = Number(capacityInputs?.averageRequestSizeKb) || 20;
  const rwRatio = Number(capacityInputs?.readWriteRatio) || 10;

  const avgRps = (dau * reqPerUser) / 86400;
  const peakRps = avgRps * peakRatio;

  const estimates = useMemo(() => {
    return pageNodes.map((n) => {
      const incoming = pageEdges
        .filter((e) => e.target === n.id)
        .reduce((s, e) => s + (e.traffic?.peakRps || e.traffic?.rps || 0), 0);
      const outgoing = pageEdges
        .filter((e) => e.source === n.id)
        .reduce((s, e) => s + (e.traffic?.peakRps || e.traffic?.rps || 0), 0);
      const traffic = Math.max(incoming, outgoing);
      const def = getComponentDef(n.type) || {};
      const category = n.category;
      let detail = '';
      let concern = null;

      if (['compute', 'application-services', 'custom'].includes(category)) {
        const instances = Number(n.properties?.instances) || 1;
        const perInst = traffic / Math.max(1, instances);
        detail = `~${fmt(perInst)} rps/instance x ${instances}`;
        if (traffic > 0 && perInst > 2000) concern = 'Per-instance load is high — scale out.';
        else if (traffic > 0 && perInst > 500 && !n.properties?.autoScaling) concern = 'Consider enabling auto scaling.';
      } else if (category === 'databases') {
        const w = Math.max(Number(n.properties?.writesPerSec) || 0, traffic / (rwRatio + 1));
        const r = Math.max(Number(n.properties?.readsPerSec) || 0, (traffic * rwRatio) / (rwRatio + 1));
        detail = `~${fmt(r)} reads/s · ~${fmt(w)} writes/s`;
        if (traffic > 0 && (r > 15000 || w > 5000)) concern = 'May exceed single-node capacity — shard or replicate.';
      } else if (category === 'messaging') {
        const throughput = Number(n.properties?.throughput) || 0;
        detail = `~${fmt(traffic)} msg/s${throughput ? ` · cap ${fmt(throughput)}` : ''}`;
        if (traffic > 0 && throughput > 0 && traffic > throughput) concern = 'Estimated throughput exceeds capacity.';
      } else if (category === 'storage') {
        const gbPerDay = (traffic * avgKb) / (1024 * 1024);
        const months = Number(capacityInputs?.storageRetentionMonths) || 12;
        const totalTB = (gbPerDay * 30 * months) / 1024;
        detail = `~${fmt(gbPerDay)} GB/day · ~${fmt(totalTB)} TB over ${months}mo`;
      } else if (category === 'networking') {
        detail = traffic > 0 ? `~${fmt(traffic)} rps` : '';
      } else if (category === 'clients') {
        detail = `~${fmt(dau)} DAU · ~${fmt(peakRps)} peak rps`;
      }

      return { node: n, def, traffic, detail, concern };
    });
  }, [pageNodes, pageEdges, avgKb, rwRatio, dau, peakRps, capacityInputs]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Gauge size={13} className="text-primary" /> Capacity inputs
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Global assumptions drive the estimates below.</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {INPUTS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-0.5 block truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</span>
              <input
                type="number"
                min={0}
                step="any"
                value={capacityInputs?.[f.key] ?? ''}
                onChange={(e) =>
                  onUpdateInputs({ ...(capacityInputs || {}), [f.key]: e.target.value === '' ? '' : Number(e.target.value) })
                }
                className={inputCls}
              />
            </label>
          ))}
        </div>
        {dau > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg border border-border/40 bg-muted/30 p-2 text-center">
            <div>
              <div className="text-sm font-bold text-foreground">{fmt(avgRps)}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">avg rps</div>
            </div>
            <div>
              <div className="text-sm font-bold text-primary">{fmt(peakRps)}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">peak rps</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-2">
        <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Server size={10} /> Component estimates
        </div>
        <div className="space-y-1">
          {estimates.map(({ node, def, traffic, detail, concern }) => (
            <div key={node.id} className="rounded-lg border border-border/50 bg-card/60 p-2">
              <div className="flex items-center gap-1.5">
                <Activity size={11} className={cn('shrink-0', traffic > 0 ? 'text-primary' : 'text-muted-foreground/40')} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">{node.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{detail}</span>
              </div>
              {concern && (
                <div className="mt-1 flex items-start gap-1 rounded bg-amber-500/10 px-1.5 py-1 text-[10px] leading-snug text-amber-600">
                  <CircleAlert size={10} className="mt-px shrink-0" /> {concern}
                </div>
              )}
            </div>
          ))}
          {estimates.length === 0 && (
            <p className="p-4 text-center text-[10px] text-muted-foreground">No components on this page.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapacityPanel;
