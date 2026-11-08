import { describe, expect, it } from "vitest";
import { resolveLocation, type Fetcher } from "./mapsLink";

describe("resolveLocation", () => {
  it("reads plain coordinates without any network call", async () => {
    const never: Fetcher = async () => {
      throw new Error("should not fetch");
    };
    expect(await resolveLocation("23.0302, 72.4711", never)).toEqual({ lat: 23.0302, lng: 72.4711 });
  });

  it("follows a short Google link to a full link", async () => {
    const fetcher: Fetcher = async () => ({ status: 302, location: "https://www.google.com/maps/place/X/@23.0302,72.4711,17z" });
    expect(await resolveLocation("https://maps.app.goo.gl/abc123", fetcher)).toEqual({ lat: 23.0302, lng: 72.4711 });
  });

  it("never contacts hosts outside the allowlist", async () => {
    let called = false;
    const fetcher: Fetcher = async () => {
      called = true;
      return { status: 200, location: null };
    };
    expect(await resolveLocation("https://evil.example.com/redirect", fetcher)).toBeNull();
    expect(await resolveLocation("http://169.254.169.254/latest/meta-data", fetcher)).toBeNull();
    expect(called).toBe(false);
  });

  it("refuses a redirect that leaves Google", async () => {
    const fetcher: Fetcher = async () => ({ status: 302, location: "https://evil.example.com/x" });
    expect(await resolveLocation("https://maps.app.goo.gl/abc123", fetcher)).toBeNull();
  });

  it("gives up on endless redirects", async () => {
    let n = 0;
    const fetcher: Fetcher = async () => {
      n += 1;
      return { status: 302, location: "https://maps.app.goo.gl/loop" };
    };
    expect(await resolveLocation("https://maps.app.goo.gl/loop", fetcher)).toBeNull();
    expect(n).toBeLessThanOrEqual(4);
  });
});
