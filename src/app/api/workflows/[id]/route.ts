export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../responseHelper';
import connectToDatabase from '../../../../utils/db';
import { WorkflowRepository } from '../../../../repositories/WorkflowRepository';
import mongoose from 'mongoose';
import { UpdateWorkflowSchema } from '../../../../validators/workflow.schema';
import { logAuditEvent } from '../../../../server/AuditService';
import { AuditEventType } from '../../../../types/auditLog';

const workflowRepo = new WorkflowRepository();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (!params.id || params.id === 'undefined' || !mongoose.Types.ObjectId.isValid(params.id)) {
      return errorResponse('Invalid Workflow ID format', null, 400);
    }

    await connectToDatabase();
    
    const workflow = await workflowRepo.getById(params.id);
    if (!workflow) return errorResponse('Workflow not found', null, 404);

    return successResponse(workflow.toJSON(), 'Workflow retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve workflow', error, 500);
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    if (!params.id || params.id === 'undefined' || !mongoose.Types.ObjectId.isValid(params.id)) {
      console.warn(`[API PUT /workflows/:id] Missing or invalid workflow ID: ${params.id}`);
      return errorResponse('Workflow ID is missing or invalid format', null, 400);
    }

    await connectToDatabase();
    
    const body = await request.json().catch(() => ({}));
    const parsedBody = UpdateWorkflowSchema.parse(body);
    
    const existingWorkflow = await workflowRepo.getById(params.id);
    const oldStatus = existingWorkflow?.status;

    const workflow = await workflowRepo.update(params.id, parsedBody);
    
    if (!workflow) {
      console.warn(`[API PUT /workflows/:id] Workflow not found for ID: ${params.id}`);
      return errorResponse('Workflow not found', null, 404);
    }

    const updatedJson = workflow.toJSON();
    const eventType = updatedJson.status === 'PUBLISHED' && oldStatus !== 'PUBLISHED'
      ? AuditEventType.WORKFLOW_PUBLISHED
      : updatedJson.status === 'ARCHIVED'
      ? AuditEventType.WORKFLOW_ARCHIVED
      : AuditEventType.WORKFLOW_UPDATED;

    logAuditEvent({
      eventType,
      resourceType: 'WORKFLOW',
      resourceId: params.id,
      workflowId: params.id,
      actor: 'system',
      summary: `Workflow "${updatedJson.name}" ${eventType.toLowerCase().replace('workflow_', '')}`,
      oldValue: oldStatus ? { status: oldStatus } : undefined,
      newValue: { status: updatedJson.status },
    });

    return successResponse(updatedJson, 'Workflow updated successfully');
  } catch (error) {
    console.error(`[API PUT /workflows/:id] Error updating workflow ID: ${params.id}`, error);
    return errorResponse('Unable to save workflow updates', error, 400);
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    const success = await workflowRepo.delete(params.id);
    if (!success) return errorResponse('Workflow not found', null, 404);

    logAuditEvent({
      eventType: AuditEventType.WORKFLOW_DELETED,
      resourceType: 'WORKFLOW',
      resourceId: params.id,
      workflowId: params.id,
      actor: 'system',
      summary: `Workflow deleted`,
    });

    return successResponse(null, 'Workflow deleted successfully');
  } catch (error) {
    return errorResponse('Failed to delete workflow', error, 500);
  }
}
