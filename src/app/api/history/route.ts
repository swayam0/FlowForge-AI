export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { WorkflowRunModel } from '../../../models/WorkflowRun';
import mongoose from 'mongoose';
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

    // Fetch all versions and workflows to map names
    const versions = await mongoose.models.WorkflowVersion.find().lean().exec();
    const workflows = await mongoose.models.Workflow.find().lean().exec();
    
    // Map history to the required format
    const history = runs.map(run => {
      // Find the version or fallback to workflow
      const versionDoc = versions.find((v: any) => v._id.toString() === run.workflowVersionId);
      const workflowDoc = workflows.find((w: any) => w._id.toString() === run.workflowVersionId || (versionDoc && w._id.toString() === versionDoc.workflowId));
      
      const workflowName = workflowDoc ? workflowDoc.name : 'Unknown Workflow';
      const versionNum = versionDoc ? versionDoc.versionNumber : (workflowDoc ? workflowDoc.version : 1);

      return {
        id: run._id,
        workflowId: workflowName,
        workflowVersionId: run.workflowVersionId,
        version: versionNum,
        status: run.status,
        startedAt: run.startedAt || run.createdAt,
        completedAt: run.completedAt,
        durationMs: run.durationMs,
        executionPath: run.executionPath || [],
      };
    });

    return successResponse(history, 'Execution history retrieved successfully');
  } catch (error) {
    return errorResponse('Failed to retrieve execution history', error, 500);
  }
}
