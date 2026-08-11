import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, Trash2, Plus, X, SlidersHorizontal, Network, Boxes, FileText } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { CATALOG_PART_A } from '../constants/componentCatalogA';
import { CATALOG_PART_B } from '../constants/componentCatalogB';
import {
  getComponentDef,
  getPropertyFields,
  groupFields,
  CATEGORY_MAP,
  ARCH_LEVELS,
  BOUNDARY_TYPES,
  CONNECTION_TYPES,
  PROTOCOLS,
  BACKOFF_OPTIONS,
} from '../constants/architecture';
import { cn } from '@/lib/utils';

const CATALOG = [...CATALOG_PART_A, ...CATALOG_PART_B];

const inputCls =
  'w-full rounded-md border border-border/50 bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none';

// ───────────────────────── generic field renderer ─────────────────────────
const FieldRow = ({ field, value, onChange, onBlur }) => {
  const { key, label, type } = field;

  if (type === 'toggle') {
    return (
      <button
        type="button"
        onClick={() => onChange(key, !value)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-muted/40"
      >
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            'relative h-4 w-7 shrink-0 rounded-full transition-colors',
            value ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
              value ? 'left-3.5' : 'left-0.5'
            )}
          />
        </span>
      </button>
    );
  }

  if (type === 'select') {
    return (
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <select value={value ?? ''} onChange={(e) => onChange(key, e.target.value)} onBlur={onBlur} className={inputCls}>
          <option value="">—</option>
          {(field.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }

  if (type === 'textarea') {
    return (
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <textarea
          rows={2}
          value={value ?? ''}
          onChange={(e) => onChange(key, e.target.value)}
          onBlur={onBlur}
          className={cn(inputCls, 'resize-none')}
        />
      </label>
    );
  }

  if (type === 'tags') {
    const list = Array.isArray(value) ? value : value ? String(value).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const [draft, setDraft] = useState('');
    return (
      <div>
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="flex flex-wrap gap-1">
          {list.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
              {tag}
              <button
                type="button"
                onClick={() => onChange(key, list.filter((t) => t !== tag))}
                className="hover:text-destructive"
              >
                <X size={9} />
              </button>
            </span>
          ))}
          <input
            value={draft}
            placeholder="+tag"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                e.preventDefault();
                onChange(key, [...list, draft.trim()]);
                setDraft('');
              }
            }}
            onBlur={() => {
              if (draft.trim()) {
                onChange(key, [...list, draft.trim()]);
                setDraft('');
              }
            }}
            className="w-20 rounded border border-border/50 bg-background px-1 py-0.5 text-[10px]"
          />
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type={type === 'number' ? 'number' : 'text'}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value ?? ''}
        onChange={(e) => onChange(key, type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        onBlur={onBlur}
        className={inputCls}
      />
    </label>
  );
};

// ───────────────────────── arbitrary key/value property editor ─────────────────────────
const CustomPropertiesEditor = ({ properties, onChange }) => {
  const [keyDraft, setKeyDraft] = useState('');
  const [valDraft, setValDraft] = useState('');

  const parse = (str) => {
    const s = str.trim();
    if (s.toLowerCase() === 'true') return true;
    if (s.toLowerCase() === 'false') return false;
    if (s !== '' && !isNaN(Number(s))) return Number(s);
    if (s.startsWith('[') || s.startsWith('{')) {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return s;
  };

  const entries = Object.entries(properties || {}).filter(
    ([k]) => !['region', 'availabilityZone', 'tags', 'notes'].includes(k)
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Custom properties</span>
        <button
          type="button"
          onClick={() => {
            if (keyDraft.trim()) {
              onChange({ ...(properties || {}), [keyDraft.trim()]: parse(valDraft) });
              setKeyDraft('');
              setValDraft('');
            }
          }}
          className="flex items-center gap-1 rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10"
        >
          <Plus size={9} /> Add
        </button>
      </div>
      <div className="mb-2 flex gap-1">
        <input
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder="key"
          className={cn(inputCls, 'w-1/2 font-mono')}
        />
        <input
          value={valDraft}
          onChange={(e) => setValDraft(e.target.value)}
          placeholder="value (auto-typed)"
          className={cn(inputCls, 'w-1/2 font-mono')}
        />
      </div>
      <div className="space-y-0.5">
        {entries.map(([k, v]) => (
          <div key={k} className="group flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">{k}</span>
            <span className="max-w-[40%] truncate font-mono text-[10px] text-muted-foreground">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = { ...properties };
                delete next[k];
                onChange(next);
              }}
              className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-[10px] text-muted-foreground/70">No custom properties. Add any key used by your design (e.g. uniqueAliases, tiers).</p>
        )}
      </div>
    </div>
  );
};

// ───────────────────────── panel shell + editors ─────────────────────────
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {Icon && <Icon size={11} />}
        <span className="flex-1">{title}</span>
        <span className="text-muted-foreground/50">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
};

const NodeEditor = ({ node, customComponents, onChange }) => {
  const [customProperties, setCustomProperties] = useState(null);
  const allDefs = [...CATALOG, ...customComponents];
  const categories = [...new Set(allDefs.map((d) => d.category))];
  const def = getComponentDef(node.type) || {};
  const Icon = getIcon(def.icon || node.metadata?.icon);

  const setProp = (key, value) => onChange({ properties: { ...node.properties, [key]: value } });
  const setCustom = (next) => {
    setCustomProperties(next);
    onChange({ properties: next });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-start gap-2 border-b border-border/40 p-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: node.style?.color || def.color || CATEGORY_MAP[node.category]?.color || '#6366f1' }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{node.name}</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">{node.type}</div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange({ locked: !node.locked })}
            className={cn('rounded p-1', node.locked ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            title={node.locked ? 'Unlock' : 'Lock'}
          >
            {node.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button
            type="button"
            onClick={() => onChange({ hidden: !node.hidden })}
            className={cn('rounded p-1', node.hidden ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
            title={node.hidden ? 'Show' : 'Hide'}
          >
            {node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>

      <Section title="General" icon={SlidersHorizontal}>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Name</span>
          <input value={node.name || ''} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Description</span>
          <textarea rows={2} value={node.description || ''} onChange={(e) => onChange({ description: e.target.value })} className={cn(inputCls, 'resize-none')} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Type</span>
          <select
            value={node.type}
            onChange={(e) => onChange({ type: e.target.value, category: String(e.target.value).split('.')[0] })}
            className={inputCls}
          >
            {categories.map((cat) => (
              <optgroup key={cat} label={CATEGORY_MAP[cat]?.label || cat}>
                {allDefs.filter((d) => d.category === cat).map((d) => (
                  <option key={d.type} value={d.type}>{d.label} — {d.type}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Accent color</span>
          <input
            type="color"
            value={node.style?.color || def.color || '#6366f1'}
            onChange={(e) => onChange({ style: { ...(node.style || {}), color: e.target.value } })}
            className="h-7 w-full cursor-pointer rounded border border-border/50 bg-background"
          />
        </label>
      </Section>

      <Section title="Properties" icon={SlidersHorizontal} defaultOpen={false}>
        {groupFields(getPropertyFields(node.type)).map(({ group, fields }) => (
          <div key={group} className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">{group}</div>
            {fields.map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                value={node.properties?.[f.key]}
                onChange={(k, v) => setProp(k, v)}
              />
            ))}
          </div>
        ))}
        <div className="pt-1">
          <CustomPropertiesEditor properties={customProperties ?? node.properties} onChange={setCustom} />
        </div>
      </Section>
    </div>
  );
};

const EdgeEditor = ({ edge, onChange }) => {
  const set = (patch) => onChange(patch);
  const setTraffic = (k, v) => set({ traffic: { ...edge.traffic, [k]: v } });
  const setLatency = (k, v) => set({ latency: { ...edge.latency, [k]: v } });

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border/40 p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Network size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">Connection</div>
          <div className="truncate font-mono text-[10px] text-muted-foreground">{edge.source} → {edge.target}</div>
        </div>
      </div>

      <Section title="Protocol" icon={SlidersHorizontal}>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Protocol</span>
          <select value={edge.protocol || 'REST'} onChange={(e) => set({ protocol: e.target.value })} className={inputCls}>
            {PROTOCOLS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Connection type</span>
          <select value={edge.connectionType || 'HTTP'} onChange={(e) => set({ connectionType: e.target.value })} className={inputCls}>
            {CONNECTION_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Direction</span>
          <select value={edge.direction || 'one-way'} onChange={(e) => set({ direction: e.target.value })} className={inputCls}>
            <option value="one-way">One-way</option>
            <option value="bidirectional">Bidirectional</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sync mode</span>
          <select value={edge.syncMode || 'sync'} onChange={(e) => set({ syncMode: e.target.value })} className={inputCls}>
            <option value="sync">Synchronous</option>
            <option value="async">Asynchronous</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Label</span>
          <input value={edge.label || ''} onChange={(e) => set({ label: e.target.value })} className={inputCls} placeholder="e.g. POST /api/orders" />
        </label>
      </Section>

      <Section title="Traffic" icon={SlidersHorizontal} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          <FieldRow field={{ key: 'rps', label: 'RPS', type: 'number', min: 0 }} value={edge.traffic?.rps} onChange={(k, v) => setTraffic(k, v)} />
          <FieldRow field={{ key: 'peakRps', label: 'Peak RPS', type: 'number', min: 0 }} value={edge.traffic?.peakRps} onChange={(k, v) => setTraffic(k, v)} />
          <FieldRow field={{ key: 'p50', label: 'P50 (ms)', type: 'number', min: 0 }} value={edge.latency?.p50} onChange={(k, v) => setLatency(k, v)} />
          <FieldRow field={{ key: 'p95', label: 'P95 (ms)', type: 'number', min: 0 }} value={edge.latency?.p95} onChange={(k, v) => setLatency(k, v)} />
          <FieldRow field={{ key: 'p99', label: 'P99 (ms)', type: 'number', min: 0 }} value={edge.latency?.p99} onChange={(k, v) => setLatency(k, v)} />
        </div>
        <FieldRow field={{ key: 'payload', label: 'Payload (KB)', type: 'number', min: 0 }} value={edge.payload} onChange={(k, v) => set({ [k]: v })} />
      </Section>

      <Section title="Reliability" icon={SlidersHorizontal} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          <FieldRow field={{ key: 'timeout', label: 'Timeout (s)', type: 'number', min: 0 }} value={edge.timeout} onChange={(k, v) => set({ [k]: v })} />
          <FieldRow field={{ key: 'retry', label: 'Retries', type: 'number', min: 0 }} value={edge.retry} onChange={(k, v) => set({ [k]: v })} />
        </div>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Backoff</span>
          <select value={edge.backoff || 'none'} onChange={(e) => set({ backoff: e.target.value })} className={inputCls}>
            {BACKOFF_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <FieldRow field={{ key: 'circuitBreaker', label: 'Circuit breaker', type: 'toggle' }} value={edge.circuitBreaker} onChange={(k, v) => set({ [k]: v })} />
      </Section>
    </div>
  );
};

const GroupEditor = ({ group, onChange }) => (
  <div className="flex h-full flex-col overflow-y-auto">
    <div className="flex items-center gap-2 border-b border-border/40 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Boxes size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">Boundary</div>
        <div className="truncate text-[10px] text-muted-foreground">Group of components</div>
      </div>
    </div>
    <Section title="General" icon={SlidersHorizontal}>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Name</span>
        <input value={group.name || ''} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Boundary type</span>
        <select value={group.boundaryType || 'logical'} onChange={(e) => onChange({ boundaryType: e.target.value })} className={inputCls}>
          {BOUNDARY_TYPES.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Color</span>
        <input
          type="color"
          value={group.color || '#64748b'}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-7 w-full cursor-pointer rounded border border-border/50 bg-background"
        />
      </label>
    </Section>
  </div>
);

const PageEditor = ({ page, onChange }) => (
  <div className="flex h-full flex-col overflow-y-auto">
    <div className="flex items-center gap-2 border-b border-border/40 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">Page</div>
        <div className="truncate text-[10px] text-muted-foreground">{page.nodes.length} nodes · {page.edges.length} connections</div>
      </div>
    </div>
    <Section title="General" icon={SlidersHorizontal}>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Name</span>
        <input value={page.name || ''} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Level</span>
        <select value={page.level || 'hld'} onChange={(e) => onChange({ level: e.target.value })} className={inputCls}>
          {ARCH_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </label>
    </Section>
  </div>
);

const EmptyEditor = () => (
  <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
    <SlidersHorizontal size={22} className="opacity-40" />
    <p className="text-xs">Select a component, connection, boundary, or page to edit its properties.</p>
    <p className="text-[10px] opacity-70">Tip: double-click a node to select it, then edit here.</p>
  </div>
);

const PropertiesPanel = ({
  selectedNodeIds,
  selectedEdgeId,
  selectedGroupId,
  pageId,
  nodesById,
  edgesById,
  groupsById,
  page,
  customComponents,
  onUpdateNode,
  onUpdateEdge,
  onUpdateGroup,
  onUpdatePage,
  onDeleteSelection,
  showDelete = true,
}) => {
  if (selectedNodeIds.length === 1) {
    const node = nodesById[selectedNodeIds[0]];
    if (node) {
      return (
        <div className="flex h-full flex-col">
          <NodeEditor
            key={node.id}
            node={node}
            customComponents={customComponents}
            onChange={(patch) => onUpdateNode(node.id, patch)}
          />
          {showDelete && (
            <div className="border-t border-border/40 p-2">
              <button
                type="button"
                onClick={() => onDeleteSelection()}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 size={12} /> Delete component
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  if (selectedNodeIds.length > 1) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
        {selectedNodeIds.length} components selected — properties are read-only in multi-select. Use the toolbar for group/delete.
      </div>
    );
  }

  if (selectedEdgeId && edgesById[selectedEdgeId]) {
    const edge = edgesById[selectedEdgeId];
    return (
      <div className="flex h-full flex-col">
        <EdgeEditor key={edge.id} edge={edge} onChange={(patch) => onUpdateEdge(edge.id, patch)} />
        {showDelete && (
          <div className="border-t border-border/40 p-2">
            <button
              type="button"
              onClick={() => onDeleteSelection()}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              <Trash2 size={12} /> Delete connection
            </button>
          </div>
        )}
      </div>
    );
  }

  if (selectedGroupId && groupsById[selectedGroupId]) {
    const group = groupsById[selectedGroupId];
    return (
      <div className="flex h-full flex-col">
        <GroupEditor key={group.id} group={group} onChange={(patch) => onUpdateGroup(group.id, patch)} />
        {showDelete && (
          <div className="border-t border-border/40 p-2">
            <button
              type="button"
              onClick={() => onDeleteSelection()}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              <Trash2 size={12} /> Delete boundary
            </button>
          </div>
        )}
      </div>
    );
  }

  if (pageId && page) {
    return <PageEditor key={page.pageId} page={page} onChange={(patch) => onUpdatePage(page, patch)} />;
  }

  return <EmptyEditor />;
};

export default PropertiesPanel;
