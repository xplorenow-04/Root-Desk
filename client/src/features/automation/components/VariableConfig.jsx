import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { VARIABLE_TYPES, VARIABLE_SCOPES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

const VariableConfig = ({ variables = [], onChange }) => {
  const [show, setShow] = useState(false);

  const addVariable = () => {
    onChange([
      ...variables,
      { name: '', type: 'string', scope: 'local', defaultValue: '', required: false, description: '' },
    ]);
  };

  const updateVariable = (index, field, value) => {
    const updated = variables.map((v, i) => i === index ? { ...v, [field]: value } : v);
    onChange(updated);
  };

  const removeVariable = (index) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
      >
        {show ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Flow Variables ({variables.length})
      </button>

      {show && (
        <div className="space-y-2">
          {variables.map((v, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => updateVariable(i, 'name', e.target.value)}
                  placeholder="Variable name"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                <select
                  value={v.scope}
                  onChange={(e) => updateVariable(i, 'scope', e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
                >
                  {VARIABLE_SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button onClick={() => removeVariable(i)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.defaultValue}
                  onChange={(e) => updateVariable(i, 'defaultValue', e.target.value)}
                  placeholder="Default value"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={v.required}
                    onChange={(e) => updateVariable(i, 'required', e.target.checked)}
                    className="rounded border-border/40"
                  />
                  Required
                </label>
              </div>
              <input
                type="text"
                value={v.description}
                onChange={(e) => updateVariable(i, 'description', e.target.value)}
                placeholder="Description"
                className="w-full px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          ))}
          <button
            onClick={addVariable}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add variable
          </button>
        </div>
      )}
    </div>
  );
};

export default VariableConfig;
