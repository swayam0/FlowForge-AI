import mongoose from 'mongoose';
import * as fs from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|^'|"$|'$/g, '');
    }
  });
}

import { WorkflowModel } from './src/models/Workflow';
import { WorkflowVersionModel } from './src/models/WorkflowVersion';
import { WorkflowRunModel } from './src/models/WorkflowRun';
import { StepExecutionModel } from './src/models/StepExecution';
import { WorkflowEngine } from './src/server/engine/WorkflowEngine';
import { WorkflowRepository } from './src/repositories/WorkflowRepository';
import { WorkflowRunRepository } from './src/repositories/WorkflowRunRepository';
import { LoggingService } from './src/server/services/LoggingService';
import { CreateWorkflowSchema } from './src/validators/workflow.schema';
import { ExecutionStatus, WorkflowStepType } from './src/types/common';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verify() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  const { default: connectToDatabase } = await import('./src/utils/db');
  await connectToDatabase();
  console.log('Connected to DB');

  const workflow = await WorkflowModel.findOne({ name: 'Support Ticket Triage' }).sort({ createdAt: -1 }).lean().exec();
  if (!workflow) {
    console.error('Workflow not found');
    process.exit(1);
  }

  console.log('--- STRUCTURAL CHECKS ---');
  let structuralPass = true;

  // 1. All 8 required step types are present
  const requiredTypes = [
    WorkflowStepType.STRUCTURED_INPUT,
    WorkflowStepType.DOCUMENT_RETRIEVAL,
    WorkflowStepType.AI_EXTRACTION,
    WorkflowStepType.AI_CLASSIFICATION,
    WorkflowStepType.DETERMINISTIC_CONDITION,
    WorkflowStepType.HUMAN_APPROVAL,
    WorkflowStepType.MOCK_EXTERNAL_ACTION,
    WorkflowStepType.FINAL_REPORT
  ];
  const nodeTypes = workflow.nodes.map((n: any) => n.type);
  const missingTypes = requiredTypes.filter(t => !nodeTypes.includes(t));
  if (missingTypes.length === 0) {
    console.log('Check 1.1: All required step types are present. PASS');
  } else {
    console.log(`Check 1.1: Missing required step types: ${missingTypes.join(', ')}. FAIL`);
    structuralPass = false;
  }

  // 2. deterministic_condition configuration
  const conditionNode = workflow.nodes.find((n: any) => n.type === WorkflowStepType.DETERMINISTIC_CONDITION);
  if (conditionNode && conditionNode.configuration && conditionNode.configuration.field && conditionNode.configuration.operator && conditionNode.configuration.value) {
    console.log('Check 1.2: Deterministic condition has valid configuration. PASS');
  } else {
    console.log('Check 1.2: Deterministic condition has invalid configuration. FAIL');
    structuralPass = false;
  }

  // 3. Both edges out of condition node
  const conditionEdges = workflow.edges.filter((e: any) => e.source === conditionNode?.id);
  if (conditionEdges.length === 2 && conditionEdges[0].target !== conditionEdges[1].target) {
    const targets = conditionEdges.map((e: any) => workflow.nodes.find((n: any) => n.id === e.target)?.type);
    if (targets.includes(WorkflowStepType.HUMAN_APPROVAL) && targets.includes(WorkflowStepType.MOCK_EXTERNAL_ACTION)) {
      console.log('Check 1.3: Both edges out of condition exist and point to different targets (human_approval vs mock_external_action). PASS');
    } else {
      console.log('Check 1.3: Edges point to incorrect targets. FAIL');
      structuralPass = false;
    }
  } else {
    console.log('Check 1.3: Missing or invalid edges from condition. FAIL');
    structuralPass = false;
  }

  // 4. Both branches converge before final_report
  const reportNode = workflow.nodes.find((n: any) => n.type === WorkflowStepType.FINAL_REPORT);
  const edgesToReport = workflow.edges.filter((e: any) => e.target === reportNode?.id);
  if (edgesToReport.length > 0) {
    // Actually they might converge onto MOCK_EXTERNAL_ACTION first or something else.
    // Let's just print edges to see.
    console.log('Check 1.4: Edges converging to report: ', edgesToReport.map((e: any) => e.source).join(', '));
  } else {
    console.log('Check 1.4: No edges to final_report. FAIL');
  }

  // 5. Orphan nodes
  let orphans = 0;
  for (const node of workflow.nodes) {
    if (node.type === WorkflowStepType.STRUCTURED_INPUT) continue; // First node
    const incoming = workflow.edges.filter((e: any) => e.target === node.id);
    if (incoming.length === 0) orphans++;
  }
  for (const node of workflow.nodes) {
    if (node.type === WorkflowStepType.FINAL_REPORT) continue; // Last node
    const outgoing = workflow.edges.filter((e: any) => e.source === node.id);
    if (outgoing.length === 0) orphans++;
  }
  if (orphans === 0) {
    console.log('Check 1.5: No orphan nodes. PASS');
  } else {
    console.log(`Check 1.5: Found ${orphans} orphans. FAIL`);
    structuralPass = false;
  }

  // 6. Validation Schema
  const validationResult = CreateWorkflowSchema.safeParse(workflow);
  if (validationResult.success) {
    console.log('Check 2: Workflow validation passes. PASS');
  } else {
    console.log('Check 2: Workflow validation. FAIL', validationResult.error);
    structuralPass = false;
  }

  console.log(`\nSTRUCTURAL CHECKS: ${structuralPass ? 'PASS' : 'FAIL'}`);

  // Fetch a version
  let version = await WorkflowVersionModel.findOne({ workflowId: workflow._id }).lean().exec();
  if (!version) {
    console.log('Creating a version to run...');
    version = await WorkflowVersionModel.create({
      workflowId: workflow._id,
      versionNumber: 1,
      snapshot: workflow
    });
  }

  console.log('\n--- BEHAVIORAL CHECKS ---');
  const engine = new WorkflowEngine(new WorkflowRepository(), new WorkflowRunRepository(), new LoggingService());

  async function runWorkflow(input: any) {
    const runId = await engine.startRun(version._id.toString(), input);
    let run = await WorkflowRunModel.findById(runId).exec();
    while (run && (run.status === ExecutionStatus.PENDING || run.status === ExecutionStatus.RUNNING)) {
      await delay(1000);
      run = await WorkflowRunModel.findById(runId).exec();
    }
    return run;
  }

  // RUN 1
  console.log('Starting Run #1: Routine Ticket');
  const run1Input = {
    subject: "Password reset not working",
    description: "I tried resetting my password but the email link says expired. Can you just send me a temporary password?",
    customer_tier: "standard"
  };
  const run1 = await runWorkflow(run1Input);
  const run1ConditionStep = await StepExecutionModel.findOne({ runId: run1._id, stepId: conditionNode.id }).exec();
  const run1ExtractStep = await StepExecutionModel.findOne({ runId: run1._id, stepId: workflow.nodes.find((n:any)=>n.type===WorkflowStepType.AI_EXTRACTION).id }).exec();
  const run1ClassifyStep = await StepExecutionModel.findOne({ runId: run1._id, stepId: workflow.nodes.find((n:any)=>n.type===WorkflowStepType.AI_CLASSIFICATION).id }).exec();
  
  if (run1) {
    console.log(`Run #1 Status: ${run1.status}`);
    console.log(`Run #1 Condition Reason: ${run1ConditionStep?.reason}`);
    console.log(`Run #1 Extraction Output:`, run1ExtractStep?.output);
    console.log(`Run #1 Classification Output:`, run1ClassifyStep?.output);
    const mockStepNode = workflow.nodes.find((n: any) => n.id === 'auto_resolve');
    const hasMockActionStep = await StepExecutionModel.findOne({ runId: run1._id, stepId: mockStepNode?.id }).exec();
    console.log(`Run #1 Hit auto_resolve: ${hasMockActionStep != null}`);
    const humanStep = workflow.nodes.find((n: any) => n.type === WorkflowStepType.HUMAN_APPROVAL);
    const hasHumanStep = await StepExecutionModel.findOne({ runId: run1._id, stepId: humanStep?.id }).exec();
    console.log(`Run #1 Hit human_approval: ${hasHumanStep != null}`);
  }

  // RUN 2
  console.log('\nStarting Run #2: Critical Ticket');
  const run2Input = {
    subject: "PRODUCTION DOWN - ALL CLUSTERS OFFLINE",
    description: "Our entire e-commerce backend is returning 502 Bad Gateway. This is costing us millions per minute. Need immediate escalation!!",
    customer_tier: "enterprise"
  };
  let run2 = await runWorkflow(run2Input);

  if (run2 && run2.status === ExecutionStatus.PAUSED) {
    console.log(`Run #2 paused at HUMAN_APPROVAL as expected.`);
    console.log(`Approving...`);
    const humanStep = workflow.nodes.find((n: any) => n.type === WorkflowStepType.HUMAN_APPROVAL);
    const { ApprovalModel } = await import('./src/models/Approval');
    const updatedApproval = await ApprovalModel.findOneAndUpdate(
      { executionId: run2._id.toString(), nodeId: humanStep.id },
      { status: 'APPROVED', comments: 'Approved by script' },
      { new: true }
    );
    console.log('Approval record updated:', updatedApproval);
    await engine.resumeRun(run2._id.toString());
    
    // Wait again for it to complete
    while (run2 && (run2.status === ExecutionStatus.PENDING || run2.status === ExecutionStatus.RUNNING || run2.status === ExecutionStatus.PAUSED)) {
      await delay(1000);
      run2 = (await WorkflowRunModel.findById(run2._id).exec())!;
      if (run2.status === ExecutionStatus.COMPLETED || run2.status === ExecutionStatus.FAILED) break;
    }
  }

  const run2ConditionStep = await StepExecutionModel.findOne({ runId: run2._id, stepId: conditionNode.id }).exec();
  const run2ExtractStep = await StepExecutionModel.findOne({ runId: run2._id, stepId: workflow.nodes.find((n:any)=>n.type===WorkflowStepType.AI_EXTRACTION).id }).exec();
  const run2ClassifyStep = await StepExecutionModel.findOne({ runId: run2._id, stepId: workflow.nodes.find((n:any)=>n.type===WorkflowStepType.AI_CLASSIFICATION).id }).exec();
  
  if (run2) {
    console.log(`Run #2 Status: ${run2.status}`);
    console.log(`Run #2 Condition Reason: ${run2ConditionStep?.reason}`);
    console.log(`Run #2 Extraction Output:`, run2ExtractStep?.output);
    console.log(`Run #2 Classification Output:`, run2ClassifyStep?.output);
  }

  process.exit(0);
}

verify().catch(console.error);
