import mongoose from 'mongoose';

/**
 * SystemDesign — the semantic architecture graph for the System Design Studio.
 *
 * The design is a structured document (NOT a raw canvas blob). Every page holds
 * typed nodes, first-class edges, and boundary groups. Additional semantic
 * collections (requirements, decisions, assumptions, patterns used, capacity
 * inputs, custom components) make the document AI-ready.
 *
 * Storage approach mirrors the existing ERDiagram pattern (structured arrays
 * inside a project-scoped document with an inline version history), so designs
 * stay easy to query and version-consistent.
 */

const positionSchema = {
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
};

const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    category: { type: String, default: '' },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    position: { type: positionSchema, default: () => ({ x: 0, y: 0 }) },
    size: {
      w: { type: Number, default: 220 },
      h: { type: Number, default: 96 },
    },
    properties: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    style: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    locked: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    groupId: { type: String, default: null },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
    type: { type: String, default: 'archEdge' },
    protocol: { type: String, default: 'REST' },
    connectionType: { type: String, default: 'HTTP' },
    direction: { type: String, enum: ['one-way', 'bidirectional'], default: 'one-way' },
    syncMode: { type: String, enum: ['sync', 'async'], default: 'sync' },
    label: { type: String, default: '' },
    traffic: {
      rps: { type: Number, default: 100 },
      peakRps: { type: Number, default: 0 },
    },
    latency: {
      p50: { type: Number, default: 30 },
      p95: { type: Number, default: 80 },
      p99: { type: Number, default: 150 },
      unit: { type: String, default: 'ms' },
    },
    payload: { type: Number, default: 20, description: 'KB' },
    timeout: { type: Number, default: 5, description: 'seconds' },
    retry: { type: Number, default: 0 },
    backoff: { type: String, enum: ['none', 'linear', 'exponential'], default: 'none' },
    circuitBreaker: { type: Boolean, default: false },
    animated: { type: Boolean, default: false },
    style: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    boundaryType: {
      type: String,
      enum: ['region', 'vpc', 'availability-zone', 'subnet', 'kubernetes-cluster', 'namespace', 'service', 'microservice', 'custom'],
      default: 'custom',
    },
    position: { type: positionSchema, default: () => ({ x: 0, y: 0 }) },
    size: { w: { type: Number, default: 600 }, h: { type: Number, default: 400 } },
    color: { type: String, default: '#6366f1' },
    locked: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true },
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ['context', 'hld', 'lld', 'detail'],
      default: 'hld',
    },
    nodes: { type: [nodeSchema], default: [] },
    edges: { type: [edgeSchema], default: [] },
    groups: { type: [groupSchema], default: [] },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    changeLog: { type: String, default: '' },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const requirementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    category: {
      type: String,
      enum: ['functional', 'non-functional', 'capacity', 'availability', 'security'],
      default: 'functional',
    },
    met: { type: Boolean, default: false },
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    reason: { type: String, default: '' },
    tradeoff: { type: String, default: '' },
    alternatives: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const assumptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const systemDesignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'System design name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    level: {
      type: String,
      enum: ['context', 'hld', 'lld', 'detail'],
      default: 'hld',
    },
    pages: { type: [pageSchema], default: [] },
    requirements: { type: [requirementSchema], default: [] },
    decisions: { type: [decisionSchema], default: [] },
    assumptions: { type: [assumptionSchema], default: [] },
    patternsUsed: { type: [String], default: [] },
    capacityInputs: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    customComponents: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        icon: 'Network',
        color: '#6366f1',
        tags: [],
        architectureFormatVersion: 1,
      }),
    },
    lastValidation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    version: { type: Number, default: 1 },
    versions: { type: [versionSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

systemDesignSchema.index({ projectId: 1, createdAt: -1 });
systemDesignSchema.index({ createdBy: 1, projectId: 1 });

const SystemDesign = mongoose.model('SystemDesign', systemDesignSchema);
export default SystemDesign;