export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { WorkflowRepository } from '../../../repositories/WorkflowRepository';
import { CreateWorkflowSchema } from '../../../validators/workflow.schema';
import { logAuditEvent } from '../../../server/AuditService';
import { AuditEventType } from '../../../types/auditLog';

// Since we are in app router, we can instantiate the repo here or use dependency injection pattern 
const workflowRepo = new WorkflowRepository();

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const workflows = await workflowRepo.list(skip, limit);
    return successResponse(workflows, 'Workflows retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve workflows', error, 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json().catch(() => ({}));
    console.log(`[API POST /workflows] Payload received for new workflow:`, body.name);

    const parsedBody = CreateWorkflowSchema.parse(body);
    
    const createdBy = parsedBody.createdBy || 'anonymous'; // Auth not implemented yet
    
    const workflow = await workflowRepo.create(parsedBody, createdBy);
    
    const workflowJson = workflow.toJSON();

    // Fire-and-forget audit log
    logAuditEvent({
      eventType: AuditEventType.WORKFLOW_CREATED,
      resourceType: 'WORKFLOW',
      resourceId: String(workflowJson.id),
      workflowId: String(workflowJson.id),
      actor: createdBy,
      summary: `Workflow "${workflowJson.name}" created`,
      newValue: { name: workflowJson.name, status: workflowJson.status },
    });
    
    return successResponse(workflowJson, 'Workflow created successfully', 201);
  } catch (error: any) {
    console.error(`[API POST /workflows] Failed to create workflow:`, error.issues || error);
    return errorResponse('Failed to create workflow', error, 400);
  }
}
