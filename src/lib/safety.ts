import type { OccupantGroup } from "./domain";

/**
 * Detects phone numbers, emails, links and chat handles in free text. Contact details may only be
 * exchanged through the accept flow, so interest messages and public intros must not carry them.
 */
export function containsContactInfo(text: string): boolean {
  const lowered = text.toLowerCase();
  if (/[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9.-]+\s*(\.|\(dot\)|\[dot\])\s*[a-z]{2,}/i.test(lowered)) return true;
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|co|me|app|link|io)\b)/i.test(lowered)) return true;
  if (/(^|\s)@[a-z0-9_.]{3,}/i.test(text)) return true;
  if (/\b(whats\s?app|telegram|insta(gram)?|snap(chat)?|signal)\b.{0,20}\d/i.test(lowered)) return true;
  const joined = text.replace(/(?<=[\d०-९૦-૯])[\s.()-]+(?=[\d०-९૦-૯])/g, "").replace(/,/g, "");
  if (/(\+?91|0)?[6-9]\d{9}/.test(joined)) return true;
  if (/[०-९૦-૯]{8,}/.test(joined)) return true;
  const spelled = lowered.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g);
  return (spelled?.length ?? 0) >= 6;
}

export interface InviterProfile {
  id: string;
  emailVerified: boolean;
  hasPhoneOnFile: boolean;
  banned: boolean;
  activeListingCount: number;
  invitesSentToday: number;
  blockedByTarget: boolean;
}

export interface InviteTarget {
  group: OccupantGroup;
  acceptsInvites: boolean;
  ownerId: string;
}

export type InviteDecision = { allowed: true } | { allowed: false; reason: string };

export const DAILY_INVITE_CAP = 10;
export const DAILY_INVITE_CAP_WOMEN = 3;

/** Stricter gate for landlords who want to invite tenants, tightest where women are involved. */
export function canInvite(inviter: InviterProfile, target: InviteTarget): InviteDecision {
  if (inviter.id === target.ownerId) return { allowed: false, reason: "You cannot invite yourself." };
  if (inviter.banned) return { allowed: false, reason: "This account cannot send invitations." };
  if (inviter.blockedByTarget) return { allowed: false, reason: "This tenant is not available." };
  if (!target.acceptsInvites) return { allowed: false, reason: "This tenant only accepts interest from their own searches." };
  if (!inviter.emailVerified) return { allowed: false, reason: "Verify your email before inviting tenants." };
  if (inviter.activeListingCount < 1) return { allowed: false, reason: "Publish a listing before inviting tenants." };

  const womenInvolved = target.group !== "MEN";
  if (womenInvolved && !inviter.hasPhoneOnFile) {
    return { allowed: false, reason: "Add a phone number to your profile to invite women or mixed groups. It stays hidden from them until they accept." };
  }
  const cap = womenInvolved ? DAILY_INVITE_CAP_WOMEN : DAILY_INVITE_CAP;
  if (inviter.invitesSentToday >= cap) return { allowed: false, reason: "Daily invitation limit reached. Try again tomorrow." };
  return { allowed: true };
}

export interface RequirementRecord {
  id: string;
  group: OccupantGroup;
  city: string;
  areas: string[];
  budgetMin: number;
  budgetMax: number;
  moveInDate: Date;
  tenantType: string;
  diet: string;
  intro: string;
  acceptsInvites: boolean;
  tenantName: string | null;
}

export interface BoardRequirement {
  id: string;
  group: OccupantGroup;
  city: string;
  areas: string[];
  budgetBand: string;
  moveInMonth: string;
  tenantType: string;
  diet: string;
  intro: string | null;
  displayName: string;
}

const round = (n: number, step: number) => Math.round(n / step) * step;

/**
 * What a landlord sees on the requirements board. No surname, no exact budget, and no free-text intro
 * when women are in the group. The full intro is shown only once an interest exists between the two sides.
 */
export function toBoardView(req: RequirementRecord): BoardRequirement {
  const womenInvolved = req.group !== "MEN";
  const first = req.tenantName?.trim().split(/\s+/)[0] ?? "";
  return {
    id: req.id,
    group: req.group,
    city: req.city,
    areas: req.areas.slice(0, 4),
    budgetBand: `₹${round(req.budgetMin, 1000).toLocaleString("en-IN")} to ₹${round(req.budgetMax, 1000).toLocaleString("en-IN")}`,
    moveInMonth: req.moveInDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    tenantType: req.tenantType,
    diet: req.diet,
    intro: womenInvolved ? null : req.intro,
    displayName: womenInvolved ? "Verified tenant" : first || "Tenant",
  };
}

export const SAFETY_TIPS_ALL = [
  "Never pay a deposit or advance before you have seen the home in person.",
  "Visit in daylight and tell someone where you are going.",
  "Check that the person showing the home is the owner or has written authority.",
  "Keep payments traceable. Avoid cash without a receipt and a signed agreement.",
] as const;

export const SAFETY_TIPS_WOMEN = [
  "Take a friend or family member to the first visit.",
  "Share your live location with someone you trust while you visit.",
  "Ask who else has keys and how visitors are screened at the gate.",
  "Check the entry lighting, the gate and the lane after dark before agreeing.",
  "If anything feels wrong, leave. Then report the listing so we can review it quickly.",
] as const;

/**
 * Payment talk inside a message. Money must never move before the home has been seen in person,
 * and nothing here lets people trade payment details, so these are refused outright.
 */
export function asksForMoney(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(upi|gpay|google\s?pay|phone\s?pe|paytm|ifsc|bhim)\b/.test(t) ||
    /\b(bank|account)\s+(number|no|details)\b/.test(t) ||
    /\b(advance|token|booking)\s+(amount|money|payment|deposit)\b/.test(t) ||
    /\b(send|pay|transfer)\b[^.]{0,30}\b(advance|token|booking)\b/.test(t)
  );
}

const SCAM_PATTERNS: Array<[RegExp, string]> = [
  [/\b(advance|token|booking)\b[^.]{0,40}\b(before|without)\b[^.]{0,20}\b(visit|visiting|seeing|seen|meeting)\b/i, "Asks for money before a visit"],
  [/\b(without|no need)\b[^.]{0,20}\b(visit|visiting|seeing)\b/i, "Says there is no need to visit"],
  [/\b(abroad|overseas|out of (the )?country|nri|army|armed forces|defen[cs]e|transferred)\b[^.]{0,60}\b(send|pay|transfer|courier|keys)\b/i, "Owner away, asks for money or sends keys"],
  [/\b(keys?)\b[^.]{0,30}\b(courier|post|parcel)\b/i, "Offers keys by courier"],
  [/\b(upi|gpay|google\s?pay|phone\s?pe|paytm)\b/i, "Mentions a payment app"],
  [/\bwhats\s?app\b[^.]{0,20}\b(only|directly|first)\b/i, "Pushes chat off the platform"],
];

/** Wording that often appears in rental scams. A hit holds the listing for review. It is never proof. */
export function scamSignals(text: string): string[] {
  return SCAM_PATTERNS.filter(([re]) => re.test(text)).map(([, reason]) => reason);
}

/** Text a person can send to someone they trust before visiting a home. Nothing is stored. */
export function visitShareText(input: { title: string; area: string; when?: string; url: string }): string {
  const when = input.when ? ` at ${input.when}` : "";
  return [
    `I am visiting a rental${when}.`,
    `Home: ${input.title}, ${input.area}.`,
    `Listing: ${input.url}`,
    "Please call me if you do not hear from me within an hour.",
  ].join("\n");
}
