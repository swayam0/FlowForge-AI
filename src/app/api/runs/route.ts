import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { WorkflowRepository } from '../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../server/engine/WorkflowEngine';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const workflowVersionId = body.workflowVersionId;
    const input = body.input || {};
    
    if (!workflowVersionId) {
      return errorResponse('workflowVersionId is required', null, 400);
    }
    
    const runId = await engine.startRun(workflowVersionId, input);
    
    return successResponse({ runId }, 'Run started', 201);
  } catch (error) {
    return errorResponse('Failed to start run', error, 400);
  }
}
