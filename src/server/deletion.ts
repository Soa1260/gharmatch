import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";

const PURGE_AFTER_DAYS = 30;

/**
 * Account deletion. Personal data goes immediately, content disappears from every page, and sign-in
 * methods are removed. The empty shell row stays for 30 days (for abuse follow-up), then the daily job removes it.
 */
export async function deleteAccount(db: Db, actor: Actor | null) {
  const user = await requireActiveUser(db, actor);
  await db.$transaction([
    db.interest.updateMany({
      where: { status: "PENDING", OR: [{ listing: { ownerId: user.id } }, { requirement: { tenantId: user.id } }] },
      data: { status: "WITHDRAWN", respondedAt: new Date() },
    }),
    db.listing.updateMany({ where: { ownerId: user.id }, data: { status: "DELETED" } }),
    db.requirement.updateMany({ where: { tenantId: user.id }, data: { status: "DELETED" } }),
    db.account.deleteMany({ where: { userId: user.id } }),
    db.user.update({
      where: { id: user.id },
      data: { status: "DELETED", deletedAt: new Date(), name: null, phone: null, trustedContactName: null, trustedContactPhone: null, image: null, email: `deleted-${user.id}@deleted.invalid`, emailVerified: null },
    }),
  ]);
}

export async function purgeDeletedAccounts(db: Db): Promise<number> {
  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 86_400_000);
  const stale = await db.user.findMany({
    where: { status: "DELETED", deletedAt: { lt: cutoff }, reports: { none: {} } },
    select: { id: true },
    take: 100,
  });
  if (stale.length === 0) return 0;
  const res = await db.user.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });
  return res.count;
}
