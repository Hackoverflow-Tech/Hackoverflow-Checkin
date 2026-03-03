'use server';

/**
 * Database Connection Status Actions
 *
 * @module actions/database
 * @description Server actions for database health checks
 */

import { headers } from 'next/headers';
import { getDatabase, getDatabaseName } from '@/lib/db';
import { ActionResult, createErrorResponse } from '@/lib/types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

// ============================================================================
// Types
// ============================================================================

interface ConnectionStatusData {
  message: string;
  database: string;
  collections: string[];
  participantCount: number;
}

// ============================================================================
// Rate Limiting Helper
// ============================================================================

async function getRateLimitIdentifier(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'anonymous';
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Check database connection status
 */
export async function checkDatabaseConnectionAction(): Promise<
  ActionResult<ConnectionStatusData>
> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const db = await getDatabase();
    const collectionsInfo = await db.listCollections().toArray();
    const collections = collectionsInfo.map((c) => c.name);
    const participantCount = await db.collection('participants').countDocuments();

    return {
      success: true,
      data: {
        message: 'Database connected successfully',
        database: getDatabaseName(),
        collections,
        participantCount,
      },
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Database connection failed',
      'DB_ERROR'
    );
  }
}

/**
 * Get quick database health status
 */
export async function getDatabaseHealthAction(): Promise<
  ActionResult<{ healthy: boolean; latencyMs: number }>
> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const startTime = Date.now();
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      data: { healthy: true, latencyMs },
    };
  } catch (error) {
    console.error('Database health check error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Database health check failed',
      'DB_ERROR'
    );
  }
}
