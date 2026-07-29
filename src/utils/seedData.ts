import mongoose from 'mongoose';
import { WorkflowModel } from '../models/Workflow';
import { WorkflowRunModel } from '../models/WorkflowRun';
import { ApprovalModel } from '../models/Approval';
import { StepExecutionModel } from '../models/StepExecution';
import { WorkflowStatus, WorkflowStepType, ExecutionStatus, ApprovalStatus, EventType } from '../types/common';
import * as crypto from 'crypto';

let isSeeding = false;

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

export async function seedDatabase() {
  if (isSeeding) return;
  
  try {
    const count = await WorkflowModel.countDocuments();
    if (count > 0) return; // DB already has data
    
    isSeeding = true;
    console.log('Seeding demo database...');

    // 1. Generate 5 Workflows
    const workflowsData = [
      { name: 'Customer Support Automation', desc: 'Automatically classify, extract, and route customer tickets.' },
      { name: 'Invoice Processing', desc: 'Extract data from invoices and route for approval based on amount.' },
      { name: 'HR Resume Screening', desc: 'Scan resumes against job descriptions.' },
      { name: 'Contract Review', desc: 'Analyze standard legal contracts for anomalies.' },
      { name: 'Incident Escalation', desc: 'Monitor metrics and escalate critical incidents.' }
    ];

    const workflows = [];
    
    for (let i = 0; i < workflowsData.length; i++) {
      const data = workflowsData[i];
      // Generate 6-8 nodes
      const nodes = [
        { id: 'node-1', type: WorkflowStepType.STRUCTURED_INPUT, label: 'Trigger Input', position: { x: 100, y: 150 }, configuration: {} },
        { id: 'node-2', type: WorkflowStepType.AI_CLASSIFICATION, label: 'Categorize', position: { x: 300, y: 150 }, configuration: {} },
        { id: 'node-3', type: WorkflowStepType.AI_EXTRACTION, label: 'Extract Entities', position: { x: 500, y: 150 }, configuration: { prompt: 'Extract fields' } },
        { id: 'node-4', type: WorkflowStepType.DETERMINISTIC_CONDITION, label: 'Evaluate Rules', position: { x: 700, y: 150 }, configuration: {} },
        { id: 'node-5', type: WorkflowStepType.HUMAN_APPROVAL, label: 'Manager Review', position: { x: 900, y: 50 }, configuration: {} },
        { id: 'node-6', type: WorkflowStepType.MOCK_EXTERNAL_ACTION, label: 'Send Alert', position: { x: 900, y: 250 }, configuration: {} },
        { id: 'node-7', type: WorkflowStepType.FINAL_REPORT, label: 'Compile Report', position: { x: 1100, y: 150 }, configuration: {} }
      ];

      const edges = [
        { id: 'e1', source: 'node-1', target: 'node-2' },
        { id: 'e2', source: 'node-2', target: 'node-3' },
        { id: 'e3', source: 'node-3', target: 'node-4' },
        { id: 'e4', source: 'node-4', target: 'node-5', label: 'Needs Review' },
        { id: 'e5', source: 'node-4', target: 'node-6', label: 'Auto-Process' },
        { id: 'e6', source: 'node-5', target: 'node-7' },
        { id: 'e7', source: 'node-6', target: 'node-7' }
      ];

      // Add versions for the first two
      const maxVersion = i < 2 ? 3 : 1;
      
      for (let v = 1; v <= maxVersion; v++) {
        const wf = await WorkflowModel.create({
          name: data.name,
          description: data.desc,
          version: v,
          status: v === maxVersion ? WorkflowStatus.PUBLISHED : WorkflowStatus.ARCHIVED,
          nodes,
          edges,
          createdBy: 'demo@flowforge.ai',
        });
        if (v === maxVersion) workflows.push(wf);
      }
    }

    // 2. Generate 20 Executions
    const executions = [];
    const executionStatuses = [
      ...Array(8).fill(ExecutionStatus.COMPLETED),
      ...Array(4).fill(ExecutionStatus.RUNNING),
      ...Array(4).fill(ExecutionStatus.FAILED),
      ...Array(3).fill(ExecutionStatus.PAUSED),
      ...Array(1).fill(ExecutionStatus.CANCELLED),
    ];

    // Shuffle statuses
    executionStatuses.sort(() => Math.random() - 0.5);

    let allLogs = [];
    let allApprovals = [];

    for (let i = 0; i < 20; i++) {
      const workflow = workflows[i % workflows.length];
      const status = executionStatuses[i];
      const startedAt = new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000);
      
      let finishedAt = null;
      let durationMs = 0;
      let failureReason = null;
      let currentNodeId = null;
      let executionPath = ['node-1', 'node-2', 'node-3'];

      if (status === ExecutionStatus.COMPLETED) {
        durationMs = Math.floor(Math.random() * 5000) + 2000;
        finishedAt = new Date(startedAt.getTime() + durationMs);
        executionPath.push('node-4', 'node-6', 'node-7');
      } else if (status === ExecutionStatus.FAILED) {
        durationMs = Math.floor(Math.random() * 2000) + 1000;
        finishedAt = new Date(startedAt.getTime() + durationMs);
        failureReason = 'API Gateway Timeout (504)';
        executionPath.push('node-4', 'node-6'); // Failed at node-6
      } else if (status === ExecutionStatus.RUNNING) {
        currentNodeId = 'node-3';
      } else if (status === ExecutionStatus.PAUSED) {
        currentNodeId = 'node-5';
        executionPath.push('node-4', 'node-5');
      } else if (status === ExecutionStatus.CANCELLED) {
        durationMs = 5000;
        finishedAt = new Date(startedAt.getTime() + durationMs);
      }

      const run = await WorkflowRunModel.create({
        workflowVersionId: workflow._id,
        status,
        input: { source: 'api', payload: { test: true } }
      });
      executions.push(run);

      // Generate 5-6 logs per execution (Total ~100+ logs)
      let logTime = startedAt.getTime();
      const logs = [
        { executionId: run._id, nodeId: 'node-1', eventType: EventType.NODE_STARTED, level: 'INFO', message: 'Workflow Triggered by API Event', timestamp: new Date(logTime) },
        { executionId: run._id, nodeId: 'node-2', eventType: EventType.AI_REQUEST, level: 'INFO', message: 'Sent 1024 tokens to Claude 3.5 Sonnet', timestamp: new Date(logTime += 400) },
        { executionId: run._id, nodeId: 'node-2', eventType: EventType.AI_RESPONSE, level: 'INFO', message: 'Received classification response: HIGH_PRIORITY', timestamp: new Date(logTime += 800) },
        { executionId: run._id, nodeId: 'node-3', eventType: EventType.AI_REQUEST, level: 'INFO', message: 'Extracting named entities (Location, Name, Date)', timestamp: new Date(logTime += 300) },
      ];

      if (status === ExecutionStatus.COMPLETED) {
        logs.push({ executionId: run._id, nodeId: 'node-4', eventType: EventType.NODE_COMPLETED, level: 'INFO', message: 'Condition Evaluated to TRUE. Routing to Auto-Process.', timestamp: new Date(logTime += 100) });
        logs.push({ executionId: run._id, nodeId: 'node-6', eventType: EventType.NODE_COMPLETED, level: 'INFO', message: 'Mock Action Executed: Send Alert', timestamp: new Date(logTime += 200) });
        logs.push({ executionId: run._id, nodeId: 'node-7', eventType: EventType.EXECUTION_COMPLETED, level: 'INFO', message: 'Workflow Completed successfully.', timestamp: new Date(logTime += 100) });
      } else if (status === ExecutionStatus.FAILED) {
        logs.push({ executionId: run._id, nodeId: 'node-6', eventType: EventType.FAILED, level: 'ERROR', message: 'Failed to connect to external service (504 Timeout)', timestamp: new Date(logTime += 300) });
      } else if (status === ExecutionStatus.PAUSED) {
        logs.push({ executionId: run._id, nodeId: 'node-4', eventType: EventType.NODE_COMPLETED, level: 'INFO', message: 'Condition Evaluated to FALSE. Routing to Human Approval.', timestamp: new Date(logTime += 100) });
        logs.push({ executionId: run._id, nodeId: 'node-5', eventType: EventType.WAITING_FOR_APPROVAL, level: 'WARN', message: 'Approval Requested from Manager. Execution Paused.', timestamp: new Date(logTime += 200) });
        
        // Add pending approvals
        allApprovals.push({
          executionId: run._id,
          nodeId: 'node-5',
          reviewer: 'demo@flowforge.ai',
          status: ApprovalStatus.PENDING,
          comments: null,
          approvedAt: null,
        });
      }

      allLogs.push(...logs.map(log => ({
        runId: log.executionId,
        stepId: log.nodeId,
        attemptNumber: 1,
        status: ExecutionStatus.COMPLETED,
        reason: log.message,
        startedAt: log.timestamp,
        completedAt: new Date(log.timestamp.getTime() + 100)
      })));
    }

    await StepExecutionModel.insertMany(allLogs);
    
    // We need 6 pending approvals, but we might only have 3 paused executions. Add dummies to reach 6.
    while (allApprovals.length < 6) {
      allApprovals.push({
        executionId: generateId(), // dummy execution ID just to show up on approvals page
        nodeId: 'node-5',
        reviewer: 'admin@flowforge.ai',
        status: ApprovalStatus.PENDING,
        comments: null,
        approvedAt: null,
      });
    }
    
    await ApprovalModel.insertMany(allApprovals);

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Demo database seeding failed:', err);
  } finally {
    isSeeding = false;
  }
}
