// Regenerates docs/toast.html from tokens/components/toast.tokens.json.
// Recipe and behaviour in tools/lib/toast.mjs; the role icon is StatusIcon.
// Run: node tools/build-toast-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { TOAST_COLOR_PATHS, TOAST_CSS, TOAST_JS, TOAST_DURATIONS, toastHtml } from "./lib/toast.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const colorPaths = [...new Set([...TOAST_COLOR_PATHS, "fill.neutral", "fill.neutralHoverStrong", "text.default"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${TOAST_CSS}`;

const story = (title, opts, note = "") => {
  const live = toastHtml({ ...opts, isStatic: true });
  return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><pre class="code"><code>${esc(live.replace(/<svg[\s\S]*?<\/svg>/g, "…").replace(" toast--static", ""))}</code></pre>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
};
const roles = [
  story("info", { role: "info", text: "Registration opens Monday" }, "New — neutral news, StatusIcon info."),
  story("success", { role: "success", text: "Message sent" }),
  story("warning", { role: "warning", text: "This thread expires tomorrow" }),
  story("danger", { role: "danger", text: "Could not send the message" }, "role=\"alert\" — read out at once."),
];
const rich = [
  story("Two lines — title + description", { role: "success", title: "Appointment booked", text: "Tue, Oct 27 at 10:00 AM with Andy Hernandez. We emailed you the details." }, "Title in heading-sm, the second line body-sm · text.secondary; wraps past 480px."),
  story("With Undo — and the timer", { role: "success", title: "Thread archived", text: "It's in Archive for 30 days.", action: "Undo", close: true, timer: true }, `Undo is Button tint sm; × closes. The bar along the bottom drains over ${TOAST_DURATIONS.withAction / 1000}s (frozen here) and pauses while the pointer or focus is on the toast.`),
  story("One line with Undo", { role: "info", text: "Draft deleted", action: "Undo", close: true, timer: true }),
];
const demo = `<div class="demo-row">
  <button class="demo-btn" onclick="showToast({ role: 'info', text: 'Registration opens Monday' })">Info</button>
  <button class="demo-btn" onclick="showToast({ role: 'success', title: 'Appointment booked', text: 'Tue, Oct 27 at 10:00 AM with Andy Hernandez.' })">Two lines</button>
  <button class="demo-btn" onclick="showToast({ role: 'success', title: 'Thread archived', text: 'It\\'s in Archive for 30 days.', action: { label: 'Undo', onClick: () => showToast({ role: 'info', text: 'Thread restored' }) } })">With Undo</button>
  <button class="demo-btn" onclick="showToast({ role: 'danger', text: 'Could not send the message' })">Danger</button>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Toast</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root { --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa; --border: #e4e3df; --border-strong: #d2d1cb; --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87; --accent: #0468c4; --accent-bg: #eff6ff; --code-bg: #1e1e22; --code-text: #e4e3df; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; --sans: -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
  * { box-sizing: border-box; } body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); } .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; min-width: 0; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 110px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story--wide { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  .demo-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .demo-btn { height: 32px; padding: 0 12px; border: none; border-radius: 8px; background: var(--tok-fill-neutral); color: var(--tok-text-default); font: 600 13px var(--sans); cursor: pointer; }
  .demo-btn:hover { background: var(--tok-fill-neutral-hover-strong); }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("toast")}</nav>
  <main>
    <h1>Toast</h1>
    <p class="sub">tokens/components/toast.tokens.json · generated — short feedback that floats top-centre and leaves on its own. Recipe in <code class="tok">tools/lib/toast.mjs</code>; the role icon is <a href="status-icon.html">StatusIcon</a>.</p>

    <div class="legend">
      <div class="row"><b>Roles</b><span>info · success · warning · danger — StatusIcon's icon and colour. danger is <code class="tok">role="alert"</code> (read at once), the rest <code class="tok">role="status"</code>.</span></div>
      <div class="row"><b>One or two lines</b><span>A short label, or a title (heading-sm) + a description (body-sm · text.secondary) that wraps past 480px.</span></div>
      <div class="row"><b>Action</b><span>One action — usually <b>Undo</b> — as Button tint sm, plus a × to close. Never a second primary; never more than one action (that's a Dialog's job).</span></div>
      <div class="row"><b>Timer</b><span>A 2px bar along the bottom drains over the toast's life: ${TOAST_DURATIONS.default / 1000}s, ${TOAST_DURATIONS.withAction / 1000}s with an action. It <b>pauses while the pointer or focus is on the toast</b> (WCAG 2.2.1 — the user can stop the clock), so Undo is always reachable.</span></div>
      <div class="row"><b>One at a time</b><span>A new toast replaces the one showing. <code class="tok">popover="manual"</code>: top layer, no light-dismiss.</span></div>
    </div>

    <h2 class="big-section">Try it</h2>
    ${demo}

    <h2 class="big-section">Roles</h2>
    <div class="story-grid">${roles.join("")}</div>

    <h2 class="big-section">Two lines, Undo, timer</h2>
    <div class="story-grid">${rich.join("")}</div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Script</h2>
    <pre class="code"><code>${esc(TOAST_JS)}</code></pre>
  </main>
</div>
<script>
${TOAST_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/toast.html"), html);
console.log("wrote docs/toast.html");
