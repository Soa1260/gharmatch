import { z } from "zod";
import { requireAdminUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError } from "./errors";

/**
 * The review team's lookup of who is behind an account. It is the only place that reads a person's email and phone for
 * someone other than that person or an accepted match. It needs an administrator, a written reason on every lookup, and it
 * leaves a record of who looked, at whom, when and why. Admin checks happen here, not only on the page.
 */

export const lookupSchema = z.object({
  query: z.string().trim().min(3, "Enter an account id, an email address or a report id.").max(200),
  reason: z.string().trim().min(10, "Write the reason or reference, for example a notice number or the report id.").max(300),
});

export interface AccountRecord {
  user: {
    id: string; name: string | null; email: string; phone: string | null; status: string;
    isLandlord: boolean; isTenant: boolean; emailVerified: boolean;
    createdAt: string; deletedAt: string | null; identityCheckedAt: string | null; identityMethod: string | null;
    termsAcceptedAt: string | null; termsVersion: string | null; fingerprintKept: boolean;
  };
  listings: Array<{ id: string; slug: string; title: string; area: string; status: string; createdAt: string }>;
  searches: Array<{ id: string; city: string; status: string; createdAt: string }>;
  reportsAbout: Array<{ id: string; target: string; category: string; severity: string; status: string; createdAt: string }>;
  reportsFiled: number;
  interests: number;
  earlierLookups: Array<{ at: string; by: string; reason: string }>;
  rejoinNotes: Array<{ at: string; note: string }>;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

/** Finds the account for an email, an account id or a report id. The same message for all misses. */
async function resolveUserId(db: Db, query: string): Promise<string> {
  const miss = new AppError("NOT_FOUND", "No account found for that.");
  if (query.includes("@")) {
    const u = await db.user.findFirst({ where: { email: query.toLowerCase() }, select: { id: true } });
    if (!u) throw miss;
    return u.id;
  }
  const byId = await db.user.findUnique({ where: { id: query }, select: { id: true } });
  if (byId) return byId.id;
  const report = await db.report.findUnique({ where: { id: query }, select: { targetType: true, targetId: true } });
  if (!report) throw miss;
  if (report.targetType === "USER") return report.targetId;
  if (report.targetType === "LISTING") {
    const l = await db.listing.findUnique({ where: { id: report.targetId }, select: { ownerId: true } });
    if (l) return l.ownerId;
  } else {
    const r = await db.requirement.findUnique({ where: { id: report.targetId }, select: { tenantId: true } });
    if (r) return r.tenantId;
  }
  throw miss;
}

export async function lookupRecords(db: Db, actor: Actor | null, raw: unknown, admins?: string[]): Promise<AccountRecord> {
  const admin = await requireAdminUser(db, actor, admins);
  const input = lookupSchema.parse(raw);
  const userId = await resolveUserId(db, input.query);

  // The record of the lookup is written first. If it cannot be written, nothing is shown.
  const logged = await db.auditLog.create({
    data: { actorId: admin.id, action: "CONTACT_DETAILS_VIEWED", targetType: "USER", targetId: userId, detail: input.reason },
    select: { id: true },
  });

  const [user, listings, searches, reportsFiled, interests, audit] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, status: true, isLandlord: true, isTenant: true, emailVerified: true,
        createdAt: true, deletedAt: true, identityCheckedAt: true, identityMethod: true, termsAcceptedAt: true, termsVersion: true, emailHash: true,
      },
    }),
    db.listing.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, slug: true, title: true, area: true, status: true, createdAt: true } }),
    db.requirement.findMany({ where: { tenantId: userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, city: true, status: true, createdAt: true } }),
    db.report.count({ where: { reporterId: userId } }),
    db.interest.count({ where: { OR: [{ listing: { ownerId: userId } }, { requirement: { tenantId: userId } }] } }),
    db.auditLog.findMany({
      where: { id: { not: logged.id }, targetType: "USER", targetId: userId, action: { in: ["CONTACT_DETAILS_VIEWED", "REJOIN_AFTER_DELETION"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { actorId: true, action: true, detail: true, createdAt: true },
    }),
  ]);

  // Reports about the person, their homes or their searches. Who filed them is never included.
  const reports = await db.report.findMany({
    where: {
      OR: [
        { targetType: "USER", targetId: userId },
        { targetType: "LISTING", targetId: { in: listings.map((l) => l.id) } },
        { targetType: "REQUIREMENT", targetId: { in: searches.map((s) => s.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, targetType: true, category: true, severity: true, status: true, createdAt: true },
  });

  return {
    user: {
      id: user.id, name: user.name, email: user.email, phone: user.phone, status: user.status, isLandlord: user.isLandlord, isTenant: user.isTenant,
      emailVerified: user.emailVerified !== null, createdAt: user.createdAt.toISOString(), deletedAt: iso(user.deletedAt),
      identityCheckedAt: iso(user.identityCheckedAt), identityMethod: user.identityMethod, termsAcceptedAt: iso(user.termsAcceptedAt),
      termsVersion: user.termsVersion, fingerprintKept: user.emailHash !== null,
    },
    listings: listings.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    searches: searches.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    reportsAbout: reports.map((r) => ({ id: r.id, target: r.targetType, category: r.category, severity: r.severity, status: r.status, createdAt: r.createdAt.toISOString() })),
    reportsFiled,
    interests,
    earlierLookups: audit.filter((a) => a.action === "CONTACT_DETAILS_VIEWED").map((a) => ({ at: a.createdAt.toISOString(), by: a.actorId, reason: a.detail ?? "" })),
    rejoinNotes: audit.filter((a) => a.action === "REJOIN_AFTER_DELETION").map((a) => ({ at: a.createdAt.toISOString(), note: a.detail ?? "" })),
  };
}

/** Accounts deleted while a report about them was open or upheld. This is how the review team learns that someone left. */
export async function listDeletedWhileReported(db: Db, actor: Actor | null, admins?: string[]) {
  await requireAdminUser(db, actor, admins);
  const rows = await db.user.findMany({
    where: { status: "DELETED", emailHash: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 30,
    select: { id: true, deletedAt: true },
  });
  return rows.map((r) => ({ id: r.id, deletedAt: iso(r.deletedAt) }));
}

/** The latest lookups, so the team can see who has been reading contact details. */
export async function listRecentLookups(db: Db, actor: Actor | null, admins?: string[]) {
  await requireAdminUser(db, actor, admins);
  const rows = await db.auditLog.findMany({
    where: { action: "CONTACT_DETAILS_VIEWED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { actorId: true, targetId: true, detail: true, createdAt: true },
  });
  return rows.map((r) => ({ by: r.actorId, account: r.targetId, reason: r.detail ?? "", at: r.createdAt.toISOString() }));
}
