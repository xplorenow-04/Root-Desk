import { PATTERNS_A } from './patternsA';
import { PATTERNS_B } from './patternsB';

export { PATTERNS_A, PATTERNS_B };

export const PATTERNS = [...PATTERNS_A, ...PATTERNS_B];

export const PATTERN_CATEGORIES = [
  { id: 'caching', label: 'Caching' },
  { id: 'data', label: 'Data' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'scalability', label: 'Scalability' },
  { id: 'security', label: 'Security' },
  { id: 'deployment', label: 'Deployment' },
];

export const getPattern = (id) => PATTERNS.find((p) => p.id === id);
