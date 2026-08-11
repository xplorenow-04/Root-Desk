import { useState } from 'react';
import {
  Undo2, Redo2, Copy, ClipboardPaste, CopyPlus, Trash2, Lock, Unlock, Boxes,
  Save, RotateCcw, Download, FileJson, Eye, GitBranch, CheckCircle2, FlaskConical,
  Library, Gauge, ScrollText, BookOpen, Presentation, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ToolButton = ({ icon: Icon, label, onClick, active, disabled, title, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title || label}
    className={cn(
      'flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
      active
        ? 'bg-primary/15 text-primary'
        : danger
          ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      disabled && 'pointer-events-none opacity-40'
    )}
  >
    <Icon size={14} />
    {label && <span className="hidden xl:inline">{label}</span>}
  </button>
);

const Divider = () => <div className="mx-1 h-5 w-px bg-border/60" />;

/**
 * Editor toolbar: history, clipboard, selection ops, save/export, and toggles
 * for every panel (validation, capacity, versions, practice, docs, simulate).
 */
const Toolbar = ({
  onUndo, onRedo, canUndo, canRedo,
  canCopy, canPaste, hasClipboard,
  onCopy, onPaste, onDuplicate, onDelete,
  canLock, locked, onToggleLock,
  onGroupSelected, canGroup,
  onSave, saving, onReset, onExportJson,
  activePanels, onTogglePanel, onAddPage,
}) => {
  const panels = [
    { id: 'library', label: 'Library', icon: Library },
    { id: 'validation', label: 'Validate', icon: CheckCircle2 },
    { id: 'capacity', label: 'Capacity', icon: Gauge },
    { id: 'versions', label: 'Versions', icon: GitBranch },
    { id: 'requirements', label: 'Requirements', icon: ScrollText },
    { id: 'simulate', label: 'Simulate', icon: FlaskConical },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
    { id: 'present', label: 'Present', icon: Presentation },
  ];

  return (
    <div className="flex h-11 shrink-0 items-center gap-0.5 border-b border-border/40 bg-card/80 px-2 backdrop-blur-sm">
      <ToolButton icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" />
      <ToolButton icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" />
      <Divider />
      <ToolButton icon={Copy} label="Copy" onClick={onCopy} disabled={!canCopy} title="Copy selection (Ctrl+C)" />
      <ToolButton icon={ClipboardPaste} label="Paste" onClick={onPaste} disabled={!canPaste || !hasClipboard} title="Paste (Ctrl+V)" />
      <ToolButton icon={CopyPlus} label="Duplicate" onClick={onDuplicate} disabled={!canCopy} title="Duplicate (Ctrl+D)" />
      <ToolButton icon={Trash2} label="Delete" onClick={onDelete} disabled={!canCopy && !canLock} danger title="Delete selection (Del)" />
      <Divider />
      <ToolButton icon={canLock ? Lock : Unlock} label={canLock ? 'Lock' : 'Unlock'} onClick={onToggleLock} disabled={!canLock} />
      <ToolButton icon={Boxes} label="Group" onClick={onGroupSelected} disabled={!canGroup} title="Wrap selection in a boundary" />
      <Divider />
      <ToolButton icon={Save} label="Save" onClick={onSave} disabled={saving} title="Save design (Ctrl+S)" />
      <ToolButton icon={RotateCcw} label="Reset" onClick={onReset} danger title="Reset to last saved" />
      <ToolButton icon={Download} label="JSON" onClick={onExportJson} title="Export as JSON" />
      <Divider />
      <ToolButton icon={Plus} label="Page" onClick={onAddPage} title="Add a new page" />

      <div className="flex-1" />

      {panels.map((p) => (
        <ToolButton
          key={p.id}
          icon={p.icon}
          label={p.label}
          onClick={() => onTogglePanel(p.id)}
          active={activePanels?.[p.id]}
          title={`${p.label} panel`}
        />
      ))}
    </div>
  );
};

export default Toolbar;
