/**
 * System Design Studio — reusable architecture patterns (part A).
 * Each pattern is a semantic sub-graph (nodes + edges) that can be dropped onto
 * the canvas and then freely edited.
 */

import { createEdge, genId, getComponentDef } from './architecture';

const P = (type, name, x, y, props = {}, w = 210, h = 88) => {
  const def = getComponentDef(type);
  return {
    id: genId('node'),
    type: def.type,
    category: def.category,
    name,
    description: def.description || '',
    position: { x, y },
    size: { w, h },
    properties: { ...(def.defaults || {}), ...props },
    metadata: { source: 'pattern' },
    style: {},
    locked: false,
    hidden: false,
    groupId: null,
  };
};

const E = (source, target, overrides = {}) => createEdge(source, target, null, null, overrides);

export const PATTERNS_A = [
  {
    id: 'cache-aside',
    name: 'Cache Aside',
    category: 'caching',
    description: 'Read through cache, write to database, invalidate cache on update.',
    notes: [
      'Read path: check cache, on miss load from DB and populate cache.',
      'Write path: write DB first, then invalidate/update cache.',
      'Cache TTL limits stale data windows.',
    ],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60, { instances: 2 });
      const cache = P('databases.redis-cache', 'Redis Cache', 300, 60, { hitRatio: 90 });
      const db = P('databases.postgresql', 'Primary DB', 620, 60, { replicas: 1, readsPerSec: 10000, writesPerSec: 5000 });
      return {
        nodes: [app, cache, db],
        edges: [
          E(app.id, cache.id, { protocol: 'REST', syncMode: 'sync', rps: 10000, peakRps: 30000, p99: 5, label: 'read' }),
          E(app.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 2000, peakRps: 6000, label: 'write + miss' }),
        ],
      };
    },
  },
  {
    id: 'write-through',
    name: 'Write Through Cache',
    category: 'caching',
    description: 'Writes go to cache first and are synchronously persisted to the database.',
    notes: ['Cache always consistent with DB on write.', 'Adds write latency but never serves stale data.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60);
      const cache = P('databases.redis-cache', 'Write-Through Cache', 300, 60);
      const db = P('databases.postgresql', 'Primary DB', 620, 60, { replicas: 1 });
      return {
        nodes: [app, cache, db],
        edges: [
          E(app.id, cache.id, { protocol: 'REST', syncMode: 'sync', rps: 5000, label: 'read/write' }),
          E(cache.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 5000, label: 'persist' }),
        ],
      };
    },
  },
  {
    id: 'write-behind',
    name: 'Write Behind',
    category: 'caching',
    description: 'Writes update the cache immediately; the database is updated asynchronously.',
    notes: ['Low write latency, but recent writes can be lost on cache failure.', 'Drainer/worker persists the backlog.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60);
      const cache = P('databases.redis-cache', 'Write-Behind Cache', 300, 60);
      const worker = P('compute.worker', 'Drainer Worker', 300, 200);
      const db = P('databases.postgresql', 'Primary DB', 620, 130, { replicas: 1 });
      return {
        nodes: [app, cache, worker, db],
        edges: [
          E(app.id, cache.id, { protocol: 'REST', syncMode: 'sync', rps: 5000, label: 'read/write' }),
          E(cache.id, worker.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 5000, label: 'dirty keys' }),
          E(worker.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'async', rps: 5000, label: 'batch write' }),
        ],
      };
    },
  },
  {
    id: 'read-replica',
    name: 'Read Replica',
    category: 'data',
    description: 'Route reads to replicas, writes to the primary.',
    notes: ['Horizontal read scaling with eventual consistency.', 'Replication lag must be acceptable for reads.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60);
      const lb = P('networking.load-balancer', 'Read Router', 300, 60);
      const primary = P('databases.postgresql', 'Primary (writes)', 620, -10, { replicas: 2, mode: 'primary' });
      const replica = P('databases.postgresql', 'Replica (reads)', 620, 130, { replicas: 0, mode: 'primary' });
      return {
        nodes: [app, lb, primary, replica],
        edges: [
          E(app.id, lb.id, { protocol: 'REST', syncMode: 'sync', rps: 10000, label: 'read/write' }),
          E(lb.id, primary.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 3000, label: 'writes' }),
          E(lb.id, replica.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 7000, label: 'reads' }),
          E(primary.id, replica.id, { protocol: 'Internal', connectionType: 'Event', syncMode: 'async', rps: 3000, label: 'streaming replication' }),
        ],
      };
    },
  },
  {
    id: 'database-sharding',
    name: 'Database Sharding',
    category: 'data',
    description: 'Partition data across multiple database nodes by shard key.',
    notes: ['Shard key choice drives routing (e.g. user_id).', 'Cross-shard queries are expensive — model around the key.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 100);
      const router = P('networking.load-balancer', 'Shard Router', 300, 100);
      const shard1 = P('databases.mongodb', 'Shard 1', 620, -30, { sharded: true });
      const shard2 = P('databases.mongodb', 'Shard 2', 620, 100, { sharded: true });
      const shard3 = P('databases.mongodb', 'Shard 3', 620, 230, { sharded: true });
      return {
        nodes: [app, router, shard1, shard2, shard3],
        edges: [
          E(app.id, router.id, { protocol: 'REST', syncMode: 'sync', rps: 30000 }),
          E(router.id, shard1.id, { protocol: 'Internal', syncMode: 'sync', rps: 10000, label: 'hash(key) -> shard' }),
          E(router.id, shard2.id, { protocol: 'Internal', syncMode: 'sync', rps: 10000 }),
          E(router.id, shard3.id, { protocol: 'Internal', syncMode: 'sync', rps: 10000 }),
        ],
      };
    },
  },
  {
    id: 'database-partitioning',
    name: 'Database Partitioning',
    category: 'data',
    description: 'Partition large tables by key/range within a single database.',
    notes: ['Improves index/scan performance and enables cheap retention deletion.', 'Logical partitions, one physical DB.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60);
      const db = P('databases.postgresql', 'Partitioned DB', 620, 60, { partitioned: true, retentionDays: 90 });
      return {
        nodes: [app, db],
        edges: [E(app.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 10000, label: 'range/key partitioned' })],
      };
    },
  },
  {
    id: 'cqrs',
    name: 'CQRS',
    category: 'data',
    description: 'Separate read and write models for the same data.',
    notes: ['Command model: strong consistency, small surface.', 'Query model: denormalized projections optimized for reads.'],
    build: () => {
      const client = P('clients.web-client', 'Client', 0, 60, {}, 200, 84);
      const command = P('application-services.custom-service', 'Command Service', 300, -20);
      const query = P('application-services.custom-service', 'Query Service', 300, 140);
      const writeDb = P('databases.postgresql', 'Write DB', 620, -20, { replicas: 1 });
      const readDb = P('databases.elasticsearch', 'Read DB (projection)', 620, 140, { nodes: 3, replicas: 1 });
      const q = P('messaging.kafka', 'Event Stream', 300, 260);
      return {
        nodes: [client, command, query, writeDb, readDb, q],
        edges: [
          E(client.id, command.id, { protocol: 'REST', syncMode: 'sync', rps: 3000, label: 'commands' }),
          E(client.id, query.id, { protocol: 'GraphQL', syncMode: 'sync', rps: 10000, label: 'queries' }),
          E(command.id, writeDb.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 3000 }),
          E(writeDb.id, q.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 3000, label: 'changes' }),
          E(q.id, query.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 3000, label: 'project' }),
          E(query.id, readDb.id, { protocol: 'Internal', syncMode: 'sync', rps: 10000 }),
        ],
      };
    },
  },
  {
    id: 'event-sourcing',
    name: 'Event Sourcing',
    category: 'data',
    description: 'Persist state changes as an immutable event log; state is a projection.',
    notes: ['Full audit trail and time-travel possible.', 'Projections rebuild the read models; events are the source of truth.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60);
      const store = P('messaging.kafka', 'Event Store', 300, 60, { retentionMs: 31536000000 });
      const projector = P('compute.worker', 'Projector', 300, 200);
      const readDb = P('databases.mongodb', 'Projection DB', 620, 130, { replicas: 2 });
      return {
        nodes: [app, store, projector, readDb],
        edges: [
          E(app.id, store.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 5000, label: 'append events' }),
          E(store.id, projector.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 5000, label: 'consume' }),
          E(projector.id, readDb.id, { protocol: 'Internal', syncMode: 'async', rps: 5000, label: 'upsert projection' }),
        ],
      };
    },
  },
  {
    id: 'saga',
    name: 'Saga',
    category: 'messaging',
    description: 'Distributed transaction across services with compensating actions.',
    notes: ['Choreographed or orchestrated sagas.', 'Each step has a compensating action on failure.'],
    build: () => {
      const order = P('application-services.order', 'Order Service', 0, 80);
      const payment = P('application-services.payment', 'Payment Service', 300, 0, { idempotency: true });
      const inventory = P('application-services.inventory', 'Inventory Service', 300, 160);
      const q = P('messaging.message-queue', 'Saga Queue', 0, 240);
      return {
        nodes: [order, payment, inventory, q],
        edges: [
          E(order.id, payment.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 1000, label: 'charge -> compensate on fail' }),
          E(order.id, inventory.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 1000, label: 'reserve -> compensate on fail' }),
          E(payment.id, q.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 1000, label: 'outcome' }),
          E(inventory.id, q.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 1000, label: 'outcome' }),
        ],
      };
    },
  },
  {
    id: 'outbox',
    name: 'Outbox Pattern',
    category: 'messaging',
    description: 'Write DB changes and outbound events in one transaction to guarantee delivery.',
    notes: ['Prevents dual-write inconsistency.', 'A relay worker publishes outbox rows to the bus.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 100);
      const db = P('databases.postgresql', 'DB + Outbox Table', 300, 100, { replicas: 1 });
      const relay = P('compute.worker', 'Outbox Relay', 300, 260);
      const bus = P('messaging.kafka', 'Event Bus', 620, 180);
      return {
        nodes: [app, db, relay, bus],
        edges: [
          E(app.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 3000, label: 'txn: state + outbox' }),
          E(db.id, relay.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 3000, label: 'poll outbox' }),
          E(relay.id, bus.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 3000, label: 'publish' }),
        ],
      };
    },
  },
  {
    id: 'pubsub',
    name: 'Pub/Sub',
    category: 'messaging',
    description: 'Producers publish events; independent subscribers consume them.',
    notes: ['Decouples producers from consumers.', 'Multiple subscribers, each with own position.'],
    build: () => {
      const producer = P('application-services.custom-service', 'Producer', 0, 100);
      const topic = P('messaging.topic', 'Topic', 300, 100, {}, 200, 84);
      const sub1 = P('compute.worker', 'Subscriber A', 620, -10);
      const sub2 = P('compute.worker', 'Subscriber B', 620, 120);
      const sub3 = P('compute.worker', 'Subscriber C', 620, 250);
      return {
        nodes: [producer, topic, sub1, sub2, sub3],
        edges: [
          E(producer.id, topic.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 10000, label: 'publish' }),
          E(topic.id, sub1.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 4000, label: 'subscribe' }),
          E(topic.id, sub2.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 4000, label: 'subscribe' }),
          E(topic.id, sub3.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 4000, label: 'subscribe' }),
        ],
      };
    },
  },
  {
    id: 'fanout',
    name: 'Fanout',
    category: 'messaging',
    description: 'One event fans out to many workers (e.g. social feed fanout).',
    notes: ['Scales consumer throughput by partitioning.', 'Use consumer groups with partitioned topics.'],
    build: () => {
      const feed = P('application-services.feed', 'Feed Service', 0, 60);
      const kafka = P('messaging.kafka', 'Fanout Topic', 300, 60, { partitions: 16 });
      const w1 = P('compute.worker', 'Fanout Worker x4', 620, -30, { instances: 4 });
      const w2 = P('compute.worker', 'Feed Cache Writer', 620, 120, { instances: 4 });
      const cache = P('databases.redis-cache', 'Feed Cache', 0, 200);
      return {
        nodes: [feed, kafka, w1, w2, cache],
        edges: [
          E(feed.id, kafka.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 20000, label: 'publish' }),
          E(kafka.id, w1.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 10000, label: 'consumer group' }),
          E(kafka.id, w2.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 10000, label: 'consumer group' }),
          E(w2.id, cache.id, { protocol: 'Internal', syncMode: 'async', rps: 10000, label: 'precompute' }),
        ],
      };
    },
  },
  {
    id: 'event-driven',
    name: 'Event-driven Architecture',
    category: 'messaging',
    description: 'Decouple services through events; no direct synchronous coupling.',
    notes: ['Producers emit facts; consumers react.', 'Enables independent scaling and evolution.'],
    build: () => {
      const source = P('application-services.order', 'Order Service', 0, 80);
      const bus = P('messaging.event-bus', 'Event Bus', 300, 80);
      const a = P('application-services.notification-service', 'Notification Svc', 620, -30);
      const b = P('application-services.analytics-service', 'Analytics Svc', 620, 90);
      const c = P('application-services.inventory', 'Inventory Svc', 620, 210);
      return {
        nodes: [source, bus, a, b, c],
        edges: [
          E(source.id, bus.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 5000, label: 'publish' }),
          E(bus.id, a.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 2000 }),
          E(bus.id, b.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 2000 }),
          E(bus.id, c.id, { protocol: 'Event', connectionType: 'Event', syncMode: 'async', rps: 2000 }),
        ],
      };
    },
  },
];

export const PATTERNS_B = [];
