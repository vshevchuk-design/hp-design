// Regenerates docs/slider.html from tokens/components/slider.tokens.json.
// Every preview is the real Slider from tools/lib/slider.mjs — native range
// inputs, so drag, click, keyboard and screen readers work.
// Run: node tools/build-slider-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { SLIDER_COLOR_PATHS, SLIDER_CSS, SLIDER_JS, sliderHtml } from "./lib/slider.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rootVars = renderRootVars([...SLIDER_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${SLIDER_CSS}`;

const story = (title, opts, note = "") => {
  const live = sliderHtml(opts);
  return `<div class="story"><h3>${title}</h3><div class="story-preview"><div class="sl-demo">${live}</div></div><pre class="code"><code>${esc(live)}</code></pre>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
};
const stories = [
  story("Default", { id: "sl-hours", label: "Study hours per week", min: 0, max: 40, value: 12, suffix: " h", marks: true }, "The value always shows beside the label; the ends under the track."),
  story("Steps — a short integer scale", { id: "sl-sessions", label: "Sessions per week", min: 1, max: 5, value: 3, marks: "steps" }, "Storybook's Integer. Every step labelled — for scales of up to ~11 steps."),
  story("Range — two thumbs", { id: "sl-credits", label: "Credits", min: 0, max: 20, value: [3, 12], marks: true }, "Two real inputs over one track. The thumbs can't cross; whichever you moved last stays on top."),
  story("Decimal", { id: "sl-gpa", label: "Minimum GPA", min: 0, max: 4, step: 0.1, value: 3, decimals: 1, marks: true }),
  story("Disabled", { id: "sl-dis", label: "Study hours per week", min: 0, max: 40, value: 12, suffix: " h", disabled: true, marks: true }, "Gray track and thumb, no hover, skipped by Tab."),
];
const eventScript = `document.addEventListener("sliderchange", (e) => console.log(e.detail.value));`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Slider</title>
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
  .sl-demo { width: 100%; max-width: 360px; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("slider")}</nav>
  <main>
    <h1>Slider</h1>
    <p class="sub">tokens/components/slider.tokens.json · generated — a number, or a range, on a scale. Every preview is the real one from <code class="tok">tools/lib/slider.mjs</code>: drag, click the track, or use the keyboard.</p>

    <div class="legend">
      <div class="row"><b>Native</b><span>Each thumb is a real <code class="tok">&lt;input type="range"&gt;</code>: ← → ↑ ↓ step, PageUp / PageDown jump, Home / End go to the ends; screen readers hear the value (<code class="tok">aria-valuetext</code>, with its unit); it submits with a form.</span></div>
      <div class="row"><b>Look</b><span>4px track in gray.200, the chosen part in fill.primary (our blue, not Storybook's navy); a 20px white thumb with Radio's 2px blue ring and a small shadow. Hover / drag: a 4px soft halo. Keyboard focus: the focus ring.</span></div>
      <div class="row"><b>Value shown</b><span>Always, at the end of the label row, with its unit, tabular figures so it doesn't jitter while dragging. A slider with no number makes people guess.</span></div>
      <div class="row"><b>Marks</b><span>Optional: the two ends, or every step of a short integer scale (≤ ~11).</span></div>
      <div class="row"><b>Range</b><span>Two thumbs on one track for "between" — credits 3–12, a price range. The thumbs can't cross.</span></div>
      <div class="row"><b>When not</b><span>If the exact number matters more than the position on the scale, use a number field — typing 12 is faster than dragging to it.</span></div>
      <div class="row"><b>In code</b><span>Storybook's "Controlled" is just listening: every move fires a bubbling <code class="tok">sliderchange</code> event with <code class="tok">detail.value</code> (a number, or [lo, hi]).</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">${stories.join("")}</div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Script</h2>
    <pre class="code"><code>${esc(SLIDER_JS)}\n\n// listening\n${esc(eventScript)}</code></pre>
  </main>
</div>
<script>
${SLIDER_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/slider.html"), html);
console.log("wrote docs/slider.html");
