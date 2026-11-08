import type { Db } from "./db";

type TargetType = "LISTING" | "REQUIREMENT" | "USER";

/**
 * A frozen copy of what was reported, taken at the moment of the report. Owners can edit or delete their
 * listings afterwards, so the report keeps its own record for admins and, on a valid legal request, for police.
 * Contains account ids, not phone numbers or emails.
 */
export async function buildSnapshot(db: Db, reporterId: string, type: TargetType, id: string): Promise<string> {
  const capturedAt = new Date().toISOString();

  if (type === "LISTING") {
    const l = await db.listing.findUnique({
      where: { id },
      select: {
        id: true, slug: true, ownerId: true, title: true, description: true, city: true, area: true, rent: true,
        deposit: true, genderPolicy: true, status: true, flagged: true, createdAt: true, updatedAt: true,
        owner: { select: { createdAt: true, emailVerified: true, status: true } },
      },
    });
    const theirMessages = await db.interest.findMany({
      where: { listingId: id, requirement: { tenantId: reporterId } },
      select: { origin: true, message: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    return JSON.stringify({ capturedAt, type, listing: l, messagesWithReporter: theirMessages });
  }

  if (type === "REQUIREMENT") {
    const r = await db.requirement.findUnique({
      where: { id },
      select: {
        id: true, tenantId: true, city: true, areas: true, occupantGroup: true, intro: true, status: true,
        createdAt: true, tenant: { select: { createdAt: true, emailVerified: true, status: true } },
      },
    });
    const theirMessages = await db.interest.findMany({
      where: { requirementId: id, listing: { ownerId: reporterId } },
      select: { origin: true, message: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    return JSON.stringify({ capturedAt, type, requirement: r, messagesWithReporter: theirMessages });
  }

  const u = await db.user.findUnique({ where: { id }, select: { id: true, createdAt: true, emailVerified: true, status: true } });
  return JSON.stringify({ capturedAt, type, user: u });
}
