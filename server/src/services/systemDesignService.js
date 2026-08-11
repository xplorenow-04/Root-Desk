import mongoose from 'mongoose';
import SystemDesign from '../models/SystemDesign.js';
import SystemDesignTemplate from '../models/SystemDesignTemplate.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import { buildGraph } from './systemDesignValidationService.js';

const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

const ensureProjectOwned = async (projectId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw ApiError.badRequest('Invalid project ID');
  }
  const project = await Project.findOne({ _id: projectId, createdBy: userId, isDeleted: false });
  if (!project) {
    throw ApiError.notFound('Project not found or you do not have permission');
  }
  return project;
};

export const listDesigns = async ({ projectId, userId }) => {
  if (!projectId) throw ApiError.badRequest('Project ID query parameter is required');
  await ensureProjectOwned(projectId, userId);
  const designs = await SystemDesign.find({ projectId, createdBy: userId })
    .select('name description projectId level version createdAt updatedAt metadata lastValidation')
    .sort({ updatedAt: -1 });
  return designs;
};

export const getDesign = async ({ id, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid system design ID');
  const design = await SystemDesign.findOne({ _id: id, createdBy: userId });
  if (!design) throw ApiError.notFound('System design not found');
  return design;
};

export const createDesign = async ({ body, userId }) => {
  const { name, description, projectId } = body;
  if (!name || !projectId) throw ApiError.badRequest('Name and Project ID are required');
  await ensureProjectOwned(projectId, userId);

  const pages = Array.isArray(body.pages) && body.pages.length ? body.pages : [
    {
      pageId: `page_${Date.now()}`,
      name: 'HLD',
      level: body.level || 'hld',
      nodes: [],
      edges: [],
      groups: [],
    },
  ];

  const design = await SystemDesign.create({
    name,
    description: description || '',
    projectId,
    level: body.level || 'hld',
    pages,
    requirements: body.requirements || [],
    decisions: body.decisions || [],
    assumptions: body.assumptions || [],
    patternsUsed: body.patternsUsed || [],
    capacityInputs: body.capacityInputs || {},
    customComponents: Array.isArray(body.customComponents) ? body.customComponents : [],
    version: 1,
    versions: [
      {
        versionNumber: 1,
        name: 'Initial architecture',
        description: 'Initial architecture',
        snapshot: {
          pages: clone(pages),
          requirements: body.requirements || [],
          decisions: body.decisions || [],
          assumptions: body.assumptions || [],
        },
        createdBy: userId,
      },
    ],
    createdBy: userId,
  });
  return design;
};

export const updateDesign = async ({ id, body, userId }) => {
  const design = await SystemDesign.findOne({ _id: id, createdBy: userId });
  if (!design) throw ApiError.notFound('System design not found');

  const mutable = [
    'name', 'description', 'level', 'pages', 'requirements', 'decisions',
    'assumptions', 'patternsUsed', 'capacityInputs', 'customComponents', 'metadata',
  ];
  for (const key of mutable) {
    if (body[key] !== undefined) design[key] = body[key];
  }

  // version bump on significant structural changes
  design.version = (design.version || 1) + 1;

  // schema cap: never allow more than 40 pages
  if ((design.pages || []).length > 40) throw ApiError.badRequest('A design can have at most 40 pages');

  await design.save();

  // keep the response small for frequent autosaves
  const fresh = await SystemDesign.findById(design._id)
    .select('name description level pages requirements decisions assumptions patternsUsed capacityInputs customComponents metadata version createdAt updatedAt');
  return fresh;
};

export const deleteDesign = async ({ id, userId }) => {
  const design = await SystemDesign.findOneAndDelete({ _id: id, createdBy: userId });
  if (!design) throw ApiError.notFound('System design not found');
  return design;
};

// ─────────────────────────── VERSIONS ───────────────────────────

export const createVersion = async ({ id, body, userId }) => {
  const design = await SystemDesign.findOne({ _id: id, createdBy: userId });
  if (!design) throw ApiError.notFound('System design not found');

  const nextVersion = (design.versions || []).reduce((m, v) => Math.max(m, v.versionNumber || 0), 0) + 1;

  design.versions.push({
    versionNumber: nextVersion,
    name: body.name || `Version ${nextVersion}`,
    description: body.description || '',
    changeLog: body.changeLog || '',
    snapshot: {
      pages: clone(design.pages),
      requirements: clone(design.requirements || []),
      decisions: clone(design.decisions || []),
      assumptions: clone(design.assumptions || []),
    },
    createdBy: userId,
  });
  if (design.versions.length > 100) design.versions.shift();
  await design.save();
  return { design, version: design.versions[design.versions.length - 1] };
};

export const listVersions = async ({ id, userId }) => {
  const design = await SystemDesign.findOne({ _id: id, createdBy: userId }).select('versions version');
  if (!design) throw ApiError.notFound('System design not found');
  return design;
};

export const restoreVersion = async ({ id, versionNumber, userId }) => {
  const design = await SystemDesign.findOne({ _id: id, createdBy: userId });
  if (!design) throw ApiError.notFound('System design not found');
  const version = design.versions.find((v) => v.versionNumber === Number(versionNumber));
  if (!version) throw ApiError.notFound(`Version ${versionNumber} not found`);

  const snapshot = version.snapshot || {};
  design.pages = snapshot.pages || [];
  design.requirements = snapshot.requirements || [];
  design.decisions = snapshot.decisions || [];
  design.assumptions = snapshot.assumptions || [];
  design.version = (design.version || 1) + 1;

  const nextVersion = design.versions.reduce((m, v) => Math.max(m, v.versionNumber || 0), 0) + 1;
  design.versions.push({
    versionNumber: nextVersion,
    name: `Restored v${versionNumber}`,
    description: `Restored from version ${versionNumber}`,
    changeLog: `Restored architecture to version ${versionNumber}`,
    snapshot: {
      pages: clone(design.pages),
      requirements: clone(design.requirements || []),
      decisions: clone(design.decisions || []),
      assumptions: clone(design.assumptions || []),
    },
    createdBy: userId,
  });
  await design.save();
  return design;
};

/**
 * Diff two architecture snapshots. Identifies added/removed nodes and changed
 * connections/properties between version `a` and version `b`.
 */
export const diffSnapshots = (snapshotA, snapshotB) => {
  const a = buildGraph(snapshotA);
  const b = buildGraph(snapshotB);
  const aIds = new Set(a.nodes.map((n) => n.id));
  const bIds = new Set(b.nodes.map((n) => n.id));

  const addedNodes = b.nodes.filter((n) => !aIds.has(n.id)).map((n) => n);
  const removedNodes = a.nodes.filter((n) => !bIds.has(n.id)).map((n) => n);
  const common = b.nodes.filter((n) => aIds.has(n.id));

  const changedProperties = [];
  for (const bn of common) {
    const an = a.nodes.find((n) => n.id === bn.id);
    if (!an) continue;
    const changes = [];
    if (an.name !== bn.name) changes.push({ key: 'name', from: an.name, to: bn.name });
    if (JSON.stringify(an.properties || {}) !== JSON.stringify(bn.properties || {})) {
      changes.push({ key: 'properties', from: an.properties || {}, to: bn.properties || {} });
    }
    if (changes.length) changedProperties.push({ nodeId: bn.id, name: bn.name, changes });
  }

  const aEdgeKeys = new Set(a.edges.map((e) => `${e.source}:${e.target}:${e.syncMode}`));
  const bEdgeKeys = new Set(b.edges.map((e) => `${e.source}:${e.target}:${e.syncMode}`));
  const addedEdges = b.edges.filter((e) => !aEdgeKeys.has(`${e.source}:${e.target}:${e.syncMode}`));
  const removedEdges = a.edges.filter((e) => !bEdgeKeys.has(`${e.source}:${e.target}:${e.syncMode}`));

  return { addedNodes, removedNodes, addedEdges, removedEdges, changedProperties };
};

// ─────────────────────────── TEMPLATES ───────────────────────────

export const listTemplates = async () => {
  return SystemDesignTemplate.find().sort({ category: 1, 'metadata.popularity': -1 });
};

export const createFromTemplate = async ({ templateId, projectId, userId }) => {
  const template = await SystemDesignTemplate.findById(templateId);
  if (!template) throw ApiError.notFound('Template not found');
  await ensureProjectOwned(projectId, userId);

  const snapshot = template.snapshot || {};
  const pages = clone(snapshot.pages || []).map((p) => ({
    ...p,
    pageId: p.pageId || `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }));

  const design = await SystemDesign.create({
    name: template.name,
    description: template.description || `Created from the "${template.name}" template.`,
    projectId,
    level: template.level || 'hld',
    pages,
    requirements: clone(snapshot.requirements || []),
    decisions: clone(snapshot.decisions || []),
    assumptions: clone(snapshot.assumptions || []),
    metadata: { icon: template.icon, color: template.color, tags: ['template'], architectureFormatVersion: 1 },
    version: 1,
    versions: [
      {
        versionNumber: 1,
        name: 'From template',
        description: `Instantiated from template "${template.name}"`,
        snapshot: { pages: clone(pages), requirements: clone(snapshot.requirements || []) },
        createdBy: userId,
      },
    ],
    createdBy: userId,
  });
  return design;
};

// ─────────────────────────── IMPORT ───────────────────────────

const MAX_NODES_PER_PAGE = 500;
const MAX_PAGES = 40;

/**
 * Structural + security validation for imported architecture JSON.
 * Rejects malformed shapes, oversized payloads, and unknown fields keepers.
 */
export const validateImportPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw ApiError.badRequest('Invalid architecture file: expected an object.');
  }
  if (payload.architectureFormatVersion !== 1 && payload.formatVersion !== 1 && payload.schemaVersion !== 1) {
    throw ApiError.badRequest('Invalid architecture file: unsupported schema version.');
  }
  if (typeof payload.name !== 'string' || !payload.name.trim() || payload.name.length > 120) {
    throw ApiError.badRequest('Invalid architecture file: name must be a string (max 120 chars).');
  }
  if (!Array.isArray(payload.pages) || payload.pages.length === 0) {
    throw ApiError.badRequest('Invalid architecture file: pages must be a non-empty array.');
  }
  if (payload.pages.length > MAX_PAGES) {
    throw ApiError.badRequest(`Invalid architecture file: too many pages (max ${MAX_PAGES}).`);
  }

  const isPos = (p) => p && typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y);

  for (const page of payload.pages) {
    if (!page || typeof page !== 'object' || typeof page.name !== 'string' || !page.name.trim()) {
      throw ApiError.badRequest('Invalid architecture file: every page needs a name.');
    }
    const nodes = Array.isArray(page.nodes) ? page.nodes : [];
    const edges = Array.isArray(page.edges) ? page.edges : [];
    const groups = Array.isArray(page.groups) ? page.groups : [];
    if (nodes.length > MAX_NODES_PER_PAGE) {
      throw ApiError.badRequest('Invalid architecture file: too many nodes in one page.');
    }
    for (const n of nodes) {
      if (!n || typeof n.id !== 'string' || typeof n.type !== 'string' || !isPos(n.position)) {
        throw ApiError.badRequest('Invalid architecture file: malformed node (needs id, type, position).');
      }
      if (typeof n.properties !== 'undefined' && (typeof n.properties !== 'object' || n.properties === null)) {
        throw ApiError.badRequest('Invalid architecture file: node properties must be an object.');
      }
    }
    for (const e of edges) {
      if (!e || typeof e.id !== 'string' || typeof e.source !== 'string' || typeof e.target !== 'string') {
        throw ApiError.badRequest('Invalid architecture file: malformed edge (needs id, source, target).');
      }
    }
    for (const g of groups) {
      if (!g || typeof g.id !== 'string' || !isPos(g.position)) {
        throw ApiError.badRequest('Invalid architecture file: malformed group.');
      }
    }
  }
  return true;
};

export const importDesign = async ({ projectId, payload, userId }) => {
  await ensureProjectOwned(projectId, userId);
  validateImportPayload(payload);

  const design = await SystemDesign.create({
    name: payload.name,
    description: payload.description || 'Imported architecture.',
    projectId,
    level: payload.level || 'hld',
    pages: clone(payload.pages),
    requirements: Array.isArray(payload.requirements) ? clone(payload.requirements) : [],
    decisions: Array.isArray(payload.decisions) ? clone(payload.decisions) : [],
    assumptions: Array.isArray(payload.assumptions) ? clone(payload.assumptions) : [],
    patternsUsed: Array.isArray(payload.patternsUsed) ? payload.patternsUsed.slice(0, 100) : [],
    capacityInputs: payload.capacityInputs || {},
    metadata: { icon: 'Import', color: '#6366f1', tags: [], architectureFormatVersion: 1 },
    version: 1,
    versions: [
      {
        versionNumber: 1,
        name: 'Imported',
        description: 'Imported from architecture JSON',
        snapshot: {
          pages: clone(payload.pages),
          requirements: Array.isArray(payload.requirements) ? clone(payload.requirements) : [],
        },
        createdBy: userId,
      },
    ],
    createdBy: userId,
  });
  return design;
};