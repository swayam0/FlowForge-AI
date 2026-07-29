import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { StepExecutionModel } from '../../../../../models/StepExecution';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    // Retrieve all step executions for this run, sorted by startedAt
    const logs = await StepExecutionModel.find({ runId: params.id }).sort({ startedAt: 1 }).exec();
    const mappedLogs = logs.map(log => log.toJSON());
    
    return successResponse(mappedLogs, 'Run logs retrieved');
  } catch (error) {
    return errorResponse('Failed to retrieve execution logs', error, 500);
  }
}
