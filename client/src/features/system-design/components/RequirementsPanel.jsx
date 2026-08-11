import { useState } from 'react';
import { ScrollText, Plus, Trash2, CheckCircle2, GitCommitHorizontal, HelpCircle, Pencil } from 'lucide-react';

const inputCls =
  'w-full rounded-md border border-border/50 bg-background px-2 py-1 text-xs focus:border-primary/50 focus:outline-none';

const Row = ({ item, onUpdate, onRemove }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text || item.title || '');

  const commit = () => {
    if (draft.trim() && draft !== (item.text || item.title)) {
      onUpdate({ ...item, text: draft.trim(), title: draft.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="group flex items-start gap-1.5 rounded-lg border border-border/50 bg-card/60 p-2">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className={inputCls}
        />
      ) : (
        <span className="flex-1 break-words text-[11px] leading-snug text-foreground">{item.text || item.title}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 text-muted-foreground/50 opacity-0 hover:text-foreground group-hover:opacity-100"
        title="Edit"
      >
        <Pencil size={10} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 text-muted-foreground/50 opacity-0 hover:text-destructive group-hover:opacity-100"
        title="Remove"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
};

const Section = ({ label, icon: Icon, color, items, onAdd, onUpdate, onRemove, placeholder }) => {
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (draft.trim()) {
      onAdd(draft.trim());
      setDraft('');
    }
  };

  return (
    <div className="border-b border-border/40 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon size={13} className={color} /> {label}
        <span className="rounded-full bg-muted px-1.5 text-[9px] font-bold text-muted-foreground">{items.length}</span>
      </div>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <Row key={item.id} item={item} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          type="button"
          onClick={submit}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
};

/**
 * Requirements / decisions / assumptions tracker. These shape the exported
 * design document and practice-mode submissions.
 */
const RequirementsPanel = ({
  requirements,
  decisions,
  assumptions,
  onAddRequirement,
  onUpdateRequirement,
  onRemoveRequirement,
  onAddDecision,
  onUpdateDecision,
  onRemoveDecision,
  onAddAssumption,
  onUpdateAssumption,
  onRemoveAssumption,
}) => (
  <div className="flex h-full flex-col overflow-y-auto">
    <div className="border-b border-border/40 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <ScrollText size={13} className="text-primary" /> Requirements & decisions
      </div>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        Document what the system must do, what you decided, and what you assumed.
      </p>
    </div>
    <Section
      label="Functional requirements"
      icon={CheckCircle2}
      color="text-green-500"
      items={requirements}
      onAdd={onAddRequirement}
      onUpdate={onUpdateRequirement}
      onRemove={onRemoveRequirement}
      placeholder="The system must…"
    />
    <Section
      label="Design decisions"
      icon={GitCommitHorizontal}
      color="text-indigo-400"
      items={decisions}
      onAdd={onAddDecision}
      onUpdate={onUpdateDecision}
      onRemove={onRemoveDecision}
      placeholder="Chose X over Y because…"
    />
    <Section
      label="Assumptions"
      icon={HelpCircle}
      color="text-amber-500"
      items={assumptions}
      onAdd={onAddAssumption}
      onUpdate={onUpdateAssumption}
      onRemove={onRemoveAssumption}
      placeholder="Assuming…"
    />
  </div>
);

export default RequirementsPanel;
