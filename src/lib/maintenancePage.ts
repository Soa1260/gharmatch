/**
 * The page every visitor sees while the site is in maintenance mode (MAINTENANCE_MODE=1, see docs/MAINTENANCE.md).
 *
 * It is plain HTML with inline styles and an inline logo. It needs no script, no font, no image, no database and
 * no other file, so it still shows when the rest of the app is down or being migrated.
 */
export const MAINTENANCE_RETRY_SECONDS = 600;

/** Only the exact value 1 switches maintenance mode on. Read when the site is built and again when a request arrives. */
export const maintenanceOn = () => process.env.MAINTENANCE_MODE === "1";

const sharedHeaders = {
  "Retry-After": String(MAINTENANCE_RETRY_SECONDS),
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/** The answer for a page address: the maintenance page with a 503. Outside maintenance mode this address does not exist. */
export function maintenancePageResponse(): Response {
  if (!maintenanceOn()) return new Response("Not found", { status: 404 });
  return new Response(maintenanceHtml, { status: 503, headers: { ...sharedHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

/** The answer for an /api address: a short JSON message with a 503. */
export function maintenanceJsonResponse(): Response {
  if (!maintenanceOn()) return new Response("Not found", { status: 404 });
  const body = JSON.stringify({ error: "Gharmatch is in maintenance. Please try again in a few minutes." });
  return new Response(body, { status: 503, headers: { ...sharedHeaders, "Content-Type": "application/json" } });
}

export const maintenanceHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<meta http-equiv="refresh" content="120">
<title>Back soon | Gharmatch</title>
<style>
  :root { --void:#060709; --surface:#0d0f12; --line:#20242a; --text:#eef0f2; --soft:#a3a9b1; --faint:#6c727b; --lamp:#f0b56e; }
  * { box-sizing: border-box; }
  html { background: var(--void); color: var(--text); }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 20px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.55; -webkit-font-smoothing: antialiased;
    background: radial-gradient(60rem 30rem at 50% -10%, rgba(240,181,110,.10), transparent 60%), var(--void);
  }
  main { width: 100%; max-width: 34rem; text-align: center; }
  .mark { width: 84px; height: 84px; margin: 0 auto 28px; filter: drop-shadow(0 0 28px rgba(240,181,110,.28)); }
  .glow { animation: glow 3.2s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
  .tag { margin: 0 0 14px; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--lamp); }
  h1 { margin: 0; font-size: clamp(2rem, 6vw, 2.9rem); line-height: 1.1; letter-spacing: -.02em; }
  .hi { margin: 14px 0 0; font-size: 1.1rem; color: var(--lamp); }
  .lead { margin: 18px auto 0; max-width: 28rem; color: var(--soft); font-size: 1.02rem; }
  .btn {
    display: inline-block; margin-top: 28px; padding: 13px 26px; border-radius: 999px; background: var(--text); color: #0a0c10;
    font-weight: 600; text-decoration: none; font-size: .98rem;
  }
  .btn:hover { background: var(--lamp); }
  .btn:focus-visible, a:focus-visible { outline: 2px solid var(--lamp); outline-offset: 3px; }
  .card { margin: 40px auto 0; padding: 20px 22px; text-align: left; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; }
  .card h2 { margin: 0 0 10px; font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); font-weight: 600; }
  .card p { margin: 0 0 8px; font-size: .95rem; color: var(--soft); }
  .card p:last-child { margin-bottom: 0; }
  .card strong { color: var(--text); font-weight: 600; }
  .card a { color: var(--lamp); text-decoration: none; }
  .card a:hover { text-decoration: underline; }
  footer { margin-top: 30px; font-size: .82rem; color: var(--faint); }
  @media (prefers-reduced-motion: reduce) { .glow { animation: none; } }
</style>
</head>
<body>
<main>
  <svg class="mark" viewBox="60 60 392 392" role="img" aria-label="Gharmatch">
    <g stroke-linejoin="round" stroke-width="26">
      <polygon points="244,100 86,240 86,424 244,424" fill="#f4efe6" stroke="#f4efe6"/>
      <polygon points="268,128 426,268 426,424 268,424" fill="#f0b56e" stroke="#f0b56e"/>
    </g>
    <path d="M224 437 V356 a32 32 0 0 1 64 0 V437 Z" fill="#0a0c10"/>
    <circle class="glow" cx="256" cy="366" r="11" fill="#f0b56e"/>
  </svg>

  <p class="tag">Short maintenance break</p>
  <h1>We are tidying up the house.</h1>
  <p class="hi">Thodi der mein wapas aayenge.</p>
  <p class="lead">Gharmatch is down for a short while so we can make it better. Please check again in a few minutes. This page refreshes by itself.</p>
  <a class="btn" href="/">Check again</a>

  <section class="card" aria-label="While you wait">
    <h2>While you wait</h2>
    <p><strong>Your account, listings and searches</strong> will be here when we are back.</p>
    <p><strong>In an emergency</strong>, call <a href="tel:112">112</a>. Women&rsquo;s helpline: <a href="tel:1091">1091</a>. The site being down does not change that.</p>
    <p><strong>Need us?</strong> Write to <a href="mailto:gharmatch1@gmail.com">gharmatch1@gmail.com</a>.</p>
  </section>

  <footer>Gharmatch &middot; Rentals in Ahmedabad and Gandhinagar &middot; gharmatch.space</footer>
</main>
</body>
</html>
`;
