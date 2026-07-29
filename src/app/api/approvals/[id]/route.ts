import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../responseHelper';
import connectToDatabase from '../../../../utils/db';
import { ApprovalModel } from '../../../../models/Approval';
import { SubmitApprovalSchema } from '../../../../validators/run.schema';
import { WorkflowRepository } from '../../../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../../../repositories/WorkflowRunRepository';
import { LoggingService } from '../../../../server/services/LoggingService';
import { WorkflowEngine } from '../../../../server/engine/WorkflowEngine';
import { EventType } from '../../../../types/common';

const workflowRepo = new WorkflowRepository();
const runRepo = new WorkflowRunRepository();
const loggingService = new LoggingService();
const engine = new WorkflowEngine(workflowRepo, runRepo, loggingService);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    // params.id is the approvalId
    const approval = await ApprovalModel.findById(params.id);
    if (!approval) return errorResponse('Approval not found', null, 404);

    const body = await request.json();
    const parsedData = SubmitApprovalSchema.parse(body);

    approval.status = parsedData.status;
    approval.comments = parsedData.comments;
    approval.reviewer = parsedData.reviewer; // In real app, check against auth context
    approval.approvedAt = new Date();
    
    await approval.save();

    await loggingService.log(
      approval.executionId, 
      parsedData.status === 'APPROVED' ? EventType.APPROVED : EventType.REJECTED, 
      `Human reviewer ${parsedData.status}`,
      approval.nodeId,
      { comments: parsedData.comments, reviewer: parsedData.reviewer }
    );

    // Auto-resume the engine now that approval is provided
    await engine.resumeExecution(approval.executionId);

    return successResponse(approval.toJSON(), `Approval ${parsedData.status} successfully`);
  } catch (error) {
    return errorResponse('Failed to submit approval', error, 400);
  }
}
