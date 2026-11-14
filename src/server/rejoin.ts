import { hashEmail } from "@/lib/emailHash";
import type { Db } from "./db";

/**
 * Called when a brand new account is created. If an account was deleted while a report about it was open or upheld and
 * had this same email, a note is written for the review team. Nothing is blocked: the decision is a person's.
 */
export async function flagRejoin(db: Db, newUserId: string, email: string | null | undefined): Promise<number> {
  if (!email) return 0;
  const earlier = await db.user.findMany({
    where: { status: "DELETED", emailHash: hashEmail(email), id: { not: newUserId } },
    select: { id: true },
    take: 5,
  });
  for (const old of earlier) {
    await db.auditLog.create({
      data: { actorId: "system", action: "REJOIN_AFTER_DELETION", targetType: "USER", targetId: newUserId, detail: `same email as deleted account ${old.id}` },
    });
  }
  return earlier.length;
}
