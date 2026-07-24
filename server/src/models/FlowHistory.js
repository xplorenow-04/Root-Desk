import mongoose from 'mongoose';

const flowHistorySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  snapshot: {
    nodes: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    edges: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    variables: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    config: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  changeLog: {
    type: String,
    default: '',
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Changed by is required'],
  },
  changeType: {
    type: String,
    enum: ['created', 'updated', 'duplicated', 'imported', 'rollback', 'activated', 'archived'],
    default: 'updated',
  },
}, {
  timestamps: true,
});

flowHistorySchema.index({ flowId: 1, version: -1 });
flowHistorySchema.index({ changedBy: 1, createdAt: -1 });

const FlowHistory = mongoose.model('FlowHistory', flowHistorySchema);
export default FlowHistory;
