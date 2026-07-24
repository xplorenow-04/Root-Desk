import { useState, useEffect } from 'react';
import { X, Settings, Variable, Key, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { NODE_TYPES, ACTION_OPTIONS, PAGE_OPTIONS, NOTIFICATION_OPTIONS, DELAY_OPTIONS, VARIABLE_TYPES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

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
      <span className="text-[10px] text-amber-500">Connect &quot;Yes&quot; and &quot;No&quot; handles to different nodes</span>
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
        className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
      />
    </div>
  </div>
);

const configComponents = {
  page: PageConfig,
  action: ActionConfig,
  decision: DecisionConfig,
  api: ApiConfig,
  delay: DelayConfig,
  notification: NotificationConfig,
};

const NodeConfigPanel = ({ node, onUpdate, onDelete, onClose }) => {
  const nodeType = node?.data?.nodeType;
  const typeConfig = NODE_TYPES[nodeType];
  const Icon = typeConfig?.icon;
  const [label, setLabel] = useState(node?.data?.label || '');
  const [config, setConfig] = useState(node?.data?.config || {});
  const [showVariables, setShowVariables] = useState(false);
  const [variables, setVariables] = useState(node?.data?.variables || []);

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setConfig(node.data?.config || {});
      setVariables(node.data?.variables || []);
    }
  }, [node]);

  if (!node) {
    return (
      <div className="w-80 border-l border-border/40 bg-card/50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center p-6">
          <Settings className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const ConfigComponent = configComponents[nodeType];

  const handleLabelChange = (val) => {
    setLabel(val);
    onUpdate(node.id, { label: val });
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    onUpdate(node.id, { config: newConfig });
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

  return (
    <div className="w-80 border-l border-border/40 bg-card/50 backdrop-blur-sm overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color: typeConfig?.color }} />}
          <span className="text-sm font-medium text-foreground">Configure</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {ConfigComponent && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Configuration</p>
            <ConfigComponent config={config} onChange={handleConfigChange} />
          </div>
        )}

        <div>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <Variable className="w-3.5 h-3.5" />
            Variables
            {showVariables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showVariables && (
            <div className="mt-2 space-y-2">
              {variables.map((v, i) => (
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
              ))}
              <button
                onClick={addVariable}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-all"
              >
                <Plus className="w-3 h-3" /> Add variable
              </button>
            </div>
          )}
        </div>

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
    </div>
  );
};

export default NodeConfigPanel;
