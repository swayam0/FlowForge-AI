# FlowForge AI - Agentic Workflow Automation Platform

FlowForge AI is a controlled agentic workflow automation platform that allows users to define, execute, and monitor bounded business workflows. It securely blends deterministic logic, human-in-the-loop approvals, and AI-powered extraction/classification steps.

## Architecture

The platform is built as a modern full-stack web application:
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, React Flow (for workflow visualization).
- **Backend**: Next.js API Routes.
- **Database**: MongoDB (Mongoose ORM) for persistence.
- **AI/LLM Engine**: Google Gemini API integration for AI steps.

### Key Components:
- **WorkflowEngine**: The core state machine that orchestrates step execution, handles idempotency, and state passing.
- **LoggingService**: Structured logging for AI calls, tool usage, failures, and execution paths.
- **Approval Queue**: A system to pause execution and yield to human reviewers for sensitive actions.

## Completed Scope
- **Visual Workflow Builder**: Zod schema-validated drag-and-drop workflow builder.
- **Supported Step Types**: Structured Input, AI Extraction, AI Classification (Routing), Deterministic Logic, Human Approval, Mock Actions, Report Generation.
- **Execution Engine**: Reliable state passing, pausing for approvals, cancellation, resuming, and safe-retry mechanics.
- **Idempotency**: `IdempotencyRecordModel` ensures that duplicate write actions are prevented on retries.
- **Live Monitor**: A real-time `ExecutionMonitor` UI that visualizes the current execution path, step states, progress, and logs.
- **History & Recovery**: Users can inspect previous runs, view logs, and rerun earlier versions of a workflow.

## Intentionally Excluded Scope
- **Real External Actions**: Action nodes currently perform mocked API calls/DB writes to prevent accidental side effects during evaluation.
- **Strict RBAC**: While the system enforces approval gates, complex Role-Based Access Control (RBAC) user groups are simplified for this MVP.
- **Visual Version Comparison**: The backend safely stores and executes specific immutable workflow versions, but a UI side-by-side visual diff tool for versions was excluded to prioritize core engine reliability.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas (or local MongoDB) instance

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Populate `.env.local` with your MongoDB URI and Gemini API Key.
5. Start the development server:
   ```bash
   npm run dev
   ```

## Testing
Run the focused test suite to verify the core engine, API endpoints, and schema validations:
```bash
npm test
```

## Known Limitations
- The React Flow topology currently assumes acyclic directed graphs (DAGs). Infinite loops are technically possible if the user constructs circular logic paths, though max-depth constraints are partially handled by the executor.
- Large LLM context windows for massive document retrieval nodes may exceed standard rate limits on the free tier of the LLM provider.

## Deployment Details
This application can be deployed directly to Vercel:
1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the `MONGODB_URI` and `GEMINI_API_KEY` to the Vercel Environment Variables.
4. Deploy. Next.js App Router will seamlessly host both the frontend and the API routes.
