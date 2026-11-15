import type { MetadataRoute } from "next";
import { posts } from "@/content/posts";
import { getDb } from "@/server/db";

export const revalidate = 86_400;
const SITEMAP_LIMIT = 2000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fixed = [
    ...["", "/listings", "/blog", "/safety", "/house-rules-policy", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` })),
    ...posts.flatMap((p) => [
      { url: `${base}/blog/${p.slug}`, lastModified: new Date(`${p.date}T00:00:00Z`) },
      { url: `${base}/blog/${p.slug}/summary`, lastModified: new Date(`${p.date}T00:00:00Z`) },
    ]),
  ];
  if (!process.env.DATABASE_URL) return fixed;
  const rows = await getDb().listing.findMany({
    where: { status: "ACTIVE", flagged: false, expiresAt: { gt: new Date() }, owner: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take: SITEMAP_LIMIT,
    select: { slug: true, updatedAt: true },
  });
  return [...fixed, ...rows.map((r) => ({ url: `${base}/listings/${r.slug}`, lastModified: r.updatedAt }))];
}
