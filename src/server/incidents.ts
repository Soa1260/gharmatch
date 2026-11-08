import { z } from "zod";
import { appealSchema } from "@/lib/schemas";
import { requireActiveUser, requireAdminUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError, isUniqueViolation } from "./errors";
import { safeSend, type Notifier } from "./notify";

async function audit(db: Db, actorId: string, action: string, targetType: string, targetId: string, detail?: string) {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, detail } });
}

async function reporterEmail(db: Db, reporterId: string): Promise<string | null> {
  const u = await db.user.findUnique({ where: { id: reporterId }, select: { email: true, status: true } });
  return u && u.status === "ACTIVE" && !u.email.endsWith("@deleted.invalid") ? u.email : null;
}

async function applyRestriction(db: Db, type: string, id: string) {
  if (type === "LISTING") await db.listing.updateMany({ where: { id }, data: { status: "PAUSED", flagged: true } });
  if (type === "REQUIREMENT") await db.requirement.updateMany({ where: { id }, data: { status: "PAUSED", flagged: true } });
  if (type === "USER") await db.user.updateMany({ where: { id }, data: { status: "BANNED" } });
}

async function releaseRestriction(db: Db, type: string, id: string) {
  if (type === "LISTING") await db.listing.updateMany({ where: { id }, data: { flagged: false } });
  if (type === "REQUIREMENT") await db.requirement.updateMany({ where: { id }, data: { flagged: false } });
  if (type === "USER") await db.user.updateMany({ where: { id, status: "BANNED" }, data: { status: "ACTIVE" } });
}

export async function startReview(db: Db, notifier: Notifier, actor: Actor | null, reportId: string, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const res = await db.report.updateMany({ where: { id: reportId, status: "OPEN" }, data: { status: "UNDER_REVIEW" } });
  if (res.count === 0) throw new AppError("CONFLICT", "That report is not waiting for review.");
  await audit(db, admin.id, "REPORT_REVIEW_STARTED", "REPORT", reportId);
  const r = await db.report.findUniqueOrThrow({ where: { id: reportId }, select: { reporterId: true } });
  const to = await reporterEmail(db, r.reporterId);
  if (to) await safeSend(notifier, to, "Your report is being reviewed", "A person on our team has started looking at your report. We will email you when it is decided. If you are in danger, call 112.");
}

const resolveSchema = z.object({ outcome: z.enum(["ACTION", "DISMISS"]), note: z.string().trim().min(3).max(500) });

/**
 * Closes a report with a recorded reason. ACTION restricts the reported item or account. DISMISS closes the report
 * without restricting anything further. Either way the reporter is told the outcome, without details.
 * A report is not treated as proven until an admin decides.
 */
export async function resolveReport(db: Db, notifier: Notifier, actor: Actor | null, reportId: string, raw: unknown, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const input = resolveSchema.parse(raw);
  const report = await db.report.findUnique({ where: { id: reportId }, select: { id: true, status: true, targetType: true, targetId: true, reporterId: true } });
  if (!report) throw new AppError("NOT_FOUND", "Report not found.");
  if (report.status === "ACTIONED" || report.status === "DISMISSED") throw new AppError("CONFLICT", "That report is already closed.");

  if (input.outcome === "ACTION") await applyRestriction(db, report.targetType, report.targetId);
  await db.report.update({
    where: { id: reportId },
    data: { status: input.outcome === "ACTION" ? "ACTIONED" : "DISMISSED", resolutionNote: input.note, resolvedAt: new Date() },
  });
  await audit(db, admin.id, input.outcome === "ACTION" ? "REPORT_ACTIONED" : "REPORT_DISMISSED", "REPORT", reportId, input.note);

  const to = await reporterEmail(db, report.reporterId);
  if (to) {
    const body =
      input.outcome === "ACTION"
        ? "We reviewed your report and have taken action. Thank you for telling us."
        : "We reviewed your report and did not find enough to act on. If you still feel unsafe, please report again with more detail, and call 112 in an emergency.";
    await safeSend(notifier, to, "Your report has been decided", body);
  }
}

/** Reports about things you own or are, with the reporter and details removed. Used to offer an appeal. */
export async function listAppealable(db: Db, actor: Actor | null) {
  const user = await requireActiveUser(db, actor);
  const [listings, requirements] = await Promise.all([
    db.listing.findMany({ where: { ownerId: user.id }, select: { id: true }, take: 50 }),
    db.requirement.findMany({ where: { tenantId: user.id }, select: { id: true }, take: 50 }),
  ]);
  const rows = await db.report.findMany({
    where: {
      status: { in: ["OPEN", "UNDER_REVIEW", "ACTIONED"] },
      OR: [
        { targetType: "USER", targetId: user.id },
        { targetType: "LISTING", targetId: { in: listings.map((l) => l.id) } },
        { targetType: "REQUIREMENT", targetId: { in: requirements.map((r) => r.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, category: true, status: true, createdAt: true, targetType: true, appeals: { where: { appellantId: user.id }, select: { id: true, status: true } } },
  });
  return rows.map((r) => ({ id: r.id, category: r.category, status: r.status, createdAt: r.createdAt, targetType: r.targetType, appeal: r.appeals[0] ?? null }));
}

export async function fileAppeal(db: Db, actor: Actor | null, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  const input = appealSchema.parse(raw);
  const allowed = (await listAppealable(db, actor)).some((r) => r.id === input.reportId);
  if (!allowed) throw new AppError("NOT_FOUND", "Report not found.");
  try {
    await db.appeal.create({ data: { reportId: input.reportId, appellantId: user.id, message: input.message } });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("CONFLICT", "You have already appealed this.");
    throw e;
  }
}

const decideSchema = z.object({ outcome: z.enum(["UPHELD", "REJECTED"]), note: z.string().trim().min(3).max(500) });

/** UPHELD means the appeal succeeded: the hold is released and the report is closed as dismissed. */
export async function decideAppeal(db: Db, notifier: Notifier, actor: Actor | null, appealId: string, raw: unknown, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const input = decideSchema.parse(raw);
  const appeal = await db.appeal.findUnique({
    where: { id: appealId },
    select: { id: true, status: true, appellantId: true, report: { select: { id: true, targetType: true, targetId: true } } },
  });
  if (!appeal) throw new AppError("NOT_FOUND", "Appeal not found.");
  if (appeal.status !== "OPEN") throw new AppError("CONFLICT", "That appeal is already decided.");

  await db.appeal.update({ where: { id: appealId }, data: { status: input.outcome, decisionNote: input.note, decidedAt: new Date() } });
  if (input.outcome === "UPHELD") {
    await releaseRestriction(db, appeal.report.targetType, appeal.report.targetId);
    await db.report.update({ where: { id: appeal.report.id }, data: { status: "DISMISSED", resolutionNote: `Appeal upheld: ${input.note}`, resolvedAt: new Date() } });
  }
  await audit(db, admin.id, input.outcome === "UPHELD" ? "APPEAL_UPHELD" : "APPEAL_REJECTED", "APPEAL", appealId, input.note);

  const u = await db.user.findUnique({ where: { id: appeal.appellantId }, select: { email: true, status: true } });
  if (u && u.status !== "DELETED") {
    await safeSend(
      notifier,
      u.email,
      "Your appeal has been decided",
      input.outcome === "UPHELD" ? "Your appeal was accepted and the restriction has been lifted. You can resume your listing from your dashboard." : "Your appeal was reviewed and the restriction stays. You can write to our grievance email if you want it looked at again.",
    );
  }
}
