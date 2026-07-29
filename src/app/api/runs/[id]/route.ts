import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../responseHelper';
import connectToDatabase from '../../../../utils/db';
import { WorkflowRunRepository } from '../../../../repositories/WorkflowRunRepository';

const runRepo = new WorkflowRunRepository();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    console.log(`[DEBUG api/runs/[id]] Requested ID: ${params.id}`);
    const run = await runRepo.getById(params.id);
    console.log(`[DEBUG api/runs/[id]] Retrieved run:`, run ? run._id : 'null');

    if (!run) return errorResponse('Execution not found', null, 404);

    return successResponse(run.toJSON(), 'Run retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve execution', error, 500);
  }
}
