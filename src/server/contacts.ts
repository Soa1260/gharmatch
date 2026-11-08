import { isBlockedEitherWay, requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError } from "./errors";

export interface Contact {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
}

/**
 * The only place that reads another user's email or phone.
 * Returns the other party's details when the interest is ACCEPTED and the actor is one of the two parties.
 * Anything else, including a stranger guessing an id, gets the same "not found".
 */
export async function getContactsForInterest(db: Db, actor: Actor | null, interestId: string): Promise<Contact> {
  const user = await requireActiveUser(db, actor);
  const interest = await db.interest.findUnique({
    where: { id: interestId },
    select: {
      status: true,
      listing: { select: { ownerId: true } },
      requirement: { select: { tenantId: true } },
    },
  });
  if (!interest) throw new AppError("NOT_FOUND", "Not found.");
  const { ownerId } = interest.listing;
  const { tenantId } = interest.requirement;
  if (user.id !== ownerId && user.id !== tenantId) throw new AppError("NOT_FOUND", "Not found.");
  if (interest.status !== "ACCEPTED") throw new AppError("FORBIDDEN", "Contact details are shared after the interest is accepted.");

  const otherId = user.id === ownerId ? tenantId : ownerId;
  if (await isBlockedEitherWay(db, user.id, otherId)) throw new AppError("NOT_FOUND", "Not found.");

  const other = await db.user.findUnique({
    where: { id: otherId },
    select: { name: true, email: true, phone: true, status: true },
  });
  if (!other || other.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Not found.");
  return { userId: otherId, name: other.name, email: other.email, phone: other.phone };
}

export interface ExactLocation {
  addressLine: string | null;
  lat: number;
  lng: number;
}

/**
 * The exact address and pin. Shown only to the two parties of an ACCEPTED interest, by the same rule as
 * contact details. Before that, the public sees an approximate area only.
 */
export async function getLocationForInterest(db: Db, actor: Actor | null, interestId: string): Promise<ExactLocation> {
  const user = await requireActiveUser(db, actor);
  const interest = await db.interest.findUnique({
    where: { id: interestId },
    select: {
      status: true,
      listing: { select: { ownerId: true, addressLine: true, lat: true, lng: true } },
      requirement: { select: { tenantId: true } },
    },
  });
  if (!interest) throw new AppError("NOT_FOUND", "Not found.");
  const { ownerId, addressLine, lat, lng } = interest.listing;
  if (user.id !== ownerId && user.id !== interest.requirement.tenantId) throw new AppError("NOT_FOUND", "Not found.");
  if (interest.status !== "ACCEPTED") throw new AppError("FORBIDDEN", "The exact address is shared after the interest is accepted.");
  const otherId = user.id === ownerId ? interest.requirement.tenantId : ownerId;
  if (await isBlockedEitherWay(db, user.id, otherId)) throw new AppError("NOT_FOUND", "Not found.");
  if (lat == null || lng == null) throw new AppError("NOT_FOUND", "Not found.");
  return { addressLine, lat, lng };
}
