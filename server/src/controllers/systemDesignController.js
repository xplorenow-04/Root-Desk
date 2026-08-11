import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import SystemDesign from '../models/SystemDesign.js';
import SystemDesignPractice from '../models/SystemDesignPractice.js';
import * as systemDesignService from '../services/systemDesignService.js';
import { validateGraph } from '../services/systemDesignValidationService.js';
import { sanitizeProblem, evaluatePracticeSubmission } from '../services/systemDesignPracticeService.js';

const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

const getDesignOr404 = asyncHandler(async (req, res, next) => {
  const design = await systemDesignService.getDesign({ id: req.params.id, userId: req.user._id });
  req.design = design;
  next();
});

// ─────────────────────────── CRUD ───────────────────────────

const listDesigns = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const designs = await systemDesignService.listDesigns({ projectId, userId: req.user._id });
  ApiResponse.success({ designs }, 'System designs retrieved successfully').send(res);
});

const getDesign = asyncHandler(async (req, res) => {
  const design = await systemDesignService.getDesign({ id: req.params.id, userId: req.user._id });
  ApiResponse.success({ design }, 'System design retrieved successfully').send(res);
});

const createDesign = asyncHandler(async (req, res) => {
  const design = await systemDesignService.createDesign({ body: req.body, userId: req.user._id });
  ApiResponse.created({ design }, 'System design created successfully').send(res);
});

const updateDesign = asyncHandler(async (req, res) => {
  const design = await systemDesignService.updateDesign({ id: req.params.id, body: req.body, userId: req.user._id });
  ApiResponse.success({ design }, 'System design updated successfully').send(res);
});

const deleteDesign = asyncHandler(async (req, res) => {
  await systemDesignService.deleteDesign({ id: req.params.id, userId: req.user._id });
  ApiResponse.success(null, 'System design deleted successfully').send(res);
});

const exportDesign = asyncHandler(async (req, res) => {
  const design = await systemDesignService.getDesign({ id: req.params.id, userId: req.user._id });
  const payload = {
    schemaVersion: 1,
    architectureFormatVersion: 1,
    exportedAt: new Date().toISOString(),
    name: design.name,
    description: design.description,
    level: design.level,
    pages: clone(design.pages),
    requirements: clone(design.requirements || []),
    decisions: clone(design.decisions || []),
    assumptions: clone(design.assumptions || []),
    patternsUsed: clone(design.patternsUsed || []),
    capacityInputs: clone(design.capacityInputs || {}),
    metadata: clone(design.metadata || {}),
  };
  ApiResponse.success({ payload, filename: design.name.replace(/\s+/g, '_') + '.json' }, 'Architecture exported successfully').send(res);
});

// ─────────────────────────── VALIDATION ───────────────────────────

/**
 * Validate a design. The client supplies the current (possibly unsaved) graph;
 * if `data` is absent the persisted design is validated instead.
 */
const validateDesign = asyncHandler(async (req, res) => {
  const { data } = req.body || {};
  let document;
  if (data) {
    document = data;
  } else {
    const design = await systemDesignService.getDesign({ id: req.params.id, userId: req.user._id });
    document = design.toObject();
  }

  const nodes = [];
  const edges = [];
  const groups = [];
  for (const page of document.pages || []) {
    for (const n of page.nodes || []) nodes.push({ ...n });
    for (const e of page.edges || []) edges.push({ ...e });
    for (const g of page.groups || []) groups.push({ ...g });
  }
  const result = validateGraph(nodes, edges, groups);

  // persist last validation on the design when validating the persisted graph
  if (!data && mongoose.Types.ObjectId.isValid(req.params.id)) {
    const design = await SystemDesign.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (design) {
      design.lastValidation = result;
      await design.save();
    }
  }
  ApiResponse.success({ result }, 'Design validated successfully').send(res);
});

// ─────────────────────────── VERSIONS ───────────────────────────

const listVersions = asyncHandler(async (req, res) => {
  const result = await systemDesignService.listVersions({ id: req.params.id, userId: req.user._id });
  ApiResponse.success({ versions: result.versions, currentVersion: result.version }, 'Versions retrieved successfully').send(res);
});

const createVersion = asyncHandler(async (req, res) => {
  const result = await systemDesignService.createVersion({ id: req.params.id, body: req.body, userId: req.user._id });
  ApiResponse.created({ design: result.design, version: result.version }, 'Version created successfully').send(res);
});

const restoreVersion = asyncHandler(async (req, res) => {
  const design = await systemDesignService.restoreVersion({ id: req.params.id, versionNumber: req.params.versionNumber, userId: req.user._id });
  ApiResponse.success({ design }, `Restored version ${req.params.versionNumber} successfully`).send(res);
});

const compareVersions = asyncHandler(async (req, res) => {
  const { a, b } = req.body || {};
  if (!a || !b) throw ApiError.badRequest('Both version numbers (a, b) are required');
  const { versions } = await systemDesignService.listVersions({ id: req.params.id, userId: req.user._id });
  const va = versions.find((v) => v.versionNumber === Number(a));
  const vb = versions.find((v) => v.versionNumber === Number(b));
  if (!va || !vb) throw ApiError.notFound('One of the requested versions was not found');
  const diff = systemDesignService.diffSnapshots(va.snapshot, vb.snapshot);
  ApiResponse.success({ diff, a: va, b: vb }, 'Versions compared successfully').send(res);
});

// ─────────────────────────── TEMPLATES ───────────────────────────

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await systemDesignService.listTemplates();
  ApiResponse.success({ templates }, 'Templates retrieved successfully').send(res);
});

const useTemplate = asyncHandler(async (req, res) => {
  const { projectId } = req.body || {};
  if (!projectId) throw ApiError.badRequest('Project ID is required');
  const design = await systemDesignService.createFromTemplate({
    templateId: req.params.templateId,
    projectId,
    userId: req.user._id,
  });
  ApiResponse.created({ design }, 'System design created from template successfully').send(res);
});

// ─────────────────────────── IMPORT ───────────────────────────

const importDesign = asyncHandler(async (req, res) => {
  const { projectId, payload } = req.body || {};
  if (!projectId) throw ApiError.badRequest('Project ID is required');
  if (!payload) throw ApiError.badRequest('Architecture payload is required');
  const design = await systemDesignService.importDesign({ projectId, payload, userId: req.user._id });
  ApiResponse.created({ design }, 'Architecture imported successfully').send(res);
});

// ─────────────────────────── PRACTICE ───────────────────────────

const listPracticeProblems = asyncHandler(async (req, res) => {
  const { difficulty } = req.query;
  const filter = { isBuiltIn: true };
  if (difficulty) filter.difficulty = difficulty;
  const problems = await SystemDesignPractice.find(filter)
    .select('title description difficulty estimatedMinutes functionalRequirements nonFunctionalRequirements traffic storage availability latency evaluationCriteria hints')
    .sort({ difficulty: 1, createdAt: 1 });
  const sanitized = problems.map((p) => sanitizeProblem(p.toObject()));
  ApiResponse.success({ problems: sanitized }, 'Practice problems retrieved successfully').send(res);
});

const getPracticeProblem = asyncHandler(async (req, res) => {
  const problem = await SystemDesignPractice.findById(req.params.problemId);
  if (!problem) throw ApiError.notFound('Practice problem not found');
  ApiResponse.success({ problem: sanitizeProblem(problem.toObject()) }, 'Practice problem retrieved successfully').send(res);
});

const submitPractice = asyncHandler(async (req, res) => {
  const { data, hintsUsed } = req.body || {};
  if (!data || !Array.isArray(data.pages)) throw ApiError.badRequest('A valid architecture graph is required');
  const problem = await SystemDesignPractice.findById(req.params.problemId);
  if (!problem) throw ApiError.notFound('Practice problem not found');
  const result = evaluatePracticeSubmission({
    problem: problem.toObject(),
    data,
    hintsUsed: Array.isArray(hintsUsed) ? hintsUsed : [],
  });
  ApiResponse.success({ result }, 'Practice design evaluated successfully').send(res);
});

export default {
  listDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  exportDesign,
  validateDesign,
  listVersions,
  createVersion,
  restoreVersion,
  compareVersions,
  listTemplates,
  useTemplate,
  importDesign,
  listPracticeProblems,
  getPracticeProblem,
  submitPractice,
};