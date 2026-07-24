import { memo, useState } from 'react';
import { MessageSquareDashed } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Comment node — inline comment bubble on the canvas.
 */
const CommentNode = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={cn(
        'min-w-[140px] max-w-[260px] rounded-xl border border-slate-300/30 bg-slate-100/10 backdrop-blur-sm p-3 transition-all duration-200',
        selected && 'ring-2 ring-slate-400/50 ring-offset-2 ring-offset-background',
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquareDashed className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={() => setIsEditing(true)}
          onBlur={(e) => {
            setIsEditing(false);
            data.onConfigChange?.({ text: e.target.innerText });
          }}
          className={cn(
            'text-xs text-muted-foreground leading-relaxed min-h-[14px] outline-none flex-1',
            isEditing ? 'cursor-text' : 'cursor-default',
            !data?.config?.text && 'italic opacity-50'
          )}
        >
          {data?.config?.text || 'Add comment...'}
        </div>
      </div>
    </div>
  );
};

export default memo(CommentNode);
