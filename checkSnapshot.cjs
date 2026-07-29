const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flowforge-ai');
  
  const WorkflowRunModel = mongoose.model('WorkflowRun', new mongoose.Schema({}, { strict: false }));
  const WorkflowVersionModel = mongoose.model('WorkflowVersion', new mongoose.Schema({}, { strict: false }));
  
  const latestRun = await WorkflowRunModel.findOne().sort({ createdAt: -1 }).exec();
  if (!latestRun) return console.log('No runs found');
  
  const version = await WorkflowVersionModel.findById(latestRun.workflowVersionId).exec();
  
  console.log('Version Snapshot Nodes length:', version.snapshot.nodes ? version.snapshot.nodes.length : 'undefined');
  console.log('Version Snapshot Edges length:', version.snapshot.edges ? version.snapshot.edges.length : 'undefined');
  console.log('Version Snapshot nodes:', JSON.stringify(version.snapshot.nodes, null, 2));
  console.log('Version Snapshot edges:', JSON.stringify(version.snapshot.edges, null, 2));
  
  process.exit(0);
}
check().catch(console.error);
