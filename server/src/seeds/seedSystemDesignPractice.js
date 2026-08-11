import SystemDesignPractice from '../models/SystemDesignPractice.js';

/**
 * Seed built-in practice problems for System Design Studio Practice Mode.
 * Each problem includes functional requirements with semantic match criteria
 * (evaluated against the submitted architecture graph) plus a reference
 * architecture that is only exposed to clients after a submission.
 */

let nCounter = 0;
const n = (type, name, x, y, properties = {}, opts = {}) => {
  nCounter += 1;
  const [category] = type.split('.');
  return {
    id: `n${nCounter}`,
    type,
    category,
    name,
    description: opts.description || '',
    position: { x, y },
    size: { w: opts.w || 220, h: opts.h || 96 },
    properties: properties || {},
    metadata: {},
    style: {},
    locked: false,
    hidden: false,
    groupId: opts.groupId || null,
  };
};

let eCounter = 0;
const e = (source, target, opts = {}) => {
  eCounter += 1;
  return {
    id: `e${eCounter}`,
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
    type: 'archEdge',
    protocol: opts.protocol || 'REST',
    connectionType: opts.connectionType || 'HTTP',
    direction: opts.direction || 'one-way',
    syncMode: opts.syncMode || 'sync',
    label: opts.label || '',
    traffic: { rps: opts.rps ?? 100, peakRps: opts.peakRps ?? 0 },
    latency: { p50: opts.p50 ?? 30, p95: opts.p95 ?? 80, p99: opts.p99 ?? 150, unit: 'ms' },
    payload: opts.payload ?? 20,
    timeout: opts.timeout ?? 5,
    retry: opts.retry ?? 0,
    backoff: opts.backoff || 'none',
    circuitBreaker: opts.circuitBreaker ?? false,
    animated: false,
    style: {},
    metadata: {},
  };
};

const page = (name, level, nodes, edges, groups = []) => ({
  pageId: `page_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
  name,
  level,
  nodes,
  edges,
  groups,
});

const srv = (type, name, x, y, extra = {}) =>
  n(type, name, x, y, {
    instances: 2,
    cpu: 2,
    memory: 4,
    requestsPerSec: 2000,
    avgLatency: 50,
    p95Latency: 100,
    p99Latency: 200,
    autoScaling: true,
    ...extra,
  });

const db = (type, name, x, y, extra = {}) =>
  n(type, name, x, y, {
    version: 'current',
    environment: 'production',
    mode: 'primary',
    replicas: 1,
    readsPerSec: 10000,
    writesPerSec: 5000,
    storageGB: 100,
    replication: 'streaming',
    backup: true,
    ...extra,
  });

const cache = (type, name, x, y) =>
  n(type, name, x, y, { maxMemoryMB: 16384, evictionPolicy: 'LRU', replication: 'sentinel', replicaCount: 2, persistence: 'aof', cacheEnabled: true });

const queue = (type, name, x, y) =>
  n(type, name, x, y, { throughput: 200000, partitions: 12, replicas: 3, deadLetterQueue: true });

// ─────────────────────────────── PROBLEMS ───────────────────────────────

const problems = [
  {
    title: 'ScanSnap URL Shortener',
    description:
      'Design a URL shortening service like bit.ly. Users paste long URLs and receive short aliases that redirect instantly. Write volume is moderate, but reads dominate heavily with viral spikes. Aliases must be globally unique and collision-safe under concurrent creation, and users need click analytics after the fact.',
    difficulty: 'beginner',
    estimatedMinutes: 60,
    functionalRequirements: [
      {
        key: 'shorten',
        label: 'Shorten long URLs into short aliases',
        weight: 2,
        matches: [
          { kind: 'component', value: 'url-shortener', label: 'A URL shortener service', },
          { kind: 'category', value: 'application-services', label: 'An application service layer', },
        ],
      },
      {
        key: 'redirect',
        label: 'Redirect short aliases to the original URL',
        weight: 2,
        matches: [
          { kind: 'component', value: 'load-balancer', label: 'Load-balanced entry point', },
          { kind: 'edgeBetweenCategories', sourceCategory: 'application-services', targetCategory: 'databases', label: 'Service reads mappings from a database', },
        ],
      },
      {
        key: 'collision_handling',
        label: 'Guarantee unique aliases under concurrency',
        matches: [
          { kind: 'propertyTrue', property: 'uniqueAliases', label: 'Unique-alias guarantee configured' },
        ],
      },
      {
        key: 'analytics',
        label: 'Track click counts per short URL',
        matches: [
          { kind: 'category', value: 'messaging', label: 'Message queue for click events', },
          { kind: 'component', value: 'worker', label: 'Asynchronous analytics worker', },
        ],
      },
      {
        key: 'hot_reads',
        label: 'Serve popular URLs from memory',
        weight: 2,
        matches: [
          { kind: 'component', value: 'redis-cache', label: 'Cache layer (e.g., Redis)', },
          { kind: 'edgeBetweenCategories', sourceCategory: 'application-services', targetCategory: 'databases', label: 'Cache sits between app and database', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Read-heavy', description: '~100:1 read:write ratio with request-skew spikes on viral links.' },
      { name: 'Redirect latency', description: 'P95 redirect under 100 ms end to end.' },
      { name: 'Availability', description: 'Active users must never see a 500 during spikes.' },
    ],
    traffic: { dailyReads: '2.4B', dailyWrites: '24M', peakReadQps: '80K', readWriteRatio: '100:1' },
    storage: { mappingRows: '~8B rows after 1 year', indexOverhead: 'Included in alias lookup', cacheWorkingSet: 'Top 1% URLs' },
    availability: '99.95% (paging alarms only for correlated faults)',
    latency: 'P95 redirect < 100 ms; writes async-accepted',
    evaluationCriteria: [
      'Stateless application tier behind a load balancer',
      'Cache hot path before hitting the database',
      'Asynchronous event pipeline for click analytics',
      'Unique-key generation that survives concurrent writes',
    ],
    expectedPatterns: ['cache-aside', 'asynchronous-processing', 'event-driven'],
    hints: [
      { id: 'h1', text: 'Think about which reads are hot: the same viral URLs are hit millions of times.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Click analytics must not add latency to the redirect path.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Consider how two parallel shorten requests can be prevented from producing the same alias.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Clients', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 220, 100),
          srv('application-services.url-shortener-service', 'URL Shortener Service', 440, 100, { uniqueAliases: true }),
          cache('databases.redis-cache', 'Redis (Hot URLs)', 660, 40),
          db('databases.postgresql', 'PostgreSQL (Mappings)', 660, 160, { replicas: 3, readsPerSec: 80000 }),
          queue('messaging.kafka', 'Kafka (Click Events)', 660, 300),
          n('compute.worker', 'Analytics Workers', 880, 300, { instances: 4, requestsPerSec: 5000 }),
          db('databases.clickhouse', 'ClickHouse (Analytics)', 880, 420, { replicas: 3, writesPerSec: 20000 }),
        ], [
          e('n1', 'n2', { rps: 50000, peakRps: 80000, circuitBreaker: true }),
          e('n2', 'n3', { rps: 50000, peakRps: 80000, circuitBreaker: true, retry: 2, backoff: 'exponential' }),
          e('n3', 'n4', { protocol: 'Cache', connectionType: 'Cache', rps: 70000, p50: 1, p99: 5 }),
          e('n4', 'n5', { protocol: 'Cache', connectionType: 'Cache', rps: 30000 }),
          e('n3', 'n5', { protocol: 'SQL', connectionType: 'DB', rps: 20000, p99: 150 }),
          e('n3', 'n6', { protocol: 'Event', rps: 24000, syncMode: 'async' }),
          e('n6', 'n7', { protocol: 'Event', rps: 24000, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 20000, syncMode: 'async', timeout: 30 }),
        ]),
      ],
      notes: [
        'Base62 aliases generated offline in batches; uniqueness enforced with a unique index.',
        'Cache-aside with ~30-min TTL for redirected URLs; misses backfill via single-flight.',
        'Click events flow through Kafka; workers aggregate into ClickHouse for analytics dashboards.',
      ],
    },
  },
  {
    title: 'RateQuest API Rate Limiter',
    description:
      'Build an API rate limiter protecting a public REST API with multiple tiers (free, pro, enterprise). Limits must be enforced per API key, distributed across many gateway instances, and configurable without redeploying. Design it so a single user cannot exhaust shared capacity.',
    difficulty: 'intermediate',
    estimatedMinutes: 60,
    functionalRequirements: [
      {
        key: 'gateway_enforcement',
        label: 'Enforce limits at the API gateway',
        weight: 2,
        matches: [
          { kind: 'component', value: 'api-gateway', label: 'API gateway component', },
          { kind: 'propertyTrue', property: 'rateLimitEnabled', label: 'Rate limiting enabled on the gateway', },
        ],
      },
      {
        key: 'distributed_counters',
        label: 'Counters shared across all gateway instances',
        weight: 2,
        matches: [
          { kind: 'category', value: 'databases', label: 'Shared counter store', },
          { kind: 'component', value: 'redis-cache', label: 'Fast counter store (Redis)', },
        ],
      },
      {
        key: 'per_key_rules',
        label: 'Different limits per API tier',
        matches: [
          { kind: 'property', property: 'tiers', value: 'yes', label: 'Multiple tier configurations' },
        ],
      },
      {
        key: 'backpressure',
        label: 'Respond nicely to throttled clients (429 + retry hint)',
        matches: [
          { kind: 'propertyTrue', property: 'http429', label: '429 rejection path configured', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Correctness', description: 'Limits must be accurate within a small race window; no double-spending budgets.' },
      { name: 'Latency', description: 'Counter check adds < 2 ms to request path.' },
      { name: 'Ops simplicity', description: 'Rules changeable at runtime without restarts.' },
    ],
    traffic: { qps: '600K peak across 3 gateway regions', keys: '50M API keys', counterReads: '2x request rate' },
    storage: { counterRows: '50M keys × rolling windows', ruleSet: 'A few KB, cached aggressively' },
    availability: '99.95%; graceful degradation to allowlist when counter store is down',
    latency: 'P99 check < 5 ms; rules cache refresh < 100 ms',
    evaluationCriteria: [
      'A centralized but highly available counter store',
      'Gateway performs the check, not application services',
      'Rules administration decoupled from code',
      'Failure mode that does not take down the API',
    ],
    expectedPatterns: ['cache-aside', 'circuit-breaker', 'fail-open'],
    hints: [
      { id: 'h1', text: 'Where does the check happen relative to the load balancer?', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'A counter stored in a single database would become a bottleneck at 600K QPS.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Plan for the counter store being unavailable — is the API down, or just unlimited?', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'API Clients', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 220, 100),
          n('networking.api-gateway', 'API Gateway (Rate Limits)', 440, 100, { rateLimitEnabled: true, tiers: 'yes', http429: true, algorithm: 'token bucket', checkLatencyMs: 1 }),
          cache('databases.redis-cache', 'Redis (Counters)', 660, 60, ),
          db('databases.postgresql', 'PostgreSQL (Rule Config)', 660, 220, { replicas: 2, readsPerSec: 500 }),
          srv('application-services.api-service', 'API Backend', 660, 100),
          n('compute.container', 'Rule Sync Agents', 440, 260, { instances: 2, requestsPerSec: 100 }),
          n('observability.metrics', 'Metrics & Alerts', 880, 100, { metrics: true }),
        ], [
          e('n1', 'n2', { rps: 600000, peakRps: 600000 }),
          e('n2', 'n3', { rps: 600000, peakRps: 600000 }),
          e('n3', 'n4', { protocol: 'Cache', connectionType: 'Cache', rps: 1200000, p50: 1, p99: 3 }),
          e('n3', 'n5', { protocol: 'SQL', connectionType: 'DB', rps: 50 }),
          e('n5', 'n7', { protocol: 'Streams', rps: 100, syncMode: 'async' }),
          e('n7', 'n4', { protocol: 'Cache', connectionType: 'Cache', rps: 100, syncMode: 'async' }),
          e('n3', 'n6', { rps: 590000, peakRps: 590000, circuitBreaker: true }),
          e('n3', 'n8', { protocol: 'Streams', rps: 1000, syncMode: 'async' }),
        ]),
      ],
      notes: [
        'Token-bucket counters stored in Redis with small TTL windows; script atomically checks and decrements.',
        'Gateway fail-open: if Redis is unreachable for > 2 s, allow traffic and page.',
        'Rule changes pushed to gateway-local cache by rule sync agents subscribing to config DB.',
      ],
    },
  },
  {
    title: 'Pulse Social News Feed',
    description:
      'Design a social network news feed: users post, follow others, and their home feed aggregates posts from everyone they follow, sorted by recency. At scale you must balance "pull" and "push" fan-out. Viral posts may reach millions of readers. Add reactions, comments, and hashtag search.',
    difficulty: 'advanced',
    estimatedMinutes: 120,
    functionalRequirements: [
      {
        key: 'post_creation',
        label: 'Users publish posts with media',
        weight: 2,
        matches: [
          { kind: 'component', value: 'post', label: 'Post service', },
          { kind: 'category', value: 'storage', label: 'Media/object storage', },
        ],
      },
      {
        key: 'feed_generation',
        label: 'Aggregate home feeds of followed users',
        weight: 2,
        matches: [
          { kind: 'component', value: 'feed', label: 'Feed generation service', },
          { kind: 'edgeToCategory', targetCategory: 'databases', label: 'Feed reads from a store', },
        ],
      },
      {
        key: 'fanout',
        label: 'Efficient fan-out for accounts with millions of followers',
        weight: 2,
        matches: [
          { kind: 'category', value: 'messaging', label: 'Message queue for fan-out', },
          { kind: 'component', value: 'worker', label: 'Fan-out workers', },
        ],
      },
      {
        key: 'reactions_comments',
        label: 'Reactions and comments on posts',
        matches: [
          { kind: 'component', value: 'reaction', label: 'Reaction/comment service', },
        ],
      },
      {
        key: 'search',
        label: 'Hashtag and keyword search',
        matches: [
          { kind: 'component', value: 'elasticsearch', label: 'Search index', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Feed freshness', description: 'New posts visible within seconds for active users.' },
      { name: 'Read-heavy', description: 'Home feed reads dwarf write volume by orders of magnitude.' },
      { name: 'Graceful degradation', description: 'Viral posts must not stall the rest of the platform.' },
    ],
    traffic: { weeklyActive: '500M', dailyPosts: '200M', dailyFeedReads: '20B', peakReadQps: '1M' },
    storage: { posts: '~200M/day → 73B/year', feedCache: 'Top 1M users cached', searchIndex: 'All public posts' },
    availability: '99.95% core loops; feed assembly may degrade to pull-only',
    latency: 'Post < 300 ms acknowledged; feed load P95 < 300 ms',
    evaluationCriteria: [
      'Hybrid fan-out: push for average users, pull for celebrities',
      'Feed cache materialized ahead of reads',
      'Decoupled pipeline for media uploads and indexing',
      'Search and analytics isolated from the hot feed path',
    ],
    expectedPatterns: ['fan-out-on-write', 'cache-aside', 'event-driven'],
    hints: [
      { id: 'h1', text: 'Writing a post into every follower\'s feed synchronously will not survive a 50M-follower celebrity.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Feed reads are the hottest path in the whole system.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Two very different strategies exist for fan-out; pick both, not one.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Mobile / Web', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 220, 100),
          srv('application-services.post-service', 'Post Service', 440, 40, { requestsPerSec: 20000 }),
          srv('application-services.feed-service', 'Feed Service', 440, 180, { requestsPerSec: 100000 }),
          srv('application-services.reaction-service', 'Reaction Service', 440, 320),
          queue('messaging.kafka', 'Kafka (Post Events)', 660, 40),
          n('compute.worker', 'Fan-out Workers', 660, 180, { instances: 40, requestsPerSec: 20000 }),
          cache('databases.redis-cache', 'Redis (Feed Cache)', 860, 180),
          db('databases.mongodb', 'MongoDB (Posts)', 660, 320, { replicas: 3, writesPerSec: 100000, sharded: true }),
          n('storage.object-storage', 'Object Storage (Media)', 440, 440),
          n('compute.container', 'Indexing Workers', 660, 440, { instances: 6 }),
          db('databases.elasticsearch', 'Elasticsearch (Search)', 860, 440, { replicas: 3 }),
        ], [
          e('n1', 'n2', { rps: 1000000, peakRps: 1000000 }),
          e('n2', 'n3', { rps: 20000, circuitBreaker: true }),
          e('n2', 'n4', { rps: 1000000, peakRps: 1000000, circuitBreaker: true, retry: 2 }),
          e('n2', 'n5', { rps: 100000, circuitBreaker: true }),
          e('n3', 'n6', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n3', 'n10', { protocol: 'S3', connectionType: 'HTTP', rps: 30000, syncMode: 'async' }),
          e('n6', 'n7', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 2000000, p50: 1, p99: 5 }),
          e('n4', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 5000000, p50: 1, p99: 10 }),
          e('n3', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 20000, timeout: 30 }),
          e('n5', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 50000, syncMode: 'async' }),
          e('n7', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 20000, syncMode: 'async', timeout: 30 }),
          e('n10', 'n11', { protocol: 'S3', connectionType: 'HTTP', rps: 30000, syncMode: 'async' }),
          e('n11', 'n12', { protocol: 'REST', rps: 20000, syncMode: 'async', timeout: 30 }),
        ]),
      ],
      notes: [
        'Hybrid fan-out: push to followers up to ~50K; celebrity posts are materialized on read.',
        'Feed cache holds serialized timelines per user; invalidated incrementally on new posts.',
        'Posts sharded by author id in MongoDB; media uploads async through object storage.',
      ],
    },
  },
  {
    title: 'HitchHop Ride Sharing',
    description:
      'Design a ride-sharing platform. Riders request rides; nearby drivers are matched and dispatched. Driver locations stream in at high frequency. You need live tracking for riders, ETA estimation, and surge handling. Matching must be fast: sub-second decisions matter more than perfection.',
    difficulty: 'advanced',
    estimatedMinutes: 120,
    functionalRequirements: [
      {
        key: 'location_ingestion',
        label: 'Ingest high-frequency driver locations',
        weight: 2,
        matches: [
          { kind: 'category', value: 'messaging', label: 'Streaming pipeline for locations', },
          { kind: 'component', value: 'worker', label: 'Location consumers', },
        ],
      },
      {
        key: 'matching',
        label: 'Match riders to nearby drivers in near real-time',
        weight: 2,
        matches: [
          { kind: 'component', value: 'dispatch', label: 'Dispatch/matching service', },
          { kind: 'component', value: 'geo', label: 'Spatial index (e.g., PostGIS)', },
        ],
      },
      {
        key: 'live_tracking',
        label: 'Live ride tracking for the rider',
        matches: [
          { kind: 'component', value: 'websocket', label: 'WebSocket gateway for live updates', },
        ],
      },
      {
        key: 'trip_lifecycle',
        label: 'Trip state machine (request → matched → in-progress → completed)',
        matches: [
          { kind: 'propertyTrue', property: 'tripStateMachine', label: 'Trip state machine', },
        ],
      },
      {
        key: 'history',
        label: 'Ride history with replay-able location trails',
        matches: [
          { kind: 'component', value: 'timeseries', label: 'Time-series store for tracks', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Matching latency', description: 'Match decision < 1 s under peak load.' },
      { name: 'Ingest scale', description: '~1M drivers × 4 updates/s = 4M location events/s sustained.' },
      { name: 'Consistency', description: 'A trip must never be double-matched; drivers see one assignment.' },
    ],
    traffic: { locationEvents: '4M/s sustained, 8M/s peak', rideRequests: '10K/s peak', trackingConnections: '2M concurrent WebSockets' },
    storage: { locationTrails: '40 TB/day', driverState: '1M rows, hot', tripRecords: '100M/year' },
    availability: '99.95% for matching; tracking may degrade to 5-s polling',
    latency: 'Match < 1 s; location fresh < 2 s; tracking P99 < 1 s',
    evaluationCriteria: [
      'Streaming location ingestion decoupled from matching decisions',
      'Spatially indexed driver state enabling radius queries',
      'WebSocket fan-out for live tracking without DB reads',
      'Idempotent trip assignment to prevent double-matching',
    ],
    expectedPatterns: ['event-streaming', 'geo-indexing', 'state-machine'],
    hints: [
      { id: 'h1', text: 'Do you really need every location point in the matching path?', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Two drivers picking the same rider must be impossible — think about where the atomic decision lives.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Tracking updates are reads for riders but writes for the platform.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Rider App', 0, 60),
          n('clients.mobile-client', 'Driver App', 0, 220),
          n('networking.load-balancer', 'Load Balancer', 220, 140),
          n('compute.container', 'WebSocket Gateways', 440, 140, { instances: 20, requestsPerSec: 200000 }),
          queue('messaging.kafka', 'Kafka (Locations)', 440, 40, ),
          n('compute.worker', 'Location Consumers', 660, 40, { instances: 30, requestsPerSec: 100000 }),
          cache('databases.redis-cache', 'Redis (Active Drivers)', 660, 160),
          srv('application-services.dispatch-service', 'Dispatch Service', 660, 280, { tripStateMachine: true, requestsPerSec: 20000 }),
          db('databases.postgresql', 'PostgreSQL (PostGIS Trips)', 860, 280, { replicas: 3, sharded: false }),
          db('databases.timescaledb', 'TimescaleDB (Location Trails)', 860, 60, { replicas: 2, writesPerSec: 8000000, sharded: true }),
          n('application-services.eta-service', 'ETA Service', 440, 300, { instances: 4, requestsPerSec: 5000 }),
        ], [
          e('n1', 'n3', { protocol: 'WebSocket', rps: 10000, p99: 50 }),
          e('n2', 'n3', { protocol: 'WebSocket', rps: 4000000, peakRps: 8000000, p99: 50 }),
          e('n3', 'n4', { protocol: 'Event', rps: 4000000, syncMode: 'async' }),
          e('n3', 'n5', { rps: 10000, circuitBreaker: true }),
          e('n4', 'n6', { protocol: 'Event', rps: 4000000, syncMode: 'async' }),
          e('n6', 'n7', { protocol: 'Streams', rps: 4000000, syncMode: 'async' }),
          e('n6', 'n10', { protocol: 'Streams', rps: 4000000, syncMode: 'async' }),
          e('n3', 'n9', { rps: 10000, circuitBreaker: true, retry: 2 }),
          e('n5', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 50000, p50: 1 }),
          e('n8', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 10000, p99: 50 }),
          e('n9', 'n3', { protocol: 'WebSocket', rps: 100000, syncMode: 'async', p99: 100 }),
          e('n7', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 100000, p50: 2 }),
        ]),
      ],
      notes: [
        'Driver locations: 4M/s into Kafka; consumers update Redis geosets; PostGIS holds authoritative trip geo rows.',
        'Matching proposes then commits atomically in Postgres; Redis stores active-driver geosets for radius scans.',
        'Live tracking served from a short-lived state cache; trails appended to TimescaleDB for replay.',
      ],
    },
  },
  {
    title: 'ReelStream Video Platform',
    description:
      'Design a video streaming service. Original content is uploaded once and must be encoded into multiple resolutions and delivered globally. Users expect instant start and adaptive bitrate during playback. New uploaded videos become watchable with minimal latency, and recommendations are a secondary but important feature.',
    difficulty: 'advanced',
    estimatedMinutes: 120,
    functionalRequirements: [
      {
        key: 'ingest_upload',
        label: 'Ingest raw uploads reliably',
        weight: 2,
        matches: [
          { kind: 'component', value: 'upload', label: 'Upload service', },
          { kind: 'category', value: 'storage', label: 'Object storage for originals', },
        ],
      },
      {
        key: 'encoding_pipeline',
        label: 'Transcode to adaptive-bitrate renditions',
        weight: 2,
        matches: [
          { kind: 'category', value: 'compute', label: 'Compute for encoding workers', },
          { kind: 'edgeBetweenCategories', sourceCategory: 'storage', targetCategory: 'compute', label: 'Encoders consume from object storage', },
        ],
      },
      {
        key: 'delivery_cdn',
        label: 'Serve video from a CDN with edge caching',
        weight: 2,
        matches: [
          { kind: 'component', value: 'cdn', label: 'CDN', },
          { kind: 'edgeToCategory', targetCategory: 'networking', label: 'Playback flows through networking', },
        ],
      },
      {
        key: 'manifest',
        label: 'Expose adaptive manifests (HLS/DASH)',
        matches: [
          { kind: 'propertyTrue', property: 'adaptiveBitrate', label: 'Adaptive bitrate configured' },
        ],
      },
      {
        key: 'recommendations',
        label: 'Personalized recommendations',
        matches: [
          { kind: 'component', value: 'recommendation', label: 'Recommendation service', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Startup latency', description: 'Playback starts in < 2 s on broadband.' },
      { name: 'Global delivery', description: 'Peak streams in multiple regions without regional saturation.' },
      { name: 'Bandwidth economics', description: 'Avoid a single origin becoming a bandwidth hotspot.' },
    ],
    traffic: { peakConcurrentStreams: '8M', uploadsPerHour: '500 h of new content', playbackRequests: '200K/s peak' },
    storage: { originalVideo: '2 PB growing', encodedRenditions: '~6x origin for 4K ladder', edgeCache: 'Top titles at edges' },
    availability: '99.99% for streaming; upload pipeline eventual',
    latency: 'First byte P95 < 2 s; encode-to-publish < 30 min',
    evaluationCriteria: [
      'Upload decoupled from encoding through queues and object storage',
      'Encoding pipeline with fan-out through object storage',
      'Multi-layer CDN delivery with origin protection',
      'Recommendations computed offline, not on the playback path',
    ],
    expectedPatterns: ['event-driven', 'cache-aside', 'write-behind'],
    hints: [
      { id: 'h1', text: 'Uploads and encodes are different scales — where\'s the buffering between them?', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Playback traffic should almost never reach the origin servers.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Recommendations are expensive; do they belong on the request path?', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Viewers', 0, 60),
          n('networking.cdn', 'CDN Edge (HLS/DASH)', 220, 60, { edgeCaching: true }),
          n('storage.object-storage', 'Object Storage (Renditions)', 420, 60),
          n('networking.load-balancer', 'Load Balancer', 0, 220),
          n('application-services.video-service', 'Video Service', 420, 220, { adaptiveBitrate: true, requestsPerSec: 20000 }),
          srv('application-services.upload-service', 'Upload Service', 420, 60),
          queue('messaging.kafka', 'Kafka (Encode Jobs)', 220, 340),
          n('compute.container', 'Encoder Fleet', 420, 340, { instances: 200, requestsPerSec: 50000 }),
          db('databases.postgresql', 'PostgreSQL (Catalogs)', 640, 220, { replicas: 3 }),
          db('databases.elasticsearch', 'Elasticsearch (Search)', 640, 320, { replicas: 2 }),
          n('compute.worker', 'Recommendation Workers', 640, 420, { instances: 10, requestsPerSec: 1000 }),
          db('databases.cassandra', 'Cassandra (View Events)', 840, 420, { replicas: 3, writesPerSec: 500000, sharded: true }),
        ], [
          e('n1', 'n2', { rps: 200000, peakRps: 200000, p99: 100 }),
          e('n2', 'n3', { protocol: 'S3', connectionType: 'HTTP', rps: 30000, p99: 200 }),
          e('n4', 'n5', { rps: 20000, circuitBreaker: true }),
          e('n5', 'n6', { protocol: 'Event', rps: 100, syncMode: 'async' }),
          e('n5', 'n3', { protocol: 'S3', connectionType: 'HTTP', rps: 20000 }),
          e('n5', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 20000, p99: 150 }),
          e('n6', 'n7', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n8', 'n3', { protocol: 'S3', connectionType: 'HTTP', rps: 100, syncMode: 'async' }),
          e('n8', 'n9', { protocol: 'Event', rps: 50, syncMode: 'async' }),
          e('n5', 'n10', { protocol: 'REST', rps: 1000 }),
          e('n11', 'n12', { protocol: 'Streams', rps: 500000, syncMode: 'async' }),
          e('n11', 'n5', { protocol: 'REST', rps: 2000 }),
        ]),
      ],
      notes: [
        'Uploads land in object storage; an encode job per rendition is queued to Kafka and picked up by the encoder fleet.',
        'Playback: CDN edges serve from cache; only misses hit origin object storage — catalog DNS points playback at edges.',
        'Recommendation model refreshes nightly from Cassandra view events; service picks precomputed lists.',
      ],
    },
  },
  {
    title: 'VaultSync Cloud File Sync',
    description:
      'Design a Dropbox-style file sync service. Files live in the cloud, sync across multiple devices per user, and changes propagate quickly between devices. Users upload and download large files, and the service must handle many concurrent edits. Versioning and cross-device consistency are core.',
    difficulty: 'advanced',
    estimatedMinutes: 120,
    functionalRequirements: [
      {
        key: 'upload_large',
        label: 'Upload large files reliably (chunked, resumable)',
        weight: 2,
        matches: [
          { kind: 'component', value: 'sync', label: 'Sync service', },
          { kind: 'propertyTrue', property: 'chunkedUpload', label: 'Chunked/resumable uploads', },
        ],
      },
      {
        key: 'object_store',
        label: 'Store file content in object storage',
        weight: 2,
        matches: [
          { kind: 'category', value: 'storage', label: 'Object storage', },
          { kind: 'edgeBetweenCategories', sourceCategory: 'application-services', targetCategory: 'storage', label: 'Services write to object storage', },
        ],
      },
      {
        key: 'metadata',
        label: 'Track file metadata and versions',
        matches: [
          { kind: 'category', value: 'databases', label: 'Metadata database', },
          { kind: 'propertyTrue', property: 'versioning', label: 'Versioning enabled', },
        ],
      },
      {
        key: 'propagation',
        label: 'Notify all devices of changes for quick sync',
        matches: [
          { kind: 'category', value: 'messaging', label: 'Change notification pipeline', },
          { kind: 'component', value: 'websocket', label: 'Push channel to clients', },
        ],
      },
      {
        key: 'dedup',
        label: 'Avoid re-uploading identical content',
        matches: [
          { kind: 'propertyTrue', property: 'deduplication', label: 'Content deduplication', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Propagation latency', description: 'A change on device A is visible on device B in < 2 s.' },
      { name: 'Consistency', description: 'Last-writer-wins per file with version history; no lost updates for the same content.' },
      { name: 'Bandwidth sensitivity', description: 'Do not download full files when only a chunk changed.' },
    ],
    traffic: { users: '500M', activeSyncConnections: '100M', fileUploads: '50M/day, ~5 MB avg', chunkWrites: '1B/day' },
    storage: { userData: '4 GB/user avg → 2 EB', chunkIndex: 'indexed by content hash', metadataRows: '50B file versions' },
    availability: '99.95% metadata; content availability relies on storage redundancy',
    latency: 'Propagation < 2 s; upload of 100 MB < 60 s on broadband',
    evaluationCriteria: [
      'Chunk-level sync, not whole-file transfer',
      'Content-addressed deduplication in object storage',
      'Versioned metadata separated from content',
      'Push notifications wake clients instead of polling',
    ],
    expectedPatterns: ['content-addressing', 'event-driven', 'write-behind'],
    hints: [
      { id: 'h1', text: 'A 4 GB file edited on a phone must not require re-uploading itself.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Who owns the ground truth: the device, or the cloud metadata?', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Two identical files from different users are the same content.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.desktop-client', 'Desktop Client', 0, 60),
          n('clients.mobile-client', 'Mobile Client', 0, 180),
          n('networking.load-balancer', 'Load Balancer', 220, 120),
          n('application-services.sync-service', 'Sync API', 440, 40, { chunkedUpload: true, deduplication: true, versioning: true, requestsPerSec: 100000 }),
          n('application-services.metadata-service', 'Metadata Service', 440, 200, { requestsPerSec: 100000 }),
          n('compute.container', 'WebSocket Gateways', 440, 340, { instances: 12, requestsPerSec: 200000 }),
          n('storage.object-storage', 'Object Storage (Chunks)', 660, 40),
          db('databases.postgresql', 'PostgreSQL (Metadata)', 660, 200, { replicas: 3, writesPerSec: 100000, sharded: true }),
          cache('databases.redis-cache', 'Redis (Chunk Index)', 660, 320),
          queue('messaging.kafka', 'Kafka (Change Events)', 440, 460),
          n('compute.worker', 'Notification Workers', 660, 460, { instances: 20, requestsPerSec: 100000 }),
        ], [
          e('n1', 'n3', { protocol: 'WebSocket', rps: 50000 }),
          e('n2', 'n3', { protocol: 'WebSocket', rps: 50000 }),
          e('n3', 'n4', { rps: 50000, peakRps: 200000, circuitBreaker: true }),
          e('n4', 'n7', { protocol: 'S3', connectionType: 'HTTP', rps: 50000, p99: 200 }),
          e('n4', 'n8', { protocol: 'REST', rps: 100000 }),
          e('n4', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 500000, p50: 1 }),
          e('n3', 'n5', { rps: 100000, peakRps: 300000, circuitBreaker: true }),
          e('n5', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 100000, p99: 150 }),
          e('n5', 'n6', { protocol: 'REST', rps: 100000, syncMode: 'async' }),
          e('n6', 'n10', { protocol: 'Event', rps: 100000, syncMode: 'async' }),
          e('n10', 'n11', { protocol: 'Event', rps: 100000, syncMode: 'async' }),
          e('n11', 'n6', { protocol: 'WebSocket', rps: 200000, syncMode: 'async', p99: 100 }),
        ]),
      ],
      notes: [
        'Files split into 4 MB chunks; uploads are chunk-addressed by SHA-256 so duplicates share storage.',
        'Metadata service owns the authoritative file tree with versioned rows; sync uses last-writer-wins per file.',
        'Blocking path is metadata-only; content moves async through object storage, improving perceived latency.',
      ],
    },
  },
  {
    title: 'CartWise E-commerce Checkout',
    description:
      'Design the checkout and order pipeline for an e-commerce platform: catalog browsing, cart, order placement, payment orchestration, inventory reservation, and order fulfillment status tracking. The system must survive flash sales where a single product gets 100K+ simultaneous buyers.',
    difficulty: 'intermediate',
    estimatedMinutes: 90,
    functionalRequirements: [
      {
        key: 'catalog',
        label: 'Browse catalog with product detail',
        matches: [
          { kind: 'component', value: 'catalog', label: 'Catalog service', },
          { kind: 'component', value: 'elasticsearch', label: 'Search index', },
        ],
      },
      {
        key: 'cart',
        label: 'Persistent per-user cart',
        matches: [
          { kind: 'component', value: 'cart', label: 'Cart service', },
        ],
      },
      {
        key: 'order_placement',
        label: 'Place orders atomically with inventory reservation',
        weight: 2,
        matches: [
          { kind: 'component', value: 'order', label: 'Order service', },
          { kind: 'edgeBetweenCategories', sourceCategory: 'application-services', targetCategory: 'databases', label: 'Orders persisted to a database', },
        ],
      },
      {
        key: 'payment',
        label: 'Orchestrate payment with idempotency',
        weight: 2,
        matches: [
          { kind: 'component', value: 'payment', label: 'Payment service', },
          { kind: 'propertyTrue', property: 'idempotency', label: 'Idempotent payment handling', },
        ],
      },
      {
        key: 'inventory',
        label: 'Prevent overselling under flash-sale load',
        weight: 2,
        matches: [
          { kind: 'component', value: 'inventory', label: 'Inventory service', },
          { kind: 'category', value: 'messaging', label: 'Queued order processing', },
        ],
      },
      {
        key: 'fulfillment_events',
        label: 'Track order status updates',
        matches: [
          { kind: 'component', value: 'fulfillment', label: 'Fulfillment service', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Atomicity', description: 'Order + payment + inventory reservation must be consistent.' },
      { name: 'Flash-sale resilience', description: '100K buyers on one SKU without overselling.' },
      { name: 'Observability', description: 'Every order traceable end-to-end for support.' },
    ],
    traffic: { peakOrders: '200K/s during flash sale', catalogReads: '2M/s', cartOperations: '500K/s' },
    storage: { orders: '300M/year', inventoryCounters: '50M SKUs, hot rows under contention', catalog: '500M products' },
    availability: '99.95%; checkout is the critical path, browsing can degrade',
    latency: 'Order placement P95 < 500 ms; payment async confirmation < 10 s',
    evaluationCriteria: [
      'Message-driven order pipeline inside the critical flow',
      'Idempotent payment to protect double-charges',
      'Inventory atomics handling hot SKU contention',
      'A single traceable order event stream',
    ],
    expectedPatterns: ['saga', 'idempotency', 'event-sourcing'],
    hints: [
      { id: 'h1', text: '100K buyers all writing the same inventory row is the trickiest problem here.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Payments can succeed while order processing fails — who reconciles?', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Users tolerate async order confirmation far more than a spinning checkout.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Web Shopper', 0, 60),
          n('clients.mobile-client', 'Mobile Shopper', 0, 200),
          n('networking.load-balancer', 'Load Balancer', 220, 130),
          srv('application-services.catalog-service', 'Catalog Service', 440, 40),
          srv('application-services.cart-service', 'Cart Service', 440, 130),
          srv('application-services.order-service', 'Order Service', 440, 220, { requestsPerSec: 50000 }),
          srv('application-services.payment-service', 'Payment Service', 660, 40, { idempotency: true, requestsPerSec: 20000 }),
          srv('application-services.inventory-service', 'Inventory Service', 660, 130, { requestsPerSec: 50000 }),
          srv('application-services.fulfillment-service', 'Fulfillment Service', 660, 220),
          db('databases.postgresql', 'PostgreSQL (Catalog)', 860, 40, { replicas: 3, readsPerSec: 2000000 }),
          cache('databases.redis-cache', 'Redis (Cart + Inventory)', 860, 130),
          db('databases.mongodb', 'MongoDB (Orders)', 860, 220, { replicas: 3, writesPerSec: 200000, sharded: true }),
          queue('messaging.kafka', 'Kafka (Order Events)', 440, 340),
          n('compute.worker', 'Order Workers', 660, 340, { instances: 50, requestsPerSec: 20000 }),
          db('databases.elasticsearch', 'Elasticsearch (Search)', 860, 340, { replicas: 3 }),
        ], [
          e('n1', 'n3', { rps: 2000000, peakRps: 2000000 }),
          e('n2', 'n3', { rps: 1000000, peakRps: 2000000 }),
          e('n3', 'n4', { rps: 100000, peakRps: 500000, circuitBreaker: true }),
          e('n3', 'n5', { rps: 500000, peakRps: 2000000, circuitBreaker: true }),
          e('n3', 'n6', { rps: 200000, peakRps: 500000, circuitBreaker: true, retry: 2 }),
          e('n5', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 1000000, p50: 1 }),
          e('n5', 'n13', { protocol: 'Cache', connectionType: 'Cache', rps: 1000000, p50: 2 }),
          e('n4', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 2000000, p99: 150 }),
          e('n6', 'n13', { protocol: 'Cache', connectionType: 'Cache', rps: 2000000, p50: 2 }),
          e('n6', 'n7', { rps: 20000, circuitBreaker: true, retry: 2, backoff: 'exponential' }),
          e('n7', 'n13', { protocol: 'Cache', connectionType: 'Cache', rps: 200000, p50: 1 }),
          e('n6', 'n12', { protocol: 'Event', rps: 200000, syncMode: 'async' }),
          e('n12', 'n14', { protocol: 'Event', rps: 200000, syncMode: 'async' }),
          e('n14', 'n11', { protocol: 'SQL', connectionType: 'DB', rps: 200000, syncMode: 'async', timeout: 30 }),
          e('n6', 'n11', { protocol: 'SQL', connectionType: 'DB', rps: 20000, p99: 150 }),
          e('n4', 'n15', { protocol: 'REST', rps: 100000 }),
          e('n8', 'n12', { protocol: 'Event', rps: 50000, syncMode: 'async' }),
        ]),
      ],
      notes: [
        'Inventory counters live in Redis with Lua-driven atomic decrement; oversell guarded by compare-and-swap.',
        'Order placement is a lightweight write to MongoDB; worker pipeline then handles payment, inventory, and fulfillment in a saga.',
        'Payment idempotency key = orderId + amount + currency; retries never double-charge.',
      ],
    },
  },
  {
    title: 'ChatLoop Real-time Messaging',
    description:
      'Design a WhatsApp-style messaging service: one-to-one and group chats, presence, message history, and push notifications. Messages must be reliably delivered in order, proof of delivery is nice, and read receipts complete the experience. Support 1B users.',
    difficulty: 'intermediate',
    estimatedMinutes: 90,
    functionalRequirements: [
      {
        key: 'websocket_gateway',
        label: 'Maintain persistent connections for real-time delivery',
        weight: 2,
        matches: [
          { kind: 'component', value: 'websocket', label: 'WebSocket gateway', },
          { kind: 'component', value: 'gateway', label: 'Connection gateway', },
        ],
      },
      {
        key: 'message_store',
        label: 'Persist message history durably',
        weight: 2,
        matches: [
          { kind: 'category', value: 'databases', label: 'Message store', },
          { kind: 'edgeToCategory', targetCategory: 'databases', label: 'Messages persist to a database', },
        ],
      },
      {
        key: 'ordering',
        label: 'Guarantee per-conversation message order',
        matches: [
          { kind: 'propertyTrue', property: 'sequencePerConversation', label: 'Per-conversation sequencing', },
        ],
      },
      {
        key: 'presence',
        label: 'Show online status',
        matches: [
          { kind: 'component', value: 'redis-cache', label: 'Presence store (Redis)', },
          { kind: 'property', property: 'presence', value: 'yes', label: 'Presence feature configured' },
        ],
      },
      {
        key: 'push',
        label: 'Deliver push notifications to offline users',
        matches: [
          { kind: 'component', value: 'push', label: 'Push notification service', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Ordering', description: 'Messages in a conversation must arrive in send order.' },
      { name: 'Delivery', description: 'At-least-once delivery with dedup; no silent drops.' },
      { name: 'Scale', description: '1B users, 100M CCU, 500 msg/s global peak at the gateways.' },
    ],
    traffic: { users: '1B', ccu: '100M concurrent', peakMessages: '500K/s', presenceUpdates: '2M/s' },
    storage: { messages: '10B/day → 3.6T/year', historyPerUser: 'Indexed, pruned after 90 days' },
    availability: '99.99% gateways; history read path AWOL degrades to 24-h cache',
    latency: 'Message round trip P99 < 300 ms online; push < 5 s',
    evaluationCriteria: [
      'Connection handling separated from message processing',
      'Per-conversation sequence numbers assigned centrally',
      'Presence aggregated with high fan-out in mind',
      'Offline delivery via push with history replay',
    ],
    expectedPatterns: ['event-driven', 'outbox', 'caching'],
    hints: [
      { id: 'h1', text: 'Two messages sent concurrently must not arrive in the wrong order.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Presence for a 100K-member group is a fan-out problem.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'The gateway tier can drop a connection; the message must survive it.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Clients', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 220, 100),
          n('compute.container', 'WebSocket Gateways', 440, 100, { instances: 200, requestsPerSec: 500000, sequencePerConversation: true, presence: 'yes' }),
          queue('messaging.kafka', 'Kafka (Messages)', 660, 100),
          n('compute.worker', 'Message Workers', 440, 260, { instances: 100, requestsPerSec: 500000 }),
          db('databases.cassandra', 'Cassandra (History)', 660, 260, { replicas: 3, writesPerSec: 1000000, sharded: true }),
          cache('databases.redis-cache', 'Redis (Presence)', 660, 40),
          n('application-services.push-service', 'Push Service', 660, 380, { instances: 5, requestsPerSec: 50000 }),
          n('networking.external', 'APNs / FCM', 860, 380),
          db('databases.postgresql', 'PostgreSQL (Users/Devices)', 860, 40, { replicas: 3 }),
        ], [
          e('n1', 'n2', { protocol: 'WebSocket', rps: 500000, peakRps: 500000, p99: 50 }),
          e('n2', 'n3', { protocol: 'WebSocket', rps: 500000, peakRps: 500000, p99: 50 }),
          e('n3', 'n7', { protocol: 'Cache', connectionType: 'Cache', rps: 2000000, p50: 1 }),
          e('n3', 'n4', { protocol: 'Event', rps: 500000, syncMode: 'async' }),
          e('n4', 'n6', { protocol: 'SQL', connectionType: 'DB', rps: 1000000, syncMode: 'async', timeout: 30 }),
          e('n3', 'n5', { protocol: 'REST', rps: 500000 }),
          e('n5', 'n6', { protocol: 'SQL', connectionType: 'DB', rps: 1000000, p99: 200 }),
          e('n3', 'n8', { protocol: 'Event', rps: 50000, syncMode: 'async' }),
          e('n8', 'n9', { rps: 50000, retry: 3, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 100000 }),
          e('n5', 'n3', { protocol: 'REST', rps: 500000, syncMode: 'async' }),
        ]),
      ],
      notes: [
        'Gateways own only the TCP/WebSocket connection; message ordering is assigned via Kafka partitioning by conversation id.',
        'History served from Cassandra range reads; Redis presence P99 < 2 ms with pub/sub fan-out.',
        'Offline users paid via push with a payload the client can hydrate from history on reconnect.',
      ],
    },
  },
  {
    title: 'LedgerLine Payment Ledger',
    description:
      'Design a multi-region payment ledger: deposits, withdrawals, transfers, and reconciliation with external payment rails. Money movement must be exactly-once, auditable, and survive region failures. Design idempotency, double-entry bookkeeping, and a settlement/clock for daily reconciliation.',
    difficulty: 'expert',
    estimatedMinutes: 150,
    functionalRequirements: [
      {
        key: 'double_entry',
        label: 'Double-entry bookkeeping for every movement',
        weight: 2,
        matches: [
          { kind: 'component', value: 'ledger', label: 'Ledger service', },
          { kind: 'propertyTrue', property: 'doubleEntry', label: 'Double-entry enabled', },
        ],
      },
      {
        key: 'exactly_once',
        label: 'Exactly-once money movement (no ghosts, no doubles)',
        weight: 2,
        matches: [
          { kind: 'propertyTrue', property: 'idempotency', label: 'Idempotency keys', },
          { kind: 'category', value: 'messaging', label: 'Transactional pipeline', },
        ],
      },
      {
        key: 'multi_region',
        label: 'Active-active across regions with conflict safety',
        weight: 2,
        matches: [
          { kind: 'propertyTrue', property: 'activeActive', label: 'Active-active architecture', },
          { kind: 'category', value: 'networking', label: 'Global routing layer', },
        ],
      },
      {
        key: 'reconciliation',
        label: 'Reconcile internal ledger vs external rails daily',
        matches: [
          { kind: 'component', value: 'reconciliation', label: 'Reconciliation workers', },
          { kind: 'category', value: 'messaging', label: 'Event stream for audit', },
        ],
      },
      {
        key: 'audit_trail',
        label: 'Immutable, queryable audit trail',
        matches: [
          { kind: 'propertyTrue', property: 'appendOnly', label: 'Append-only ledger', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Correctness', description: 'No double spend, no lost updates; violations are security incidents.' },
      { name: 'Auditability', description: 'Every entry attributable to a request, trace, and actor.' },
      { name: 'Regions', description: 'A region failure must not freeze movements in other regions.' },
    ],
    traffic: { movementsPerDay: '2B', peakTxnPerSec: '1M', reconciliationBatches: 'Daily, 5 min target' },
    storage: { ledgerRows: '~520B/year append-only', balanceSnapshots: 'per account per day', idempotencyKeys: '30-day retention' },
    availability: '99.995% ledger writes; reads may serve slightly stale snapshots',
    latency: 'Credit availability < 1 s; transfer settlement batch < 60 s',
    evaluationCriteria: [
      'Append-only ledger with double-entry invariants',
      'Idempotency enforced before any balance change',
      'Region-local writes with cross-region replication and conflict rules',
      'Batch reconciliation with drift handling',
    ],
    expectedPatterns: ['event-sourcing', 'outbox', 'idempotency', 'saga'],
    hints: [
      { id: 'h1', text: 'Double-entry is not optional for money: every movement creates two entries.', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Retries are guaranteed to happen. Your design must make retries free.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'Active-active writes to one balance behave like two writers on one row.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('networking.dns', 'Global DNS', 0, 40),
          n('networking.load-balancer', 'Regional LBs (x2)', 200, 40),
          n('application-services.ledger-service', 'Ledger Service (per region)', 420, 40, { doubleEntry: true, idempotency: true, activeActive: true, appendOnly: true, requestsPerSec: 500000 }),
          queue('messaging.kafka', 'Kafka (Ledger Events)', 420, 180),
          n('compute.worker', 'Reconciliation Workers', 0, 180, { instances: 10, requestsPerSec: 5000 }),
          n('networking.external', 'Payment Rails', 200, 180),
          db('databases.postgresql', 'PostgreSQL (Ledger DB per region)', 660, 40, { replicas: 5, consistency: 'strong', writesPerSec: 500000, sharded: true, conflictResolution: 'last-write-wins-per-account' }),
          n('storage.object-storage', 'Object Storage (Audit/Archives)', 880, 40),
          db('databases.elasticsearch', 'Elasticsearch (Audit Query)', 880, 180, { replicas: 2 }),
          cache('databases.redis-cache', 'Redis (Idempotency Keys)', 660, 180),
          n('observability.metrics', 'Drift Alerts', 660, 300, { metrics: true }),
        ], [
          e('n1', 'n2', { rps: 1000000, peakRps: 1000000, p99: 100 }),
          e('n2', 'n3', { rps: 1000000, peakRps: 1000000, circuitBreaker: true, retry: 2 }),
          e('n3', 'n7', { protocol: 'SQL', connectionType: 'DB', rps: 500000, p99: 150 }),
          e('n3', 'n10', { protocol: 'Cache', connectionType: 'Cache', rps: 1000000, p50: 1 }),
          e('n3', 'n4', { protocol: 'Event', rps: 1000000, syncMode: 'async' }),
          e('n4', 'n5', { protocol: 'REST', rps: 10000, syncMode: 'async' }),
          e('n4', 'n8', { protocol: 'S3', connectionType: 'HTTP', rps: 1000, syncMode: 'async' }),
          e('n5', 'n6', { rps: 10000, retry: 3, backoff: 'exponential', timeout: 10 }),
          e('n6', 'n5', { rps: 10000, syncMode: 'async' }),
          e('n4', 'n9', { protocol: 'REST', rps: 10000, syncMode: 'async' }),
          e('n8', 'n9', { protocol: 'REST', rps: 1000, syncMode: 'async' }),
          e('n3', 'n11', { protocol: 'Streams', rps: 1000, syncMode: 'async' }),
        ]),
      ],
      notes: [
        'Each region owns its ledger shards; cross-region movements use staging entries settled at reconciliation.',
        'Idempotency key checked in Redis before every balance write; ledger inserts use unique (key, account, seq).',
        'Daily reconciliation compares ledger vs rail settlement files; drift alerts page before money is marked settled.',
      ],
    },
  },
  {
    title: 'InsightPulse Log Analytics',
    description:
      'Design a multi-tenant log and event analytics platform (Splunk/Datadog-style). Clients send structured logs and custom metrics; analysts query across billions of events with sub-second responses on dashboards and ad-hoc queries. Ingestion bursts are spiky during incident hours.',
    difficulty: 'expert',
    estimatedMinutes: 150,
    functionalRequirements: [
      {
        key: 'ingestion',
        label: 'Ingest high-volume spiky log streams',
        weight: 2,
        matches: [
          { kind: 'category', value: 'messaging', label: 'Buffering queue for ingestion', },
          { kind: 'component', value: 'agent', label: 'Ingestion gateway/agent', },
        ],
      },
      {
        key: 'storage_parquet',
        label: 'Store raw events durably in columnar files',
        weight: 2,
        matches: [
          { kind: 'category', value: 'storage', label: 'Object storage for raw events', },
          { kind: 'propertyTrue', property: 'columnarFormat', label: 'Columnar storage format', },
        ],
      },
      {
        key: 'query',
        label: 'Full-text and structured search over events',
        weight: 2,
        matches: [
          { kind: 'component', value: 'elasticsearch', label: 'Search index', },
          { kind: 'component', value: 'presto', label: 'Query engine over files', },
        ],
      },
      {
        key: 'streaming_analytics',
        label: 'Compute live dashboards and alerts on streaming data',
        matches: [
          { kind: 'component', value: 'worker', label: 'Stream processing workers', },
          { kind: 'propertyTrue', property: 'realtime', label: 'Real-time processing enabled', },
        ],
      },
      {
        key: 'multi_tenant',
        label: 'Isolate tenants and enforce quotas',
        matches: [
          { kind: 'component', value: 'auth', label: 'Auth/gateway tier', },
          { kind: 'propertyTrue', property: 'tenantIsolation', label: 'Tenant isolation configured', },
        ],
      },
    ],
    nonFunctionalRequirements: [
      { name: 'Burst tolerance', description: 'Absorb 10x ingestion spikes during incidents without dropping data.' },
      { name: 'Query speed', description: 'Dashboard queries < 1 s over 30 days of data; ad-hoc < 30 s.' },
      { name: 'Cost', description: 'Hot storage for 7 days, warm 90, cold archive — tier the data.' },
    ],
    traffic: { peakIngest: '5M events/s', tenants: '50K', concurrentQueries: '10K' },
    storage: { events: '200B/day raw', indexFactor: '~35% of raw volume after inverted index', archive: '1 year cold' },
    availability: '99.95%; late data acceptable, lost data is not',
    latency: 'Ingest-to-searchable < 1 min; dashboard refresh 5 s',
    evaluationCriteria: [
      'Spiky ingestion decoupled from querying via queues and file staging',
      'Columnar cold store + search index hot path',
      'Streaming analytics feeding dashboards without re-querying',
      'Tenant quotas enforced at ingest and query',
    ],
    expectedPatterns: ['lambda-architecture', 'write-ahead-log', 'cache-aside'],
    hints: [
      { id: 'h1', text: 'Indexing every event is expensive — what actually needs the inverted index?', strength: 'subtle', penalty: 1 },
      { id: 'h2', text: 'Dashboards should not re-scan 30 days of data every 5 seconds.', strength: 'moderate', penalty: 2 },
      { id: 'h3', text: 'A 10x burst must be absorbed by buffering, not by scaling queries.', strength: 'strong', penalty: 3 },
    ],
    referenceArchitecture: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Customer Apps', 0, 60),
          n('compute.container', 'Ingest Agents', 0, 220, { instances: 500, requestsPerSec: 5000000, tenantIsolation: true, columnarFormat: true, realtime: true }),
          n('application-services.auth-service', 'Auth / Tenancy Gateway', 220, 220, { requestsPerSec: 100000 }),
          queue('messaging.kafka', 'Kafka (Raw Events)', 440, 100),
          n('compute.worker', 'Indexers + Aggregators', 440, 260, { instances: 200, requestsPerSec: 5000000 }),
          n('storage.object-storage', 'Columnar Store (Parquet)', 660, 100),
          db('databases.elasticsearch', 'Elasticsearch (Hot Index)', 660, 260, { replicas: 3, readsPerSec: 100000 }),
          n('compute.container', 'Presto Query Engine', 660, 380, { instances: 50, requestsPerSec: 10000 }),
          cache('databases.redis-cache', 'Redis (Dashboard Cache)', 440, 380),
          srv('application-services.query-service', 'Query API', 220, 380, { requestsPerSec: 10000 }),
          n('networking.load-balancer', 'Query LB', 0, 380),
        ], [
          e('n1', 'n2', { rps: 5000000, peakRps: 50000000, p99: 200 }),
          e('n2', 'n3', { rps: 5000000, peakRps: 50000000, circuitBreaker: true }),
          e('n3', 'n4', { protocol: 'Event', rps: 5000000, peakRps: 50000000, syncMode: 'async' }),
          e('n4', 'n5', { protocol: 'Event', rps: 5000000, peakRps: 50000000, syncMode: 'async' }),
          e('n5', 'n6', { protocol: 'S3', connectionType: 'HTTP', rps: 100000, syncMode: 'async', timeout: 30 }),
          e('n5', 'n7', { protocol: 'REST', rps: 100000, syncMode: 'async' }),
          e('n5', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 200000, p50: 1 }),
          e('n7', 'n8', { rps: 10000, circuitBreaker: true }),
          e('n6', 'n8', { protocol: 'S3', connectionType: 'HTTP', rps: 10000, p99: 500 }),
          e('n11', 'n10', { rps: 10000, peakRps: 20000, circuitBreaker: true }),
          e('n10', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 200000, p50: 1 }),
          e('n10', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 10000, p99: 300 }),
          e('n10', 'n7', { rps: 1000 }),
        ]),
      ],
      notes: [
        'Ingest agents pre-batch into Kafka; indexers write Parquet to object storage and inverted index entries only for searchable fields.',
        'Lambda-style: streaming path feeds live dashboards from Redis aggregates; batch path rebuilds from Parquet.',
        'Presto queries cold Parquet; hot queries hit Elasticsearch or cached dashboard aggregates.',
      ],
    },
  },
];

/**
 * Node/edge ids are authored relative to each problem (n1..nN, e1..eN) while
 * the helpers assign module-global ids. Re-number node/edge ids sequentially
 * per problem in appearance order so the author-written edge references
 * (n1..nN) resolve to nodes within the problem's reference graph.
 */
const normalizeProblemIds = (items) => {
  let issues = 0;
  for (const item of items) {
    if (!item.referenceArchitecture?.pages) continue;
    let n = 0;
    let en = 0;
    const ids = new Set();
    for (const p of item.referenceArchitecture.pages) {
      for (const node of p.nodes || []) {
        node.id = `n${++n}`;
        ids.add(node.id);
      }
      for (const edge of p.edges || []) {
        edge.id = `e${++en}`;
        if (!ids.has(edge.source) || !ids.has(edge.target)) {
          issues += 1;
          console.error(`Seed practice problem "${item.title}": edge ${edge.id} references unknown node ${edge.source}/${edge.target}.`);
        }
      }
    }
  }
  return issues;
};

export const seedSystemDesignPractice = async () => {
  try {
    const issues = normalizeProblemIds(problems);
    // Always refresh built-in practice problems: they are immutable reference
    // material and this keeps reference graphs consistent across versions.
    await SystemDesignPractice.deleteMany({ isBuiltIn: true });
    await SystemDesignPractice.insertMany(problems);
    console.log(`Seeded ${problems.length} system design practice problems successfully.`);
    if (issues > 0) console.warn(`${issues} practice edge issues were detected and reported above.`);
  } catch (error) {
    console.error('Error seeding system design practice problems:', error.message);
  }
};