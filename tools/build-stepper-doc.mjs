// Regenerates docs/stepper.html from tokens/components/stepper.tokens.json.
// Horizontal step indicator (numbered circles + connectors), each step
// inactive / active / complete. Built for short 2–3 step wizards.
// Run: node tools/build-stepper-doc.mjs
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
const st = load("tokens/components/stepper.tokens.json").component.stepper;

const registry = {
  color: colorPrim, dim, radius: radiusPrim,
  family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking,
  "text-style": textStyle, ...semantic,
};
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; }
  if (v && typeof v === "object" && "value" in v) return v;
  return resolveValue(v);
}
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const colorPaths = [
  "surface.sunken", "text.muted", "fill.primary", "text.onFill", "text.default", "icon.onFill", "border.default",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const circleSize = px(resolve(st.circle.size.$value));
const circleLabel = resolveToken(st.circle.label);
const circleIcon = px(resolve(st.circle.iconSize.$value));
const gap = px(resolve(st.gap.$value));
const conn = px(resolve(st.connector.thickness.$value));
const textType = resolveToken(get(st.text.$value));
const iconCheck = fs.readFileSync(path.join(root, "assets/icons/material-filled/check.svg"), "utf8").replace("<svg ", '<svg class="stepper__check" ');

const css = `${rootVars}

.stepper { display: flex; align-items: center; font-family: ${cv("family.sans")}; }
.stepper__step { display: inline-flex; align-items: center; gap: ${gap}; flex-shrink: 0; }
.stepper__circle { box-sizing: border-box; flex-shrink: 0; width: ${circleSize}; height: ${circleSize}; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; ${typoCss(circleLabel)} }
.stepper__num { display: block; }
.stepper__check { width: ${circleIcon}; height: ${circleIcon}; display: none; }
.stepper__label { ${typoCss(textType)} white-space: nowrap; }
.stepper__connector { flex: 1; min-width: 24px; height: ${conn}; background: ${cv(refPath(st.connector.color.$value))}; margin: 0 ${gap}; }
/* inactive */
.stepper__step--inactive .stepper__circle { background: ${cv(refPath(st.state.inactive.circleBg.$value))}; color: ${cv(refPath(st.state.inactive.circleText.$value))}; }
.stepper__step--inactive .stepper__label { color: ${cv(refPath(st.state.inactive.labelColor.$value))}; }
/* active */
.stepper__step--active .stepper__circle { background: ${cv(refPath(st.state.active.circleBg.$value))}; color: ${cv(refPath(st.state.active.circleText.$value))}; }
.stepper__step--active .stepper__label { color: ${cv(refPath(st.state.active.labelColor.$value))}; }
/* complete */
.stepper__step--complete .stepper__circle { background: ${cv(refPath(st.state.complete.circleBg.$value))}; color: ${cv(refPath(st.state.complete.circleIcon.$value))}; }
.stepper__step--complete .stepper__label { color: ${cv(refPath(st.state.complete.labelColor.$value))}; }
.stepper__step--complete .stepper__num { display: none; }
.stepper__step--complete .stepper__check { display: block; }
/* a connector leading into a reached (active/complete) step fills brand blue */
.stepper__connector--filled { background: ${cv(refPath(st.connector.completeColor.$value))}; }`;

function step(state, num, label) {
  return `<div class="stepper__step stepper__step--${state}">
        <span class="stepper__circle"><span class="stepper__num">${num}</span>${iconCheck}</span>
        <span class="stepper__label">${label}</span>
      </div>`;
}
function stepper(steps) {
  const parts = [];
  steps.forEach((s, i) => {
    if (i > 0) parts.push(`<div class="stepper__connector${steps[i].state !== "inactive" ? " stepper__connector--filled" : ""}"></div>`);
    parts.push(step(s.state, s.num, s.label));
  });
  return `<div class="stepper" role="list">\n      ${parts.join("\n      ")}\n    </div>`;
}
function storyCard(title, live, note = "") {
  return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Stepper</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa; --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87; --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; --sans: -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: light;
  }
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
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
  .legend .row b { width: 120px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; max-width: 460px; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("stepper")}</nav>
  <main>
    <h1>Stepper</h1>
    <p class="sub">tokens/components/stepper.tokens.json · generated — a horizontal step indicator for short 2–3 step wizards (the New Group Message flow). Numbered circles joined by connectors; each step inactive / active / complete.</p>

    <div class="legend">
      <div class="row"><b>States</b><span><code class="tok">inactive</code> = gray disc + muted ink · <code class="tok">active</code> = <code class="tok">fill.primary</code> disc + on-fill number · <code class="tok">complete</code> = same brand fill but the number becomes a check (check.svg). Complete stays the same fill as active — it's "done and reachable", the glyph is the only difference.</span></div>
      <div class="row"><b>Connector</b><span>A 2px line between steps; the connector leading INTO a reached (active/complete) step fills <code class="tok">fill.primary</code>, so progress reads left-to-right.</span></div>
      <div class="row"><b>Scope</b><span>Horizontal only, no per-step descriptions — built for 2–3 step wizards, not page-length onboarding.</span></div>
    </div>

    <h2 class="big-section">Wizard progress</h2>
    <p class="section-desc">The New Group Message wizard at each step.</p>
    <div class="story-grid">
      ${storyCard("Step 1 of 2 — Select Students", stepper([{ state: "active", num: 1, label: "Select Students" }, { state: "inactive", num: 2, label: "Message Details" }]), "First step active, second not yet reached (gray connector).")}
      ${storyCard("Step 2 of 2 — Message Details", stepper([{ state: "complete", num: 1, label: "Select Students" }, { state: "active", num: 2, label: "Message Details" }]), "Step 1 complete (check + filled connector), step 2 active.")}
      ${storyCard("Three steps, mid-flow", stepper([{ state: "complete", num: 1, label: "Audience" }, { state: "active", num: 2, label: "Compose" }, { state: "inactive", num: 3, label: "Review" }]), "Scales to a third step.")}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/stepper.html"), html);
console.log("wrote docs/stepper.html");
