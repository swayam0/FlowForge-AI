export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowRepository } from '../../../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../../server/engine/WorkflowEngine';
import { EmptyBodySchema } from '../../../../../validators/api.schema';
import { logAuditEvent } from '../../../../../server/AuditService';
import { AuditEventType } from '../../../../../types/auditLog';

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
    
    await engine.cancelRun(params.id);

    logAuditEvent({
      eventType: AuditEventType.EXECUTION_CANCELLED,
      resourceType: 'EXECUTION',
      resourceId: params.id,
      runId: params.id,
      actor: 'system',
      summary: `Execution cancelled`,
    });
    
    return successResponse(null, 'Run cancelled');
  } catch (error) {
    return errorResponse('Failed to cancel run', error, 400);
  }
}
