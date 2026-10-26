// Regenerates docs/status-icon.html from tokens/components/status-icon.tokens.json.
// done / todo / error as one 20px mark. The recipe lives in
// tools/lib/status-icon.mjs, shared with Accordion's stories and Explore Degrees.
// Run: node tools/build-status-icon-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { STATUS_ICON_CSS, STATUS_ICON_COLOR_PATHS, statusIcon } from "./lib/status-icon.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, size: typo.size, weight: typo.weight, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

const rootVars = renderRootVars([...[...STATUS_ICON_COLOR_PATHS, "text.default", "text.secondary"].map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${STATUS_ICON_CSS}`;
const demoCss = `
.si-row { display: flex; align-items: center; gap: 8px; font-family: ${cv("family.sans")}; color: ${cv("text.default")}; ${typoCss(resolve("text-style.body-base"))} padding: 6px 0; }
.si-row small { color: ${cv("text.secondary")}; ${typoCss(resolve("text-style.body-sm"))} margin-left: auto; }
.si-trio { display: flex; gap: 32px; align-items: center; }`;

const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><p class="story-note">${note}</p></div>`;
const row = (k, text, meta) => `<div class="si-row">${statusIcon(k)}<span>${text}</span><small>${meta}</small></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — StatusIcon</title>
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
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
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
  <nav class="side">${renderNav("status-icon")}</nav>
  <main>
    <h1>StatusIcon</h1>
    <p class="sub">tokens/components/status-icon.tokens.json · generated — one 20px mark for done, still to do, or a problem. Content you put into another component's slot: the leading slot of an <a href="accordion.html">Accordion</a> row, a checklist line, a table cell.</p>

    <div class="legend">
      <div class="row"><b>done</b><span><code class="tok">check</code> in <code class="tok">status.success</code> — covered, complete, passed.</span></div>
      <div class="row"><b>todo</b><span><code class="tok">radio_button_unchecked</code> in <code class="tok">icon.muted</code> — outstanding, not a problem.</span></div>
      <div class="row"><b>error</b><span><code class="tok">error</code> in <code class="tok">status.danger</code> — something here needs fixing.</span></div>
      <div class="row"><b>Size</b><span>20px only — the same box as Accordion's chevron and every icon in a 40px row.</span></div>
      <div class="row"><b>A11y</b><span>Colour and shape carry the state, so say it in text too: visible text beside it (“Covered”), or <code class="tok">label</code> → <code class="tok">role="img"</code> + <code class="tok">aria-label</code>. Without a label it is <code class="tok">aria-hidden</code>.</span></div>
      <div class="row"><b>Why separate</b><span>It used to be Accordion's “status”. The state belongs to the content, not to the row that discloses it — the same mark is wanted in lists, tables and steps, and an Accordion with a Status axis implied a <code class="tok">status</code> prop no Accordion has.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">
      ${story("All three", `<div class="si-trio">${statusIcon("done", { label: "Done" })}${statusIcon("todo", { label: "To do" })}${statusIcon("error", { label: "Error" })}</div>`, "Standalone, so each carries an aria-label.")}
      ${story("In a list", row("done", "Social Science Courses", "Covered") + row("todo", "Physical Science", "Still to do") + row("error", "Unnamed restriction line", "Needs a name"), "Visible text says the state, so the icons are aria-hidden.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(statusIcon("done", { label: "Done" }).replace(/<path[^>]*>/, "…"))}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/status-icon.html"), html);
console.log("wrote docs/status-icon.html");
