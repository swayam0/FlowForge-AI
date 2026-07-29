export const dynamic = 'force-dynamic';
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
    await engine.retryRun(params.id);
    
    return successResponse(null, 'Run retry initiated');
  } catch (error) {
    return errorResponse('Failed to retry run', error, 400);
  }
}
