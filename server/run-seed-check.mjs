import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import SystemDesignTemplate from './src/models/SystemDesignTemplate.js';
import SystemDesignPractice from './src/models/SystemDesignPractice.js';

await connectDB();

const tCount = await SystemDesignTemplate.countDocuments({ isBuiltIn: true });
const pCount = await SystemDesignPractice.countDocuments({ isBuiltIn: true });

const templates = await SystemDesignTemplate.find({ isBuiltIn: true }).lean();
const problems = await SystemDesignPractice.find({ isBuiltIn: true }).lean();

let issues = 0;
for (const t of templates) {
  const ids = new Set();
  for (const p of t.snapshot.pages || []) for (const n of p.nodes || []) ids.add(n.id);
  for (const p of t.snapshot.pages || []) {
    for (const e of p.edges || []) {
      if (!ids.has(e.source) || !ids.has(e.target)) { issues++; console.error(`TEMPLATE ${t.name}: broken edge ${e.id} ${e.source}->${e.target}`); }
    }
  }
}
for (const pb of problems) {
  const ids = new Set();
  for (const p of pb.referenceArchitecture.pages || []) for (const n of p.nodes || []) ids.add(n.id);
  for (const p of pb.referenceArchitecture.pages || []) {
    for (const e of p.edges || []) {
      if (!ids.has(e.source) || !ids.has(e.target)) { issues++; console.error(`PROBLEM ${pb.title}: broken edge ${e.id} ${e.source}->${e.target}`); }
    }
  }
  if (JSON.stringify(pb).includes('referenceArchitecture') === false) {}
}

console.log(`Templates in DB: ${tCount}, Practice problems in DB: ${pCount}`);
console.log('Broken edges after seeding:', issues);
console.log('Sample problem:', problems[0]?.title, problems[0]?.difficulty, problems[0]?.functionalRequirements?.length, 'reqs,', problems[0]?.hints?.length, 'hints');
await mongoose.connection.close();
process.exit(issues ? 1 : 0);