import { DELETED_RECORD_DAYS, FINGERPRINT_RETENTION_DAYS } from "@/lib/domain";
import { hashEmail } from "@/lib/emailHash";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";

/** How many reports about this person, their homes or their searches are still open or were upheld. Dismissed ones do not count. */
async function liveReportsAbout(db: Db, userId: string): Promise<number> {
  const [homes, searches] = await Promise.all([
    db.listing.findMany({ where: { ownerId: userId }, select: { id: true }, take: 200 }),
    db.requirement.findMany({ where: { tenantId: userId }, select: { id: true }, take: 200 }),
  ]);
  return db.report.count({
    where: {
      status: { not: "DISMISSED" },
      OR: [
        { targetType: "USER", targetId: userId },
        { targetType: "LISTING", targetId: { in: homes.map((h) => h.id) } },
        { targetType: "REQUIREMENT", targetId: { in: searches.map((s) => s.id) } },
      ],
    },
  });
}

/**
 * Account deletion. Personal data goes immediately, content disappears from every page, and sign-in
 * methods are removed. The empty shell row stays for 30 days (for abuse follow-up), then the daily job removes it.
 *
 * One exception, so deleting cannot be used to escape a safety report: if a report about the person is still open or was
 * upheld, a one-way keyed fingerprint of the email (not the email) is kept on the shell for up to a year. It lets us
 * recognise a return under the same address. Nothing readable is kept.
 */
export async function deleteAccount(db: Db, actor: Actor | null) {
  const user = await requireActiveUser(db, actor);
  const reports = await liveReportsAbout(db, user.id);
  let emailHash: string | null = null;
  if (reports > 0) {
    const row = await db.user.findUnique({ where: { id: user.id }, select: { email: true } });
    if (row?.email) emailHash = hashEmail(row.email);
  }
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
      data: {
        status: "DELETED", deletedAt: new Date(), name: null, phone: null, trustedContactName: null, trustedContactPhone: null, image: null,
        email: `deleted-${user.id}@deleted.invalid`, emailVerified: null,
        emailHash,
      },
    }),
    // A plain record that the account was deleted, so the review team can see it without reading any personal data.
    db.auditLog.create({
      data: { actorId: user.id, action: "ACCOUNT_DELETED", targetType: "USER", targetId: user.id, detail: `open or upheld reports: ${reports}` },
    }),
  ]);
}

/** Removes emptied accounts. Ones holding a fingerprint stay a year, the rest 30 days. Anyone who filed a report stays. */
export async function purgeDeletedAccounts(db: Db): Promise<number> {
  const day = 86_400_000;
  const plainCutoff = new Date(Date.now() - DELETED_RECORD_DAYS * day);
  const fingerprintCutoff = new Date(Date.now() - FINGERPRINT_RETENTION_DAYS * day);
  const stale = await db.user.findMany({
    where: {
      status: "DELETED",
      reports: { none: {} },
      OR: [
        { emailHash: null, deletedAt: { lt: plainCutoff } },
        { emailHash: { not: null }, deletedAt: { lt: fingerprintCutoff } },
      ],
    },
    select: { id: true },
    take: 100,
  });
  if (stale.length === 0) return 0;
  const res = await db.user.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });
  return res.count;
}
