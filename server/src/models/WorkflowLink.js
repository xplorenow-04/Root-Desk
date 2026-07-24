import mongoose from 'mongoose';

/**
 * WorkflowLink model — links workflows to modules/pages/buttons/events.
 * All fields persist to MongoDB — nothing relies on frontend state alone.
 */
const workflowLinkSchema = new mongoose.Schema({
  flowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flow',
    required: [true, 'Flow ID is required'],
    index: true,
  },
  targetType: {
    type: String,
    required: [true, 'Target type is required'],
    enum: ['page', 'button', 'sidebar', 'menu', 'form', 'module', 'route', 'event', 'api', 'crud', 'widget', 'action'],
  },
  targetId: {
    type: String,
    required: [true, 'Target ID is required'],
  },
  targetLabel: {
    type: String,
    default: '',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  triggerOn: {
    type: String,
    enum: ['before', 'after', 'instead', 'parallel'],
    default: 'after',
  },
  priority: {
    type: Number,
    default: 0,
  },
  entryNode: {
    type: String,
    default: null,
  },
  versionSelection: {
    type: String,
    enum: ['latest', 'published', 'draft', 'specific'],
    default: 'latest',
  },
  specificVersion: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  conditions: {
    roles: [String],
    expression: { type: String },
  },
  permissions: {
    allowedRoles: [{ type: String }],
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

workflowLinkSchema.index({ targetType: 1, targetId: 1 });
workflowLinkSchema.index({ flowId: 1, targetType: 1 });
workflowLinkSchema.index({ flowId: 1, enabled: 1 });

const WorkflowLink = mongoose.model('WorkflowLink', workflowLinkSchema);
export default WorkflowLink;
