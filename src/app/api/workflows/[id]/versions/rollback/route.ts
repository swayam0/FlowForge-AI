import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../../../../responseHelper';
import connectToDatabase from '../../../../../../utils/db';
import { WorkflowVersionModel } from '../../../../../../models/WorkflowVersion';
import { WorkflowModel } from '../../../../../../models/Workflow';
import { WorkflowStatus } from '../../../../../../types/common';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await request.json();
    const { targetVersionNumber, strategy } = body;

    if (!targetVersionNumber || !strategy) {
      return errorResponse('targetVersionNumber and strategy are required', null, 400);
    }

    if (!['restore-as-draft', 'replace-draft', 'new-version'].includes(strategy)) {
      return errorResponse('Invalid strategy', null, 400);
    }

    await connectToDatabase();

    // 1. Fetch the target version
    const targetVersion = await WorkflowVersionModel.findOne({ 
      workflowId: params.id, 
      versionNumber: targetVersionNumber 
    }).lean().exec();

    if (!targetVersion) {
      return errorResponse(`Version ${targetVersionNumber} not found`, null, 404);
    }

    // 2. Fetch the current workflow
    const workflow = await WorkflowModel.findById(params.id);
    if (!workflow) {
      return errorResponse('Workflow not found', null, 404);
    }

    const snapshot = targetVersion.snapshot as any;

    if (strategy === 'restore-as-draft' || strategy === 'replace-draft') {
      // Overwrite the current draft with the snapshot's data
      workflow.name = snapshot.name;
      workflow.description = snapshot.description;
      workflow.nodes = snapshot.nodes;
      workflow.edges = snapshot.edges;
      workflow.status = WorkflowStatus.DRAFT;
      
      // If we are replacing, we might keep the current version number
      // If restoring as draft, we might bump it if it was published.
      // For simplicity, we just keep the current version number but set status to DRAFT
      await workflow.save();

      return successResponse(workflow, 'Workflow restored as draft');
    } else if (strategy === 'new-version') {
      // Restore and publish as a new version
      workflow.name = snapshot.name;
      workflow.description = snapshot.description;
      workflow.nodes = snapshot.nodes;
      workflow.edges = snapshot.edges;
      
      // Bump version
      workflow.version = workflow.version + 1;
      workflow.status = WorkflowStatus.PUBLISHED;
      await workflow.save();

      // Create new version snapshot
      const newVersion = new WorkflowVersionModel({
        workflowId: workflow._id.toString(),
        versionNumber: workflow.version,
        snapshot: {
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
          createdBy: workflow.createdBy
        }
      });
      await newVersion.save();

      return successResponse(workflow, 'Workflow restored as new version');
    }

  } catch (error) {
    return errorResponse('Failed to rollback workflow', error, 500);
  }
}
