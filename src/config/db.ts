import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient;
let db: Db;

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

process.on('SIGINT', async () => {
  await client?.close();
  console.log('MongoDB disconnected');
  process.exit(0);
});