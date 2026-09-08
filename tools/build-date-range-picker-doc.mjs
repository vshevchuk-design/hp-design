// Regenerates docs/date-range-picker.html from tokens/components/date-range-picker.tokens.json.
// A date-range picker: a period navigator (‹ start · label · end ›) that opens a
// month-grid calendar where you pick a start then an end day; the span between
// highlights. Arrows step the range by a month. The grid is built in JS (seeded,
// deterministic). Run: node tools/build-date-range-picker-doc.mjs
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
const dr = load("tokens/components/date-range-picker.tokens.json").component.dateRangePicker;

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

const colorPaths = ["surface.dim", "surface.default", "border.default", "border.strong", "border.focus", "text.default", "text.secondary", "text.muted", "icon.default", "fill.neutralHover", "fill.primary", "text.onFill", "bg.primary"];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const nav = dr.nav, panel = dr.panel, hd = dr.header, wd = dr.weekday, day = dr.day, foot = dr.footer;
const navH = px(resolve(nav.height.$value)), navRadius = px(resolve(nav.radius.$value));
const navValue = resolveToken(get(nav.value.$value)), navLabel = resolveToken(get(nav.label.$value));
const pShadow = resolveToken(panel.shadow); const pShadowCss = `${px(pShadow.offsetX)} ${px(pShadow.offsetY)} ${px(pShadow.blur)} ${px(pShadow.spread)} ${pShadow.color}`;
const pRadius = px(resolve(panel.radius.$value)), pPad = px(resolve(panel.padding.$value));
const hdLabel = resolveToken(get(hd.label.$value)), navSize = px(resolve(hd.navSize.$value));
const wdLabelNode = get(wd.label.$value); const wdLabel = resolveToken(wdLabelNode); const wdExt = wdLabelNode.$extensions?.["hp.design/text"] || {};
const daySize = px(resolve(day.size.$value)), dayRadius = px(resolve(day.radius.$value)), dayLabel = resolveToken(get(day.label.$value));
const footGap = px(resolve(foot.gap.$value)), footPadTop = px(resolve(foot.paddingTop.$value));

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconPrev = iconOf("chevron_left", "daterange__arrow-icon");
const iconNext = iconOf("chevron_right", "daterange__arrow-icon");
const iconPnavPrev = iconOf("chevron_left", "daterange__pnav-icon");
const iconPnavNext = iconOf("chevron_right", "daterange__pnav-icon");

const css = `${rootVars}

.daterange { display: inline-block; font-family: ${cv("family.sans")}; }
/* navigator: prev · start field · period label · end field · next, hairline-divided */
.daterange__nav { box-sizing: border-box; display: inline-flex; align-items: stretch; height: ${navH}; border-radius: ${navRadius}; background: ${cv(refPath(nav.bg.$value))}; border: 1px solid ${cv(refPath(nav.border.$value))}; overflow: hidden; }
.daterange__nav:hover { border-color: ${cv(refPath(nav.borderHover.$value))}; }
.daterange__nav:focus-within { border-color: ${cv(refPath(nav.borderFocus.$value))}; }
.daterange__arrow, .daterange__field { border: none; background: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-family: inherit; color: ${cv(refPath(nav.valueColor.$value))}; }
.daterange__arrow { width: 32px; flex-shrink: 0; color: ${cv(refPath(nav.arrowIcon.$value))}; }
.daterange__arrow:hover { background: ${cv(refPath(nav.arrowHoverBg.$value))}; }
.daterange__arrow-icon { width: 18px; height: 18px; }
.daterange__field { padding: 0 ${px(resolve("dim.2_5"))}; ${typoCss(navValue)} white-space: nowrap; border-left: 1px solid ${cv(refPath(nav.divider.$value))}; }
.daterange__field:hover { background: ${cv(refPath(nav.fieldHoverBg.$value))}; }
.daterange__label { display: inline-flex; align-items: center; padding: 0 ${px(resolve("dim.2_5"))}; ${typoCss(navLabel)} color: ${cv(refPath(nav.labelColor.$value))}; white-space: nowrap; border-left: 1px solid ${cv(refPath(nav.divider.$value))}; }
.daterange__arrow--next { border-left: 1px solid ${cv(refPath(nav.divider.$value))}; }

.daterange__panel { margin: 0; box-sizing: border-box; padding: ${pPad}; border-radius: ${pRadius}; background: ${cv(refPath(panel.bg.$value))}; border: 1px solid ${cv(refPath(panel.border.$value))}; box-shadow: ${pShadowCss}; font-family: ${cv("family.sans")}; }
.daterange__phead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.daterange__month { ${typoCss(hdLabel)} color: ${cv(refPath(hd.labelColor.$value))}; }
.daterange__pnav { width: ${navSize}; height: ${navSize}; display: inline-flex; align-items: center; justify-content: center; border: none; background: none; border-radius: ${px(resolve("radius.default"))}; cursor: pointer; color: ${cv(refPath(hd.navIcon.$value))}; }
.daterange__pnav:hover { background: ${cv(refPath(hd.navHoverBg.$value))}; }
.daterange__pnav-icon { width: 20px; height: 20px; }
.daterange__grid { display: grid; grid-template-columns: repeat(7, ${daySize}); gap: 2px 0; }
.daterange__weekday { width: ${daySize}; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: ${cv(refPath(wd.color.$value))}; ${typoCss(wdLabel)}${wdExt.textTransform ? ` text-transform: ${wdExt.textTransform};` : ""}${wdExt.letterSpacing ? ` letter-spacing: ${wdExt.letterSpacing};` : ""} }
.daterange__day { width: ${daySize}; height: ${daySize}; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; background: none; cursor: pointer; color: ${cv(refPath(day.color.$value))}; ${typoCss(dayLabel)} font-family: inherit; border-radius: ${dayRadius}; }
.daterange__day:hover { background: ${cv(refPath(day.hoverBg.$value))}; }
.daterange__day--outside { color: ${cv(refPath(day.outsideColor.$value))}; pointer-events: none; }
.daterange__day--today { border-color: ${cv(refPath(day.todayBorder.$value))}; }
/* range wash sits edge-to-edge; the ends round on their outer side */
.daterange__day--mid { background: ${cv(refPath(day.rangeBg.$value))}; color: ${cv(refPath(day.rangeText.$value))}; border-radius: 0; }
.daterange__day--start, .daterange__day--end, .daterange__day--start:hover, .daterange__day--end:hover { background: ${cv(refPath(day.endsBg.$value))}; color: ${cv(refPath(day.endsText.$value))}; border-color: ${cv(refPath(day.endsBg.$value))}; }
.daterange__day--start { border-radius: ${dayRadius} 0 0 ${dayRadius}; }
.daterange__day--end { border-radius: 0 ${dayRadius} ${dayRadius} 0; }
.daterange__day--start.daterange__day--end { border-radius: ${dayRadius}; }
.daterange__day:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: -2px; }
.daterange__footer { display: flex; justify-content: space-between; gap: ${footGap}; padding-top: ${footPadTop}; margin-top: 8px; border-top: 1px solid ${cv(refPath(panel.border.$value))}; }
.daterange__btn { border: 1px solid ${cv("border.default")}; background: ${cv("surface.default")}; color: ${cv("text.default")}; border-radius: ${px(resolve("radius.default"))}; padding: 0 ${px(resolve("dim.3"))}; height: ${px(resolve("dim.8"))}; cursor: pointer; ${typoCss(dayLabel)} font-family: inherit; }
.daterange__btn--primary { background: ${cv("fill.primary")}; border-color: ${cv("fill.primary")}; color: ${cv("text.onFill")}; }`;

const js = `(function () {
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  function pad(n){ return ("0" + n).slice(-2); }
  function fmt(a){ return pad(a.m + 1) + "/" + pad(a.d) + "/" + a.y; }
  function iso(a){ return a.y + "-" + pad(a.m + 1) + "-" + pad(a.d); }
  function parse(s){ var p = s.split("-").map(Number); return { y: p[0], m: p[1] - 1, d: p[2] }; }
  function cmp(a){ return a.y * 10000 + a.m * 100 + a.d; }
  function addMonths(a, n){ var d = new Date(a.y, a.m + n, a.d); return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() }; }
  var TODAY = { y: 2026, m: 7, d: 8 };

  document.querySelectorAll(".daterange").forEach(function (el) {
    var panel = el.querySelector(".daterange__panel");
    var startVal = el.querySelector(".daterange__start-val");
    var endVal = el.querySelector(".daterange__end-val");
    var labelEl = el.querySelector(".daterange__label");
    var DEFAULT_S = parse(el.dataset.start), DEFAULT_E = parse(el.dataset.end);
    var start = parse(el.dataset.start), end = parse(el.dataset.end);
    var draftS = null, draftE = null; // in-progress selection inside the panel
    var view = { y: start.y, m: start.m };

    function isDefault(){ return cmp(start) === cmp(DEFAULT_S) && cmp(end) === cmp(DEFAULT_E); }
    function syncNav(){
      startVal.textContent = fmt(start);
      endVal.textContent = fmt(end);
      labelEl.textContent = isDefault() ? "Current" : MONTHS[start.m].slice(0, 3) + " " + start.y;
      el.dataset.start = iso(start); el.dataset.end = iso(end);
    }
    function render(){
      var s = draftS || start, e = draftE || (draftS ? null : end);
      var first = new Date(view.y, view.m, 1).getDay();
      var days = new Date(view.y, view.m + 1, 0).getDate();
      var prevDays = new Date(view.y, view.m, 0).getDate();
      var cells = [];
      for (var i = 0; i < first; i++) cells.push({ d: prevDays - first + 1 + i, outside: true });
      for (var d = 1; d <= days; d++) cells.push({ d: d, outside: false });
      while (cells.length % 7 !== 0) cells.push({ d: cells.length - (first + days) + 1, outside: true });
      var grid = WD.map(function (w){ return '<span class="daterange__weekday">' + w + '</span>'; }).join("");
      var sV = s ? cmp(s) : null, eV = e ? cmp(e) : null;
      cells.forEach(function (c){
        var cls = ["daterange__day"];
        if (c.outside) { cls.push("daterange__day--outside"); grid += '<span class="' + cls.join(" ") + '">' + c.d + '</span>'; return; }
        var v = view.y * 10000 + view.m * 100 + c.d;
        if (view.y === TODAY.y && view.m === TODAY.m && c.d === TODAY.d) cls.push("daterange__day--today");
        if (sV !== null && eV !== null) {
          if (v === sV) cls.push("daterange__day--start");
          else if (v === eV) cls.push("daterange__day--end");
          else if (v > sV && v < eV) cls.push("daterange__day--mid");
        } else if (sV !== null && v === sV) { cls.push("daterange__day--start", "daterange__day--end"); }
        grid += '<button type="button" class="' + cls.join(" ") + '" data-day="' + c.d + '">' + c.d + '</button>';
      });
      panel.querySelector(".daterange__month").textContent = MONTHS[view.m] + " " + view.y;
      panel.querySelector(".daterange__grid").innerHTML = grid;
      panel.querySelectorAll(".daterange__day[data-day]").forEach(function (btn){
        btn.addEventListener("click", function (){
          var picked = { y: view.y, m: view.m, d: parseInt(btn.dataset.day, 10) };
          if (!draftS || (draftS && draftE)) { draftS = picked; draftE = null; }
          else { if (cmp(picked) < cmp(draftS)) { draftE = draftS; draftS = picked; } else { draftE = picked; } }
          render();
        });
      });
    }
    function openPanel(){ view = { y: start.y, m: start.m }; draftS = null; draftE = null; render(); }
    panel.addEventListener("toggle", function (e){
      if (e.newState !== "open") return;
      openPanel();
      requestAnimationFrame(function (){
        var anchor = el.querySelector(".daterange__nav");
        var r = anchor.getBoundingClientRect();
        var w = panel.getBoundingClientRect().width;
        panel.style.position = "fixed"; panel.style.margin = "0";
        panel.style.top = (r.bottom + 4) + "px";
        panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
      });
    });
    panel.querySelector(".daterange__pnav--prev").addEventListener("click", function (){ view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); });
    panel.querySelector(".daterange__pnav--next").addEventListener("click", function (){ view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); });
    panel.querySelector(".daterange__apply").addEventListener("click", function (){
      if (draftS) { start = draftS; end = draftE || draftS; }
      syncNav(); panel.hidePopover();
    });
    panel.querySelector(".daterange__clear").addEventListener("click", function (){
      start = parse(el.dataset.startDefault || iso(DEFAULT_S)); end = parse(el.dataset.endDefault || iso(DEFAULT_E));
      start = DEFAULT_S; end = DEFAULT_E; draftS = null; draftE = null; syncNav(); openPanel();
    });
    // period arrows step the whole range by one month
    el.querySelector(".daterange__arrow--prev").addEventListener("click", function (){ start = addMonths(start, -1); end = addMonths(end, -1); syncNav(); });
    el.querySelector(".daterange__arrow--next").addEventListener("click", function (){ start = addMonths(start, 1); end = addMonths(end, 1); syncNav(); });

    syncNav();
  });
})();`;

const panelId = "dr-panel";
const widgetMarkup = `<div class="daterange" data-start="2026-08-09" data-end="2026-09-08">
      <div class="daterange__nav">
        <button class="daterange__arrow daterange__arrow--prev" type="button" aria-label="Previous period">${iconPrev}</button>
        <button class="daterange__field daterange__field--start" type="button" popovertarget="${panelId}" aria-haspopup="dialog"><span class="daterange__start-val">08/09/2026</span></button>
        <span class="daterange__label">Current</span>
        <button class="daterange__field daterange__field--end" type="button" popovertarget="${panelId}" aria-haspopup="dialog"><span class="daterange__end-val">09/08/2026</span></button>
        <button class="daterange__arrow daterange__arrow--next" type="button" aria-label="Next period">${iconNext}</button>
      </div>
      <div class="daterange__panel" id="${panelId}" popover role="dialog" aria-label="Choose a date range">
        <div class="daterange__phead">
          <button class="daterange__pnav daterange__pnav--prev" type="button" aria-label="Previous month">${iconPnavPrev}</button>
          <span class="daterange__month">August 2026</span>
          <button class="daterange__pnav daterange__pnav--next" type="button" aria-label="Next month">${iconPnavNext}</button>
        </div>
        <div class="daterange__grid"></div>
        <div class="daterange__footer">
          <button class="daterange__btn daterange__clear" type="button">Clear</button>
          <button class="daterange__btn daterange__btn--primary daterange__apply" type="button">Apply</button>
        </div>
      </div>
    </div>`;

function storyCard(title, live, note = "") { return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`; }

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — DateRangePicker</title>
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
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 52px; padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("date-range-picker")}</nav>
  <main>
    <h1>DateRangePicker</h1>
    <p class="sub">tokens/components/date-range-picker.tokens.json · generated — a period navigator that opens a range calendar. Step the range with the arrows, or click a date to pick a custom start &amp; end; the span between highlights.</p>

    <div class="legend">
      <div class="row"><b>Navigator</b><span>‹ prev · start date · period label · end date · next ›, hairline-divided in the field recipe (<code class="tok">surface.dim</code> → <code class="tok">border.strong</code> hover → <code class="tok">border.focus</code>). The arrows step the whole range by a month; the label reads <b>Current</b> for the default window, else the month.</span></div>
      <div class="row"><b>Calendar</b><span>Floats on the Popover shell. Click a day to set the start, click again to set the end (picking earlier swaps them). Prev/next month nav, <b>Apply</b> / <b>Clear</b> in the footer.</span></div>
      <div class="row"><b>Range</b><span>Start and end fill <code class="tok">fill.primary</code>; the days between get a light <code class="tok">bg.primary</code> wash; <code class="tok">today</code> keeps its hairline ring.</span></div>
    </div>

    <h2 class="big-section">Filter by date window</h2>
    <p class="section-desc">Default range Aug 9 – Sep 8, 2026 ("Current"); "today" is Aug 8 in this deterministic demo.</p>
    <div class="story-grid">
      ${storyCard("Pick a range", widgetMarkup)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/date-range-picker.html"), html);
console.log("wrote docs/date-range-picker.html");
