import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { WorkflowRunModel } from '../../../models/WorkflowRun';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const runs = await WorkflowRunModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Map history to the required format
    const history = runs.map(run => {
      return {
        id: run._id,
        workflowId: run.workflowVersionId,
        workflowVersionId: run.workflowVersionId,
        status: run.status,
        startedAt: run.createdAt,
      };
    });

    return successResponse(history, 'Execution history retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve execution history', error, 500);
  }
}
