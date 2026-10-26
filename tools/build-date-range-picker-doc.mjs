// Regenerates docs/date-range-picker.html from tokens/components/date-range-picker.tokens.json.
// A date-range picker — the console filter's date window. One bordered field
// `‹ | [calendar icon + "Aug 08, 2026 – Sep 08, 2026"] | ›`: the arrows step the
// whole window by a month, the middle opens the shared Calendar (range mode,
// two months — tools/lib/calendar.mjs) with Reset / Apply. A `--single`
// one-month variant for narrow containers. Mirrors the staff Message Center
// prototype's widget.
// Run: node tools/build-date-range-picker-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { CALENDAR_CSS, CALENDAR_COLOR_PATHS, CALENDAR_JS, calendarHtml } from "./lib/calendar.mjs";

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
// Reset / Apply ARE Buttons (secondary sm / primary sm) — resolved from Button's
// own token file, never retyped, so a Button retune reaches this footer too.
const button = load("tokens/components/button.tokens.json").component.button;

const registry = { color: colorPrim, dim, radius: radiusPrim, shadow: shadowPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
/** a token node → its color-role path (for var()) */
const role = (node) => refPath(node.$value);
/** a dimension token node → "Npx" */
const dimOf = (node) => px(resolve(node.$value));
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const nav = dr.nav, panel = dr.panel, foot = dr.footer;
const bPri = button.primary, bSec = button.secondary;

// every color role this page paints, read off the token nodes (no hand-typed role names)
const colorNodes = [
  nav.bg, nav.border, nav.borderHover, nav.borderFocus, nav.divider, nav.arrowIcon, nav.arrowHoverBg, nav.calIcon, nav.valueColor, nav.fieldHoverBg,
  panel.bg, panel.border,
  foot.border,
  bPri.state.default.fill, bPri.state.default.label, bPri.state.hover.fill, bPri.state.pressed.fill, bPri.state.focused.ringColor,
  bSec.state.default.fill, bSec.state.default.label, bSec.state.hover.fill, bSec.state.pressed.fill, bSec.state.focused.ringColor,
];
const colorPaths = [...new Set([...colorNodes.map(role), ...CALENDAR_COLOR_PATHS])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const navValue = resolveToken(get(nav.value.$value));
const pShadow = resolveToken(panel.shadow); const pShadowCss = `${px(pShadow.offsetX)} ${px(pShadow.offsetY)} ${px(pShadow.blur)} ${px(pShadow.spread)} ${pShadow.color}`;

// one Button variant at size sm, as a footer-button modifier
function btnCss(cls, b) {
  const sm = b.size.sm, label = resolveToken(get(sm.label.$value)), f = b.state.focused;
  return `.${cls} { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; white-space: nowrap; font-family: inherit; height: ${dimOf(sm.height)}; padding: 0 ${dimOf(sm.paddingX)}; gap: ${dimOf(sm.gap)}; border-radius: ${dimOf(b.radius)}; ${typoCss(label)} background: ${cv(role(b.state.default.fill))}; color: ${cv(role(b.state.default.label))}; }
.${cls}:hover { background: ${cv(role(b.state.hover.fill))}; }
.${cls}:active { background: ${cv(role(b.state.pressed.fill))}; }
.${cls}:focus-visible { outline: ${dimOf(f.ringWidth)} solid ${cv(role(f.ringColor))}; outline-offset: ${dimOf(f.ringOffset)}; }`;
}

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const css = `${rootVars}

.daterange { display: inline-block; font-family: ${cv("family.sans")}; }
/* the field: ‹ | [calendar icon + range] | ›, hairline-divided, one field recipe */
.daterange__nav { box-sizing: border-box; display: inline-flex; align-items: stretch; height: ${dimOf(nav.height)}; border-radius: ${dimOf(nav.radius)}; background: ${cv(role(nav.bg))}; border: 1px solid ${cv(role(nav.border))}; overflow: hidden; }
.daterange__nav:hover { border-color: ${cv(role(nav.borderHover))}; }
.daterange__nav:focus-within { border-color: ${cv(role(nav.borderFocus))}; }
.daterange__arrow, .daterange__field { border: none; background: none; cursor: pointer; display: inline-flex; align-items: center; font-family: inherit; color: ${cv(role(nav.valueColor))}; }
.daterange__arrow { width: ${dimOf(nav.arrowWidth)}; flex-shrink: 0; justify-content: center; color: ${cv(role(nav.arrowIcon))}; }
.daterange__arrow:hover { background: ${cv(role(nav.arrowHoverBg))}; }
.daterange__arrow-icon { width: ${dimOf(nav.arrowIconSize)}; height: ${dimOf(nav.arrowIconSize)}; }
.daterange__field { gap: ${dimOf(nav.gap)}; padding: 0 ${dimOf(nav.paddingX)}; ${typoCss(navValue)} white-space: nowrap; border-left: 1px solid ${cv(role(nav.divider))}; }
.daterange__field:hover { background: ${cv(role(nav.fieldHoverBg))}; }
.daterange__cal-icon { width: ${dimOf(nav.calIconSize)}; height: ${dimOf(nav.calIconSize)}; flex-shrink: 0; color: ${cv(role(nav.calIcon))}; }
.daterange__range-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.daterange__arrow--next { border-left: 1px solid ${cv(role(nav.divider))}; }
.daterange__arrow:focus-visible, .daterange__field:focus-visible { outline: 2px solid ${cv(role(nav.borderFocus))}; outline-offset: -2px; }

/* the panel: the Calendar (two months, range) + Reset / Apply */
.daterange__panel { margin: 0; box-sizing: border-box; padding: ${dimOf(panel.padding)}; border-radius: ${dimOf(panel.radius)}; background: ${cv(role(panel.bg))}; border: 1px solid ${cv(role(panel.border))}; box-shadow: ${pShadowCss}; font-family: ${cv("family.sans")}; max-width: calc(100vw - 16px); }
.daterange__footer { display: flex; justify-content: space-between; gap: ${dimOf(foot.gap)}; padding-top: ${dimOf(foot.paddingTop)}; margin-top: ${dimOf(foot.marginTop)}; border-top: 1px solid ${cv(role(foot.border))}; }
/* Reset = Button secondary sm · Apply = Button primary sm */
${btnCss("daterange__btn--secondary", bSec)}
${btnCss("daterange__btn--primary", bPri)}
${CALENDAR_CSS}
/* single-month variant (mobile/tablet filters drawer): caps height + scrolls on short screens */
.daterange__panel--single { max-height: calc(100dvh - 16px); overflow-y: auto; }`;

const js = `${CALENDAR_JS}
(function () {
  var ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var C = hpCalendar;
  function pad(n) { return ("0" + n).slice(-2); }
  function fmtRange(s, e) { return ABBR[s.m] + " " + pad(s.d) + ", " + s.y + " – " + ABBR[e.m] + " " + pad(e.d) + ", " + e.y; }

  document.querySelectorAll(".daterange").forEach(function (el) {
    var panel = el.querySelector(".daterange__panel");
    var valEl = el.querySelector(".daterange__range-val");
    var DEF_S = el.dataset.start, DEF_E = el.dataset.end;
    var cur = { s: C.parse(DEF_S), e: C.parse(DEF_E) };
    var cal = C.mount(panel.querySelector(".calendar"));
    function sync() { valEl.textContent = fmtRange(cur.s, cur.e); el.dataset.start = C.iso(cur.s); el.dataset.end = C.iso(cur.e); }
    function commit(s, e) { if (C.key(s) > C.key(e)) { var t = s; s = e; e = t; } cur.s = s; cur.e = e; sync(); }

    panel.addEventListener("toggle", function (e) {
      if (e.newState !== "open") return;
      // the calendar opens on the committed window; nothing applies until Apply
      cal.setValue({ start: cur.s, end: cur.e }); cal.setView(cur.s);
      // float under the field; flip above if it doesn't fit; else clamp to the viewport
      requestAnimationFrame(function () {
        var r = el.querySelector(".daterange__nav").getBoundingClientRect();
        var pr = panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, top;
        if (r.bottom + 4 + pr.height <= vh - 8) top = r.bottom + 4;
        else if (r.top - 4 - pr.height >= 8) top = r.top - 4 - pr.height;
        else top = Math.max(8, vh - pr.height - 8);
        panel.style.position = "fixed"; panel.style.margin = "0";
        panel.style.top = top + "px";
        panel.style.left = Math.max(8, Math.min(r.left, vw - pr.width - 8)) + "px";
        cal.focus();
      });
    });
    panel.querySelector(".daterange__apply").addEventListener("click", function () { var v = cal.getValue(); if (v.start) commit(v.start, v.end || v.start); panel.hidePopover(); });
    panel.querySelector(".daterange__reset").addEventListener("click", function () {
      cur.s = C.parse(DEF_S); cur.e = C.parse(DEF_E); sync(); panel.hidePopover();
    });
    // the field's own arrows step the whole committed window by a month
    el.querySelector(".daterange__arrow--prev").addEventListener("click", function () { commit(C.addMonths(cur.s, -1), C.addMonths(cur.e, -1)); });
    el.querySelector(".daterange__arrow--next").addEventListener("click", function () { commit(C.addMonths(cur.s, 1), C.addMonths(cur.e, 1)); });
    sync();
  });
})();`;

// ---- markup ----
function widget(id, single) {
  const pid = `${id}-panel`;
  return `<div class="daterange${single ? " daterange--single" : ""}" id="${id}" data-start="2026-08-08" data-end="2026-09-08">
      <div class="daterange__nav">
        <button class="daterange__arrow daterange__arrow--prev" type="button" aria-label="Previous month">${iconOf("chevron_left", "daterange__arrow-icon")}</button>
        <button class="daterange__field" type="button" popovertarget="${pid}" aria-haspopup="dialog">${iconOf("calendar_today", "daterange__cal-icon")}<span class="daterange__range-val">Aug 08, 2026 – Sep 08, 2026</span></button>
        <button class="daterange__arrow daterange__arrow--next" type="button" aria-label="Next month">${iconOf("chevron_right", "daterange__arrow-icon")}</button>
      </div>
      <div class="daterange__panel${single ? " daterange__panel--single" : ""}" id="${pid}" popover role="dialog" aria-label="Choose a date range">
        ${calendarHtml({ mode: "range", months: single ? 1 : 2, start: "2026-08-08", end: "2026-09-08", today: "2026-09-08", label: "Date range" })}
        <div class="daterange__footer">
          <button class="daterange__btn--secondary daterange__reset" type="button">Reset</button>
          <button class="daterange__btn--primary daterange__apply" type="button">Apply</button>
        </div>
      </div>
    </div>`;
}

const markupSample = `<div class="daterange" data-start="2026-08-08" data-end="2026-09-08">
  <div class="daterange__nav">
    <button class="daterange__arrow daterange__arrow--prev" aria-label="Previous month">…chevron_left…</button>
    <button class="daterange__field" popovertarget="dr-panel" aria-haspopup="dialog">
      …calendar_today…<span class="daterange__range-val">Aug 08, 2026 – Sep 08, 2026</span>
    </button>
    <button class="daterange__arrow daterange__arrow--next" aria-label="Next month">…chevron_right…</button>
  </div>
  <div class="daterange__panel" id="dr-panel" popover role="dialog" aria-label="Choose a date range">
    <div class="calendar" data-mode="range" data-start="2026-08-08" data-end="2026-09-08">
      <!-- the shared Calendar, two months — see calendar.html -->
    </div>
    <div class="daterange__footer">
      <button class="daterange__btn--secondary daterange__reset">Reset</button>
      <button class="daterange__btn--primary daterange__apply">Apply</button>
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
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; min-width: 0; }
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
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 52px; padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("date-range-picker")}</nav>
  <main>
    <h1>DateRangePicker</h1>
    <p class="sub">tokens/components/date-range-picker.tokens.json · generated — the console filter's date window. One field steps the window a month at a time; its middle opens a two-month calendar for a custom start &amp; end.</p>

    <div class="legend">
      <div class="row"><b>Field</b><span><b>‹</b> · calendar icon + range (“Aug 08, 2026 – Sep 08, 2026”) · <b>›</b>, hairline-divided, ${dimOf(nav.height)} tall, in the field recipe (<code class="tok">surface.dim</code> → <code class="tok">border.strong</code> hover → <code class="tok">border.focus</code>). The arrows step the <i>whole</i> window by a month — no calendar needed for “the month before”. The middle opens the panel.</span></div>
      <div class="row"><b>Panel</b><span>The shared <a href="calendar.html">Calendar</a> in <code class="tok">range</code> mode, two consecutive months, on the Popover shell. Its month + year selects and paging arrows (outer sides only, both months move together) come from there; under 560px the months stack.</span></div>
      <div class="row"><b>Picking</b><span>Click a day to set the start, another to set the end (picking an earlier day swaps them). Nothing applies until <b>Apply</b>; <b>Reset</b> returns to the default window. Reset = Button secondary sm, Apply = Button primary sm.</span></div>
      <div class="row"><b>Days</b><span>Calendar's range states: start and end fill <code class="tok">fill.primary</code>, the days between get a flush <code class="tok">bg.primary</code> band, today keeps its <code class="tok">border.strong</code> ring, outside-month days are muted and not pickable.</span></div>
    </div>

    <h2 class="big-section">Filter by date window</h2>
    <p class="section-desc">Default window Aug 08 – Sep 08, 2026; “today” is fixed at Sep 8, 2026 so the demo is deterministic. Try the arrows, then open the calendar and pick a range.</p>
    <div class="story-grid">
      ${storyCard("Dual month (default)", widget("dr-dual", false), "Desktop console toolbar. Paging arrows on the outer edges, month/year selects per month.")}
      ${storyCard("--single", widget("dr-single", true), "One month with both paging arrows — for narrow containers like the mobile/tablet filters drawer.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <p class="section-desc">The panel is a native popover opened by the range field. Day grids are rendered by script from the committed range; the selects and arrows only change the visible months.</p>
    <pre class="code"><code>${esc(markupSample)}</code></pre>

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
