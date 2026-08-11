import { buildGraph, validateGraph } from './systemDesignValidationService.js';

/**
 * systemDesignPracticeService — semantic evaluation of practice submissions.
 *
 * Evaluation NEVER compares diagrams visually. It analyzes the submitted
 * architecture graph against the problem's requirements and quality criteria.
 * Every score is derived from concrete matches/misses with explanations.
 */

const clone = (obj) => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

/**
 * Strip the reference architecture before sending a problem to a client.
 */
export const sanitizeProblem = (problem) => {
  const copy = clone(problem);
  if (copy) delete copy.referenceArchitecture;
  return copy;
};

const nodeLabel = (graph, id) => graph.nodes.find((n) => n.id === id)?.name || id;

const hasNode = (graph, fn) => graph.nodes.some(fn);
const nodesOfCategory = (graph, category) => graph.nodes.filter((n) => n.category === category);

/**
 * Evaluate a single match criterion against the graph.
 */
const evaluateCriterion = (graph, criterion) => {
  const kind = criterion.kind;
  switch (kind) {
    case 'category':
      return hasNode(graph, (n) => n.category === criterion.value);
    case 'component':
      return hasNode(graph, (n) => n.type === criterion.value || n.type?.endsWith(criterion.value));
    case 'anyOfCategories':
      return hasNode(graph, (n) => (criterion.values || []).includes(n.category));
    case 'property':
      return hasNode(graph, (n) => n.properties?.[criterion.property] === criterion.value);
    case 'propertyTrue':
      return hasNode(graph, (n) => Boolean(n.properties?.[criterion.property]));
    case 'propertyGte':
      return hasNode(graph, (n) => Number(n.properties?.[criterion.property] || 0) >= (criterion.threshold || 0));
    case 'propertyIn':
      return hasNode(graph, (n) => (criterion.values || []).includes(n.properties?.[criterion.property]));
    case 'edgeToCategory':
      return graph.edges.some((e) => graph.nodes.find((n) => n.id === e.target)?.category === criterion.targetCategory);
    case 'edgeFromCategory':
      return graph.edges.some((e) => graph.nodes.find((n) => n.id === e.source)?.category === criterion.sourceCategory);
    case 'edgeBetweenCategories':
      return graph.edges.some((e) => {
        const src = graph.nodes.find((n) => n.id === e.source);
        const tgt = graph.nodes.find((n) => n.id === e.target);
        return src?.category === criterion.sourceCategory && tgt?.category === criterion.targetCategory;
      });
    default:
      return false;
  }
};

const evaluateRequirement = (graph, req) => {
  const criteria = req.matches || [];
  if (!criteria.length) return { met: false, ratio: 0, matched: [], missing: [] };
  const results = criteria.map((c) => ({
    label: c.label || c.value || c.property,
    met: evaluateCriterion(graph, c),
  }));
  const metCount = results.filter((r) => r.met).length;
  return {
    met: metCount === results.length,
    ratio: results.length ? metCount / results.length : 0,
    matched: results.filter((r) => r.met),
    missing: results.filter((r) => !r.met),
  };
};

/**
 * Data design dimension: database redundancy/replication, caching on hot paths,
 * sharding under write volume.
 */
const scoreDataDesign = (graph) => {
  const databases = nodesOfCategory(graph, 'databases');
  if (!databases.length) return { score: 0, max: 20, notes: ['No database component found.'] };
  let score = 0;
  const notes = [];
  const max = 20;
  // Replication (10 pts)
  const replicated = databases.filter((d) => (d.properties?.replicas || 0) > 0 && d.properties?.replication !== 'none');
  score += databases.length ? Math.round((replicated.length / databases.length) * 10) : 0;
  notes.push(`${replicated.length}/${databases.length} databases have replication configured.`);
  // Cache presence (5 pts)
  const cache = graph.nodes.find((n) => n.category === 'databases' && /(cache|redis|memcached)/.test(n.type || ''));
  if (cache) {
    score += 5;
    notes.push('A cache component (Redis/Memcached) is present.');
  } else {
    notes.push('No cache component found — read-heavy designs should include one.');
  }
  // Sharding for write-heavy designs (5 pts)
  const writeHeavy = databases.some((d) => (d.properties?.writesPerSec || 0) > 5000);
  if (writeHeavy && databases.some((d) => d.properties?.sharded)) {
    score += 5;
    notes.push('Write-heavy database is sharded.');
  } else if (writeHeavy) {
    notes.push('Write-heavy database is not sharded (partial credit for future-proofing).');
    score += 2;
  } else {
    score += 5;
    notes.push('Write volume is within single-node range — no sharding required.');
  }
  return { score, max, notes };
};

/**
 * Evaluate a practice submission.
 * Returns a complete scorecard; hints used reduce the total score.
 */
export const evaluatePracticeSubmission = ({ problem, data, hintsUsed = [] }) => {
  const graph = buildGraph(data);
  const validation = validateGraph(graph.nodes, graph.edges, graph.groups);

  // ── 1. Functional requirements (out of 20) ──
  const reqs = (problem.functionalRequirements || []).map((r) => ({ ...r, evaluation: evaluateRequirement(graph, r) }));
  const reqWeightSum = reqs.reduce((s, r) => s + (r.weight || 1), 0) || 1;
  const reqScore = Math.round(
    (reqs.reduce((s, r) => s + r.evaluation.ratio * (r.weight || 1), 0) / reqWeightSum) * 20
  );

  // ── 2. Architecture quality (out of 20 each) ──
  const scalScore = validation.categories.scalability.score;
  const availScore = validation.categories.availability.score;
  const perfScore = validation.categories.performance.score;
  const dataDesign = scoreDataDesign(graph);

  // ── 3. Overall ──
  const hintPenalty = Math.min((hintsUsed || []).length * 2, 8);
  const overall = Math.max(0, Math.round((reqScore + scalScore + availScore + perfScore + dataDesign.score) / 5) - hintPenalty);

  // ── What went well ──
  const strengths = [];
  for (const r of reqs) {
    if (r.evaluation.met) strengths.push(`Requirement met: ${r.label}`);
    else if (r.evaluation.ratio > 0.5) {
      for (const m of r.evaluation.matched.slice(0, 3)) strengths.push(`Partially addressed "${r.label}" via ${m.label}`);
    }
  }
  for (const [key, label] of [['scalability', 'Scalability'], ['availability', 'Availability'], ['performance', 'Performance']]) {
    if (validation.categories[key]?.score >= 16) strengths.push(`${label} design is solid (${validation.categories[key].score}/20).`);
  }
  if (dataDesign.score >= 16) strengths.push(`Data design is well thought out (${dataDesign.score}/20).`);

  // ── Problems found ──
  const problems = [];
  for (const r of reqs) {
    if (!r.evaluation.met && r.evaluation.missing.length) {
      problems.push(`Requirement not addressed: ${r.label} (missing: ${r.evaluation.missing.map((m) => m.label || m.value).join(', ')})`);
    } else if (!r.evaluation.met) {
      problems.push(`Requirement not addressed: ${r.label}`);
    }
  }
  for (const f of validation.findings.filter((f) => f.severity !== 'suggestion')) {
    problems.push(f.title);
  }

  // ── Suggested improvements ──
  const suggestions = [];
  for (const r of reqs) {
    if (!r.evaluation.met && r.evaluation.missing.length) {
      suggestions.push(`Add the missing pieces for "${r.label}": ${r.evaluation.missing.map((m) => m.label || m.value).join(', ')}`);
    }
  }
  for (const f of validation.findings.filter((f) => f.severity !== 'suggestion')) {
    suggestions.push(f.recommendation);
  }

  return {
    scorecard: {
      overall,
      dimensions: {
        requirements: { score: reqScore, max: 20 },
        scalability: { score: scalScore, max: 20 },
        availability: { score: availScore, max: 20 },
        performance: { score: perfScore, max: 20 },
        dataDesign: { score: dataDesign.score, max: 20 },
      },
      hintsUsed: hintsUsed.length,
      hintPenalty,
    },
    strengths: strengths.slice(0, 8),
    problems: problems.slice(0, 10),
    suggestions: suggestions.slice(0, 8),
    expectedSolution: problem.referenceArchitecture || { pages: [], notes: [] },
    evaluationNotes: dataDesign.notes,
    requirementsDetail: reqs.map((r) => ({
      key: r.key,
      label: r.label,
      met: r.evaluation.met,
      ratio: r.evaluation.ratio,
      matched: r.evaluation.matched.map((m) => m.label || m.value),
      missing: r.evaluation.missing.map((m) => m.label || m.value),
    })),
  };
};