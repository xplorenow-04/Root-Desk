import SystemDesignTemplate from '../models/SystemDesignTemplate.js';

/**
 * Seed starter templates for the System Design Studio (SystemDesignTemplate).
 * Each template is a semantic architecture snapshot that users can instantiate
 * and then edit freely. Templates are decoupled from designs after creation.
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

const srv = (type, name, x, y) =>
  n(type, name, x, y, { instances: 2, cpu: 2, memory: 4, requestsPerSec: 2000, avgLatency: 50, p95Latency: 100, p99Latency: 200, autoScaling: true });

const db = (name, x, y, typeOrExtra = 'databases.postgresql', extra = {}) => {
  let type = typeOrExtra;
  if (typeOrExtra && typeof typeOrExtra === 'object') {
    extra = typeOrExtra;
    type = 'databases.postgresql';
  }
  return n(type, name, x, y, {
    version: 'current',
    environment: 'production',
    mode: 'primary',
    replicas: 1,
    readsPerSec: 10000,
    writesPerSec: 5000,
    storageGB: 100,
    replication: 'streaming',
    backup: true,
    failover: true,
    multiAZ: true,
    consistency: 'strong',
    ...extra,
  });
};

const cache = (name, x, y) =>
  n('databases.redis', name, x, y, {
    mode: 'cluster',
    nodes: 3,
    replicas: 1,
    requestsPerSec: 100000,
    memoryGB: 32,
    hitRatio: 90,
    persistence: 'RDB',
    eviction: 'LRU',
    multiAZ: true,
    replication: true,
    failover: true,
  });

const queue = (name, x, y, type = 'messaging.kafka') =>
  n(type, name, x, y, { throughput: 200000, partitions: 12, replicas: 3, deadLetterQueue: true });

const templates = [
  {
    name: 'Basic CRUD Application',
    description: 'A simple REST CRUD service with one database — the foundation for most system designs.',
    category: 'crud',
    icon: 'Database',
    color: '#6366f1',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Web Client', 0, 160),
          n('compute.server', 'API Server', 260, 160, { instances: 1, cpu: 2, memory: 4, requestsPerSec: 500, avgLatency: 50, p95Latency: 100, p99Latency: 200, autoScaling: false }),
          db('PostgreSQL', 520, 160, 'databases.postgresql', { replicas: 0, mode: 'primary', backup: false, failover: false, multiAZ: false, replication: 'none' }),
        ], [
          e('n1', 'n2', { rps: 500, peakRps: 1500 }),
          e('n2', 'n3', { protocol: 'SQL', connectionType: 'DB', rps: 500, peakRps: 1500, p99: 200 }),
        ]),
      ],
      requirements: [
        { id: 'r1', text: 'Create, read, update and delete resources', category: 'functional' },
        { id: 'r2', text: 'Single datastore with strong consistency', category: 'non-functional' },
      ],
      assumptions: [
        { id: 'a1', text: 'Low-to-moderate traffic (hundreds of RPS)' },
        { id: 'a2', text: 'Relational data model is appropriate' },
      ],
    },
    metadata: { difficulty: 'beginner', popularity: 95, tags: ['crud', 'rest', 'database'] },
  },
  {
    name: 'REST API Backend',
    description: 'Stateless REST API with an API gateway, cache, rate limiting and structured logging.',
    category: 'rest-api',
    icon: 'Braces',
    color: '#0ea5e9',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.api-consumer', 'API Consumers', 0, 180),
          n('networking.api-gateway', 'API Gateway', 240, 120, { rateLimiting: true, tls: true, auth: true }),
          n('compute.server', 'API Service', 240, 280, { instances: 2, requestsPerSec: 1000, p99Latency: 120, autoScaling: true }),
          cache('Redis Cache', 480, 280),
          db('PostgreSQL', 480, 80),
          n('observability.logging', 'Structured Logging', 720, 180),
        ], [
          e('n1', 'n2', { rps: 1000, peakRps: 4000 }),
          e('n2', 'n3', { circuitBreaker: true, retry: 2, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n4', { protocol: 'Cache', connectionType: 'Cache', rps: 5000, p50: 1, p95: 5, p99: 10 }),
          e('n3', 'n5', { protocol: 'SQL', connectionType: 'DB', rps: 300, p99: 200, timeout: 15 }),
          e('n5', 'n6', { protocol: 'UDP', connectionType: 'Log', rps: 100, syncMode: 'async' }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Identity provider handles authentication; gateway handles rate limiting' }],
    },
    metadata: { difficulty: 'beginner', popularity: 90, tags: ['rest', 'gateway', 'cache'] },
  },
  {
    name: 'E-commerce Platform',
    description: 'Storefront with catalog, cart, orders, payments and search services behind an API gateway.',
    category: 'ecommerce',
    icon: 'ShoppingCart',
    color: '#f59e0b',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Web Storefront', 0, 100),
          n('clients.mobile-client', 'Mobile App', 0, 220),
          n('networking.cdn', 'CDN', 200, 160),
          n('networking.api-gateway', 'API Gateway', 380, 160, { rateLimiting: true }),
          srv('application-services.user-service', 'User Service', 580, 40),
          srv('application-services.product-service', 'Product Service', 580, 160),
          srv('application-services.order-service', 'Order Service', 580, 280),
          srv('application-services.payment-service', 'Payment Service', 580, 400),
          cache('Redis Cache', 820, 160),
          db('PostgreSQL (Orders)', 820, 320),
          db('MongoDB (Catalog)', 820, 40, { consistency: 'eventual' }),
        ], [
          e('n1', 'n3', { protocol: 'HTTPS', rps: 3000, p99: 100 }),
          e('n2', 'n3', { protocol: 'HTTPS', rps: 1000, p99: 100 }),
          e('n3', 'n4', { rps: 4000, circuitBreaker: true, retry: 2, backoff: 'exponential' }),
          e('n4', 'n5', { rps: 600, timeout: 10 }),
          e('n4', 'n6', { rps: 3000, timeout: 10 }),
          e('n4', 'n7', { rps: 1500, timeout: 10 }),
          e('n4', 'n8', { rps: 300, timeout: 10, syncMode: 'async' }),
          e('n6', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 20000, p50: 1 }),
          e('n6', 'n10', { protocol: 'MongoDB', connectionType: 'DB', rps: 2000, p99: 150 }),
          e('n7', 'n11', { protocol: 'SQL', connectionType: 'DB', rps: 800, p99: 200 }),
          e('n7', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 4000, p50: 1 }),
        ]),
      ],
      requirements: [
        { id: 'r1', text: 'Browse catalog and search products', category: 'functional' },
        { id: 'r2', text: 'Place orders with transactional integrity', category: 'functional' },
        { id: 'r3', text: 'Process payments securely', category: 'functional' },
      ],
      assumptions: [{ id: 'a1', text: 'Catalog is read-heavy; orders need strong consistency' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 93, tags: ['ecommerce', 'gateway', 'microservices'] },
  },
  {
    name: 'Chat Application',
    description: 'Real-time messaging with presence, message history, and delivery guarantees.',
    category: 'chat',
    icon: 'MessageSquare',
    color: '#8b5cf6',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Mobile Chat Client', 0, 120),
          n('clients.web-client', 'Web Chat Client', 0, 240),
          n('networking.load-balancer', 'Load Balancer', 220, 180),
          srv('application-services.chat-service', 'Chat API Service', 440, 60),
          n('compute.container', 'WebSocket Gateway', 440, 180, { instances: 4, requestsPerSec: 20000, protocol: 'WebSocket', p99Latency: 50 }),
          queue('Kafka (Delivery Events)', 660, 40),
          n('messaging.redis-streams', 'Redis Streams', 660, 200, { throughput: 100000, nodes: 3, replicas: 1, deadLetterQueue: true }),
          db('MongoDB (Messages)', 660, 340, { consistency: 'eventual' }),
          cache('Redis (Presence)', 660, 460),
        ], [
          e('n1', 'n3', { protocol: 'WebSocket', rps: 5000, p99: 50 }),
          e('n2', 'n3', { protocol: 'WebSocket', rps: 5000, p99: 50 }),
          e('n3', 'n4', { circuitBreaker: true, retry: 2, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n5', { protocol: 'WebSocket', rps: 20000, syncMode: 'async' }),
          e('n5', 'n6', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n5', 'n7', { protocol: 'Streams', rps: 20000, syncMode: 'async' }),
          e('n4', 'n8', { protocol: 'MongoDB', connectionType: 'DB', rps: 3000, p99: 150, timeout: 15 }),
          e('n4', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 10000, p50: 1, p95: 3 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Message history is eventually consistent' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 89, tags: ['chat', 'websocket', 'streams'] },
  },
  {
    name: 'URL Shortener',
    description: 'Classic system design problem: shorten, redirect, and analyze links at scale.',
    category: 'url-shortener',
    icon: 'Link',
    color: '#10b981',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Users', 0, 160),
          n('networking.load-balancer', 'Load Balancer', 200, 160),
          srv('application-services.url-service', 'URL Service', 400, 160),
          cache('Redis Cache', 620, 60),
          db('PostgreSQL (URLs)', 620, 240, { readsPerSec: 50000, writesPerSec: 10000, sharded: true }),
          queue('Kafka (Analytics)', 400, 320),
          n('application-services.analytics-service', 'Analytics Worker', 620, 380, { instances: 3, requestsPerSec: 20000 }),
        ], [
          e('n1', 'n2', { rps: 20000, peakRps: 60000, p99: 80 }),
          e('n2', 'n3', { rps: 20000, peakRps: 60000, circuitBreaker: true, retry: 2, backoff: 'exponential' }),
          e('n3', 'n4', { protocol: 'Cache', connectionType: 'Cache', rps: 100000, p50: 1 }),
          e('n3', 'n5', { protocol: 'SQL', connectionType: 'DB', rps: 1000, p99: 150, timeout: 15 }),
          e('n3', 'n6', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n6', 'n7', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
        ]),
      ],
      requirements: [
        { id: 'r1', text: 'Create a short URL from a long one', category: 'functional' },
        { id: 'r2', text: 'Redirect short URLs at high read rates', category: 'functional' },
        { id: 'r3', text: 'Track click analytics asynchronously', category: 'functional' },
      ],
      assumptions: [
        { id: 'a1', text: 'Read-heavy workload (100:1 read/write ratio)' },
        { id: 'a2', text: 'Short codes must be unique and collision-free' },
      ],
    },
    metadata: { difficulty: 'beginner', popularity: 96, tags: ['url-shortener', 'cache', 'read-heavy'] },
  },
  {
    name: 'Social Media Platform',
    description: 'Feed generation, follows, likes, and notifications for a social network.',
    category: 'social-media',
    icon: 'Users',
    color: '#ef4444',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Mobile App', 0, 100),
          n('clients.web-client', 'Web App', 0, 220),
          n('networking.api-gateway', 'API Gateway', 220, 160, { rateLimiting: true }),
          srv('application-services.user-service', 'User Service', 440, 40),
          srv('application-services.feed-service', 'Feed Service', 440, 160),
          srv('application-services.social-service', 'Social Graph Service', 440, 280),
          queue('Kafka (Events)', 660, 40),
          n('compute.background-worker', 'Feed Fanout Worker', 660, 160, { instances: 4, requestsPerSec: 100000 }),
          cache('Redis (Feed Cache)', 660, 280),
          db('MySQL (Users)', 860, 40, { sharded: true }),
          n('databases.cassandra', 'Cassandra (Graph/Writes)', 860, 200, { replicas: 3, writesPerSec: 200000, sharded: true, consistency: 'eventual' }),
        ], [
          e('n1', 'n3', { rps: 10000, peakRps: 40000 }),
          e('n2', 'n3', { rps: 5000, peakRps: 20000 }),
          e('n3', 'n4', { rps: 2000, circuitBreaker: true }),
          e('n3', 'n5', { rps: 8000, circuitBreaker: true }),
          e('n3', 'n6', { rps: 4000, circuitBreaker: true }),
          e('n6', 'n7', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'Event', rps: 20000, syncMode: 'async' }),
          e('n8', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 50000, p50: 1 }),
          e('n5', 'n9', { protocol: 'Cache', connectionType: 'Cache', rps: 20000, p50: 1 }),
          e('n4', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 1500, p99: 150 }),
          e('n6', 'n11', { protocol: 'Cassandra', connectionType: 'DB', rps: 50000, p99: 100 }),
        ]),
      ],
      assumptions: [
        { id: 'a1', text: 'Feed reads dominate; fanout uses push for actives and pull for inactives' },
        { id: 'a2', text: 'Graph writes are write-optimized (Cassandra)' },
      ],
    },
    metadata: { difficulty: 'advanced', popularity: 87, tags: ['social', 'feed', 'fanout'] },
  },
  {
    name: 'Video Streaming Platform',
    description: 'Video upload, transcoding pipelines, CDN delivery, and playback analytics.',
    category: 'video-streaming',
    icon: 'Play',
    color: '#dc2626',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Viewers (Web)', 0, 60),
          n('clients.mobile-client', 'Viewers (Mobile)', 0, 180),
          n('networking.cdn', 'CDN (Video Edge)', 220, 120, {}),
          n('networking.load-balancer', 'Load Balancer', 220, 260),
          srv('application-services.media-service', 'Media Service', 440, 120),
          n('application-services.video-service', 'Video Upload & Metadata', 440, 260, { instances: 2, requestsPerSec: 2000 }),
          queue('Kafka (Transcode Jobs)', 660, 40),
          n('compute.worker', 'Transcode Workers', 660, 200, { instances: 20, requestsPerSec: 1000 }),
          n('storage.object-storage', 'Object Storage (Raw)', 860, 40, { capacityTB: 100, throughput: 10000 }),
          n('storage.object-storage', 'Object Storage (HLS)', 860, 200, { capacityTB: 500 }),
          db('PostgreSQL (Metadata)', 660, 360),
        ], [
          e('n1', 'n3', { protocol: 'HTTPS', rps: 30000, p99: 200, payload: 1024 }),
          e('n2', 'n4', { protocol: 'REST', rps: 20000, p99: 150 }),
          e('n3', 'n5', { protocol: 'REST', rps: 30000, p99: 100 }),
          e('n4', 'n5', { protocol: 'REST', rps: 20000, p99: 100 }),
          e('n5', 'n6', { protocol: 'REST', rps: 20000, p99: 150 }),
          e('n6', 'n7', { protocol: 'Event', rps: 500, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'Event', rps: 500, syncMode: 'async' }),
          e('n6', 'n9', { protocol: 'S3', connectionType: 'HTTP', rps: 500, p99: 300, payload: 51200 }),
          e('n8', 'n10', { protocol: 'S3', connectionType: 'HTTP', rps: 2000, p99: 300, payload: 10240 }),
          e('n5', 'n11', { protocol: 'SQL', connectionType: 'DB', rps: 5000, p99: 150 }),
        ]),
      ],
      assumptions: [
        { id: 'a1', text: 'Read-heavy at CDN edge; origin hit ratio kept low' },
        { id: 'a2', text: 'Transcoding is CPU-heavy and fully asynchronous' },
      ],
    },
    metadata: { difficulty: 'advanced', popularity: 85, tags: ['video', 'cdn', 'transcoding'] },
  },
  {
    name: 'Ride Sharing Platform',
    description: 'Rider/driver matching, real-time location, pricing, and trip flows.',
    category: 'ride-sharing',
    icon: 'MapPin',
    color: '#22c55e',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Rider App', 0, 80),
          n('clients.mobile-client', 'Driver App', 0, 220),
          n('networking.load-balancer', 'Load Balancer', 220, 150),
          srv('application-services.ride-service', 'Ride Service', 440, 40),
          srv('application-services.matcher-service', 'Matching Service', 440, 160),
          srv('application-services.pricing-service', 'Pricing Service', 440, 280),
          n('messaging.redis-streams', 'Redis Streams (Location)', 660, 160, { throughput: 500000, nodes: 5, replicas: 2 }),
          n('databases.redis', 'Redis (Session/Geo)', 660, 60, { mode: 'cluster', nodes: 3, replicas: 1, memoryGB: 64 }),
          queue('Kafka (Trips)', 660, 320),
          db('PostgreSQL (Trips)', 860, 320, { replicas: 3 }),
          n('databases.mongodb', 'MongoDB (Trip History)', 860, 40, { readsPerSec: 20000, writesPerSec: 20000, consistency: 'eventual' }),
        ], [
          e('n1', 'n3', { protocol: 'WebSocket', rps: 10000, p99: 50 }),
          e('n2', 'n3', { protocol: 'WebSocket', rps: 10000, p99: 50 }),
          e('n3', 'n4', { rps: 5000, circuitBreaker: true }),
          e('n3', 'n5', { rps: 20000, circuitBreaker: true }),
          e('n3', 'n6', { rps: 3000, circuitBreaker: true }),
          e('n5', 'n7', { protocol: 'Streams', rps: 200000, syncMode: 'async' }),
          e('n5', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 100000, p50: 1 }),
          e('n4', 'n9', { protocol: 'Event', rps: 5000, syncMode: 'async' }),
          e('n4', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 2000, p99: 150 }),
          e('n6', 'n9', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n4', 'n11', { protocol: 'MongoDB', connectionType: 'DB', rps: 3000, p99: 120 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Location updates are high-volume and eventually consistent' }],
    },
    metadata: { difficulty: 'advanced', popularity: 84, tags: ['ride-sharing', 'geo', 'websocket'] },
  },
  {
    name: 'Food Delivery Platform',
    description: 'Restaurant ordering, live tracking, dispatch, and notifications.',
    category: 'food-delivery',
    icon: 'UtensilsCrossed',
    color: '#f97316',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.mobile-client', 'Customer App', 0, 60),
          n('clients.web-client', 'Restaurant Dashboard', 0, 180),
          n('clients.mobile-client', 'Delivery Driver App', 0, 300),
          n('networking.load-balancer', 'Load Balancer', 220, 180),
          srv('application-services.order-service', 'Order Service', 440, 180),
          srv('application-services.restaurant-service', 'Restaurant Service', 440, 60),
          srv('application-services.dispatch-service', 'Dispatch Service', 440, 300),
          n('application-services.notification-service', 'Notification Service', 660, 180, { instances: 3, requestsPerSec: 3000 }),
          queue('Kafka (Order Events)', 660, 60),
          db('PostgreSQL (Orders)', 860, 180, { replicas: 2 }),
        ], [
          e('n1', 'n4', { rps: 3000, peakRps: 15000 }),
          e('n2', 'n4', { rps: 500, peakRps: 2000 }),
          e('n3', 'n4', { protocol: 'WebSocket', rps: 2000, peakRps: 10000 }),
          e('n4', 'n5', { rps: 3000, circuitBreaker: true }),
          e('n5', 'n6', { rps: 800, circuitBreaker: true }),
          e('n5', 'n7', { rps: 2000, circuitBreaker: true }),
          e('n6', 'n8', { protocol: 'Event', rps: 3000, syncMode: 'async' }),
          e('n7', 'n8', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n5', 'n9', { protocol: 'Event', rps: 3000, syncMode: 'async' }),
          e('n8', 'n9', { protocol: 'REST', rps: 3000, retry: 3, backoff: 'exponential' }),
          e('n5', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 1500, p99: 150 }),
          e('n7', 'n10', { protocol: 'SQL', connectionType: 'DB', rps: 800, p99: 150 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Order state machine must tolerate partial failures' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 86, tags: ['food-delivery', 'orders', 'dispatch'] },
  },
  {
    name: 'Notification System',
    description: 'Multi-channel notifications (push, email, SMS) with templates and retries.',
    category: 'notification',
    icon: 'Bell',
    color: '#f59e0b',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('application-services.notification-service', 'Notification API', 0, 100, { instances: 2, requestsPerSec: 10000 }),
          queue('Kafka (Notifications)', 200, 40),
          n('compute.worker', 'Channel Workers', 200, 200, { instances: 6, requestsPerSec: 20000 }),
          n('networking.external', 'APNs / FCM', 420, 40),
          n('networking.external', 'Email Provider', 420, 140),
          n('networking.external', 'SMS Gateway', 420, 240),
          n('storage.object-storage', 'Template Store', 420, 340),
          db('PostgreSQL (Delivery Logs)', 200, 340, { writesPerSec: 10000 }),
          n('messaging.dead-letter-queue', 'DLQ', 620, 200, { deadLetterQueue: true }),
        ], [
          e('n1', 'n2', { protocol: 'Event', rps: 10000, syncMode: 'async' }),
          e('n2', 'n3', { protocol: 'Event', rps: 10000, syncMode: 'async' }),
          e('n3', 'n4', { rps: 5000, retry: 3, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n5', { rps: 2000, retry: 3, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n6', { rps: 1000, retry: 3, backoff: 'exponential', timeout: 10 }),
          e('n3', 'n7', { protocol: 'S3', connectionType: 'HTTP', rps: 50 }),
          e('n3', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 10000, syncMode: 'async' }),
          e('n2', 'n9', { protocol: 'Event', rps: 200, syncMode: 'async' }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Notifications are eventually consistent; delivery is retried' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 88, tags: ['notification', 'workers', 'retries'] },
  },
  {
    name: 'Payment System',
    description: 'Payments with idempotency, provider routing, settlement, and reconciliation.',
    category: 'payment',
    icon: 'CreditCard',
    color: '#10b981',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Checkout', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 200, 100),
          srv('application-services.payment-service', 'Payment Service', 420, 60),
          srv('application-services.wallet-service', 'Wallet Service', 420, 220),
          n('storage.object-storage', 'Payment Events', 620, 40, {}),
          queue('Kafka (Payment Events)', 620, 200),
          n('compute.worker', 'Settlement Workers', 620, 340, { instances: 4, requestsPerSec: 5000 }),
          db('PostgreSQL (Ledger)', 820, 120, { replicas: 3, consistency: 'strong', writesPerSec: 5000 }),
          n('storage.object-storage', 'Reconciliation Store', 820, 320),
        ], [
          e('n1', 'n2', { rps: 2000, peakRps: 10000 }),
          e('n2', 'n3', { rps: 2000, peakRps: 10000, circuitBreaker: true, retry: 2, backoff: 'exponential' }),
          e('n3', 'n4', { rps: 1500, circuitBreaker: true, timeout: 15 }),
          e('n3', 'n5', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n3', 'n6', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n6', 'n7', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n4', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 1500, p99: 100 }),
          e('n7', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 1000, p99: 100 }),
          e('n7', 'n9', { protocol: 'S3', connectionType: 'HTTP', rps: 100, syncMode: 'async' }),
        ]),
      ],
      requirements: [
        { id: 'r1', text: 'Process payments idempotently', category: 'functional' },
        { id: 'r2', text: 'Keep a write-ahead ledger', category: 'functional' },
        { id: 'r3', text: 'Reconcile with providers daily', category: 'functional' },
      ],
      assumptions: [{ id: 'a1', text: 'Money movements require strong consistency; the rest is eventual' }],
    },
    metadata: { difficulty: 'advanced', popularity: 90, tags: ['payment', 'idempotency', 'ledger'] },
  },
  {
    name: 'File Storage Service',
    description: 'File upload, chunking, object storage, and signed-URL downloads.',
    category: 'file-storage',
    icon: 'HardDrive',
    color: '#64748b',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Client App', 0, 100),
          n('networking.load-balancer', 'Load Balancer', 220, 100),
          srv('application-services.file-service', 'File Service', 440, 100),
          n('storage.object-storage', 'Object Storage', 660, 40, { capacityTB: 50 }),
          queue('Kafka (File Events)', 660, 200),
          n('compute.background-worker', 'Thumbnail/Scan Workers', 440, 260, { instances: 3, requestsPerSec: 3000 }),
          db('PostgreSQL (Metadata)', 660, 340),
          cache('Redis (Cache)', 440, 380),
        ], [
          e('n1', 'n2', { rps: 2000, peakRps: 8000, payload: 2048 }),
          e('n2', 'n3', { rps: 2000, circuitBreaker: true }),
          e('n3', 'n4', { protocol: 'S3', connectionType: 'HTTP', rps: 2000, p99: 300, payload: 4096 }),
          e('n3', 'n5', { protocol: 'Event', rps: 500, syncMode: 'async' }),
          e('n3', 'n6', { protocol: 'Event', rps: 500, syncMode: 'async' }),
          e('n3', 'n7', { protocol: 'SQL', connectionType: 'DB', rps: 2000, p99: 100 }),
          e('n3', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 10000, p50: 1 }),
          e('n6', 'n7', { protocol: 'SQL', connectionType: 'DB', rps: 500 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Uploads stream directly to object storage with presigned URLs' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 87, tags: ['file-storage', 's3', 'upload'] },
  },
  {
    name: 'Search System',
    description: 'Document ingestion, indexing pipelines, and query-serving with relevance.',
    category: 'search',
    icon: 'Search',
    color: '#0ea5e9',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Search UI', 0, 80),
          n('networking.load-balancer', 'Load Balancer', 200, 80),
          srv('application-services.search-service', 'Query Service', 400, 80),
          n('databases.elasticsearch', 'Elasticsearch Cluster', 600, 40, { replicas: 2, nodes: 9, requestsPerSec: 50000, sharded: true, consistency: 'eventual' }),
          queue('Kafka (Docs)', 600, 200),
          n('compute.worker', 'Index Workers', 400, 220, { instances: 4, requestsPerSec: 10000 }),
          db('PostgreSQL (Source of truth)', 200, 220),
        ], [
          e('n1', 'n2', { rps: 10000, peakRps: 40000, p99: 150 }),
          e('n2', 'n3', { rps: 10000, peakRps: 40000, circuitBreaker: true }),
          e('n3', 'n4', { protocol: 'Search', connectionType: 'HTTP', rps: 10000, p99: 100 }),
          e('n7', 'n5', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n5', 'n6', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n6', 'n4', { protocol: 'Search', connectionType: 'HTTP', rps: 2000, syncMode: 'async' }),
          e('n3', 'n6', { protocol: 'REST', rps: 1000 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Queries are read-mostly; freshness of a few seconds is acceptable' }],
    },
    metadata: { difficulty: 'intermediate', popularity: 88, tags: ['search', 'elasticsearch', 'indexing'] },
  },
  {
    name: 'Real-time Collaboration',
    description: 'Shared document editing with presence, operational transforms, and sync.',
    category: 'collaboration',
    icon: 'PenTool',
    color: '#a855f7',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Editor (Web)', 0, 80),
          n('clients.desktop-client', 'Editor (Desktop)', 0, 220),
          n('networking.load-balancer', 'Load Balancer', 220, 150),
          srv('application-services.sync-service', 'Sync Service', 440, 150),
          n('compute.container', 'WebSocket Gateways', 440, 280, { instances: 6, requestsPerSec: 50000 }),
          n('messaging.redis-streams', 'Redis Streams (Ops)', 660, 150, { throughput: 200000, nodes: 5, replicas: 2, deadLetterQueue: true }),
          db('PostgreSQL (Docs/History)', 660, 300, { replicas: 3, consistency: 'strong' }),
          cache('Redis (Session)', 660, 50),
        ], [
          e('n1', 'n2', { protocol: 'WebSocket', rps: 10000, p99: 50 }),
          e('n3', 'n4', { rps: 8000, circuitBreaker: true, retry: 2 }),
          e('n3', 'n5', { protocol: 'WebSocket', rps: 50000, syncMode: 'async' }),
          e('n4', 'n6', { protocol: 'Streams', rps: 100000, syncMode: 'async' }),
          e('n5', 'n6', { protocol: 'Streams', rps: 100000, syncMode: 'async' }),
          e('n4', 'n7', { protocol: 'SQL', connectionType: 'DB', rps: 10000, p99: 100 }),
          e('n4', 'n8', { protocol: 'Cache', connectionType: 'Cache', rps: 20000, p50: 1 }),
          e('n2', 'n5', { protocol: 'WebSocket', rps: 50000, syncMode: 'async' }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Operation log ordering must be deterministic per document' }],
    },
    metadata: { difficulty: 'advanced', popularity: 83, tags: ['collaboration', 'websocket', 'ot'] },
  },
  {
    name: 'Event-driven Architecture',
    description: 'Event backbone with producers, consumers, schema registry, and replay.',
    category: 'event-driven',
    icon: 'Zap',
    color: '#eab308',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('application-services.order-service', 'Order Service (Producer)', 0, 40, { instances: 2 }),
          n('application-services.user-service', 'User Service (Producer)', 0, 200, { instances: 2 }),
          queue('Kafka (Orders)', 240, 40),
          queue('Kafka (Users)', 240, 200),
          n('compute.worker', 'Inventory Consumer', 480, 40, { instances: 3, requestsPerSec: 5000 }),
          n('compute.worker', 'Notification Consumer', 480, 160, { instances: 3, requestsPerSec: 5000 }),
          n('compute.worker', 'Analytics Consumer', 480, 280, { instances: 3, requestsPerSec: 20000 }),
          db('PostgreSQL (Service DBs)', 720, 100, { replicas: 2 }),
          n('storage.object-storage', 'Event Backup', 720, 280),
        ], [
          e('n1', 'n3', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n2', 'n4', { protocol: 'Event', rps: 1000, syncMode: 'async' }),
          e('n3', 'n5', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n3', 'n6', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n4', 'n7', { protocol: 'Event', rps: 1000, syncMode: 'async' }),
          e('n5', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 2000 }),
          e('n7', 'n9', { protocol: 'S3', connectionType: 'HTTP', rps: 2000, syncMode: 'async', payload: 1024 }),
        ]),
      ],
      assumptions: [
        { id: 'a1', text: 'Events are the source of truth for cross-service data' },
        { id: 'a2', text: 'Consumers must be idempotent' },
      ],
    },
    metadata: { difficulty: 'intermediate', popularity: 89, tags: ['event-driven', 'kafka', 'async'] },
  },
  {
    name: 'Microservices Architecture',
    description: 'Granular services with an API gateway, service discovery, and messaging.',
    category: 'microservices',
    icon: 'Boxes',
    color: '#6366f1',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Clients', 0, 220),
          n('networking.api-gateway', 'API Gateway', 220, 220, { rateLimiting: true, auth: true }),
          srv('application-services.auth-service', 'Auth Service', 440, 40),
          srv('application-services.custom-service', 'User Service', 440, 160),
          srv('application-services.custom-service', 'Graph Service', 440, 280),
          srv('application-services.custom-service', 'Feed Service', 440, 400),
          queue('Kafka (Events)', 680, 40),
          n('networking.service-mesh', 'Service Mesh', 680, 220, {}),
          db('PostgreSQL (User DB)', 680, 400, { sharded: true }),
          n('databases.neo4j', 'Neo4j (Graph DB)', 900, 220, { replicas: 2, consistency: 'eventual' }),
        ], [
          e('n1', 'n2', { rps: 20000, peakRps: 60000 }),
          e('n2', 'n3', { rps: 2000, circuitBreaker: true }),
          e('n2', 'n4', { rps: 8000, circuitBreaker: true }),
          e('n2', 'n5', { rps: 4000, circuitBreaker: true }),
          e('n2', 'n6', { rps: 6000, circuitBreaker: true }),
          e('n3', 'n7', { protocol: 'Event', rps: 2000, syncMode: 'async' }),
          e('n5', 'n9', { protocol: 'Cypher', connectionType: 'DB', rps: 2000, p99: 120 }),
          e('n4', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 3000, p99: 150 }),
          e('n5', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 1000, p99: 150 }),
          e('n3', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 500, p99: 150 }),
        ]),
      ],
      assumptions: [{ id: 'a1', text: 'Each service owns its data; cross-service state flows via events' }],
    },
    metadata: { difficulty: 'advanced', popularity: 91, tags: ['microservices', 'gateway', 'mesh'] },
  },
  {
    name: 'Multi-region Architecture',
    description: 'Active-active deployment across regions with global DNS, replication, and failover.',
    category: 'multi-region',
    icon: 'Globe',
    color: '#06b6d4',
    level: 'hld',
    snapshot: {
      pages: [
        page('HLD', 'hld', [
          n('clients.web-client', 'Global Users', 0, 160),
          n('networking.dns', 'Global DNS (Latency Routing)', 200, 160, {}),
          n('networking.cdn', 'CDN', 380, 30, {}),
          n('networking.load-balancer', 'LB — Region A (us-east-1)', 380, 160, { rateLimiting: true }),
          n('networking.load-balancer', 'LB — Region B (eu-west-1)', 380, 290, { rateLimiting: true }),
          srv('application-services.api-service', 'API Cluster — Region A', 580, 160),
          srv('application-services.api-service', 'API Cluster — Region B', 580, 290),
          db('PostgreSQL — Region A', 780, 160, { replicas: 2, multiAZ: true, crossRegionReplication: true }),
          db('PostgreSQL — Region B', 780, 290, { replicas: 2, multiAZ: true, crossRegionReplication: true }),
          n('databases.redis', 'Redis — Region A', 980, 160, { mode: 'cluster', replicas: 1, multiAZ: true }),
          n('databases.redis', 'Redis — Region B', 980, 290, { mode: 'cluster', replicas: 1, multiAZ: true }),
        ], [
          e('n1', 'n2', { rps: 30000, peakRps: 100000, p99: 50, payload: 2 }),
          e('n2', 'n3', { rps: 30000, p99: 30 }),
          e('n2', 'n4', { rps: 20000, p99: 40 }),
          e('n2', 'n5', { rps: 10000, p99: 60 }),
          e('n3', 'n4', { rps: 15000 }),
          e('n4', 'n6', { rps: 20000, circuitBreaker: true }),
          e('n5', 'n7', { rps: 10000, circuitBreaker: true }),
          e('n6', 'n8', { protocol: 'SQL', connectionType: 'DB', rps: 4000, p99: 120 }),
          e('n7', 'n9', { protocol: 'SQL', connectionType: 'DB', rps: 2000, p99: 120 }),
          e('n6', 'n10', { protocol: 'Cache', connectionType: 'Cache', rps: 10000, p50: 1 }),
          e('n7', 'n11', { protocol: 'Cache', connectionType: 'Cache', rps: 5000, p50: 1 }),
          e('n8', 'n9', { protocol: 'Replication', connectionType: 'DB', rps: 1000, syncMode: 'async' }),
        ]),
      ],
      assumptions: [
        { id: 'a1', text: 'Active-active reads; active-passive writes with async replication fallback' },
        { id: 'a2', text: 'Global DNS switches traffic on region failure' },
      ],
    },
    metadata: { difficulty: 'expert', popularity: 84, tags: ['multi-region', 'global', 'replication'] },
  },
];

/**
 * Node/edge ids are authored relative to each template (n1..nN, e1..eN) while
 * the helpers assign module-global ids. Re-number node/edge ids sequentially
 * per template in appearance order so the author-written edge references
 * (n1..nN) resolve to nodes within the same template.
 */
const normalizeTemplateIds = (items) => {
  let issues = 0;
  for (const item of items) {
    if (!item.snapshot?.pages) continue;
    let n = 0;
    let en = 0;
    const ids = new Set();
    for (const p of item.snapshot.pages) {
      for (const node of p.nodes || []) {
        node.id = `n${++n}`;
        ids.add(node.id);
      }
      for (const edge of p.edges || []) {
        edge.id = `e${++en}`;
        if (!ids.has(edge.source) || !ids.has(edge.target)) {
          issues += 1;
          console.error(`Seed template "${item.name}": edge ${edge.id} references unknown node ${edge.source}/${edge.target}.`);
        }
      }
    }
  }
  return issues;
};

export const seedSystemDesignTemplates = async () => {
  try {
    const issues = normalizeTemplateIds(templates);
    // Built-in templates are tagged isBuiltIn: true (the model defaults to
    // false for user-created templates). Always refresh built-ins: they are
    // immutable reference material, keeping ids consistent across versions.
    // Docs without createdBy are seed artifacts and are also cleared.
    await SystemDesignTemplate.deleteMany({
      $or: [{ isBuiltIn: true }, { createdBy: { $exists: false } }],
    });
    for (const t of templates) t.isBuiltIn = true;
    await SystemDesignTemplate.insertMany(templates);
    console.log(`Seeded ${templates.length} system design templates successfully.`);
    if (issues > 0) console.warn(`${issues} template edge issues were detected and reported above.`);
  } catch (error) {
    console.error('Error seeding system design templates:', error.message);
  }
};