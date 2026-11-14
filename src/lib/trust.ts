import { ESTABLISHED_ACCOUNT_DAYS } from "./domain";

const DAY = 86_400_000;

/** What a landlord may know about someone who wrote to them. Facts about the account only, never who the person is. */
export interface TenantTrust {
  memberSince: Date;
  accountAgeDays: number;
  idChecked: boolean;
  /** Safety reports about this account or its searches that a reviewer upheld. */
  upheldReports: number;
}

export function buildTenantTrust(input: { createdAt: Date; identityCheckedAt: Date | null; upheldReports: number }, now = Date.now()): TenantTrust {
  return {
    memberSince: input.createdAt,
    accountAgeDays: Math.max(0, Math.floor((now - input.createdAt.getTime()) / DAY)),
    idChecked: input.identityCheckedAt !== null,
    upheldReports: input.upheldReports,
  };
}

/** Plain lines for the trust card. Same wording everywhere it is shown. */
export function trustLines(t: TenantTrust): Array<{ text: string; tone: "good" | "plain" | "warn" }> {
  const lines: Array<{ text: string; tone: "good" | "plain" | "warn" }> = [];
  lines.push({ text: "Signed in with a verified email", tone: "plain" });
  lines.push(
    t.accountAgeDays < ESTABLISHED_ACCOUNT_DAYS
      ? { text: "New account, made this week", tone: "warn" }
      : { text: `Member since ${t.memberSince.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`, tone: "plain" },
  );
  lines.push(t.idChecked ? { text: "ID checked by our team", tone: "good" } : { text: "ID not checked", tone: "plain" });
  lines.push(
    t.upheldReports > 0
      ? { text: `${t.upheldReports} safety report${t.upheldReports === 1 ? "" : "s"} upheld by a reviewer`, tone: "warn" }
      : { text: "No upheld safety reports", tone: "good" },
  );
  return lines;
}

export interface RequestRule {
  requestsFrom: string;
}

/** Why this person may not send interest to a home that limits who can ask. Null when they may. */
export function requestRuleBlocks(rule: RequestRule, sender: { createdAt: Date; identityCheckedAt: Date | null }, now = Date.now()): string | null {
  if (rule.requestsFrom === "ID_CHECKED" && sender.identityCheckedAt === null) {
    return "This landlord only takes requests from people whose ID our team has checked.";
  }
  if (rule.requestsFrom === "ESTABLISHED" && now - sender.createdAt.getTime() < ESTABLISHED_ACCOUNT_DAYS * DAY) {
    return `This landlord only takes requests from accounts at least ${ESTABLISHED_ACCOUNT_DAYS} days old. Please try again later.`;
  }
  return null;
}

export interface ScreeningEntry {
  q: string;
  a: string;
}

export function parseScreening(raw: string | null): ScreeningEntry[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is ScreeningEntry => typeof x === "object" && x !== null && typeof (x as ScreeningEntry).q === "string" && typeof (x as ScreeningEntry).a === "string")
      .slice(0, 3)
      .map((x) => ({ q: x.q, a: x.a }));
  } catch {
    return [];
  }
}

export const SAFETY_TIPS_LANDLORD = [
  "Show the home in daylight, and have someone with you at the first showing if you can.",
  "Tell someone you trust the time, the place and who is coming. The share button below does it in one tap.",
  "Do not hand over keys, take cash or sign anything on the spot. Agree on paper after the visit.",
  "Never take or send money by a link or a QR code someone sends you, and never pay to “receive” a deposit.",
  "Do not collect copies of ID beyond what the rental paperwork needs. Keep any you collect private.",
  "If a visitor makes you uneasy, end the visit, block them and report them. Call 112 if you are in danger.",
] as const;
