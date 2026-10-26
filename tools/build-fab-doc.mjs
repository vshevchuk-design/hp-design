// Regenerates docs/fab.html from tokens/components/fab.tokens.json.
// The floating action button. The recipe lives in tools/lib/fab.mjs (colours
// and states from Button primary); the CX shell's Assistant button uses it.
// Run: node tools/build-fab-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { FAB_CSS, FAB_COLOR_PATHS, fabHtml } from "./lib/fab.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rootVars = renderRootVars([...[...FAB_COLOR_PATHS, "surface.page", "border.default", "text.secondary"].map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${FAB_CSS}`;
// demo only: a frame standing in for the viewport, so .fab--fixed can be shown in place
const demoCss = `
.fab-frame { position: relative; height: 240px; border-radius: 12px; overflow: hidden; background: var(--tok-surface-page); border: 1px solid var(--tok-border-default); }
.fab-frame--phone { width: 280px; }
.fab-frame .fab--fixed { position: absolute; }
.fab-frame--phone .fab--fixed { right: 16px; bottom: 16px; }
.fab-frame__text { padding: 16px; font: 12px/1.5 var(--sans); color: var(--tok-text-secondary); }
.fab-row { display: flex; gap: 24px; align-items: center; }`;

const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><p class="story-note">${note}</p></div>`;
const frame = (phone) => `<div class="fab-frame${phone ? " fab-frame--phone" : ""}"><p class="fab-frame__text">Page content scrolls under it.</p>${fabHtml({ icon: "auto_awesome", label: "Assistant" })}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — FAB</title>
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
  .legend .row b { width: 90px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story-grid--wide { grid-template-columns: 1fr; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; overflow-x: auto; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .cal-out { font-family: var(--mono); font-size: 11.5px; color: var(--text-secondary); margin: 12px 0 0; min-height: 1.5em; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("fab")}</nav>
  <main>
    <h1>FAB</h1>
    <p class="sub">tokens/components/fab.tokens.json · generated — the floating action button: one round icon button pinned to the bottom-right corner, for the one thing that should be reachable from anywhere (the CX Assistant).</p>

    <div class="legend">
      <div class="row"><b>Colours</b><span>Button primary's — fill, hover, pressed, focus ring are resolved from <code class="tok">button.tokens.json</code>, not re-declared.</span></div>
      <div class="row"><b>Shape</b><span>48px round (<code class="tok">radius.full</code>) on every width, 24px icon, <code class="tok">shadow.md</code> — the only button with elevation, because it floats over content.</span></div>
      <div class="row"><b>Position</b><span><code class="tok">.fab--fixed</code>: 24px from the right and bottom edges (16px under 768px), plus the iOS safe-area inset.</span></div>
      <div class="row"><b>Rules</b><span>One per screen. Icon only, so always an <code class="tok">aria-label</code> and a native <code class="tok">title</code> — <code class="tok">fabHtml()</code> refuses to render without one. Not a regular round button: an icon button inside a toolbar or a card stays Button icon-only.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">
      ${story("Desktop", frame(false), "24px from the corner.")}
      ${story("Phone (< 768px)", frame(true), "16px from the corner (the frame stands in for the viewport).")}
      ${story("States", `<div class="fab-row">${fabHtml({ icon: "auto_awesome", label: "Default", fixed: false })}${fabHtml({ icon: "auto_awesome", label: "Hover", fixed: false, attrs: 'style="background: var(--tok-fill-primary-hover)"' })}${fabHtml({ icon: "auto_awesome", label: "Pressed", fixed: false, attrs: 'style="background: var(--tok-fill-primary-active)"' })}</div>`, "Default · hover · pressed — Button primary's ladder. Tab to it for the focus ring.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(fabHtml({ icon: "auto_awesome", label: "Assistant", id: "assistant-fab", attrs: 'aria-haspopup="dialog"' }).replace(/<path[^>]*>/, "…"))}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/fab.html"), html);
console.log("wrote docs/fab.html");
