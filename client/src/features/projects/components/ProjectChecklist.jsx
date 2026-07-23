import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectChecklist = ({ projectId }) => {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const storageKey = `project_${projectId}_checklist`;

  // Load checklist items from localStorage on mount/projectId change
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse checklist', e);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [projectId, storageKey]);

  // Sync checklist items to localStorage
  const syncItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (text) {
      const newItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      syncItems([...items, newItem]);
      setInputValue('');
    }
  };

  const handleToggleItem = (id) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    syncItems(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = items.filter((item) => item.id !== id);
    syncItems(updated);
  };

  // Progress calculations
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-bold text-foreground">Project Checklist</h3>
        </div>
        <span className="text-xs font-mono font-bold text-muted-foreground">
          {completed}/{total} Completed
        </span>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.25)]"
            />
          </div>
        </div>
      )}

      {/* Item Input Form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a new checklist task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex h-10 flex-1 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-155"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {/* Items List */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {items.length > 0 ? (
            items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between rounded-lg border border-border/25 bg-background/30 px-4 py-3 hover:bg-muted/30 transition-colors group ${
                  item.completed ? 'border-emerald-500/10' : ''
                }`}
              >
                <div
                  onClick={() => handleToggleItem(item.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                >
                  <button type="button" className="text-muted-foreground/80 shrink-0">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-foreground" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium truncate leading-none ${
                      item.completed ? 'text-muted-foreground/60 line-through' : 'text-foreground'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground italic">
              Checklist is empty. Add items above to get started.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectChecklist;
