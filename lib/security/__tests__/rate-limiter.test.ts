import { describe, expect, it } from 'vitest';
import { SlidingWindowRateLimiter } from '../rate-limiter';

describe('SlidingWindowRateLimiter - API DDoS & Resource Protection', () => {
  it('allows requests within max limit', () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 3,
    });

    expect(limiter.check('user-1').allowed).toBe(true);
    expect(limiter.check('user-1').allowed).toBe(true);
    expect(limiter.check('user-1').allowed).toBe(true);
  });

  it('blocks requests exceeding max limit and returns reset time', () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 2,
    });

    expect(limiter.check('ip-a').allowed).toBe(true);
    expect(limiter.check('ip-a').allowed).toBe(true);

    const blocked = limiter.check('ip-a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
    expect(blocked.resetMs).toBeLessThanOrEqual(10_000);
  });

  it('isolates different client identifiers independently', () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
    });

    expect(limiter.check('client-1').allowed).toBe(true);
    expect(limiter.check('client-1').allowed).toBe(false);
    expect(limiter.check('client-2').allowed).toBe(true);
  });

  it('purges expired entries during cleanup', () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 1_000,
      maxRequests: 5,
    });

    limiter.check('temp-client');
    expect(limiter.size()).toBe(1);

    // Run cleanup simulated 2 seconds in future
    const purged = limiter.cleanup(Date.now() + 2_000);
    expect(purged).toBe(1);
    expect(limiter.size()).toBe(0);
  });

  it('supports manual resets', () => {
    const limiter = new SlidingWindowRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
    });

    limiter.check('user-x');
    expect(limiter.check('user-x').allowed).toBe(false);

    limiter.reset('user-x');
    expect(limiter.check('user-x').allowed).toBe(true);
  });
});
