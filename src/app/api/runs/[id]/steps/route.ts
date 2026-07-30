import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../../utils/db';
import { StepExecutionModel } from '../../../../../models/StepExecution';

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

    return NextResponse.json({ success: true, data: formattedSteps });
  } catch (error: any) {
    console.error('Error fetching execution steps:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
