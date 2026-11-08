import type { Db } from "./db";
import { AppError } from "./errors";

export interface Actor {
  id: string;
}

export interface ActiveUser {
  id: string;
  isLandlord: boolean;
  isTenant: boolean;
  emailVerified: boolean;
  hasPhoneOnFile: boolean;
}

/** Re-checks the account in the database. Sessions are JWTs, so a ban or deletion must be read from here. */
export async function requireActiveUser(db: Db, actor: Actor | null | undefined): Promise<ActiveUser> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  const user = await db.user.findUnique({
    where: { id: actor.id },
    select: { id: true, status: true, isLandlord: true, isTenant: true, emailVerified: true, phone: true },
  });
  if (!user || user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "This account cannot do that.");
  return {
    id: user.id,
    isLandlord: user.isLandlord,
    isTenant: user.isTenant,
    emailVerified: user.emailVerified !== null,
    hasPhoneOnFile: Boolean(user.phone),
  };
}

export async function isBlockedEitherWay(db: Db, a: string, b: string): Promise<boolean> {
  const hit = await db.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { id: true },
  });
  return hit !== null;
}

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Admin check done inside the service, not only on the page, so a missing page guard can never expose an admin action.
 * The list comes from ADMIN_EMAILS. A verified email on the list is required.
 */
export async function requireAdminUser(db: Db, actor: Actor | null | undefined, admins: string[] = parseAdminEmails(process.env.ADMIN_EMAILS)): Promise<{ id: string }> {
  const user = await requireActiveUser(db, actor);
  const row = await db.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerified: true } });
  if (!row || !row.emailVerified || !admins.includes(row.email.toLowerCase())) {
    throw new AppError("FORBIDDEN", "This action is for administrators.");
  }
  return { id: user.id };
}
