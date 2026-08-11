import mongoose from 'mongoose';

/**
 * SystemDesignPractice — structured practice problems used by Practice Mode.
 *
 * `referenceArchitecture` is the expected solution. It is NEVER returned to the
 * client before a submission — the API strips it on reads.
 */
const systemDesignPracticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
      index: true,
    },
    estimatedMinutes: { type: Number, default: 60 },
    functionalRequirements: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        weight: { type: Number, default: 1 },
        // match criteria evaluated against the submitted architecture graph
        matches: [
          {
            kind: {
              type: String,
              enum: [
                'category', 'component', 'property', 'edgeToCategory',
                'edgeFromCategory', 'edgeBetweenCategories', 'anyOfCategories',
                'propertyGte', 'propertyTrue', 'propertyIn',
              ],
              required: true,
            },
            value: { type: String, default: '' },
            targetCategory: { type: String, default: '' },
            sourceCategory: { type: String, default: '' },
            property: { type: String, default: '' },
            values: { type: [String], default: [] },
            threshold: { type: Number, default: 0 },
            label: { type: String, default: '' },
          },
        ],
      },
    ],
    nonFunctionalRequirements: {
      type: mongoose.Schema.Types.Mixed,
      default: () => [],
    },
    traffic: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    storage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    availability: { type: String, default: '' },
    latency: { type: String, default: '' },
    evaluationCriteria: { type: [String], default: [] },
    expectedPatterns: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    hints: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        strength: { type: String, enum: ['subtle', 'moderate', 'strong'], default: 'moderate' },
        penalty: { type: Number, default: 1 },
      },
    ],
    referenceArchitecture: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ pages: [], notes: [] }),
    },
    isBuiltIn: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

systemDesignPracticeSchema.index({ difficulty: 1, isBuiltIn: 1 });

const SystemDesignPractice = mongoose.model('SystemDesignPractice', systemDesignPracticeSchema);
export default SystemDesignPractice;