import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

function safeNext(v: string | undefined): string {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; role?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  async function google() {
    "use server";
    await signIn("google", { redirectTo: next });
  }

  return (
    <main className="mx-auto grid min-h-[100svh] max-w-6xl items-center gap-12 px-6 pb-20 pt-32 md:grid-cols-2">
      <div>
        <p className="index">Sign in</p>
        <h1 className="display mt-6 text-5xl sm:text-7xl">
          {sp.role === "landlord" ? "Post your flat." : "Welcome in."}
        </h1>
        <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-soft">
          No password to remember. Sign in with your Google account, so every post and report belongs to a real account.
        </p>
      </div>
      <div className="space-y-5 rounded-2xl border border-line bg-surface p-8">
        <form action={google}>
          <button className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-void transition-colors hover:bg-white">Continue with Google</button>
        </form>
        <p className="text-xs leading-relaxed text-faint">
          By continuing, I confirm I am 18 or older and agree to the <Link href="/terms" className="underline underline-offset-4">Terms of Use</Link> (including the mediative dispute framework) and the <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>. We only keep what the product needs.
        </p>
      </div>
    </main>
  );
}
