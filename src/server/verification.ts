import { ASSESSMENT_ITEMS, IDENTITY_METHODS, OWNERSHIP_DOCS } from "@/lib/domain";
import { z } from "zod";
import { requireAdminUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError } from "./errors";

/**
 * The three checks are kept apart on purpose. They are different facts and must never be shown as one badge:
 *  - Identity Checked: a person saw the account holder's photo ID. Says nothing about the property.
 *  - Ownership Documents Reviewed: a person saw a document linking the owner or representative to the property.
 *  - Property Physically Inspected: a person visited and recorded what they saw, on a date.
 * No document is stored. Reviewers look, record the type and date, and keep nothing.
 */

async function audit(db: Db, actorId: string, action: string, targetType: string, targetId: string, detail?: string) {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, detail } });
}

export async function setIdentityChecked(db: Db, actor: Actor | null, userId: string, method: string, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const m = z.enum(IDENTITY_METHODS).parse(method);
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw new AppError("NOT_FOUND", "User not found.");
  await db.user.update({ where: { id: userId }, data: { identityCheckedAt: new Date(), identityMethod: m } });
  await audit(db, admin.id, "IDENTITY_CHECKED", "USER", userId, m);
}

export async function clearIdentityChecked(db: Db, actor: Actor | null, userId: string, reason: string, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  await db.user.update({ where: { id: userId }, data: { identityCheckedAt: null, identityMethod: null } });
  await audit(db, admin.id, "IDENTITY_CLEARED", "USER", userId, reason.slice(0, 200));
}

export async function setOwnershipReviewed(db: Db, actor: Actor | null, listingId: string, docType: string, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const d = z.enum(OWNERSHIP_DOCS).parse(docType);
  const target = await db.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!target) throw new AppError("NOT_FOUND", "Listing not found.");
  await db.listing.update({ where: { id: listingId }, data: { ownershipReviewedAt: new Date(), ownershipDocType: d } });
  await audit(db, admin.id, "OWNERSHIP_REVIEWED", "LISTING", listingId, d);
}

export async function clearOwnershipReviewed(db: Db, actor: Actor | null, listingId: string, reason: string, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  await db.listing.update({ where: { id: listingId }, data: { ownershipReviewedAt: null, ownershipDocType: null } });
  await audit(db, admin.id, "OWNERSHIP_CLEARED", "LISTING", listingId, reason.slice(0, 200));
}

const inspectionSchema = z.object({
  inspectedAt: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 3_600_000, "An inspection cannot be dated in the future."),
  verifiedItems: z.array(z.enum(ASSESSMENT_ITEMS as unknown as [string, ...string[]])).max(ASSESSMENT_ITEMS.length),
  notes: z.string().trim().max(1000).optional(),
});

/** Records a physical inspection. Items not listed as verified stay "declared" or "not available". */
export async function recordInspection(db: Db, actor: Actor | null, listingId: string, raw: unknown, admins?: string[]) {
  const admin = await requireAdminUser(db, actor, admins);
  const input = inspectionSchema.parse(raw);
  const target = await db.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!target) throw new AppError("NOT_FOUND", "Listing not found.");
  const row = await db.inspection.create({
    data: { listingId, inspectorId: admin.id, inspectedAt: input.inspectedAt, verifiedItems: input.verifiedItems, notes: input.notes },
    select: { id: true },
  });
  await audit(db, admin.id, "INSPECTION_RECORDED", "LISTING", listingId, `${input.verifiedItems.length} items verified`);
  return row;
}
