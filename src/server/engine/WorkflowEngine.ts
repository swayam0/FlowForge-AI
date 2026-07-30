import { WorkflowRepository } from '../../repositories/WorkflowRepository';
import { WorkflowRunRepository } from '../../repositories/WorkflowRunRepository';
import { LoggingService } from '../services/LoggingService';
import { ExecutorFactory } from './ExecutorFactory';
import { ExecutionContext } from '../interfaces/ExecutionContext';
import { EventType, ExecutionStatus, WorkflowStepType } from '../../types/common';
import { WorkflowNode, WorkflowVersion } from '../../types/workflow';

import { AIService } from '../ai/AIService';
import { WorkflowRunModel } from '../../models/WorkflowRun';
import { StepExecutionModel } from '../../models/StepExecution';
import { IdempotencyRecordModel } from '../../models/IdempotencyRecord';
import { WorkflowVersionModel } from '../../models/WorkflowVersion';
import { WorkflowModel } from '../../models/Workflow';

export class WorkflowEngine {
  private executorFactory: ExecutorFactory;

  constructor(
    private workflowRepo: WorkflowRepository,
    private runRepo: WorkflowRunRepository,
    private loggingService: LoggingService
  ) {
    const aiService = new AIService(loggingService);
    this.executorFactory = new ExecutorFactory(aiService);
  }

  async startRun(workflowVersionId: string, input: Record<string, any>): Promise<string> {
    const run = await this.runRepo.startRun({
      workflowVersionId,
      input,
    });

    await this.loggingService.log(run._id as unknown as string, EventType.EXECUTION_STARTED, 'Run started');
    
    this.runExecutionLoop(run._id as unknown as string).catch(console.error);

    return run._id as unknown as string;
  }

  private async getWorkflowVersionSnapshot(workflowVersionId: string) {
    const versionDoc = await WorkflowVersionModel.findById(workflowVersionId).lean().exec();
    if (!versionDoc) {
      // Fallback for demo workflows seeded without versions
      const workflowDoc = await WorkflowModel.findById(workflowVersionId).lean().exec();
      return workflowDoc ? workflowDoc : null;
    }
    return versionDoc.snapshot as any;
  }

  private async runExecutionLoop(runId: string): Promise<void> {
    const run = await this.runRepo.getById(runId);
    if (!run) return;

    if (run.status !== ExecutionStatus.PENDING && run.status !== ExecutionStatus.RUNNING) {
      return; 
    }

    const workflow = await this.getWorkflowVersionSnapshot(run.workflowVersionId);
    if (!workflow) return;

    await this.runRepo.updateStatus(runId, { status: ExecutionStatus.RUNNING });

    // --- EVENT SOURCING REDUCER ---
    const stepExecutions = await StepExecutionModel.find({ runId }).sort({ startedAt: 1 }).lean().exec();
    
    let previousOutputs: Record<string, any> = {};
    let currentNodeId: string | undefined = undefined;
    let attemptMap: Record<string, number> = {};

    if (stepExecutions.length === 0) {
      // Find start node
      const targetIds = new Set(workflow.edges.map((e: any) => e.target));
      const startNode = workflow.nodes.find((n: any) => !targetIds.has(n.id));
      if (!startNode) throw new Error('No starting node found');
      currentNodeId = startNode.id;
    } else {
      for (const step of stepExecutions) {
        attemptMap[step.stepId] = (attemptMap[step.stepId] || 0) + 1;
        if (step.status === ExecutionStatus.COMPLETED) {
          previousOutputs[step.stepId] = step.output;
        }
      }
      
      const lastStep = stepExecutions[stepExecutions.length - 1];
      if (lastStep.status === ExecutionStatus.RUNNING || lastStep.status === ExecutionStatus.PAUSED || lastStep.status === ExecutionStatus.FAILED) {
        currentNodeId = lastStep.stepId;
      } else if (lastStep.status === ExecutionStatus.COMPLETED) {
        // Derive next node
        const lastNode = workflow.nodes.find((n: any) => n.id === lastStep.stepId);
        currentNodeId = this.findNextNode(workflow, lastNode, lastStep.output?.nextNodeId) || undefined;
      }
    }

    const runInput = run.toObject ? (run.toObject() as any).input : run.input;

    // --- EXECUTION LOOP ---
    while (currentNodeId) {
      const node = workflow.nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;

      const attemptNumber = (attemptMap[currentNodeId] || 0) + 1;
      attemptMap[currentNodeId] = attemptNumber;

      const nextNodeId = await this.executeNode(runId, workflow, node, previousOutputs, runInput || {}, attemptNumber);

      if (nextNodeId === 'PAUSED_WAITING_APPROVAL' || nextNodeId === 'FAILED') {
        return; // Break loop, status was saved by executeNode
      }

      currentNodeId = nextNodeId || undefined;
    }

    // Finished
    const completedAt = new Date();
    const durationMs = run.createdAt ? completedAt.getTime() - new Date(run.createdAt).getTime() : 0;
    
    await WorkflowRunModel.findByIdAndUpdate(runId, {
      status: ExecutionStatus.COMPLETED,
      completedAt,
      durationMs,
      executionPath: Object.keys(previousOutputs)
    });
    
    await this.loggingService.log(runId, EventType.EXECUTION_COMPLETED, 'Run completed');
  }

  async executeNode(
    runId: string, 
    workflow: any, 
    node: WorkflowNode, 
    previousOutputs: Record<string, any>, 
    input: Record<string, any>,
    attemptNumber: number
  ): Promise<string | null> {
    
    // Create StepExecution row (Running)
    let stepExecution = await StepExecutionModel.create({
      runId,
      stepId: node.id,
      attemptNumber,
      status: ExecutionStatus.RUNNING,
      input: { ...input, ...previousOutputs }
    });

    await this.loggingService.log(runId, EventType.NODE_STARTED, `Started node ${node.label}`, node.id);

    const isWriteAction = [WorkflowStepType.MOCK_EXTERNAL_ACTION, WorkflowStepType.HUMAN_APPROVAL].includes(node.type as WorkflowStepType);
    const idempotencyKey = `${runId}:${node.id}`; // The spec suggests runId:stepId:attemptNumber, but says to use it for bypassing on retry, which requires matching key across attempts. Thus runId:stepId.

    if (isWriteAction) {
      const cachedRecord = await IdempotencyRecordModel.findOne({ idempotencyKey, status: 'SUCCESS' });
      if (cachedRecord) {
        await this.loggingService.log(runId, EventType.IDEMPOTENCY_SKIP, `Skipped node ${node.label} due to idempotency. Cached result returned.`, node.id);
        
        await StepExecutionModel.findByIdAndUpdate(stepExecution._id, {
          status: ExecutionStatus.COMPLETED,
          output: cachedRecord.resultPayload,
          reason: 'Skipped via Idempotency Check',
          completedAt: new Date()
        });

        previousOutputs[node.id] = cachedRecord.resultPayload;
        await this.loggingService.log(runId, EventType.NODE_COMPLETED, `Completed node ${node.label}`, node.id);
        return this.findNextNode(workflow, node, undefined);
      }
    }

    const context: ExecutionContext = {
      executionId: runId, // Keep for backward compat with some executors temporarily
      workflow,
      workflowVersion: { id: '', workflowId: workflow._id, versionNumber: workflow.version, snapshot: workflow, createdAt: new Date() },
      currentNode: node,
      input,
      previousOutputs,
      executionPath: Object.keys(previousOutputs),
      metadata: {},
      retryCount: attemptNumber - 1,
    };

    try {
      const executor = this.executorFactory.getExecutor(node.type);
      const result = await executor.execute(context);

      if (result.status === 'WAITING_APPROVAL') {
        await this.loggingService.log(runId, EventType.WAITING_FOR_APPROVAL, `Waiting for approval on ${node.label}`, node.id);
        
        await StepExecutionModel.findByIdAndUpdate(stepExecution._id, { status: ExecutionStatus.PAUSED, reason: 'Waiting for Human Approval' });
        await this.runRepo.updateStatus(runId, { status: ExecutionStatus.PAUSED });
        return 'PAUSED_WAITING_APPROVAL';
      }

      if (result.status === 'FAILED') {
        throw new Error(result.reason || 'Node execution failed');
      }

      if (isWriteAction && result.status === 'SUCCESS') {
        await IdempotencyRecordModel.create({
          idempotencyKey,
          executionId: runId, // Using runId for field executionId
          nodeId: node.id,
          status: 'SUCCESS',
          resultPayload: result.output,
        });
      }

      const finalOutput = { ...result.output, nextNodeId: result.nextNodeId };
      previousOutputs[node.id] = finalOutput;

      await StepExecutionModel.findByIdAndUpdate(stepExecution._id, {
        status: ExecutionStatus.COMPLETED,
        output: finalOutput,
        reason: result.reason,
        completedAt: new Date()
      });

      await this.loggingService.log(runId, EventType.NODE_COMPLETED, `Completed node ${node.label}`, node.id);

      return this.findNextNode(workflow, node, result.nextNodeId);

    } catch (error: any) {
      await this.loggingService.log(runId, EventType.FAILED, `Node ${node.label} failed: ${error.message}`, node.id);
      console.error(`executeNode failed for ${node.id}:`, error);
      
      await StepExecutionModel.findByIdAndUpdate(stepExecution._id, {
        status: ExecutionStatus.FAILED,
        reason: error.message,
        completedAt: new Date()
      });
      
      await this.runRepo.updateStatus(runId, { status: ExecutionStatus.FAILED });
      return 'FAILED';
    }
  }

  findNextNode(workflow: any, currentNode: WorkflowNode, dynamicNextNodeId?: string): string | null {
    if (dynamicNextNodeId) {
      return dynamicNextNodeId;
    }

    const edges = workflow.edges.filter((e: any) => e.source === currentNode.id);
    if (edges.length === 0) return null;
    if (edges.length === 1) return edges[0].target;

    throw new Error(`Multiple outgoing edges found from node ${currentNode.id} but no branch was selected by the executor.`); 
  }

  async pauseRun(runId: string): Promise<void> {
    await this.runRepo.updateStatus(runId, { status: ExecutionStatus.PAUSED });
    await this.loggingService.log(runId, EventType.CANCELLED, 'Run paused by user');
  }

  async resumeRun(runId: string): Promise<void> {
    const run = await this.runRepo.getById(runId);
    if (!run) throw new Error('Run not found');
    
    if (run.status === ExecutionStatus.PAUSED) {
      await this.runRepo.updateStatus(runId, { status: ExecutionStatus.RUNNING });
      await this.loggingService.log(runId, EventType.EXECUTION_STARTED, 'Run resumed');
      this.runExecutionLoop(runId).catch(console.error);
    }
  }

  async cancelRun(runId: string): Promise<void> {
    await this.runRepo.updateStatus(runId, { status: ExecutionStatus.CANCELLED });
    await this.loggingService.log(runId, EventType.CANCELLED, 'Run cancelled');
  }

  async retryRun(runId: string): Promise<void> {
    const run = await this.runRepo.getById(runId);
    if (!run || run.status !== ExecutionStatus.FAILED) return;

    // We verify if it is safe to retry by checking the last step execution
    const stepExecutions = await StepExecutionModel.find({ runId }).sort({ startedAt: 1 }).exec();
    if (stepExecutions.length > 0) {
      const lastStep = stepExecutions[stepExecutions.length - 1];
      if (lastStep.status !== ExecutionStatus.FAILED && lastStep.status !== ExecutionStatus.RUNNING) {
        throw new Error('Can only retry a run if its last step failed or is stuck running.');
      }
    }

    await this.runRepo.updateStatus(runId, { status: ExecutionStatus.RUNNING });
    await this.loggingService.log(runId, EventType.RETRY, 'Recovering failed run');
    this.runExecutionLoop(runId).catch(console.error);
  }
}
