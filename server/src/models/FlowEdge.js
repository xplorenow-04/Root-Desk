import mongoose from 'mongoose';

const flowEdgeSchema = new mongoose.Schema({
  flowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flow',
    required: [true, 'Flow ID is required'],
    index: true,
  },
  sourceNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlowNode',
    required: [true, 'Source node ID is required'],
  },
  targetNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlowNode',
    required: [true, 'Target node ID is required'],
  },
  sourceHandle: {
    type: String,
    default: null,
  },
  targetHandle: {
    type: String,
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  condition: {
    type: String,
    default: '',
  },
  conditionExpression: {
    type: String,
    default: '',
  },
  edgeType: {
    type: String,
    enum: ['default', 'success', 'failure', 'condition_true', 'condition_false', 'loop_back', 'timeout', 'error'],
    default: 'default',
  },
  animated: {
    type: Boolean,
    default: false,
  },
  style: {
    stroke: { type: String },
    strokeWidth: { type: Number },
    strokeDasharray: { type: String },
  },
  metadata: {
    label: { type: String },
  },
}, {
  timestamps: true,
});

const FlowEdge = mongoose.model('FlowEdge', flowEdgeSchema);
export default FlowEdge;
