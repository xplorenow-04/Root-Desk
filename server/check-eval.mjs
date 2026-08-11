import mongoose from 'mongoose';
import env from './src/config/env.js';
import SystemDesignPractice from './src/models/SystemDesignPractice.js';
import { evaluatePracticeSubmission } from './src/services/systemDesignPracticeService.js';

await mongoose.connect(env.MONGODB_URI);

const problem = await SystemDesignPractice.findOne({ title: 'ScanSnap URL Shortener' }).lean();
if (!problem) { console.error('problem not found'); process.exit(1); }

const result = evaluatePracticeSubmission({
  problem,
  data: problem.referenceArchitecture,
  hintsUsed: [],
});
console.log('overall:', result.scorecard.overall);
console.log('dimensions:', JSON.stringify(result.scorecard.dimensions));
console.log('requirements:', result.requirementsDetail.map((r) => `${r.label}: ${r.met} (${Math.round(r.ratio * 100)}%)`).join(' | '));
console.log('strengths:', result.strengths.length);
console.log('problems:', result.problems.length, '| suggestions:', result.suggestions.length);

const bad = evaluatePracticeSubmission({ problem, data: { pages: [{ pageId: 'p1', name: 'Bare', level: 'hld', nodes: [], edges: [] }] }, hintsUsed: [] });
console.log('empty graph overall:', bad.scorecard.overall, '(expected low)');

await mongoose.connection.close();
process.exit(0);