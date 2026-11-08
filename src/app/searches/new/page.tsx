import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchForm } from "@/components/form/SearchForm";
import { requireOnboarded } from "@/server/session";

export const metadata: Metadata = { title: "Post what you need", robots: { index: false } };

export default async function NewSearch() {
  const user = await requireOnboarded("/searches/new");
  if (!user.isTenant) redirect("/onboarding?next=/searches/new");
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <p className="index">New search</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">What do you need?</h1>
      <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-soft">
        Tell us how you live. Every home will show a match score and any rule that clashes, before you write to anyone.
      </p>
      <SearchForm />
    </main>
  );
}
