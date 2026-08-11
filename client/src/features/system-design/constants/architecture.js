/**
 * System Design Studio — core architecture constants & helpers.
 *
 * The semantic architecture model:
 *   document = { name, description, level, pages[], requirements[], decisions[],
 *                assumptions[], patternsUsed[], capacityInputs{}, customComponents[], metadata{} }
 *   page     = { pageId, name, level, nodes[], edges[], groups[] }
 *   node     = { id, type, category, name, description, position{x,y}, size{w,h},
 *                properties{}, metadata{}, style{}, locked, hidden, groupId }
 *   edge     = { id, source, target, sourceHandle, targetHandle, type:'archEdge',
 *                protocol, connectionType, direction, syncMode, label, traffic{rps,peakRps},
 *                latency{p50,p95,p99,unit}, payload, timeout, retry, backoff,
 *                circuitBreaker, animated, style, metadata }
 *   group    = { id, name, boundaryType, position{x,y}, size{w,h}, color, locked, metadata }
 *
 * The visual canvas is only a projection of this graph — the graph is the
 * source of truth (validation, practice evaluation, simulation and future AI
 * analysis all operate on the graph).
 */

import { CATALOG_PART_A } from './componentCatalogA';
import { CATALOG_PART_B } from './componentCatalogB';

// ─────────────────────────── CATEGORIES ───────────────────────────

export const ARCHITECTURE_CATEGORIES = [
  { id: 'clients', label: 'Clients', icon: 'Monitor', color: '#0ea5e9' },
  { id: 'networking', label: 'Networking', icon: 'Network', color: '#8b5cf6' },
  { id: 'compute', label: 'Compute', icon: 'Cpu', color: '#f59e0b' },
  { id: 'application-services', label: 'Application Services', icon: 'Blocks', color: '#6366f1' },
  { id: 'databases', label: 'Databases', icon: 'Database', color: '#10b981' },
  { id: 'storage', label: 'Storage', icon: 'HardDrive', color: '#06b6d4' },
  { id: 'messaging', label: 'Messaging', icon: 'GitBranch', color: '#f43f5e' },
  { id: 'communication', label: 'Communication', icon: 'Cable', color: '#14b8a6' },
  { id: 'security', label: 'Security', icon: 'Shield', color: '#ef4444' },
  { id: 'observability', label: 'Observability', icon: 'Activity', color: '#f97316' },
  { id: 'custom', label: 'Custom', icon: 'Puzzle', color: '#64748b' },
];

export const CATEGORY_MAP = Object.fromEntries(ARCHITECTURE_CATEGORIES.map((c) => [c.id, c]));

export const ALL_BUILTIN_COMPONENTS = [...CATALOG_PART_A, ...CATALOG_PART_B];

export const COMPONENT_DEFS = Object.fromEntries(ALL_BUILTIN_COMPONENTS.map((c) => [c.type, c]));

const humanize = (slug) =>
  slug
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Resolve a component definition for any type string. Falls back to a derived
 * definition when the type is unknown (e.g. components created by templates
 * that are not in the built-in catalog) so rendering never breaks.
 */
export const getComponentDef = (type, customComponents = []) => {
  if (!type) return null;
  const def = COMPONENT_DEFS[type];
  if (def) return def;
  if (Array.isArray(customComponents)) {
    const custom = customComponents.find((c) => c.type === type || c.id === type);
    if (custom) {
      return {
        type: custom.type || type,
        category: custom.category || 'custom',
        label: custom.label || custom.name || humanize(type.split('.')[1] || type),
        description: custom.description || '',
        icon: custom.icon || 'Puzzle',
        color: custom.color || '#64748b',
        size: custom.size || { w: 210, h: 88 },
        defaults: custom.defaults || {},
      };
    }
  }
  const [category, slug] = type.split('.');
  const cat = CATEGORY_MAP[category] || CATEGORY_MAP.custom;
  return {
    type,
    category: cat.id,
    label: humanize(slug || type),
    description: `Custom ${cat.label.toLowerCase()} component`,
    icon: cat.icon,
    color: cat.color,
    size: { w: 210, h: 88 },
    defaults: {},
  };
};

// ─────────────────────────── LEVELS / BOUNDARIES / CONNECTIONS ───────────────────────────

export const ARCH_LEVELS = [
  { id: 'context', label: 'System Context', description: 'Level 1 — system boundaries and external actors' },
  { id: 'hld', label: 'HLD', description: 'Level 2 — containers, services, deployment' },
  { id: 'lld', label: 'LLD', description: 'Level 3 — component internals (controllers, services, repos)' },
  { id: 'detail', label: 'Detail', description: 'Level 4 — detailed implementation and request flows' },
];

export const LEVEL_MAP = Object.fromEntries(ARCH_LEVELS.map((l) => [l.id, l]));

export const BOUNDARY_TYPES = [
  { id: 'region', label: 'Region' },
  { id: 'vpc', label: 'VPC' },
  { id: 'availability-zone', label: 'Availability Zone' },
  { id: 'subnet', label: 'Subnet' },
  { id: 'kubernetes-cluster', label: 'Kubernetes Cluster' },
  { id: 'namespace', label: 'Namespace' },
  { id: 'service', label: 'Service Boundary' },
  { id: 'microservice', label: 'Microservice Boundary' },
  { id: 'custom', label: 'Custom Boundary' },
];

export const BOUNDARY_COLORS = {
  region: '#8b5cf6',
  vpc: '#6366f1',
  'availability-zone': '#0ea5e9',
  subnet: '#06b6d4',
  'kubernetes-cluster': '#f59e0b',
  namespace: '#14b8a6',
  service: '#10b981',
  microservice: '#f43f5e',
  custom: '#64748b',
};

export const CONNECTION_TYPES = [
  'HTTP', 'HTTPS', 'REST', 'GraphQL', 'gRPC', 'TCP', 'UDP',
  'WebSocket', 'SSE', 'Kafka', 'Queue', 'Event', 'Database', 'Cache',
];

export const PROTOCOLS = ['REST', 'GraphQL', 'gRPC', 'WebSocket', 'SSE', 'SQL', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'AMQP', 'MQTT', 'Event', 'Internal'];

export const BACKOFF_OPTIONS = ['none', 'linear', 'exponential'];

export const DEFAULT_EDGE = {
  type: 'archEdge',
  protocol: 'REST',
  connectionType: 'HTTP',
  direction: 'one-way',
  syncMode: 'sync',
  label: '',
  traffic: { rps: 100, peakRps: 300 },
  latency: { p50: 30, p95: 80, p99: 150, unit: 'ms' },
  payload: 20,
  timeout: 5,
  retry: 0,
  backoff: 'none',
  circuitBreaker: false,
  animated: false,
  style: {},
  metadata: {},
};

export const DEFAULT_PAGES = [
  { name: 'Context', level: 'context' },
  { name: 'HLD', level: 'hld' },
  { name: 'API Architecture', level: 'hld' },
  { name: 'Database Architecture', level: 'hld' },
  { name: 'Message Flow', level: 'hld' },
  { name: 'Authentication Flow', level: 'lld' },
  { name: 'Deployment Architecture', level: 'detail' },
  { name: 'LLD', level: 'lld' },
];

// ─────────────────────────── ID GENERATION ───────────────────────────

let seq = 0;
export const genId = (prefix) => `${prefix}_${Date.now()}_${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ─────────────────────────── NODE / EDGE / GROUP / PAGE FACTORIES ───────────────────────────

export const createNode = (type, position, customComponents = []) => {
  const def = getComponentDef(type, customComponents);
  return {
    id: genId('node'),
    type: def.type,
    category: def.category,
    name: def.label,
    description: def.description || '',
    position: { x: position.x, y: position.y },
    size: { ...(def.size || { w: 220, h: 96 }) },
    properties: { ...(def.defaults || {}) },
    metadata: { source: 'catalog' },
    style: {},
    locked: false,
    hidden: false,
    groupId: null,
  };
};

export const createEdge = (source, target, sourceHandle = null, targetHandle = null, overrides = {}) => ({
  id: genId('edge'),
  source,
  target,
  sourceHandle,
  targetHandle,
  ...DEFAULT_EDGE,
  ...overrides,
});

export const createGroup = (position, size, boundaryType = 'custom', name = '') => ({
  id: genId('group'),
  name: name || BOUNDARY_TYPES.find((b) => b.id === boundaryType)?.label || 'Boundary',
  boundaryType,
  position: { x: position.x, y: position.y },
  size: { w: size.w || 600, h: size.h || 400 },
  color: BOUNDARY_COLORS[boundaryType] || '#64748b',
  locked: false,
  metadata: {},
});

export const createPage = (name, level = 'hld') => ({
  pageId: genId('page'),
  name,
  level,
  nodes: [],
  edges: [],
  groups: [],
});

// ─────────────────────────── PROPERTY FIELD SCHEMAS ───────────────────────────
// Generic, typed field definitions consumed by the properties panel. Groups are
// collapsed sections; per-type schemas extend category defaults.

const F = (key, label, type, options = {}) => ({ key, label, type, ...options });

const serviceFields = [
  F('instances', 'Instances', 'number', { min: 1, step: 1, group: 'Architecture' }),
  F('cpu', 'CPU (vCPU)', 'number', { min: 0.5, step: 0.5, group: 'Architecture' }),
  F('memory', 'Memory (GB)', 'number', { min: 0.5, step: 0.5, group: 'Architecture' }),
  F('requestsPerSec', 'Requests/sec', 'number', { min: 0, group: 'Capacity' }),
  F('avgLatency', 'Avg latency (ms)', 'number', { min: 0, group: 'Capacity' }),
  F('p95Latency', 'P95 latency (ms)', 'number', { min: 0, group: 'Capacity' }),
  F('p99Latency', 'P99 latency (ms)', 'number', { min: 0, group: 'Capacity' }),
  F('autoScaling', 'Auto scaling', 'toggle', { group: 'Architecture' }),
  F('protocol', 'Protocol', 'text', { group: 'Architecture' }),
  F('port', 'Port', 'number', { min: 0, max: 65535, group: 'Architecture' }),
  F('timeoutMs', 'Timeout (ms)', 'number', { min: 0, group: 'Reliability' }),
  F('retryPolicy', 'Retry policy', 'text', { group: 'Reliability' }),
  F('circuitBreaker', 'Circuit breaker', 'toggle', { group: 'Reliability' }),
];

const databaseFields = [
  F('version', 'Version', 'text', { group: 'General' }),
  F('environment', 'Environment', 'select', { options: ['development', 'staging', 'production'], group: 'General' }),
  F('mode', 'Architecture mode', 'select', { options: ['primary', 'replica-set', 'cluster', 'multi-primary', 'sharded', 'partitioned'], group: 'Architecture' }),
  F('replicas', 'Replicas', 'number', { min: 0, step: 1, group: 'Architecture' }),
  F('readsPerSec', 'Reads/sec', 'number', { min: 0, group: 'Capacity' }),
  F('writesPerSec', 'Writes/sec', 'number', { min: 0, group: 'Capacity' }),
  F('storageGB', 'Storage (GB)', 'number', { min: 0, group: 'Capacity' }),
  F('connections', 'Connections', 'number', { min: 0, group: 'Capacity' }),
  F('replication', 'Replication', 'select', { options: ['none', 'streaming', 'binary-log', 'replica-set', 'multi-region', 'causal', 'shard-replica', 'always-on'], group: 'Reliability' }),
  F('backup', 'Backup', 'toggle', { group: 'Reliability' }),
  F('failover', 'Automatic failover', 'toggle', { group: 'Reliability' }),
  F('multiAZ', 'Multi-AZ', 'toggle', { group: 'Reliability' }),
  F('sharded', 'Sharded', 'toggle', { group: 'Architecture' }),
  F('partitioned', 'Partitioned', 'toggle', { group: 'Architecture' }),
  F('consistency', 'Consistency', 'select', { options: ['strong', 'eventual'], group: 'Consistency' }),
  F('retentionDays', 'Retention (days)', 'number', { min: 0, group: 'Data' }),
];

const redisFields = [
  F('mode', 'Deployment mode', 'select', { options: ['standalone', 'sentinel', 'cluster'], group: 'Architecture' }),
  F('nodes', 'Nodes', 'number', { min: 1, step: 1, group: 'Architecture' }),
  F('replicas', 'Replicas', 'number', { min: 0, step: 1, group: 'Architecture' }),
  F('requestsPerSec', 'Requests/sec', 'number', { min: 0, group: 'Capacity' }),
  F('memoryGB', 'Memory (GB)', 'number', { min: 1, group: 'Capacity' }),
  F('hitRatio', 'Hit ratio (%)', 'number', { min: 0, max: 100, group: 'Capacity' }),
  F('persistence', 'Persistence', 'select', { options: ['none', 'RDB', 'AOF', 'both'], group: 'Reliability' }),
  F('eviction', 'Eviction', 'select', { options: ['none', 'LRU', 'LFU', 'TTL', 'random'], group: 'Architecture' }),
  F('multiAZ', 'Multi-AZ', 'toggle', { group: 'Reliability' }),
  F('replication', 'Replication', 'toggle', { group: 'Reliability' }),
  F('failover', 'Failover', 'toggle', { group: 'Reliability' }),
];

const queueFields = [
  F('throughput', 'Throughput (msg/sec)', 'number', { min: 0, group: 'Capacity' }),
  F('partitions', 'Partitions', 'number', { min: 1, step: 1, group: 'Architecture' }),
  F('replicas', 'Replicas', 'number', { min: 0, step: 1, group: 'Reliability' }),
  F('retentionMs', 'Retention (ms)', 'number', { min: 0, group: 'Data' }),
  F('deadLetterQueue', 'Dead-letter queue', 'toggle', { group: 'Reliability' }),
  F('consumers', 'Consumers', 'number', { min: 1, step: 1, group: 'Capacity' }),
];

const storageFields = [
  F('capacityTB', 'Capacity (TB)', 'number', { min: 0, group: 'Capacity' }),
  F('tier', 'Storage tier', 'select', { options: ['standard', 'infrequent', 'archive', 'cold'], group: 'Architecture' }),
  F('durability', 'Durability (9s)', 'number', { min: 0, group: 'Reliability' }),
  F('encrypted', 'Encryption at rest', 'toggle', { group: 'Security' }),
  F('versioning', 'Versioning', 'toggle', { group: 'Data' }),
  F('lifecycleEnabled', 'Lifecycle policies', 'toggle', { group: 'Data' }),
  F('retentionDays', 'Retention (days)', 'number', { min: 0, group: 'Data' }),
];

const gatewayFields = [
  F('rateLimitEnabled', 'Rate limiting', 'toggle', { group: 'Security' }),
  F('authEnabled', 'Authentication', 'toggle', { group: 'Security' }),
  F('tlsEnabled', 'TLS termination', 'toggle', { group: 'Security' }),
  F('corsEnabled', 'CORS', 'toggle', { group: 'Architecture' }),
  F('timeoutMs', 'Timeout (ms)', 'number', { min: 0, group: 'Reliability' }),
];

const securityFields = [
  F('algorithm', 'Algorithm', 'text', { group: 'Architecture' }),
  F('tokenTtl', 'Token TTL (s)', 'number', { min: 0, group: 'Architecture' }),
  F('autoRotation', 'Auto-rotation', 'toggle', { group: 'Reliability' }),
  F('mfa', 'MFA', 'toggle', { group: 'Security' }),
  F('sso', 'SSO', 'toggle', { group: 'Security' }),
];

const observabilityFields = [
  F('retentionDays', 'Retention (days)', 'number', { min: 0, group: 'Data' }),
  F('samplingRate', 'Sampling rate (%)', 'number', { min: 0, max: 100, group: 'Architecture' }),
  F('level', 'Log level', 'select', { options: ['debug', 'info', 'warn', 'error'], group: 'Architecture' }),
];

const additionalFields = [
  F('region', 'Region', 'text', { group: 'Additional' }),
  F('availabilityZone', 'Availability Zone', 'text', { group: 'Additional' }),
  F('tags', 'Tags', 'tags', { group: 'Additional' }),
  F('notes', 'Notes', 'textarea', { group: 'Additional' }),
];

const CACHE_TYPES = new Set(['databases.redis', 'databases.redis-cache', 'databases.memcached']);
const QUEUE_TYPES = new Set([
  'messaging.kafka', 'messaging.rabbitmq', 'messaging.redis-streams', 'messaging.sqs',
  'messaging.pubsub', 'messaging.event-bus', 'messaging.message-queue', 'messaging.dead-letter-queue',
  'messaging.topic', 'messaging.consumer-group',
]);

/**
 * Property field list for a component type: category defaults + type overrides.
 */
export const getPropertyFields = (type) => {
  const category = type?.split('.')[0];
  let fields = [];
  switch (category) {
    case 'compute':
      fields = [...serviceFields];
      break;
    case 'application-services':
      fields = [...serviceFields];
      break;
    case 'databases':
      fields = CACHE_TYPES.has(type) ? [...redisFields] : [...databaseFields];
      break;
    case 'storage':
      fields = [...storageFields];
      break;
    case 'messaging':
      fields = QUEUE_TYPES.has(type) ? [...queueFields] : [...queueFields];
      break;
    case 'networking':
      if (type === 'networking.api-gateway' || type === 'networking.load-balancer' || type === 'networking.reverse-proxy') {
        fields = [...gatewayFields];
      }
      break;
    case 'security':
      fields = [...securityFields];
      break;
    case 'observability':
      fields = [...observabilityFields];
      break;
    case 'communication':
      fields = [];
      break;
    default:
      fields = [];
  }
  // Merge with additional fields (region / AZ / tags / notes) — dedupe keys.
  const keys = new Set(fields.map((f) => f.key));
  for (const f of additionalFields) if (!keys.has(f.key)) fields.push(f);
  return fields;
};

// Property groups ordering for the panel.
export const PROPERTY_GROUPS = ['General', 'Architecture', 'Capacity', 'Reliability', 'Consistency', 'Security', 'Data', 'Additional'];

export const groupFields = (fields) => {
  const groups = new Map();
  for (const f of fields) {
    const g = f.group || 'Additional';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  }
  return PROPERTY_GROUPS.filter((g) => groups.has(g)).map((g) => ({ group: g, fields: groups.get(g) }));
};
