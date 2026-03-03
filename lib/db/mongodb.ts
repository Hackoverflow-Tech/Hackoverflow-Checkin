/**
 * MongoDB Connection Handler
 *
 * @module lib/db/mongodb
 * @description Singleton MongoDB client with connection pooling
 *
 * Best Practices:
 * - Uses global variable in development to preserve connection across hot reloads
 * - Production uses standard connection pooling
 * - Validates environment variables at runtime
 */

import { MongoClient, Db } from 'mongodb';
import { z } from 'zod';

// ============================================================================
// Environment Validation
// ============================================================================

const EnvSchema = z.object({
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  DB_NAME: z.string().default('hackoverflow'),
});

// Parse environment variables with validation
const parseEnv = (): { uri: string; dbName: string } => {
  const result = EnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    DB_NAME: process.env.DB_NAME,
  });

  if (!result.success) {
    throw new Error(
      `Environment validation failed: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`
    );
  }

  return {
    uri: result.data.MONGODB_URI,
    dbName: result.data.DB_NAME,
  };
};

// ============================================================================
// MongoDB Client Singleton
// ============================================================================

const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Global type declaration for development caching
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cachedDbName: string;

/**
 * Initialize MongoDB client connection
 */
function initializeClient(): Promise<MongoClient> {
  const { uri, dbName } = parseEnv();
  cachedDbName = dbName;

  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve the connection
    // across hot reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, MONGODB_OPTIONS);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // In production, create a new client
  const client = new MongoClient(uri, MONGODB_OPTIONS);
  return client.connect();
}

// Initialize on module load
const clientPromise: Promise<MongoClient> = initializeClient();

// ============================================================================
// Exports
// ============================================================================

/**
 * Get the MongoDB client promise
 */
export function getClientPromise(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Get a connected database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(cachedDbName);
}

/**
 * Get the configured database name
 */
export function getDatabaseName(): string {
  return cachedDbName || 'hackoverflow';
}

export default clientPromise;
