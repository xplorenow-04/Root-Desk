import mongoose from 'mongoose';

const flowTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['admin', 'student', 'parent', 'teacher', 'admission', 'attendance', 'fee', 'leave', 'result', 'assignment', 'report', 'general', 'notification', 'approval', 'onboarding'],
    default: 'general',
  },
  icon: {
    type: String,
    default: 'file-template',
  },
  color: {
    type: String,
    default: '#6366f1',
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
  metadata: {
    estimatedDuration: { type: Number },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    popularity: { type: Number, default: 0 },
    tags: [String],
  },
  isBuiltIn: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

flowTemplateSchema.index({ category: 1, 'metadata.popularity': -1 });
flowTemplateSchema.index({ isBuiltIn: 1 });

const FlowTemplate = mongoose.model('FlowTemplate', flowTemplateSchema);
export default FlowTemplate;
