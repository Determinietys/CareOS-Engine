/**
 * Rate Limiting Implementation
 * Supports both in-memory (dev) and Redis (production) backends
 */

import { NextRequest } from 'next/server';
import { Errors } from './errors';

interface RateLimitConfig {
  interval: number; // Time window in seconds
  limit: number; // Max requests per interval
  identifier: (req: NextRequest) => string; // Function to get unique identifier
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp
  limit: number;
}

// In-memory store for development (use Redis in production)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory rate limiter (for development)
 */
async function rateLimitMemory(
  key: string,
  interval: number,
  limit: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + interval * 1000;

  const existing = memoryStore.get(key);

  // Clean expired entries periodically
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) {
        memoryStore.delete(k);
      }
    }
  }

  if (!existing || existing.resetAt < now) {
    // Create new entry
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
      limit,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: Math.floor(existing.resetAt / 1000),
      limit,
    };
  }

  // Increment counter
  existing.count++;
  memoryStore.set(key, existing);

  return {
    success: true,
    remaining: limit - existing.count,
    reset: Math.floor(existing.resetAt / 1000),
    limit,
  };
}

/**
 * Redis rate limiter (for production)
 * Uses Upstash Redis or self-hosted Redis
 */
async function rateLimitRedis(
  key: string,
  interval: number,
  limit: number
): Promise<RateLimitResult> {
  try {
    // Check if Upstash Redis is configured
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      // Use Upstash Redis REST API
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');

      const redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${interval} s`),
        analytics: true,
      });

      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        limit,
      };
    }

    // Fallback to memory if Redis not configured
    return rateLimitMemory(key, interval, limit);
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error);
    return rateLimitMemory(key, interval, limit);
  }
}

/**
 * Rate limit middleware
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = config.identifier(req);
  const key = `ratelimit:${identifier}`;

  // Use Redis in production, memory in development
  const useRedis = process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL;

  if (useRedis) {
    return rateLimitRedis(key, config.interval, config.limit);
  } else {
    return rateLimitMemory(key, config.interval, config.limit);
  }
}

/**
 * Create rate limit configs for different endpoints
 */
export const RATE_LIMITS = {
  // Public endpoints
  auth: {
    interval: 60, // 1 minute
    limit: 5, // 5 requests per minute
    identifier: (req: NextRequest) => {
      // Rate limit by IP
      return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    },
  },

  // Partner API endpoints
  partnerApi: {
    interval: 60, // 1 minute
    limit: 100, // 100 requests per minute per partner
    identifier: (req: NextRequest) => {
      const platform = req.headers.get('X-Platform') || 'unknown';
      const apiKey = req.headers.get('X-API-Key') || 'unknown';
      // Rate limit by platform + API key hash (last 8 chars)
      return `${platform}:${apiKey.slice(-8)}`;
    },
  },

  // SMS webhook (Twilio)
  smsWebhook: {
    interval: 60,
    limit: 1000, // High limit for Twilio webhooks
    identifier: (req: NextRequest) => {
      // Rate limit by IP (Twilio IPs)
      return req.ip || req.headers.get('x-forwarded-for') || 'twilio';
    },
  },

  // General API endpoints
  api: {
    interval: 60,
    limit: 60, // 60 requests per minute per user
    identifier: (req: NextRequest) => {
      // Rate limit by user session or IP
      const sessionId = req.headers.get('x-session-id');
      if (sessionId) return `session:${sessionId}`;
      return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    },
  },

  // Strict rate limit for sensitive operations
  sensitive: {
    interval: 300, // 5 minutes
    limit: 3, // 3 requests per 5 minutes
    identifier: (req: NextRequest) => {
      const sessionId = req.headers.get('x-session-id');
      if (sessionId) return `sensitive:${sessionId}`;
      return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    },
  },
};

/**
 * Rate limit decorator for API routes
 */
export function withRateLimit(
  config: RateLimitConfig
): (
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) => (req: NextRequest, context?: any) => Promise<NextResponse> {
  return (handler) => {
    return async (req: NextRequest, context?: any) => {
      const result = await rateLimit(req, config);

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
            },
          }
        );
      }

      // Add rate limit headers to response
      const response = await handler(req, context);
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.reset.toString());

      return response;
    };
  };
}

