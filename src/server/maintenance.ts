import type { Db } from "./db";
import { purgeDeletedAccounts } from "./deletion";

/** Daily housekeeping. One bounded pass per task so a single run stays inside Hobby limits. */
export async function runDailyMaintenance(db: Db) {
  const now = new Date();
  const expired = await db.listing.updateMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const limits = await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 2 * 86_400_000) } } });
  const tokens = await db.verificationToken.deleteMany({ where: { expires: { lt: now } } });
  const purged = await purgeDeletedAccounts(db);
  return { expiredListings: expired.count, rateLimitRows: limits.count, tokens: tokens.count, purgedAccounts: purged };
}
