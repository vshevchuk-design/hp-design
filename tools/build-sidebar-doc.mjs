// Regenerates docs/sidebar.html from tokens/components/sidebar.tokens.json.
// The CX app's brand-blue primary navigation. The recipe itself (CSS, markup,
// behaviour) lives in tools/lib/sidebar.mjs so the CX prototypes render the
// exact same thing; this page only lays out stories around it.
// Run: node tools/build-sidebar-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { SIDEBAR_CSS, SIDEBAR_COLOR_PATHS, SIDEBAR_JS, sidebarHtml } from "./lib/sidebar.mjs";
import { CX_NAV, CX_USER } from "./lib/cx-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const colorPrim = load("tokens/primitives/color.tokens.json").color;
const typo = load("tokens/primitives/typography.tokens.json");
const semantic = load("tokens/semantic/color.tokens.json");
const registry = { color: colorPrim, family: typo.family, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rootVars = renderRootVars([...SIDEBAR_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${SIDEBAR_CSS}`;

// Stories render the panel at a fixed height inside a frame, and pin it in
// place at every width (on the real page it becomes a drawer below 1024).
const demoCss = `
.sb-frame { height: 640px; display: flex; border-radius: 10px; overflow: hidden; border: 0.5px solid var(--border); background: #f9fafb; }
.sb-frame .sidebar { height: 100%; position: relative !important; transform: none !important; }
.sb-frame__page { flex: 1; padding: 20px; font: 12px/1.5 var(--sans); color: var(--text-muted); }`;

const frame = (opts) => `<div class="sb-frame">${sidebarHtml({ user: CX_USER, nav: CX_NAV, ...opts })}<div class="sb-frame__page">Page content</div></div>`;
const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Sidebar</title>
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
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; max-width: 78ch; line-height: 1.6; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 130px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("sidebar")}</nav>
  <main>
    <h1>Sidebar</h1>
    <p class="sub">tokens/components/sidebar.tokens.json · generated — the CX app's primary navigation: a brand-blue panel with flat links, collapsible groups, counts, and the signed-in person at the foot. One recipe, three shapes: expanded (288px), the collapsed rail (64px), the rail automatically between 768 and 1279px, and below 768px an off-canvas drawer. Shared with the CX prototypes through <code class="tok">tools/lib/sidebar.mjs</code>.</p>

    <div class="legend">
      <div class="row"><b>From the live app</b><span>Same structure, item for item (read off a saved copy of the live Dashboard). What changed: an open group no longer becomes a white panel with dark text and a black outline — its links stay on the blue, indented under the parent's label; only the <i>current page</i> is a white pill. Hover is one surface step (<code class="tok">surface.brandHover</code>), not a darker band.</span></div>
      <div class="row"><b>Themes</b><span>Brand blue (default) and neutral gray (<code class="tok">.sidebar--neutral</code>, below). Same sizes, states and behaviour; only the colour roles change.</span></div>
      <div class="row"><b>Surface</b><span>New semantic roles, added for this: <code class="tok">surface.brand</code> (blue.700), <code class="tok">surface.brandHover</code> (blue.600), <code class="tok">text.onBrandMuted</code> (blue.100) for nested links and chevrons, <code class="tok">border.onBrand</code> for the dividers. Text and icons are <code class="tok">text.onFill</code> / <code class="tok">icon.onFill</code>.</span></div>
      <div class="row"><b>Current page</b><span><code class="tok">aria-current="page"</code> → white pill (<code class="tok">surface.default</code>), brand text and icon, semibold. A closed group that holds the current page keeps a semibold label so you can find your way back.</span></div>
      <div class="row"><b>Groups</b><span>A <code class="tok">button</code> with <code class="tok">aria-expanded</code> + <code class="tok">aria-controls</code>; the list is <code class="tok">hidden</code> when closed. Nested links are indented 44px — their text starts under the parent's label.</span></div>
      <div class="row"><b>Counts</b><span>Counter sm in its <code class="tok">onPrimary</code> <i>active</i> colours (white chip, brand text). The inactive onPrimary chip is blue.700 — the panel's own colour — so it would vanish. In the rail a count becomes a dot.</span></div>
      <div class="row"><b>Focus</b><span><code class="tok">border.focus</code> is blue.600, invisible on this panel — the ring here is white, 2px, inset.</span></div>
      <div class="row"><b>Rail</b><span>The collapse button (top right) shrinks the panel to its icons; each item's label is its native <code class="tok">title</code>. Opening a group from the rail expands the panel first.</span></div>
      <div class="row"><b>768–1279px</b><span>In an app (<code class="tok">.has-sidebar</code>) the panel folds to the rail by itself, as the live app does. Expanding it (the button, or a group) opens a <b>320px panel over the page</b> with a close button and a scrim — the content keeps the rail's 64px and doesn't move. ✕, the scrim, Escape or choosing a link closes it back to the rail.</span></div>
      <div class="row"><b>Below 768px</b><span>Off-canvas; the topbar's menu button opens it <b>full screen</b> with a close button in the header. See it in the CX prototypes.</span></div>
    </div>

    <h2 class="big-section">Shapes</h2>
    <div class="story-grid">
      ${storyCard("Expanded", frame({ active: "dashboard", id: "sb1" }), "Dashboard current. Groups closed.")}
      ${storyCard("Group open, nested page current", frame({ active: "advisor-action-items", id: "sb2" }), "Advisor → Action Items. The group's count and the item's own count both show.")}
      ${storyCard("Collapsed rail", frame({ active: "dashboard", id: "sb3", collapsed: true }), "64px, icons only; Advisor's count is a dot. Click a group icon to expand.")}
    </div>

    <h2 class="big-section">Neutral (gray)</h2>
    <p class="section-desc"><code class="tok">.sidebar--neutral</code> — the same recipe on <code class="tok">surface.dim</code> (gray.50 — still a step darker than the gray.25 page) with dark text and a hairline right edge. Hover is the wash tier (<code class="tok">fill.neutralHover</code>); the current page is the same white pill, no outline; focus is the system ring; counts are Counter <code class="tok">onNeutral</code> active (brand chip). The logo keeps its normal colours.</p>
    <div class="story-grid">
      ${storyCard("Expanded", frame({ active: "dashboard", id: "sb4", theme: "neutral" }), "Dashboard current. Groups closed.")}
      ${storyCard("Group open, nested page current", frame({ active: "advisor-action-items", id: "sb5", theme: "neutral" }), "Advisor → Action Items.")}
      ${storyCard("Collapsed rail", frame({ active: "dashboard", id: "sb6", collapsed: true, theme: "neutral" }), "64px, icons only.")}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${SIDEBAR_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/sidebar.html"), html);
console.log("wrote docs/sidebar.html");
