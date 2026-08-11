/**
 * System Design Studio — reusable architecture patterns (part B).
 * Resilience, scalability, security and deployment patterns.
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

export const PATTERNS_B = [
  {
    id: 'circuit-breaker',
    name: 'Circuit Breaker',
    category: 'resilience',
    description: 'Fail fast when a dependency is unhealthy; probe recovery in half-open state.',
    notes: ['States: closed -> open -> half-open -> closed.', 'Prevents cascading failures on hot paths.'],
    build: () => {
      const client = P('clients.web-client', 'Client', 0, 60, {}, 200, 84);
      const app = P('application-services.custom-service', 'App Service', 280, 60, { instances: 2 });
      const dep = P('application-services.payment', 'Dependency Service', 620, 60, { idempotency: true });
      return {
        nodes: [client, app, dep],
        edges: [
          E(client.id, app.id, { protocol: 'REST', syncMode: 'sync', rps: 10000 }),
          E(app.id, dep.id, {
            protocol: 'REST', syncMode: 'sync', rps: 5000, timeout: 2, retry: 0,
            backoff: 'none', circuitBreaker: true, p99: 800, label: 'circuit-breaker ON',
          }),
        ],
      };
    },
  },
  {
    id: 'retry-backoff',
    name: 'Retry + Exponential Backoff',
    category: 'resilience',
    description: 'Retry transient failures with exponential backoff and jitter.',
    notes: ['Bounded retries (3-5) to avoid thundering herd.', 'Add jitter to avoid synchronized retries.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60, { instances: 2 });
      const db = P('databases.postgresql', 'Database', 620, 60, { replicas: 1 });
      return {
        nodes: [app, db],
        edges: [
          E(app.id, db.id, {
            protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 5000,
            retry: 3, backoff: 'exponential', timeout: 3, circuitBreaker: true,
            label: 'retry x3 exp backoff',
          }),
        ],
      };
    },
  },
  {
    id: 'rate-limiting',
    name: 'Rate Limiting',
    category: 'security',
    description: 'Enforce per-client rate limits at the edge.',
    notes: ['Token bucket / sliding window.', 'Return 429 with Retry-After header.'],
    build: () => {
      const internet = P('networking.internet', 'Internet', 0, 60, {}, 190, 80);
      const limiter = P('security.rate-limiter', 'Rate Limiter', 280, 60, { tiers: 'yes', http429: true });
      const gateway = P('networking.api-gateway', 'API Gateway', 560, 60, { rateLimitEnabled: true, authEnabled: true, tlsEnabled: true });
      const app = P('application-services.custom-service', 'App Service', 840, 60, { instances: 2 });
      return {
        nodes: [internet, limiter, gateway, app],
        edges: [
          E(internet.id, limiter.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 100000 }),
          E(limiter.id, gateway.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 50000, label: 'allowed' }),
          E(gateway.id, app.id, { protocol: 'REST', syncMode: 'sync', rps: 20000 }),
        ],
      };
    },
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'security',
    description: 'Single ingress: routing, auth, rate limiting, TLS.',
    notes: ['Centralizes cross-cutting edge concerns.', 'Enables blue-green and canary routing.'],
    build: () => {
      const internet = P('networking.internet', 'Internet', 0, 100, {}, 190, 80);
      const cdn = P('networking.cdn', 'CDN', 280, 100, { edgeLocations: 30 });
      const gateway = P('networking.api-gateway', 'API Gateway', 560, 100, { rateLimitEnabled: true, authEnabled: true, tlsEnabled: true });
      const svc1 = P('application-services.user-service', 'User Service', 900, -30, { instances: 2 });
      const svc2 = P('application-services.order', 'Order Service', 900, 100, { instances: 2 });
      const svc3 = P('application-services.notification-service', 'Notification Svc', 900, 230, { instances: 2 });
      return {
        nodes: [internet, cdn, gateway, svc1, svc2, svc3],
        edges: [
          E(internet.id, cdn.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 100000, label: 'static + TLS' }),
          E(cdn.id, gateway.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 50000 }),
          E(gateway.id, svc1.id, { protocol: 'REST', syncMode: 'sync', rps: 15000, label: '/users' }),
          E(gateway.id, svc2.id, { protocol: 'REST', syncMode: 'sync', rps: 15000, label: '/orders' }),
          E(gateway.id, svc3.id, { protocol: 'REST', syncMode: 'sync', rps: 5000, label: '/notifications' }),
        ],
      };
    },
  },
  {
    id: 'service-discovery',
    name: 'Service Discovery',
    category: 'scalability',
    description: 'Services register and discover each other dynamically.',
    notes: ['Registry keeps live endpoints; health checks prune dead ones.', 'Client-side or server-side discovery.'],
    build: () => {
      const lb = P('networking.load-balancer', 'Load Balancer', 0, 100);
      const registry = P('databases.redis', 'Registry', 300, -40, { mode: 'cluster' });
      const svc1 = P('application-services.custom-service', 'Service A (x3)', 620, 20, { instances: 3 });
      const svc2 = P('application-services.custom-service', 'Service B (x3)', 620, 180, { instances: 3 });
      const mesh = P('networking.service-mesh', 'Service Mesh', 300, 240, { mTLS: true });
      return {
        nodes: [lb, registry, svc1, svc2, mesh],
        edges: [
          E(lb.id, svc1.id, { protocol: 'REST', syncMode: 'sync', rps: 10000 }),
          E(lb.id, svc2.id, { protocol: 'REST', syncMode: 'sync', rps: 10000 }),
          E(svc1.id, registry.id, { protocol: 'Internal', syncMode: 'async', rps: 10, label: 'register/heartbeat' }),
          E(svc2.id, registry.id, { protocol: 'Internal', syncMode: 'async', rps: 10, label: 'register/heartbeat' }),
          E(svc1.id, mesh.id, { protocol: 'gRPC', syncMode: 'sync', rps: 5000, label: 'discover + mTLS' }),
          E(svc2.id, mesh.id, { protocol: 'gRPC', syncMode: 'sync', rps: 5000 }),
        ],
      };
    },
  },
  {
    id: 'distributed-lock',
    name: 'Distributed Lock',
    category: 'resilience',
    description: 'Serialize access to a shared resource across instances.',
    notes: ['Use Redis SETNX with TTL + fencing token.', 'Avoid long-held locks; prefer lease-based.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 60, { instances: 3 });
      const lock = P('databases.redis', 'Redis Lock Store', 300, 60, { mode: 'sentinel' });
      const db = P('databases.postgresql', 'Shared Resource DB', 620, 60, { replicas: 1 });
      return {
        nodes: [app, lock, db],
        edges: [
          E(app.id, lock.id, { protocol: 'Internal', syncMode: 'sync', rps: 100, label: 'acquire TTL 10s' }),
          E(app.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 1000, label: 'guarded write' }),
        ],
      };
    },
  },
  {
    id: 'leader-election',
    name: 'Leader Election',
    category: 'resilience',
    description: 'One active leader among replicas coordinates work.',
    notes: ['Follower promotes when leader lease expires.', 'Used for single-writer coordination.'],
    build: () => {
      const registry = P('databases.redis', 'Lease Registry', 0, 100, { mode: 'sentinel' });
      const leader = P('compute.worker', 'Leader', 300, 0, { instances: 1 });
      const follower1 = P('compute.worker', 'Follower 1', 300, 100, { instances: 1 });
      const follower2 = P('compute.worker', 'Follower 2', 300, 200, { instances: 1 });
      return {
        nodes: [registry, leader, follower1, follower2],
        edges: [
          E(leader.id, registry.id, { protocol: 'Internal', syncMode: 'async', rps: 1, label: 'renew lease' }),
          E(follower1.id, registry.id, { protocol: 'Internal', syncMode: 'async', rps: 1, label: 'watch lease' }),
          E(follower2.id, registry.id, { protocol: 'Internal', syncMode: 'async', rps: 1, label: 'watch lease' }),
          E(leader.id, follower1.id, { protocol: 'Internal', syncMode: 'async', rps: 10, label: 'replication' }),
          E(leader.id, follower2.id, { protocol: 'Internal', syncMode: 'async', rps: 10, label: 'replication' }),
        ],
      };
    },
  },
  {
    id: 'consistent-hashing',
    name: 'Consistent Hashing',
    category: 'scalability',
    description: 'Distribute keys with minimal rebalancing when nodes join/leave.',
    notes: ['Virtual nodes improve balance.', 'Used by caches and sharded stores.'],
    build: () => {
      const router = P('networking.load-balancer', 'Hash Ring Router', 0, 100);
      const cache1 = P('databases.redis-cache', 'Cache Node 1', 300, -30, { mode: 'standalone' });
      const cache2 = P('databases.redis-cache', 'Cache Node 2', 300, 100, { mode: 'standalone' });
      const cache3 = P('databases.redis-cache', 'Cache Node 3', 300, 230, { mode: 'standalone' });
      return {
        nodes: [router, cache1, cache2, cache3],
        edges: [
          E(router.id, cache1.id, { protocol: 'Internal', syncMode: 'sync', rps: 30000, label: 'hash(key)' }),
          E(router.id, cache2.id, { protocol: 'Internal', syncMode: 'sync', rps: 30000 }),
          E(router.id, cache3.id, { protocol: 'Internal', syncMode: 'sync', rps: 30000 }),
        ],
      };
    },
  },
  {
    id: 'bulkhead',
    name: 'Bulkhead',
    category: 'resilience',
    description: 'Isolate failure domains with separate thread pools/connections.',
    notes: ['One failing dependency cannot exhaust shared resources.', 'Boundary per dependency or tier.'],
    build: () => {
      const app = P('application-services.custom-service', 'App Service', 0, 100, { instances: 2 });
      const poolA = P('compute.worker', 'Pool A (payments)', 300, 0, { instances: 2 });
      const poolB = P('compute.worker', 'Pool B (orders)', 300, 100, { instances: 2 });
      const poolC = P('compute.worker', 'Pool C (analytics)', 300, 200, { instances: 2 });
      return {
        nodes: [app, poolA, poolB, poolC],
        edges: [
          E(app.id, poolA.id, { protocol: 'Internal', syncMode: 'sync', rps: 2000, label: 'isolated' }),
          E(app.id, poolB.id, { protocol: 'Internal', syncMode: 'sync', rps: 2000, label: 'isolated' }),
          E(app.id, poolC.id, { protocol: 'Internal', syncMode: 'sync', rps: 2000, label: 'isolated' }),
        ],
      };
    },
  },
  {
    id: 'idempotency',
    name: 'Idempotency',
    category: 'resilience',
    description: 'Repeat requests produce the same result exactly once.',
    notes: ['Idempotency keys + stored responses.', 'Critical for payments and retries.'],
    build: () => {
      const client = P('clients.web-client', 'Client', 0, 60, {}, 200, 84);
      const app = P('application-services.payment', 'Payment Service', 300, 60, { idempotency: true });
      const store = P('databases.redis-cache', 'Idempotency Store', 600, 60, { persistence: 'AOF' });
      const db = P('databases.postgresql', 'Ledger DB', 600, 200, { replicas: 1 });
      return {
        nodes: [client, app, store, db],
        edges: [
          E(client.id, app.id, { protocol: 'REST', syncMode: 'sync', rps: 2000, label: 'Idempotency-Key' }),
          E(app.id, store.id, { protocol: 'Internal', syncMode: 'sync', rps: 2000, label: 'dedupe check' }),
          E(app.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 1000, label: 'write once' }),
        ],
      };
    },
  },
  {
    id: 'blue-green',
    name: 'Blue-Green Deployment',
    category: 'deployment',
    description: 'Two identical environments; switch traffic atomically.',
    notes: ['Instant rollback by switching back.', 'Double infrastructure cost while both run.'],
    build: () => {
      const lb = P('networking.load-balancer', 'Router', 0, 100, { stickySessions: false });
      const blue = P('compute.server', 'Blue (v2 live)', 300, 30, { instances: 2 });
      const green = P('compute.server', 'Green (v1 standby)', 300, 170, { instances: 2 });
      const db = P('databases.postgresql', 'Shared DB', 620, 100, { replicas: 1 });
      return {
        nodes: [lb, blue, green, db],
        edges: [
          E(lb.id, blue.id, { protocol: 'REST', syncMode: 'sync', rps: 10000, label: '100% traffic' }),
          E(lb.id, green.id, { protocol: 'REST', syncMode: 'sync', rps: 0, label: 'standby' }),
          E(blue.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 5000 }),
          E(green.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 0 }),
        ],
      };
    },
  },
  {
    id: 'canary',
    name: 'Canary Deployment',
    category: 'deployment',
    description: 'Route a small traffic percentage to the new version first.',
    notes: ['Monitor errors/latency before ramping.', 'Automatic rollback on regression.'],
    build: () => {
      const lb = P('networking.load-balancer', 'Router', 0, 100, { stickySessions: true });
      const stable = P('compute.server', 'Stable (v1) x4', 300, 30, { instances: 4 });
      const canary = P('compute.server', 'Canary (v2) x1', 300, 170, { instances: 1 });
      const db = P('databases.postgresql', 'Shared DB', 620, 100, { replicas: 1 });
      return {
        nodes: [lb, stable, canary, db],
        edges: [
          E(lb.id, stable.id, { protocol: 'REST', syncMode: 'sync', rps: 9500, label: '95%' }),
          E(lb.id, canary.id, { protocol: 'REST', syncMode: 'sync', rps: 500, label: '5%' }),
          E(stable.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 5000 }),
          E(canary.id, db.id, { protocol: 'SQL', connectionType: 'Database', syncMode: 'sync', rps: 300 }),
        ],
      };
    },
  },
  {
    id: 'multi-region',
    name: 'Multi-Region',
    category: 'deployment',
    description: 'Active-active or active-passive deployment across regions.',
    notes: ['Global DNS routing (latency or failover based).', 'Data replication + conflict handling.'],
    build: () => {
      const dns = P('networking.dns', 'Global DNS', 0, 60);
      const r1 = P('networking.region', 'Region A (active)', 280, 0, {}, 220, 92);
      const r2 = P('networking.region', 'Region B (active)', 280, 160, {}, 220, 92);
      const lbA = P('networking.load-balancer', 'LB A', 580, 0);
      const lbB = P('networking.load-balancer', 'LB B', 580, 160);
      const dbA = P('databases.dynamodb', 'DynamoDB Global', 860, 80, { replication: 'multi-region', multiAZ: true });
      return {
        nodes: [dns, r1, r2, lbA, lbB, dbA],
        edges: [
          E(dns.id, lbA.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 50000, label: 'latency routing' }),
          E(dns.id, lbB.id, { protocol: 'HTTPS', syncMode: 'sync', rps: 50000 }),
          E(lbA.id, dbA.id, { protocol: 'Internal', syncMode: 'sync', rps: 20000, label: 'global table' }),
          E(lbB.id, dbA.id, { protocol: 'Internal', syncMode: 'sync', rps: 20000 }),
        ],
      };
    },
  },
];
