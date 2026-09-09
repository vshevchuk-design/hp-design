// Regenerates docs/spinner.html from tokens/components/spinner.tokens.json.
// Indeterminate loading indicator — a pure-CSS rotating ring, sm/base/lg.
// Run: node tools/build-spinner-doc.mjs
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
const sp = load("tokens/components/spinner.tokens.json").component.spinner;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

const SIZES = ["sm", "base", "lg"];
const trackRole = refPath(sp.track.$value);
const indicatorRole = refPath(sp.indicator.$value);
const duration = sp.duration.$value;

const colorPaths = [...new Set([trackRole, indicatorRole, "text.secondary", "text.default", "surface.default", "border.default", "surface.overlay"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const bodySm = resolveToken(get("text-style.body-sm"));
const bodyBase = resolveToken(get("text-style.body-base"));
const headingMd = resolveToken(get("text-style.heading-md"));

const css = `${rootVars}

/* A bordered circle with one side tinted, rotated. No SVG, no asset — the
   size and ring thickness come from tokens, not from markup. */
.spinner { display: inline-block; flex-shrink: 0; border-style: solid; border-color: ${cv(trackRole)}; border-top-color: ${cv(indicatorRole)}; border-radius: ${px(resolve("radius.full"))}; animation: spinner-rotate ${duration} linear infinite; }
${SIZES.map((s) => `.spinner--${s} { width: ${px(resolve(sp.sizes[s].size.$value))}; height: ${px(resolve(sp.sizes[s].size.$value))}; border-width: ${px(resolve(sp.sizes[s].thickness.$value))}; }`).join("\n")}
@keyframes spinner-rotate { to { transform: rotate(360deg); } }
/* NOTE: prefers-reduced-motion deliberately does NOT stop this, unlike
   Skeleton's shimmer. A shimmer is decoration and a static placeholder still
   reads correctly; a stopped spinner is indistinguishable from a broken one,
   and here the motion IS the message. */`;

const demoCss = `
.sp-inline { display: inline-flex; align-items: center; gap: 8px; color: ${cv("text.secondary")}; ${typoCss(bodyBase)} font-family: ${cv("family.sans")}; }
.sp-row { display: flex; align-items: center; gap: 20px; }
/* full-page overlay composition — scrim + centred spinner + copy */
.sp-overlay { position: relative; height: 220px; border-radius: 10px; overflow: hidden; border: 1px solid ${cv("border.default")}; background: ${cv("surface.default")}; }
.sp-overlay__behind { padding: 16px; opacity: 0.35; display: flex; flex-direction: column; gap: 8px; }
.sp-overlay__behind span { display: block; height: 12px; border-radius: 4px; background: ${cv("border.default")}; }
.sp-overlay__veil { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: color-mix(in srgb, ${cv("surface.default")} 80%, transparent); font-family: ${cv("family.sans")}; }
.sp-overlay__title { color: ${cv("text.default")}; ${typoCss(headingMd)} }
.sp-overlay__hint { color: ${cv("text.secondary")}; ${typoCss(bodySm)} }`;

const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
const spinner = (size) => `<span class="spinner spinner--${size}" role="status" aria-label="Loading"></span>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Spinner</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
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
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("spinner")}</nav>
  <main>
    <h1>Spinner</h1>
    <p class="sub">tokens/components/spinner.tokens.json · generated — an indeterminate loading indicator for work of unknown duration. A pure-CSS rotating ring: neutral track, one <code class="tok">fill.primary</code> quarter, three sizes.</p>

    <div class="legend">
      <div class="row"><b>vs Skeleton</b><span>Skeleton stands in for content whose <b>shape</b> is known and about to arrive (rows, avatars, lines). A Spinner is for work of unknown duration where there is no shape to preview yet — a transcript being read, requirements being checked.</span></div>
      <div class="row"><b>Sizes</b><span><code class="tok">sm</code> 16px sits inline with body text · <code class="tok">base</code> 20px standalone · <code class="tok">lg</code> 32px for a full-page overlay where the spinner is the only thing on screen.</span></div>
      <div class="row"><b>Reduced motion</b><span>Deliberately <b>not</b> stopped by <code class="tok">prefers-reduced-motion</code>, unlike Skeleton's shimmer. A shimmer is decoration and a static placeholder still reads correctly; a stopped spinner is indistinguishable from a broken one, and here the motion is the message.</span></div>
      <div class="row"><b>ARIA</b><span>Ships as <code class="tok">role="status"</code> with an <code class="tok">aria-label</code> — the label belongs on the spinner when no visible text accompanies it, otherwise on the text.</span></div>
      <div class="row"><b>Deferred</b><span>A determinate arc (Progress covers determinate work as a bar) and an on-fill variant for spinners inside a primary button.</span></div>
    </div>

    <h2 class="big-section">Sizes</h2>
    <div class="story-grid">
      ${storyCard("All three", `<div class="sp-row">${SIZES.map(spinner).join("")}</div>`, "sm 16 · base 20 · lg 32.")}
      ${storyCard("Inline with text", `<span class="sp-inline">${spinner("sm")}Reading your transcript…</span>`, "sm next to body-base copy — the transcript reader's own state.")}
    </div>

    <h2 class="big-section">Full-page overlay</h2>
    <p class="section-desc">A composition, not a component: a veil over the page, a <code class="tok">lg</code> spinner, and copy that sets expectations for long work. The page stays visible underneath so the user keeps their place.</p>
    <div class="story-grid">
      ${storyCard("Checking your classes…", `<div class="sp-overlay">
        <div class="sp-overlay__behind">${"<span></span>".repeat(7)}</div>
        <div class="sp-overlay__veil">
          ${spinner("lg")}
          <span class="sp-overlay__title">Checking your classes…</span>
          <span class="sp-overlay__hint">This usually takes a minute or two. Please keep this page open.</span>
        </div>
      </div>`, "The Explore Degrees wizard's roadmap build, which takes a minute or two.", true)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/spinner.html"), html);
console.log("wrote docs/spinner.html");
