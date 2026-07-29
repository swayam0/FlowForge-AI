const mongoose = require('mongoose');

async function testEngine() {
  await mongoose.connect('mongodb+srv://swayam:***REMOVED***@cluster0.ikvycii.mongodb.net/flowforge-ai?appName=Cluster0');
  
  const Schema = mongoose.Schema;
  const TestModel = mongoose.model('TestEmpty', new Schema({ input: { type: Schema.Types.Mixed } }));
  
  const doc = await TestModel.create({ input: {} });
  console.log('Doc:', doc.toJSON());
  
  const found = await TestModel.find({ input: { $exists: true } });
  console.log('Found exists:', found.length > 0);
  
  process.exit(0);
}
testEngine().catch(console.error);
