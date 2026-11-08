// One-off cleanup of test data. Keeps user accounts. Dry run by default; pass --yes to delete.
// Run: node scripts/clear-test-data.mjs [--yes]
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const apply = process.argv.includes("--yes");
const tables = ["Appeal", "Report", "Visit", "Interest", "Requirement", "Listing", "AuditLog", "Event", "RateLimit"];

const url = new URL(process.env.DATABASE_URL ?? "");
if (["require", "prefer", "verify-ca"].includes(url.searchParams.get("sslmode") ?? "")) url.searchParams.set("sslmode", "verify-full");
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();

const count = async (t) => (await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n;
console.log(`Database: ${url.hostname}`);
console.log(`User accounts kept: ${await count("User")}`);
for (const t of tables) console.log(`${apply ? "deleting" : "would delete"} ${String(await count(t)).padStart(4)} from ${t}`);

if (!apply) {
  console.log("\nDry run only. Run again with --yes to delete.");
} else {
  try {
    await client.query("begin");
    for (const t of tables) await client.query(`delete from "${t}"`);
    await client.query("commit");
    console.log("\nDeleted. Accounts untouched.");
  } catch (e) {
    await client.query("rollback");
    console.error("\nRolled back, nothing was deleted:", e.message);
    process.exitCode = 1;
  }
}
await client.end();
