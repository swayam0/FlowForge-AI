export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowRepository } from '../../../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../../server/engine/WorkflowEngine';
import { EmptyBodySchema } from '../../../../../validators/api.schema';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    EmptyBodySchema.parse(body);

    await engine.resumeRun(params.id);
    
    return successResponse(null, 'Run resumed');
  } catch (error) {
    return errorResponse('Failed to resume run', error, 400);
  }
}
