import mongoose from 'mongoose';
import env from './src/config/env.js';
import SystemDesignPractice from './src/models/SystemDesignPractice.js';
import { buildGraph, validateGraph } from './src/services/systemDesignValidationService.js';

await mongoose.connect(env.MONGODB_URI);
const problem = await SystemDesignPractice.findOne({ title: 'ScanSnap URL Shortener' }).lean();
const graph = buildGraph(problem.referenceArchitecture);
const validation = validateGraph(graph.nodes, graph.edges, graph.groups);
console.log('category scores:', JSON.stringify(validation.categories, null, 1));
console.log('\nfindings:');
for (const f of validation.findings) console.log(`- [${f.category}/${f.severity}] ${f.title}`);
await mongoose.connection.close();
process.exit(0);