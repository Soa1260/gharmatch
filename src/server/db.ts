import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl } from "@/lib/dbUrl";

export type Db = PrismaClient;
type Adapter = ConstructorParameters<typeof PrismaClient>[0] extends infer O
  ? O extends { adapter: infer A }
    ? A
    : never
  : never;

/** Email and phone are left out of every query unless a service selects them explicitly. */
export function createClient(adapter: Adapter): PrismaClient {
  return new PrismaClient({ adapter, omit: { user: { phone: true, email: true } } });
}

const globalForDb = globalThis as unknown as { db?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForDb.db) {
    globalForDb.db = createClient(new PrismaPg({ connectionString: databaseUrl(), max: 3 }));
  }
  return globalForDb.db;
}
