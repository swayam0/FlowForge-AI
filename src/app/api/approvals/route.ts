export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '../responseHelper';
import connectToDatabase from '../../../utils/db';
import { ApprovalModel } from '../../../models/Approval';
import { WorkflowRunModel } from '../../../models/WorkflowRun';
import { WorkflowVersionModel } from '../../../models/WorkflowVersion';
import { ApprovalStatus } from '../../../types/common';

export async function GET() {
  try {
    await connectToDatabase();
    
    const approvals = await ApprovalModel.find({ status: ApprovalStatus.PENDING }).sort({ createdAt: -1 }).lean().exec();
    
    // Enrich with workflow run info
    const enrichedApprovals = await Promise.all(approvals.map(async (approval: any) => {
      let workflowName = 'Unknown Workflow';
      let priority = 'MEDIUM';
      let reason = 'Manual approval required before proceeding.';

      const run = await WorkflowRunModel.findById(approval.executionId).lean().exec();
      if (run) {
        const version = await WorkflowVersionModel.findById(run.workflowVersionId).lean().exec();
        if (version) {
          const snapshot = version.snapshot as any;
          workflowName = snapshot.name || 'Unknown Workflow';
          
          // Attempt to extract reason and priority from the specific node configuration if available
          const node = snapshot.nodes?.find((n: any) => n.id === approval.nodeId);
          if (node?.configuration?.instructions) {
            reason = node.configuration.instructions;
          }
        }
        
        // Attempt to extract priority from run input
        if (run.input && typeof run.input === 'object') {
          if ((run.input as any).priority) {
            const inputPriority = (run.input as any).priority.toString().toUpperCase();
            if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(inputPriority)) {
              priority = inputPriority === 'CRITICAL' ? 'HIGH' : inputPriority;
            }
          } else if ((run.input as any).ticketPriority) {
             const inputPriority = (run.input as any).ticketPriority.toString().toUpperCase();
             if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(inputPriority)) {
              priority = inputPriority === 'CRITICAL' ? 'HIGH' : inputPriority;
            }
          }
        }
      }

      return {
        id: approval._id.toString(),
        executionId: approval.executionId.toString(),
        workflowName,
        reason,
        timestamp: approval.createdAt.getTime(),
        status: approval.status,
        priority
      };
    }));

    return successResponse(enrichedApprovals, 'Pending approvals retrieved');
  } catch (error) {
    return errorResponse('Failed to retrieve approvals', error, 500);
  }
}
