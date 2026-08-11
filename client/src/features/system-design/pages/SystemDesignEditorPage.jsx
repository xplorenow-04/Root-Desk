import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { ChevronLeft, Loader2, Save, CloudOff, CloudUpload, FolderOpen, Zap, Repeat, ShieldCheck, Database } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import useAutosave from '@/features/automation/hooks/useAutosave';
import { useSystemDesign, useUpdateSystemDesign } from '../hooks/useSystemDesigns';
import { useSystemDesignEditor } from '../hooks/useSystemDesignEditor';
import ArchitectureCanvas from '../components/ArchitectureCanvas';
import ComponentLibrary from '../components/ComponentLibrary';
import PropertiesPanel from '../components/PropertiesPanel';
import Toolbar from '../components/Toolbar';
import PagesBar from '../components/PagesBar';
import ContextMenu from '../components/ContextMenu';
import ValidationPanel from '../components/ValidationPanel';
import CapacityPanel from '../components/CapacityPanel';
import VersionsPanel from '../components/VersionsPanel';
import RequirementsPanel from '../components/RequirementsPanel';
import ChaosSimulator from '../components/ChaosSimulator';
import DocumentationPanel from '../components/DocumentationPanel';
import PresentationMode from '../components/PresentationMode';
import {
  exportDesignJson, exportDesignSvg, exportDesignPng, exportDesignPdf,
} from '../utils/export';
import { PATTERNS_A, PATTERNS_B } from '../constants/patterns';
import { cn } from '@/lib/utils';

const RIGHT_PANEL_DEFS = [
  { id: 'properties', label: 'Properties' },
  { id: 'validation', label: 'Validation' },
  { id: 'capacity', label: 'Capacity' },
  { id: 'versions', label: 'Versions' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'docs', label: 'Documentation' },
];

const QUICK_PATTERN_ICONS = {
  'cache-aside': Database,
  'retry-backoff': Repeat,
  'circuit-breaker': ShieldCheck,
  'database-sharding': Database,
};

const EditorInner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();
  const { data: serverDesign, isLoading, isError, error } = useSystemDesign(id);
  const updateMutation = useUpdateSystemDesign(id);

  const editor = useSystemDesignEditor();
  const {
    document, dirty, setDirty, loadDocument, buildDocument, getActivePageDocument,
    undo, redo, undoStack, redoStack,
    copySelection, pasteClipboard, duplicateSelection, deleteSelection,
    selectedNodeIds, selectedEdgeId, selectedGroupId,
    setSelectedNodeIds, setSelectedEdgeId, setSelectedGroupId,
    nodes, edges, page, pageId, allNodes, allEdges,
    onNodesChange, onEdgesChange, onSelectionChange, onNodeClick, onEdgeClick, onPaneClick, onConnect,
    addNodeAtCenter, addGroup, groupSelectedNodes, ungroup, updateNode, updateEdge, updateGroup,
    addPage, renamePage, setPageLevel, removePage, switchPage,
    updateDocument, addRequirement, updateRequirement, removeRequirement,
    addDecision, updateDecision, removeDecision, addAssumption, updateAssumption, removeAssumption,
    updateCapacityInputs, insertPattern, removeEdge,
  } = editor;

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState('properties');
  const [ctx, setCtx] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [simStatus, setSimStatus] = useState({});
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [recoverable, setRecoverable] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [placeOffset, setPlaceOffset] = useState(0);
  const canvasWrapRef = useRef(null);

  const design = serverDesign || null;

  // ── load design into editor ──
  useEffect(() => {
    if (serverDesign) {
      loadDocument(serverDesign);
      setRecoverable(false);
    }
  }, [serverDesign, loadDocument]);

  // ── local crash-recovery draft ──
  const draftKey = `sd-draft-${id}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        const age = Date.now() - (draft.savedAt || 0);
        if (age < 1000 * 60 * 60 * 24 * 7) setRecoverable(true);
      }
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  const save = useCallback(async () => {
    const payload = buildDocument();
    try {
      await updateMutation.mutateAsync(payload);
      setDirty(false);
      setLastSavedAt(new Date());
      localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), payload }));
      return payload;
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
      throw err;
    }
  }, [buildDocument, updateMutation, setDirty, draftKey]);

  const { isSaving: autosaving, triggerSave, saveError } = useAutosave({
    isDirty: dirty,
    onSave: save,
    delayMs: 4000,
    enabled: Boolean(design),
  });

  // dirty draft tracking (recover on next open after crash)
  useEffect(() => {
    if (dirty && design) {
      const t = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), payload: buildDocument() }));
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [dirty, buildDocument, design, draftKey]);

  // ── keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target;
      const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerSave();
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === 'z' && !inInput) {
        e.preventDefault();
        undo();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'z' && !inInput) {
        e.preventDefault();
        redo();
      } else if (mod && !inInput && e.key.toLowerCase() === 'c' && selectedNodeIds.length) {
        e.preventDefault();
        copySelection();
      } else if (mod && !inInput && e.key.toLowerCase() === 'v' && !inInput) {
        e.preventDefault();
        pasteClipboard();
      } else if (mod && !inInput && e.key.toLowerCase() === 'd' && selectedNodeIds.length) {
        e.preventDefault();
        duplicateSelection();
      } else if (!mod && !inInput && (e.key === 'Delete' || e.key === 'Backspace') && (selectedNodeIds.length || selectedEdgeId)) {
        e.preventDefault();
        deleteSelection();
      } else if (!mod && e.key === 'Escape' && ctx) {
        setCtx(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerSave, undo, redo, copySelection, pasteClipboard, duplicateSelection, deleteSelection, selectedNodeIds, selectedEdgeId, ctx]);

  // ── node selection from validation highlight ──
  const handleHighlight = useCallback(
    (nodeIds, edgeIds) => {
      setHighlightedNodes(nodeIds);
      setHighlightedEdges(edgeIds);
      if (nodeIds.length) setSelectedNodeIds(nodeIds);
      if (edgeIds.length) setSelectedEdgeId(edgeIds[0]);
      setTimeout(() => {
        setHighlightedNodes([]);
        setHighlightedEdges([]);
      }, 3000);
    },
    [setSelectedNodeIds, setSelectedEdgeId]
  );

  // nodes/edges with sim status + highlight overlays
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        if (!n.data?.node) return n;
        const id = n.data.node.id;
        return {
          ...n,
          data: {
            ...n.data,
            simStatus: simStatus[id],
            highlighted: highlightedNodes.includes(id),
          },
        };
      }),
    [nodes, simStatus, highlightedNodes]
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        data: {
          ...e.data,
          edge: e.data?.edge,
          onDelete: removeEdge,
          highlighted: highlightedEdges.includes(e.id),
        },
      })),
    [edges, highlightedEdges, removeEdge]
  );

  // ── context menu handlers ──
  const handlePaneContextMenu = (e) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, variant: 'pane' });
  };
  const handleNodeContextMenu = (e, node) => {
    e.preventDefault();
    const isGroup = node.type === 'groupNode';
    if (isGroup) {
      setSelectedGroupId(node.id.replace('group:', ''));
      setCtx({ x: e.clientX, y: e.clientY, variant: 'group' });
    } else {
      setCtx({ x: e.clientX, y: e.clientY, variant: selectedNodeIds.length > 1 ? 'node-edge' : 'node' });
    }
  };
  const handleEdgeContextMenu = (e, edge) => {
    e.preventDefault();
    setSelectedEdgeId(edge.id);
    setCtx({ x: e.clientX, y: e.clientY, variant: 'edge' });
  };

  const dropPattern = useCallback(
    (patternId, position) => {
      const pattern = [...PATTERNS_A, ...PATTERNS_B].find((p) => p.id === patternId);
      if (!pattern) return;
      insertPattern(pattern, position);
      toast.success(`Applied pattern: ${pattern.name}`);
    },
    [insertPattern]
  );

  /**
   * Place a component at the center of the visible canvas (with a small
   * cascade offset per click) and select it so its properties show.
   */
  const placeComponentAtCenter = useCallback(
    (type) => {
      const el = canvasWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cascade = (placeOffset % 7) * 28;
      setPlaceOffset((o) => o + 1);
      const position = screenToFlowPosition({
        x: rect.left + rect.width / 2 + cascade,
        y: rect.top + rect.height / 2 + cascade,
      });
      const createdId = editor.addNode?.(type, position);
      if (createdId) setSelectedNodeIds([createdId]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
      setRightPanel('properties');
    },
    [screenToFlowPosition, placeOffset, editor, setSelectedNodeIds, setSelectedEdgeId, setSelectedGroupId]
  );

  // maps nodeId → semantic node for the properties panel
  const nodesById = useMemo(() => {
    const m = {};
    for (const n of allNodes) m[n.id] = n;
    return m;
  }, [allNodes]);
  const edgesById = useMemo(() => {
    const m = {};
    for (const e of allEdges) m[e.id] = e;
    return m;
  }, [allEdges]);
  const groupsById = useMemo(() => {
    const m = {};
    for (const p of document.pages) for (const g of p.groups) m[g.id] = g;
    return m;
  }, [document.pages]);

  const pageById = useMemo(() => {
    const m = {};
    for (const p of document.pages) m[p.pageId] = p;
    return m;
  }, [document.pages]);

  const handleExport = (kind) => {
    const doc = buildDocument();
    if (kind === 'json') exportDesignJson(design, doc);
    else if (kind === 'svg') exportDesignSvg(design, doc);
    else if (kind === 'png') exportDesignPng(design, doc);
    else if (kind === 'pdf') exportDesignPdf(design, doc);
    toast.success(`Exported ${kind.toUpperCase()}`);
  };

  const isSimRunning = rightPanel === 'simulate';

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner message="Loading design…" /></div>;
  }
  if (isError || !serverDesign) {
    return (
      <ErrorState
        title="Design unavailable"
        description={error?.response?.data?.error || error?.message || 'Could not load this design.'}
        action={<button onClick={() => navigate('/system-design')} className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground">Back to studio</button>}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* top strip: back + title + save state */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border/40 bg-card/80 px-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate('/system-design')}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Studio
        </button>
        <FolderOpen size={13} className="text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{design.name}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {autosaving ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Saving…
            </>
          ) : saveError ? (
            <>
              <CloudOff size={11} className="text-destructive" /> Autosave failed
            </>
          ) : dirty ? (
            <>
              <CloudUpload size={11} className="text-amber-500" /> Unsaved changes
            </>
          ) : (
            <>
              <CloudUpload size={11} className="text-green-500" /> Saved{lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString()}` : ''}
            </>
          )}
        </span>
      </div>

      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        canCopy={selectedNodeIds.length > 0}
        canPaste
        hasClipboard={Boolean(editor.clipboard)}
        onCopy={copySelection}
        onPaste={pasteClipboard}
        onDuplicate={duplicateSelection}
        onDelete={deleteSelection}
        canLock={selectedNodeIds.length === 1}
        locked={selectedNodeIds.length === 1 ? nodesById[selectedNodeIds[0]]?.locked : false}
        onToggleLock={() => {
          if (selectedNodeIds.length === 1) {
            const n = nodesById[selectedNodeIds[0]];
            updateNode(n.id, { locked: !n.locked });
          }
        }}
        onGroupSelected={groupSelectedNodes}
        canGroup={selectedNodeIds.length > 1}
        onSave={triggerSave}
        saving={autosaving}
        onReset={() => {
          loadDocument(serverDesign);
          setDirty(false);
          toast.info('Reset to last saved state');
        }}
        onExportJson={() => handleExport('json')}
        activePanels={{ library: leftOpen, ...Object.fromEntries(RIGHT_PANEL_DEFS.map((p) => [p.id, rightPanel === p.id])) }}
        onTogglePanel={(panelId) => {
          if (panelId === 'present') {
            setPresenting((v) => !v);
          } else if (panelId === 'library') {
            setLeftOpen((v) => !v);
          } else {
            if (rightPanel === 'simulate' && panelId !== 'simulate') {
              setSimStatus({});
              setHighlightedNodes([]);
              setHighlightedEdges([]);
            }
            setRightPanel((cur) => (cur === panelId ? 'properties' : panelId));
          }
        }}
        onAddPage={() => {
          const p = addPage(`Page ${document.pages.length + 1}`);
          switchPage(p.pageId);
        }}
      />

      <PagesBar
        pages={document.pages}
        activePageId={pageId}
        onSwitch={switchPage}
        onAdd={() => {
          const p = addPage(`Page ${document.pages.length + 1}`);
          switchPage(p.pageId);
        }}
        onRename={(p, name) => renamePage(p.pageId, name)}
        onSetLevel={(p, level) => setPageLevel(p.pageId, level)}
        onRemove={(pid) => {
          if (document.pages.length > 1) removePage(pid);
        }}
      />

      {/* recover banner */}
      {recoverable && (
        <div className="flex h-8 shrink-0 items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 text-[11px] text-amber-600">
          <CloudUpload size={12} />
          <span className="font-medium">An unsaved draft from a previous session exists.</span>
          <button
            type="button"
            onClick={() => {
              try {
                const draft = JSON.parse(localStorage.getItem(draftKey));
                loadDocument(draft.payload);
                setRecoverable(false);
                setDirty(true);
                toast.success('Draft recovered');
              } catch {
                setRecoverable(false);
              }
            }}
            className="rounded border border-amber-500/40 px-1.5 py-0.5 font-semibold hover:bg-amber-500/10"
          >
            Recover
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setRecoverable(false);
            }}
            className="rounded border border-border/60 px-1.5 py-0.5 hover:bg-muted/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* main grid */}
      <div className="flex min-h-0 flex-1">
        {leftOpen && (
          <aside className="flex w-60 shrink-0 flex-col border-r border-border/40 bg-card/50">
            <div className="flex h-9 shrink-0 items-center border-b border-border/40 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Component library
            </div>
            <ComponentLibrary customComponents={document.customComponents} onSelect={placeComponentAtCenter} />
          </aside>
        )}

        <div className="relative min-w-0 flex-1" ref={canvasWrapRef}>
          <ArchitectureCanvas
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(e, n) => {
              if (n.type === 'groupNode') {
                setSelectedGroupId(n.id.replace('group:', ''));
                setRightPanel('properties');
              } else {
                onNodeClick?.(e, n);
                setRightPanel('properties');
              }
            }}
            onEdgeClick={(e, ed) => {
              onEdgeClick?.(e, ed);
              setRightPanel('properties');
            }}
            onPaneClick={(e) => {
              onPaneClick?.(e);
              setRightPanel('properties');
            }}
            onSelectionChange={(sel) => onSelectionChange?.(sel)}
            onDropComponent={(type, position) => {
              const createdId = editor.addNode?.(type, position.x, position.y);
              if (createdId) {
                setSelectedNodeIds([createdId]);
                setSelectedEdgeId(null);
                setSelectedGroupId(null);
                setRightPanel('properties');
              }
            }}
            onDropPattern={dropPattern}
            onPaneContextMenu={handlePaneContextMenu}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            simulate={isSimRunning && !ctx}
          >
            {/* quick pattern drawer */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {[PATTERNS_A[0], PATTERNS_B[1], PATTERNS_B[0], PATTERNS_A[4]].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/system-design-pattern', p.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    const center = { x: 200 + Math.random() * 400, y: 200 + Math.random() * 300 };
                    dropPattern(p.id, center);
                  }}
                  className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-md backdrop-blur-sm hover:border-primary/40 hover:text-primary"
                  title={`Insert ${p.name} pattern`}
                >
                  {(() => { const Icon = QUICK_PATTERN_ICONS[p.id] || Zap; return <Icon size={11} />; })()} {p.name}
                </button>
              ))}
            </div>
          </ArchitectureCanvas>

          {/* right side panel */}
          <div className="absolute right-0 top-0 z-10 flex h-full w-80 flex-col border-l border-border/40 bg-card/80 backdrop-blur-sm">
            <div className="flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border/40 px-1.5">
              {RIGHT_PANEL_DEFS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setRightPanel(p.id)}
                  className={cn(
                    'shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                    rightPanel === p.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {rightPanel === 'properties' && (
                <PropertiesPanel
                  selectedNodeIds={selectedNodeIds}
                  selectedEdgeId={selectedEdgeId}
                  selectedGroupId={selectedGroupId}
                  pageId={selectedNodeIds.length || selectedEdgeId || selectedGroupId ? null : pageId}
                  nodesById={nodesById}
                  edgesById={edgesById}
                  groupsById={groupsById}
                  page={pageById[pageId]}
                  customComponents={document.customComponents}
                  onUpdateNode={updateNode}
                  onUpdateEdge={updateEdge}
                  onUpdateGroup={updateGroup}
                  onUpdatePage={(p, patch) => {
                    if (patch.name !== undefined) renamePage(p.pageId, patch.name);
                    if (patch.level !== undefined) setPageLevel(p.pageId, patch.level);
                  }}
                  onDeleteSelection={deleteSelection}
                />
              )}
              {rightPanel === 'validation' && (
                <ValidationPanel designId={id} getData={getActivePageDocument} onHighlight={handleHighlight} />
              )}
              {rightPanel === 'capacity' && (
                <CapacityPanel
                  capacityInputs={document.capacityInputs}
                  onUpdateInputs={updateCapacityInputs}
                  nodes={allNodes}
                  edges={allEdges}
                  pageId={pageId}
                />
              )}
              {rightPanel === 'versions' && <VersionsPanel designId={id} />}
              {rightPanel === 'requirements' && (
                <RequirementsPanel
                  requirements={document.requirements}
                  decisions={document.decisions}
                  assumptions={document.assumptions}
                  onAddRequirement={addRequirement}
                  onUpdateRequirement={updateRequirement}
                  onRemoveRequirement={removeRequirement}
                  onAddDecision={addDecision}
                  onUpdateDecision={updateDecision}
                  onRemoveDecision={removeDecision}
                  onAddAssumption={addAssumption}
                  onUpdateAssumption={updateAssumption}
                  onRemoveAssumption={removeAssumption}
                />
              )}
              {rightPanel === 'simulate' && (
                <ChaosSimulator nodes={allNodes} edges={allEdges} pageId={pageId} onSimStatus={setSimStatus} />
              )}
              {rightPanel === 'docs' && (
                <DocumentationPanel design={design} document={document} onDownloadJson={() => handleExport('json')} onExport={handleExport} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* context menu */}
      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          variant={ctx.variant}
          onClose={() => setCtx(null)}
          actions={{
            addGroup: (boundaryType) => addGroup(boundaryType),
            paste: pasteClipboard,
            canPaste: true,
            copy: copySelection,
            canCopy: selectedNodeIds.length > 0,
            duplicate: duplicateSelection,
            lock: () => {
              if (selectedNodeIds.length === 1) {
                const n = nodesById[selectedNodeIds[0]];
                if (n) updateNode(n.id, { locked: true });
              }
            },
            unlock: () => {
              if (selectedNodeIds.length === 1) {
                const n = nodesById[selectedNodeIds[0]];
                if (n) updateNode(n.id, { locked: false });
              }
            },
            canLock: selectedNodeIds.length === 1,
            canGroup: selectedNodeIds.length > 1,
            group: groupSelectedNodes,
            canDelete: selectedNodeIds.length > 0,
            delete: deleteSelection,
            copyEdge: () => setSelectedEdgeId(selectedEdgeId),
            deleteEdge: () => selectedEdgeId && removeEdge(selectedEdgeId),
            lockGroup: () => selectedGroupId && updateGroup(selectedGroupId, { locked: true }),
            ungroup: () => {
              if (selectedGroupId) ungroup?.(selectedGroupId);
            },
            deleteGroup: () => selectedGroupId && editor.removeGroup(selectedGroupId),
          }}
        />
      )}

      {presenting && <PresentationMode design={design} document={document} onClose={() => setPresenting(false)} />}
    </div>
  );
};

const SystemDesignEditorPage = () => (
  <ReactFlowProvider>
    <EditorInner />
  </ReactFlowProvider>
);

export default SystemDesignEditorPage;
