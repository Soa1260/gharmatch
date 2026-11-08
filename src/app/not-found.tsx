import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-40">
      <p className="index">404</p>
      <h1 className="display mt-4 text-5xl sm:text-8xl">Ghar nahi mila.</h1>
      <p className="mt-6 max-w-md text-[17px] text-soft">That page is gone, or the home was rented or taken down.</p>
      <div className="mt-8"><Button href="/listings">Browse homes</Button></div>
    </main>
  );
}
