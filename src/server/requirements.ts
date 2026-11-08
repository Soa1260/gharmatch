import { PAGE_SIZE, type City } from "@/lib/domain";
import { requirementSchema } from "@/lib/schemas";
import { toBoardView } from "@/lib/safety";
import { checkText } from "@/lib/textGuard";
import { AppError } from "./errors";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { enforce, type RateLimiter } from "./rateLimit";

export async function createRequirement(db: Db, limiter: RateLimiter, actor: Actor | null, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  if (!user.isTenant) throw new AppError("FORBIDDEN", "Switch on the tenant role in your profile first.");
  const input = requirementSchema.parse(raw); // before the limit, so form mistakes do not use up the day's posts
  await enforce(limiter, "createRequirement", user.id);
  const { hasPets, smokes, drinks, ...rest } = input;
  return db.requirement.create({
    data: {
      ...rest,
      pets: hasPets ? "YES" : "NO",
      smoking: smokes ? "YES" : "NO",
      alcohol: drinks ? "YES" : "NO",
      tenantId: user.id,
      flagged: checkText(input.intro).verdict === "flag",
    },
    select: { id: true },
  });
}

async function ownedRequirement(db: Db, userId: string, id: string) {
  const r = await db.requirement.findUnique({ where: { id }, select: { id: true, tenantId: true, status: true } });
  if (!r || r.tenantId !== userId || r.status === "DELETED") throw new AppError("NOT_FOUND", "Requirement not found.");
  return r;
}

export async function updateRequirement(db: Db, actor: Actor | null, id: string, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  await ownedRequirement(db, user.id, id);
  const input = requirementSchema.parse(raw);
  const { hasPets, smokes, drinks, ...rest } = input;
  await db.requirement.update({
    where: { id },
    data: {
      ...rest,
      pets: hasPets ? "YES" : "NO",
      smoking: smokes ? "YES" : "NO",
      alcohol: drinks ? "YES" : "NO",
      flagged: checkText(input.intro).verdict === "flag",
    },
  });
}

export async function setRequirementStatus(db: Db, actor: Actor | null, id: string, status: "ACTIVE" | "PAUSED" | "DELETED") {
  const user = await requireActiveUser(db, actor);
  await ownedRequirement(db, user.id, id);
  await db.requirement.update({ where: { id }, data: { status } });
}

/**
 * Board for landlords. Only signed-in, email-verified landlords with an active listing can see it,
 * and rows are reduced to the masked view, so names and free-text intros of women never appear.
 */
export async function listBoard(db: Db, actor: Actor | null, filters: { city?: City; cursor?: string }) {
  const user = await requireActiveUser(db, actor);
  if (!user.isLandlord || !user.emailVerified) {
    throw new AppError("FORBIDDEN", "Verify your email and switch on the landlord role to see the board.");
  }
  const rows = await db.requirement.findMany({
    where: {
      status: "ACTIVE",
      flagged: false,
      acceptsInvites: true,
      tenant: { status: "ACTIVE", blocking: { none: { blockedId: user.id } } },
      ...(filters.city ? { city: filters.city } : {}),
    },
    select: {
      id: true, occupantGroup: true, city: true, areas: true, budgetMin: true, budgetMax: true,
      moveInDate: true, tenantType: true, diet: true, intro: true, acceptsInvites: true,
      tenant: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, PAGE_SIZE);
  return {
    items: page.map((r) =>
      toBoardView({
        id: r.id, group: r.occupantGroup as "WOMEN" | "MEN" | "MIXED", city: r.city, areas: r.areas,
        budgetMin: r.budgetMin, budgetMax: r.budgetMax, moveInDate: r.moveInDate, tenantType: r.tenantType,
        diet: r.diet, intro: r.intro, acceptsInvites: r.acceptsInvites, tenantName: r.tenant.name,
      }),
    ),
    nextCursor: rows.length > PAGE_SIZE ? (page[page.length - 1]?.id ?? null) : null,
  };
}
