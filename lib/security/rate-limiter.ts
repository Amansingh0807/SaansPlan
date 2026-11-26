/**
 * High-performance sliding-window in-memory rate limiter for API routes.
 * Protects endpoints from DDoS, scraper abuse, and GenAI token exhaustion.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private cache: Map<string, RateLimitRecord>;
  private windowMs: number;
  private maxRequests: number;
  private cleanupIntervalMs: number;
  private lastCleanup: number;

  constructor(options: {
    windowMs?: number;
    maxRequests?: number;
    cleanupIntervalMs?: number;
  } = {}) {
    this.cache = new Map();
    this.windowMs = options.windowMs ?? 60_000; // 1 minute default
    this.maxRequests = options.maxRequests ?? 60; // 60 req/window default
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 120_000; // 2 min cleanup
    this.lastCleanup = Date.now();
  }

  /**
   * Checks whether the given identifier (IP / userId) is allowed to proceed.
   */
  public check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
    total: number;
  } {
    const now = Date.now();
    this.periodicCleanup(now);

    const record = this.cache.get(identifier) ?? { timestamps: [] };
    const windowStart = now - this.windowMs;

    // Filter out timestamps outside current sliding window
    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldest = validTimestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
        total: validTimestamps.length,
      };
    }

    validTimestamps.push(now);
    this.cache.set(identifier, { timestamps: validTimestamps });

    const remaining = Math.max(0, this.maxRequests - validTimestamps.length);
    return {
      allowed: true,
      remaining,
      resetMs: this.windowMs,
      total: validTimestamps.length,
    };
  }

  /**
   * Cleans up expired entries to prevent memory leaks.
   */
  public cleanup(now = Date.now()): number {
    const windowStart = now - this.windowMs;
    let purged = 0;
    for (const [key, record] of this.cache.entries()) {
      const active = record.timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        this.cache.delete(key);
        purged++;
      } else {
        this.cache.set(key, { timestamps: active });
      }
    }
    this.lastCleanup = now;
    return purged;
  }

  private periodicCleanup(now: number) {
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup(now);
    }
  }

  public reset(identifier?: string): void {
    if (identifier) {
      this.cache.delete(identifier);
    } else {
      this.cache.clear();
    }
  }

  public size(): number {
    return this.cache.size;
  }
}

// Global singleton instances for API tiers
export const standardApiLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

export const planGenerationLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 20, // stricter limit for GenAI plan computation
});
