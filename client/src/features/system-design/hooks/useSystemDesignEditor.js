import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import {
  createNode, createEdge, createGroup, createPage, genId, getComponentDef,
} from '../constants/architecture';

const MAX_HISTORY = 60;
const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

const normalizeNode = (n) => {
  const def = getComponentDef(n?.type) || null;
  return {
    id: n?.id || genId('node'),
    type: def ? def.type : n?.type || 'application-services.custom-service',
    category: n?.category || (n?.type ? String(n.type).split('.')[0] : 'custom'),
    name: n?.name || (def ? def.label : 'Component'),
    description: n?.description || '',
    position: n?.position || { x: 0, y: 0 },
    size: n?.size || { w: 220, h: 96 },
    properties: n?.properties || {},
    metadata: n?.metadata || {},
    style: n?.style || {},
    locked: Boolean(n?.locked),
    hidden: Boolean(n?.hidden),
    groupId: n?.groupId || null,
  };
};

const normalizePage = (p, index = 0) => ({
  pageId: p?.pageId || genId('page'),
  name: p?.name || `Page ${index + 1}`,
  level: p?.level || 'hld',
  nodes: (p?.nodes || []).map((n) => normalizeNode(n)),
  edges: (p?.edges || []).map((e) => ({
    id: e?.id || genId('edge'),
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || null,
    targetHandle: e.targetHandle || null,
    type: 'archEdge',
    protocol: e.protocol || 'REST',
    connectionType: e.connectionType || 'HTTP',
    direction: e.direction || 'one-way',
    syncMode: e.syncMode || 'sync',
    label: e.label || '',
    traffic: { rps: e.traffic?.rps ?? 100, peakRps: e.traffic?.peakRps ?? 0 },
    latency: { p50: e.latency?.p50 ?? 30, p95: e.latency?.p95 ?? 80, p99: e.latency?.p99 ?? 150, unit: e.latency?.unit || 'ms' },
    payload: e.payload ?? 20,
    timeout: e.timeout ?? 5,
    retry: e.retry ?? 0,
    backoff: e.backoff || 'none',
    circuitBreaker: Boolean(e.circuitBreaker),
    animated: Boolean(e.animated),
    style: e.style || {},
    metadata: e.metadata || {},
  })),
  groups: (p?.groups || []).map((g) => ({
    id: g?.id || genId('group'),
    name: g?.name || 'Boundary',
    boundaryType: g?.boundaryType || 'custom',
    position: g?.position || { x: 0, y: 0 },
    size: g?.size || { w: 600, h: 400 },
    color: g?.color || '#6366f1',
    locked: Boolean(g?.locked),
    metadata: g?.metadata || {},
  })),
});

export const createBlankDocument = () => ({
  name: '',
  description: '',
  level: 'hld',
  pages: [normalizePage(createPage('HLD', 'hld'))],
  requirements: [],
  decisions: [],
  assumptions: [],
  patternsUsed: [],
  capacityInputs: {},
  customComponents: [],
  metadata: { icon: 'Network', color: '#6366f1', tags: [], architectureFormatVersion: 1 },
});

export const normalizeDocument = (design) => ({
  name: design?.name || '',
  description: design?.description || '',
  level: design?.level || 'hld',
  pages: (design?.pages && design.pages.length ? design.pages : [createPage('HLD', 'hld')]).map(normalizePage),
  requirements: Array.isArray(design?.requirements) ? design.requirements : [],
  decisions: Array.isArray(design?.decisions) ? design.decisions : [],
  assumptions: Array.isArray(design?.assumptions) ? design.assumptions : [],
  patternsUsed: Array.isArray(design?.patternsUsed) ? design.patternsUsed : [],
  capacityInputs: design?.capacityInputs || {},
  customComponents: Array.isArray(design?.customComponents) ? design.customComponents : [],
  metadata: { ...{ icon: 'Network', color: '#6366f1', tags: [], architectureFormatVersion: 1 }, ...(design?.metadata || {}) },
});

/**
 * useSystemDesignEditor — the semantic architecture editor core.
 *
 * The semantic document (pages -> nodes/edges/groups + requirements/decisions/
 * assumptions/patterns/capacity) is the single source of truth. The React Flow
 * node/edge arrays are a render projection only. Undo/redo snapshots the whole
 * document; the canvas is never the source of truth.
 */
export const useSystemDesignEditor = (initialDocument = null) => {
  const [document, setDocument] = useState(() => normalizeDocument(initialDocument));
  const [activePageId, setActivePageId] = useState(() => document.pages[0]?.pageId || null);
  const [dirty, setDirty] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const draggingRef = useRef(false);

  // ── active page ──
  const page = useMemo(
    () => document.pages.find((p) => p.pageId === activePageId) || document.pages[0],
    [document, activePageId]
  );
  const pageId = page?.pageId || null;

  // ── document mutations ──
  const setDocumentSafe = useCallback((updater) => {
    setDocument((doc) => updater(clone(doc)));
    setDirty(true);
  }, []);

  const pushUndo = useCallback(() => {
    setDocument((doc) => {
      setUndoStack((stack) => {
        const next = [...stack, clone(doc)];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setRedoStack([]);
      return doc;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const prev = stack[stack.length - 1];
      setDocument((doc) => {
        setRedoStack((r) => [...r, clone(doc)].slice(-MAX_HISTORY));
        return clone(prev);
      });
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
      setDirty(true);
      return stack.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      if (!stack.length) return stack;
      const next = stack[stack.length - 1];
      setDocument((doc) => {
        setUndoStack((u) => [...u, clone(doc)].slice(-MAX_HISTORY));
        return clone(next);
      });
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
      setDirty(true);
      return stack.slice(0, -1);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    setDirty(false);
  }, []);

  // ── rebuild the React Flow projection from the semantic page ──
  const projectionSigRef = useRef('');
  const rebuild = useCallback((pageData) => {
    if (!pageData) return;
    const nodes = [];
    for (const g of pageData.groups || []) {
      nodes.push({
        id: `group:${g.id}`,
        type: 'groupNode',
        position: { ...g.position },
        width: g.size.w,
        height: g.size.h,
        style: { width: g.size.w, height: g.size.h },
        data: { group: g },
        zIndex: -1,
        selectable: false,
        focusable: false,
        draggable: !g.locked,
        deletable: false,
      });
    }
    for (const n of pageData.nodes || []) {
      if (n.hidden) continue;
      nodes.push({
        id: n.id,
        type: 'architectureNode',
        position: { ...n.position },
        width: n.size.w,
        height: n.size.h,
        data: { node: n },
        draggable: !n.locked,
        selectable: !n.locked,
        style: { width: n.size.w, height: n.size.h },
      });
    }
    const nodeSet = new Map((pageData.nodes || []).map((n) => [n.id, n]));
    const edges = (pageData.edges || [])
      .filter((e) => !(nodeSet.get(e.source)?.hidden) && !(nodeSet.get(e.target)?.hidden))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        type: 'archEdge',
        data: { edge: e },
        animated: Boolean(e.animated),
      }));
    const sig = JSON.stringify([nodes, edges]);
    if (sig === projectionSigRef.current) return;
    projectionSigRef.current = sig;
    setRfNodes(nodes);
    setRfEdges(edges);
  }, []);

  // keep projection in sync with the active page
  useEffect(() => {
    rebuild(page);
  }, [page, rebuild]);

  // ── load / reset ──
  const loadDocument = useCallback(
    (doc) => {
      const normalized = normalizeDocument(doc);
      setDocument(normalized);
      setActivePageId(normalized.pages[0]?.pageId || null);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
      setClipboard(null);
      clearHistory();
    },
    [clearHistory]
  );

  const resetDocument = useCallback(() => {
    loadDocument(createBlankDocument());
  }, [loadDocument]);

  // ── React Flow change handlers ──
  const onNodesChange = useCallback(
    (changes) => {
      let groupDelta = null;
      let groupResize = null;
      for (const ch of changes) {
        if (ch.type === 'position' && ch.position && ch.dragging === false) {
          if (ch.id.startsWith('group:')) {
            const gid = ch.id.slice(6);
            const g = page.groups.find((x) => x.id === gid);
            if (g) groupDelta = { x: ch.position.x - g.position.x, y: ch.position.y - g.position.y, id: gid };
          } else {
            setDocumentSafe((doc) => {
              const p = doc.pages.find((pg) => pg.pageId === pageId);
              const n = p?.nodes.find((x) => x.id === ch.id);
              if (n) n.position = { ...ch.position };
              return doc;
            });
          }
        }
        if (ch.type === 'dimensions' && ch.dimensions) {
          if (ch.id.startsWith('group:')) {
            const gid = ch.id.slice(6);
            groupResize = { id: gid, w: ch.dimensions.width, h: ch.dimensions.height };
          } else {
            setDocumentSafe((doc) => {
              const p = doc.pages.find((pg) => pg.pageId === pageId);
              const n = p?.nodes.find((x) => x.id === ch.id);
              if (n) n.size = { w: ch.dimensions.width, h: ch.dimensions.height };
              return doc;
            });
          }
        }
        if (ch.type === 'remove') {
          setDocumentSafe((doc) => {
            const p = doc.pages.find((pg) => pg.pageId === pageId);
            if (!p) return doc;
            p.nodes = p.nodes.filter((n) => n.id !== ch.id);
            p.edges = p.edges.filter((e) => e.source !== ch.id && e.target !== ch.id);
            return doc;
          });
        }
        if (ch.type === 'toggleVisibility') {
          setDocumentSafe((doc) => {
            const p = doc.pages.find((pg) => pg.pageId === pageId);
            const n = p?.nodes.find((x) => x.id === ch.id);
            if (n) n.hidden = !n.hidden;
            return doc;
          });
        }
      }
      if (groupDelta) {
        setDocumentSafe((doc) => {
          const p = doc.pages.find((pg) => pg.pageId === pageId);
          const g = p?.groups.find((x) => x.id === groupDelta.id);
          if (g) {
            g.position.x += groupDelta.x;
            g.position.y += groupDelta.y;
            for (const n of p.nodes) {
              if (n.groupId === g.id) {
                n.position.x += groupDelta.x;
                n.position.y += groupDelta.y;
              }
            }
          }
          return doc;
        });
      }
      if (groupResize) {
        setDocumentSafe((doc) => {
          const p = doc.pages.find((pg) => pg.pageId === pageId);
          const g = p?.groups.find((x) => x.id === groupResize.id);
          if (g) g.size = { w: groupResize.w, h: groupResize.h };
          return doc;
        });
      }
      setRfNodes((nds) => applyNodeChanges(changes, nds));
    },
    [page, pageId, setDocumentSafe]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      for (const ch of changes) {
        if (ch.type === 'remove') {
          setDocumentSafe((doc) => {
            const p = doc.pages.find((pg) => pg.pageId === pageId);
            if (p) p.edges = p.edges.filter((e) => e.id !== ch.id);
            return doc;
          });
        }
      }
      setRfEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [pageId, setDocumentSafe]
  );

  const onSelectionChange = useCallback(({ nodes, edges }) => {
    setSelectedNodeIds(nodes.map((n) => n.id));
    setSelectedEdgeId(edges[0]?.id || null);
  }, []);

  const onNodeClick = useCallback((_, node) => {
    if (node.id.startsWith('group:')) {
      setSelectedGroupId(node.id.slice(6));
      setSelectedEdgeId(null);
      setSelectedNodeIds([]);
    } else {
      setSelectedNodeIds([node.id]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
    }
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeIds([]);
    setSelectedGroupId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setSelectedGroupId(null);
  }, []);

  const onNodeDragStart = useCallback(() => {
    if (!draggingRef.current) {
      draggingRef.current = true;
      pushUndo();
    }
  }, [pushUndo]);

  const onNodeDragStop = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const onConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;
      pushUndo();
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const edge = createEdge(connection.source, connection.target, connection.sourceHandle, connection.targetHandle);
        p.edges.push(edge);
        return doc;
      });
      setSelectedEdgeId(null);
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  // ── node operations ──
  const addNode = useCallback(
    (type, position, customComponents = []) => {
      pushUndo();
      let createdId = null;
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const node = createNode(type, position, customComponents);
        createdId = node.id;
        p.nodes.push(node);
        return doc;
      });
      return createdId;
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const addNodeAtCenter = useCallback(
    (type, customComponents = [], offset = 0) => {
      const base = 160 + offset * 36;
      return addNode(type, { x: 120 + (offset % 6) * 40, y: base }, customComponents);
    },
    [addNode]
  );

  const updateNode = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const n = p?.nodes.find((x) => x.id === id);
        if (n) Object.assign(n, patch);
        return doc;
      });
    },
    [pageId, setDocumentSafe]
  );

  const removeNodes = useCallback(
    (ids) => {
      if (!ids?.length) return;
      pushUndo();
      const idSet = new Set(ids);
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        p.nodes = p.nodes.filter((n) => !idSet.has(n.id));
        p.edges = p.edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target));
        return doc;
      });
      setSelectedNodeIds([]);
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const removeEdge = useCallback(
    (id) => {
      pushUndo();
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        p.edges = p.edges.filter((e) => e.id !== id);
        return doc;
      });
      setSelectedEdgeId(null);
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const updateEdge = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const e = p?.edges.find((x) => x.id === id);
        if (e) Object.assign(e, patch);
        return doc;
      });
    },
    [pageId, setDocumentSafe]
  );

  const toggleNodeLock = useCallback(
    (ids) => {
      pushUndo();
      const idSet = new Set(ids);
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        for (const n of p.nodes) if (idSet.has(n.id)) n.locked = !n.locked;
        return doc;
      });
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const toggleNodeHidden = useCallback(
    (ids) => {
      pushUndo();
      const idSet = new Set(ids);
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        for (const n of p.nodes) if (idSet.has(n.id)) n.hidden = !n.hidden;
        return doc;
      });
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  // ── group operations ──
  const addGroup = useCallback(
    (boundaryType, position, size) => {
      pushUndo();
      const pos = position || { x: 140, y: 140 };
      const group = createGroup(pos, size, boundaryType);
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        p.groups.push(group);
        return doc;
      });
      setSelectedGroupId(group.id);
      return group.id;
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const groupSelectedNodes = useCallback(() => {
    if (!selectedNodeIds.length) return null;
    pushUndo();
    let groupId = null;
    setDocumentSafe((doc) => {
      const p = doc.pages.find((pg) => pg.pageId === pageId);
      const members = p.nodes.filter((n) => selectedNodeIds.includes(n.id));
      if (!members.length) return doc;
      const minX = Math.min(...members.map((m) => m.position.x));
      const minY = Math.min(...members.map((m) => m.position.y));
      const maxX = Math.max(...members.map((m) => m.position.x + m.size.w));
      const maxY = Math.max(...members.map((m) => m.position.y + m.size.h));
      const group = createGroup({ x: minX - 24, y: minY - 40 }, { w: maxX - minX + 48, h: maxY - minY + 64 }, 'custom', 'Boundary');
      groupId = group.id;
      p.groups.push(group);
      for (const m of members) m.groupId = group.id;
      return doc;
    });
    setSelectedGroupId(groupId);
    return groupId;
  }, [pageId, selectedNodeIds, pushUndo, setDocumentSafe]);

  const ungroup = useCallback(
    (groupId) => {
      pushUndo();
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        for (const n of p.nodes) if (n.groupId === groupId) n.groupId = null;
        p.groups = p.groups.filter((g) => g.id !== groupId);
        return doc;
      });
      setSelectedGroupId(null);
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  const updateGroup = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const g = p?.groups.find((x) => x.id === id);
        if (g) Object.assign(g, patch);
        return doc;
      });
    },
    [pageId, setDocumentSafe]
  );

  const removeGroup = useCallback(
    (groupId) => {
      ungroup(groupId);
    },
    [ungroup]
  );

  // ── clipboard ──
  const copySelection = useCallback(() => {
    const p = page;
    const nodes = p.nodes.filter((n) => selectedNodeIds.includes(n.id));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = p.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    if (!nodes.length && !edges.length) return false;
    const groups = p.groups.filter((g) => nodes.some((n) => n.groupId === g.id));
    setClipboard({ nodes: clone(nodes), edges: clone(edges), groups: clone(groups) });
    return true;
  }, [page, selectedNodeIds]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;
    pushUndo();
    setDocumentSafe((doc) => {
      const p = doc.pages.find((pg) => pg.pageId === pageId);
      const idMap = new Map();
      const offset = 32;
      const newNodes = clipboard.nodes.map((n) => {
        const id = genId('node');
        idMap.set(n.id, id);
        return { ...clone(n), id, position: { x: n.position.x + offset, y: n.position.y + offset } };
      });
      for (const g of clipboard.groups || []) idMap.set(g.id, genId('group'));
      const newGroups = (clipboard.groups || []).map((g) => ({
        ...clone(g),
        id: idMap.get(g.id),
        position: { x: g.position.x + offset, y: g.position.y + offset },
      }));
      for (const n of newNodes) if (n.groupId) n.groupId = idMap.get(n.groupId) || null;
      const newEdges = clipboard.edges.map((e) => ({
        ...clone(e),
        id: genId('edge'),
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));
      p.nodes.push(...newNodes);
      p.edges.push(...newEdges);
      p.groups.push(...newGroups);
      return doc;
    });
    setSelectedNodeIds([]);
  }, [clipboard, pageId, pushUndo, setDocumentSafe]);

  const duplicateSelection = useCallback(() => {
    if (copySelection()) pasteClipboard();
  }, [copySelection, pasteClipboard]);

  const deleteSelection = useCallback(() => {
    if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      return;
    }
    if (selectedGroupId) {
      ungroup(selectedGroupId);
      return;
    }
    if (selectedNodeIds.length) removeNodes(selectedNodeIds);
  }, [selectedEdgeId, selectedGroupId, selectedNodeIds, removeEdge, ungroup, removeNodes]);

  // ── pattern insertion ──
  const insertPattern = useCallback(
    (pattern, dropPosition = null) => {
      pushUndo();
      const built = pattern.build();
      const minX = Math.min(...built.nodes.map((n) => n.position.x));
      const minY = Math.min(...built.nodes.map((n) => n.position.y));
      const origin = dropPosition || { x: 120, y: 120 };
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pageId);
        const idMap = new Map();
        const newNodes = built.nodes.map((n) => {
          const id = genId('node');
          idMap.set(n.id, id);
          return {
            ...clone(n),
            id,
            position: { x: n.position.x - minX + origin.x, y: n.position.y - minY + origin.y },
          };
        });
        const newEdges = built.edges.map((e) => ({
          ...clone(e),
          id: genId('edge'),
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
        }));
        p.nodes.push(...newNodes);
        p.edges.push(...newEdges);
        if (!doc.patternsUsed.includes(pattern.id)) doc.patternsUsed.push(pattern.id);
        return doc;
      });
    },
    [pageId, pushUndo, setDocumentSafe]
  );

  // ── pages ──
  const addPage = useCallback(
    (name, level = 'hld') => {
      pushUndo();
      const newPage = createPage(name, level);
      setDocumentSafe((doc) => {
        doc.pages.push(newPage);
        return doc;
      });
      setActivePageId(newPage.pageId);
      return newPage.pageId;
    },
    [pushUndo, setDocumentSafe]
  );

  const renamePage = useCallback(
    (pid, name) => {
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pid);
        if (p) p.name = name;
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const setPageLevel = useCallback(
    (pid, level) => {
      setDocumentSafe((doc) => {
        const p = doc.pages.find((pg) => pg.pageId === pid);
        if (p) p.level = level;
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const removePage = useCallback(
    (pid) => {
      if (document.pages.length <= 1) return false;
      pushUndo();
      let nextId = null;
      setDocumentSafe((doc) => {
        const idx = doc.pages.findIndex((pg) => pg.pageId === pid);
        if (idx === -1) return doc;
        doc.pages.splice(idx, 1);
        nextId = (doc.pages[Math.max(0, idx - 1)] || doc.pages[0]).pageId;
        return doc;
      });
      setActivePageId(nextId || document.pages.find((pg) => pg.pageId !== pid)?.pageId);
      return true;
    },
    [document.pages, pushUndo, setDocumentSafe]
  );

  const switchPage = useCallback(
    (pid) => {
      setActivePageId(pid);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setSelectedGroupId(null);
    },
    []
  );

  // ── document meta ops ──
  const updateDocument = useCallback(
    (patch) => {
      setDocumentSafe((doc) => {
        Object.assign(doc, patch);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const addRequirement = useCallback(
    (text, category = 'functional') => {
      setDocumentSafe((doc) => {
        doc.requirements.push({ id: genId('req'), text, category, met: false });
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const updateRequirement = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const r = doc.requirements.find((x) => x.id === id);
        if (r) Object.assign(r, patch);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const removeRequirement = useCallback(
    (id) => {
      setDocumentSafe((doc) => {
        doc.requirements = doc.requirements.filter((r) => r.id !== id);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const addDecision = useCallback(
    (title, reason = '', tradeoff = '', alternatives = '') => {
      setDocumentSafe((doc) => {
        doc.decisions.push({ id: genId('dec'), title, reason, tradeoff, alternatives, createdAt: new Date().toISOString() });
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const updateDecision = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const d = doc.decisions.find((x) => x.id === id);
        if (d) Object.assign(d, patch);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const removeDecision = useCallback(
    (id) => {
      setDocumentSafe((doc) => {
        doc.decisions = doc.decisions.filter((d) => d.id !== id);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const addAssumption = useCallback(
    (text) => {
      setDocumentSafe((doc) => {
        doc.assumptions.push({ id: genId('asm'), text });
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const removeAssumption = useCallback(
    (id) => {
      setDocumentSafe((doc) => {
        doc.assumptions = doc.assumptions.filter((a) => a.id !== id);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const updateAssumption = useCallback(
    (id, patch) => {
      setDocumentSafe((doc) => {
        const a = doc.assumptions.find((x) => x.id === id);
        if (a) Object.assign(a, patch);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const updateCapacityInputs = useCallback(
    (inputs) => {
      setDocumentSafe((doc) => {
        doc.capacityInputs = { ...(doc.capacityInputs || {}), ...inputs };
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const addCustomComponent = useCallback(
    (def) => {
      setDocumentSafe((doc) => {
        const custom = {
          id: genId('cc'),
          type: `custom.${(def.name || 'component').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          category: 'custom',
          label: def.name,
          description: def.description || '',
          icon: def.icon || 'Puzzle',
          color: def.color || '#64748b',
          size: { w: 210, h: 88 },
          defaults: def.defaults || {},
          properties: def.properties || [],
        };
        if (!Array.isArray(doc.customComponents)) doc.customComponents = [];
        doc.customComponents.push(custom);
        return doc;
      });
    },
    [setDocumentSafe]
  );

  const removeCustomComponent = useCallback(
    (type) => {
      setDocumentSafe((doc) => {
        if (Array.isArray(doc.customComponents)) {
          doc.customComponents = doc.customComponents.filter((c) => c.type !== type);
        }
        return doc;
      });
    },
    [setDocumentSafe]
  );

  // ── serialization ──
  const buildDocument = useCallback(
    () => clone(document),
    [document]
  );

  const getActivePageDocument = useCallback(
    () => ({ pages: [clone(page || { pageId, name: 'HLD', level: 'hld', nodes: [], edges: [], groups: [] })] }),
    [page, pageId]
  );

  const allNodes = useMemo(
    () => document.pages.flatMap((p) => p.nodes),
    [document.pages]
  );
  const allEdges = useMemo(
    () => document.pages.flatMap((p) => p.edges),
    [document.pages]
  );

  return {
    // state
    document,
    dirty,
    setDirty,
    pages: document.pages,
    page,
    pageId,
    activePageId,
    nodes: rfNodes,
    edges: rfEdges,
    undoStack,
    redoStack,
    clipboard,
    selectedNodeIds,
    selectedEdgeId,
    selectedGroupId,
    allNodes,
    allEdges,

    // lifecycle
    loadDocument,
    resetDocument,
    clearHistory,
    buildDocument,
    getActivePageDocument,

    // history
    undo,
    redo,

    // react flow handlers
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onNodeDragStart,
    onNodeDragStop,
    onConnect,

    // nodes
    addNode,
    addNodeAtCenter,
    updateNode,
    removeNodes,
    toggleNodeLock,
    toggleNodeHidden,

    // edges
    updateEdge,
    removeEdge,

    // groups
    addGroup,
    groupSelectedNodes,
    ungroup,
    updateGroup,
    removeGroup,

    // clipboard & selection
    copySelection,
    pasteClipboard,
    duplicateSelection,
    deleteSelection,
    setSelectedNodeIds,
    setSelectedEdgeId,
    setSelectedGroupId,

    // patterns
    insertPattern,

    // pages
    addPage,
    renamePage,
    setPageLevel,
    removePage,
    switchPage,

    // document meta
    updateDocument,
    addRequirement,
    updateRequirement,
    removeRequirement,
    addDecision,
    updateDecision,
    removeDecision,
    addAssumption,
    updateAssumption,
    removeAssumption,
    updateCapacityInputs,
    addCustomComponent,
    removeCustomComponent,
  };
};

