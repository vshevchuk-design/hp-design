// Regenerates docs/stat.html from tokens/components/stat.tokens.json.
// A metric tile — a big number over a muted label, in a Card-style bordered
// surface; optional role tint on the value. Driving use: group-message
// delivery stats (Delivered/Seen/Replied), reused by analytics later.
// Run: node tools/build-stat-doc.mjs
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
const stat = load("tokens/components/stat.tokens.json").component.stat;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const roles = ["success", "primary", "warning", "danger"];
const colorPaths = ["surface.default", "border.default", "text.default", "text.muted", ...roles.map((r) => `text.${r}`)];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const radius = px(resolve(stat.radius.$value));
const pad = px(resolve(stat.padding.$value));
const gap = px(resolve(stat.gap.$value));
const valueType = resolveToken(get(stat.value.$value));
const labelType = resolveToken(get(stat.label.$value));

const css = `${rootVars}

.stat { box-sizing: border-box; display: flex; flex-direction: column; gap: ${gap}; padding: ${pad}; background: ${cv(refPath(stat.surface.$value))}; border: 1px solid ${cv(refPath(stat.border.$value))}; border-radius: ${radius}; font-family: ${cv("family.sans")}; }
.stat__value { color: ${cv(refPath(stat.valueColor.$value))}; ${typoCss(valueType)} }
.stat__label { color: ${cv(refPath(stat.labelColor.$value))}; ${typoCss(labelType)} }
${roles.map((r) => `.stat--${r} .stat__value { color: ${cv(refPath(stat.role[r].$value))}; }`).join("\n")}`;

function stat1(value, label, role) { return `<div class="stat${role ? ` stat--${role}` : ""}"><span class="stat__value">${value}</span><span class="stat__label">${label}</span></div>`; }
function storyCard(title, live, note = "") { return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`; }

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Stat</title>
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
  .legend .row b { width: 90px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("stat")}</nav>
  <main>
    <h1>Stat</h1>
    <p class="sub">tokens/components/stat.tokens.json · generated — a metric tile: one big number over a quiet label, in a Card-style bordered surface. Optional role tint on the value.</p>

    <div class="legend">
      <div class="row"><b>Surface</b><span>Card's own recipe — <code class="tok">surface.default</code> + a 1px <code class="tok">border.default</code> + <code class="tok">radius.default</code>, no shadow. A row of stats reads as a set of small cards.</span></div>
      <div class="row"><b>Value</b><span><code class="tok">text-style.title-2xl</code> (24px bold) — the number is the point. An optional <code class="tok">role</code> tints just the value (success/primary/warning/danger, the same 600-step inks a Badge uses).</span></div>
      <div class="row"><b>Label</b><span>Stays <code class="tok">text.muted</code> regardless of role — it names the metric, it doesn't compete with the number.</span></div>
    </div>

    <h2 class="big-section">Delivery summary</h2>
    <p class="section-desc">The group-message stats row — Replied tinted success.</p>
    <div class="story-grid">
      ${storyCard("Delivered / Seen / Replied", `<div class="stat-row">${stat1(37, "Delivered")}${stat1(24, "Seen")}${stat1(6, "Replied", "success")}</div>`)}
    </div>

    <h2 class="big-section">Role tints</h2>
    <div class="story-grid">
      ${storyCard("Default", stat1(128, "Total threads"))}
      ${storyCard("success / primary", `<div style="display:flex;gap:12px">${stat1("92%", "Resolved", "success")}${stat1(14, "Awaiting", "primary")}</div>`)}
      ${storyCard("warning / danger", `<div style="display:flex;gap:12px">${stat1(7, "Due soon", "warning")}${stat1(3, "Expired", "danger")}</div>`)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/stat.html"), html);
console.log("wrote docs/stat.html");
