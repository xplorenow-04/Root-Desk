import mongoose from 'mongoose';

const flowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Flow name is required'],
    trim: true,
    maxlength: [100, 'Flow name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'inactive'],
    default: 'draft',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  version: {
    type: Number,
    default: 1,
  },
  entryPoints: [{
    type: String,
    enum: ['button_click', 'menu', 'sidebar', 'api', 'login', 'dashboard', 'user_action', 'deep_link', 'qr_code', 'manual', 'schedule', 'webhook', 'event', 'module_entry'],
  }],
  permissions: {
    allowedRoles: [{
      type: String,
      enum: ['admin', 'teacher', 'student', 'parent', 'super_admin', 'guest'],
    }],
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  variables: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'object', 'array', 'expression'], default: 'string' },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    scope: { type: String, enum: ['global', 'session', 'local', 'input', 'output', 'environment', 'temporary'], default: 'local' },
    required: { type: Boolean, default: false },
    description: { type: String },
  }],
  executionType: {
    type: String,
    enum: ['sequential', 'parallel'],
    default: 'sequential',
  },
  linkedModule: {
    moduleType: { type: String },
    moduleId: { type: String },
  },
  settings: {
    autosave: { type: Boolean, default: true },
    debugMode: { type: Boolean, default: false },
    maxRetries: { type: Number, default: 3 },
    timeout: { type: Number, default: 30000 },
  },
  metadata: {
    icon: { type: String, default: 'workflow' },
    color: { type: String, default: '#6366f1' },
    category: { type: String },
    estimatedDuration: { type: Number },
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

flowSchema.index({ createdBy: 1, status: 1 });
flowSchema.index({ isDeleted: 1, createdAt: -1 });
flowSchema.index({ name: 'text', description: 'text' });

flowSchema.virtual('nodeCount', {
  ref: 'FlowNode',
  localField: '_id',
  foreignField: 'flowId',
  count: true,
});

flowSchema.virtual('executionCount', {
  ref: 'FlowExecution',
  localField: '_id',
  foreignField: 'flowId',
  count: true,
});

const Flow = mongoose.model('Flow', flowSchema);
export default Flow;
