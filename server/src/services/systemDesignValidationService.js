/**
 * systemDesignValidationService — rule-based architecture validation engine.
 *
 * The engine analyzes the SEMANTIC architecture graph (typed nodes, first-class
 * edges with protocol/traffic/latency, boundary groups) and produces explainable
 * findings. Never fake precision: every finding has a concrete reason derived
 * from the graph data, plus a recommendation.
 *
 * Score model (honest, explainable):
 *   - Each category starts at 20/20.
 *   - critical finding -> -6 (max -12 per category)
 *   - warning          -> -4 (max  -8 per category)
 *   - suggestion       -> -1 (max  -3 per category)
 *   - Overall = mean of the six categories (0..100).
 */

const CATEGORIES = ['scalability', 'availability', 'performance', 'security', 'reliability', 'data'];

const num = (props, key, fallback = 0) => {
  const v = props?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
};
const bool = (props, key, fallback = false) => {
  const v = props?.[key];
  return typeof v === 'boolean' ? v : fallback;
};
const str = (props, key, fallback = '') => {
  const v = props?.[key];
  return typeof v === 'string' && v.trim() ? v : fallback;
};

const isService = (n) => ['compute', 'application-services', 'custom'].includes(n?.category);
const isCache = (n) => n?.category === 'databases' && /(cache|redis|memcached)/.test(n?.type || '');
const isMessageQueue = (n) => n?.category === 'messaging';
const isInternetFacing = (n) =>
  n?.category === 'clients' ||
  (n?.category === 'networking' && ['networking.internet', 'networking.cdn', 'networking.dns'].includes(n?.type));

export const buildGraph = (document) => {
  const nodes = [];
  const edges = [];
  const groups = [];
  const pages = document?.pages || [];
  for (const page of pages) {
    for (const n of page.nodes || []) nodes.push({ ...n, pageId: page.pageId });
    for (const e of page.edges || []) edges.push({ ...e, pageId: page.pageId });
    for (const g of page.groups || []) groups.push({ ...g, pageId: page.pageId });
  }
  return { nodes, edges, groups };
};

const nodeById = (nodes, id) => nodes.find((n) => n.id === id) || null;

const incomingTraffic = (edges, nodeId) =>
  edges
    .filter((e) => e.target === nodeId)
    .reduce((sum, e) => sum + (num(e.traffic, 'peakRps', 0) || num(e.traffic, 'rps', 0)), 0);

const longestSyncChain = (edges) => {
  const adjacency = new Map();
  for (const e of edges) {
    if (e.syncMode === 'async') continue;
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source).push(e.target);
  }
  const memo = new Map();
  const dfs = (id, path) => {
    if (memo.has(id)) return memo.get(id);
    if (path.has(id)) return 0;
    path.add(id);
    const next = adjacency.get(id) || [];
    let depth = 0;
    for (const n of next) depth = Math.max(depth, 1 + dfs(n, path));
    path.delete(id);
    memo.set(id, depth);
    return depth;
  };
  let best = 0;
  for (const src of adjacency.keys()) best = Math.max(best, dfs(src, new Set()));
  return best;
};

const maxReachableDepth = (edges, startId) => {
  const adjacency = new Map();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source).push(e.target);
  }
  const seen = new Set([startId]);
  let depth = 0;
  const queue = [[startId, 0]];
  while (queue.length) {
    const [id, d] = queue.shift();
    depth = Math.max(depth, d);
    for (const n of adjacency.get(id) || []) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push([n, d + 1]);
      }
    }
  }
  return depth;
};

export const validateGraph = (nodes, edges, groups = []) => {
  const findings = [];

  const finding = (category, severity, title, description, impact, recommendation, affectedNodes = [], affectedEdges = []) => {
    findings.push({
      id: `f_${category}_${findings.length + 1}`,
      category,
      severity,
      title,
      description,
      impact,
      recommendation,
      affectedNodes,
      affectedEdges,
    });
  };

  const dbCap = (props) => ({
    reads: num(props, 'readsPerSec', 10000),
    writes: num(props, 'writesPerSec', 5000),
  });

  // ─────────────────────────── SCALABILITY ───────────────────────────
  for (const n of nodes.filter(isService)) {
    const instances = num(n.properties, 'instances', 1);
    const incoming = incomingTraffic(edges, n.id);
    if (instances <= 1 && incoming > 3000) {
      finding('scalability', 'warning', 'Single-instance service under load',
        `${n.name || n.id} receives ~${incoming.toLocaleString()} req/sec but is configured with only ${instances} instance.`,
        'One instance caps throughput and turns any failure into an outage.',
        'Add replicas, enable auto scaling, and keep the service stateless.',
        [n.id]);
    } else if (instances <= 1) {
      finding('scalability', 'suggestion', 'Consider horizontal scaling',
        `${n.name || n.id} is configured as a single instance.`,
        'A single instance limits throughput to one process.',
        'Plan for instances > 1 or auto scaling as load grows.',
        [n.id]);
    }
  }

  for (const db of nodes.filter((n) => n.category === 'databases')) {
    const cap = dbCap(db.properties);
    const incoming = incomingTraffic(edges, db.id);
    const writeShare = incoming * 0.3; // conservative assumption: 30% of peak is writes
    if (writeShare > cap.writes) {
      finding('scalability', 'critical', 'Potential database bottleneck',
        `${db.name || db.id} receives ~${incoming.toLocaleString()} req/sec (est. ${Math.round(writeShare).toLocaleString()} writes/sec) but its configured write capacity is ${cap.writes.toLocaleString()} writes/sec.`,
        'The database cannot keep up, producing queueing and timeouts for dependent services.',
        'Consider partitioning, sharding, read replicas, or asynchronous write processing.',
        [db.id]);
    } else if (incoming > cap.reads) {
      finding('scalability', 'warning', 'Database read pressure',
        `${db.name || db.id} receives ~${incoming.toLocaleString()} req/sec against a read capacity of ${cap.reads.toLocaleString()} reads/sec.`,
        'Reads will saturate the primary node and degrade p95/p99 latency.',
        'Add read replicas or a cache (cache-aside / read-through) in front of the database.',
        [db.id]);
    }
    if (incoming > 2000) {
      const cacheNearby = nodes.some((c) => isCache(c) && (edges.some((e) => (e.source === db.id && e.target === c.id) || (e.target === db.id && e.source === c.id)) || (c.groupId && c.groupId === db.groupId)));
      if (!cacheNearby) {
        finding('scalability', 'warning', 'Missing cache on hot database',
          `${db.name || db.id} serves ~${incoming.toLocaleString()} req/sec with no cache component in front of it.`,
          'Every request hits the database directly, multiplying I/O and latency.',
          'Place a Redis/Memcached cache between services and the database.',
          [db.id]);
      }
    }
  }

  for (const q of nodes.filter(isMessageQueue)) {
    const incoming = incomingTraffic(edges, q.id);
    const throughput = num(q.properties, 'throughput', 100000);
    if (incoming > throughput) {
      finding('scalability', 'warning', 'Queue throughput exceeded',
        `${q.name || q.id} receives ~${incoming.toLocaleString()} msg/sec but configured throughput is ${throughput.toLocaleString()} msg/sec.`,
        'Backlog grows faster than consumers can drain it.',
        'Increase partitions/consumers or offload lower-priority events to a separate stream.',
        [q.id]);
    }
  }

  // ─────────────────────────── AVAILABILITY ───────────────────────────
  for (const db of nodes.filter((n) => n.category === 'databases')) {
    const props = db.properties || {};
    if (num(props, 'replicas', 0) <= 0 || str(props, 'replication', 'none') === 'none') {
      finding('availability', 'critical', 'Database is a single point of failure',
        `${db.name || db.id} has only one instance with no replication/failover configured.`,
        'Database failure causes a complete service outage until manual recovery.',
        'Add a replica with automatic failover (e.g. primary/replica with hot standby).',
        [db.id]);
    } else if (!bool(props, 'failover', true)) {
      finding('availability', 'warning', 'Missing database failover',
        `${db.name || db.id} replicates data but automatic failover is disabled.`,
        'Promotion to a replica requires manual intervention, extending downtime.',
        'Enable automatic failover between the primary and replicas.',
        [db.id]);
    }
    if (!bool(props, 'backup', false)) {
      finding('availability', 'warning', 'No database backups',
        `${db.name || db.id} has no backup strategy configured.`,
        'Data loss cannot be recovered from after a disk failure or corruption.',
        'Configure periodic backups (PITR recommended) and test restore procedures.',
        [db.id]);
    }
    if (!bool(props, 'multiAZ', false) && incomingTraffic(edges, db.id) > 1000) {
      finding('availability', 'suggestion', 'Consider multi-AZ deployment',
        `${db.name || db.id} is not multi-AZ aware.`,
        'An availability-zone failure takes the database offline.',
        'Deploy primary and replicas across availability zones.',
        [db.id]);
    }
  }

  for (const n of nodes.filter(isService)) {
    if (num(n.properties, 'instances', 1) <= 1 && incomingTraffic(edges, n.id) > 0) {
      finding('availability', 'warning', 'Service single point of failure',
        `${n.name || n.id} runs as a single instance with no redundancy.`,
        'One node failure or deployment error takes the service offline.',
        'Run at least two instances behind a load balancer.',
        [n.id]);
    }
  }

  for (const c of nodes.filter(isCache)) {
    if (!bool(c.properties, 'replication', false) && !bool(c.properties, 'multiAZ', false)) {
      finding('availability', 'warning', 'Cache has no replication',
        `${c.name || c.id} is a standalone cache node.`,
        'A cache failure forces every request to the database, risking a downstream storm.',
        'Use cache clustering (e.g. Redis Cluster/Sentinel) with replicas.',
        [c.id]);
    }
  }

  // ─────────────────────────── PERFORMANCE ───────────────────────────
  const syncChain = longestSyncChain(edges);
  if (syncChain >= 6) {
    finding('performance', 'warning', 'Long synchronous chain',
      `The longest synchronous request chain contains ${syncChain} hops.`,
      'Each hop adds network + processing latency; the user waits for the full chain.',
      'Break the chain with asynchronous messaging or parallel fan-out.',
      [], edges.filter((e) => e.syncMode !== 'async').slice(0, 8).map((e) => e.id));
  } else if (syncChain >= 4) {
    finding('performance', 'suggestion', 'Consider shortening sync chain',
      `The longest synchronous chain is ${syncChain} hops.`,
      'Latency grows linearly with the number of synchronous hops.',
      'Evaluate whether intermediate hops can be skipped or made asynchronous.',
      [], edges.filter((e) => e.syncMode !== 'async').slice(0, 8).map((e) => e.id));
  }

  for (const e of edges) {
    const p99 = num(e.latency, 'p99', 0);
    if (p99 > 1000) {
      finding('performance', 'warning', 'High-latency connection',
        `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} has a p99 latency of ${p99}ms.`,
        'Users on the tail experience seconds-long waits.',
        'Introduce caching, reduce payloads, or parallelize the call.',
        [e.source, e.target], [e.id]);
    }
    const payload = num(e.payload, 0);
    if (payload >= 1024) {
      finding('performance', 'warning', 'Very large payloads',
        `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} transfers ~${payload} KB per request.`,
        'Large payloads inflate bandwidth, serialization cost, and latency.',
        'Compress, paginate, or stream; consider CDN/edge caching for static content.',
        [e.source, e.target], [e.id]);
    } else if (payload >= 256) {
      finding('performance', 'suggestion', 'Large payloads',
        `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} transfers ~${payload} KB per request.`,
        'Payload size adds latency proportional to transfer speed.',
        'Compress responses or move large content to object storage with signed URLs.',
        [e.source, e.target], [e.id]);
    }
  }

  for (const db of nodes.filter((n) => n.category === 'databases')) {
    const cap = dbCap(db.properties);
    const incoming = incomingTraffic(edges, db.id);
    if (cap.reads > 0 && incoming / cap.reads > 0.8) {
      finding('performance', 'warning', 'Database load approaching capacity',
        `${db.name || db.id} utilization is estimated at ${Math.round((incoming / cap.reads) * 100)}% of read capacity.`,
        'Response times degrade sharply as utilization approaches 100%.',
        'Add capacity (read replicas, caching, partitioning) before the saturation point.',
        [db.id]);
    }
  }

  for (const n of nodes) {
    if (isInternetFacing(n) || isService(n)) {
      const depth = maxReachableDepth(edges, n.id);
      if (depth > 7) {
        finding('performance', 'suggestion', 'Deep dependency chain',
          `${n.name || n.id} reaches nodes at depth ${depth}.`,
          'Deep dependency chains are hard to reason about and slow to traverse.',
          'Simplify the call graph or introduce event-driven decoupling.',
          [n.id]);
        break;
      }
    }
  }

  // ─────────────────────────── SECURITY ───────────────────────────
  const hasAuth = nodes.some((n) =>
    ['security.oauth', 'security.identity-provider', 'security.jwt', 'security.api-key', 'networking.api-gateway', 'application-services.auth-service'].includes(n.type) ||
    (n.category === 'security' && ['oauth', 'identity-provider', 'jwt', 'api-key'].includes(n.type?.split('.')?.pop())));
  if (!hasAuth) {
    finding('security', 'warning', 'No authentication component',
      'The architecture contains clients and services but no authentication component (OAuth, JWT, IdP, API key).',
      'Unauthenticated access exposes data and enables abuse.',
      'Add an auth service, OAuth/OIDC provider, or API-key validation in front of services.',
      nodes.filter(isService).map((n) => n.id).slice(0, 6));
  }

  for (const db of nodes.filter((n) => n.category === 'databases')) {
    const edgeProxies = ['networking.load-balancer', 'networking.api-gateway', 'networking.reverse-proxy', 'networking.waf', 'networking.firewall'];
    const exposed = edges.some((e) => {
      const src = nodeById(nodes, e.source);
      const tgt = nodeById(nodes, e.target);
      if (!src || !tgt) return false;
      const directToDb = e.target === db.id || e.source === db.id;
      if (!directToDb) return false;
      const other = e.source === db.id ? tgt : src;
      return other.category === 'clients' || (other.category === 'networking' && !edgeProxies.includes(other.type));
    });
    if (exposed) {
      finding('security', 'critical', 'Database may be exposed to clients',
        `${db.name || db.id} is connected directly to a client or internet-facing component without an edge proxy (load balancer / API gateway / WAF) in between.`,
        'Databases must not be reachable from the public network — this invites injection, credential theft, and data exfiltration.',
        'Route access through internal application services in a private subnet/VPC only.',
        [db.id]);
    }
  }

  const gateway = nodes.find((n) => ['networking.api-gateway', 'networking.load-balancer', 'networking.reverse-proxy'].includes(n.type));
  const serviceCount = nodes.filter(isService).length;
  if (serviceCount >= 3 && !gateway) {
    finding('security', 'suggestion', 'No API gateway or edge proxy',
      `${serviceCount} services are exposed without a central gateway.`,
      'Edge concerns (rate limiting, TLS termination, auth, routing) are duplicated per service.',
      'Add an API gateway or load balancer as the single ingress point.',
      nodes.filter(isService).map((n) => n.id).slice(0, 6));
  }
  if (gateway && !bool(gateway.properties, 'rateLimiting', false)) {
    finding('security', 'warning', 'No rate limiting at the edge',
      'The API gateway / load balancer does not enable rate limiting.',
      'Abusive or malfunctioning clients can saturate services.',
      'Enable per-client rate limiting at the gateway and add WAF rules.',
      [gateway.id]);
  }
  if (!nodes.some((n) => ['networking.waf', 'networking.firewall'].includes(n.type))) {
    finding('security', 'suggestion', 'No WAF or firewall component',
      'No Web Application Firewall or firewall exists between the internet and services.',
      'Common web attacks (SQLi, XSS, bot abuse) may reach the application layer.',
      'Place a WAF behind the CDN/load balancer and firewall public subnets.',
      []);
  }
  const secretsPresent = nodes.some((n) => ['security.secrets-manager', 'security.kms'].includes(n.type));
  if (hasAuth && !secretsPresent) {
    finding('security', 'suggestion', 'No secrets manager',
      'Authentication exists but no secrets manager/KMS component is present.',
      'API keys, signing secrets, and DB credentials may be stored insecurely.',
      'Add a secrets manager (e.g. Vault) and KMS for encryption keys.',
      []);
  }

  // ─────────────────────────── RELIABILITY ───────────────────────────
  for (const e of edges) {
    const rps = num(e.traffic, 'rps', 0) || num(e.traffic, 'peakRps', 0);
    if (e.syncMode !== 'async' && rps > 0) {
      if (num(e, 'retry', 0) <= 0) {
        finding('reliability', rps > 1000 ? 'warning' : 'suggestion', 'No retry policy',
          `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} carries ${rps.toLocaleString()} req/sec with no retry policy.`,
          'Transient failures cause immediate user-visible errors.',
          rps > 1000 ? 'Add a bounded retry policy with exponential backoff and jitter.' : 'Consider a small retry budget with exponential backoff.',
          [e.source, e.target], [e.id]);
      }
      if (num(e, 'timeout', 0) <= 0) {
        finding('reliability', 'suggestion', 'No timeout configured',
          `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} has no explicit timeout.`,
          'A hung dependency stalls the caller indefinitely.',
          'Configure a timeout below the dependency p99 latency.',
          [e.source, e.target], [e.id]);
      }
      if (rps > 5000 && !bool(e, 'circuitBreaker', false)) {
        finding('reliability', 'warning', 'Missing circuit breaker on hot path',
          `Connection ${nodeById(nodes, e.source)?.name || e.source} → ${nodeById(nodes, e.target)?.name || e.target} handles ${rps.toLocaleString()} req/sec without a circuit breaker.`,
          'A failing dependency cascades into the whole system.',
          'Add a circuit breaker with half-open recovery probing.',
          [e.source, e.target], [e.id]);
      }
    }
  }

  for (const q of nodes.filter(isMessageQueue)) {
    if (!bool(q.properties, 'deadLetterQueue', false)) {
      finding('reliability', 'warning', 'Queue has no dead-letter queue',
        `${q.name || q.id} has no DLQ configured.`,
        'Poison messages block consumption and are silently lost or stuck.',
        'Route failed messages to a DLQ with alerting and replay tooling.',
        [q.id]);
    }
  }

  // ─────────────────────────── DATA ───────────────────────────
  for (const db of nodes.filter((n) => n.category === 'databases')) {
    const props = db.properties || {};
    if (str(props, 'replication', 'none') === 'none') {
      finding('data', 'warning', 'No data replication',
        `${db.name || db.id} does not replicate data.`,
        'Data loss risk is concentrated on a single node.',
        'Enable replication and verify consistency behavior.',
        [db.id]);
    }
    const incoming = incomingTraffic(edges, db.id);
    if (incoming > 10000) {
      if (!bool(props, 'sharded', false)) {
        finding('data', 'warning', 'Write volume may exceed single-node capacity',
          `${db.name || db.id} is expected to handle ~${Math.round(incoming * 0.3).toLocaleString()} writes/sec but is not sharded.`,
          'Write throughput and storage growth are capped by a single node.',
          'Plan sharding (e.g. hash-based) before the volume is reached.',
          [db.id]);
      }
      if (!bool(props, 'partitioned', false) && !bool(props, 'sharded', false)) {
        finding('data', 'suggestion', 'Consider partitioning',
          `${db.name || db.id} handles large volume without partitioning.`,
          'Individual tables grow unbounded, degrading index and scan performance.',
          'Partition large tables by time or key range.',
          [db.id]);
      }
    }
    if (num(props, 'retentionDays', 0) <= 0 && nodes.some((n) => ['observability', 'analytics'].includes(n.category))) {
      finding('data', 'suggestion', 'No data retention policy',
        `${db.name || db.id} has no retention window configured while analytics/observability components exist.`,
        'Storage grows without bound and compliance requirements may not be met.',
        'Define a retention window and archiving strategy.',
        [db.id]);
    }
  }

  for (const c of nodes.filter(isCache)) {
    if (!bool(c.properties, 'persistence', false) && !str(c.properties, 'eviction', '')) {
      finding('data', 'suggestion', 'Cache eviction not configured',
        `${c.name || c.id} has no eviction policy configured.`,
        'Memory pressure may evict arbitrary keys or cause OOM failures.',
        'Configure an eviction policy (LRU/LFU) and monitor hit ratio.',
        [c.id]);
    }
  }

  // ─────────────────────────── SCORING ───────────────────────────
  const penalty = { critical: 6, warning: 4, suggestion: 1 };
  const cap = { critical: 12, warning: 8, suggestion: 3 };
  const categoryScores = {};
  for (const category of CATEGORIES) {
    const catFindings = findings.filter((f) => f.category === category);
    let ded = { critical: 0, warning: 0, suggestion: 0 };
    for (const f of catFindings) {
      ded[f.severity] = Math.min(ded[f.severity] + (penalty[f.severity] || 0), cap[f.severity] || 0);
    }
    const totalDed = Object.values(ded).reduce((a, b) => a + b, 0);
    categoryScores[category] = {
      score: Math.max(0, 20 - totalDed),
      max: 20,
      findingCount: catFindings.length,
    };
  }
  const overall = Math.round(
    CATEGORIES.reduce((sum, c) => sum + categoryScores[c].score, 0) / CATEGORIES.length
  );

  return {
    score: overall,
    categories: categoryScores,
    findings,
    summary: {
      critical: findings.filter((f) => f.severity === 'critical').length,
      warnings: findings.filter((f) => f.severity === 'warning').length,
      suggestions: findings.filter((f) => f.severity === 'suggestion').length,
    },
    health: {
      scalability: categoryScores.scalability.score >= 16 ? 'ok' : categoryScores.scalability.score >= 10 ? 'warn' : 'fail',
      availability: categoryScores.availability.score >= 16 ? 'ok' : categoryScores.availability.score >= 10 ? 'warn' : 'fail',
      performance: categoryScores.performance.score >= 16 ? 'ok' : categoryScores.performance.score >= 10 ? 'warn' : 'fail',
      security: categoryScores.security.score >= 16 ? 'ok' : categoryScores.security.score >= 10 ? 'warn' : 'fail',
      reliability: categoryScores.reliability.score >= 16 ? 'ok' : categoryScores.reliability.score >= 10 ? 'warn' : 'fail',
      data: categoryScores.data.score >= 16 ? 'ok' : categoryScores.data.score >= 10 ? 'warn' : 'fail',
    },
  };
};