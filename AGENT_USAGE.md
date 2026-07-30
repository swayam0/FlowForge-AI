# AGENT_USAGE.md

## Tools Used
- ChatGPT — initial scaffolding and architecture for the workflow engine, executors, and frontend
- Antigravity — used for iterative implementation, debugging, discovering root causes of issues (like the Mongoose data-loss bug), environment verification, implementation of automated end-to-end tests, configuring production deployments, and applying complex fallback patterns (like AI prompt corrections and retry-with-delay functionality).
- Claude — code review, audit prompts, debugging strategy, and this documentation

## Representative Prompts

**1. Debugging a save failure**
Prompt: "I'm getting 'Workflow not found' when saving a newly created workflow... trace the full create→save flow... identify whether the frontend is using a stale/undefined id before the create response resolves..."
Result: The agent traced the bug to a missing `.toJSON()` call on a GET route — Mongoose virtuals (including the `id` field) were silently stripped by `JSON.stringify` in the Next.js App Router response, so the frontend sent `PUT /api/workflows/undefined` on save. Root cause fixed, and the same audit was extended to sweep three other routes with the identical latent bug before it caused a similar failure elsewhere.

**2. Idempotency implementation**
Prompt: "Add idempotency to all write-type step executions... compute key = `${runId}:${stepId}:${attemptNumber}`... verify this is exercised by retry..."
Result: The agent identified that including `attemptNumber` in the idempotency key was actually wrong — if a crash occurs after a write action succeeds but before the DB marks it `COMPLETED`, a retry increments the attempt number and would cause a cache *miss*, re-triggering the external action. The agent corrected the key to `runId:stepId` instead, which is safe against this exact crash-recovery case. This was a case where the agent identified a flaw in my original specification and corrected it with clear reasoning, rather than implementing it as literally requested.

**3. Root-causing a Mongoose data-loss bug**
Prompt: audit of workflow validation failures after seeding demo data
Result: Zod validation was failing on `configuration: undefined` for nodes seeded with an empty `{}`. The agent found that Mongoose silently drops empty subdocument objects unless `minimize: false` is explicitly set — patching the Zod schema to tolerate `undefined` would have masked the real issue (silent data loss on save). The agent fixed the Mongoose schema itself rather than just relaxing validation.

**4. Gemini API key/model migration**
Context: Google changed Gemini API key format from `AIza` (Standard) to `AQ.Ab` (Auth) in June 2026, and the model in use had been retired.
Result: The agent confirmed the app had no hardcoded key-format validation (which would have broken on the new format), diagnosed a 404 as a retired-model error rather than an auth failure, and identified the current available model (`gemini-3.6-flash`) via a live models-list API call rather than guessing.

**5. Full-scope structural and behavioral verification**
Prompt: verification script covering workflow graph structure, validation, and two live end-to-end runs (auto-resolve path and human-approval path) with real Gemini calls
Result: Confirmed both branches of the demo workflow execute correctly, condition routing reasons are accurate and traceable to real AI output, and one run's failure (a Gemini free-tier rate limit) was handled cleanly — `FAILED` status, clear error, no hang, no duplicate side effects. The agent then followed up by implementing rate-limit fallback (parsing `retryDelay` from 429s) to handle exactly these scenarios.

## Agent Mistakes / Corrections
- An early assumption that a Gemini 404 error meant an invalid API key was wrong — it was actually a retired model name. Verified via a live call to the Gemini models-list endpoint rather than assumption.
- The AI prompt implemented in `AIService` incorrectly constrained classification to `LOW, MEDIUM, HIGH`, missing the `CRITICAL` state configured in the default workflow. This caused deterministic routing to fail. The agent self-corrected the prompt after inspecting the discrepancy between the configuration rule and the AI constraints.

## Verification Method
- Vitest suite covering step executors, idempotency, resume/retry logic, and serialization — currently at **30/30** passing tests.
- Manual end-to-end walkthrough of all 12 execution paths (create, validate, run, approve, reject, cancel, force-failure, retry, version-edit, rerun-old-version, drag-and-drop builder) performed directly in the browser against both local and the live deployment
- Live (non-mocked) Gemini API calls verified for both extraction and classification steps, with output confirmed to actually drive downstream routing decisions rather than assumed
- All agent-suggested fixes were read and understood before acceptance — verified against actual file/line references, not accepted blindly
