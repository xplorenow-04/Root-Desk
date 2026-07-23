import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Node',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: ['module', 'feature', 'task'],
      default: 'module',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'in-review', 'on-hold', 'completed', 'cancelled', 'archived'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'none'],
      default: 'medium',
    },
    order: {
      type: Number,
      default: 0,
    },
    labels: {
      type: [String],
      default: [],
      validate: {
        validator: function (labels) {
          return labels.length <= 10 && labels.every((label) => label.length <= 30);
        },
        message: 'Max 10 labels, each max 30 characters',
      },
      set: (labels) => labels.map((label) => label.trim()).filter(Boolean),
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
nodeSchema.index({ projectId: 1, isDeleted: 1 });
nodeSchema.index({ projectId: 1, parentId: 1 });
nodeSchema.index({ createdBy: 1, dueDate: 1 });

const Node = mongoose.model('Node', nodeSchema);
export default Node;
