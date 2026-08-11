import mongoose from 'mongoose';

/**
 * SystemDesignTemplate — starter architectures users can instantiate into a
 * project. Templates are editable after creation (they are copied into a real
 * SystemDesign document, never referenced).
 */
const systemDesignTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: { type: String, default: '', maxlength: [1000, 'Too long'] },
    category: {
      type: String,
      enum: [
        'crud', 'rest-api', 'ecommerce', 'chat', 'url-shortener', 'social-media',
        'video-streaming', 'ride-sharing', 'food-delivery', 'notification',
        'payment', 'file-storage', 'search', 'collaboration', 'event-driven',
        'microservices', 'multi-region',
      ],
      required: true,
    },
    icon: { type: String, default: 'Network' },
    color: { type: String, default: '#6366f1' },
    level: { type: String, enum: ['context', 'hld', 'lld', 'detail'], default: 'hld' },
    snapshot: {
      // pages: [{ name, level, nodes, edges, groups }]
      pages: { type: mongoose.Schema.Types.Mixed, default: () => [] },
      requirements: { type: mongoose.Schema.Types.Mixed, default: () => [] },
      decisions: { type: mongoose.Schema.Types.Mixed, default: () => [] },
      assumptions: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ difficulty: 'intermediate', popularity: 50, tags: [] }),
    },
    isBuiltIn: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

systemDesignTemplateSchema.index({ category: 1, popularity: -1 });

const SystemDesignTemplate = mongoose.model('SystemDesignTemplate', systemDesignTemplateSchema);
export default SystemDesignTemplate;