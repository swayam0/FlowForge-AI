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
  console.log('--- STARTING FINAL VERIFICATION ---\n');

  const engine = new WorkflowEngine(new WorkflowRepository(), new WorkflowRunRepository(), new LoggingService());
  const workflow = await WorkflowModel.findOne({ name: 'Support Ticket Triage' }).exec();
  if (!workflow) {
    console.error("Workflow not found!");
    process.exit(1);
  }
  const wId = workflow._id.toString();

  // Test 1: Compare Endpoint
  console.log('\n=======================================');
  console.log('[TEST 1] VERSION COMPARE');
  console.log('=======================================');
  const res = await fetch(`http://localhost:3000/api/workflows/${wId}/versions/compare?v1=1&v2=2`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));

  // Test 2: Rerun version 1
  console.log('\n=======================================');
  console.log('[TEST 2] VERSION 1 RERUN - FULL COMPLETION');
  console.log('=======================================');
  
  const v1 = await WorkflowVersionModel.findOne({ workflowId: wId, versionNumber: 1 }).exec();
  
  const previousRun = await WorkflowRunModel.findOne({ workflowVersionId: v1._id.toString() }).sort({ createdAt: -1 }).exec();
  
  if (!previousRun) {
    console.log("No previous version 1 run found to rerun. Creating one...");
    const dummy = await WorkflowRunModel.create({
      workflowVersionId: v1._id.toString(),
      input: { ticketTitle: "Dummy" },
      status: 'COMPLETED'
    });
    previousRun._id = dummy._id;
  }
  
  const rerunRes = await fetch(`http://localhost:3000/api/history/${previousRun._id}/rerun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ticketTitle: "Login issue", ticketBody: "I can't log in to my account. Error 401." }
    })
  });
  const rerunData = await rerunRes.json();
  const rerunId = rerunData.data ? rerunData.data.executionId : (rerunData.runId || rerunData.id);
  console.log(`Triggered rerun, new run ID: ${rerunId}`);

  let runStatus = 'PENDING';
  let pollCount = 0;
  while (pollCount < 12) {
    const statusRes = await fetch(`http://localhost:3000/api/runs/${rerunId}`);
    const statusData = await statusRes.json();
    runStatus = statusData.status;
    
    if (['COMPLETED', 'PAUSED_FOR_APPROVAL', 'FAILED', 'PAUSED'].includes(runStatus)) {
      break;
    }
    await new Promise(r => setTimeout(r, 5000));
    pollCount++;
  }

  console.log(`\nFINAL STATUS: ${runStatus}`);
  const logsRes = await fetch(`http://localhost:3000/api/runs/${rerunId}/logs`);
  const logsData = await logsRes.json();
  console.log(`EXECUTION LOGS:`);
  console.log(JSON.stringify(logsData, null, 2));

  if (runStatus === 'PAUSED_FOR_APPROVAL' || runStatus === 'PAUSED') {
    console.log('\nApproving paused run...');
    await fetch(`http://localhost:3000/api/runs/${rerunId}/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) });
    
    await new Promise(r => setTimeout(r, 5000));
    const resumedStatusRes = await fetch(`http://localhost:3000/api/runs/${rerunId}`);
    const resumedStatusData = await resumedStatusRes.json();
    console.log(`STATUS AFTER APPROVAL: ${resumedStatusData.status}`);
  }


  // Test 3: Permission-Denial Reason Field
  console.log('\n=======================================');
  console.log('[TEST 3] PERMISSION-DENIAL REASON FIELD');
  console.log('=======================================');
  
  const v2 = await WorkflowVersionModel.findOne({ workflowId: wId, versionNumber: 2 }).exec();
  const v2Snapshot = v2.snapshot;
  
  const startNodeIndex = v2Snapshot.nodes.findIndex((n: any) => n.type === 'structured_input' || n.type === 'STRUCTURED_INPUT');
  if (startNodeIndex >= 0) {
    v2Snapshot.nodes[startNodeIndex].permissions = ['ADMIN'];
    await WorkflowVersionModel.updateOne({ _id: v2._id }, { snapshot: v2Snapshot });
  }

  const newRunId = await engine.startRun(v2._id.toString(), { ticketTitle: "Security Breach", _callerRole: 'USER' });

  // Wait for it to fail
  await new Promise(r => setTimeout(r, 2000));

  const failedStep = await StepExecutionModel.findOne({ runId: newRunId.toString(), status: 'FAILED' }).exec();
  if (failedStep) {
    console.log(`Failed Step ID: ${failedStep.stepId}`);
    console.log(`Reason Field: ${failedStep.reason}`);
  } else {
    console.log("No failed step found! Check logic.");
  }
  
  process.exit(0);
}

runTests().catch(console.error);
