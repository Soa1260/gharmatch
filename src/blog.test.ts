import { describe, expect, it } from "vitest";
import { posts } from "@/content/posts";
import { newestFirst, postProblems, readingMinutes, type Post } from "@/lib/blog";

const good: Post = {
  slug: "a-good-post",
  title: "A good post",
  date: "2026-11-15",
  tag: "Update",
  summary: "One short sentence.",
  keyPoints: ["First point.", "Second point.", "Third point."],
  sections: [{ id: "one", heading: "One", body: [{ type: "p", text: "Short and clear." }] }],
};

describe("the posts we publish", () => {
  it("each follow the readability rules", () => {
    for (const p of posts) expect(postProblems(p), p.slug).toEqual([]);
  });

  it("have different addresses", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never carry HTML or links in their text, since text is shown as plain text", () => {
    const text = JSON.stringify(posts);
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
    expect(text).not.toMatch(/https?:\/\//i);
  });
});

describe("the readability checker", () => {
  it("accepts a good post", () => {
    expect(postProblems(good)).toEqual([]);
  });

  it("flags a long summary, too few or too many key points, and long paragraphs and lists", () => {
    expect(postProblems({ ...good, summary: "x".repeat(201) }).join()).toMatch(/summary/);
    expect(postProblems({ ...good, summary: "" }).join()).toMatch(/summary/);
    expect(postProblems({ ...good, keyPoints: ["one", "two"] }).join()).toMatch(/key points/);
    expect(postProblems({ ...good, keyPoints: Array(6).fill("x") }).join()).toMatch(/key points/);
    expect(postProblems({ ...good, sections: [{ id: "one", heading: "One", body: [{ type: "p", text: "x".repeat(321) }] }] }).join()).toMatch(/split it/);
    expect(postProblems({ ...good, sections: [{ id: "one", heading: "One", body: [{ type: "list", items: Array(8).fill("x") }] }] }).join()).toMatch(/split it/);
  });

  it("flags bad addresses, bad dates, no sections and repeated section ids", () => {
    expect(postProblems({ ...good, slug: "Bad Slug" }).join()).toMatch(/slug/);
    expect(postProblems({ ...good, date: "15/11/2026" }).join()).toMatch(/date/);
    expect(postProblems({ ...good, sections: [] }).join()).toMatch(/section/);
    const dup = { id: "one", heading: "One", body: [{ type: "p" as const, text: "ok" }] };
    expect(postProblems({ ...good, sections: [dup, dup] }).join()).toMatch(/different/);
  });
});

describe("reading time and order", () => {
  it("is at least a minute and grows with the length", () => {
    expect(readingMinutes(good)).toBe(1);
    const long: Post = { ...good, sections: [{ id: "one", heading: "One", body: Array(20).fill({ type: "p", text: "word ".repeat(60) }) }] };
    expect(readingMinutes(long)).toBe(6);
  });

  it("lists the newest post first without changing the original list", () => {
    const a = { ...good, slug: "a", date: "2026-01-01" };
    const b = { ...good, slug: "b", date: "2026-03-01" };
    const c = { ...good, slug: "c", date: "2026-02-01" };
    const input = [a, b, c];
    expect(newestFirst(input).map((p) => p.slug)).toEqual(["b", "c", "a"]);
    expect(input.map((p) => p.slug)).toEqual(["a", "b", "c"]);
  });
});
