import type { Metadata } from "next";
import { signOut } from "@/auth";
import { TrustedContactForm } from "@/components/form/TrustedContactForm";
import { getDb } from "@/server/db";
import { deleteAccount } from "@/server/deletion";
import { currentActor, requireOnboarded } from "@/server/session";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function Account() {
  const me = await requireOnboarded("/account");
  const saved = await getDb().user.findUnique({
    where: { id: me.id },
    select: { trustedContactName: true, trustedContactPhone: true },
  });
  const trusted = saved?.trustedContactName && saved.trustedContactPhone ? { name: saved.trustedContactName, phone: saved.trustedContactPhone } : null;

  async function remove(f: FormData) {
    "use server";
    if (String(f.get("confirm") ?? "").trim().toLowerCase() !== "delete") return;
    await deleteAccount(getDb(), await currentActor());
    await signOut({ redirectTo: "/" });
  }
  async function out() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-28 pt-32">
      <p className="index">Account</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">{me.name ?? "Your account"}</h1>
      <form action={out} className="mt-8">
        <button className="h-11 rounded-full border border-line-strong px-6 text-sm hover:bg-raised">Sign out</button>
      </form>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Trusted contact</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-soft">
          One person who should know when you go to see a home. On every listing, “Send to” opens a message to them with the home, the area and a request to call you if they do not hear back. We never contact them ourselves, and only you can see this.
        </p>
        <div className="mt-6">
          <TrustedContactForm current={trusted} />
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-danger/40 p-7">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Delete my account</h2>
        <p className="mt-3 text-sm leading-relaxed text-soft">
          Your name, phone, trusted contact and email are removed now. Your homes and searches disappear and pending conversations are withdrawn. Reports you filed or that name you keep their saved copy for safety and legal reasons. This cannot be undone.
        </p>
        <form action={remove} className="mt-6 flex flex-wrap gap-3">
          <input name="confirm" placeholder='Type "delete"' aria-label="Type delete to confirm" className="h-11 rounded-xl border border-line bg-void px-4 text-sm" />
          <button className="h-11 rounded-full border border-danger/60 px-6 text-sm text-danger">Delete everything</button>
        </form>
      </section>
    </main>
  );
}
