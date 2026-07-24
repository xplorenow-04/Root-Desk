import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Debounced autosave hook for flow editor.
 * Saves automatically after changes stop for `delayMs` milliseconds.
 */
export const useAutosave = ({
  isDirty,
  onSave,
  delayMs = 3000,
  enabled = true,
}) => {
  const timeoutRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const triggerSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave();
      setLastSavedAt(new Date());
    } catch (err) {
      setSaveError(err?.message || 'Autosave failed');
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, enabled, delayMs, triggerSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSavedAt,
    saveError,
    triggerSave,
  };
};

export default useAutosave;
