import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Play,
  History,
  LayoutTemplate,
  Terminal,
  FileCode,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  Upload,
  Cpu,
  RefreshCw,
  FolderKanban,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import Explorer from '../components/Explorer';
import PropertiesPanel from '../components/PropertiesPanel';
import Console from '../components/Console';
import TableNode from '../components/TableNode';
import RelationshipEdge from '../components/RelationshipEdge';
import CreateDatabaseModal from '../components/CreateDatabaseModal';

import { parseDBML, generateDBML } from '../parser/erdParser';
import { reverseEngineerSQL } from '../reverse/reverseEngineer';
import { validateSchema } from '../validation/schemaValidator';
import DATABASE_TEMPLATES from '../constants/presets';

import * as databaseStudioApi from '@/services/databaseStudioApi';
import { useProjects } from '@/hooks/useProjects';

const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

// ── Heuristic AI generator for prompt-based schemas ──
function generateSchemaFromPrompt(prompt) {
  const p = prompt.toLowerCase();
  
  if (p.includes('school') || p.includes('student') || p.includes('class')) {
    return {
      name: 'School Management Model',
      code: DATABASE_TEMPLATES[0].code,
    };
  }
  if (p.includes('hospital') || p.includes('patient') || p.includes('doctor')) {
    return {
      name: 'Hospital Management Model',
      code: DATABASE_TEMPLATES[1].code,
    };
  }
  if (p.includes('ecommerce') || p.includes('shop') || p.includes('product') || p.includes('cart')) {
    return {
      name: 'E-Commerce Platform Model',
      code: DATABASE_TEMPLATES[2].code,
    };
  }
  if (p.includes('crm') || p.includes('company') || p.includes('deal')) {
    return {
      name: 'CRM Database Model',
      code: DATABASE_TEMPLATES[3].code,
    };
  }
  if (p.includes('hr') || p.includes('employee') || p.includes('salary')) {
    return {
      name: 'HRMS Database Model',
      code: DATABASE_TEMPLATES[4].code,
    };
  }

  // Dynamic code-generation based on entities mentioned
  const tables = [];
  const rels = [];

  if (p.includes('blog') || p.includes('post') || p.includes('article')) {
    tables.push({
      name: 'posts',
      fields: [
        { name: 'id', type: 'integer', isPk: true, isIncrement: true, isNullable: false },
        { name: 'title', type: 'varchar', isNullable: false },
        { name: 'body', type: 'text', isNullable: true },
        { name: 'author_id', type: 'integer', isNullable: false },
        { name: 'created_at', type: 'timestamp', isNullable: false }
      ]
    });
  }

  if (p.includes('author') || p.includes('writer') || p.includes('user')) {
    tables.push({
      name: 'authors',
      fields: [
        { name: 'id', type: 'integer', isPk: true, isIncrement: true, isNullable: false },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'email', type: 'varchar', isUnique: true, isNullable: false }
      ]
    });
    if (p.includes('blog') || p.includes('post') || p.includes('article')) {
      rels.push('Ref: posts.author_id > authors.id');
    }
  }

  if (p.includes('comment')) {
    tables.push({
      name: 'comments',
      fields: [
        { name: 'id', type: 'integer', isPk: true, isIncrement: true, isNullable: false },
        { name: 'post_id', type: 'integer', isNullable: false },
        { name: 'content', type: 'text', isNullable: false },
        { name: 'created_at', type: 'timestamp', isNullable: false }
      ]
    });
    if (p.includes('blog') || p.includes('post') || p.includes('article')) {
      rels.push('Ref: comments.post_id > posts.id');
    }
  }

  if (!tables.length) {
    tables.push({
      name: 'records',
      fields: [
        { name: 'id', type: 'integer', isPk: true, isIncrement: true, isNullable: false },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'created_at', type: 'timestamp', isNullable: false }
      ]
    });
  }

  let dbmlCode = '';
  tables.forEach(t => {
    dbmlCode += `Table ${t.name} {\n`;
    t.fields.forEach(f => {
      const opts = [];
      if (f.isPk) opts.push('pk');
      if (f.isIncrement) opts.push('increment');
      if (!f.isNullable) opts.push('notnull');
      if (f.isUnique) opts.push('unique');
      const optStr = opts.length ? ` [${opts.join(', ')}]` : '';
      dbmlCode += `  ${f.name} ${f.type}${optStr}\n`;
    });
    dbmlCode += '}\n\n';
  });

  rels.forEach(r => {
    dbmlCode += `${r}\n`;
  });

  return {
    name: 'AI Generated Model',
    code: dbmlCode.trim() + '\n',
  };
}

const DatabaseStudioInner = () => {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Diagrams state
  const [diagrams, setDiagrams] = useState([]);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  
  // Mode selection
  const [editMode, setEditMode] = useState('visual'); // 'visual' | 'code' | 'split'
  
  // Parser schema state
  const [code, setCode] = useState('');
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  
  // Canvas React Flow elements
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  
  // Interactive tools state
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importSql, setImportSql] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const reactFlowInstance = useRef(null);
  const isSyncingFromCode = useRef(false);

  // Load project diagrams
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  const loadProjectDiagrams = useCallback(async (projId) => {
    try {
      const res = await databaseStudioApi.getDiagrams(projId);
      setDiagrams(res.data?.diagrams || []);
    } catch (err) {
      toast.error('Failed to load diagrams list');
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDiagrams(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectDiagrams]);

  // ── Sync Code → UI ──
  useEffect(() => {
    if (isSyncingFromCode.current) return;
    
    const delayDebounceFn = setTimeout(() => {
      const parsed = parseDBML(code);
      setSyntaxErrors(parsed.errors || []);

      if (parsed.errors && parsed.errors.length > 0) {
        // Halt synchronization if syntax errors are present
        return;
      }

      setTables(parsed.tables || []);
      setRelationships(parsed.relationships || []);

      // Build visual Node/Edge positions mapping
      setNodes((prevNodes) => {
        return (parsed.tables || []).map((t, idx) => {
          const existing = prevNodes.find((n) => n.id === t.name);
          return {
            id: t.name,
            type: 'tableNode',
            position: existing ? existing.position : { x: 100 + idx * 280, y: 100 + (idx % 2) * 150 },
            data: { name: t.name, fields: t.fields, color: existing?.data?.color || '#6366f1' },
          };
        });
      });

      setEdges(() => {
        return (parsed.relationships || []).map((r) => ({
          id: r.id,
          source: r.fromTable,
          target: r.toTable,
          sourceHandle: r.fromField,
          targetHandle: r.toField,
          type: 'relationship',
          data: { type: r.type },
        }));
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [code]);

  // ── Sync UI → Code ──
  const syncVisualToCode = useCallback((updatedTables, updatedRels) => {
    isSyncingFromCode.current = true;
    const newCode = generateDBML(updatedTables, updatedRels);
    setCode(newCode);
    setTables(updatedTables);
    setRelationships(updatedRels);
    setTimeout(() => {
      isSyncingFromCode.current = false;
    }, 50);
  }, []);

  // ── Auto Layout Engine (Dagre) ──
  const triggerAutoLayout = useCallback(() => {
    const g = new Dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', nodesep: 120, ranksep: 180 });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 240;
    const nodeHeight = 220;

    nodes.forEach((node) => {
      g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    Dagre.layout(g);

    const updated = nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: {
          x: pos.x - nodeWidth / 2,
          y: pos.y - nodeHeight / 2,
        },
      };
    });

    setNodes(updated);
    toast.success('Auto layout complete');
  }, [nodes, edges]);

  // ── Node Canvas actions ──
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params) => {
    const fromTable = params.source;
    const fromField = params.sourceHandle;
    const toTable = params.target;
    const toField = params.targetHandle;

    if (!fromField || !toField) return;

    // Check duplicate relationship
    const exists = relationships.some(
      r => r.fromTable === fromTable && r.fromField === fromField && r.toTable === toTable && r.toField === toField
    );
    if (exists) return;

    const newRel = {
      id: `rel_${fromTable}_${fromField}_${toTable}_${toField}`,
      fromTable,
      fromField,
      toTable,
      toField,
      type: 'many-to-one',
    };

    const updatedRels = [...relationships, newRel];
    // Mark the local field in table as foreign key (FK)
    const updatedTables = tables.map(t => {
      if (t.name === fromTable) {
        return {
          ...t,
          fields: t.fields.map(f => f.name === fromField ? { ...f, isFk: true } : f)
        };
      }
      return t;
    });

    syncVisualToCode(updatedTables, updatedRels);
    
    // Add visual edge
    setEdges((eds) => addEdge({
      ...params,
      id: newRel.id,
      type: 'relationship',
      data: { type: 'many-to-one' }
    }, eds));

    toast.success('Relationship linked');
  }, [tables, relationships, syncVisualToCode]);

  // ── Database Schema Properties Editors ──
  const handleUpdateTable = useCallback((nodeId, updatedTableData) => {
    const updatedTables = tables.map(t => t.name === nodeId ? {
      ...t,
      name: updatedTableData.name,
      fields: updatedTableData.fields
    } : t);

    // Sync node colors/data visually
    setNodes(nds => nds.map(n => n.id === nodeId ? {
      ...n,
      id: updatedTableData.name,
      data: { ...n.data, name: updatedTableData.name, fields: updatedTableData.fields, color: updatedTableData.color }
    } : n));

    // Update edges referencing the renamed table
    const updatedRels = relationships.map(rel => {
      let updated = { ...rel };
      if (rel.fromTable === nodeId) updated.fromTable = updatedTableData.name;
      if (rel.toTable === nodeId) updated.toTable = updatedTableData.name;
      return updated;
    });

    syncVisualToCode(updatedTables, updatedRels);
  }, [tables, relationships, syncVisualToCode]);

  const handleDeleteTable = useCallback((nodeId) => {
    const updatedTables = tables.filter(t => t.name !== nodeId);
    const updatedRels = relationships.filter(r => r.fromTable !== nodeId && r.toTable !== nodeId);
    
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    syncVisualToCode(updatedTables, updatedRels);
    toast.info('Table dropped');
  }, [tables, relationships, syncVisualToCode]);

  const handleUpdateRelationship = useCallback((edgeId, edgeDataUpdate) => {
    const updatedRels = relationships.map(r => r.id === edgeId ? { ...r, ...edgeDataUpdate } : r);
    setEdges(eds => eds.map(e => e.id === edgeId ? { ...e, data: { ...e.data, ...edgeDataUpdate } } : e));
    syncVisualToCode(tables, updatedRels);
  }, [tables, relationships, syncVisualToCode]);

  const handleDeleteRelationship = useCallback((edgeId) => {
    const rel = relationships.find(r => r.id === edgeId);
    const updatedRels = relationships.filter(r => r.id !== edgeId);
    
    // Remove FK visual flag if no other relationships reference this field
    const updatedTables = tables.map(t => {
      if (rel && t.name === rel.fromTable) {
        return {
          ...t,
          fields: t.fields.map(f => f.name === rel.fromField ? { ...f, isFk: false } : f)
        };
      }
      return t;
    });

    setEdges(eds => eds.filter(e => e.id !== edgeId));
    setSelectedEdgeId(null);
    syncVisualToCode(updatedTables, updatedRels);
    toast.info('Connection deleted');
  }, [tables, relationships, syncVisualToCode]);

  // ── Diagram CRUD actions ──
  const loadDiagramIntoState = useCallback((diagram) => {
    setCurrentDiagram(diagram);

    // Parse code immediately so the canvas/schema reflect this diagram
    // even if the code string happens to match the previously loaded one.
    const parsed = parseDBML(diagram.code || '');
    setSyntaxErrors(parsed.errors || []);
    setCode(diagram.code || '');

    if (parsed.errors && parsed.errors.length > 0) {
      setTables([]);
      setRelationships([]);
      setNodes(diagram.nodes || []);
      setEdges(diagram.edges || []);
      return;
    }

    setTables(parsed.tables || []);
    setRelationships(parsed.relationships || []);

    setNodes((prevNodes) => {
      if (diagram.nodes && diagram.nodes.length) return diagram.nodes;
      return (parsed.tables || []).map((t, idx) => {
        const existing = prevNodes.find((n) => n.id === t.name);
        return {
          id: t.name,
          type: 'tableNode',
          position: existing ? existing.position : { x: 100 + idx * 280, y: 100 + (idx % 2) * 150 },
          data: { name: t.name, fields: t.fields, color: existing?.data?.color || '#6366f1' },
        };
      });
    });

    setEdges(() => {
      if (diagram.edges && diagram.edges.length) return diagram.edges;
      return (parsed.relationships || []).map((r) => ({
        id: r.id,
        source: r.fromTable,
        target: r.toTable,
        sourceHandle: r.fromField,
        targetHandle: r.toField,
        type: 'relationship',
        data: { type: r.type },
      }));
    });
  }, []);

  const handleSelectDiagram = useCallback(async (diag) => {
    try {
      const res = await databaseStudioApi.getDiagram(diag._id);
      const diagram = res.data?.diagram || res.diagram; // fallback just in case
      loadDiagramIntoState(diagram);
      toast.success(`Loaded model: ${diagram.name}`);
    } catch (err) {
      toast.error('Failed to load diagram');
    }
  }, [loadDiagramIntoState]);

  const handleCreateDiagram = useCallback(() => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    setCreateModalOpen(true);
  }, [selectedProjectId]);

  const handleDiagramCreated = useCallback(async (diagramData) => {
    try {
      const res = await databaseStudioApi.createDiagram(diagramData);
      toast.success('Diagram created successfully');
      loadProjectDiagrams(selectedProjectId);
      handleSelectDiagram(res.data?.diagram || res.diagram);
    } catch (err) {
      toast.error('Failed to create diagram');
      throw err;
    }
  }, [selectedProjectId, loadProjectDiagrams, handleSelectDiagram]);

  const handleDeleteDiagram = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this database model?')) return;
    try {
      await databaseStudioApi.deleteDiagram(id);
      toast.success('Model deleted');
      if (currentDiagram?._id === id) {
        setCurrentDiagram(null);
        setCode('');
        setTables([]);
        setRelationships([]);
        setNodes([]);
        setEdges([]);
        setSyntaxErrors([]);
      }
      loadProjectDiagrams(selectedProjectId);
    } catch (err) {
      toast.error('Failed to delete diagram');
    }
  }, [selectedProjectId, currentDiagram, loadProjectDiagrams]);

  const handleSaveDiagram = useCallback(async (saveVer = false) => {
    if (!currentDiagram) {
      toast.error('Select or create a diagram first');
      return;
    }

    try {
      await databaseStudioApi.updateDiagram(currentDiagram._id, {
        code,
        nodes,
        edges,
        createNewVersion: saveVer,
      });
      toast.success(saveVer ? 'Saved version to history' : 'Diagram saved');
      loadProjectDiagrams(selectedProjectId);
      // Reload diagram to fetch updated version stack
      const res = await databaseStudioApi.getDiagram(currentDiagram._id);
      setCurrentDiagram(res.data.diagram);
    } catch (err) {
      toast.error('Failed to save diagram');
    }
  }, [currentDiagram, code, nodes, edges, selectedProjectId, loadProjectDiagrams]);

  const handleRestoreVersion = useCallback(async (verNum) => {
    if (!currentDiagram) return;
    if (!confirm(`Restore model to version v${verNum}?`)) return;

    try {
      const res = await databaseStudioApi.restoreDiagramVersion(currentDiagram._id, verNum);
      const diagram = res.data.diagram;
      loadDiagramIntoState(diagram);
      toast.success(`Restored to version v${verNum}`);
    } catch (err) {
      toast.error('Failed to restore version');
    }
  }, [currentDiagram, loadDiagramIntoState]);

  // Load predefined template
  const handleLoadTemplate = (tpl) => {
    if (code && !confirm('Discard current edits to load this template?')) return;
    setCode(tpl.code);
    setNodes([]);
    setEdges([]);
    toast.success(`Loaded template: ${tpl.name}`);
  };

  // ── Import/Reverse Engineering DDL ──
  const handleImportSQL = () => {
    if (!importSql.trim()) return;
    const parsed = reverseEngineerSQL(importSql);
    
    // Convert parsed tables to DBML
    const dbml = generateDBML(parsed.tables, parsed.relationships);
    setCode(dbml);
    setImportOpen(false);
    setImportSql('');
    toast.success('SQL DDL successfully reverse engineered');
  };

  // ── Heuristic AI Generation ──
  const handleAIGenerate = () => {
    if (!promptText.trim()) return;
    const result = generateSchemaFromPrompt(promptText);
    setCode(result.code);
    setAiPromptOpen(false);
    setPromptText('');
    toast.success(`Generated: ${result.name}`);
  };

  // Selected node/edge details
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    return edges.find((e) => e.id === selectedEdgeId) || null;
  }, [edges, selectedEdgeId]);

  // Tab change
  const renderCanvasSection = () => {
    return (
      <div className="flex-1 relative bg-background/50 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          minZoom={0.2}
          maxZoom={2}
          onInit={(ref) => { reactFlowInstance.current = ref; }}
        >
          <Background color="hsl(var(--border))" gap={15} />
          <MiniMap style={{ background: 'var(--card)' }} maskColor="rgba(0,0,0,0.15)" />
          <Controls />
        </ReactFlow>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden text-foreground">
      {/* ── Left Sidebar Explorer ── */}
      <Explorer
        diagrams={diagrams}
        currentDiagram={currentDiagram}
        onSelectDiagram={handleSelectDiagram}
        onCreateDiagram={handleCreateDiagram}
        onDeleteDiagram={handleDeleteDiagram}
        onLoadTemplate={handleLoadTemplate}
        onRestoreVersion={handleRestoreVersion}
        isCollapsed={isExplorerCollapsed}
        onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
      />

      {/* ── Main Design Workspace ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border/40">
        
        {/* Workspace Toolbar */}
        <div className="flex items-center justify-between px-4 h-12 bg-card border-b border-border/40 shrink-0 select-none">
          <div className="flex items-center gap-4">
            {/* Project Selector */}
            <div className="flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex h-7 rounded border border-border/60 bg-background px-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {loadingProjects ? (
                  <option>Loading...</option>
                ) : (
                  projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Model Title */}
            {currentDiagram && (
              <span className="text-xs font-black text-foreground bg-muted/65 px-2 py-1 rounded border border-border/30">
                {currentDiagram.name}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Editing Modes */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40 mr-2">
              <button
                onClick={() => setEditMode('visual')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  editMode === 'visual' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Visual</span>
              </button>
              <button
                onClick={() => setEditMode('code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  editMode === 'code' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileCode className="h-3 w-3" />
                <span>Code Only</span>
              </button>
              <button
                onClick={() => setEditMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  editMode === 'split' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                <span>Split</span>
              </button>
            </div>

            {/* Layout */}
            <button
              onClick={triggerAutoLayout}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              title="Re-layout all tables automatically"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Layout</span>
            </button>

            {/* AI Generator */}
            <button
              onClick={() => setAiPromptOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold cursor-pointer active:scale-95 transition-all"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>AI Prompt</span>
            </button>

            {/* Import SQL */}
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Reverse DDL</span>
            </button>

            {/* Save */}
            <button
              onClick={() => handleSaveDiagram(false)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              title="Save changes to database"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>

            {/* Save Version */}
            <button
              onClick={() => handleSaveDiagram(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold cursor-pointer active:scale-95 transition-all"
              title="Commit version to history"
            >
              <History className="h-3.5 w-3.5" />
              <span>Commit</span>
            </button>
          </div>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          {/* Syntax Error Alert Banner */}
          {syntaxErrors.length > 0 && (
            <div className="absolute top-2 left-2 right-2 z-50 bg-destructive/95 text-white p-2.5 rounded-lg shadow-lg flex items-start gap-2.5 text-xs select-none">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Syntax Error detected (Line {syntaxErrors[0].line}):</span>
                <p className="opacity-90 mt-0.5">{syntaxErrors[0].message}</p>
              </div>
            </div>
          )}

          {/* Edit Mode Content */}
          {editMode === 'visual' && renderCanvasSection()}

          {editMode === 'code' && (
            <div className="flex-1 flex bg-card/10">
              {/* Lines bar */}
              <div className="w-10 bg-muted/15 border-r border-border/10 py-3 text-right pr-2 text-muted-foreground/50 select-none font-mono text-xs select-none">
                {code.split('\n').map((_, idx) => (
                  <div key={idx} className="h-5 leading-5">{idx + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Table users {&#10;  id integer [pk]&#10;  name varchar&#10;}"
                className="flex-1 bg-transparent p-3 outline-none font-mono text-xs text-foreground/90 leading-5 resize-none h-full selection:bg-primary/25"
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    const val = e.target.value;
                    setCode(val.substring(0, start) + '  ' + val.substring(end));
                    setTimeout(() => {
                      e.target.selectionStart = e.target.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
              />
            </div>
          )}

          {editMode === 'split' && (
            <div className="flex-1 flex overflow-hidden h-full">
              {/* Code pane */}
              <div className="w-1/2 flex border-r border-border/40 bg-card/5">
                <div className="w-9 bg-muted/10 border-r border-border/10 py-3 text-right pr-2 text-muted-foreground/40 font-mono text-[11px] select-none">
                  {code.split('\n').map((_, idx) => (
                    <div key={idx} className="h-5 leading-5">{idx + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-transparent p-3 outline-none font-mono text-[11px] text-foreground/85 leading-5 resize-none h-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      const val = e.target.value;
                      setCode(val.substring(0, start) + '  ' + val.substring(end));
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = start + 2;
                      }, 0);
                    }
                  }}
                />
              </div>
              {/* Visual canvas pane */}
              <div className="w-1/2 h-full flex flex-col">
                {renderCanvasSection()}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Console Logging Panel */}
        <Console
          tables={tables}
          relationships={relationships}
          isCollapsed={isConsoleCollapsed}
          onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
        />
      </div>

      {/* ── Right Sidebar Properties Panel ── */}
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateTable={handleUpdateTable}
        onDeleteTable={handleDeleteTable}
        onUpdateRelationship={handleUpdateRelationship}
        onDeleteRelationship={handleDeleteRelationship}
        isCollapsed={isPropertiesCollapsed}
        onToggleCollapse={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
      />

      {/* ── AI Prompt Modal ── */}
      {aiPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border/40 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground">AI Schema Prompt Generator</h3>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Create a blogging database model with users, posts, and comments..."
              rows={4}
              className="w-full rounded-lg border border-input bg-background/50 p-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setAiPromptOpen(false)}
                className="h-8 px-3 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                Generate Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SQL Import / Reverse DDL Modal ── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card border border-border/40 rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground">Reverse Engineer SQL DDL</h3>
            <textarea
              value={importSql}
              onChange={(e) => setImportSql(e.target.value)}
              placeholder="Paste CREATE TABLE statements here...&#10;e.g. CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255));"
              rows={8}
              className="w-full rounded-lg border border-input bg-background/50 p-3 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setImportOpen(false)}
                className="h-8 px-3 rounded-lg border border-border/60 hover:bg-muted text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSQL}
                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Database Model Modal ── */}
      <CreateDatabaseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        selectedProjectId={selectedProjectId}
        onCreated={handleDiagramCreated}
      />
    </div>
  );
};

const DatabaseStudioPage = () => {
  return (
    <ReactFlowProvider>
      <DatabaseStudioInner />
    </ReactFlowProvider>
  );
};

export default DatabaseStudioPage;
