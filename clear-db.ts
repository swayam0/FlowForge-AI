import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function clearDatabase() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const db = mongoose.connection.db!;
    
    // Get all collections
    const collections = await db.collections();
    
    for (let collection of collections) {
      console.log(`Dropping collection ${collection.collectionName}`);
      await collection.drop();
    }
    
    console.log("Database cleared successfully!");
  } catch (err) {
    console.error("Error clearing database:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearDatabase();
