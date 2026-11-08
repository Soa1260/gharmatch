"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-40">
      <p className="index">Error</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Something broke on our side.</h1>
      <p className="mt-6 max-w-md text-[17px] text-soft">Nothing you did. Try again, and if it keeps happening write to us from the footer.</p>
      <button onClick={reset} className="mt-8 h-12 rounded-full bg-text px-7 text-[15px] font-medium text-void">Try again</button>
    </main>
  );
}
