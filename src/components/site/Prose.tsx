/**
 * Shell for text pages. `draft` shows the "needs review" banner; pass `missing` to name the settings that
 * are still empty, so the person launching the site knows exactly what to fill in.
 */
export function Page({
  index,
  title,
  draft = false,
  missing = [],
  children,
}: {
  index: string;
  title: string;
  draft?: boolean;
  missing?: string[];
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <p className="index">{index}</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">{title}</h1>
      {draft ? (
        <p className="mt-6 rounded-xl border border-dashed border-lamp/60 px-4 py-3 font-mono text-[13px] text-lamp">
          Draft. Needs review by a lawyer before launch.
          {missing.length > 0 ? ` Still to set: ${missing.join(", ")}.` : ""}
        </p>
      ) : null}
      <div className="mt-10 space-y-5 text-[16px] leading-relaxed text-soft [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-text [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-text [&_hr]:border-line [&_td]:border-t [&_td]:border-line [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:font-mono [&_th]:text-xs [&_th]:uppercase [&_th]:text-faint">
        {children}
      </div>
    </main>
  );
}
