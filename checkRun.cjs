const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://swayam:***REMOVED***@cluster0.ikvycii.mongodb.net/flowforge-ai?appName=Cluster0');
  
  const WorkflowRunModel = mongoose.model('WorkflowRun', new mongoose.Schema({}, { strict: false }));
  const StepExecutionModel = mongoose.model('StepExecution', new mongoose.Schema({}, { strict: false }));
  
  const latestRun = await WorkflowRunModel.findOne().sort({ createdAt: -1 }).exec();
  
  const steps = await StepExecutionModel.find({ $or: [{ runId: latestRun._id }, { runId: latestRun._id.toString() }] }).sort({ startedAt: 1 }).exec();
  console.log('Steps fully:', JSON.stringify(steps, null, 2));
  
  process.exit(0);
}
check().catch(console.error);
