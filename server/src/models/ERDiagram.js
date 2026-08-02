import mongoose from 'mongoose';

const erDiagramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'ER Diagram name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    language: {
      type: String,
      enum: ['sql', 'mongodb'],
      default: 'sql',
    },
    code: {
      type: String,
      default: '',
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        code: { type: String, default: '' },
        nodes: { type: Array, default: [] },
        edges: { type: Array, default: [] },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

erDiagramSchema.index({ projectId: 1, createdAt: -1 });

const ERDiagram = mongoose.model('ERDiagram', erDiagramSchema);
export default ERDiagram;
