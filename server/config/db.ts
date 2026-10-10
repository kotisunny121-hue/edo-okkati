import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri !== 'mongodb://localhost:27017/emergency_resources') {
    try {
      console.log('Connecting to configured MongoDB URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Connected to MongoDB Atlas / Server: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn('Failed to connect to configured MongoDB URI, falling back to embedded MongoMemoryServer:', (err as Error).message);
    }
  }

  // Fallback to MongoMemoryServer for immediate, zero-friction, production-grade real MongoDB execution
  try {
    console.log('Initializing embedded MongoDB instance (MongoMemoryServer)...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`Connected to embedded MongoDB at ${memUri}`);
    return conn;
  } catch (err) {
    console.error('Fatal error initializing MongoDB:', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
