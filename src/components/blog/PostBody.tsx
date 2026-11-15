import type { Block, Section } from "@/lib/blog";

/** Turns **double stars** into bold text. Nothing else is interpreted, so a post can never inject markup. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-text">{part}</strong> : <span key={i}>{part}</span>))}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "list") {
    return (
      <ul className="space-y-2.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-lamp" />
            <span><Inline text={item} /></span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "callout") {
    return (
      <p className="rounded-2xl border border-lamp/40 bg-surface px-5 py-4 text-[17px] leading-relaxed text-text">
        <Inline text={block.text} />
      </p>
    );
  }
  return <p><Inline text={block.text} /></p>;
}

/** Big headings, short paragraphs, plenty of space between them, and a number on each section to find your place. */
export function PostBody({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-16">
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
          <p className="index">{String(i + 1).padStart(2, "0")}</p>
          <h2 id={`${s.id}-h`} className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl">{s.heading}</h2>
          <div className="mt-6 space-y-5 text-[18px] leading-8 text-soft">
            {s.body.map((b, j) => <BlockView key={j} block={b} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
