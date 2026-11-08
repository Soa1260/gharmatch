"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { ZodError } from "zod";
import { blockUser, clearTrustedContact, fileReport, saveProfile, saveTrustedContact } from "@/server/account";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { respondToInterest, sendInterest, inviteTenant, withdrawInterest } from "@/server/interests";
import { confirmStillAvailable, createListing, setListingStatus, updateListing } from "@/server/listings";
import { PostgresRateLimiter } from "@/server/rateLimit";
import { createRequirement, setRequirementStatus, updateRequirement } from "@/server/requirements";
import { fileAppeal } from "@/server/incidents";
import { cancelVisit, checkIn, checkOut, confirmVisit, proposeVisit } from "@/server/visits";
import { currentActor } from "@/server/session";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: string;
}

/** TEST ONLY: the header Sign out button. Does nothing in production, where sign-out lives on /account. Remove before launch (docs/LAUNCH.md). */
export async function testSignOutAction(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  await signOut({ redirectTo: "/" });
}

const limiter = () => new PostgresRateLimiter(getDb());

/**
 * Zod's own wording ("expected number, received NaN") means nothing to a landlord. Messages we wrote in the
 * schemas are kept; only Zod's defaults are replaced, by what the person can do about it.
 */
function friendly(issue: ZodError["issues"][number]): string {
  if (!/^(Invalid input|Too small|Too big|Invalid )/.test(issue.message)) return issue.message;
  const i = issue as { code: string; minimum?: number | bigint; maximum?: number | bigint; origin?: string; expected?: string };
  if (i.code === "invalid_type") return i.expected === "date" ? "Pick a date." : "Fill this in.";
  if (i.code === "too_small") {
    if (i.origin === "string") return Number(i.minimum) <= 1 ? "Fill this in." : `Write at least ${i.minimum} characters.`;
    if (i.origin === "array") return "Choose at least one.";
    return `Must be ${i.minimum} or more.`;
  }
  if (i.code === "too_big") return i.origin === "string" ? `Keep it under ${i.maximum} characters.` : `Must be ${i.maximum} or less.`;
  return "Check this one.";
}

/** Turns thrown errors into something safe to show. Unknown errors are logged without details and hidden. */
function toState(e: unknown): FormState {
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of e.issues) fieldErrors[issue.path.join(".")] ||= friendly(issue);
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  if (e instanceof AppError) return { error: e.message };
  console.error(JSON.stringify({ level: "error", msg: "action failed", name: e instanceof Error ? e.name : "unknown" }));
  return { error: "Something went wrong. Please try again." };
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? Number.NaN : Number(v);
};
const bool = (f: FormData, k: string) => f.get(k) === "yes";
const list = (f: FormData, k: string) => f.getAll(k).map(String);

function listingFromForm(f: FormData) {
  return {
    title: str(f, "title"), city: str(f, "city"), area: str(f, "area"),
    rent: int(f, "rent"), deposit: int(f, "deposit"), bhk: int(f, "bhk"),
    furnishing: str(f, "furnishing"), availableFrom: str(f, "availableFrom"), description: str(f, "description"),
    dietPolicy: str(f, "dietPolicy"), tenantTypes: list(f, "tenantTypes"), genderPolicy: str(f, "genderPolicy") || "ANY",
    securityFeatures: list(f, "securityFeatures"), pets: str(f, "pets"), smoking: str(f, "smoking"),
    alcohol: str(f, "alcohol"), visitors: str(f, "visitors"), quietHours: str(f, "quietHours") || undefined,
    minLeaseMonths: int(f, "minLeaseMonths"), noticeDays: int(f, "noticeDays"), parking: str(f, "parking"),
    wfhAllowed: bool(f, "wfhAllowed"), maxOccupants: int(f, "maxOccupants"),
    mapsLink: str(f, "mapsLink"), addressLine: str(f, "addressLine"),
    cctvLocations: str(f, "cctvLocations") || undefined, cctvAccess: str(f, "cctvAccess") || undefined,
    noPrivateCameras: bool(f, "noPrivateCameras"), occupancyNote: str(f, "occupancyNote") || undefined,
    ownerLivesOnSite: bool(f, "ownerLivesOnSite"), keyHolders: str(f, "keyHolders"),
    ownerAccess: str(f, "ownerAccess"), noticeHours: int(f, "noticeHours"),
  };
}

function requirementFromForm(f: FormData) {
  return {
    city: str(f, "city"), areas: list(f, "areas"), budgetMin: int(f, "budgetMin"), budgetMax: int(f, "budgetMax"),
    moveInDate: str(f, "moveInDate"), tenantType: str(f, "tenantType"), occupantGroup: str(f, "occupantGroup"),
    diet: str(f, "diet"), hasPets: bool(f, "hasPets"), smokes: bool(f, "smokes"), drinks: bool(f, "drinks"),
    needsSecurity: bool(f, "needsSecurity"), acceptsInvites: bool(f, "acceptsInvites"),
    durationMonths: int(f, "durationMonths"), occupants: int(f, "occupants"), intro: str(f, "intro"),
  };
}

export async function saveProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const next = str(f, "next");
  try {
    await saveProfile(getDb(), await currentActor(), {
      name: str(f, "name"),
      phone: str(f, "phone") || undefined,
      isLandlord: list(f, "roles").includes("landlord"),
      isTenant: list(f, "roles").includes("tenant"),
      acceptTerms: bool(f, "acceptTerms"),
    });
  } catch (e) {
    return toState(e);
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function createListingAction(_: FormState, f: FormData): Promise<FormState> {
  let slug: string;
  try {
    const row = await createListing(getDb(), limiter(), await currentActor(), listingFromForm(f));
    slug = row.slug;
  } catch (e) {
    return toState(e);
  }
  revalidateTag("listings", "max");
  redirect(`/listings/${slug}/edit`);
}

export async function updateListingAction(_: FormState, f: FormData): Promise<FormState> {
  let slug: string;
  try {
    const row = await updateListing(getDb(), await currentActor(), str(f, "listingId"), listingFromForm(f));
    slug = row.slug;
  } catch (e) {
    return toState(e);
  }
  revalidatePath(`/listings/${slug}`);
  revalidatePath("/listings");
  redirect(`/listings/${slug}`);
}

export async function updateRequirementAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await updateRequirement(getDb(), await currentActor(), str(f, "requirementId"), requirementFromForm(f));
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createRequirementAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await createRequirement(getDb(), limiter(), await currentActor(), requirementFromForm(f));
  } catch (e) {
    return toState(e);
  }
  redirect("/dashboard");
}

export async function sendInterestAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await sendInterest(getDb(), limiter(), await currentActor(), str(f, "listingId"), str(f, "requirementId"), {
      message: str(f, "message"),
      acknowledgeConflicts: bool(f, "acknowledgeConflicts"),
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Interest sent. You will see the answer on your dashboard." };
}

export async function inviteTenantAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await inviteTenant(getDb(), limiter(), await currentActor(), str(f, "listingId"), str(f, "requirementId"), {
      message: str(f, "message"),
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Invitation sent." };
}

export async function respondAction(f: FormData) {
  const decision = str(f, "decision") === "ACCEPT" ? "ACCEPT" : "DECLINE";
  await respondToInterest(getDb(), await currentActor(), str(f, "interestId"), decision).catch(() => undefined);
  revalidatePath("/dashboard");
}

export async function withdrawAction(f: FormData) {
  await withdrawInterest(getDb(), await currentActor(), str(f, "interestId")).catch(() => undefined);
  revalidatePath("/dashboard");
}

export async function listingStatusAction(f: FormData) {
  const raw = str(f, "status");
  const status = raw === "PAUSED" || raw === "DELETED" ? raw : "ACTIVE";
  const actor = await currentActor();
  const id = str(f, "listingId");
  if (str(f, "confirm") === "yes") await confirmStillAvailable(getDb(), actor, id).catch(() => undefined);
  else await setListingStatus(getDb(), actor, id, status).catch(() => undefined);
  revalidateTag("listings", "max");
  revalidatePath("/dashboard");
}

export async function requirementStatusAction(f: FormData) {
  const raw = str(f, "status");
  const status = raw === "PAUSED" || raw === "DELETED" ? raw : "ACTIVE";
  await setRequirementStatus(getDb(), await currentActor(), str(f, "requirementId"), status).catch(() => undefined);
  revalidatePath("/dashboard");
}

export async function reportAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await fileReport(getDb(), limiter(), await currentActor(), {
      targetType: str(f, "targetType"), targetId: str(f, "targetId"), category: str(f, "category"),
      details: str(f, "details") || undefined,
      incidentAt: str(f, "incidentAt") || undefined,
    });
  } catch (e) {
    return toState(e);
  }
  return { ok: "Thank you. We review safety reports first." };
}

export async function blockAction(f: FormData) {
  await blockUser(getDb(), await currentActor(), str(f, "userId")).catch(() => undefined);
  revalidatePath("/dashboard");
}

export async function saveTrustedContactAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await saveTrustedContact(getDb(), await currentActor(), { name: str(f, "name"), phone: str(f, "phone") });
  } catch (e) {
    return toState(e);
  }
  return { ok: "Saved. Only you can see this." };
}

export async function clearTrustedContactAction() {
  await clearTrustedContact(getDb(), await currentActor()).catch(() => undefined);
  revalidatePath("/account");
}

export async function proposeVisitAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await proposeVisit(getDb(), await currentActor(), str(f, "interestId"), {
      scheduledAt: str(f, "scheduledAt"),
      companion: bool(f, "companion"),
      note: str(f, "note") || undefined,
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Visit requested. The owner will confirm and name who will meet you." };
}

export async function confirmVisitAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await confirmVisit(getDb(), await currentActor(), str(f, "visitId"), {
      representativeName: str(f, "representativeName"),
      representativeRole: str(f, "representativeRole"),
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Visit confirmed." };
}

/**
 * Visit buttons return the reason when the service refuses (for example, checking in too early), so the
 * person sees why nothing happened instead of a button that appears to do nothing.
 */
export async function cancelVisitAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await cancelVisit(getDb(), await currentActor(), str(f, "visitId"));
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Visit cancelled." };
}

export async function checkInAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await checkIn(getDb(), await currentActor(), str(f, "visitId"));
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Checked in." };
}

export async function checkOutAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await checkOut(getDb(), await currentActor(), str(f, "visitId"));
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Checked out. Glad you are safe." };
}

export async function fileAppealAction(_: FormState, f: FormData): Promise<FormState> {
  try {
    await fileAppeal(getDb(), await currentActor(), { reportId: str(f, "reportId"), message: str(f, "message") });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/dashboard");
  return { ok: "Appeal sent. A person will review it and email you." };
}
