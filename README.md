<div align="center">

# FlowForge AI

**Enterprise AI Workflow Orchestration with Human-in-the-Loop Safety**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?style=flat-square&logo=vercel)](https://flow-forge-ai-sooty.vercel.app/)

[Live Demo](https://flow-forge-ai-sooty.vercel.app/) • [API Reference](#api-reference) • [Deployment Guide](#deployment) • [Architecture](#system-architecture)

</div>

---

## Overview

FlowForge AI is a production-grade platform for building, executing, and observing AI-powered business workflows. It treats automation as an engineered system — not a black box — by giving teams precise control over when autonomous processes run, when they pause for human review, and exactly why each decision was made.

**Core design principles:**

- **Stateless Execution** — The engine holds no in-memory state between steps. Execution can be resumed, retried, or replayed at any time by replaying the event log stored in the database.
- **Event-Sourced Logging** — Every step transition, AI inference, approval decision, and failure is recorded as an immutable log entry with a timestamp, payload, and human-readable reason.
- **Human-in-the-Loop by Design** — Approval gates are first-class workflow nodes, not a bolt-on. They suspend execution gracefully and resume exactly where they left off after a reviewer acts.
- **Idempotent Steps** — Before any write-producing action executes, a composite idempotency key (`runId:stepId`) is checked against a dedicated collection. Duplicate executions from retries or crashes never produce duplicate side effects.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [System Design](#system-design)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Workflow Lifecycle](#workflow-lifecycle)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Performance](#performance)
- [Screenshots](#screenshots)
- [Known Limitations](#known-limitations)
- [Production Roadmap](#production-roadmap)

---

## System Architecture

FlowForge AI follows a layered, serverless-first architecture. Each layer has a single, clearly bounded responsibility.

```
┌────────────────────────────────────────────────────────────────┐
│                       Browser Client                          │
│   Next.js App Router · Zustand · TanStack Query               │
└──────────────────────────┬─────────────────────────────────────┘
                           │  REST / JSON
┌──────────────────────────▼─────────────────────────────────────┐
│                      API Layer                                 │
│   Next.js Route Handlers · Zod Validation · Error Middleware   │
└──────────────────────────┬─────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                    Workflow Engine                              │
│   WorkflowEngine · ExecutorFactory · Strategy Pattern          │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│   │  AI Executor │  │ Human Approval │  │ Condition Engine  │  │
│   │  (Gemini)    │  │ (Suspend/Wake) │  │ (Rules Evaluator) │  │
│   └──────────────┘  └────────────────┘  └───────────────────┘  │
└──────────────────────────┬─────────────────────────────────────┘
                           │  Mongoose ODM
┌──────────────────────────▼─────────────────────────────────────┐
│                     Data Layer                                 │
│   MongoDB Atlas · Workflow · Run · StepExecution · Approval    │
└────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                  External Services                             │
│          Google Gemini API · (Optional) Message Queue          │
└────────────────────────────────────────────────────────────────┘
```

---

## System Design

### Execution Engine

The core of FlowForge is `WorkflowEngine`, which implements an **event-sourcing reducer loop**:

1. **Snapshot** — On each step, load the full `WorkflowRun` including its log of completed `StepExecution` records.
2. **Replay** — Re-derive the current execution state by replaying the log. Completed steps are skipped.
3. **Advance** — Identify the next node to execute by walking the workflow graph from the current execution path.
4. **Execute** — Dispatch to the appropriate `WorkflowStepExecutor` via `ExecutorFactory` (Strategy pattern).
5. **Persist** — Write the result as an immutable `StepExecution` log entry.

This design means the engine is **crash-safe by default**. If a serverless function times out mid-execution, the next invocation picks up exactly where the previous one left off — no state is lost.

### Step Executors

Each node type maps to a dedicated executor class implementing the `WorkflowStepExecutor` interface:

| Step Type | Executor | Responsibility |
|---|---|---|
| `STRUCTURED_INPUT` | `InputExecutor` | Validate and pass initial trigger payload |
| `DOCUMENT_RETRIEVAL` | `RetrievalExecutor` | Fetch context documents from configured sources |
| `AI_EXTRACTION` | `ExtractionExecutor` | LLM-based structured data extraction with schema validation |
| `AI_CLASSIFICATION` | `ClassificationExecutor` | LLM-based classification against defined label sets |
| `DETERMINISTIC_CONDITION` | `ConditionExecutor` | Boolean rule evaluation on payload fields |
| `HUMAN_APPROVAL` | `ApprovalExecutor` | Suspend execution, create approval record, wait for resume |
| `MOCK_EXTERNAL_ACTION` | `MockActionExecutor` | Idempotent write to external systems (CRM, DB, API) |
| `FINAL_REPORT` | `ReportExecutor` | Aggregate execution results into a structured final output |

### AI Safety Layer

All LLM interactions are routed through `AIService`, which wraps any `AIProvider` implementation:

- **Retry with backoff** — Up to 3 retries on 429/503 responses with exponential delay.
- **Structured output enforcement** — All prompts demand JSON responses. Raw text responses are rejected and cause a step failure rather than passing unparsed data downstream.
- **Provider abstraction** — `GeminiProvider` implements `AIProvider`. Swapping to OpenAI or Anthropic requires only a new provider class — the executor layer is unchanged.
- **Reasoning capture** — The `reason` field on every AI log entry records the model's stated justification for its output, enabling full decision auditability.

### Human Approval Flow

```
Engine hits HUMAN_APPROVAL node
         │
         ▼
Create ApprovalRequest (status: PENDING)
         │
         ▼
Suspend WorkflowRun (status: PAUSED)
         │
         ▼
Reviewer acts via Dashboard or API
         │
    ┌────┴────┐
APPROVE     REJECT
    │           │
    ▼           ▼
Resume run   Fail run
(engine      (log rejection
 replays,     reason, stop)
 skips done
 steps)
```

### Idempotency

Before any executor that produces external side effects runs, a `IdempotencyRecord` is checked:

```typescript
key = `${runId}:${nodeId}`
```

If a record exists for this key, the step is skipped and the previous result is replayed. This ensures that retries, serverless cold starts, and manual re-triggers never duplicate writes to downstream systems.

### Version Control

Every call to update a workflow creates a new, immutable `WorkflowVersion` document containing a complete snapshot of the graph topology (`nodes`, `edges`, `config`). Workflow runs are permanently pinned to the exact `WorkflowVersion` that was live when they were triggered. Historical runs can never be affected by subsequent workflow edits.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript 5.x | End-to-end type safety |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animations** | Framer Motion | Premium UI transitions |
| **Canvas** | React Flow (`@xyflow/react`) | Drag-and-drop workflow graph |
| **State** | Zustand | Client-side local state |
| **Server State** | TanStack Query | API data fetching, caching, polling |
| **Database** | MongoDB Atlas (Mongoose) | Document persistence |
| **Validation** | Zod | Runtime schema validation on all API inputs |
| **AI Provider** | Google Gemini API | LLM inference (extracton, classification) |
| **Testing** | Vitest | Unit and integration tests |
| **Deployment** | Vercel | Serverless hosting |

---

## Folder Structure

```
FlowForge-AI/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Authenticated app pages
│   │   │   ├── dashboard/          # Overview, metrics, recent runs
│   │   │   ├── workflows/          # Workflow list, create, [id] editor
│   │   │   ├── executions/         # All execution history
│   │   │   ├── approvals/          # Pending approval queue
│   │   │   ├── history/            # Grouped execution history with detail panel
│   │   │   └── settings/           # API key configuration
│   │   ├── (marketing)/            # Public landing page
│   │   └── api/
│   │       ├── workflows/          # CRUD + versioning + execute
│   │       ├── runs/               # Start, status, logs, cancel, retry, resume
│   │       ├── approvals/          # List pending, approve/reject
│   │       ├── history/            # Grouped run history
│   │       ├── settings/           # Read/write settings
│   │       └── developer/          # Seed and clear data (dev only)
│   │
│   ├── components/
│   │   ├── execution/              # ExecutionMonitor, LogsViewer
│   │   ├── layout/                 # AppLayout, Sidebar
│   │   ├── marketing/              # Hero, FeaturesSection, FAQ, etc.
│   │   ├── providers/              # QueryClientProvider, ToastProvider
│   │   ├── skeletons/              # SkeletonCard, SkeletonGraph, etc.
│   │   ├── ui/                     # Badge, Button, Card, Dialog, Skeleton...
│   │   └── workflow/               # WorkflowBuilder, ConfigPanel, CustomNodes
│   │
│   ├── server/
│   │   ├── ai/                     # AIProvider interface, AIService, GeminiProvider
│   │   ├── engine/                 # WorkflowEngine, ExecutorFactory
│   │   ├── executors/              # One executor per step type
│   │   ├── helpers/                # conditionEvaluator, encryptionHelper, hashHelper
│   │   ├── interfaces/             # ExecutionContext, ExecutionResult
│   │   └── services/               # LoggingService
│   │
│   ├── models/                     # Mongoose schemas
│   │   ├── Workflow.ts
│   │   ├── WorkflowVersion.ts
│   │   ├── WorkflowRun.ts
│   │   ├── StepExecution.ts
│   │   ├── Approval.ts
│   │   ├── IdempotencyRecord.ts
│   │   ├── Settings.ts
│   │   └── MockAction.ts
│   │
│   ├── repositories/               # Data access objects (DAOs)
│   ├── validators/                 # Zod schemas for API request bodies
│   ├── types/                      # Shared TypeScript interfaces and enums
│   ├── lib/                        # API client, DB connection, utils
│   ├── utils/                      # General-purpose utility functions
│   └── __tests__/                  # Vitest test suites
│
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Workflow Lifecycle

```
┌─────────────┐
│   DRAFTING  │  User assembles nodes and edges in the visual canvas
└──────┬──────┘
       │ Save
       ▼
┌─────────────┐
│  PUBLISHED  │  Creates immutable WorkflowVersion snapshot
└──────┬──────┘
       │ Trigger (API / UI)
       ▼
┌─────────────┐
│   RUNNING   │  Engine walks the graph, executes steps sequentially
└──────┬──────┘
       │ Hits HUMAN_APPROVAL node
       ▼
┌─────────────┐
│   PAUSED    │  Execution suspended. ApprovalRequest created.
└──────┬──────┘
       │ Reviewer approves / rejects
       ▼
┌──────────────────────────────┐
│ RUNNING (resumed) / FAILED   │  Engine replays log, resumes from last step
└──────┬───────────────────────┘
       │
  ┌────┴────┐
  ▼         ▼
COMPLETED  FAILED   Execution trace stored with full step logs and reasons
```

---

## API Reference

All endpoints return `{ success: true, data: ... }` on success, or `{ success: false, error: { code, message, field? } }` on failure.

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows` | List all workflows |
| `POST` | `/api/workflows` | Create a workflow |
| `GET` | `/api/workflows/[id]` | Get a specific workflow |
| `PUT` | `/api/workflows/[id]` | Update workflow (creates new version) |
| `DELETE` | `/api/workflows/[id]` | Delete a workflow |
| `POST` | `/api/workflows/[id]/execute` | Trigger a new execution |
| `GET` | `/api/workflows/[id]/versions` | List all versions |
| `GET` | `/api/workflows/[id]/versions/compare` | Diff two versions |

### Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/runs` | Start a new workflow run |
| `GET` | `/api/runs/[id]` | Get run status and metadata |
| `GET` | `/api/runs/[id]/logs` | Fetch step execution logs |
| `POST` | `/api/runs/[id]/cancel` | Cancel a running execution |
| `POST` | `/api/runs/[id]/retry` | Retry a failed run |
| `POST` | `/api/runs/[id]/resume` | Resume a paused run (post-approval) |

### Approvals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/approvals` | List all pending approval requests |
| `POST` | `/api/approvals/[id]` | Approve or reject a request |

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/history` | Fetch grouped execution history |
| `POST` | `/api/history/[id]/rerun` | Re-run a completed execution |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Retrieve current settings |
| `POST` | `/api/settings` | Update settings (API keys, model) |

---

## Database Schema

### `Workflow`
Top-level workflow container. Holds metadata only.

```typescript
{
  _id: ObjectId
  name: string
  description: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  currentVersionId: ObjectId        // ref: WorkflowVersion
  createdAt: Date
  updatedAt: Date
}
```

### `WorkflowVersion`
Immutable snapshot of graph topology. Never mutated after creation.

```typescript
{
  _id: ObjectId
  workflowId: ObjectId              // ref: Workflow
  version: number                   // auto-incremented
  nodes: WorkflowNode[]             // complete node definitions
  edges: WorkflowEdge[]             // complete edge definitions
  createdAt: Date
}
```

### `WorkflowRun`
Runtime state of a single execution instance.

```typescript
{
  _id: ObjectId
  workflowVersionId: ObjectId       // pinned to exact version
  workflowId: ObjectId
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  input: Record<string, unknown>    // trigger payload
  output: Record<string, unknown>   // final report output
  executionPath: string[]           // ordered list of executed node IDs
  durationMs: number
  error: string
  startedAt: Date
  completedAt: Date
}
```

### `StepExecution`
Append-only event log for each node execution within a run.

```typescript
{
  _id: ObjectId
  runId: ObjectId                   // ref: WorkflowRun
  stepId: string                    // node ID from workflow graph
  eventType: EventType              // STEP_STARTED | STEP_COMPLETED | AI_REQUEST | ...
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  reason: string                    // AI/human-readable explanation
  payload: Record<string, unknown>
  metadata: { latencyMs, tokens, model, ... }
  timestamp: Date
}
```

### `Approval`
Tracks pending human-in-the-loop decisions.

```typescript
{
  _id: ObjectId
  runId: ObjectId
  stepId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  aiOutput: Record<string, unknown> // AI result awaiting review
  reviewerComment: string
  resolvedAt: Date
  createdAt: Date
}
```

### `IdempotencyRecord`
Prevents duplicate side effects on retry.

```typescript
{
  _id: ObjectId
  key: string                       // `${runId}:${stepId}`
  result: Record<string, unknown>   // cached executor output
  createdAt: Date                   // TTL-indexed for automatic cleanup
}
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# ── Database ──────────────────────────────────────────────────
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/flowforge"

# ── AI Provider ───────────────────────────────────────────────
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-1.5-pro"       # Optional — defaults to gemini-1.5-pro

# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note:** API keys can also be configured at runtime through the Settings page without redeployment. Keys stored via the UI are encrypted at rest using AES-256-GCM via the `encryptionHelper`.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18.x
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Google Gemini API key ([get one free](https://aistudio.google.com/))

### Installation

```bash
git clone https://github.com/swayam0/FlowForge-AI.git
cd FlowForge-AI
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and Gemini API key

# Seed the demo workflow (Support Ticket Triage)
npm run seed:demo

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

The test suite uses **Vitest** with a real MongoDB test database connection (configured in `src/__tests__/setup/db.ts`).

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage report
npm run test -- --coverage
```

### Test Coverage Areas

| Area | Files |
|------|-------|
| API Routes | `__tests__/api/workflows.test.ts`, `runs.test.ts`, `history.test.ts`, `settings.test.ts` |
| Engine | `__tests__/server/engine/WorkflowEngine.test.ts` |
| Executors | `__tests__/server/executors/MockActionExecutor.test.ts` |
| AI Layer | `__tests__/server/ai/AIService.test.ts`, `GeminiProvider.test.ts` |
| Models | `__tests__/server/workflow.schema.test.ts` |
| Repositories | `__tests__/repositories/WorkflowRepository.test.ts` |
| Validators | `__tests__/validators/serialization.ts` |

### Build Validation

```bash
# Type-check and production build
npm run build
```

---

## Deployment

### Vercel (Recommended)

FlowForge AI is designed for zero-configuration Vercel deployment:

1. **Import** the repository into Vercel.
2. **Set environment variables** — `MONGODB_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
3. **Deploy** — Vercel auto-detects Next.js and configures serverless functions.

Because the engine is stateless and resumes execution via database log replay, it performs correctly in serverless environments with no additional infrastructure.

```bash
# Production build (validate before deploy)
npm run build

# Deploy to Vercel
npx vercel --prod
```

### Self-Hosted (Docker)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

### Long-Running Workflows

For workflows expected to exceed serverless function timeout limits (typically 60s on Vercel), the recommended architecture is:

1. API route receives trigger → dispatches run ID to a message queue (Upstash Kafka, AWS SQS, Inngest).
2. A dedicated consumer worker calls the engine with the run ID.
3. Engine resumes execution from the database log.

This is not required for typical workflows (< 30s total execution time).

---

## Security Notes

### API Key Storage

Gemini API keys configured via the Settings page are **never stored in plaintext**. They are:

1. Encrypted using **AES-256-GCM** before being written to MongoDB (`encryptionHelper.ts`).
2. Decrypted in-memory only at the moment the AI provider is instantiated.
3. Never returned in any API response — the GET `/api/settings` endpoint returns a masked version.

### Input Validation

Every `POST`, `PUT`, and `PATCH` request body is validated against a Zod schema before reaching business logic. Validation failures return structured `400` errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name is required",
    "field": "name"
  }
}
```

### Access Control Considerations

The current implementation does not include authentication. For production deployment, the following additions are strongly recommended:

- **Authentication** — Integrate [Clerk](https://clerk.com/) or [NextAuth.js](https://next-auth.js.org/) for user sessions.
- **Authorization** — Add per-workflow RBAC (roles: `OWNER`, `EDITOR`, `VIEWER`, `APPROVER`).
- **Rate Limiting** — Add request-level rate limiting (e.g., Upstash Ratelimit) on execution trigger endpoints to prevent abuse.
- **Secrets Rotation** — Add key rotation support with re-encryption of stored settings.

### MongoDB

- Use a dedicated MongoDB Atlas user with **read/write access scoped to the `flowforge` database only** — not cluster admin.
- Enable Atlas IP Access Lists to restrict connections to your deployment's IP range.
- Enable [Atlas Encryption at Rest](https://www.mongodb.com/docs/atlas/security-kms-encryption/) for regulated environments.

---

## Performance

### Design Characteristics

| Characteristic | Approach |
|---|---|
| **Cold Start** | Engine instantiation is lightweight — no heavy in-process state. Typical cold start is < 200ms. |
| **Step Replay** | On resume, only log records for the current run are fetched (scoped by `runId`). Log replay is O(n) in the number of completed steps. |
| **AI Latency** | Gemini 1.5 Pro P50 response time is 600–1200ms. The engine logs start/end timestamps per request for precise attribution. |
| **Polling** | The Execution Monitor polls at 3s intervals. For workloads requiring sub-second feedback, replace with Server-Sent Events. |
| **DB Indexes** | `WorkflowRun` is indexed on `status`. `StepExecution` is indexed on `runId`. `IdempotencyRecord` has a TTL index for automatic expiry. |

### Recommended Optimizations for Scale

- Add a Redis layer for idempotency key lookups to reduce MongoDB round-trips on hot retry paths.
- Move execution trigger to a background job queue to eliminate API route timeout constraints.
- Enable MongoDB connection pooling via a singleton `dbConnect()` with a cached promise (already implemented in `src/lib/db.ts`).

---

## Screenshots

> Add screenshots of the following views to this section:
>
> - **Landing Page** — Hero section with animated workflow visualization
> - **Workflow Builder** — Canvas with nodes, edges, config panel, and step library
> - **Execution Monitor** — Live step timeline with AI reasoning panels
> - **Approval Queue** — Pending review cards with AI output inspector
> - **History** — Grouped runs list with side panel detail view
> - **Dashboard** — Metrics overview with recent executions table

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **No Authentication** | The application has no user session system. All API routes are publicly accessible in the current build. |
| **Gemini Free Tier Rate Limits** | Free API keys are capped at 15 RPM. The engine handles 429s with exponential backoff, but sustained high-volume workloads require a paid Gemini API tier. |
| **Serverless Timeout** | Workflows with total execution time exceeding ~55s may be interrupted on Vercel's Hobby plan. Mitigate by using a background job queue. |
| **Version Diff Depth** | The `/versions/compare` endpoint performs a shallow diff on top-level node and edge arrays. Deeply nested configuration changes within nodes are not granularly diffed. |
| **Approval Assignment** | Approval requests are not assigned to specific users or roles — any user with access to the Approvals page can act on any request. |
| **Single AI Provider** | Currently only Google Gemini is wired up. The `AIProvider` interface exists, but OpenAI and Anthropic providers are not yet implemented. |

---

## Production Roadmap

### Phase 1 — Security & Multi-Tenancy
- [ ] Add Clerk authentication with organizational workspaces
- [ ] Per-workflow RBAC with `OWNER`, `EDITOR`, `VIEWER`, `APPROVER` roles
- [ ] Approval routing — assign specific approvers per node
- [ ] Request-level rate limiting on execution trigger endpoints

### Phase 2 — Reliability & Scale
- [ ] Replace polling with Server-Sent Events (SSE) for real-time execution updates
- [ ] Background job queue integration (Inngest / Upstash QStash) to remove serverless timeout constraints
- [ ] Redis-backed idempotency cache for high-volume retry paths
- [ ] Horizontal execution worker pool for parallel workflow processing

### Phase 3 — Developer Experience
- [ ] JavaScript/TypeScript SDK for programmatic workflow management
- [ ] Custom connector framework — allow users to write and publish their own step executors
- [ ] OpenAI and Anthropic provider implementations (plug into existing `AIProvider` interface)
- [ ] Webhook delivery system for execution lifecycle events (started, paused, completed, failed)

### Phase 4 — Observability & Intelligence
- [ ] Visual diff UI for workflow version comparison
- [ ] Execution replay in the UI (step-through historical runs like a debugger)
- [ ] Cost attribution dashboard (per-workflow AI token spend)
- [ ] Anomaly detection — flag executions with unusually high latency or AI confidence below threshold
- [ ] Export to external observability platforms (Datadog, Grafana, OpenTelemetry)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with precision. <strong>FlowForge AI</strong>
</div>
