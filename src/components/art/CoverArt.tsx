const GLOWS = ["#f0b56e", "#c8642a", "#3b4fb8", "#2a8a94", "#8a3d6e", "#d98a5a"];
const BASES = ["#0a0b10", "#0c0a0d", "#090d10", "#0d0b09"];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generated cover for homes that have no photo yet. Same seed, same picture, so a listing
 * always looks like itself. Soft light on a dark ground with film grain, no stock imagery.
 */
export function CoverArt({ seed, className = "" }: { seed: string; className?: string }) {
  const h = hash(seed);
  const a = GLOWS[h % GLOWS.length]!;
  const b = GLOWS[(h >>> 4) % GLOWS.length]!;
  const base = BASES[(h >>> 8) % BASES.length]!;
  const ax = 15 + ((h >>> 12) % 70);
  const bx = 15 + ((h >>> 18) % 70);
  const arc = 38 + ((h >>> 22) % 24);

  const background = [
    `radial-gradient(ellipse 70% 55% at ${ax}% 105%, ${a}cc 0%, ${a}00 70%)`,
    `radial-gradient(ellipse 55% 45% at ${bx}% -5%, ${b}66 0%, ${b}00 70%)`,
    `radial-gradient(circle at 50% ${arc + 80}%, transparent ${arc + 30}%, ${a}40 ${arc + 31}%, transparent ${arc + 38}%)`,
    base,
  ].join(", ");

  return <div aria-hidden className={`grain overflow-hidden ${className}`} style={{ background }} />;
}
