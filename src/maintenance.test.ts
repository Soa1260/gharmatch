import { afterEach, describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { GET as pageGet, POST as pagePost } from "@/app/maintenance/route";
import { GET as jsonGet } from "@/app/maintenance/json/route";
import { maintenanceHtml } from "@/lib/maintenancePage";

afterEach(() => {
  delete process.env.MAINTENANCE_MODE;
});

type Rule = { source: string; destination: string };
async function rules(): Promise<Rule[]> {
  const out = await nextConfig.rewrites?.();
  if (!out) return [];
  return Array.isArray(out) ? (out as Rule[]) : ((out.beforeFiles ?? []) as Rule[]);
}

/** Which destination does this path get? Mirrors how Next matches a source such as /:path((?!api/).*). */
function destinationFor(list: Rule[], path: string): string | null {
  for (const r of list) {
    let re: RegExp;
    if (r.source === "/") re = /^\/$/;
    else {
      const named = r.source.match(/^(.*?)\/?:path\((.*)\)$/);
      const prefix = named?.[1] ?? "";
      const inner = named?.[2] ?? "";
      re = new RegExp(`^${prefix.replace(/\//g, "\\/")}\\/(${inner})$`);
    }
    if (re.test(path)) return r.destination;
  }
  return null;
}

describe("maintenance rewrites", () => {
  it("add nothing unless maintenance mode is on", async () => {
    for (const value of [undefined, "", "0", "true", "yes"]) {
      if (value === undefined) delete process.env.MAINTENANCE_MODE;
      else process.env.MAINTENANCE_MODE = value;
      expect(await rules()).toEqual([]);
    }
  });

  it("send every page to the maintenance page and every API call to the JSON answer", async () => {
    process.env.MAINTENANCE_MODE = "1";
    const list = await rules();
    for (const p of ["/", "/listings", "/listings/some-home-abc123", "/dashboard", "/admin/reports", "/terms", "/sitemap.xml", "/a/very/deep/unknown/path"]) {
      expect(destinationFor(list, p), p).toBe("/maintenance");
    }
    for (const p of ["/api/auth/session", "/api/me/status", "/api/listings/abc/photos"]) {
      expect(destinationFor(list, p), p).toBe("/maintenance/json");
    }
  });

  it("leave Next's files, the icons, robots, the health check, the daily job and the maintenance routes alone", async () => {
    process.env.MAINTENANCE_MODE = "1";
    const list = await rules();
    for (const p of ["/_next/static/chunks/app.js", "/icon.svg", "/apple-icon.png", "/favicon.ico", "/robots.txt", "/api/health", "/api/cron/daily", "/maintenance", "/maintenance/json"]) {
      expect(destinationFor(list, p), p).toBeNull();
    }
  });
});

describe("maintenance answers", () => {
  it("show the page with a 503 for any method, while switched on", async () => {
    process.env.MAINTENANCE_MODE = "1";
    for (const res of [pageGet(), pagePost()]) {
      expect(res.status).toBe(503);
      expect(res.headers.get("content-type")).toContain("text/html");
      expect(res.headers.get("retry-after")).toBeTruthy();
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.text()).toBe(maintenanceHtml);
    }
  });

  it("answer API calls with JSON, not a web page", async () => {
    process.env.MAINTENANCE_MODE = "1";
    const res = jsonGet();
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(((await res.json()) as { error: string }).error).toMatch(/maintenance/i);
  });

  it("do not exist when maintenance mode is off", () => {
    expect(pageGet().status).toBe(404);
    expect(jsonGet().status).toBe(404);
  });

  it("are a self-contained page: no script, no outside files, and it names the emergency number", () => {
    expect(maintenanceHtml).not.toMatch(/<script/i);
    expect(maintenanceHtml).not.toMatch(/(src|href)="https?:/i);
    expect(maintenanceHtml).toContain("tel:112");
    expect(maintenanceHtml).toContain("noindex");
  });
});
