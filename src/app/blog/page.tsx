import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDate, newestFirst, readingMinutes } from "@/lib/blog";
import { posts } from "@/content/posts";

export const metadata: Metadata = {
  title: "Updates",
  description: "News and updates from Gharmatch, each with a 30-second summary.",
};

export default function Blog() {
  const list = newestFirst(posts);
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <p className="index">Updates</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">What is new.</h1>
      <p className="mt-6 max-w-xl text-[18px] leading-8 text-soft">
        News from the people who run Gharmatch. Every post has a 30-second summary, so you can get the point and move on.
      </p>

      <ul className="mt-14 space-y-6">
        {list.map((p) => (
          <li key={p.slug} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase text-faint">
              <span className="rounded-md border border-line px-2 py-0.5">{p.tag}</span>
              <span>{formatPostDate(p.date)}</span>
              <span>{readingMinutes(p)} min read</span>
            </p>
            <h2 className="font-display mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              <Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-soft">
              <span className="mr-2 rounded-md bg-lamp px-2 py-0.5 font-mono text-[11px] font-medium uppercase text-void">In short</span>
              {p.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href={`/blog/${p.slug}/summary`} className="inline-flex h-11 items-center rounded-full bg-text px-5 font-medium text-void">30-second summary</Link>
              <Link href={`/blog/${p.slug}`} className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 hover:bg-raised">Read the full post</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
