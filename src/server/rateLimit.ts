import type { Db } from "./db";
import { AppError } from "./errors";

export interface RateLimiter {
  /** Returns the number of hits in the current window, including this one. */
  hit(key: string, windowSeconds: number): Promise<number>;
}

/**
 * Counter stored in Postgres so it works on Vercel without another service.
 * Swap for an Upstash-backed class with the same interface when traffic needs it.
 */
export class PostgresRateLimiter implements RateLimiter {
  constructor(private readonly db: Db) {}

  async hit(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
    const row = await this.db.rateLimit.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return row.count;
  }
}

export const LIMITS = {
  createListing: { max: 5, windowSeconds: 86_400 },
  locate: { max: 40, windowSeconds: 86_400 },
  createRequirement: { max: 5, windowSeconds: 86_400 },
  sendInterest: { max: 15, windowSeconds: 86_400 },
  invite: { max: 20, windowSeconds: 86_400 },
  report: { max: 10, windowSeconds: 86_400 },
  upload: { max: 40, windowSeconds: 86_400 },
} as const;

export async function enforce(
  limiter: RateLimiter,
  action: keyof typeof LIMITS,
  subject: string,
): Promise<void> {
  const { max, windowSeconds } = LIMITS[action];
  const count = await limiter.hit(`${action}:${subject}`, windowSeconds);
  if (count > max) throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later.");
}
