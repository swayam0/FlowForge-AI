import mongoose from 'mongoose';
import connectToDatabase from './src/utils/db';
import { WorkflowModel } from './src/models/Workflow';
import { WorkflowVersionModel } from './src/models/WorkflowVersion';
import { WorkflowRunModel } from './src/models/WorkflowRun';
import { StepExecutionModel } from './src/models/StepExecution';
import { WorkflowEngine } from './src/server/engine/WorkflowEngine';
import { WorkflowRepository } from './src/repositories/WorkflowRepository';
import { WorkflowRunRepository } from './src/repositories/WorkflowRunRepository';
import { LoggingService } from './src/server/services/LoggingService';

async function runTests() {
  await connectToDatabase();
  console.log('--- STARTING SPEC VERIFICATION TESTS ---\n');

  const engine = new WorkflowEngine(new WorkflowRepository(), new WorkflowRunRepository(), new LoggingService());

  // 1. Get the seeded demo workflow
  const workflow = await WorkflowModel.findOne({ name: 'Support Ticket Triage' }).exec();
  if (!workflow) {
    console.error('Demo workflow not found. Please run seed script first.');
    process.exit(1);
  }

  const wId = workflow._id.toString();

  // Make sure version 1 exists
  let v1 = await WorkflowVersionModel.findOne({ workflowId: wId, versionNumber: 1 }).exec();
  if (!v1) {
    v1 = await WorkflowVersionModel.create({
      workflowId: wId,
      versionNumber: 1,
      snapshot: workflow.toObject()
    });
  }

  console.log('[TEST 1] VERSION COMPARE ENDPOINT');
  console.log('We have an API endpoint at GET /api/workflows/[id]/versions/compare. No UI exists for it currently.');

  // Create Version 2 by editing the workflow (e.g. adding a permission to the Human Approval node)
  console.log('\n[TEST 2] CREATING VERSION 2 WITH STRICT PERMISSION');
  const modifiedNodes = workflow.nodes.map((node: any) => {
    if (node.type === 'STRUCTURED_INPUT' || node.type === 'structured_input') {
      return { ...node, permissions: ['ADMIN'] };
    }
    return node;
  });

  workflow.nodes = modifiedNodes;
  workflow.version = 2;
  await workflow.save();

  await WorkflowVersionModel.deleteOne({ workflowId: wId, versionNumber: 2 });

  const v2 = await WorkflowVersionModel.create({
    workflowId: wId,
    versionNumber: 2,
    snapshot: workflow.toObject()
  });
  console.log(`Version 2 created. Human Approval node now requires 'ADMIN' permission.`);

  console.log('\n[TEST 3] RUNNING VERSION 2 TO TEST PERMISSION ENFORCEMENT');
  // Run version 2 with default roles (USER)
  const v2RunId = await engine.startRun(v2._id.toString(), {
    ticket_id: "TICK-V2",
    description: "Server is down",
    callerRoles: ['USER'] // default roles
  });

  console.log(`Started Version 2 run: ${v2RunId}. Waiting 2 seconds for execution loop...`);
  await new Promise(r => setTimeout(r, 2000));

  const v2Run = await WorkflowRunModel.findById(v2RunId).exec();
  console.log(`Version 2 Run Status: ${v2Run?.status}`);
  
  const v2Logs = await StepExecutionModel.find({ runId: v2RunId }).sort({ startedAt: -1 }).limit(1).exec();
  if (v2Logs.length > 0) {
    console.log(`Last step execution status: ${v2Logs[0].status}`);
    console.log(`Last step error/reason: ${v2Logs[0].error || v2Logs[0].reason}`);
  }

  console.log('\n[TEST 4] RERUNNING VERSION 1 (NO PERMISSIONS)');
  // Version 1 did not have the ADMIN permission on the approval node.
  // We will run it with the exact same input. It should hit PAUSED for approval, not FAILED.
  const v1RunId = await engine.startRun(v1._id.toString(), {
    ticket_id: "TICK-V1",
    description: "Server is down",
    callerRoles: ['USER']
  });

  console.log(`Started Version 1 run: ${v1RunId}. Waiting 5 seconds for execution loop...`);
  await new Promise(r => setTimeout(r, 5000));

  const v1Run = await WorkflowRunModel.findById(v1RunId).exec();
  console.log(`Version 1 Run Status: ${v1Run?.status}`);

  const v1Logs = await StepExecutionModel.find({ runId: v1RunId, status: 'PAUSED' }).limit(1).exec();
  if (v1Logs.length > 0) {
    console.log(`Version 1 successfully hit Approval step and paused. Status: ${v1Logs[0].status}`);
  } else {
    console.log(`Version 1 did not pause as expected. Check logs.`);
  }

  console.log('\n--- TESTS COMPLETE ---');
  process.exit(0);
}

runTests().catch(console.error);
