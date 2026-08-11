# SYSTEM DESIGN STUDIO — COMPLETE FEATURE IMPLEMENTATION

You are working on an existing production-oriented project management and software architecture application.

The application already supports features such as:

* Project management
* Feature management
* Flow diagrams
* Database design
* Project documentation

I want to add a **complete System Design Studio** to the existing application.

This is NOT supposed to be a simple flowchart editor.

The goal is to build a **professional system-design creation and practice environment** where a developer can create anything from a simple CRUD architecture to a highly distributed system such as Netflix, YouTube, WhatsApp, Uber, Instagram, Amazon, etc.

The feature must support:

* HLD
* LLD
* System architecture diagrams
* Infrastructure architecture
* Distributed systems
* Microservices
* Databases
* Caching
* Messaging
* Networking
* Security
* Scalability
* Availability
* Observability
* System-design practice
* Design validation
* Architecture versioning
* Capacity estimation
* AI-assisted design analysis in the future

---

# 1. FIRST: UNDERSTAND THE EXISTING APPLICATION

Before writing code:

1. Inspect the entire existing codebase.
2. Understand:

   * Frontend architecture
   * Backend architecture
   * Database architecture
   * Authentication
   * Routing
   * State management
   * Existing diagram implementation
   * Existing UI components
   * Existing design system
   * Existing project/feature models
   * Existing API conventions
   * Existing folder structure
3. Identify reusable components.
4. Identify whether the application already uses a canvas/diagram library.
5. Reuse existing infrastructure wherever appropriate.
6. Do NOT create duplicate implementations of functionality that already exists.
7. Do NOT replace existing functionality.
8. Do NOT break existing features.

Before implementation, create a short internal implementation plan based on the actual codebase.

Do not blindly assume the project's stack or folder structure.

---

# 2. CORE PRODUCT CONCEPT

Add a new module:

## System Design Studio

It should be accessible from a project.

Example:

Project
├── Features
├── Flows
├── Database Design
├── System Design
└── Documentation

System Design should support multiple system-design documents/architectures per project.

Example:

Project: Conflux

System Designs:

* Authentication Architecture
* Chat Architecture
* Notification Architecture
* Complete System Architecture

---

# 3. SYSTEM DESIGN WORKSPACE

Create a professional full-screen/infinite-canvas workspace.

The workspace should contain:

### Left sidebar

Component library.

### Center

Infinite canvas.

### Right sidebar

Properties/configuration panel.

### Top toolbar

Actions such as:

* Save
* Undo
* Redo
* Zoom in
* Zoom out
* Fit to screen
* Grid toggle
* Snap toggle
* Fullscreen
* Export
* Validate
* Simulate
* Practice mode
* Version
* Presentation mode

The UI should feel like a combination of:

* Figma
* Excalidraw
* Lucidchart
* AWS architecture diagram tools
* Professional engineering design tools

Do NOT make it look like a generic CRUD dashboard.

---

# 4. INFINITE CANVAS

The canvas must support:

* Infinite horizontal/vertical workspace
* Pan
* Zoom
* Multi-select
* Drag
* Resize
* Duplicate
* Delete
* Copy/paste
* Undo/redo
* Snap-to-grid
* Alignment
* Distribution
* Grouping
* Lock/unlock
* Hide/show
* Minimap
* Selection box
* Keyboard shortcuts

Support common shortcuts:

* Delete
* Backspace
* Ctrl/Cmd + Z
* Ctrl/Cmd + Shift + Z
* Ctrl/Cmd + C
* Ctrl/Cmd + V
* Ctrl/Cmd + D
* Ctrl/Cmd + A
* Escape
* Space + drag for pan
* Mouse wheel zoom
* Shift for constrained movement

Make the canvas performant with large diagrams.

Do not build something that becomes unusable with 100+ nodes.

---

# 5. COMPONENT LIBRARY

Create a comprehensive component library.

Components must be categorized.

## CLIENTS

* Web Client
* Mobile Client
* Desktop Client
* IoT Device
* External Client
* External API Consumer

## NETWORKING

* DNS
* CDN
* Load Balancer
* Reverse Proxy
* API Gateway
* WAF
* Firewall
* NAT Gateway
* Service Mesh
* Internet
* VPC
* Subnet
* Availability Zone
* Region

## COMPUTE

* Server
* Virtual Machine
* Container
* Docker Container
* Kubernetes Pod
* Kubernetes Cluster
* Serverless Function
* Worker
* Background Worker
* Cron Job
* Auto Scaling Group

## APPLICATION SERVICES

* Monolith
* Microservice
* Auth Service
* User Service
* Payment Service
* Notification Service
* Search Service
* File Service
* Media Service
* Analytics Service
* Recommendation Service
* Custom Service

## DATABASES

Relational:

* PostgreSQL
* MySQL
* SQL Server

NoSQL:

* MongoDB
* DynamoDB
* Cassandra
* Couchbase

Graph:

* Neo4j

Search:

* Elasticsearch
* OpenSearch

Time series:

* InfluxDB

Other:

* Redis
* Memcached

## STORAGE

* Object Storage
* Block Storage
* File Storage
* Data Lake
* Backup Storage

## MESSAGING

* Kafka
* RabbitMQ
* Redis Streams
* Amazon SQS
* Pub/Sub
* Event Bus
* Message Queue
* Dead Letter Queue
* Topic
* Consumer Group

## COMMUNICATION

* REST API
* GraphQL
* gRPC
* WebSocket
* SSE
* TCP
* UDP

## SECURITY

* OAuth
* Identity Provider
* JWT
* API Key
* Secrets Manager
* KMS
* Certificate Authority
* Rate Limiter

## OBSERVABILITY

* Logging
* Metrics
* Distributed Tracing
* Monitoring
* Alerting
* SIEM

## CUSTOM

Allow the user to create custom components.

---

# 6. COMPONENT DESIGN

Every component must be a real typed object, NOT just an image/icon.

Internally each node should have something similar to:

```text
id
type
category
name
description
position
size
properties
metadata
style
locked
hidden
groupId
```

Do not hardcode component behavior directly into UI components.

Create a component-definition system.

For example:

```text
ComponentDefinition

type:
database.postgresql

category:
database

label:
PostgreSQL

icon:
...

defaultProperties:
...
```

This makes the component library extensible.

---

# 7. COMPONENT PROPERTIES

Clicking a component must open a properties panel.

Example:

## PostgreSQL

General:

* Name
* Description
* Version
* Environment

Architecture:

* Primary
* Replica
* Multi-primary
* Sharded
* Partitioned

Capacity:

* Reads/sec
* Writes/sec
* Storage
* Connections

Reliability:

* Replication
* Backup
* Failover
* Multi-AZ

Consistency:

* Strong
* Eventual

Additional:

* Region
* Availability Zone
* Tags
* Notes

---

# 8. REDIS PROPERTIES

Example:

Redis

Configuration:

* Standalone
* Sentinel
* Cluster

Nodes:

* Number of nodes
* Replicas

Capacity:

* Requests/sec
* Memory
* Hit ratio

Persistence:

* RDB
* AOF

Eviction:

* LRU
* LFU
* TTL

Availability:

* Multi-AZ
* Replication
* Failover

---

# 9. SERVICE PROPERTIES

For services:

* Service name
* Description
* Instances
* CPU
* Memory
* Requests/sec
* Average latency
* P95 latency
* P99 latency
* Protocol
* Port
* Timeout
* Retry policy
* Circuit breaker
* Auto scaling
* Region
* Availability zone

---

# 10. CONNECTIONS / EDGES

Connections must be first-class objects.

An edge should contain:

```text
id
source
target
protocol
direction
type
traffic
latency
payload
syncMode
retry
timeout
circuitBreaker
metadata
```

Connection types:

* HTTP
* HTTPS
* REST
* GraphQL
* gRPC
* TCP
* UDP
* WebSocket
* SSE
* Kafka
* Queue
* Event
* Database connection
* Cache connection

---

# 11. SYNC VS ASYNC

The user must be able to define whether communication is:

### Synchronous

```text
API Gateway ───────→ User Service
```

### Asynchronous

```text
Order Service - - -→ Kafka
```

Use visually different edge styles.

Allow:

* Solid line
* Dashed line
* Animated flow
* Direction arrows

---

# 12. CONNECTION PROPERTIES

When selecting an edge:

Show:

```text
Protocol:
REST

Traffic:
20,000 req/sec

Average payload:
20 KB

Latency:
p50: 30ms
p95: 80ms
p99: 150ms

Timeout:
5 sec

Retry:
3 attempts

Backoff:
Exponential

Circuit breaker:
Enabled

Mode:
Synchronous
```

---

# 13. GROUPS AND BOUNDARIES

Support nested architecture boundaries.

Examples:

```text
Internet
└── VPC
    ├── Public Subnet
    │   └── Load Balancer
    │
    └── Private Subnet
        ├── API Servers
        ├── Workers
        └── Databases
```

Support:

* Region
* VPC
* Availability Zone
* Subnet
* Kubernetes Cluster
* Namespace
* Service boundary
* Microservice boundary
* Custom boundary

Groups should be movable and resizable.

---

# 14. HLD / LLD LEVELS

The system must explicitly support architecture levels.

## Level 1 — System Context

Example:

```text
User
 ↓
Conflux
 ↓
Google
 ↓
Email Provider
```

## Level 2 — Container / Service Architecture

```text
Frontend
 ↓
API Gateway
 ↓
Auth Service
User Service
Chat Service
Notification Service
 ↓
Databases
```

## Level 3 — Component Architecture

Example:

```text
Chat Service

Controller
 ↓
Service
 ↓
Repository
 ↓
Redis
 ↓
MongoDB
```

## Level 4 — Detailed implementation

```text
Request
 ↓
Middleware
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Cache
 ↓
Database
```

Allow users to create links between levels.

---

# 15. DIAGRAM PAGES

A system design should support multiple pages/diagrams.

Example:

```text
System Design
│
├── Context
├── HLD
├── API Architecture
├── Database Architecture
├── Message Flow
├── Authentication Flow
├── Deployment Architecture
└── LLD
```

Each page has its own canvas.

---

# 16. SYSTEM DESIGN TEMPLATES

Provide starter templates.

Examples:

* Basic CRUD application
* REST API
* E-commerce
* Chat application
* URL shortener
* Social media
* Video streaming
* Ride sharing
* Food delivery
* Notification system
* Payment system
* File storage
* Search system
* Real-time collaboration
* Event-driven architecture
* Microservices architecture
* Multi-region architecture

Templates should be editable after creation.

---

# 17. SYSTEM DESIGN PATTERN LIBRARY

Create reusable architecture patterns.

At minimum:

* Cache Aside
* Write Through Cache
* Write Behind
* Read Replica
* Database Sharding
* Database Partitioning
* CQRS
* Event Sourcing
* Saga
* Outbox Pattern
* Pub/Sub
* Fanout
* Event-driven architecture
* Circuit Breaker
* Retry + Exponential Backoff
* Rate Limiting
* Distributed Lock
* Leader Election
* Consistent Hashing
* Bulkhead
* Idempotency
* API Gateway
* Service Discovery
* Blue-Green Deployment
* Canary Deployment

Users should be able to drag a pattern onto the canvas.

Patterns should be editable.

---

# 18. CUSTOM COMPONENTS

Users must be able to create:

```text
Create Component

Name:
Recommendation Engine

Category:
Application Service

Description:
Generates personalized recommendations

Icon:
Custom

Properties:
...
```

Save custom components to the project/workspace library.

---

# 19. SEARCH

Component library must have search.

Example:

Typing:

```text
redis
```

shows:

* Redis
* Redis Cluster
* Redis Streams

Typing:

```text
queue
```

shows:

* Kafka
* RabbitMQ
* SQS
* Message Queue

---

# 20. CAPACITY ESTIMATION

Add a capacity/calculation panel.

Users should be able to enter:

```text
Daily Active Users:
10,000,000

Requests/User/Day:
20

Peak Multiplier:
3

Average Payload:
20 KB
```

Calculate:

```text
Daily Requests
Average Requests/sec
Peak Requests/sec
Daily Bandwidth
Peak Bandwidth
Storage/day
Storage/year
```

Also allow:

* Read/write ratio
* Cache hit ratio
* Replication factor
* Data retention
* Average record size

Clearly show assumptions.

Do NOT pretend calculations are exact.

---

# 21. DESIGN VALIDATION

Add:

## Validate Design

The validator should analyze the architecture graph.

Categories:

### Scalability

Check:

* Horizontal scaling
* Stateless services
* Database bottlenecks
* Single-instance services
* Queue throughput
* Cache capacity

### Availability

Check:

* Single points of failure
* Database redundancy
* Service redundancy
* Multi-AZ
* Failover
* Backup

### Performance

Check:

* High-latency synchronous chains
* Missing cache
* Database overload
* Excessive network hops
* Large payloads

### Security

Check:

* Authentication
* Authorization
* TLS
* WAF
* Rate limiting
* Secrets
* Public database exposure

### Reliability

Check:

* Retry
* Timeout
* Circuit breaker
* Dead-letter queue
* Idempotency
* Disaster recovery

### Data

Check:

* Replication
* Partitioning
* Sharding
* Backup
* Retention
* Consistency

---

# 22. VALIDATION OUTPUT

Example:

```text
Design Score: 82/100

Scalability
17/20

Availability
15/20

Performance
18/20

Security
17/20

Reliability
15/20
```

Then show findings.

Example:

```text
CRITICAL

Single Point of Failure

PostgreSQL has only one instance.

Impact:
Database failure causes complete service outage.

Suggestion:
Add replication/failover.
```

Example:

```text
WARNING

Potential Database Bottleneck

User Service receives approximately
50K writes/sec but database capacity
is configured for 10K writes/sec.

Consider:
- partitioning
- sharding
- asynchronous processing
```

Do not produce fake precision.

Every validation rule must have an explainable reason.

---

# 23. DESIGN TRADE-OFFS

Allow users to record architectural decisions.

Example:

```text
Decision

Use Kafka instead of RabbitMQ.

Reason:

High event throughput and event replay
are required.

Trade-off:

Higher operational complexity.
```

This should be part of the system design.

---

# 24. ARCHITECTURE VERSIONING

System designs must support versions.

Example:

```text
v1
Initial architecture

v2
Added Redis

v3
Added Kafka

v4
Added database sharding
```

Allow:

* Create version
* Rename version
* Restore version
* Compare versions
* View change history

Version comparison should identify:

* Added nodes
* Removed nodes
* Changed connections
* Changed properties

---

# 25. PRACTICE MODE

This is a major feature.

Add:

## Practice System Design

The user selects:

```text
Beginner
Intermediate
Advanced
Expert
```

Then selects a problem.

Example:

```text
Design a URL Shortener

Users:
10M DAU

Read/write:
100:1

Availability:
99.99%

Requirements:
- Create short URL
- Redirect
- Analytics
- Expiration
```

Then:

### Start Practice

Open a blank canvas.

The user must build the architecture.

Do not automatically place the answer.

---

# 26. PRACTICE MODE REQUIREMENTS

During practice:

* Timer
* Requirements panel
* Notes
* Canvas
* Component library
* Capacity calculator
* Submit Design button

Allow the user to submit the design.

---

# 27. PRACTICE EVALUATION

After submission:

```text
System Design Score

Overall:
84/100

Requirements:
18/20

Scalability:
17/20

Availability:
15/20

Performance:
18/20

Data Design:
16/20
```

Show:

### What you did well

Specific architecture decisions.

### Problems

Specific missing components.

### Suggested improvements

Specific changes.

### Expected solution

Do NOT simply compare the diagram visually.

Evaluate based on architecture semantics.

---

# 28. PRACTICE HINT SYSTEM

Allow:

```text
Hint 1
Hint 2
Hint 3
```

Example:

```text
Hint:

Consider how your system handles
100K reads/sec for the same resource.
```

Another:

```text
Strong Hint:

A cache may be useful between
your application and database.
```

Track hints used.

Hints should affect the practice score if appropriate.

---

# 29. FAILURE / CHAOS MODE

Add an advanced mode:

## Chaos Mode

Allow users to simulate:

* Database failure
* Redis failure
* Kafka failure
* API server failure
* Network failure
* Load balancer failure
* Region failure
* High traffic
* Queue backlog
* Cache failure

Example:

```text
Redis DOWN

System response:

Redis unavailable
 ↓
Application fallback
 ↓
PostgreSQL

Database load:
+480%

Latency:
120ms → 680ms

Risk:
Database overload
```

Initially this can be a logical simulation rather than a real infrastructure simulation.

---

# 30. TRAFFIC SIMULATION

Allow users to define traffic.

Example:

```text
Traffic:

Normal:
20K req/sec

Peak:
100K req/sec
```

Show animated request flow through the architecture.

Display:

* Requests/sec
* Latency
* Error rate
* Queue depth
* Cache hit ratio
* Database utilization
* Instance utilization

Keep the simulation deterministic and explain that it is an estimation, not real benchmarking.

---

# 31. ARCHITECTURE HEALTH

Provide an architecture health panel.

Example:

```text
Architecture Health

Scalability       ✓
Availability      ⚠
Security          ✓
Performance       ⚠
Reliability       ✓

Critical Issues: 1
Warnings: 4
Suggestions: 7
```

---

# 32. AI-READY ARCHITECTURE MODEL

Even if AI functionality is not implemented immediately, structure the system so an AI assistant can later analyze the architecture.

The AI should eventually be able to answer:

> Is this architecture scalable to 10M users?

> What is the biggest bottleneck?

> Why is Kafka being used here?

> What happens if Redis goes down?

> How can I reduce the cost?

> Convert this architecture to a multi-region architecture.

> Explain this architecture.

> Generate HLD documentation.

> Generate LLD from this service.

> Generate API design from this architecture.

> Generate database schema from this architecture.

The underlying architecture graph must therefore contain enough semantic information for these operations.

---

# 33. ARCHITECTURE GRAPH MODEL

Do NOT treat the canvas as the source of truth.

The architecture itself should be represented as structured data.

Conceptually:

```text
Architecture
│
├── nodes[]
│
├── edges[]
│
├── groups[]
│
├── pages[]
│
├── patterns[]
│
├── assumptions[]
│
├── requirements[]
│
├── decisions[]
│
└── metadata
```

Node:

```text
{
  id,
  type,
  category,
  name,
  properties,
  position,
  size,
  pageId,
  groupId
}
```

Edge:

```text
{
  id,
  source,
  target,
  type,
  protocol,
  syncMode,
  properties
}
```

This is essential.

The visual canvas should render this graph.

---

# 34. AUTOSAVE

System designs should autosave.

Requirements:

* Debounced saving
* Save indicator
* Saving
* Saved
* Unsaved changes
* Error state
* Recovery after refresh

Do not save on every pixel movement.

Use debouncing/batching.

---

# 35. OFFLINE / RECOVERY

If practical with the existing architecture:

* Preserve unsaved local state
* Recover draft after accidental refresh
* Warn before leaving with unsaved changes

Do not lose a large architecture because of a network failure.

---

# 36. EXPORT

Support:

* PNG
* SVG
* PDF
* JSON

JSON export should contain the complete semantic architecture.

Example:

```text
Export Architecture JSON
```

This allows future import/version migration.

---

# 37. IMPORT

Allow importing previously exported architecture JSON.

Validate the schema before importing.

Do not blindly trust imported data.

---

# 38. PRESENTATION MODE

Add a presentation mode.

The user can present:

```text
Context
 ↓
HLD
 ↓
Services
 ↓
Database
 ↓
Message Flow
 ↓
Failure Handling
```

Hide editor controls.

Allow:

* Zoom
* Pan
* Next section
* Previous section
* Fullscreen

---

# 39. MINIMAP

Add a minimap for large architectures.

It should show:

* Nodes
* Groups
* Current viewport

Clicking minimap should navigate to that region.

---

# 40. UI/UX REQUIREMENTS

The interface must be:

* Professional
* Production-grade
* Developer-focused
* Desktop-first for the canvas
* Responsive where practical
* Dark-mode compatible if existing application supports it
* Consistent with the existing application's design system

Avoid:

* Excessive gradients
* Huge rounded cards
* Generic SaaS landing-page styling
* Excessive animations
* Unnecessary popups
* Clutter

The canvas should be the primary focus.

Use subtle visual hierarchy.

---

# 41. PERFORMANCE

This feature can potentially contain hundreds of nodes.

Optimize for:

* Large diagrams
* Dragging
* Zooming
* Panning
* Selection
* Rendering
* Autosave
* Undo/redo

Avoid unnecessary React re-renders or equivalent framework-level rendering issues.

Do not store huge transient canvas state in inefficient ways.

Separate:

* Persistent architecture state
* UI state
* Selection state
* Interaction state

---

# 42. UNDO / REDO

Undo/redo must work for:

* Add node
* Delete node
* Move node
* Resize node
* Edit node
* Add edge
* Delete edge
* Edit edge
* Group
* Ungroup
* Paste
* Duplicate
* Pattern insertion

Use a robust command/history architecture instead of random state snapshots if the existing architecture allows it.

---

# 43. KEYBOARD SHORTCUTS

Support professional shortcuts.

Examples:

```text
Delete
Ctrl/Cmd + Z
Ctrl/Cmd + Shift + Z
Ctrl/Cmd + C
Ctrl/Cmd + V
Ctrl/Cmd + D
Ctrl/Cmd + A
Escape
Space + drag
```

Show shortcuts in tooltips where useful.

---

# 44. DATABASE PERSISTENCE

Design persistence carefully.

Do not store the entire architecture as an uncontrolled giant blob if the existing backend architecture makes structured persistence practical.

Separate logical entities appropriately.

Potential structure:

```text
SystemDesign
SystemDesignPage
SystemDesignNode
SystemDesignEdge
SystemDesignVersion
SystemDesignDecision
SystemDesignPractice
SystemDesignTemplate
CustomComponent
```

However, adapt this to the existing project's database architecture.

Do not blindly use this exact schema.

Ensure:

* Project ownership
* User permissions
* Validation
* Indexing
* Efficient querying
* Version consistency

---

# 45. SECURITY

Follow the existing authentication and authorization architecture.

Users must not be able to:

* Access another project's designs
* Modify another user's design
* Import malicious payloads
* Bypass project permissions

Validate all important data server-side.

Do not rely only on frontend validation.

---

# 46. API DESIGN

Follow the existing API conventions.

Potential endpoints:

```text
GET    /projects/:projectId/system-designs
POST   /projects/:projectId/system-designs

GET    /system-designs/:id
PATCH  /system-designs/:id
DELETE /system-designs/:id

GET    /system-designs/:id/pages
POST   /system-designs/:id/pages

PATCH  /system-design-pages/:id

POST   /system-designs/:id/validate
POST   /system-designs/:id/versions

GET    /system-designs/:id/versions
POST   /system-designs/:id/practice/submit
```

These are examples only.

Use the application's existing API architecture and naming conventions.

---

# 47. VALIDATION ENGINE ARCHITECTURE

Do NOT hardcode validation directly into UI components.

Create a rule-based validation engine.

Conceptually:

```text
ValidationEngine
│
├── ScalabilityRules
├── AvailabilityRules
├── PerformanceRules
├── SecurityRules
├── ReliabilityRules
└── DataRules
```

Each rule should return something like:

```text
severity
title
description
affectedNodes
affectedEdges
recommendation
```

This makes the system extensible.

---

# 48. PRACTICE QUESTION MODEL

Practice problems should be structured.

Example:

```text
PracticeProblem

title
description
difficulty

requirements
functionalRequirements
nonFunctionalRequirements

traffic
storage
availability
latency

evaluationCriteria

expectedPatterns

hints

referenceArchitecture
```

Do not expose the reference architecture before submission.

---

# 49. SEED PRACTICE PROBLEMS

Create at least:

### Beginner

1. URL Shortener
2. Simple File Upload
3. Basic E-commerce API
4. Notification Service

### Intermediate

5. Chat Application
6. Food Delivery
7. Ride Booking
8. Payment Processing

### Advanced

9. Instagram
10. YouTube
11. Netflix
12. WhatsApp
13. Uber
14. Distributed Search
15. Real-time Collaboration

### Expert

16. Multi-region social platform
17. Global video streaming platform
18. Large-scale messaging platform
19. Global payment infrastructure
20. Distributed event-processing platform

Do not claim there is only one correct architecture.

Evaluation should focus on whether the design satisfies the requirements and trade-offs.

---

# 50. SYSTEM DESIGN DOCUMENTATION

Every architecture should be able to generate a structured documentation view.

Example:

```text
# System Architecture

## Requirements

...

## Architecture

...

## Components

...

## Data Flow

...

## Database

...

## Caching

...

## Messaging

...

## Scalability

...

## Availability

...

## Security

...

## Failure Handling

...

## Trade-offs

...
```

For now, generate this from structured data without requiring AI.

---

# 51. FEATURE INTEGRATION

This feature must integrate with the existing application.

For example, if a project has:

```text
Feature:
Real-time Chat
```

the system design should be able to link to:

```text
System Design:
Chat Architecture
```

Similarly:

```text
Feature
 ↔ System Design
 ↔ Flow Diagram
 ↔ Database Design
 ↔ API
```

Use IDs/references rather than duplicated data.

---

# 52. CROSS-MODULE NAVIGATION

From a system-design node such as:

```text
MongoDB
```

the user should eventually be able to navigate to the corresponding database design.

From:

```text
Chat Service
```

navigate to the related feature.

From:

```text
Authentication Flow
```

navigate to the corresponding flow diagram.

Build the data model so these relationships are possible.

---

# 53. NO FUNCTIONALITY REGRESSIONS

Critical rule:

DO NOT modify or break existing functionality unnecessarily.

Do not:

* Rewrite existing authentication
* Rewrite existing state management
* Replace existing diagram implementation without reason
* Change existing APIs unnecessarily
* Change existing database schemas unnecessarily
* Remove existing components
* Change unrelated UI

Reuse existing systems wherever possible.

---

# 54. IMPLEMENTATION STRATEGY

Do NOT attempt to create every advanced feature in one giant uncontrolled implementation.

Implement in phases while keeping the feature usable after every phase.

## Phase 1

Foundation:

* System Design module
* Routing
* Data model
* Canvas
* Node system
* Edge system
* Basic persistence

## Phase 2

Component library:

* Networking
* Compute
* Services
* Databases
* Storage
* Messaging
* Security

## Phase 3

Canvas capabilities:

* Groups
* Multi-select
* Resize
* Alignment
* Minimap
* Undo/redo
* Keyboard shortcuts
* Copy/paste

## Phase 4

Properties:

* Node properties
* Edge properties
* Configuration panels

## Phase 5

Architecture levels:

* Context
* HLD
* LLD
* Multiple pages

## Phase 6

Patterns:

* Cache
* Sharding
* CQRS
* Kafka
* Saga
* etc.

## Phase 7

Capacity estimation.

## Phase 8

Validation engine.

## Phase 9

Practice mode.

## Phase 10

Versioning.

## Phase 11

Simulation/Chaos mode.

## Phase 12

Export/import/presentation.

---

# 55. DEVELOPMENT PROCESS

Before coding each phase:

1. Inspect existing implementation.
2. Identify reusable code.
3. Design the data model.
4. Implement backend support where required.
5. Implement frontend.
6. Integrate with existing UI.
7. Test.
8. Fix issues.
9. Only then move to the next phase.

Do not leave broken intermediate code.

---

# 56. TESTING

Add tests where the existing project has a testing setup.

Test:

### Canvas

* Node creation
* Node deletion
* Movement
* Selection
* Edge creation
* Edge deletion

### Persistence

* Save
* Load
* Autosave
* Recovery

### Validation

* Rules
* Severity
* Affected nodes
* Recommendations

### Practice

* Submission
* Scoring
* Hints
* Results

### Security

* Project access
* Authorization
* Invalid IDs
* Invalid imported data

---

# 57. ERROR HANDLING

Every operation must handle failure gracefully.

Examples:

```text
Unable to save architecture.
Retry
```

```text
Unable to validate design.
Try again.
```

```text
Invalid architecture file.
Import cancelled.
```

Never silently lose user work.

---

# 58. EMPTY STATES

Create useful empty states.

Example:

```text
No System Designs

Create your first architecture.

[Create System Design]
```

Canvas:

```text
Your canvas is empty.

Drag a component from the library
or choose a template to get started.
```

---

# 59. LOADING STATES

Use proper skeleton/loading states.

Do not freeze the entire UI while:

* Loading architecture
* Saving
* Validating
* Exporting
* Importing

---

# 60. RESPONSIVE BEHAVIOR

The architecture editor is primarily a desktop experience.

For smaller screens:

Do not try to force the complete canvas into a tiny layout.

Instead provide a sensible responsive layout:

* Collapsible component library
* Collapsible properties panel
* Mobile/tablet toolbar
* Horizontal/vertical scrolling where required

Prioritize usability.

---

# 61. DESIGN QUALITY

The result must look like a serious developer tool.

Think:

```text
Engineering IDE
+
Architecture Designer
+
System Design Practice Platform
```

Not:

```text
Generic task management dashboard
```

Use consistent:

* Typography
* Spacing
* Borders
* Icons
* Context menus
* Tooltips
* Panels
* Dialogs
* Keyboard interactions

Follow the existing project's design system.

---

# 62. IMPORTANT ARCHITECTURAL PRINCIPLE

The most important requirement:

### The diagram must be semantic.

Do NOT implement this as:

```text
icon + coordinates + arrow
```

Implement it as:

```text
semantic architecture graph
        ↓
visual canvas
        ↓
validation
        ↓
simulation
        ↓
practice evaluation
        ↓
documentation
        ↓
future AI analysis
```

The same underlying architecture should power all these features.

---

# 63. DO NOT FAKE ADVANCED FEATURES

Do not create UI that appears to work but does not.

For example:

Bad:

```text
[Validate Design]
```

which simply returns:

```text
Your design looks good!
```

Good:

The validation engine actually analyzes:

* Nodes
* Edges
* Properties
* Requirements
* Capacity
* Dependencies

and produces explainable findings.

Likewise, practice scoring must actually evaluate the architecture rather than randomly generating a score.

---

# 64. DO NOT OVERENGINEER THE FIRST VERSION

Build a solid foundation first.

The first usable version MUST allow:

```text
Create System Design
        ↓
Open Canvas
        ↓
Drag Components
        ↓
Connect Components
        ↓
Configure Components
        ↓
Create Groups
        ↓
Save
        ↓
Reload
        ↓
Edit
        ↓
Export
```

Then build advanced capabilities on top of this.

---

# 65. FINAL ACCEPTANCE CRITERIA

The feature is considered successfully implemented only when a user can do this:

```text
Create Project
      ↓
Create System Design
      ↓
Choose HLD / LLD
      ↓
Open Infinite Canvas
      ↓
Drag:
  Client
  DNS
  CDN
  Load Balancer
  API Gateway
  Services
  Redis
  Kafka
  Database
      ↓
Connect Components
      ↓
Configure Traffic
      ↓
Configure Capacity
      ↓
Create VPC / Subnets
      ↓
Create Multiple Pages
      ↓
Save Architecture
      ↓
Validate Design
      ↓
View Problems
      ↓
Fix Architecture
      ↓
Create Version
      ↓
Compare Versions
      ↓
Enter Practice Mode
      ↓
Solve System Design Problem
      ↓
Submit
      ↓
Receive Architecture Evaluation
```

The implementation should feel like a **real engineering tool**, not a demo.

---

# 66. FINAL INSTRUCTION TO THE AI AGENT

Start by inspecting the existing codebase.

Do NOT immediately write code.

First determine:

1. Existing architecture
2. Existing diagram/canvas implementation
3. Existing project model
4. Existing authentication/authorization
5. Existing database
6. Existing state management
7. Existing UI component system
8. Existing API patterns

Then produce a concise implementation plan mapping the above requirements to the actual codebase.

After that, implement the feature incrementally.

Before modifying an existing file, understand why it exists.

Reuse existing components and patterns.

Keep the implementation modular.

Do not duplicate logic.

Do not break existing functionality.

Do not use placeholder implementations for core functionality.

After each major phase:

* Run the project's tests/build/lint if available.
* Fix errors.
* Verify existing functionality still works.
* Verify the new feature works.

At the end, provide:

1. Files created
2. Files modified
3. Database changes
4. API changes
5. Major architectural decisions
6. Features implemented
7. Features intentionally deferred
8. Tests performed
9. Any known limitations
10. Instructions for running/migrating the feature

Most importantly:

**Build the System Design Studio as a semantic architecture platform whose canvas is only the visual representation of the underlying architecture graph.**

That foundation must remain extensible enough to support HLD, LLD, validation, capacity estimation, practice evaluation, simulation, versioning, and future AI-powered system-design analysis.
