import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly keyPrefix?: string;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetTime: number;
  readonly currentCount: number;
}

const rateLimitStore = new Map<string, number[]>();

setInterval(() => {
  for (const [key, timestamps] of rateLimitStore.entries()) {
    if (timestamps.length === 0) rateLimitStore.delete(key);
  }
}, 300000);

export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const clientIp = forwardedFor.split(',')[0]?.trim();
    if (clientIp) return clientIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'anonymous';
}

export async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const { maxRequests, windowMs, keyPrefix = 'default' } = config;
  const key = `ratelimit:${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  let timestamps = rateLimitStore.get(key) || [];
  timestamps = timestamps.filter(ts => ts > windowStart);
  const count = timestamps.length;
  const allowed = count < maxRequests;
  if (allowed) timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  const oldestTs = timestamps.length > 0 ? timestamps[0] : now;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - timestamps.length),
    resetTime: oldestTs + windowMs,
    currentCount: timestamps.length,
  };
}

export function createRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': result.allowed ? '0' : Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };
}

export const RateLimitPresets = {
  AUTH: { maxRequests: 5, windowMs: 60 * 1000, keyPrefix: 'auth' },
  LOGIN: { maxRequests: 3, windowMs: 60 * 1000, keyPrefix: 'login' },
  API: { maxRequests: 100, windowMs: 60 * 1000, keyPrefix: 'api' },
  READ: { maxRequests: 200, windowMs: 60 * 1000, keyPrefix: 'read' },
  SEND_EMAIL: { maxRequests: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'email' },
} as const;
