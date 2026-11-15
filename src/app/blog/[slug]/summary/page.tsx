import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPostDate, readingMinutes } from "@/lib/blog";
import { posts } from "@/content/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Not found", robots: { index: false } };
  return { title: `Summary: ${post.title}`, description: post.summary };
}

/** The short version of a post on its own page: the point, the key facts, and where to go for more. */
export default async function PostSummary({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const minutes = readingMinutes(post);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-28 pt-32">
      <Link href="/blog" className="index hover:text-text">← All updates</Link>
      <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase text-faint">
        <span className="rounded-md border border-line px-2 py-0.5">{post.tag}</span>
        <span>{formatPostDate(post.date)}</span>
        <span>30-second summary</span>
      </p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">{post.title}</h1>

      <p className="mt-8 text-[22px] leading-9 text-text">{post.summary}</p>

      <h2 className="index mt-12">The key points</h2>
      <ol className="mt-4 space-y-4">
        {post.keyPoints.map((k, i) => (
          <li key={k} className="flex gap-4 rounded-2xl border border-line bg-surface p-5 text-[18px] leading-relaxed text-text">
            <span aria-hidden className="font-mono text-sm text-lamp">{String(i + 1).padStart(2, "0")}</span>
            <span>{k}</span>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-line p-6">
        <p className="font-display text-2xl font-semibold tracking-tight">Want the detail?</p>
        <p className="mt-2 text-[16px] text-soft">The full post takes about {minutes} {minutes === 1 ? "minute" : "minutes"}. Or jump straight to the part you care about:</p>
        <ul className="mt-5 flex flex-wrap gap-3 text-sm">
          {post.sections.map((s) => (
            <li key={s.id}>
              <Link href={`/blog/${post.slug}#${s.id}`} className="inline-flex h-11 items-center rounded-full border border-line-strong px-4 hover:bg-raised">{s.heading}</Link>
            </li>
          ))}
        </ul>
        <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex h-12 items-center rounded-full bg-text px-6 text-sm font-medium text-void">Read the full post</Link>
      </div>
    </main>
  );
}
