import { describe, expect, it } from "vitest";
import { approximate, checkLocation, mapsEmbedUrl, mapsOpenUrl, parseCoordinates } from "./location";

describe("parseCoordinates", () => {
  it("reads plain coordinates", () => {
    expect(parseCoordinates("23.0302, 72.4711")).toEqual({ lat: 23.0302, lng: 72.4711 });
    expect(parseCoordinates("23.0302 72.4711")).toEqual({ lat: 23.0302, lng: 72.4711 });
  });
  it("reads the common Google Maps URL shapes", () => {
    expect(parseCoordinates("https://www.google.com/maps/place/Bopal/@23.0302,72.4711,17z/data=x")).toEqual({ lat: 23.0302, lng: 72.4711 });
    expect(parseCoordinates("https://www.google.com/maps/place/X/data=!3d23.0302!4d72.4711")).toEqual({ lat: 23.0302, lng: 72.4711 });
    expect(parseCoordinates("https://www.google.com/maps?q=23.0302,72.4711")).toEqual({ lat: 23.0302, lng: 72.4711 });
  });
  it("returns null for text without coordinates", () => {
    expect(parseCoordinates("near the big temple")).toBeNull();
    expect(parseCoordinates("123.5, 400.2")).toBeNull();
  });
});

describe("checkLocation", () => {
  it("accepts a pin inside the chosen area", () => {
    const r = checkLocation("AHMEDABAD", "Bopal", { lat: 23.0302, lng: 72.4711 });
    expect(r).toMatchObject({ ok: true, status: "MATCHES_AREA" });
  });
  it("refuses a pin outside the city", () => {
    expect(checkLocation("AHMEDABAD", "Bopal", { lat: 19.07, lng: 72.87 })).toMatchObject({ ok: false });
    expect(checkLocation("GANDHINAGAR", "Kudasan", { lat: 23.03, lng: 72.47 })).toMatchObject({ ok: false });
  });
  it("holds a pin in the right city but far from the area", () => {
    const r = checkLocation("AHMEDABAD", "Bopal", { lat: 23.07, lng: 72.65 });
    expect(r).toMatchObject({ ok: true, status: "FAR_FROM_AREA" });
  });
  it("treats Gandhinagar sectors loosely", () => {
    expect(checkLocation("GANDHINAGAR", "Sector 7", { lat: 23.22, lng: 72.65 })).toMatchObject({ ok: true, status: "MATCHES_AREA" });
  });
});

describe("approximate", () => {
  it("snaps to a grid cell centre so the exact point is not shown", () => {
    const p = { lat: 23.03021, lng: 72.47113 };
    const a = approximate(p);
    expect(a).toEqual({ lat: 23.035, lng: 72.475 });
    expect(Math.abs(a.lat - p.lat)).toBeLessThan(0.0051);
    expect(JSON.stringify(a)).not.toContain("23.0302");
  });
});

describe("map urls", () => {
  it("builds open and embed links", () => {
    expect(mapsOpenUrl({ lat: 23.03, lng: 72.47 })).toContain("query=23.03,72.47");
    expect(mapsEmbedUrl({ lat: 23.03, lng: 72.47 }, 14)).toContain("output=embed");
    expect(mapsEmbedUrl({ lat: 23.03, lng: 72.47 }, 14, "KEY")).toContain("embed/v1/place?key=KEY");
  });
});
