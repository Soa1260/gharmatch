/**
 * The Gharmatch mark: one home in two halves, cream and lamp-amber, meeting at a lit doorway.
 * Same drawing as src/app/icon.svg, without the soft glow so it can sit twice on a page.
 */
export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden className={className}>
      <rect width="512" height="512" rx="116" fill="#0a0c10" />
      <g strokeLinejoin="round" strokeWidth="26">
        <polygon points="244,100 86,240 86,424 244,424" fill="#f4efe6" stroke="#f4efe6" />
        <polygon points="268,128 426,268 426,424 268,424" fill="#f0b56e" stroke="#f0b56e" />
      </g>
      <path d="M224 437 V356 a32 32 0 0 1 64 0 V437 Z" fill="#0a0c10" />
      <circle cx="256" cy="366" r="11" fill="#f0b56e" />
    </svg>
  );
}
