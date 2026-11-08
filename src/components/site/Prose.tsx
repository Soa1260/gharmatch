export function Page({ index, title, draft = false, children }: { index: string; title: string; draft?: boolean; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <p className="index">{index}</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">{title}</h1>
      {draft ? (
        <p className="mt-6 rounded-xl border border-dashed border-lamp/60 px-4 py-3 font-mono text-[13px] text-lamp">
          Draft template. Needs review by a lawyer before launch.
        </p>
      ) : null}
      <div className="mt-10 space-y-5 text-[16px] leading-relaxed text-soft [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </main>
  );
}
