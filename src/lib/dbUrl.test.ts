import { describe, expect, it } from "vitest";
import { databaseUrl } from "./dbUrl";

const base = "postgresql://user:pass@ep-example-pooler.ap-southeast-1.aws.neon.tech/neondb";

describe("databaseUrl", () => {
  it("states verify-full for the modes the driver already treats as verify-full", () => {
    for (const mode of ["require", "prefer", "verify-ca"]) {
      expect(databaseUrl(`${base}?sslmode=${mode}`)).toContain("sslmode=verify-full");
    }
  });

  it("keeps the other settings in the address", () => {
    const out = databaseUrl(`${base}?sslmode=require&channel_binding=require`) ?? "";
    expect(out).toContain("sslmode=verify-full");
    expect(out).toContain("channel_binding=require");
    expect(out).toContain("user:pass@ep-example-pooler");
  });

  it("leaves everything else untouched", () => {
    expect(databaseUrl(`${base}?sslmode=verify-full`)).toBe(`${base}?sslmode=verify-full`);
    expect(databaseUrl(`${base}?sslmode=disable`)).toBe(`${base}?sslmode=disable`);
    expect(databaseUrl(base)).toBe(base);
    expect(databaseUrl(`${base}?sslmode=require&uselibpqcompat=true`)).toBe(`${base}?sslmode=require&uselibpqcompat=true`);
    expect(databaseUrl("not a url")).toBe("not a url");
    expect(databaseUrl("")).toBe("");
  });
});
