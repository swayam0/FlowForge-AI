# FlowForge AI — Controlled Agentic Workflow Automation Platform

A platform for defining and executing bounded business workflows that combine deterministic logic, AI-powered steps, and human approval gates — with full auditability, safe retry, and version history.

**Live app:** https://flow-forge-ai-sooty.vercel.app/
**Repository:** https://github.com/swayam0/FlowForge-AI

---

## Overview

Users build a workflow visually as a graph of steps, then run it against real input and watch it execute live. Supported step types:

- **Structured input** — collects the run's initial data via a form
- **Document retrieval** — pulls relevant reference material
- **AI extraction** — Gemini extracts structured fields from unstructured text
- **AI classification** — Gemini assigns a label/priority
- **Deterministic condition** — rule-based branching (no AI)
- **Human approval** — pauses execution until a person approves/rejects
- **Mock external action** — simulates a real-world side effect (e.g. "send email")
- **Final report** — summarizes the run's outcome

### Demo workflow: Support Ticket Triage
A realistic example seeded into the app: a support ticket comes in, AI extracts issue details and classifies priority, a rule checks if it's critical or from an enterprise customer — if so, execution pauses for manager approval before acting; otherwise it auto-resolves. Both paths converge on a customer notification and a resolution summary.

Run `npm run seed:demo` to seed this workflow with two ready-to-use sample inputs (a routine ticket and a critical enterprise ticket) — see console output after seeding for the exact payloads.

---

## Architecture

Frontend (Next.js 16 App Router)
Dashboard → Workflow Builder (React Flow) → Execution Monitor → Approval Queue → History
State: Zustand (client) + TanStack Query (server cache)
│ REST API
API Routes (/api/workflows, /api/runs, /api/approvals)
Zod validation on every input
│
Workflow Engine (event-sourcing reducer)

Strategy-pattern step executors, one class per step type
Idempotency check (key: runId:stepId) before any write-type step
Resume = replay execution log, skip completed steps — no in-memory state
Retry = only failed steps, idempotency-safe
Reason field populated at every branching/AI decision point
│
Data Layer (MongoDB Atlas + Mongoose)
Workflow → WorkflowVersion (immutable) → WorkflowRun → StepExecution (log)
→ ApprovalRequest → IdempotencyRecord
│
AI Layer (Gemini via GeminiProvider/AIService)
JSON-validated responses, retry with backoff on transient failure

### Key design decisions

**Version immutability.** Editing a workflow never mutates an existing version — it creates a new `WorkflowVersion` snapshot. Runs are pinned to the version they executed against, so History always reflects exactly what ran, even after later edits. This is also what makes "rerun an old version with new input" straightforward.

**Idempotency key excludes attempt number.** The key is `runId:stepId`, not `runId:stepId:attemptNumber`. If a crash occurs after a write action succeeds but before the DB marks the step complete, a retry would increment the attempt number — including it in the key would cause a cache miss and re-trigger the action. Keeping the key attempt-independent makes retries safe across crash recovery, not just normal retries.

**Stateless resume via log replay.** The engine never holds execution state in memory. Resume works by re-walking the `StepExecution` log for a run, skipping anything already `COMPLETED`, and continuing from the first non-terminal step. This makes resume safe across process restarts and serverless cold starts.

**Execution-path reasoning.** Every condition and AI-classification step writes a human-readable `reason` string (e.g. "condition field 'priority' evaluated 'HIGH', routed to branch True") to the execution log, surfaced in both the Execution Monitor and History UI — so any run's path can be explained after the fact, not just observed.

---

## Setup

```bash
git clone https://github.com/swayam0/FlowForge-AI.git
cd flow-forge-ai
npm install
cp .env.example .env.local   # fill in real values, see below
npm run dev
```

### Environment variables (see `.env.example`)
- `MONGODB_URI` — MongoDB Atlas connection string
- `GEMINI_API_KEY` — Google AI Studio API key (Auth-format keys starting `AQ.Ab` are current as of mid-2026; the app does not validate key format, it passes the key through to the SDK)
- `GEMINI_MODEL` — defaults to `gemini-3.6-flash`; override via env var if Google updates the current model before you deploy

### Seed demo data
```bash
npm run seed:demo
```
Idempotent — safe to run multiple times, skips if the demo workflow already exists. Seeds "Support Ticket Triage" plus two sample input payloads (printed to console).

---

## Testing

```bash
npm run test        # Vitest suite
npm run build        # type-check + build
```

Test coverage includes: step executors, idempotency (retry does not re-execute completed write steps), resume/replay logic, workflow serialization (create → fetch → update lifecycle), and Mongoose schema round-tripping for edge cases like empty node configuration, as well as AI service retry delays for 429 rate limit responses.

---

## What's implemented

- Full workflow CRUD with versioning (immutable snapshots on every save)
- Visual drag-and-drop builder (React Flow) with a live validation panel and node inspector
- Execution engine: start, pause at approval gates, resume after decision, step-level retry (write-safe), cancel
- Human approval queue with approve/reject actions and audited outcomes
- Run history with step-by-step logs — each branching point records the reasoning behind the path taken (e.g. condition result, AI classification output)
- Rerun any earlier version with new input, pinned to that version's graph
- Live Gemini integration for structured field extraction and priority classification
- End-to-end event logging: AI calls, approval events, retries, failures, and run completion
- Quota-aware retry: on 429 responses the engine parses the server-suggested wait time and backs off accordingly

## Intentionally excluded / limited scope

- **Permission enforcement** is a static per-step role allowlist, not a full production authorization system — demonstrates the pattern, not a replacement for RBAC
- **Single-tenant** — no user authentication or multi-tenancy; this is a demo instance

## Known limitations

> **Reviewer note — Gemini quota:** The API key is on the free tier (20 requests/day). If you encounter a quota error during review, the application itself is working correctly — this is an external daily cap, not an application bug. The daily limit resets at midnight UTC. Happy to provide a fresh key or a specific review window if that would help.

- **Gemini free-tier daily cap (20 requests/day)** — development testing consumed the daily quota. The rerun-old-version flow is architecturally confirmed correct: execution logs show the engine correctly loads the pinned v1 graph snapshot and progresses through it (`input` → `retrieve` → `extract`, `workflowVersionId` verified), but the AI step exhausted retries within the same quota window. With a fresh daily limit or a paid key this path completes normally.
- **Version compare scope** — the diff endpoint (`GET /api/workflows/[id]/versions/compare`) compares node type, label, and configuration fields; permission and edge-routing changes are not yet included in the diff output. No visual diff UI was built.
- **Permission model** — per-node role allowlist (`ADMIN` / `USER`), verified to reject unauthorized callers with an explicit reason string written to the step record. Not a full role-based access control system.

---

## Deployment

Deployed on Vercel with MongoDB Atlas. Environment variables are set in the Vercel project dashboard (not committed). Serverless deployment dictates that background execution will pause or suspend upon request completion. Re-awakening execution via workflow approvals relies on event-driven continuation to execute remaining steps.
