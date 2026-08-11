import { useEffect, useRef, useState } from 'react';
import {
  Copy, ClipboardPaste, CopyPlus, Trash2, Lock, Unlock, Boxes, Layers, Send,
} from 'lucide-react';
import { BOUNDARY_TYPES } from '../constants/architecture';
import { cn } from '@/lib/utils';

/**
 * Floating context menu for canvas right-click. Variants:
 * - 'pane': empty canvas → add group / paste
 * - 'node': component(s) → copy/duplicate/lock/group/delete
 * - 'edge': connection → delete
 * - 'group': boundary → lock/delete
 */
const ContextMenu = ({ x, y, variant, onClose, actions }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 12);
    const top = Math.min(y, window.innerHeight - rect.height - 12);
    setPos({ x: Math.max(8, left), y: Math.max(8, top) });
  }, [x, y]);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const Item = ({ icon: Icon, label, onClick, danger, disabled }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        onClose?.();
      }}
      className={cn(
        'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted/60',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      <Icon size={13} className={danger ? '' : 'text-muted-foreground'} />
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-xl border border-border/60 bg-card/95 p-1 shadow-2xl backdrop-blur-md"
      style={{ left: pos.x, top: pos.y }}
    >
      {variant === 'pane' && (
        <>
          <div className="px-2.5 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Boundary
          </div>
          {BOUNDARY_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                actions?.addGroup?.(b.id);
                onClose?.();
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted/60"
            >
              {b.icon ? <b.icon size={13} className="text-muted-foreground" /> : <Boxes size={13} className="text-muted-foreground" />}
              {b.label}
            </button>
          ))}
          <div className="my-1 h-px bg-border/60" />
          <Item icon={ClipboardPaste} label="Paste" onClick={() => actions?.paste?.()} disabled={!actions?.canPaste} />
        </>
      )}
      {variant === 'node' && (
        <>
          <Item icon={Copy} label="Copy" onClick={() => actions?.copy?.()} disabled={!actions?.canCopy} />
          <Item icon={CopyPlus} label="Duplicate" onClick={() => actions?.duplicate?.()} disabled={!actions?.canCopy} />
          <Item icon={Lock} label="Lock" onClick={() => actions?.lock?.()} disabled={!actions?.canLock} />
          <Item icon={Unlock} label="Unlock" onClick={() => actions?.unlock?.()} disabled={!actions?.canLock} />
          <Item icon={Boxes} label="Wrap in boundary" onClick={() => actions?.group?.()} disabled={!actions?.canGroup} />
          <div className="my-1 h-px bg-border/60" />
          <Item icon={Trash2} label="Delete" onClick={() => actions?.delete?.()} danger disabled={!actions?.canDelete} />
        </>
      )}
      {variant === 'edge' && (
        <>
          <Item icon={Copy} label="Copy settings" onClick={() => actions?.copyEdge?.()} />
          <div className="my-1 h-px bg-border/60" />
          <Item icon={Trash2} label="Delete connection" onClick={() => actions?.deleteEdge?.()} danger />
        </>
      )}
      {variant === 'group' && (
        <>
          <Item icon={Lock} label="Lock boundary" onClick={() => actions?.lockGroup?.()} />
          <Item icon={Layers} label="Ungroup components" onClick={() => actions?.ungroup?.()} />
          <div className="my-1 h-px bg-border/60" />
          <Item icon={Trash2} label="Delete boundary" onClick={() => actions?.deleteGroup?.()} danger />
        </>
      )}
      {variant === 'node-edge' && (
        <>
          <Item icon={Copy} label="Copy" onClick={() => actions?.copy?.()} disabled={!actions?.canCopy} />
          <Item icon={CopyPlus} label="Duplicate" onClick={() => actions?.duplicate?.()} disabled={!actions?.canCopy} />
          <Item icon={Boxes} label="Wrap in boundary" onClick={() => actions?.group?.()} disabled={!actions?.canGroup} />
          <div className="my-1 h-px bg-border/60" />
          <Item icon={Trash2} label="Delete selected" onClick={() => actions?.delete?.()} danger />
        </>
      )}
      {variant === 'custom' && (
        <Item icon={Send} label="Place component" onClick={() => actions?.place?.()} />
      )}
    </div>
  );
};

export default ContextMenu;
