import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashEmail } from "@/lib/emailHash";
import { buildRecordsSheet } from "@/lib/recordsSheet";
import { createTestDb, makeUser, validListing } from "@/test/testDb";
import { deleteAccount, purgeDeletedAccounts } from "./deletion";
import type { Db } from "./db";
import { createListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { flagRejoin } from "./rejoin";
import { listDeletedWhileReported, listRecentLookups, lookupRecords } from "./records";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

const reason = "Police notice 123/2026 dated 12 Nov 2026";
const DAY = 86_400_000;

async function emailOf(id: string) {
  return (await db.user.findUniqueOrThrow({ where: { id }, select: { email: true } })).email;
}

async function admin() {
  const a = await makeUser(db);
  return { actor: a, admins: [await emailOf(a.id)] };
}

async function report(reporterId: string, targetType: "USER" | "LISTING" | "REQUIREMENT", targetId: string, status = "OPEN") {
  return db.report.create({
    data: { reporterId, targetType, targetId, reason: "FINANCIAL_FRAUD", category: "FINANCIAL_FRAUD", severity: "HIGH", status: status as "OPEN" },
    select: { id: true },
  });
}

describe("looking up who is behind an account", () => {
  it("is for administrators only, and a refused try leaves no trace of the data or a log row", async () => {
    const { admins } = await admin();
    const person = await makeUser(db, { name: "Asha Patel", phone: "9876500001" });
    const stranger = await makeUser(db);
    await expect(lookupRecords(db, stranger, { query: person.id, reason }, admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(lookupRecords(db, null, { query: person.id, reason }, admins)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(await db.auditLog.count({ where: { action: "CONTACT_DETAILS_VIEWED", targetId: person.id } })).toBe(0);
  });

  it("needs a written reason, and logs nothing without one", async () => {
    const { actor, admins } = await admin();
    const person = await makeUser(db);
    await expect(lookupRecords(db, actor, { query: person.id, reason: "" }, admins)).rejects.toThrow();
    await expect(lookupRecords(db, actor, { query: person.id, reason: "short" }, admins)).rejects.toThrow();
    await expect(lookupRecords(db, actor, { query: "ab", reason }, admins)).rejects.toThrow();
    expect(await db.auditLog.count({ where: { action: "CONTACT_DETAILS_VIEWED", targetId: person.id } })).toBe(0);
  });

  it("finds the account by id, by email or by a report, shows the contact details, and logs every lookup with the reason", async () => {
    const { actor, admins } = await admin();
    const person = await makeUser(db, { name: "Asha Patel", phone: "9876500002", isLandlord: true });
    const reporter = await makeUser(db);
    const rep = await report(reporter.id, "USER", person.id);

    const byId = await lookupRecords(db, actor, { query: person.id, reason }, admins);
    expect(byId.user).toMatchObject({ id: person.id, name: "Asha Patel", phone: "9876500002", email: await emailOf(person.id) });

    const byEmail = await lookupRecords(db, actor, { query: (await emailOf(person.id)).toUpperCase(), reason }, admins);
    expect(byEmail.user.id).toBe(person.id);
    const byReport = await lookupRecords(db, actor, { query: rep.id, reason }, admins);
    expect(byReport.user.id).toBe(person.id);
    expect(byReport.reportsAbout.map((r) => r.id)).toContain(rep.id);

    const log = await db.auditLog.findMany({ where: { action: "CONTACT_DETAILS_VIEWED", targetId: person.id }, select: { actorId: true, detail: true } });
    expect(log).toHaveLength(3);
    expect(log.every((l) => l.actorId === actor.id && l.detail === reason)).toBe(true);
    expect(byReport.earlierLookups.length).toBe(2);
  });

  it("finds an owner from a report about their home, and never says who filed a report", async () => {
    const { actor, admins } = await admin();
    const owner = await makeUser(db, { isLandlord: true, phone: "9876500003" });
    const home = await createListing(db, limiter, owner, validListing);
    const reporter = await makeUser(db, { name: "Reporter Rao" });
    const rep = await report(reporter.id, "LISTING", home.id);

    const rec = await lookupRecords(db, actor, { query: rep.id, reason }, admins);
    expect(rec.user.id).toBe(owner.id);
    expect(rec.listings.map((l) => l.id)).toContain(home.id);
    const sheet = buildRecordsSheet(rec, reason);
    expect(sheet).toContain(owner.id);
    expect(sheet).toContain("9876500003");
    expect(sheet).toContain(rep.id);
    expect(sheet).not.toContain(reporter.id);
    expect(sheet).not.toContain("Reporter Rao");
    expect(sheet).toContain(reason);
  });

  it("says the same thing for every miss, and logs nothing", async () => {
    const { actor, admins } = await admin();
    const before = await db.auditLog.count({ where: { action: "CONTACT_DETAILS_VIEWED" } });
    for (const query of ["nobody@example.test", "cmnotarealid0000000000", "no-such-thing"]) {
      await expect(lookupRecords(db, actor, { query, reason }, admins)).rejects.toMatchObject({ code: "NOT_FOUND", message: "No account found for that." });
    }
    expect(await db.auditLog.count({ where: { action: "CONTACT_DETAILS_VIEWED" } })).toBe(before);
  });

  it("lists the latest lookups for administrators only", async () => {
    const { actor, admins } = await admin();
    const person = await makeUser(db);
    await lookupRecords(db, actor, { query: person.id, reason }, admins);
    const recent = await listRecentLookups(db, actor, admins);
    expect(recent[0]).toMatchObject({ by: actor.id, account: person.id, reason });
    await expect(listRecentLookups(db, await makeUser(db), admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("deleting an account that has a report against it", () => {
  it("keeps a one-way fingerprint, not the email, and still removes everything readable", async () => {
    const person = await makeUser(db, { name: "Rohan Shah", phone: "9876500004" });
    const email = await emailOf(person.id);
    const reporter = await makeUser(db);
    await report(reporter.id, "USER", person.id);

    await deleteAccount(db, person);
    const row = await db.user.findUniqueOrThrow({ where: { id: person.id }, select: { email: true, name: true, phone: true, status: true, emailHash: true } });
    expect(row).toMatchObject({ status: "DELETED", name: null, phone: null });
    expect(row.email).not.toBe(email);
    expect(row.emailHash).toBe(hashEmail(email));
    expect(row.emailHash).not.toContain("example");
    expect(await db.auditLog.count({ where: { action: "ACCOUNT_DELETED", targetId: person.id } })).toBe(1);
  });

  it("counts reports on their homes too, and ignores dismissed ones", async () => {
    const owner = await makeUser(db, { isLandlord: true });
    const home = await createListing(db, limiter, owner, validListing);
    const reporter = await makeUser(db);
    await report(reporter.id, "LISTING", home.id, "DISMISSED");
    const clean = await makeUser(db);
    await report(reporter.id, "USER", clean.id, "DISMISSED");

    await deleteAccount(db, clean);
    expect((await db.user.findUniqueOrThrow({ where: { id: clean.id }, select: { emailHash: true } })).emailHash).toBeNull();
    await deleteAccount(db, owner);
    expect((await db.user.findUniqueOrThrow({ where: { id: owner.id }, select: { emailHash: true } })).emailHash).toBeNull();

    const other = await makeUser(db, { isLandlord: true });
    const otherHome = await createListing(db, limiter, other, { ...validListing, title: "Another bright 2 BHK near Bopal" });
    await report(reporter.id, "LISTING", otherHome.id, "ACTIONED");
    await deleteAccount(db, other);
    expect((await db.user.findUniqueOrThrow({ where: { id: other.id }, select: { emailHash: true } })).emailHash).not.toBeNull();
  });

  it("keeps no fingerprint for an ordinary deletion", async () => {
    const person = await makeUser(db);
    await deleteAccount(db, person);
    expect((await db.user.findUniqueOrThrow({ where: { id: person.id }, select: { emailHash: true } })).emailHash).toBeNull();
    expect(await db.auditLog.count({ where: { action: "ACCOUNT_DELETED", targetId: person.id } })).toBe(1);
  });

  it("is listed for administrators, and the lookup shows what is gone and what remains", async () => {
    const { actor, admins } = await admin();
    const person = await makeUser(db, { name: "Meera Desai", phone: "9876500005" });
    const reporter = await makeUser(db);
    const rep = await report(reporter.id, "USER", person.id);
    await deleteAccount(db, person);

    expect((await listDeletedWhileReported(db, actor, admins)).map((d) => d.id)).toContain(person.id);
    await expect(listDeletedWhileReported(db, await makeUser(db), admins)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const rec = await lookupRecords(db, actor, { query: person.id, reason }, admins);
    expect(rec.user).toMatchObject({ status: "DELETED", name: null, phone: null, fingerprintKept: true });
    expect(rec.reportsAbout.map((r) => r.id)).toContain(rep.id);
    const sheet = buildRecordsSheet(rec, reason);
    expect(sheet).toContain("no longer held");
    expect(sheet).not.toContain("Meera");
    expect(sheet).not.toContain("9876500005");
  });
});

describe("removing emptied accounts", () => {
  it("removes plain ones after 30 days, but keeps a fingerprint for a year", async () => {
    const plain = await makeUser(db);
    await deleteAccount(db, plain);
    const reported = await makeUser(db);
    await report((await makeUser(db)).id, "USER", reported.id);
    await deleteAccount(db, reported);

    const age = (id: string, days: number) => db.user.update({ where: { id }, data: { deletedAt: new Date(Date.now() - days * DAY) } });
    await age(plain.id, 31);
    await age(reported.id, 31);
    await purgeDeletedAccounts(db);
    expect(await db.user.count({ where: { id: plain.id } })).toBe(0);
    expect(await db.user.count({ where: { id: reported.id } })).toBe(1);

    await age(reported.id, 366);
    await purgeDeletedAccounts(db);
    expect(await db.user.count({ where: { id: reported.id } })).toBe(0);
  });
});

describe("a return under the same email", () => {
  it("is noted for the review team and never blocked, for any capitalisation", async () => {
    const person = await makeUser(db);
    const email = await emailOf(person.id);
    await report((await makeUser(db)).id, "USER", person.id);
    await deleteAccount(db, person);

    const again = await makeUser(db);
    expect(await flagRejoin(db, again.id, email.toUpperCase())).toBe(1);
    const note = await db.auditLog.findFirstOrThrow({ where: { action: "REJOIN_AFTER_DELETION", targetId: again.id } });
    expect(note.detail).toContain(person.id);
    expect(note.actorId).toBe("system");
  });

  it("is quiet for a new address and for an ordinary deletion", async () => {
    const left = await makeUser(db);
    const email = await emailOf(left.id);
    await deleteAccount(db, left);
    const fresh = await makeUser(db);
    expect(await flagRejoin(db, fresh.id, email)).toBe(0);
    expect(await flagRejoin(db, fresh.id, "someone.else@example.test")).toBe(0);
    expect(await flagRejoin(db, fresh.id, null)).toBe(0);
  });
});

describe("the email fingerprint", () => {
  it("is stable, ignores case and spaces, differs per address, and does not contain the address", () => {
    expect(hashEmail("Asha@Example.com ")).toBe(hashEmail("asha@example.com"));
    expect(hashEmail("a@example.com")).not.toBe(hashEmail("b@example.com"));
    expect(hashEmail("asha@example.com")).toMatch(/^[0-9a-f]{64}$/);
  });
});
