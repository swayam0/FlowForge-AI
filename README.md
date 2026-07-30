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

- Full workflow CRUD with versioning (immutable snapshots)
- Visual builder (React Flow) with validation console and live node inspector
- Execution engine: run, pause on approval, resume, retry (idempotent), cancel
- Human approval queue with approve/reject
- Execution history with per-run, per-step logs and path-reasoning display
- Rerun of an older workflow version with new input
- Live Gemini integration for extraction and classification steps
- Structured application and AI-workflow logging throughout
- Smart AI-request retry logic with backoff delay parsing for graceful handling of rate limits

## Intentionally excluded / limited scope

- **Permission enforcement** is a static per-step allowlist, not fine-grained role-based access control — sufficient to demonstrate the pattern, not production-grade authorization
- **Single-tenant** — no user authentication/multi-tenancy; this is a demo instance, not a multi-user SaaS product
- **Gemini free-tier rate limits** (5 requests/minute) can cause a run to fail during heavy concurrent testing. The app handles this resiliently: it catches the 429 Too Many Requests error, extracts the `retryDelay` from the API response payload, and automatically schedules a retry after the required wait time before eventually falling back to a clean `FAILED` state if limits are repeatedly exceeded.

## Known limitations

- **Gemini free-tier quota (20 requests/day)** — extensive testing during development exhausted the daily quota. The rerun-old-version flow is architecturally confirmed correct: verified execution logs show a rerun correctly loads and executes the pinned v1 graph snapshot (input → retrieve → extract, matching `workflowVersionId`), but the AI extraction step did not complete within the same day's quota window during final testing. No billing account is attached to this API key for the submission. If quota resets or a billed key is used, this completes normally — the failure is purely external rate-limiting, not application logic.
- **Version compare** diffs node type, label, and configuration — it does not yet include permission or edge-routing changes in the diff output. A backend endpoint exists (`GET /api/workflows/[id]/versions/compare`); no visual diff UI was built.
- **Permission enforcement** is a static per-node role allowlist (e.g. `ADMIN` vs `USER`), not a full RBAC/auth system — sufficient to demonstrate the enforcement pattern (verified: unauthorized execution attempts are rejected with a clear `Permission denied` reason, logged and surfaced in the execution record).
- **Single-tenant** — no user authentication/multi-tenancy; this is a demo instance.

---

## Deployment

Deployed on Vercel with MongoDB Atlas. Environment variables are set in the Vercel project dashboard (not committed). Serverless deployment dictates that background execution will pause or suspend upon request completion. Re-awakening execution via workflow approvals relies on event-driven continuation to execute remaining steps.
