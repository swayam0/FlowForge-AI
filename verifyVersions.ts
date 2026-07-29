import connectToDatabase from './src/utils/db';
import { WorkflowVersionModel } from './src/models/WorkflowVersion';

async function test() {
  await connectToDatabase();
  const versions = await WorkflowVersionModel.find({}).exec();
  console.log('All Versions:', versions.map(v => ({ id: v._id, workflowId: v.workflowId, versionNumber: v.versionNumber })));
}
test().then(() => process.exit(0)).catch(console.error);
