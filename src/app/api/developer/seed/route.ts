export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../utils/db';
import { WorkflowModel } from '../../../../models/Workflow';
import { WorkflowRunModel } from '../../../../models/WorkflowRun';
import { WorkflowStatus, WorkflowStepType, ExecutionStatus } from '../../../../types/common';
import { successResponse, errorResponse } from '../../responseHelper';

export async function POST() {
  try {
    await connectToDatabase();
    
    // Check if demo workflow already exists
    const existing = await WorkflowModel.findOne({ name: 'Support Ticket Triage' });
    if (existing) {
      return errorResponse('Demo workflow already exists', null, 400);
    }

    const nodes = [
      { id: 'input', type: WorkflowStepType.STRUCTURED_INPUT, label: 'Ticket Received', position: { x: 100, y: 300 }, configuration: {} },
      { id: 'retrieve', type: WorkflowStepType.DOCUMENT_RETRIEVAL, label: 'Find KB Articles', position: { x: 350, y: 300 }, configuration: { query: 'Find similar past tickets and KB articles.' } },
      { id: 'extract', type: WorkflowStepType.AI_EXTRACTION, label: 'Extract Urgency', position: { x: 600, y: 300 }, configuration: { prompt: 'Extract the issue category and any urgency signals from this support ticket.' } },
      { id: 'classify', type: WorkflowStepType.AI_CLASSIFICATION, label: 'Priority Routing', position: { x: 850, y: 300 }, configuration: {} },
      { id: 'condition', type: WorkflowStepType.DETERMINISTIC_CONDITION, label: 'Escalation Check', position: { x: 1100, y: 300 }, configuration: { field: 'priority', operator: 'equals', value: 'CRITICAL' } },
      { id: 'approval', type: WorkflowStepType.HUMAN_APPROVAL, label: 'Manager Sign-off', position: { x: 1350, y: 150 }, configuration: { reason: 'Escalation requires manager sign-off before auto-resolution' } },
      { id: 'auto_resolve', type: WorkflowStepType.MOCK_EXTERNAL_ACTION, label: 'Auto-Create Ticket', position: { x: 1350, y: 450 }, configuration: { reason: 'Auto-create ticket in support system' } },
      { id: 'notify', type: WorkflowStepType.MOCK_EXTERNAL_ACTION, label: 'Notify Customer', position: { x: 1600, y: 300 }, configuration: { reason: 'Send customer acknowledgment email' } },
      { id: 'report', type: WorkflowStepType.FINAL_REPORT, label: 'Resolution Summary', position: { x: 1850, y: 300 }, configuration: { reason: 'Summarize category, priority, action taken, and total resolution time' } }
    ];

    const edges = [
      { id: 'e1', source: 'input', target: 'retrieve' },
      { id: 'e2', source: 'retrieve', target: 'extract' },
      { id: 'e3', source: 'extract', target: 'classify' },
      { id: 'e4', source: 'classify', target: 'condition' },
      { id: 'e5', source: 'condition', target: 'approval', label: 'TRUE' }, // CRITICAL
      { id: 'e6', source: 'condition', target: 'auto_resolve', label: 'FALSE' }, // NORMAL
      { id: 'e7', source: 'approval', target: 'notify' },
      { id: 'e8', source: 'auto_resolve', target: 'notify' },
      { id: 'e9', source: 'notify', target: 'report' }
    ];

    const workflow = await WorkflowModel.create({
      name: 'Support Ticket Triage',
      description: 'A realistic customer support escalation flow that classifies tickets and routes critical ones to manager approval before resolution.',
      version: 1,
      status: WorkflowStatus.PUBLISHED,
      nodes,
      edges,
      createdBy: 'demo@flowforge.ai',
    });

    const sample1 = {
      source: 'api',
      payload: {
        subject: "Password reset not working",
        description: "I tried resetting my password but the email link says expired. Can you just send me a temporary password?",
        customer_tier: "standard"
      }
    };

    const sample2 = {
      source: 'api',
      payload: {
        subject: "PRODUCTION DOWN - ALL CLUSTERS OFFLINE",
        description: "Our entire e-commerce backend is returning 502 Bad Gateway. This is costing us millions per minute. Need immediate escalation!!",
        customer_tier: "enterprise"
      }
    };

    await WorkflowRunModel.create({
      workflowVersionId: workflow._id,
      status: ExecutionStatus.COMPLETED,
      durationMs: 3450,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3600000 + 3450),
      executionPath: ['input', 'retrieve', 'extract', 'classify', 'condition', 'auto_resolve', 'notify', 'report'],
      input: sample1,
      state: { priority: "LOW" }
    });

    await WorkflowRunModel.create({
      workflowVersionId: workflow._id,
      status: ExecutionStatus.PAUSED,
      durationMs: 4200,
      startedAt: new Date(Date.now() - 1800000),
      executionPath: ['input', 'retrieve', 'extract', 'classify', 'condition', 'approval'],
      input: sample2,
      state: { priority: "CRITICAL" },
      currentNodeId: 'approval'
    });

    return successResponse(null, 'Demo seeded successfully');
  } catch (error) {
    return errorResponse('Failed to seed demo data', error, 500);
  }
}
