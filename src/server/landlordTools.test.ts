import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ESTABLISHED_ACCOUNT_DAYS, MAX_PENDING_PER_LISTING, MAX_PENDING_PER_TENANT } from "@/lib/domain";
import { requestRuleBlocks, trustLines } from "@/lib/trust";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { listBlocked, unblockById } from "./account";
import type { Db } from "./db";
import { blockFromInterest, listMyInterests, sendInterest } from "./interests";
import { createListing, getPublicListing, updateListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { createRequirement } from "./requirements";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

const hello = { message: "Hello, we would like to see the home this week." };
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function landlordWithHome(extra: Record<string, unknown> = {}) {
  const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
  const listing = await createListing(db, limiter, landlord, { ...validListing, ...extra });
  return { landlord, listing };
}

async function tenantWithSearch() {
  const tenant = await makeUser(db, { isTenant: true });
  const requirement = await createRequirement(db, limiter, tenant, validRequirement);
  return { tenant, requirement };
}

describe("screening questions", () => {
  it("are saved with the home, shown publicly, and default to none", async () => {
    const plain = await landlordWithHome();
    expect((await db.listing.findUniqueOrThrow({ where: { id: plain.listing.id } })).screeningQuestions).toEqual([]);

    const { listing } = await landlordWithHome({ screeningQuestions: ["How many people will live here?", "When do you want to move in?"], requestsFrom: "ESTABLISHED" });
    const page = await getPublicListing(db, listing.slug);
    expect(page?.screeningQuestions).toEqual(["How many people will live here?", "When do you want to move in?"]);
    expect(page?.requestsFrom).toBe("ESTABLISHED");
  });

  it("allow at most three, and refuse contact details, payment talk and unknown filters", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    const bad = async (extra: Record<string, unknown>) => createListing(db, limiter, landlord, { ...validListing, ...extra });
    await expect(bad({ screeningQuestions: ["One question?", "Two questions?", "Three questions?", "Four questions?"] })).rejects.toThrow();
    await expect(bad({ screeningQuestions: ["Call me on 9876543210 first"] })).rejects.toThrow();
    await expect(bad({ screeningQuestions: ["Will you pay the advance by UPI?"] })).rejects.toThrow();
    await expect(bad({ requestsFrom: "EVERYONE_AND_MORE" })).rejects.toThrow();
    expect(await db.listing.count({ where: { ownerId: landlord.id } })).toBe(0);
  });

  it("can be changed on edit", async () => {
    const { landlord, listing } = await landlordWithHome();
    await updateListing(db, landlord, listing.id, { ...validListing, screeningQuestions: ["Do you have a vehicle?"] });
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).screeningQuestions).toEqual(["Do you have a vehicle?"]);
  });

  it("must be answered, and the answers are saved with the question as it was asked", async () => {
    const { landlord, listing } = await landlordWithHome({ screeningQuestions: ["How many people will live here?"] });
    const { tenant, requirement } = await tenantWithSearch();
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "INVALID" });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, { ...hello, answers: ["Two", "Extra"] })).rejects.toMatchObject({ code: "INVALID" });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, { ...hello, answers: ["Call 9876543210"] })).rejects.toThrow();

    await sendInterest(db, limiter, tenant, listing.id, requirement.id, { ...hello, answers: ["Two of us, both working"] });
    await updateListing(db, landlord, listing.id, { ...validListing, screeningQuestions: ["A different question?"] });

    const [row] = await listMyInterests(db, landlord, "received");
    expect(row?.screening).toEqual([{ q: "How many people will live here?", a: "Two of us, both working" }]);
  });

  it("do not stop a home that asks nothing", async () => {
    const { listing } = await landlordWithHome();
    const { tenant, requirement } = await tenantWithSearch();
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, { ...hello, answers: ["Stray answer"] })).rejects.toMatchObject({ code: "INVALID" });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).resolves.toBeTruthy();
  });
});

describe("who may send requests", () => {
  it("lets anyone write to an open home", async () => {
    const { listing } = await landlordWithHome();
    const { tenant, requirement } = await tenantWithSearch();
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).resolves.toBeTruthy();
  });

  it("keeps a brand new account out of a home that wants established accounts, then lets it in after a week", async () => {
    const { listing } = await landlordWithHome({ requestsFrom: "ESTABLISHED" });
    const { tenant, requirement } = await tenantWithSearch();
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.user.update({ where: { id: tenant.id }, data: { createdAt: daysAgo(ESTABLISHED_ACCOUNT_DAYS + 1) } });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).resolves.toBeTruthy();
  });

  it("keeps out everyone whose ID has not been checked, until it is", async () => {
    const { listing } = await landlordWithHome({ requestsFrom: "ID_CHECKED" });
    const { tenant, requirement } = await tenantWithSearch();
    await db.user.update({ where: { id: tenant.id }, data: { createdAt: daysAgo(60) } });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.user.update({ where: { id: tenant.id }, data: { identityCheckedAt: new Date(), identityMethod: "PHOTO_ID_SEEN_IN_PERSON" } });
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).resolves.toBeTruthy();
  });

  it("explains the rule in plain words", () => {
    const fresh = { createdAt: new Date(), identityCheckedAt: null };
    expect(requestRuleBlocks({ requestsFrom: "ANYONE" }, fresh)).toBeNull();
    expect(requestRuleBlocks({ requestsFrom: "ESTABLISHED" }, fresh)).toMatch(/days old/);
    expect(requestRuleBlocks({ requestsFrom: "ID_CHECKED" }, fresh)).toMatch(/ID/);
  });
});

describe("limits on waiting requests", () => {
  it("closes a home to new requests while too many wait, and reopens when one is answered", async () => {
    const { landlord, listing } = await landlordWithHome();
    let last: Awaited<ReturnType<typeof sendInterest>> | undefined;
    for (let i = 0; i < MAX_PENDING_PER_LISTING; i++) {
      const { tenant, requirement } = await tenantWithSearch();
      last = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    }
    const late = await tenantWithSearch();
    await expect(sendInterest(db, limiter, late.tenant, listing.id, late.requirement.id, hello)).rejects.toMatchObject({ code: "FORBIDDEN" });

    await db.interest.update({ where: { id: (last as { id: string }).id }, data: { status: "DECLINED" } });
    await expect(sendInterest(db, limiter, late.tenant, listing.id, late.requirement.id, hello)).resolves.toBeTruthy();
    void landlord;
  });

  it("stops one tenant from holding too many requests at once, and frees a place on withdrawal", async () => {
    const { tenant, requirement } = await tenantWithSearch();
    const ids: string[] = [];
    for (let i = 0; i < MAX_PENDING_PER_TENANT; i++) {
      const { listing } = await landlordWithHome();
      ids.push((await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).id);
    }
    const extra = await landlordWithHome();
    await expect(sendInterest(db, limiter, tenant, extra.listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.interest.update({ where: { id: ids[0] as string }, data: { status: "WITHDRAWN" } });
    await expect(sendInterest(db, limiter, tenant, extra.listing.id, requirement.id, hello)).resolves.toBeTruthy();
  });
});

describe("the trust card", () => {
  it("shows a landlord facts about the account, and only the landlord", async () => {
    const { landlord, listing } = await landlordWithHome();
    const { tenant, requirement } = await tenantWithSearch();
    await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);

    const [fresh] = await listMyInterests(db, landlord, "received");
    expect(fresh?.trust).toMatchObject({ accountAgeDays: 0, idChecked: false, upheldReports: 0 });
    expect(trustLines(fresh!.trust!).map((l) => l.text)).toContain("New account, made this week");
    const [mine] = await listMyInterests(db, tenant, "sent");
    expect(mine?.trust).toBeNull();

    await db.user.update({ where: { id: tenant.id }, data: { createdAt: daysAgo(40), identityCheckedAt: new Date() } });
    const reporter = await makeUser(db);
    await db.report.create({ data: { reporterId: reporter.id, targetType: "USER", targetId: tenant.id, reason: "PHYSICAL_THREAT_STALKING", category: "PHYSICAL_THREAT_STALKING", status: "ACTIONED" } });
    await db.report.create({ data: { reporterId: reporter.id, targetType: "REQUIREMENT", targetId: requirement.id, reason: "FINANCIAL_FRAUD", category: "FINANCIAL_FRAUD", status: "ACTIONED" } });
    // Open and dismissed reports are not findings and must not count.
    const other = await makeUser(db);
    await db.report.create({ data: { reporterId: other.id, targetType: "USER", targetId: tenant.id, reason: "OTHER", category: "OTHER", status: "DISMISSED" } });

    const [later] = await listMyInterests(db, landlord, "received");
    expect(later?.trust).toMatchObject({ accountAgeDays: 40, idChecked: true, upheldReports: 2 });
    expect(trustLines(later!.trust!).map((l) => l.text)).toContain("2 safety reports upheld by a reviewer");
  });
});

describe("blocking from a request", () => {
  it("ends the conversation, stops new requests, and cannot be done by a stranger", async () => {
    const { landlord, listing } = await landlordWithHome();
    const { tenant, requirement } = await tenantWithSearch();
    const sent = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    const stranger = await makeUser(db);

    await expect(blockFromInterest(db, stranger, sent.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.block.count()).toBe(0);

    await blockFromInterest(db, landlord, sent.id);
    expect((await db.interest.findUniqueOrThrow({ where: { id: sent.id } })).status).toBe("WITHDRAWN");
    await expect(sendInterest(db, limiter, tenant, listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("can be undone only by the person who blocked", async () => {
    const { landlord, listing } = await landlordWithHome();
    const { tenant, requirement } = await tenantWithSearch();
    const sent = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    await blockFromInterest(db, landlord, sent.id);

    const [entry] = await listBlocked(db, landlord);
    expect(entry).toBeTruthy();
    expect(Object.keys(entry as object).sort()).toEqual(["createdAt", "id"]);
    expect(await listBlocked(db, tenant)).toEqual([]);

    await unblockById(db, tenant, (entry as { id: string }).id);
    expect(await listBlocked(db, landlord)).toHaveLength(1);
    await unblockById(db, landlord, (entry as { id: string }).id);
    expect(await listBlocked(db, landlord)).toHaveLength(0);
  });
});
