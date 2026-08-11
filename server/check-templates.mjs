import mongoose from 'mongoose';
import env from './src/config/env.js';
import SystemDesignTemplate from './src/models/SystemDesignTemplate.js';

await mongoose.connect(env.MONGODB_URI);
const raw = await mongoose.connection.db.collection('systemdesigntemplates').countDocuments();
const viaModel = await SystemDesignTemplate.countDocuments();
const total = await SystemDesignTemplate.countDocuments({});
const builtIn = await SystemDesignTemplate.countDocuments({ isBuiltIn: true });
console.log('raw collection count:', raw, '| via model total:', total, '| isBuiltIn:', builtIn, '| model?:', viaModel);
const sample = await SystemDesignTemplate.findOne().lean();
console.log('sample:', sample?.name, '| nodes:', sample?.snapshot?.pages?.[0]?.nodes?.length, '| has isBuiltIn:', sample?.isBuiltIn);
await mongoose.connection.close();
process.exit(0);