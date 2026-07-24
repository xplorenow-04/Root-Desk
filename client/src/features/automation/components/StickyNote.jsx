import { memo, useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { StickyNote as StickyNoteIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

const STICKY_COLORS = [
  { value: '#fef3c7', label: 'Yellow', border: '#fbbf24' },
  { value: '#dbeafe', label: 'Blue', border: '#60a5fa' },
  { value: '#dcfce7', label: 'Green', border: '#4ade80' },
  { value: '#fce7f3', label: 'Pink', border: '#f472b6' },
  { value: '#e9d5ff', label: 'Purple', border: '#a78bfa' },
  { value: '#ffedd5', label: 'Orange', border: '#fb923c' },
];

/**
 * Sticky note node for canvas annotations.
 * Resizable, editable, with color options.
 */
const StickyNoteNode = ({ data, selected, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const bgColor = data?.config?.color || '#fef3c7';
  const colorConfig = STICKY_COLORS.find(c => c.value === bgColor) || STICKY_COLORS[0];

  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={80}
        isVisible={selected}
        lineClassName="!border-yellow-400"
        handleClassName="!w-2 !h-2 !bg-yellow-400 !border-yellow-500"
      />
      <div
        className={cn(
          'min-w-[150px] min-h-[80px] rounded-lg shadow-md p-3 transition-all duration-200',
          selected && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background',
        )}
        style={{
          backgroundColor: bgColor,
          borderLeft: `4px solid ${colorConfig.border}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <StickyNoteIcon className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          {selected && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowColors(!showColors); }}
                className="w-4 h-4 rounded-full border border-amber-400 shadow-sm"
                style={{ backgroundColor: bgColor }}
              />
              {showColors && (
                <div className="absolute right-0 top-5 flex gap-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg z-10 border border-border/40">
                  {STICKY_COLORS.map(c => (
                    <button
                      key={c.value}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                        bgColor === c.value ? 'border-gray-600' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c.value }}
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onConfigChange?.({ color: c.value });
                        setShowColors(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning
          onDoubleClick={() => setIsEditing(true)}
          onBlur={(e) => {
            setIsEditing(false);
            data.onConfigChange?.({ text: e.target.innerText });
          }}
          className={cn(
            'text-xs text-gray-800 leading-relaxed min-h-[20px] outline-none',
            isEditing ? 'cursor-text' : 'cursor-default',
            !data?.config?.text && 'text-gray-400 italic'
          )}
        >
          {data?.config?.text || 'Double-click to edit...'}
        </div>
      </div>
    </>
  );
};

export default memo(StickyNoteNode);
