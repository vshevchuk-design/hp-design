// Regenerates docs/progress.html from tokens/components/progress.tokens.json.
// Linear progress bar — determinate (a width + the ARIA value) and
// indeterminate (a travelling sliver). NOT the wizard step indicator: that's
// Stepper's job and always was.
// Run: node tools/build-progress-doc.mjs
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
const pg = load("tokens/components/progress.tokens.json").component.progress;
const badge = load("tokens/components/badge.tokens.json").component.badge;

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

const trackRole = refPath(pg.track.$value);
const indicatorRole = refPath(pg.indicator.$value);
const labelRole = refPath(pg.labelColor.$value);
// the results-header composition prints Badge primary-tint pills next to the bar
const badgePill = { bg: refPath(badge.role.primary.tint.bg.$value), text: refPath(badge.role.primary.tint.text.$value) };
const badgeSm = {
  height: px(resolve(badge.size.sm.height.$value)),
  paddingX: px(resolve(badge.size.sm.paddingX.$value)),
  radius: px(resolve(badge.radius.$value)),
  label: resolveToken(badge.size.sm.label),
};

const colorPaths = [...new Set([trackRole, indicatorRole, labelRole, badgePill.bg, badgePill.text, "surface.default", "border.default", "text.default"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const radius = px(resolve(pg.radius.$value));
const labelType = resolveToken(pg.label);
const sliver = px(pg.indeterminate.sliverWidth.$value);
const duration = pg.indeterminate.duration.$value;
const SIZES = ["sm", "base"];

const css = `${rootVars}

.progress { display: block; width: 100%; overflow: hidden; border-radius: ${radius}; background: ${cv(trackRole)}; }
.progress__bar { display: block; height: 100%; border-radius: ${radius}; background: ${cv(indicatorRole)}; }
${SIZES.map((s) => `.progress--${s} { height: ${px(resolve(pg.sizes[s].height.$value))}; }`).join("\n")}
/* Indeterminate: a sliver that crosses the track. No aria-valuenow — the whole
   point is that the amount is unknown. Like Spinner, this keeps animating under
   prefers-reduced-motion: it is the only signal that work is still happening. */
.progress--indeterminate .progress__bar { width: ${sliver}; animation: progress-slide ${duration} ease-in-out infinite; }
@keyframes progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(calc(100% / ${parseFloat(sliver) / 100} )); } }
.progress__label { display: block; margin-bottom: ${px(resolve("dim.1_5"))}; color: ${cv(labelRole)}; ${typoCss(labelType)} font-family: ${cv("family.sans")}; }`;

const demoCss = `
.pg-stack { display: flex; flex-direction: column; gap: 18px; }
.pg-head { border: 1px solid ${cv("border.default")}; border-radius: 8px; background: ${cv("surface.default")}; padding: 16px; display: flex; flex-direction: column; gap: 12px; font-family: ${cv("family.sans")}; }
.pg-head__title { color: ${cv("text.default")}; ${typoCss(resolveToken(get("text-style.heading-base")))} }
.pg-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.badge { display: inline-flex; align-items: center; border-radius: ${badgeSm.radius}; height: ${badgeSm.height}; padding: 0 ${badgeSm.paddingX}; ${typoCss(badgeSm.label)} background: ${cv(badgePill.bg)}; color: ${cv(badgePill.text)}; font-family: ${cv("family.sans")}; }`;

const bar = (size, value, { indeterminate = false, label = "" } = {}) => {
  const aria = indeterminate
    ? ` role="progressbar" aria-label="Working"`
    : ` role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"`;
  return `${label ? `<span class="progress__label">${esc(label)}</span>` : ""}<span class="progress progress--${size}${indeterminate ? " progress--indeterminate" : ""}"${aria}><span class="progress__bar"${indeterminate ? "" : ` style="width:${value}%"`}></span></span>`;
};

const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Progress</title>
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
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("progress")}</nav>
  <main>
    <h1>Progress</h1>
    <p class="sub">tokens/components/progress.tokens.json · generated — a linear filled track, determinate or indeterminate. Two heights, fully rounded ends, <code class="tok">bg.neutral</code> track and a <code class="tok">fill.primary</code> indicator.</p>

    <div class="legend">
      <div class="row"><b>Not a stepper</b><span>A wizard's step indicator is <a class="navlink" style="display:inline;padding:0;background:none;color:var(--accent)" href="stepper.html">Stepper</a>'s job — numbered circles with a filling connector. A first pass scoped a <code class="tok">segmented</code> variant here and it was correctly rejected: two components for one job is how drift starts.</span></div>
      <div class="row"><b>Determinate</b><span>The consumer sets the indicator's width and the matching <code class="tok">aria-valuenow</code>. The bar never contains text — a caption goes above it.</span></div>
      <div class="row"><b>Indeterminate</b><span>A 40% sliver crosses the track, and there is no <code class="tok">aria-valuenow</code> — the point is that the amount is unknown. Like Spinner, it keeps animating under <code class="tok">prefers-reduced-motion</code>: it's the only signal that work is still happening.</span></div>
      <div class="row"><b>Colour</b><span>Indicator is <code class="tok">fill.primary</code>, never <code class="tok">status.success</code> — a progress bar reports <i>amount</i>, not outcome. A role axis is deferred until something needs a red or green bar.</span></div>
    </div>

    <h2 class="big-section">Determinate</h2>
    <div class="story-grid">
      ${storyCard("Values", `<div class="pg-stack">${bar("base", 8)}${bar("base", 30)}${bar("base", 65)}${bar("base", 100)}</div>`, "8% · 30% · 65% · 100% — the rounded ends keep a nearly-empty bar legible.")}
      ${storyCard("Heights", `<div class="pg-stack">${bar("sm", 45)}${bar("base", 45)}</div>`, "sm 4px sits under other content · base 8px is the default.")}
      ${storyCard("With a caption", bar("base", 30, { label: "6 of 20 requirement areas" }), "The label is a token on the component, but the text lives outside the bar.")}
    </div>

    <h2 class="big-section">Indeterminate</h2>
    <div class="story-grid">
      ${storyCard("Working", bar("sm", 0, { indeterminate: true }), "Under 'Checking your classes…' — work of unknown length. Pair it with a Spinner and copy that sets expectations.")}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">The Explore Degrees results header: a headline, Badge primary-tint pills for the numbers, and the bar carrying the same ratio visually.</p>
    <div class="story-grid">
      ${storyCard("Results header", `<div class="pg-head">
        <span class="pg-head__title">Your credits already cover 6 of 20 requirement areas</span>
        <div class="pg-pills"><span class="badge">Start 2027 Spring</span><span class="badge">20 requirement areas</span><span class="badge">6 already covered</span><span class="badge">9 classes applied</span></div>
        ${bar("base", 30)}
      </div>`, "", true)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/progress.html"), html);
console.log("wrote docs/progress.html");
