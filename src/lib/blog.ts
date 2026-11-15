/**
 * Blog posts are plain data in src/content/posts.ts, so a new post is one edit and a push. No database is involved.
 * The shape is strict on purpose: a short summary, a few key points and short paragraphs keep every post quick to scan.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export interface Section {
  /** Used for the jump link, so keep it short and lowercase, like "landlord-tools". */
  id: string;
  heading: string;
  body: Block[];
}

export interface Post {
  slug: string;
  title: string;
  /** Year-month-day, for example 2026-11-15. */
  date: string;
  tag: "Update" | "Safety" | "Product" | "News";
  /** One sentence, shown on the list page and as the page description. */
  summary: string;
  /** Three to five short points. Shown as "In 30 seconds" on the summary page and at the top of the post. */
  keyPoints: string[];
  sections: Section[];
}

export const SUMMARY_MAX = 200;
export const PARAGRAPH_MAX = 320;
export const KEY_POINTS_MIN = 3;
export const KEY_POINTS_MAX = 5;

const WORDS_PER_MINUTE = 200;

function blockText(b: Block): string {
  return b.type === "list" ? b.items.join(" ") : b.text;
}

/** Whole minutes to read the full post, never less than one. */
export function readingMinutes(post: Post): number {
  const words = post.sections.flatMap((s) => [s.heading, ...s.body.map(blockText)]).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function newestFirst(posts: readonly Post[]): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Problems that would make a post slow to read. An empty list means the post is fine. Checked by a test. */
export function postProblems(post: Post): string[] {
  const out: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) out.push("slug must be lowercase words joined by dashes");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || Number.isNaN(Date.parse(post.date))) out.push("date must look like 2026-11-15");
  if (post.summary.length === 0 || post.summary.length > SUMMARY_MAX) out.push(`summary must be 1 to ${SUMMARY_MAX} characters`);
  if (post.keyPoints.length < KEY_POINTS_MIN || post.keyPoints.length > KEY_POINTS_MAX) out.push(`give ${KEY_POINTS_MIN} to ${KEY_POINTS_MAX} key points`);
  if (post.keyPoints.some((k) => k.length > 140)) out.push("each key point must be 140 characters or fewer");
  if (post.sections.length === 0) out.push("add at least one section");
  const ids = post.sections.map((s) => s.id);
  if (new Set(ids).size !== ids.length) out.push("section ids must be different");
  for (const s of post.sections) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) out.push(`section id "${s.id}" must be lowercase words joined by dashes`);
    for (const b of s.body) {
      if (b.type === "p" && b.text.length > PARAGRAPH_MAX) out.push(`a paragraph in "${s.heading}" is over ${PARAGRAPH_MAX} characters, split it`);
      if (b.type === "list" && b.items.length > 7) out.push(`a list in "${s.heading}" has more than 7 items, split it`);
    }
  }
  return out;
}
