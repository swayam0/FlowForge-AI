const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowforge');
  
  const WorkflowVersionModel = mongoose.model('WorkflowVersion', new mongoose.Schema({}, { strict: false }));
  
  const versions = await WorkflowVersionModel.find({}).exec();
  console.log('All Versions:', versions.map(v => ({ id: v._id, workflowId: v.workflowId, type: typeof v.workflowId, isObjectId: v.workflowId instanceof mongoose.Types.ObjectId })));
  
  process.exit(0);
}
test().catch(console.error);
