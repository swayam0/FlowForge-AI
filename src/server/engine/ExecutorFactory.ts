import { WorkflowStepExecutor } from '../interfaces/WorkflowStepExecutor';
import { WorkflowStepType } from '../../types/common';
import { InputExecutor } from '../executors/InputExecutor';
import { RetrievalExecutor } from '../executors/RetrievalExecutor';
import { ExtractionExecutor } from '../executors/ExtractionExecutor';
import { ClassificationExecutor } from '../executors/ClassificationExecutor';
import { ConditionExecutor } from '../executors/ConditionExecutor';
import { ApprovalExecutor } from '../executors/ApprovalExecutor';
import { MockActionExecutor } from '../executors/MockActionExecutor';
import { ReportExecutor } from '../executors/ReportExecutor';
import { AIService } from '../ai/AIService';

export class ExecutorFactory {
  constructor(private aiService: AIService) {}

  getExecutor(type: WorkflowStepType): WorkflowStepExecutor {
    switch (type) {
      case WorkflowStepType.STRUCTURED_INPUT:
        return new InputExecutor();
      case WorkflowStepType.DOCUMENT_RETRIEVAL:
        return new RetrievalExecutor();
      case WorkflowStepType.AI_EXTRACTION:
        return new ExtractionExecutor(this.aiService);
      case WorkflowStepType.AI_CLASSIFICATION:
        return new ClassificationExecutor(this.aiService);
      case WorkflowStepType.DETERMINISTIC_CONDITION:
        return new ConditionExecutor();
      case WorkflowStepType.HUMAN_APPROVAL:
        return new ApprovalExecutor();
      case WorkflowStepType.MOCK_EXTERNAL_ACTION:
        return new MockActionExecutor();
      case WorkflowStepType.FINAL_REPORT:
        return new ReportExecutor();
      default:
        throw new Error(`Unsupported workflow step type: ${type}`);
    }
  }
}
