import Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export class RateLimiter {
  constructor(
    private redis: Redis,
    private limitPerMinute: number = 60,
    private windowSeconds: number = 60
  ) {}

  private async increment(key: string): Promise<number> {
    const redisKey = `rl:${key}`;
    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      await this.redis.expire(redisKey, this.windowSeconds);
    }
    return count;
  }

  async check(keys: string[]): Promise<RateLimitResult> {
    for (const key of keys) {
      const value = await this.increment(key);
      if (value > this.limitPerMinute) {
        return { allowed: false, retryAfter: this.windowSeconds };
      }
    }
    return { allowed: true };
  }
}
