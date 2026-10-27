// Regenerates docs/multi-select-badges.html from tokens/components/multi-select-badges.tokens.json.
// Every preview is the real block from tools/lib/multi-select-badges.mjs — remove
// a chip, Clear all, Show all — and one story wires it to a CheckboxGroup the way
// a filter panel would.
// Run: node tools/build-multi-select-badges-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { MSB_COLOR_PATHS, MSB_CSS, MSB_JS, msbHtml } from "./lib/multi-select-badges.mjs";
import { CHOICE_COLOR_PATHS, CHECKBOX_CSS, CHOICE_GROUP_CSS, CHOICE_JS, choiceGroupHtml } from "./lib/choice.mjs";
import { FIELD_COLOR_PATHS, FIELD_WRAPPER_CSS } from "./lib/field.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const paths = [...new Set([...MSB_COLOR_PATHS, ...CHOICE_COLOR_PATHS, ...FIELD_COLOR_PATHS])];
const rootVars = renderRootVars(paths.map((p) => [p, resolve(p)]).concat([["family.sans", `'${resolve("family.sans")}', sans-serif`]]));
const css = `${rootVars}
${MSB_CSS}`;
const demoCss = `${CHECKBOX_CSS}
${CHOICE_GROUP_CSS}
${FIELD_WRAPPER_CSS}`;

const DEPTS = ["Computer Science", "Mathematics", "English", "Physics", "Biology", "Chemistry", "History", "Economics", "Psychology", "Philosophy", "Music", "Sociology"].map((label) => ({ label, value: label.toLowerCase().replace(/ /g, "-") }));
const code = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, "…");
const story = (title, live, note = "", wide = false) =>
  `<div class="story${wide ? " story--wide" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div><pre class="code"><code>${esc(code(live))}</code></pre>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const stories = [
  story("Default", msbHtml({ id: "m-def", title: "Selected departments", items: DEPTS.slice(0, 3) }), "× takes one back; Clear all empties it (and the block goes). The names people know — not 'cs - Computer Science'.", true),
  story("Two rows, then Show all", `<div style="max-width: 520px">${msbHtml({ id: "m-many", title: "Selected departments", items: DEPTS })}</div>`, "Past two rows the rest hide and 'Show all 12' sits on the last row — the results stay in view. It toggles to 'Show less'. Resize the window: it re-fits.", true),
];

// a picker elsewhere on the page (here a CheckboxGroup; in a product, a SlideOverPanel of filters)
const picker = choiceGroupHtml({ type: "checkbox", name: "dept", legend: "Departments", items: DEPTS.slice(0, 6).map((d, i) => ({ ...d, checked: i < 3 })) });
const connected = `<div class="msb-demo">
  <div class="msb-demo__filters">${picker}</div>
  <div class="msb-demo__results">${msbHtml({ id: "m-live", title: "Selected departments", items: DEPTS.slice(0, 3) })}<p class="msb-demo__line" id="m-live-line"></p></div>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — MultiSelectBadges</title>
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
  .msb-demo { display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start; }
  .msb-demo__filters { width: 200px; }
  .msb-demo__results { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 16px; }
  .msb-demo__line { margin: 0; font-size: 13px; color: var(--text-secondary); }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("multi-select-badges")}</nav>
  <main>
    <h1>MultiSelectBadges</h1>
    <p class="sub">tokens/components/multi-select-badges.tokens.json · generated — a summary of what was chosen somewhere else, shown next to what it affects. Every preview is the real block from <code class="tok">tools/lib/multi-select-badges.mjs</code>.</p>

    <div class="legend">
      <div class="row"><b>What it is</b><span>Filters picked in a <a href="slide-over-panel.html">SlideOverPanel</a>, rows ticked in a long table, people added in a Dialog — once the picker closes, this keeps the choice in view over the results, and each one can be taken back without reopening it.</span></div>
      <div class="row"><b>Not a field</b><span>Nothing is picked here. A field that shows its own choices as chips is <a href="select.html#chips">Select <code class="tok">chips</code></a>.</span></div>
      <div class="row"><b>Anatomy</b><span>Title in the picker's words + the count ("Selected departments · 3", heading-sm, the count text.secondary) · one Chip removable <b>base</b> per choice (32px — a page-level target) · <b>Clear all</b> and, past two rows, <b>Show all N</b> — link-sm on the chips' last row, not off in a corner.</span></div>
      <div class="row"><b>Not copied</b><span>Storybook's grey slab, black chips, "cs - Computer Science" codes, Clear in the far corner, and a chevron that collapses the very thing the block is for.</span></div>
      <div class="row"><b>Empty</b><span>The block hides — a summary of nothing is noise. The picker is where to go next.</span></div>
      <div class="row"><b>In code</b><span><code class="tok">msbHtml({ id, title, items })</code>; events <code class="tok">badgeremove</code> (detail.value) and <code class="tok">badgesclear</code> so the picker can untick; <code class="tok">el._msb.set(items)</code> to show a new set.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">${stories.join("")}</div>

    <h2 class="big-section">With its picker</h2>
    <p class="section-desc">Tick and untick on the left — the summary follows; take a chip out or Clear all — the boxes untick. In a product the left side is usually a SlideOverPanel of filters, closed after Apply; the summary is what stays.</p>
    <div class="story story--wide"><div class="story-preview">${connected}</div></div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${CHOICE_JS}
${MSB_JS}
// the demo's wiring: picker → summary, summary → picker
(function () {
  var sum = document.getElementById("m-live"), boxes = Array.prototype.slice.call(document.querySelectorAll('input[name="dept"]')), line = document.getElementById("m-live-line");
  function picked() { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return { value: b.value, label: b.closest("label").textContent.trim() }; }); }
  function say() { var n = picked().length; line.textContent = n ? "Showing " + (n * 23) + " courses in " + n + (n === 1 ? " department" : " departments") : "Showing all 412 courses"; }
  boxes.forEach(function (b) { b.addEventListener("change", function () { sum._msb.set(picked()); say(); }); });
  sum.addEventListener("badgeremove", function (e) { boxes.forEach(function (b) { if (b.value === e.detail.value) b.checked = false; }); say(); });
  sum.addEventListener("badgesclear", function () { boxes.forEach(function (b) { b.checked = false; }); say(); });
  say();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/multi-select-badges.html"), html);
console.log("wrote docs/multi-select-badges.html");
