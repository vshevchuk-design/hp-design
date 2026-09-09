// Regenerates docs/table.html from tokens/components/table.tokens.json,
// resolving aliases back through semantic + primitives. Table is a container
// (surface + hairline border + radius) wrapping a header row and body rows;
// columns are laid out by the consumer via grid-template-columns (structural,
// per-use, same reasoning as Grid). Rows carry hover/selected + an unread/read
// weight pair reused from ThreadListItem's inbox rows.
// The generated <style> IS the code shown in the CSS section — one source.
// Run: node tools/build-table-doc.mjs
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
const table = load("tokens/components/table.tokens.json").component.table;

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
  "surface.default", "surface.dim", "border.default", "border.focus",
  "text.default", "text.secondary", "text.muted", "icon.muted", "icon.default",
  "bg.primary", "fill.neutralActive",
  // demo-only (avatar circles / badges)
  "avatar.blue.bg", "avatar.blue.text", "avatar.teal.bg", "avatar.teal.text", "avatar.amber.bg", "avatar.amber.text",
  "bg.warning", "text.warning", "bg.danger", "text.danger", "text.primary",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(table.radius.$value));
const hPadX = px(resolve(table.header.paddingX.$value));
const hPadY = px(resolve(table.header.paddingY.$value));
const headerLabelNode = get(table.header.label.$value);
const headerLabel = resolveToken(headerLabelNode);
const headerLabelExt = headerLabelNode.$extensions?.["hp.design/text"] || {};
const rPadX = px(resolve(table.row.paddingX.$value));
const rPadY = px(resolve(table.row.paddingY.$value));
const rowGap = px(resolve(table.row.gap.$value));
const sortSize = px(resolve(table.header.sortIcon.size.$value));
const cellText = resolveToken(table.cell.text);
const unread = { weight: resolve(table.state.unread.weight.$value), color: refPath(table.state.unread.color.$value) };
const read = { weight: resolve(table.state.read.weight.$value), color: refPath(table.state.read.color.$value) };

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconSort = iconOf("expand_more", "table__sort-icon");
const iconFlag = iconOf("flag", "table__demo-flag");

const css = `${rootVars}

.table { box-sizing: border-box; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; border-radius: ${radius}; overflow: hidden; font-family: ${cv("family.sans")}; }
.table__row { display: grid; align-items: center; gap: ${rowGap}; padding: ${rPadY} ${rPadX}; border-bottom: 1px solid ${cv(refPath(table.row.divider.$value))}; }
.table__row:last-child { border-bottom: none; }
.table__row--head { padding: ${hPadY} ${hPadX}; border-bottom: 1px solid ${cv(refPath(table.header.divider.$value))}; background: ${cv("surface.default")}; }
.table__th { color: ${cv(refPath(table.header.labelColor.$value))}; ${typoCss(headerLabel)}${headerLabelExt.textTransform ? ` text-transform: ${headerLabelExt.textTransform};` : ""}${headerLabelExt.letterSpacing ? ` letter-spacing: ${headerLabelExt.letterSpacing};` : ""} white-space: nowrap; min-width: 0; }
.table__td { color: ${cv(refPath(table.cell.textColor.$value))}; ${typoCss(cellText)} min-width: 0; }
.table__td--muted { color: ${cv(refPath(table.cell.mutedColor.$value))}; }
/* interactive body rows */
.table__row:not(.table__row--head) { cursor: pointer; }
.table__row:not(.table__row--head):hover { background: ${cv(refPath(table.row.hoverBg.$value))}; }
.table__row:not(.table__row--head):active { background: ${cv(refPath(table.row.activeBg.$value))}; }
.table__row--selected, .table__row--selected:hover { background: ${cv(refPath(table.row.selectedBg.$value))}; }
.table__row:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: -2px; }
/* sortable header cell */
.table__sort { display: inline-flex; align-items: center; gap: 2px; border: none; background: none; padding: 0; cursor: pointer; color: inherit; font: inherit; text-transform: inherit; letter-spacing: inherit; }
.table__sort-icon { width: ${sortSize}; height: ${sortSize}; color: ${cv(refPath(table.header.sortIcon.color.$value))}; }
.table__sort--active .table__sort-icon { color: ${cv(refPath(table.header.sortIcon.activeColor.$value))}; }
.table__sort--asc .table__sort-icon { transform: rotate(180deg); }
/* inbox-style unread/read lead-text emphasis (reused from ThreadListItem) */
.table__lead { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table__row--unread .table__lead { font-weight: ${unread.weight}; color: ${cv(unread.color)}; }
.table__row--read .table__lead { font-weight: ${read.weight}; color: ${cv(read.color)}; }`;

// ---- doc-only demo styles (a realistic threads-console table) ----
const demoCss = `
.tbl-demo { grid-template-columns: 1.4fr 2fr 1fr 0.7fr 28px; }
.tbl-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tbl-avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.tbl-av-blue { background: ${cv("avatar.blue.bg")}; color: ${cv("avatar.blue.text")}; }
.tbl-av-teal { background: ${cv("avatar.teal.bg")}; color: ${cv("avatar.teal.text")}; }
.tbl-av-amber { background: ${cv("avatar.amber.bg")}; color: ${cv("avatar.amber.text")}; }
.tbl-id { color: ${cv("text.muted")}; font-size: 12px; }
.tbl-stack { min-width: 0; display: flex; flex-direction: column; }
.tbl-badge { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.tbl-badge--warn { background: ${cv("bg.warning")}; color: ${cv("text.warning")}; }
.tbl-badge--danger { background: ${cv("bg.danger")}; color: ${cv("text.danger")}; }
.tbl-date { color: ${cv("text.muted")}; font-size: 13px; }
.tbl-date--unread { color: ${cv("text.primary")}; font-weight: 600; }
.table__demo-flag { width: 18px; height: 18px; color: ${cv("icon.muted")}; }`;

const js = `document.querySelectorAll(".table__row:not(.table__row--head)").forEach((row) => {
  row.addEventListener("click", () => {
    row.closest(".table").querySelectorAll(".table__row--selected").forEach((r) => r.classList.remove("table__row--selected"));
    row.classList.add("table__row--selected");
    row.classList.remove("table__row--unread"); row.classList.add("table__row--read");
  });
});
document.querySelectorAll(".table__sort").forEach((btn) => {
  btn.addEventListener("click", () => {
    var wasAsc = btn.classList.contains("table__sort--asc");
    btn.closest(".table__row--head").querySelectorAll(".table__sort").forEach((b) => b.classList.remove("table__sort--active", "table__sort--asc"));
    btn.classList.add("table__sort--active"); if (!wasAsc) btn.classList.add("table__sort--asc");
  });
});`;

function avatar(cls, initials) { return `<span class="tbl-avatar ${cls}">${initials}</span>`; }
function demoRow({ state, av, name, id, subject, preview, responsible, expires, date, flagged, selected }) {
  const cls = ["table__row", "tbl-demo", `table__row--${state}`, selected ? "table__row--selected" : ""].filter(Boolean).join(" ");
  const exp = expires ? `<span class="tbl-badge tbl-badge--${expires.role}">${expires.label}</span>` : `<span class="table__td--muted">–</span>`;
  return `<div class="${cls}" role="row" tabindex="0">
        <div class="table__td tbl-cell" role="cell">${avatar(av, name.split(" ").map((w) => w[0]).join("").slice(0, 2))}<span class="tbl-stack"><span class="table__lead">${name}</span><span class="tbl-id">${id}</span></span></div>
        <div class="table__td tbl-cell" role="cell"><span class="tbl-stack"><span class="table__lead">${subject}</span><span class="table__td--muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${preview}</span></span></div>
        <div class="table__td table__td--muted" role="cell">${responsible}</div>
        <div class="table__td" role="cell">${exp}</div>
        <div class="table__td ${state === "unread" ? "tbl-date--unread" : "tbl-date"}" role="cell" style="text-align:right">${date}</div>
        <div class="table__td" role="cell">${flagged ? iconFlag.replace('table__demo-flag"', 'table__demo-flag" style="color:var(--tok-icon-default)"') : iconFlag}</div>
      </div>`;
}
const th = (label, sortable, active, asc) => sortable
  ? `<div class="table__th" role="columnheader"><button type="button" class="table__sort${active ? " table__sort--active" : ""}${asc ? " table__sort--asc" : ""}">${label}${iconSort}</button></div>`
  : `<div class="table__th" role="columnheader">${label}</div>`;

const demoTable = `<div class="table" role="table">
      <div class="table__row table__row--head tbl-demo" role="row">
        ${th("Student", true, false, false)}
        ${th("Subject &amp; Message", false)}
        ${th("Responsible", false)}
        ${th("Expiration", false)}
        ${th("Date", true, true, false)}
        <div class="table__th" role="columnheader"></div>
      </div>
      ${demoRow({ state: "unread", av: "tbl-av-blue", name: "Cait Adelson", id: "CX0001", subject: "Question about fall registration", preview: "Hi, I wanted to check whether there is a hold…", responsible: "–", expires: null, date: "3:56 PM", flagged: false })}
      ${demoRow({ state: "unread", av: "tbl-av-teal", name: "Allison Rao", id: "AA0367", subject: "Satisfactory Academic Progress Plan", preview: "Okay I will contact my advisor soon. Thank you.", responsible: "Sarah Nguyen", expires: null, date: "11:20 AM", flagged: true })}
      ${demoRow({ state: "read", av: "tbl-av-amber", name: "Calam Xavier", id: "CX0002", subject: "Course withdrawal deadline", preview: "Hey Alex, I did alright on my quiz but I would…", responsible: "You, Sarah +2", expires: { role: "warn", label: "Expires Jul 20" }, date: "Jul 10", flagged: false })}
      ${demoRow({ state: "read", av: "tbl-av-blue", name: "L Arcos", id: "AA0007", subject: "Advisement Outreach", preview: "Thank you for the details about the outreach…", responsible: "–", expires: { role: "danger", label: "Expired Jul 10" }, date: "Jul 8", flagged: false, selected: true })}
    </div>`;

function storyCard(title, liveHtml, codeHtml, note = "", full = false) {
  return `
      <div class="story${full ? " story--full" : ""}">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        ${codeHtml ? `<pre class="code"><code>${esc(codeHtml)}</code></pre>` : ""}
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

const rowCode = `<div class="table" role="table">
  <div class="table__row table__row--head" style="grid-template-columns: …">
    <div class="table__th"><button class="table__sort">Student<svg class="table__sort-icon"><!-- expand_more --></svg></button></div>
    <div class="table__th">Subject &amp; Message</div> …
  </div>
  <div class="table__row table__row--unread" role="row" tabindex="0">
    <div class="table__td"><span class="table__lead">Cait Adelson</span></div> …
  </div>
  <div class="table__row table__row--read table__row--selected" role="row" tabindex="0"> … </div>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Table</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, "Segoe UI", system-ui, sans-serif;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
      --border: #313035; --border-strong: #403f45;
      --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
      --accent: #5aa4ec; --accent-bg: #16283b;
      --code-bg: #0d0d0f; --code-text: #d7d6d2;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }

  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); }
  .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 140px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }

  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; }
  pre.code code { font-family: inherit; }

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 4px 0; overflow-x: auto; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("table")}
  </nav>
  <main>
    <h1>Table</h1>
    <p class="sub">tokens/components/table.tokens.json · generated — the CSS below is generated from the same resolved tokens driving the preview. A div-based grid table so columns, rounded corners, sticky headers and whole-row click all behave; every body row below is a real, clickable element.</p>

    <div class="legend">
      <div class="row"><b>Container</b><span>surface.default + a 1px <code class="tok">border.default</code> hairline + <code class="tok">radius.default</code>, overflow hidden — the same "separate with a border, not a shadow" convention as Card. No fixed column model; the consumer sets <code class="tok">grid-template-columns</code> per use (structural, like Grid).</span></div>
      <div class="row"><b>Header</b><span>Column labels use <code class="tok">text-style.label-sm</code> (uppercase, wide-tracked small caps) in <code class="tok">text.muted</code>, with a bottom divider. A sortable header is a real button with a chevron that rotates for asc/desc.</span></div>
      <div class="row"><b>Row states</b><span>Interactive rows: hover = <code class="tok">surface.dim</code> (soft, full-width-friendly, not the ghost fill), selected = <code class="tok">bg.primary</code> tint, focus = inset ring. Rows divide with a hairline; the last drops it.</span></div>
      <div class="row"><b>Unread / read</b><span>The inbox emphasis pair reused verbatim from ThreadListItem: <code class="tok">--unread</code> lead text is semibold default ink, <code class="tok">--read</code> relaxes to normal-weight secondary. A weight/color swap only — background is owned by hover/selected.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Threads console</h2>
    <p class="section-desc">A realistic composition — the Staff Message Center list. Click a row (selects + marks read); click a sortable header (Student / Date) to toggle the sort chevron. Avatars/badges here are lightweight demo stand-ins; the real console composes the actual Avatar and Badge components.</p>
    <div class="story-grid">
      ${storyCard("Interactive table", demoTable, "", "Two unread rows (semibold) + two read rows; L Arcos is pre-selected.", true)}
    </div>

    <h2 class="big-section">Markup</h2>
    <p class="section-desc">The shape — a <code class="tok">.table</code> container of <code class="tok">.table__row</code>s (one <code class="tok">--head</code>), each a grid of <code class="tok">.table__td</code>/<code class="tok">.table__th</code> cells. Columns are set per-use.</p>
    <pre class="code"><code>${esc(rowCode)}</code></pre>

    <h2 class="big-section">JS</h2>
    <p class="section-desc">Row select + mark-read and header sort-toggle — the only script the demo needs; the CSS above keys off the classes it flips.</p>
    <pre class="code"><code>${esc(js)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/table.html"), html);
console.log("wrote docs/table.html");
