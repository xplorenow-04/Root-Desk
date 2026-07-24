import { useState } from 'react';
import {
  Save, Undo2, Redo2, Copy, ClipboardPaste, CopyPlus, LayoutPanelTop,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, EyeOff, Lock, Unlock,
  Boxes, Grid3X3, Magnet, Search, AlertTriangle, CheckCircle2, Keyboard,
  PanelLeftOpen, PanelLeftClose, Bug, PanelRightOpen, PanelRightClose,
} from 'lucide-react';
import { NODE_TYPES, NODE_CATEGORIES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

const FlowToolbar = ({
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onAutoLayout,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleMiniMap,
  onToggleGrid,
  onToggleSnapToGrid,
  onTogglePalette,
  onToggleDebug,
  onTogglePropertiesPanel,
  onAddNode,
  onSearch,
  showMiniMap,
  showGrid = true,
  snapToGrid = true,
  showPalettePanel = false,
  showPropertiesPanel = true,
  showDebugPanel = false,
  isDirty,
  canUndo,
  canRedo,
  validationResult,
  isSaving,
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const ToolButton = ({ icon: Icon, label, onClick, disabled, active, badge, className: extraClass }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded-lg transition-all relative',
        active
          ? 'text-indigo-500 bg-indigo-500/10'
          : disabled
            ? 'text-muted-foreground/30 cursor-not-allowed'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        extraClass,
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] text-white font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-border/40 mx-1" />;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-0.5">
        {/* Palette toggle */}
        <ToolButton
          icon={showPalettePanel ? PanelLeftClose : PanelLeftOpen}
          label="Toggle Node Palette"
          onClick={onTogglePalette}
          active={showPalettePanel}
        />

        <Divider />

        {/* Save */}
        <ToolButton
          icon={Save}
          label={`Save (Ctrl+S)${isSaving ? ' — Saving...' : ''}`}
          onClick={onSave}
          disabled={!isDirty && !isSaving}
          active={isDirty}
          className={isSaving ? 'animate-pulse' : ''}
        />

        <Divider />

        {/* Undo / Redo */}
        <ToolButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
        <ToolButton icon={Redo2} label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} />

        <Divider />

        {/* Copy / Paste / Duplicate */}
        <ToolButton icon={Copy} label="Copy (Ctrl+C)" onClick={onCopy} />
        <ToolButton icon={ClipboardPaste} label="Paste (Ctrl+V)" onClick={onPaste} />
        <ToolButton icon={CopyPlus} label="Duplicate (Ctrl+D)" onClick={onDuplicate} />

        <Divider />

        {/* Layout */}
        <ToolButton icon={LayoutPanelTop} label="Auto Layout (Ctrl+Shift+L)" onClick={onAutoLayout} />

        <Divider />

        {/* Zoom */}
        <ToolButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
        <ToolButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
        <ToolButton icon={Maximize2} label="Fit View" onClick={onFitView} />

        <Divider />

        {/* Canvas controls */}
        <ToolButton icon={showMiniMap ? Minimize2 : Eye} label="Toggle Minimap" onClick={onToggleMiniMap} active={showMiniMap} />
        <ToolButton icon={Grid3X3} label="Toggle Grid" onClick={onToggleGrid} active={showGrid} />
        <ToolButton icon={Magnet} label="Snap to Grid" onClick={onToggleSnapToGrid} active={snapToGrid} />

        <Divider />

        {/* Search */}
        <ToolButton icon={Search} label="Search Nodes (Ctrl+F)" onClick={onSearch} />

        {/* Debug */}
        <ToolButton icon={Bug} label="Debug Panel" onClick={onToggleDebug} active={showDebugPanel} />

        {/* Validation */}
        {validationResult && (
          <>
            <Divider />
            <ToolButton
              icon={validationResult.isValid ? CheckCircle2 : AlertTriangle}
              label={validationResult.isValid ? 'Flow is valid' : `${validationResult.totalIssues} issue(s) found`}
              onClick={() => {}}
              active={false}
              badge={validationResult.isValid ? 0 : validationResult.totalIssues}
              className={validationResult.isValid ? '!text-green-500' : '!text-amber-500'}
            />
          </>
        )}
      </div>

      {/* Right side: Add Node */}
      <div className="flex items-center gap-2">
        {/* Properties panel toggle */}
        <ToolButton
          icon={showPropertiesPanel ? PanelRightClose : PanelRightOpen}
          label={`Properties Panel (${showPropertiesPanel ? 'Hide' : 'Show'})`}
          onClick={onTogglePropertiesPanel}
          active={showPropertiesPanel}
        />
        {/* Keyboard shortcut help */}
        <div className="relative">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          {showShortcuts && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-50 p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Keyboard Shortcuts</p>
                <div className="space-y-1.5 text-[10px]">
                  {[
                    ['Ctrl+S', 'Save'],
                    ['Ctrl+Z', 'Undo'],
                    ['Ctrl+Shift+Z', 'Redo'],
                    ['Ctrl+C', 'Copy'],
                    ['Ctrl+V', 'Paste'],
                    ['Ctrl+D', 'Duplicate'],
                    ['Ctrl+A', 'Select All'],
                    ['Ctrl+F', 'Search Nodes'],
                    ['Ctrl+B', 'Toggle Properties Panel'],
                    ['Ctrl+Shift+L', 'Auto Layout'],
                    ['Delete', 'Delete Selected'],
                    ['Escape', 'Deselect'],
                  ].map(([keys, label]) => (
                    <div key={keys} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <kbd className="bg-muted/50 text-foreground px-1.5 py-0.5 rounded text-[9px] font-mono">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add node dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-sm font-medium"
          >
            <CopyPlus className="w-4 h-4" />
            Add Node
          </button>

          {showPalette && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPalette(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-50 max-h-[70vh] overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Drag nodes or click to add</p>
                  {NODE_CATEGORIES.map((category) => (
                    <div key={category.label}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 mt-1">
                        {category.label}
                      </p>
                      {category.types.map((type) => {
                        const config = NODE_TYPES[type];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <button
                            key={type}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/reactflow', type);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onClick={() => {
                              onAddNode(type);
                              setShowPalette(false);
                            }}
                            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-muted/50 transition-all text-left"
                          >
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
                              {Icon && <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{config.label}</p>
                              <p className="text-[10px] text-muted-foreground">{config.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowToolbar;
