import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostBody } from "@/components/blog/PostBody";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { posts } from "@/content/posts";
import { formatPostDate, readingMinutes } from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Not found", robots: { index: false } };
  return {
    title: post.title,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, type: "article", publishedTime: post.date },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const minutes = readingMinutes(post);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-28 pt-32">
      <ReadingProgress />
      <Link href="/blog" className="index hover:text-text">← All updates</Link>
      <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase text-faint">
        <span className="rounded-md border border-line px-2 py-0.5">{post.tag}</span>
        <span>{formatPostDate(post.date)}</span>
        <span>{minutes} min read</span>
      </p>
      <h1 className="display mt-4 text-4xl sm:text-6xl">{post.title}</h1>

      <aside aria-label="Summary" className="mt-10 rounded-2xl border border-lamp/40 bg-surface p-6">
        <p className="font-mono text-xs font-medium uppercase text-lamp">In 30 seconds</p>
        <p className="mt-3 text-[19px] leading-relaxed text-text">{post.summary}</p>
        <ul className="mt-5 space-y-2.5 text-[16px] leading-relaxed text-soft">
          {post.keyPoints.map((k) => (
            <li key={k} className="flex gap-3">
              <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-lamp" />
              <span>{k}</span>
            </li>
          ))}
        </ul>
        <Link href={`/blog/${post.slug}/summary`} className="mt-5 inline-block text-sm underline underline-offset-4 hover:text-text">Show only the summary</Link>
      </aside>

      <nav aria-label="On this page" className="mt-10">
        <p className="index">On this page</p>
        <ol className="mt-3 flex flex-wrap gap-2 text-sm">
          {post.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-soft hover:bg-raised hover:text-text">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-16">
        <PostBody sections={post.sections} />
      </div>

      <div className="mt-20 flex flex-wrap gap-3 border-t border-line pt-10 text-sm">
        <Link href="/blog" className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 hover:bg-raised">All updates</Link>
        <Link href="/listings" className="inline-flex h-11 items-center rounded-full bg-text px-5 font-medium text-void">Browse homes</Link>
      </div>
    </main>
  );
}
