export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for long AI executions
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowRepository } from '../../../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../../server/engine/WorkflowEngine';

import { WorkflowVersionModel } from '../../../../../models/WorkflowVersion';
import { ExecuteWorkflowSchema } from '../../../../../validators/api.schema';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    const body = await request.json().catch(() => ({}));
    const parsedBody = ExecuteWorkflowSchema.parse(body);
    const input = parsedBody.input;
    
    // Find latest version, or fallback to workflow ID for unversioned seeded workflows
    let targetVersionId = params.id;
    const version = await WorkflowVersionModel.findOne({ workflowId: params.id }).sort({ versionNumber: -1 }).exec();
    if (version) {
      targetVersionId = version._id.toString();
    }

    const executionId = await engine.startRun(targetVersionId, input);
    
    return successResponse({ executionId }, 'Execution started', 201);
  } catch (error) {
    return errorResponse('Failed to start execution', error, 400);
  }
}
