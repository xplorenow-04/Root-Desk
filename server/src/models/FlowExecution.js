import mongoose from 'mongoose';

const flowExecutionSchema = new mongoose.Schema({
  flowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flow',
    required: [true, 'Flow ID is required'],
    index: true,
  },
  version: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Triggered by is required'],
  },
  entryPoint: {
    type: String,
    default: 'manual',
  },
  currentNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlowNode',
  },
  currentNodeIndex: {
    type: Number,
    default: 0,
  },
  nodeResults: [{
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlowNode' },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'] },
    startedAt: { type: Date },
    completedAt: { type: Date },
    duration: { type: Number },
    error: { type: String },
    output: { type: mongoose.Schema.Types.Mixed },
    retryCount: { type: Number, default: 0 },
  }],
  variables: {
    input: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    session: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    temporary: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  duration: {
    type: Number,
  },
  error: {
    message: { type: String },
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlowNode' },
    stack: { type: String },
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  metadata: {
    ip: { type: String },
    userAgent: { type: String },
    source: { type: String },
  },
}, {
  timestamps: true,
});

flowExecutionSchema.index({ flowId: 1, createdAt: -1 });
flowExecutionSchema.index({ triggeredBy: 1, status: 1 });
flowExecutionSchema.index({ status: 1, createdAt: -1 });

const FlowExecution = mongoose.model('FlowExecution', flowExecutionSchema);
export default FlowExecution;
