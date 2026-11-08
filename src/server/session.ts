import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { adminEmails } from "@/lib/env";
import { POLICY_VERSION } from "@/lib/legal";
import { getDb } from "./db";
import type { Actor } from "./actor";

/** The signed-in user's id from the JWT, or null. Services still re-check the account in the database. */
export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id ? { id } : null;
}

export async function requireSignedIn(next: string): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return actor;
}

/** Signed in and finished onboarding. Sends new users to the profile step first. */
export async function requireOnboarded(next: string) {
  const actor = await requireSignedIn(next);
  const user = await getDb().user.findUnique({
    where: { id: actor.id },
    select: { id: true, name: true, onboarded: true, isLandlord: true, isTenant: true, status: true, termsVersion: true },
  });
  if (!user || user.status !== "ACTIVE") redirect("/signin");
  // New people, and everyone after the Terms or Privacy Policy change, agree before going further.
  if (!user.onboarded || user.termsVersion !== POLICY_VERSION) redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const actor = await requireSignedIn("/admin/reports");
  const user = await getDb().user.findUnique({
    where: { id: actor.id },
    select: { email: true, emailVerified: true },
  });
  const allowed = user && user.emailVerified && adminEmails().includes(user.email.toLowerCase());
  if (!allowed) redirect("/");
  return actor;
}
