import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Play, History, Settings, Variable, Lock, Download, Upload, Copy, MoreHorizontal,
  ChevronRight, Bug, PanelLeftOpen, Link2, PanelRightOpen, PanelRightClose,
} from 'lucide-react';
import { useFlow, useSaveFlowData, useUpdateFlow, useArchiveFlow, useDuplicateFlow, useExportFlow, useRunFlow, useFlowExecutions, useFlowHistory } from '../hooks/useFlows';
import { useFlowLinks } from '../hooks/useWorkflowLinks';
import { useFlowEditor } from '../hooks/useFlowEditor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useFlowValidation } from '../hooks/useFlowValidation';
import { useAutosave } from '../hooks/useAutosave';
import FlowCanvas from '../components/FlowCanvas';
import FlowToolbar from '../components/FlowToolbar';
import NodeConfigPanel from '../components/NodeConfigPanel';
import NodePalette from '../components/NodePalette';
import FlowDialog from '../components/FlowDialog';
import VariableConfig from '../components/VariableConfig';
import FlowPermissions from '../components/FlowPermissions';
import ExecutionLog from '../components/ExecutionLog';
import DebugPanel from '../components/DebugPanel';
import VersionHistory from '../components/VersionHistory';
import WorkflowPropertiesPanel from '../components/WorkflowPropertiesPanel';
import WorkflowLinkManager from '../components/WorkflowLinkManager';
import ContextMenu from '../components/ContextMenu';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import ErrorState from '../../../components/shared/ErrorState';
import { NODE_TYPES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { useExecuteActions } from '../hooks/useFlowExecution';

const RIGHT_TABS = [
  { id: 'properties', label: 'Properties', icon: Settings },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'variables', label: 'Variables', icon: Variable },
  { id: 'permissions', label: 'Permissions', icon: Lock },
  { id: 'history', label: 'History', icon: History },
  { id: 'executions', label: 'Executions', icon: Play },
  { id: 'debug', label: 'Debug', icon: Bug },
];

// ── localStorage persistence keys ──
const UI_STORAGE_KEYS = {
  propertiesPanel: 'flow-editor-properties-panel',
};

const persist = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const restore = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const FlowEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('properties');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showPalettePanel, setShowPalettePanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentNodes, setRecentNodes] = useState([]);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(() => restore(UI_STORAGE_KEYS.propertiesPanel, true));
  const reactFlowInstance = useRef(null);

  // Persist properties panel preference
  useEffect(() => { persist(UI_STORAGE_KEYS.propertiesPanel, showPropertiesPanel); }, [showPropertiesPanel]);

  // ── Data Hooks ──
  const { data: flowData, isLoading, error } = useFlow(id);
  const saveFlowData = useSaveFlowData();
  const updateFlow = useUpdateFlow();
  const archiveFlow = useArchiveFlow();
  const duplicateFlow = useDuplicateFlow();
  const exportFlow = useExportFlow();
  const runFlow = useRunFlow();
  const { data: executionsData, isLoading: execsLoading } = useFlowExecutions(id);
  const { data: historyData, isLoading: historyLoading } = useFlowHistory(id);
  const execActions = useExecuteActions();

  // ── Pre-load workflow links on page mount ──
  useFlowLinks(id);

  // ── Editor Hook ──
  const editor = useFlowEditor();

  // ── Validation ──
  const validation = useFlowValidation(editor.nodes, editor.edges);

  // ── Load flow data ──
  useEffect(() => {
    if (flowData) {
      const nodes = flowData.nodes || [];
      const edges = flowData.edges || [];
      if (nodes.length > 0 || edges.length > 0) {
        editor.loadFlowData(nodes, edges);
      }
    }
  }, [flowData?.nodes?.length, flowData?.edges?.length]);

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    if (!id) return;
    try {
      const { nodes, edges } = editor.getFlowData();
      await saveFlowData.mutateAsync({ id, data: { nodes, edges } });
      editor.markClean?.();
      toast.success('Flow saved');
    } catch (err) {
      toast.error('Failed to save flow');
    }
  }, [id, editor, saveFlowData]);

  // ── Autosave ──
  const { isSaving, lastSavedAt } = useAutosave({
    isDirty: editor.isDirty,
    onSave: handleSave,
    delayMs: 5000,
    enabled: true,
  });

  // ── Run handler ──
  const handleRun = useCallback(async () => {
    try {
      if (editor.isDirty) await handleSave();
      await runFlow.mutateAsync({ id, data: {} });
      toast.success('Flow execution started');
      setActiveTab('executions');
      setShowRightPanel(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run flow');
    }
  }, [id, editor.isDirty, handleSave, runFlow]);

  // ── Export handler ──
  const handleExport = useCallback(async () => {
    try {
      const data = await exportFlow.mutateAsync(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.flow?.name?.replace(/\s+/g, '_') || 'flow'}_flow.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Flow exported');
    } catch (err) {
      toast.error('Failed to export flow');
    }
  }, [id, exportFlow]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveFlow.mutateAsync(id);
      toast.success('Flow updated');
    } catch (err) {
      toast.error('Failed to update flow');
    }
  }, [id, archiveFlow]);

  const handleDuplicate = useCallback(async () => {
    try {
      await duplicateFlow.mutateAsync(id);
      toast.success('Flow duplicated');
    } catch (err) {
      toast.error('Failed to duplicate flow');
    }
  }, [id, duplicateFlow]);

  // ── Drop node handler ──
  const handleDropNode = useCallback((type, position) => {
    editor.addNode(type, position);
    setRecentNodes(prev => {
      const next = [type, ...prev.filter(t => t !== type)].slice(0, 10);
      return next;
    });
  }, [editor]);

  const handleAddNode = useCallback((type) => {
    const basePos = { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 };
    editor.addNode(type, basePos);
    setRecentNodes(prev => {
      const next = [type, ...prev.filter(t => t !== type)].slice(0, 10);
      return next;
    });
  }, [editor]);

  const handleEditFlow = async (data) => {
    try {
      await updateFlow.mutateAsync({ id, data });
      toast.success('Flow updated');
      setEditDialogOpen(false);
    } catch (err) {
      toast.error('Failed to update flow');
    }
  };

  const handleExecutionAction = useCallback(async (action, executionId) => {
    try {
      await execActions[action](executionId);
      toast.success(`Execution ${action}ed`);
    } catch (err) {
      toast.error(`Failed to ${action} execution`);
    }
  }, [execActions]);

  const handleInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // ── Context menu handler ──
  const handleContextMenu = useCallback((type, target, screenPos, flowPos) => {
    setContextMenu({ type, target, position: screenPos, flowPosition: flowPos });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // ── History restore handler ──
  const handleRestoreVersion = useCallback(async (version) => {
    try {
      // Call restoreFlowVersion via API
      const { restoreFlowVersion } = await import('../../../services/flowApi');
      await restoreFlowVersion(id, version);
      toast.success(`Restored to version ${version}`);
      // Reload data
      window.location.reload();
    } catch (err) {
      toast.error('Failed to restore version');
    }
  }, [id]);

  // ── Properties update handler ──
  const handlePropertiesUpdate = useCallback(async (data) => {
    try {
      await updateFlow.mutateAsync({ id, data });
    } catch (err) {
      toast.error('Failed to update properties');
    }
  }, [id, updateFlow]);

  // ── Keyboard shortcuts ──
  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: editor.undo,
    onRedo: editor.redo,
    onCopy: editor.copySelected,
    onPaste: editor.paste,
    onDuplicate: editor.duplicateSelected,
    onDelete: () => {
      if (editor.selectedNode) editor.removeNode(editor.selectedNode.id);
    },
    onSelectAll: () => {},
    onSearch: () => setSearchOpen(prev => !prev),
    onEscape: () => {
      editor.onPaneClick();
      setContextMenu(null);
      setSearchOpen(false);
    },
    onAutoLayout: editor.autoLayout,
    onTogglePanel: () => setShowPropertiesPanel(prev => !prev),
    enabled: true,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={() => navigate('/automation/flows')} />;

  const flow = flowData?.flow || flowData;
  const isArchived = flow?.status === 'archived';

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automation/flows')}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button onClick={() => navigate('/automation/flows')} className="hover:text-foreground transition-colors">Flows</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{flow?.name || 'Untitled Flow'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {flow?.status && (
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                flow.status === 'active' ? 'bg-green-500/10 text-green-500' :
                flow.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500' :
                flow.status === 'archived' ? 'bg-slate-500/10 text-slate-500' :
                'bg-red-500/10 text-red-500'
              )}>
                {flow.status}
              </span>
            )}
            {editor.isDirty && (
              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Unsaved</span>
            )}
            {isSaving && (
              <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full animate-pulse">Saving...</span>
            )}
            <span className="text-[10px] text-muted-foreground">v{flow?.version || 1}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!editor.isDirty}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              editor.isDirty
                ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {flow?.status === 'active' && (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Run
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-50 py-1">
                  <button onClick={() => { setEditDialogOpen(true); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all">
                    <Settings className="w-3.5 h-3.5" /> Edit Details
                  </button>
                  <button onClick={() => { handleDuplicate(); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button onClick={() => { handleExport(); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <div className="border-t border-border/40 my-1" />
                  <button onClick={() => { handleArchive(); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-all">
                    {isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <FlowToolbar
        onSave={handleSave}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onCopy={editor.copySelected}
        onPaste={editor.paste}
        onDuplicate={editor.duplicateSelected}
        onAutoLayout={editor.autoLayout}
        onZoomIn={() => reactFlowInstance.current?.zoomIn()}
        onZoomOut={() => reactFlowInstance.current?.zoomOut()}
        onFitView={() => reactFlowInstance.current?.fitView({ padding: 0.2 })}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        onTogglePalette={() => setShowPalettePanel(!showPalettePanel)}
        onToggleDebug={() => { setActiveTab('debug'); setShowRightPanel(true); }}
        onTogglePropertiesPanel={() => setShowPropertiesPanel(prev => !prev)}
        onAddNode={handleAddNode}
        onSearch={() => setSearchOpen(!searchOpen)}
        showMiniMap={showMiniMap}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showPalettePanel={showPalettePanel}
        showPropertiesPanel={showPropertiesPanel}
        isDirty={editor.isDirty}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        validationResult={validation}
        isSaving={isSaving}
      />

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node Palette */}
        {showPalettePanel && (
          <NodePalette
            onAddNode={handleAddNode}
            recentNodes={recentNodes}
          />
        )}

        {/* Center: Canvas */}
        <div className="flex-1 relative bg-background">
          <FlowCanvas
            nodes={editor.nodes}
            edges={editor.edges}
            onNodesChange={editor.onNodesChange}
            onEdgesChange={editor.onEdgesChange}
            onConnect={editor.onConnect}
            onNodeClick={editor.onNodeClick}
            onEdgeClick={editor.onEdgeClick}
            onPaneClick={() => { editor.onPaneClick(); setShowMenu(false); setContextMenu(null); }}
            onDropNode={handleDropNode}
            onContextMenu={handleContextMenu}
            showMiniMap={showMiniMap}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            fitView={flowData?.nodes?.length > 0}
            onInit={handleInit}
          />

          {/* Search overlay */}
          {searchOpen && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by name..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-card/95 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xl backdrop-blur-xl"
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              />
              {searchQuery && (
                <div className="mt-1 bg-card/95 border border-border/40 rounded-xl shadow-xl backdrop-blur-xl max-h-48 overflow-y-auto">
                  {editor.nodes
                    .filter(n => (n.data?.label || '').toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 10)
                    .map(node => {
                      const tc = NODE_TYPES[node.data?.nodeType];
                      const NodeIcon = tc?.icon;
                      return (
                        <button
                          key={node.id}
                          onClick={() => {
                            editor.onNodeClick(null, node);
                            reactFlowInstance.current?.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 500 });
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/50 transition-all"
                        >
                          {NodeIcon && <NodeIcon className="w-3.5 h-3.5" style={{ color: tc?.color }} />}
                          <span className="text-foreground">{node.data?.label}</span>
                          <span className="text-muted-foreground ml-auto">{tc?.label}</span>
                        </button>
                      );
                    })
                  }
                  {editor.nodes.filter(n => (n.data?.label || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">No nodes found</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status bar */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-card/90 border border-border/40 rounded-lg px-3 py-1.5 backdrop-blur-sm shadow-sm z-10">
            <span className="text-[10px] text-muted-foreground">{editor.nodes.length} nodes</span>
            <span className="text-[10px] text-muted-foreground">{editor.edges.length} edges</span>
            {lastSavedAt && (
              <span className="text-[10px] text-muted-foreground">
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Right: Config / Properties Panel */}
        {editor.selectedNode && showPropertiesPanel ? (
          <NodeConfigPanel
            node={editor.selectedNode}
            onUpdate={editor.updateNodeData}
            onDelete={(nodeId) => editor.removeNode(nodeId)}
            onClose={() => editor.setSelectedNode(null)}
            onMinimize={() => setShowPropertiesPanel(false)}
          />
        ) : !editor.selectedNode && showRightPanel && (
          <div className="w-80 border-l border-border/40 bg-card/50 backdrop-blur-sm overflow-y-auto flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-border/40 overflow-x-auto scrollbar-none">
              {RIGHT_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-all border-b-2 whitespace-nowrap min-w-[60px]',
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'properties' && (
                <WorkflowPropertiesPanel flow={flow} onUpdate={handlePropertiesUpdate} />
              )}

              {activeTab === 'links' && (
                <WorkflowLinkManager flowId={id} flowVersion={flow?.version} entryNodes={editor.nodes} />
              )}

              {activeTab === 'variables' && (
                <VariableConfig
                  variables={flow?.variables || []}
                  onChange={(vars) => updateFlow.mutate({ id, data: { variables: vars } })}
                />
              )}

              {activeTab === 'permissions' && (
                <FlowPermissions
                  permissions={flow?.permissions || { allowedRoles: ['admin'] }}
                  onChange={(perms) => updateFlow.mutate({ id, data: { permissions: perms } })}
                />
              )}

              {activeTab === 'history' && (
                <VersionHistory
                  history={historyData?.history || []}
                  currentVersion={flow?.version}
                  isLoading={historyLoading}
                  onRestore={handleRestoreVersion}
                />
              )}

              {activeTab === 'executions' && (
                <ExecutionLog
                  executions={executionsData?.executions || []}
                  isLoading={execsLoading}
                  onPause={(execId) => handleExecutionAction('pause', execId)}
                  onResume={(execId) => handleExecutionAction('resume', execId)}
                  onCancel={(execId) => handleExecutionAction('cancel', execId)}
                  onRestart={(execId) => handleExecutionAction('restart', execId)}
                  onRetry={(execId) => handleExecutionAction('retry', execId)}
                  onView={(execId) => navigate(`/automation/executions/${execId}`)}
                />
              )}

              {activeTab === 'debug' && (
                <DebugPanel
                  execution={executionsData?.executions?.[0]}
                  nodes={editor.nodes}
                  onPause={(execId) => handleExecutionAction('pause', execId)}
                  onResume={(execId) => handleExecutionAction('resume', execId)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          targetType={contextMenu.type}
          targetId={contextMenu.target?.id}
          onClose={handleCloseContextMenu}
          onCopy={editor.copySelected}
          onPaste={editor.paste}
          onDuplicate={editor.duplicateSelected}
          onDelete={() => {
            if (contextMenu.type === 'node' && contextMenu.target) {
              editor.removeNode(contextMenu.target.id);
            } else if (contextMenu.type === 'edge' && contextMenu.target) {
              editor.removeEdge(contextMenu.target.id);
            }
          }}
          onAddComment={() => {
            if (contextMenu.flowPosition) {
              editor.addNode('comment', contextMenu.flowPosition);
            }
          }}
          onAutoLayout={editor.autoLayout}
        />
      )}

      {/* ── Edit Dialog ── */}
      <FlowDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditFlow}
        initialData={flow}
        mode="edit"
      />
    </div>
  );
};

export default FlowEditorPage;
