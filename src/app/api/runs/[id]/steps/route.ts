import { NextRequest } from 'next/server';
import connectToDatabase from '../../../../../utils/db';
import { StepExecutionModel } from '../../../../../models/StepExecution';
import { successResponse, errorResponse } from '../../../responseHelper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const steps = await StepExecutionModel.find({ runId: id }).sort({ startedAt: 1 }).lean();
    
    // Transform to frontend format if needed
    const formattedSteps = steps.map(step => ({
      id: step._id?.toString() || '',
      stepId: step.stepId,
      status: step.status,
      input: step.input || {},
      output: step.output || {},
      error: step.reason,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      metadata: step.output?.metadata || step.input?.configuration || {},
    }));

    return successResponse(formattedSteps, 'Steps retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching execution steps:', error);
    return errorResponse('Failed to fetch execution steps', error, 500);
  }
}
