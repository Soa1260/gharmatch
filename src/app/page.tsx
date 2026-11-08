import { Hero } from "@/components/landing/Hero";
import { MatchDemo } from "@/components/landing/MatchDemo";
import { Steps } from "@/components/landing/Steps";
import { Item, Reveal, Stagger } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

const safeguards = [
  ["Women appear as “Verified tenant”", "Landlords see no name, no free-text intro and no exact budget for women or mixed groups."],
  ["Landlords earn the right to invite", "Verified email, a live listing and a phone number on file. Invites to women are capped at three a day."],
  ["Women-only means women-only", "Those homes never show up as a match for anyone else, and nobody can click past it."],
  ["Block and report, one tap", "Harassment and unsafe-property reports go to the top of the review queue."],
] as const;

export default function Home() {
  return (
    <main>
      <Hero />

      <section className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <p className="index">(01) House rules</p>
          <div>
            <h2 className="display text-4xl sm:text-6xl">Non-veg chalega?<br />Ask before you travel.</h2>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-soft">
              Food, pets, smoking, visitors, lease. Religion, caste, community, surname and where you are from are not fields here, and text that uses them is rejected. Change your food below and watch the landlord&apos;s rules answer.
            </p>
          </div>
        </Reveal>
        <Reveal className="mt-14">
          <MatchDemo />
        </Reveal>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 border-t border-line px-6 py-28">
        <div className="grid gap-16 md:grid-cols-[1fr_1.4fr]">
          <Reveal className="md:sticky md:top-28 md:self-start">
            <p className="index">(02) How it works</p>
            <h2 className="display mt-6 text-4xl sm:text-6xl">Four steps. Nobody gets chased.</h2>
          </Reveal>
          <Steps />
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-6xl scroll-mt-24 border-t border-line px-6 py-28">
        <Reveal className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <p className="index">(03) Safety</p>
          <h2 className="display text-4xl sm:text-6xl">Built around the person looking for a home.</h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-4 md:grid-cols-2">
          {safeguards.map(([title, body], i) => (
            <Item key={title} className="rounded-2xl border border-line bg-surface p-7 md:p-9">
              <p className="index">0{i + 1}</p>
              <h3 className="font-display mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-soft">{body}</p>
            </Item>
          ))}
        </Stagger>
        <Reveal className="mt-4 rounded-2xl border border-dashed border-line-strong px-6 py-5 font-mono text-[13px] text-soft">
          Never pay a deposit before you have seen the home. Visit in daylight. Tell someone where you are going.
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28 pt-4">
        <Reveal className="rounded-[28px] bg-lamp px-8 py-16 text-void md:px-16 md:py-24">
          <h2 className="display max-w-3xl text-5xl sm:text-7xl">Ghar dhoondho. Ya kisi ko ghar do.</h2>
          <p className="mt-5 max-w-md text-lg text-void/70">Find a home, or find the right person for yours.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/listings" className="!bg-void !text-text hover:!bg-black">Browse homes</Button>
            <Button href="/listings/new" variant="ghost" className="!border-void/40 !text-void hover:!bg-void/10">Post your home</Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
