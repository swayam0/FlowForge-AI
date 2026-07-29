const mongoose = require('mongoose');
require('dotenv').config();

async function testEngine() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flowforge-ai');
  
  const Schema = mongoose.Schema;
  const TestModel = mongoose.model('TestEmpty', new Schema({ input: { type: Schema.Types.Mixed } }));
  
  const doc = await TestModel.create({ input: {} });
  console.log('Doc:', doc.toJSON());
  
  const found = await TestModel.find({ input: { $exists: true } });
  console.log('Found exists:', found.length > 0);
  
  process.exit(0);
}
testEngine().catch(console.error);
