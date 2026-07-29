export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../utils/db';
import { WorkflowRunModel } from '../../../../models/WorkflowRun';
import { StepExecutionModel } from '../../../../models/StepExecution';
import { ApprovalModel } from '../../../../models/Approval';
import { successResponse, errorResponse } from '../../responseHelper';

export async function POST() {
  try {
    await connectToDatabase();
    
    await WorkflowRunModel.deleteMany({});
    await StepExecutionModel.deleteMany({});
    await ApprovalModel.deleteMany({});
    
    return successResponse(null, 'Executions cleared successfully');
  } catch (error) {
    return errorResponse('Failed to clear executions', error, 500);
  }
}
