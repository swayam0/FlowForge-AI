import { ExecutionContext } from '../interfaces/ExecutionContext';
import { ExecutionResult } from '../interfaces/ExecutionResult';
import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { ApprovalModel } from '../../models/Approval';
import { ApprovalStatus } from '../../types/common';

export class ApprovalExecutor implements WorkflowStepExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const config = context.currentNode.configuration;
    const reviewer = config?.reviewer || 'system_admin';

    // Check if an approval already exists and is decided (for resume scenarios)
    const existingApproval = await ApprovalModel.findOne({
      executionId: context.executionId,
      nodeId: context.currentNode.id,
    });

    if (existingApproval) {
      if (existingApproval.status === ApprovalStatus.APPROVED) {
        return {
          status: 'SUCCESS',
          output: { approved: true, comments: existingApproval.comments },
        };
      } else if (existingApproval.status === ApprovalStatus.REJECTED) {
        return {
          status: 'FAILED',
          output: { approved: false, comments: existingApproval.comments },
          reason: 'Human approval rejected.',
        };
      }
      
      // Still pending
      return {
        status: 'WAITING_APPROVAL',
        output: {},
      };
    }

    // Create a new Approval record
    const approval = new ApprovalModel({
      executionId: context.executionId,
      nodeId: context.currentNode.id,
      reviewer: reviewer,
      status: ApprovalStatus.PENDING,
    });
    
    await approval.save();

    return {
      status: 'WAITING_APPROVAL',
      output: {},
    };
  }
}
