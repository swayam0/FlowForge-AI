import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../responseHelper';
import connectToDatabase from '../../../../../utils/db';
import { WorkflowVersionModel } from '../../../../../models/WorkflowVersion';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    
    // Fetch all versions for this workflow, sorted by versionNumber descending
    const versions = await WorkflowVersionModel.find({ workflowId: params.id })
      .sort({ versionNumber: -1 })
      .lean()
      .exec();

    // Map `_id` to `id` for frontend consistency
    const mappedVersions = versions.map(v => ({
      ...v,
      id: v._id.toString(),
      _id: undefined
    }));

    return successResponse(mappedVersions, 'Workflow versions retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve workflow versions', error, 500);
  }
}
