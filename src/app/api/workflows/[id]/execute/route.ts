import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowRepository } from '../../../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../../server/engine/WorkflowEngine';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const input = body.input || {};
    
    const executionId = await engine.startExecution(params.id, input);
    
    return successResponse({ executionId }, 'Execution started', 201);
  } catch (error) {
    return errorResponse('Failed to start execution', error, 400);
  }
}
