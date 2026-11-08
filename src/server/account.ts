import { AUTO_PAUSE_REPORTERS, DISMISSED_REPORT_LIMIT, REPORT_SEVERITY } from "@/lib/domain";
import { POLICY_VERSION } from "@/lib/legal";
import { profileSchema, reportSchema, trustedContactSchema } from "@/lib/schemas";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError, isUniqueViolation } from "./errors";
import { buildSnapshot } from "./evidence";
import { enforce, type RateLimiter } from "./rateLimit";

export async function saveProfile(db: Db, actor: Actor | null, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  const input = profileSchema.parse(raw);
  // Agreement is recorded per version. Someone who already accepted this version is not asked again.
  const before = await db.user.findUnique({ where: { id: user.id }, select: { termsVersion: true } });
  const accepted = before?.termsVersion === POLICY_VERSION;
  if (!accepted && !input.acceptTerms) {
    throw new AppError("INVALID", "Please confirm you are 18 or older and agree to the Terms of Use and Privacy Policy to continue.");
  }
  await db.user.update({
    where: { id: user.id },
    data: {
      name: input.name,
      phone: input.phone ?? null,
      isLandlord: input.isLandlord,
      isTenant: input.isTenant,
      onboarded: true,
      ...(accepted ? {} : { termsAcceptedAt: new Date(), termsVersion: POLICY_VERSION }),
    },
  });
}

export async function blockUser(db: Db, actor: Actor | null, targetId: string) {
  const user = await requireActiveUser(db, actor);
  if (targetId === user.id) throw new AppError("INVALID", "You cannot block yourself.");
  const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw new AppError("NOT_FOUND", "Not found.");
  try {
    await db.block.create({ data: { blockerId: user.id, blockedId: targetId } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  await db.interest.updateMany({
    where: {
      status: "PENDING",
      OR: [
        { listing: { ownerId: user.id }, requirement: { tenantId: targetId } },
        { listing: { ownerId: targetId }, requirement: { tenantId: user.id } },
      ],
    },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });
}

export async function unblockUser(db: Db, actor: Actor | null, targetId: string) {
  const user = await requireActiveUser(db, actor);
  await db.block.deleteMany({ where: { blockerId: user.id, blockedId: targetId } });
}

async function targetExists(db: Db, type: "LISTING" | "REQUIREMENT" | "USER", id: string): Promise<boolean> {
  if (type === "LISTING") return (await db.listing.count({ where: { id } })) > 0;
  if (type === "REQUIREMENT") return (await db.requirement.count({ where: { id } })) > 0;
  return (await db.user.count({ where: { id } })) > 0;
}

export async function saveTrustedContact(db: Db, actor: Actor | null, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  const input = trustedContactSchema.parse(raw);
  await db.user.update({ where: { id: user.id }, data: { trustedContactName: input.name, trustedContactPhone: input.phone } });
}

export async function clearTrustedContact(db: Db, actor: Actor | null) {
  const user = await requireActiveUser(db, actor);
  await db.user.update({ where: { id: user.id }, data: { trustedContactName: null, trustedContactPhone: null } });
}

/**
 * Files a report. A frozen copy of the reported item is saved with it.
 * CRITICAL and HIGH reports pause the listing or search straight away as a precaution. That is a hold, not a finding:
 * the owner can appeal, and an admin decides. MEDIUM reports pause only after two different people report.
 * People whose recent reports were mostly dismissed no longer trigger automatic holds, which blunts repeat false reports.
 */
export async function fileReport(db: Db, limiter: RateLimiter, actor: Actor | null, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  await enforce(limiter, "report", user.id);
  const input = reportSchema.parse(raw);
  if (!(await targetExists(db, input.targetType, input.targetId))) throw new AppError("NOT_FOUND", "Not found.");

  const severity = REPORT_SEVERITY[input.category];
  const urgent = severity !== "MEDIUM";
  const snapshot = await buildSnapshot(db, user.id, input.targetType, input.targetId);
  try {
    await db.report.create({
      data: {
        reporterId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.category,
        category: input.category,
        details: input.details,
        incidentAt: input.incidentAt,
        urgent,
        severity,
        snapshot,
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("CONFLICT", "You have already reported this. We are looking into it.");
    throw e;
  }

  if (input.targetType === "USER") return;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const dismissed = await db.report.count({ where: { reporterId: user.id, status: "DISMISSED", createdAt: { gte: since } } });
  if (dismissed >= DISMISSED_REPORT_LIMIT) return;

  const open = await db.report.findMany({
    where: { targetType: input.targetType, targetId: input.targetId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
    select: { reporterId: true },
    take: 50,
  });
  const distinct = new Set(open.map((r) => r.reporterId)).size;
  if (urgent || distinct >= AUTO_PAUSE_REPORTERS) {
    const hold = { status: "PAUSED" as const, flagged: true };
    if (input.targetType === "LISTING") await db.listing.updateMany({ where: { id: input.targetId }, data: hold });
    else await db.requirement.updateMany({ where: { id: input.targetId }, data: hold });
    await db.event.create({ data: { name: "auto_paused" } });
  }
}
