// Regenerates docs/skeleton.html from tokens/components/skeleton.tokens.json.
// A shimmering neutral placeholder for content that hasn't loaded; shaped by
// the consumer's width/height, with a line-height token and a --circle modifier.
// Run: node tools/build-skeleton-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const colorPrim = load("tokens/primitives/color.tokens.json").color;
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const radiusPrim = load("tokens/primitives/radius.tokens.json").radius;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const sk = load("tokens/components/skeleton.tokens.json").component.skeleton;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");

const colorPaths = ["surface.sunken", "surface.default", "border.default"];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const radius = px(resolve(sk.radius.$value));
const lineH = px(resolve(sk.line.height.$value));
const dur = sk.duration.$value;
const base = refPath(sk.base.$value);
const hi = refPath(sk.highlight.$value);

const css = `${rootVars}

.skeleton { display: block; border-radius: ${radius}; background: ${cv(base)}; background-image: linear-gradient(90deg, ${cv(base)} 0, ${cv(hi)} 40px, ${cv(base)} 80px); background-size: 600px 100%; background-repeat: no-repeat; animation: skeleton-shimmer ${dur} linear infinite; }
.skeleton--line { height: ${lineH}; }
.skeleton--circle { border-radius: ${px(resolve("radius.full"))}; }
@keyframes skeleton-shimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }`;

const demoCss = `
.sk-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid ${cv("border.default")}; }
.sk-rows { border: 1px solid ${cv("border.default")}; border-radius: 8px; overflow: hidden; background: ${cv("surface.default")}; }
.sk-rows .sk-row:last-child { border-bottom: none; }
.sk-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }`;

function storyCard(title, live, note = "") { return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`; }
const loadingRow = () => `<div class="sk-row"><span class="skeleton skeleton--circle" style="width:32px;height:32px"></span><span class="sk-stack"><span class="skeleton skeleton--line" style="width:40%"></span><span class="skeleton skeleton--line" style="width:75%"></span></span><span class="skeleton skeleton--line" style="width:48px"></span></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Skeleton</title>
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
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 110px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("skeleton")}</nav>
  <main>
    <h1>Skeleton</h1>
    <p class="sub">tokens/components/skeleton.tokens.json · generated — a shimmering neutral placeholder for content that hasn't arrived. One recipe shaped by the consumer's width/height, with a line-height token and a <code class="tok">--circle</code> modifier.</p>

    <div class="legend">
      <div class="row"><b>Shimmer</b><span>A brand-neutral gray sweep: base <code class="tok">surface.sunken</code> → a brighter <code class="tok">surface.default</code> band, animated across. No spinner, no brand color — matches the flat aesthetic. Respects <code class="tok">prefers-reduced-motion</code>.</span></div>
      <div class="row"><b>Shape</b><span>Width/height are the consumer's (like Box). <code class="tok">--line</code> gives a text-row height (16px); <code class="tok">--circle</code> overrides the radius to full for avatar placeholders.</span></div>
      <div class="row"><b>Use</b><span>Compose rows/cards while data loads — e.g. the threads console's "Loading more…" tail. Swap for real content on arrival.</span></div>
    </div>

    <h2 class="big-section">Primitives</h2>
    <div class="story-grid">
      ${storyCard("Lines", `<div style="display:flex;flex-direction:column;gap:10px"><span class="skeleton skeleton--line" style="width:100%"></span><span class="skeleton skeleton--line" style="width:80%"></span><span class="skeleton skeleton--line" style="width:60%"></span></div>`, "Text placeholders — vary the width per line.")}
      ${storyCard("Circle", `<span class="skeleton skeleton--circle" style="width:40px;height:40px"></span>`, "Avatar placeholder.")}
      ${storyCard("Block", `<span class="skeleton" style="width:100%;height:80px"></span>`, "A card/image placeholder — any width/height.")}
    </div>

    <h2 class="big-section">Loading rows</h2>
    <p class="section-desc">Composed into threads-console rows — the "Loading more threads…" tail.</p>
    <div class="story-grid">
      ${storyCard("Thread rows loading", `<div class="sk-rows">${loadingRow()}${loadingRow()}${loadingRow()}</div>`, "", )}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/skeleton.html"), html);
console.log("wrote docs/skeleton.html");
