import React from 'react';
import { motion } from 'framer-motion';
import { Database, Plus, FileText, Library, History, Calendar, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import DATABASE_TEMPLATES from '../constants/presets';

const Explorer = ({
  diagrams = [],
  currentDiagram = null,
  onSelectDiagram,
  onCreateDiagram,
  onDeleteDiagram,
  onLoadTemplate,
  onRestoreVersion,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <motion.div
      animate={{ width: isCollapsed ? 48 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-card border-r border-border/40 text-foreground select-none shrink-0 overflow-hidden"
    >
      {/* Collapsed Header */}
      <div className="flex flex-col items-center gap-2 p-2 border-b border-border/20 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title={isCollapsed ? 'Expand models panel' : 'Collapse models panel'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        {isCollapsed && (
          <button
            onClick={onCreateDiagram}
            className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer"
            title="Create New Model"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <>
          {/* Diagrams Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20 shrink-0">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">Database Models</span>
            </div>
            <button
              onClick={onCreateDiagram}
              className="p-1 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer"
              title="Create New Model"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {/* User Diagrams */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-2">
                My Diagrams
              </span>
              <div className="space-y-1">
                {diagrams.map((d) => {
                  const isActive = currentDiagram?._id === d._id;
                  return (
                    <div
                      key={d._id}
                      onClick={() => onSelectDiagram(d)}
                      className={`flex items-center justify-between group px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                        isActive
                          ? 'bg-primary/15 border-primary text-primary shadow-sm'
                          : 'border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{d.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDiagram(d._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-destructive/80 hover:bg-destructive/15 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                {!diagrams.length && (
                  <span className="text-xs text-muted-foreground/60 italic block px-2 py-1">
                    No diagrams. Click + to create.
                  </span>
                )}
              </div>
            </div>

            {/* Preset Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-2">
                Preset Templates
              </span>
              <div className="space-y-1">
                {DATABASE_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => onLoadTemplate(tpl)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold border border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer transition-all"
                  >
                    <Library className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{tpl.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Version History (Only shows if diagram is active) */}
            {currentDiagram && (
              <div className="space-y-2 pt-2 border-t border-border/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-2">
                  Version History
                </span>
                <div className="space-y-1 px-1">
                  {currentDiagram.versions?.map((v) => (
                    <div
                      key={v.versionNumber}
                      onClick={() => onRestoreVersion(v.versionNumber)}
                      className="flex flex-col gap-1 p-2 rounded-lg border border-border/40 hover:border-primary/45 hover:bg-muted/30 cursor-pointer transition-all group"
                      title="Click to restore this version"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                        <span>v{v.versionNumber}</span>
                        <History className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{new Date(v.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                  {(!currentDiagram.versions || !currentDiagram.versions.length) && (
                    <span className="text-xs text-muted-foreground/60 italic block px-1">
                      No versions saved yet.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Explorer;
