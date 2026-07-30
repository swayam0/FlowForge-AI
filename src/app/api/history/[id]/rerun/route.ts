export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowRunRepository } from '../../../../../repositories/WorkflowRunRepository';
import { WorkflowRepository } from '../../../../../repositories/WorkflowRepository';
import { LoggingService } from '../../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../../server/engine/WorkflowEngine';
import { RerunWorkflowSchema } from '../../../../../validators/api.schema';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    const originalExecution = await runRepo.getById(params.id);
    if (!originalExecution) return errorResponse('Original execution not found', null, 404);

    const body = await request.json().catch(() => ({}));
    const parsedBody = RerunWorkflowSchema.parse(body);

    // Allow overriding the input, otherwise use original input
    const input = parsedBody.input || originalExecution.input;

    const newExecutionId = await engine.startRun(originalExecution.workflowVersionId, input);

    return successResponse({ executionId: newExecutionId }, 'Rerun execution started successfully', 201);
  } catch (error) {
    return errorResponse('Failed to rerun execution', error, 400);
  }
}
