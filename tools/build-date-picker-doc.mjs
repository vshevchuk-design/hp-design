// Regenerates docs/date-picker.html from tokens/components/date-picker.tokens.json.
// A single-date picker: a Select-style trigger + a month-grid calendar popover
// (native Popover shell). One month at a time, prev/next, today + selected.
// The calendar grid is built at runtime in JS so month nav works and the demo
// stays deterministic (seeded to the selected date).
// Run: node tools/build-date-picker-doc.mjs
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
const shadowPrim = load("tokens/primitives/shadow.tokens.json").shadow;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const dp = load("tokens/components/date-picker.tokens.json").component.datePicker;

const registry = { color: colorPrim, dim, radius: radiusPrim, shadow: shadowPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const colorPaths = ["surface.dim", "surface.default", "border.default", "border.strong", "border.focus", "text.default", "text.muted", "text.disabled", "icon.default", "fill.neutralHover", "fill.primary", "text.onFill"];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const t = dp.trigger, panel = dp.panel, hd = dp.header, wd = dp.weekday, day = dp.day;
const tH = px(resolve(t.height.$value)), tPadX = px(resolve(t.paddingX.$value)), tGap = px(resolve(t.gap.$value)), tRadius = px(resolve(t.radius.$value));
const tValue = resolveToken(get(t.value.$value)), tIcon = px(resolve(t.iconSize.$value));
const pShadow = resolveToken(panel.shadow); const pShadowCss = `${px(pShadow.offsetX)} ${px(pShadow.offsetY)} ${px(pShadow.blur)} ${px(pShadow.spread)} ${pShadow.color}`;
const pRadius = px(resolve(panel.radius.$value)), pPad = px(resolve(panel.padding.$value));
const hdLabel = resolveToken(get(hd.label.$value)), navSize = px(resolve(hd.navSize.$value));
const wdLabelNode = get(wd.label.$value); const wdLabel = resolveToken(wdLabelNode); const wdExt = wdLabelNode.$extensions?.["hp.design/text"] || {};
const daySize = px(resolve(day.size.$value)), dayRadius = px(resolve(day.radius.$value)), dayLabel = resolveToken(get(day.label.$value));

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconCal = iconOf("calendar_today", "datepicker__cal");
const iconChevron = iconOf("expand_more", "datepicker__chevron");
const iconPrev = iconOf("chevron_left", "datepicker__nav-icon");
const iconNext = iconOf("chevron_right", "datepicker__nav-icon");

const css = `${rootVars}

.datepicker { display: inline-block; font-family: ${cv("family.sans")}; }
.datepicker__trigger { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${tGap}; height: ${tH}; padding: 0 ${tPadX}; border-radius: ${tRadius}; background: ${cv(refPath(t.bg.$value))}; border: 1px solid ${cv(refPath(t.border.$value))}; cursor: pointer; color: ${cv(refPath(t.valueColor.$value))}; ${typoCss(tValue)} font-family: inherit; }
.datepicker__trigger:hover { border-color: ${cv(refPath(t.borderHover.$value))}; }
.datepicker__trigger:focus-visible { outline: none; border-color: ${cv(refPath(t.borderFocus.$value))}; }
.datepicker__cal { width: ${tIcon}; height: ${tIcon}; color: ${cv(refPath(t.icon.$value))}; flex-shrink: 0; }
.datepicker__value { min-width: 0; }
.datepicker__chevron { width: ${tIcon}; height: ${tIcon}; color: ${cv(refPath(t.icon.$value))}; flex-shrink: 0; margin-left: auto; }

.datepicker__panel { margin: 0; box-sizing: border-box; padding: ${pPad}; border-radius: ${pRadius}; background: ${cv(refPath(panel.bg.$value))}; border: 1px solid ${cv(refPath(panel.border.$value))}; box-shadow: ${pShadowCss}; font-family: ${cv("family.sans")}; }
.datepicker__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.datepicker__month { ${typoCss(hdLabel)} color: ${cv(refPath(hd.labelColor.$value))}; }
.datepicker__nav { width: ${navSize}; height: ${navSize}; display: inline-flex; align-items: center; justify-content: center; border: none; background: none; border-radius: ${px(resolve("radius.default"))}; cursor: pointer; color: ${cv(refPath(hd.navIcon.$value))}; }
.datepicker__nav:hover { background: ${cv(refPath(hd.navHoverBg.$value))}; }
.datepicker__nav-icon { width: 20px; height: 20px; }
.datepicker__grid { display: grid; grid-template-columns: repeat(7, ${daySize}); gap: 2px; }
.datepicker__weekday { width: ${daySize}; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: ${cv(refPath(wd.color.$value))}; ${typoCss(wdLabel)}${wdExt.textTransform ? ` text-transform: ${wdExt.textTransform};` : ""}${wdExt.letterSpacing ? ` letter-spacing: ${wdExt.letterSpacing};` : ""} }
.datepicker__day { width: ${daySize}; height: ${daySize}; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; background: none; border-radius: ${dayRadius}; cursor: pointer; color: ${cv(refPath(day.color.$value))}; ${typoCss(dayLabel)} font-family: inherit; }
.datepicker__day:hover { background: ${cv(refPath(day.hoverBg.$value))}; }
.datepicker__day--outside { color: ${cv(refPath(day.outsideColor.$value))}; }
.datepicker__day--today { border-color: ${cv(refPath(day.todayBorder.$value))}; }
.datepicker__day--selected, .datepicker__day--selected:hover { background: ${cv(refPath(day.selectedBg.$value))}; color: ${cv(refPath(day.selectedText.$value))}; border-color: ${cv(refPath(day.selectedBg.$value))}; }
.datepicker__day:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: -2px; }`;

const js = `(function () {
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  function fmt(y, m, d) { return MONTHS[m].slice(0,3) + " " + d + ", " + y; }
  document.querySelectorAll(".datepicker").forEach(function (dpEl) {
    var trigger = dpEl.querySelector(".datepicker__trigger");
    var panel = dpEl.querySelector(".datepicker__panel");
    var valEl = dpEl.querySelector(".datepicker__value");
    // seed: the trigger's data-date (YYYY-MM-DD) is the selected value + view month
    var parts = (dpEl.dataset.date || "2026-08-15").split("-").map(Number);
    var sel = { y: parts[0], m: parts[1] - 1, d: parts[2] };
    var view = { y: sel.y, m: sel.m };
    var today = { y: 2026, m: 7, d: 8 }; // fixed "today" for a deterministic demo
    function render() {
      var first = new Date(view.y, view.m, 1).getDay();
      var days = new Date(view.y, view.m + 1, 0).getDate();
      var prevDays = new Date(view.y, view.m, 0).getDate();
      var cells = [];
      for (var i = 0; i < first; i++) cells.push({ d: prevDays - first + 1 + i, outside: true });
      for (var d = 1; d <= days; d++) cells.push({ d: d, outside: false });
      while (cells.length % 7 !== 0) cells.push({ d: cells.length - (first + days) + 1, outside: true });
      var grid = WD.map(function (w) { return '<span class="datepicker__weekday">' + w + '</span>'; }).join("");
      cells.forEach(function (c) {
        var cls = ["datepicker__day"];
        if (c.outside) cls.push("datepicker__day--outside");
        else {
          if (view.y === today.y && view.m === today.m && c.d === today.d) cls.push("datepicker__day--today");
          if (view.y === sel.y && view.m === sel.m && c.d === sel.d) cls.push("datepicker__day--selected");
        }
        grid += '<button type="button" class="' + cls.join(" ") + '"' + (c.outside ? " disabled tabindex=-1" : "") + ' data-day="' + c.d + '">' + c.d + '</button>';
      });
      panel.querySelector(".datepicker__month").textContent = MONTHS[view.m] + " " + view.y;
      panel.querySelector(".datepicker__grid").innerHTML = grid;
      panel.querySelectorAll(".datepicker__day:not(.datepicker__day--outside)").forEach(function (btn) {
        btn.addEventListener("click", function () {
          sel = { y: view.y, m: view.m, d: parseInt(btn.dataset.day, 10) };
          valEl.textContent = fmt(sel.y, sel.m, sel.d);
          dpEl.dataset.date = sel.y + "-" + ("0" + (sel.m + 1)).slice(-2) + "-" + ("0" + sel.d).slice(-2);
          panel.hidePopover();
        });
      });
    }
    panel.querySelector(".datepicker__nav--prev").addEventListener("click", function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); });
    panel.querySelector(".datepicker__nav--next").addEventListener("click", function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); });
    panel.addEventListener("toggle", function (e) {
      if (e.newState === "open") {
        view = { y: sel.y, m: sel.m };
        render();
        var r = trigger.getBoundingClientRect();
        panel.style.position = "fixed"; panel.style.margin = "0";
        panel.style.top = (r.bottom + 4) + "px";
        panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
      }
    });
    render();
  });
})();`;

const panelId = "dp-panel";
const triggerMarkup = `<div class="datepicker" data-date="2026-08-15">
      <button class="datepicker__trigger" type="button" popovertarget="${panelId}" aria-haspopup="dialog">
        ${iconCal}<span class="datepicker__value">Aug 15, 2026</span>${iconChevron}
      </button>
      <div class="datepicker__panel" id="${panelId}" popover role="dialog" aria-label="Choose a date">
        <div class="datepicker__header">
          <button class="datepicker__nav datepicker__nav--prev" type="button" aria-label="Previous month">${iconPrev}</button>
          <span class="datepicker__month">August 2026</span>
          <button class="datepicker__nav datepicker__nav--next" type="button" aria-label="Next month">${iconNext}</button>
        </div>
        <div class="datepicker__grid"></div>
      </div>
    </div>`;

function storyCard(title, live, note = "") { return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`; }

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — DatePicker</title>
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
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 52px; padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("date-picker")}</nav>
  <main>
    <h1>DatePicker</h1>
    <p class="sub">tokens/components/date-picker.tokens.json · generated — a single-date picker: a Select-style trigger that opens a month-grid calendar. Click the trigger below, navigate months, pick a day. Built for the message Expiration date.</p>

    <div class="legend">
      <div class="row"><b>Trigger</b><span>The locked-in field recipe — <code class="tok">surface.dim</code> fill + hairline border → <code class="tok">border.strong</code> hover → <code class="tok">border.focus</code>. A calendar icon, the formatted date, a chevron. Value text is 16px (the iOS-zoom rule every field follows).</span></div>
      <div class="row"><b>Panel</b><span>Floats on the native Popover shell — <code class="tok">border.default</code> + <code class="tok">shadow.sm</code>, free outside-click/Escape dismissal. Month label + prev/next nav over a 7-column grid.</span></div>
      <div class="row"><b>Days</b><span><code class="tok">today</code> gets a hairline ring, the <code class="tok">selected</code> day fills <code class="tok">fill.primary</code>, days spilling from the prev/next month dim to <code class="tok">text.muted</code>. Single date only — no range, no time.</span></div>
    </div>

    <h2 class="big-section">Expiration date</h2>
    <p class="section-desc">Selected Aug 15, 2026; "today" is Aug 8 (ringed) in this deterministic demo.</p>
    <div class="story-grid">
      ${storyCard("Pick a date", triggerMarkup)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/date-picker.html"), html);
console.log("wrote docs/date-picker.html");
