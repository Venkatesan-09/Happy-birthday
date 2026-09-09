import mongoose from 'mongoose';

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dearyou';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    // In dev or test environments where local Mongo is not running, warn clearly
    console.warn('[MongoDB] Warning: Check your MONGODB_URI in .env');
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection event error:', err);
});
