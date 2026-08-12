import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, CheckCircle2, Circle, ListTodo,
  ChevronDown, ChevronRight, FolderPlus, GripVertical, MoreHorizontal, Pencil, X, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Data shape:
 *   sections: [
 *     { id, title, collapsed, items: [ { id, text, completed, createdAt } ] }
 *   ]
 *
 * Legacy (flat array of items) is auto-migrated to a single "General" section.
 */

const genId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).slice(2, 8));

const getProgressColor = (pct) => {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-teal-500';
  return 'bg-primary';
};

const ProjectChecklist = ({ projectId }) => {
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [showNewSection, setShowNewSection] = useState(false);
  const newSectionInputRef = useRef(null);
  const storageKey = `project_${projectId}_checklist`;

  // ── Load & auto-migrate ──
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate flat items array → sections
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0]?.items) {
          const migrated = [{ id: genId(), title: 'General', collapsed: false, items: parsed }];
          setSections(migrated);
          localStorage.setItem(storageKey, JSON.stringify(migrated));
        } else {
          setSections(parsed);
        }
      } catch (e) {
        console.error('Failed to parse checklist', e);
        setSections([]);
      }
    } else {
      setSections([]);
    }
  }, [projectId, storageKey]);

  const sync = (updated) => {
    setSections(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // ── Section CRUD ──
  const handleAddSection = (e) => {
    e?.preventDefault();
    const title = newSectionName.trim();
    if (!title) return;
    sync([...sections, { id: genId(), title, collapsed: false, items: [] }]);
    setNewSectionName('');
    setShowNewSection(false);
  };

  const handleDeleteSection = (sectionId) => {
    sync(sections.filter((s) => s.id !== sectionId));
  };

  const handleRenameSection = (sectionId, newTitle) => {
    sync(sections.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)));
  };

  const handleToggleCollapse = (sectionId) => {
    sync(sections.map((s) => (s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s)));
  };

  // ── Item CRUD ──
  const handleAddItem = (sectionId, text) => {
    if (!text.trim()) return;
    const newItem = { id: genId(), text: text.trim(), completed: false, createdAt: new Date().toISOString() };
    sync(sections.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s)));
  };

  const handleToggleItem = (sectionId, itemId) => {
    sync(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i)) }
          : s
      )
    );
  };

  const handleDeleteItem = (sectionId, itemId) => {
    sync(
      sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      )
    );
  };

  // ── Overall progress ──
  const allItems = sections.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.completed).length;
  const overallPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Focus new section input when shown
  useEffect(() => {
    if (showNewSection && newSectionInputRef.current) {
      newSectionInputRef.current.focus();
    }
  }, [showNewSection]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* ── Header bar ── */}
      <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ListTodo className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Project Checklist</h3>
            {totalItems > 0 && (
              <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                {completedItems}/{totalItems}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowNewSection(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>Add Section</span>
          </button>
        </div>

        {/* Overall progress bar */}
        {totalItems > 0 && (
          <div className="space-y-1">
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                {overallPercent}% complete
              </span>
            </div>
            <div className="h-[6px] w-full rounded-full bg-secondary/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`h-full rounded-full ${getProgressColor(overallPercent)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── New Section Inline Form ── */}
      <AnimatePresence>
        {showNewSection && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleAddSection}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-card/60 backdrop-blur-sm px-4 py-3"
          >
            <FolderPlus className="h-4 w-4 text-primary shrink-0" />
            <input
              ref={newSectionInputRef}
              type="text"
              placeholder="Section name (e.g. Backend, Frontend, Deployment)..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setShowNewSection(false); setNewSectionName(''); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Sections List ── */}
      {sections.length === 0 && !showNewSection && (
        <div className="rounded-xl border border-border/30 bg-card/30 py-16 text-center space-y-3">
          <ListTodo className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground/60">
            No sections yet. Create a section to start organizing your checklist.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onToggleCollapse={handleToggleCollapse}
              onRename={handleRenameSection}
              onDelete={handleDeleteSection}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// Section Card Sub-component
// ═══════════════════════════════════════════
const SectionCard = ({
  section,
  onToggleCollapse,
  onRename,
  onDelete,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const editInputRef = useRef(null);

  const total = section.items.length;
  const completed = section.items.filter((i) => i.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showMenu]);

  // Focus edit input
  useEffect(() => {
    if (isEditing && editInputRef.current) editInputRef.current.focus();
  }, [isEditing]);

  const handleSubmitItem = (e) => {
    e.preventDefault();
    onAddItem(section.id, inputValue);
    setInputValue('');
  };

  const handleRenameSubmit = (e) => {
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== section.title) {
      onRename(section.id, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* ── Section Header ── */}
      <div className="group flex items-center gap-2 px-4 py-3 bg-card/80">
        {/* Drag handle */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onToggleCollapse(section.id)}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-all duration-150"
        >
          {section.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Section icon */}
        {percent === 100 && total > 0 ? (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        ) : (
          <ListTodo className="h-4 w-4 text-primary shrink-0" />
        )}

        {/* Title or edit */}
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              className="flex-1 bg-transparent text-sm font-bold text-foreground border-b border-primary/40 focus:outline-none focus:border-primary px-0.5 py-0"
            />
          </form>
        ) : (
          <span className="text-sm font-bold text-foreground truncate select-text">{section.title}</span>
        )}

        {/* Item count badge */}
        {total > 0 && (
          <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress fraction */}
        {total > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground/50 font-mono tabular-nums shrink-0">
            {completed}/{total} done
          </span>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-muted-foreground/40 hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-[70] py-1.5">
              <button
                onClick={() => { setIsEditing(true); setEditTitle(section.title); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                Rename Section
              </button>
              <button
                onClick={() => { onDelete(section.id); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Delete Section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Section Progress Bar ── */}
      {total > 0 && (
        <div className="px-4 pb-2">
          <div className="h-[5px] w-full rounded-full bg-secondary/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`h-full rounded-full ${getProgressColor(percent)}`}
            />
          </div>
        </div>
      )}

      {/* ── Section Body (collapsible) ── */}
      <AnimatePresence initial={false}>
        {!section.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2">
              {/* ── Item input ── */}
              <form onSubmit={handleSubmitItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new item..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex h-9 flex-1 rounded-lg border border-input bg-background/50 px-3 py-2 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/40 transition-all duration-150"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all cursor-pointer border border-primary/20"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {/* ── Items List ── */}
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {section.items.length > 0 ? (
                    section.items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors group/item border border-transparent hover:border-border/20 ${
                          item.completed ? 'bg-emerald-500/[0.03]' : ''
                        }`}
                      >
                        {/* Left separator */}
                        <div className="h-px w-3 bg-border/30 shrink-0" />

                        {/* Toggle */}
                        <button
                          onClick={() => onToggleItem(section.id, item.id)}
                          className="shrink-0 cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                          ) : (
                            <Circle className="h-[18px] w-[18px] text-muted-foreground/40 hover:text-foreground transition-colors" />
                          )}
                        </button>

                        {/* Item text */}
                        <span
                          onClick={() => onToggleItem(section.id, item.id)}
                          className={`text-sm font-medium truncate flex-1 cursor-pointer select-none transition-colors duration-150 ${
                            item.completed ? 'text-muted-foreground/50 line-through decoration-muted-foreground/30' : 'text-foreground'
                          }`}
                        >
                          {item.text}
                        </span>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteItem(section.id, item.id)}
                          className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all cursor-pointer shrink-0"
                          title="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground/40 italic">
                      No items in this section yet.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectChecklist;
