import type { AccountRecord } from "@/server/records";

const day = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "none");

/**
 * Plain text the team can paste into a reply to a police, court or regulator request, or keep with a case file.
 * It lists what Gharmatch holds about the account. It leaves out who filed any report, and other people's details.
 * Read it before sending: it is a summary of our records, not legal advice and not the notice itself.
 */
export function buildRecordsSheet(r: AccountRecord, reason: string, preparedAt: Date = new Date()): string {
  const u = r.user;
  const deleted = u.status === "DELETED";
  const lines: string[] = [
    "GHARMATCH: RECORDS HELD ABOUT AN ACCOUNT",
    `Prepared: ${preparedAt.toISOString().slice(0, 10)}`,
    `Reason or reference: ${reason}`,
    "",
    "ACCOUNT",
    `Account id: ${u.id}`,
    `Status: ${u.status.toLowerCase()}${deleted ? ` (deleted on ${day(u.deletedAt)})` : ""}`,
    `Created: ${day(u.createdAt)}`,
    `Roles: ${[u.isLandlord ? "landlord" : "", u.isTenant ? "tenant" : ""].filter(Boolean).join(", ") || "none chosen"}`,
    `Terms accepted: ${day(u.termsAcceptedAt)}${u.termsVersion ? ` (version ${u.termsVersion})` : ""}`,
  ];
  if (deleted) {
    lines.push("Name, email and phone: removed when the account was deleted, as the Privacy Policy states. They are no longer held.");
    if (u.fingerprintKept) lines.push("A one-way fingerprint of the email is held. It cannot be turned back into the address.");
  } else {
    lines.push(
      `Name: ${u.name ?? "not given"}`,
      `Email: ${u.email}${u.emailVerified ? " (confirmed by Google sign-in)" : ""}`,
      `Phone: ${u.phone ?? "not given"}`,
      `Identity check by our team: ${u.identityCheckedAt ? `${day(u.identityCheckedAt)}, ${(u.identityMethod ?? "").toLowerCase().replace(/_/g, " ")}` : "none"}`,
    );
  }
  lines.push("", `HOMES (${r.listings.length})`);
  for (const l of r.listings) lines.push(`- ${l.id} | ${l.title} | ${l.area} | ${l.status.toLowerCase()} | posted ${day(l.createdAt)}`);
  lines.push("", `SEARCHES (${r.searches.length})`);
  for (const s of r.searches) lines.push(`- ${s.id} | ${s.city.toLowerCase()} | ${s.status.toLowerCase()} | posted ${day(s.createdAt)}`);
  lines.push("", `REPORTS ABOUT THIS ACCOUNT, ITS HOMES OR ITS SEARCHES (${r.reportsAbout.length})`);
  for (const p of r.reportsAbout) lines.push(`- ${p.id} | ${p.target.toLowerCase()} | ${p.category.toLowerCase().replace(/_/g, " ")} | ${p.severity.toLowerCase()} | ${p.status.toLowerCase().replace(/_/g, " ")} | ${day(p.createdAt)}`);
  lines.push(
    "",
    `Conversations (interests sent or received): ${r.interests}`,
    `Reports this account has filed: ${r.reportsFiled}`,
    "",
    "Not included: who filed any report, the messages themselves, and other people's details. Messages and rule snapshots saved with a report are held separately and can be supplied on a valid request.",
    "This sheet summarises Gharmatch records. It is not legal advice.",
  );
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
