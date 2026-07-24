import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  X, Settings, Variable, Key, Trash2, ChevronDown, ChevronUp, Plus,
  Minus, Maximize2, Minimize2, GripVertical, Eye, EyeOff, Shield,
  Palette, Zap, CheckCircle2, Code, FileText, LogIn, LogOut,
  GitCompare, ListChecks, Play, GripHorizontal,
} from 'lucide-react';
import { NODE_TYPES, ACTION_OPTIONS, PAGE_OPTIONS, NOTIFICATION_OPTIONS, DELAY_OPTIONS, VARIABLE_TYPES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

// ── localStorage persistence keys ──
const STORAGE_KEYS = {
  width: 'flow-config-panel-width',
  tab: 'flow-config-panel-tab',
  collapsed: 'flow-config-panel-collapsed',
  scrollTop: 'flow-config-panel-scroll',
  autoHide: 'flow-config-panel-autohide',
};

const persist = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const restore = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

// ── Config sub-components ──

const PageConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Page</label>
      <select
        value={config?.page || ''}
        onChange={(e) => onChange({ ...config, page: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <option value="">Select page...</option>
        {PAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

const ActionConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Action</label>
      <select
        value={config?.action || ''}
        onChange={(e) => onChange({ ...config, action: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <option value="">Select action...</option>
        {ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Parameters (JSON)</label>
      <textarea
        value={JSON.stringify(config?.actionParams || {}, null, 2)}
        onChange={(e) => {
          try { onChange({ ...config, actionParams: JSON.parse(e.target.value) }); }
          catch { /* allow editing */ }
        }}
        rows={4}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
  </div>
);

const DecisionConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Condition</label>
      <input
        type="text"
        value={config?.condition || ''}
        onChange={(e) => onChange({ ...config, condition: e.target.value })}
        placeholder="e.g. role == 'admin'"
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expression</label>
      <textarea
        value={config?.conditionExpression || ''}
        onChange={(e) => onChange({ ...config, conditionExpression: e.target.value })}
        placeholder="e.g. user.role === 'admin' ? 'dashboard' : 'access_denied'"
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
      <span className="text-[10px] text-amber-500">Connect "Yes" and "No" handles to different nodes</span>
    </div>
  </div>
);

const ApiConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Method</label>
        <select
          value={config?.apiMethod || 'GET'}
          onChange={(e) => onChange({ ...config, apiMethod: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex-[2]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endpoint</label>
        <input
          type="text"
          value={config?.apiEndpoint || ''}
          onChange={(e) => onChange({ ...config, apiEndpoint: e.target.value })}
          placeholder="/api/endpoint"
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Headers (JSON)</label>
      <textarea
        value={JSON.stringify(Object.fromEntries(config?.apiHeaders || new Map()), null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            const map = new Map(Object.entries(parsed));
            onChange({ ...config, apiHeaders: map });
          } catch { }
        }}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Body (JSON)</label>
      <textarea
        value={JSON.stringify(config?.apiBody || {}, null, 2)}
        onChange={(e) => {
          try { onChange({ ...config, apiBody: JSON.parse(e.target.value) }); }
          catch { }
        }}
        rows={4}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
  </div>
);

const DelayConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Duration</label>
        <input
          type="number"
          min={1}
          value={config?.delay || 5}
          onChange={(e) => onChange({ ...config, delay: parseInt(e.target.value) || 5 })}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Unit</label>
        <select
          value={config?.delayUnit || 'seconds'}
          onChange={(e) => onChange({ ...config, delayUnit: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {DELAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

const NotificationConfig = ({ config, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
      <select
        value={config?.notificationType || 'toast'}
        onChange={(e) => onChange({ ...config, notificationType: e.target.value })}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {NOTIFICATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
      <input
        type="text"
        value={config?.notificationTitle || ''}
        onChange={(e) => onChange({ ...config, notificationTitle: e.target.value })}
        placeholder="Notification title"
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
    </div>
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
      <textarea
        value={config?.notificationMessage || ''}
        onChange={(e) => onChange({ ...config, notificationMessage: e.target.value })}
        placeholder="Notification message"
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
  </div>
);

const configComponents = {
  page: PageConfig,
  action: ActionConfig,
  decision: DecisionConfig,
  condition_expression: DecisionConfig,
  api: ApiConfig,
  delay: DelayConfig,
  notification: NotificationConfig,
  notification_email: NotificationConfig,
  notification_sms: NotificationConfig,
  notification_push: NotificationConfig,
  notification_whatsapp: NotificationConfig,
};

// ── Tab definitions ──
const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'config', label: 'Config', icon: Code },
  { id: 'inputs', label: 'Inputs', icon: LogIn },
  { id: 'outputs', label: 'Outputs', icon: LogOut },
  { id: 'conditions', label: 'Conditions', icon: GitCompare },
  { id: 'variables', label: 'Variables', icon: Variable },
  { id: 'validation', label: 'Validation', icon: CheckCircle2 },
  { id: 'execution', label: 'Execution', icon: Play },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'advanced', label: 'Advanced', icon: Zap },
];

// ── Main panel component ──
const NodeConfigPanel = ({ node, onUpdate, onDelete, onClose, onMinimize }) => {
  const nodeType = node?.data?.nodeType;
  const typeConfig = NODE_TYPES[nodeType];
  const Icon = typeConfig?.icon;

  // ── Persisted state ──
  const [panelWidth, setPanelWidth] = useState(() => restore(STORAGE_KEYS.width, 320));
  const [isCollapsed, setIsCollapsed] = useState(() => restore(STORAGE_KEYS.collapsed, false));
  const [activeTab, setActiveTab] = useState(() => restore(STORAGE_KEYS.tab, 'general'));
  const [autoHide, setAutoHide] = useState(() => restore(STORAGE_KEYS.autoHide, false));

  // ── Node data state ──
  const [label, setLabel] = useState(node?.data?.label || '');
  const [config, setConfig] = useState(node?.data?.config || {});
  const [variables, setVariables] = useState(node?.data?.variables || []);
  const [description, setDescription] = useState(node?.data?.metadata?.description || '');

  // ── Refs ──
  const scrollRef = useRef(null);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const panelRef = useRef(null);

  // ── Sync node data when selected node changes ──
  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setConfig(node.data?.config || {});
      setVariables(node.data?.variables || []);
      setDescription(node.data?.metadata?.description || '');
      setIsCollapsed(false);
    }
  }, [node?.id]);

  // ── Persist state ──
  useEffect(() => { persist(STORAGE_KEYS.width, panelWidth); }, [panelWidth]);
  useEffect(() => { persist(STORAGE_KEYS.tab, activeTab); }, [activeTab]);
  useEffect(() => { persist(STORAGE_KEYS.collapsed, isCollapsed); }, [isCollapsed]);
  useEffect(() => { persist(STORAGE_KEYS.autoHide, autoHide); }, [autoHide]);

  // ── Restore scroll position ──
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const saved = restore(STORAGE_KEYS.scrollTop, 0);
      el.scrollTop = saved;
    }
  }, [node?.id]);

  const saveScroll = useCallback(() => {
    if (scrollRef.current) {
      persist(STORAGE_KEYS.scrollTop, scrollRef.current.scrollTop);
    }
  }, []);

  // ── Keyboard: Escape closes ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !isCollapsed) {
        const activeElement = document.activeElement;
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName);
        if (!isInput) {
          handleHide();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCollapsed]);

  // ── Resize handlers ──
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    resizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (e) => {
      if (!resizing.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.max(260, Math.min(600, startWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const handleUp = () => {
      resizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [panelWidth]);

  // ── Hide (close via X): notify parent to unmount, keep node selected ──
  const handleHide = useCallback(() => {
    saveScroll();
    onMinimize?.();
  }, [saveScroll, onMinimize]);

  // ── Collapse to icon bar ──
  const handleCollapse = useCallback(() => {
    saveScroll();
    setIsCollapsed(true);
  }, [saveScroll]);

  // ── Expand from collapsed ──
  const handleExpand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  // ── Close and deselect ──
  const handleCloseAndDeselect = useCallback(() => {
    saveScroll();
    onClose?.();
    onMinimize?.();
  }, [saveScroll, onClose, onMinimize]);

  // ── Toggle auto-hide ──
  const toggleAutoHide = useCallback(() => {
    setAutoHide(prev => !prev);
  }, []);

  // ── Data handlers ──
  const handleLabelChange = (val) => {
    setLabel(val);
    onUpdate(node.id, { label: val });
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    onUpdate(node.id, { config: newConfig });
  };

  const handleDescriptionChange = (val) => {
    setDescription(val);
    onUpdate(node.id, { metadata: { ...node.data?.metadata, description: val } });
  };

  const addVariable = () => {
    const newVars = [...variables, { name: '', type: 'string', value: '' }];
    setVariables(newVars);
    onUpdate(node.id, { variables: newVars });
  };

  const updateVariable = (index, field, value) => {
    const newVars = variables.map((v, i) => i === index ? { ...v, [field]: value } : v);
    setVariables(newVars);
    onUpdate(node.id, { variables: newVars });
  };

  const removeVariable = (index) => {
    const newVars = variables.filter((_, i) => i !== index);
    setVariables(newVars);
    onUpdate(node.id, { variables: newVars });
  };

  if (!node) return null;

  // ── Collapsed bar ──
  if (isCollapsed) {
    return (
      <div
        ref={panelRef}
        className="border-l border-border/40 bg-card/50 backdrop-blur-sm flex flex-col items-center py-3 gap-2 transition-all duration-200 z-20"
        style={{ width: 40, minWidth: 40 }}
      >
        <button
          onClick={handleExpand}
          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
          title="Expand panel"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-muted/30" title={typeConfig?.label}>
            <Icon className="w-3.5 h-3.5" style={{ color: typeConfig?.color }} />
          </div>
        )}
        <div className="flex flex-col items-center gap-1 mt-auto">
          {TABS.slice(0, 6).map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); handleExpand(); }}
                className={cn(
                  'p-1 rounded-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
                title={tab.label}
              >
                <TabIcon className="w-3 h-3" />
              </button>
            );
          })}
        </div>
        <button
          onClick={handleCloseAndDeselect}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all mt-auto"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const ConfigComponent = configComponents[nodeType];

  return (
    <div
      ref={panelRef}
      className={cn(
        "border-l border-border/40 bg-card/70 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out relative overflow-hidden",
      )}
      style={{ width: panelWidth, minWidth: 260, maxWidth: 600 }}
    >
      {/* ── Resize handle (left edge) ── */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/30 transition-colors z-10 group"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0 bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: typeConfig?.color }} />}
          <span className="text-sm font-medium text-foreground truncate">
            {label || typeConfig?.label || 'Configure'}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Auto-hide toggle */}
          <button
            onClick={toggleAutoHide}
            className={cn(
              'p-1 rounded-lg transition-all',
              autoHide ? 'text-indigo-400 hover:bg-indigo-500/10' : 'text-muted-foreground hover:bg-muted/50'
            )}
            title={autoHide ? 'Auto-hide: ON (panel hides when node deselected)' : 'Auto-hide: OFF'}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          {/* Collapse button */}
          <button
            onClick={handleCollapse}
            className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
            title="Collapse to icon bar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {/* Close button */}
          <button
            onClick={handleHide}
            className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
            title="Close (keep node selected)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border/40 overflow-x-auto scrollbar-none shrink-0 bg-card/20">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 px-1.5 py-2 text-[10px] font-medium transition-all border-b-2 whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
              )}
              title={tab.label}
            >
              <TabIcon className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Scrollable content ── */}
      <div
        ref={scrollRef}
        onScroll={saveScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* ── General Tab ── */}
        {activeTab === 'general' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                backgroundColor: typeConfig?.color + '15',
                color: typeConfig?.color,
              }}>
                {typeConfig?.label || nodeType}
              </span>
              <span className="text-[10px] text-muted-foreground">ID: {node.id?.slice(0, 12)}...</span>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="What does this node do?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </>
        )}

        {/* ── Config Tab ── */}
        {activeTab === 'config' && (
          <>
            {ConfigComponent ? (
              <ConfigComponent config={config} onChange={handleConfigChange} />
            ) : (
              <div className="text-center py-6">
                <Code className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">No configuration needed for this node type</p>
              </div>
            )}
          </>
        )}

        {/* ── Inputs Tab ── */}
        {activeTab === 'inputs' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Input Handles</p>
            {typeConfig?.inputs?.length > 0 ? (
              typeConfig.inputs.map((input, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground font-medium">{input.label || `Input ${i + 1}`}</p>
                    <p className="text-[10px] text-muted-foreground">Type: {input.type || 'any'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <LogIn className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">This node type has no configurable inputs</p>
              </div>
            )}
          </div>
        )}

        {/* ── Outputs Tab ── */}
        {activeTab === 'outputs' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Output Handles</p>
            {typeConfig?.outputs?.length > 0 ? (
              typeConfig.outputs.map((output, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground font-medium">{output.label || `Output ${i + 1}`}</p>
                    <p className="text-[10px] text-muted-foreground">Type: {output.type || 'any'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Map to</label>
                    <input
                      type="text"
                      value={config?.[`output_${i}_map`] || ''}
                      onChange={(e) => handleConfigChange({ ...config, [`output_${i}_map`]: e.target.value })}
                      placeholder="variable name"
                      className="w-24 px-2 py-1 rounded bg-muted/50 border border-border/40 text-[10px] text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <LogOut className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">This node type has no configurable outputs</p>
              </div>
            )}
          </div>
        )}

        {/* ── Conditions Tab ── */}
        {activeTab === 'conditions' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Condition</label>
              <input
                type="text"
                value={config?.condition || ''}
                onChange={(e) => handleConfigChange({ ...config, condition: e.target.value })}
                placeholder="e.g. role == 'admin'"
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expression</label>
              <textarea
                value={config?.conditionExpression || ''}
                onChange={(e) => handleConfigChange({ ...config, conditionExpression: e.target.value })}
                placeholder="e.g. user.role === 'admin' ? 'dashboard' : 'access_denied'"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Variables Tab ── */}
        {activeTab === 'variables' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Node Variables</p>
              <button
                onClick={addVariable}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {variables.length === 0 ? (
              <div className="text-center py-4">
                <Variable className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">No variables defined</p>
              </div>
            ) : (
              variables.map((v, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariable(i, 'name', e.target.value)}
                    placeholder="name"
                    className="flex-1 px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <select
                    value={v.type}
                    onChange={(e) => updateVariable(i, 'type', e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
                  >
                    {VARIABLE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeVariable(i)}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Validation Tab ── */}
        {activeTab === 'validation' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Required Fields</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config?.required || false}
                    onChange={(e) => handleConfigChange({ ...config, required: e.target.checked })}
                    className="rounded border-border/40 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-xs text-foreground">Require this node to complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config?.validateInput || false}
                    onChange={(e) => handleConfigChange({ ...config, validateInput: e.target.checked })}
                    className="rounded border-border/40 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-xs text-foreground">Validate input before execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config?.validateOutput || false}
                    onChange={(e) => handleConfigChange({ ...config, validateOutput: e.target.checked })}
                    className="rounded border-border/40 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-xs text-foreground">Validate output after execution</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Validation Schema (JSON)</label>
              <textarea
                value={JSON.stringify(config?.validationSchema || {}, null, 2)}
                onChange={(e) => {
                  try { handleConfigChange({ ...config, validationSchema: JSON.parse(e.target.value) }); }
                  catch { }
                }}
                rows={4}
                placeholder='{"type": "object", "properties": {...}}'
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Execution Tab ── */}
        {activeTab === 'execution' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Execution Behavior</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Async Execution</span>
                  <button
                    onClick={() => handleConfigChange({ ...config, async: !config?.async })}
                    className={cn(
                      'px-3 py-1 rounded-lg text-[10px] font-medium transition-all',
                      config?.async
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    {config?.async ? 'Async' : 'Sync'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground">Timeout (ms)</span>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={config?.timeout || 30000}
                    onChange={(e) => handleConfigChange({ ...config, timeout: parseInt(e.target.value) || 30000 })}
                    className="w-24 px-2 py-1 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Retry Policy</p>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">Retries</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={config?.retry || 0}
                  onChange={(e) => handleConfigChange({ ...config, retry: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-2 py-1 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Permissions Tab ── */}
        {activeTab === 'permissions' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Allowed Roles</label>
              <div className="space-y-1.5">
                {['admin', 'teacher', 'student', 'parent', 'super_admin', 'guest'].map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config?.allowedRoles?.includes(role) || false}
                      onChange={(e) => {
                        const current = config?.allowedRoles || [];
                        const next = e.target.checked
                          ? [...current, role]
                          : current.filter(r => r !== role);
                        handleConfigChange({ ...config, allowedRoles: next });
                      }}
                      className="rounded border-border/40 text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <span className="text-xs text-foreground capitalize">{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Appearance Tab ── */}
        {activeTab === 'appearance' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Node Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={node.data?.metadata?.color || typeConfig?.color || '#6366f1'}
                  onChange={(e) => onUpdate(node.id, { metadata: { ...node.data?.metadata, color: e.target.value } })}
                  className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {node.data?.metadata?.color || typeConfig?.color || '#6366f1'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon Override</label>
              <input
                type="text"
                value={node.data?.metadata?.icon || ''}
                onChange={(e) => onUpdate(node.id, { metadata: { ...node.data?.metadata, icon: e.target.value } })}
                placeholder="lucide icon name"
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        )}

        {/* ── Advanced Tab ── */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Lock */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Lock Position</p>
                <p className="text-[10px] text-muted-foreground">Prevent accidental dragging</p>
              </div>
              <button
                onClick={() => onUpdate(node.id, { locked: !node.data?.locked })}
                className={cn(
                  'px-3 py-1 rounded-lg text-[10px] font-medium transition-all',
                  node.data?.locked
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                )}
              >
                {node.data?.locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>

            {/* Error handling */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Error Handling</p>
              {/* Retry and timeout are in the Execution tab */}
              <p className="text-[10px] text-muted-foreground">Configure retry & timeout in the Execution tab</p>
            </div>

            {/* Delete */}
            {nodeType !== 'start' && nodeType !== 'end' && (
              <button
                onClick={() => onDelete(node.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium w-full justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Node
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NodeConfigPanel);
