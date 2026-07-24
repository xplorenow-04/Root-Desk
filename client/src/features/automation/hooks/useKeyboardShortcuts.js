import { useEffect, useCallback } from 'react';

/**
 * Centralized keyboard shortcut handler for the flow editor.
 * Binds shortcuts only when the editor canvas is focused.
 */
export const useKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onSearch,
  onEscape,
  onAutoLayout,
  enabled = true,
}) => {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Ignore shortcuts when typing in inputs, textareas, selects
    const tag = e.target?.tagName?.toLowerCase();
    const isEditable = e.target?.isContentEditable;
    if (['input', 'textarea', 'select'].includes(tag) || isEditable) return;

    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const key = e.key.toLowerCase();

    // Ctrl+S → Save
    if (ctrl && key === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Ctrl+Z → Undo, Ctrl+Shift+Z → Redo
    if (ctrl && key === 'z') {
      e.preventDefault();
      if (shift) {
        onRedo?.();
      } else {
        onUndo?.();
      }
      return;
    }

    // Ctrl+Y → Redo (alternative)
    if (ctrl && key === 'y') {
      e.preventDefault();
      onRedo?.();
      return;
    }

    // Ctrl+C → Copy
    if (ctrl && key === 'c') {
      e.preventDefault();
      onCopy?.();
      return;
    }

    // Ctrl+V → Paste
    if (ctrl && key === 'v') {
      e.preventDefault();
      onPaste?.();
      return;
    }

    // Ctrl+D → Duplicate
    if (ctrl && key === 'd') {
      e.preventDefault();
      onDuplicate?.();
      return;
    }

    // Ctrl+A → Select All
    if (ctrl && key === 'a') {
      e.preventDefault();
      onSelectAll?.();
      return;
    }

    // Ctrl+F → Search
    if (ctrl && key === 'f') {
      e.preventDefault();
      onSearch?.();
      return;
    }

    // Ctrl+Shift+L → Auto Layout
    if (ctrl && shift && key === 'l') {
      e.preventDefault();
      onAutoLayout?.();
      return;
    }

    // Delete / Backspace → Delete selected
    if (key === 'delete' || key === 'backspace') {
      onDelete?.();
      return;
    }

    // Escape → Deselect / Close panels
    if (key === 'escape') {
      onEscape?.();
      return;
    }
  }, [enabled, onSave, onUndo, onRedo, onCopy, onPaste, onDuplicate, onDelete, onSelectAll, onSearch, onEscape, onAutoLayout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
