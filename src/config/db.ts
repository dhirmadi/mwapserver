import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient;
let db: Db;

// Initialize the MongoDB connection
export async function connectDB(): Promise<void> {
  try {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export { db };

// Export the database instance for use in other modules
export function getDB(): Db {
  if (!db) {
    console.error('❌ Database has not been initialized. Did you forget to call connectDB()?');
  }
  return db;
}

// Close the MongoDB connection when the application is terminated
process.on('SIGINT', async () => {
  await client?.close();
  console.log('MongoDB disconnected');
  process.exit(0);
});

