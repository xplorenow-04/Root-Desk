import { memo } from 'react';
import {
  Copy, ClipboardPaste, CopyPlus, Trash2, Lock, Unlock, Boxes, Palette, AlignCenter,
  ArrowUp, ArrowDown, MessageSquareDashed,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Context menu for right-click on canvas, nodes, and edges.
 */
const ContextMenu = ({
  position,
  targetType = 'canvas', // 'canvas' | 'node' | 'edge'
  targetId,
  onClose,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onLock,
  onUnlock,
  onGroup,
  onAddComment,
  onSelectAll,
  onAutoLayout,
  isLocked = false,
}) => {
  if (!position) return null;

  const MenuItem = ({ icon: Icon, label, onClick, destructive, disabled }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick?.();
          onClose?.();
        }
      }}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-all rounded-lg',
        destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : disabled
            ? 'text-muted-foreground/30 cursor-not-allowed'
            : 'text-foreground hover:bg-muted/50',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  const Separator = () => <div className="border-t border-border/40 my-1" />;

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose?.(); }}
      />

      {/* Menu */}
      <div
        className="fixed z-50 min-w-[180px] bg-card/95 border border-border/40 rounded-xl shadow-2xl backdrop-blur-xl py-1.5 px-1"
        style={{ top: position.y, left: position.x }}
      >
        {targetType === 'node' && (
          <>
            <MenuItem icon={Copy} label="Copy" onClick={onCopy} />
            <MenuItem icon={CopyPlus} label="Duplicate" onClick={onDuplicate} />
            <Separator />
            {isLocked ? (
              <MenuItem icon={Unlock} label="Unlock Node" onClick={onUnlock} />
            ) : (
              <MenuItem icon={Lock} label="Lock Node" onClick={onLock} />
            )}
            <MenuItem icon={Boxes} label="Group Selection" onClick={onGroup} />
            <Separator />
            <MenuItem icon={Trash2} label="Delete Node" onClick={onDelete} destructive />
          </>
        )}

        {targetType === 'edge' && (
          <>
            <MenuItem icon={Trash2} label="Delete Connection" onClick={onDelete} destructive />
          </>
        )}

        {targetType === 'canvas' && (
          <>
            <MenuItem icon={ClipboardPaste} label="Paste" onClick={onPaste} />
            <Separator />
            <MenuItem icon={MessageSquareDashed} label="Add Comment" onClick={onAddComment} />
            <Separator />
            <MenuItem icon={AlignCenter} label="Auto Layout" onClick={onAutoLayout} />
            <MenuItem icon={Copy} label="Select All" onClick={onSelectAll} />
          </>
        )}
      </div>
    </>
  );
};

export default memo(ContextMenu);
