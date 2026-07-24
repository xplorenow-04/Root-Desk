import mongoose from 'mongoose';

/**
 * FlowComment model — stores canvas comments and sticky notes.
 * Completely new model, does not modify any existing tables.
 */
const flowCommentSchema = new mongoose.Schema({
  flowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flow',
    required: [true, 'Flow ID is required'],
    index: true,
  },
  nodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlowNode',
    default: null,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
  },
  type: {
    type: String,
    enum: ['comment', 'sticky_note', 'annotation'],
    default: 'comment',
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  color: {
    type: String,
    default: '#fef3c7',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const FlowComment = mongoose.model('FlowComment', flowCommentSchema);
export default FlowComment;
