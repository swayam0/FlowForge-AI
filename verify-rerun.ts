import connectToDatabase from './src/utils/db';
import { WorkflowModel } from './src/models/Workflow';
import { WorkflowVersionModel } from './src/models/WorkflowVersion';
import { WorkflowRunModel } from './src/models/WorkflowRun';

async function runTest() {
  await connectToDatabase();

  const workflow = await WorkflowModel.findOne({ name: 'Support Ticket Triage' }).exec();
  if (!workflow) { console.error('Workflow not found'); process.exit(1); }
  const wId = workflow._id.toString();

  const v1 = await WorkflowVersionModel.findOne({ workflowId: wId, versionNumber: 1 }).exec();
  if (!v1) { console.error('Version 1 not found'); process.exit(1); }

  // Find an existing v1 run to rerun from
  const existingRun = await WorkflowRunModel.findOne({ workflowVersionId: v1._id.toString() }).sort({ createdAt: -1 }).exec();
  if (!existingRun) { console.error('No v1 run found'); process.exit(1); }

  console.log(`[${new Date().toISOString()}] Triggering rerun of history/${existingRun._id}`);

  const rerunRes = await fetch(`http://localhost:3000/api/history/${existingRun._id}/rerun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ticketTitle: 'Login issue', ticketBody: "I can't log in to my account. Error 401." }
    })
  });
  const rerunData = await rerunRes.json();
  const rerunId = rerunData.data?.executionId;
  console.log(`[${new Date().toISOString()}] New run ID: ${rerunId}`);
  console.log(`[${new Date().toISOString()}] Raw rerun response: ${JSON.stringify(rerunData)}`);

  if (!rerunId) {
    console.error('Failed to get a run ID. Aborting.');
    process.exit(1);
  }

  // Poll every 5s up to 120s
  const POLL_INTERVAL_MS = 5000;
  const MAX_POLLS = 24; // 120s
  let pollCount = 0;
  let finalStatus = '';
  const terminalStatuses = new Set(['COMPLETED', 'FAILED', 'PAUSED', 'PAUSED_FOR_APPROVAL']);

  console.log(`\n[${new Date().toISOString()}] Starting polling (max 120s, every 5s)...`);

  while (pollCount < MAX_POLLS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    pollCount++;

    const statusRes = await fetch(`http://localhost:3000/api/runs/${rerunId}`);
    const statusBody = await statusRes.json();
    finalStatus = statusBody?.data?.status || statusBody?.status || '';

    console.log(`[${new Date().toISOString()}] Poll #${pollCount}: status="${finalStatus}"`);

    if (terminalStatuses.has(finalStatus)) {
      console.log(`[${new Date().toISOString()}] Terminal status reached. Stopping poll.`);
      break;
    }
  }

  console.log(`\n[${new Date().toISOString()}] === FINAL STATUS: ${finalStatus || '(still running / unknown)'} ===`);

  // Fetch full step-by-step log
  const logsRes = await fetch(`http://localhost:3000/api/runs/${rerunId}/logs`);
  const logsBody = await logsRes.json();
  console.log(`\n[${new Date().toISOString()}] === FULL EXECUTION LOG ===`);
  console.log(JSON.stringify(logsBody, null, 2));

  // If paused, approve
  if (finalStatus === 'PAUSED' || finalStatus === 'PAUSED_FOR_APPROVAL') {
    console.log(`\n[${new Date().toISOString()}] Run is PAUSED — sending approval...`);
    const resumeRes = await fetch(`http://localhost:3000/api/runs/${rerunId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    });
    const resumeBody = await resumeRes.json();
    console.log(`[${new Date().toISOString()}] Resume response: ${JSON.stringify(resumeBody)}`);

    await new Promise(r => setTimeout(r, 8000));
    const finalRes = await fetch(`http://localhost:3000/api/runs/${rerunId}`);
    const finalBody = await finalRes.json();
    const statusAfterApproval = finalBody?.data?.status || finalBody?.status;
    console.log(`[${new Date().toISOString()}] STATUS AFTER APPROVAL: ${statusAfterApproval}`);

    const finalLogsRes = await fetch(`http://localhost:3000/api/runs/${rerunId}/logs`);
    const finalLogsBody = await finalLogsRes.json();
    console.log(`\n[${new Date().toISOString()}] === FULL LOG AFTER APPROVAL ===`);
    console.log(JSON.stringify(finalLogsBody, null, 2));
  }

  process.exit(0);
}

runTest().catch(e => { console.error(e); process.exit(1); });
