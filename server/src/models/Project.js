import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'on-hold'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: 'Folder',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 10 && tags.every((tag) => tag.length <= 30);
        },
        message: 'Max 10 tags, each max 30 characters',
      },
      set: (tags) => tags.map((tag) => tag.trim()).filter(Boolean),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
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
projectSchema.index({ createdBy: 1, isDeleted: 1 });
projectSchema.index({ createdBy: 1, name: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
