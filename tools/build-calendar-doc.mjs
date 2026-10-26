// Regenerates docs/calendar.html from tokens/components/calendar.tokens.json.
// The bare month grid every date component is built on. The recipe itself
// (CSS, markup, behaviour) lives in tools/lib/calendar.mjs so DatePicker and
// DateRangePicker render the exact same grid; this page only lays out stories.
// Run: node tools/build-calendar-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { CALENDAR_CSS, CALENDAR_COLOR_PATHS, CALENDAR_JS, calendarHtml } from "./lib/calendar.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rootVars = renderRootVars([...CALENDAR_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
.calendar { font-family: var(--tok-family-sans); }
${CALENDAR_CSS}`;

// "today" is pinned so the page renders the same every day
const TODAY = "2026-10-21";
const story = (title, cal, note = "") =>
  `<div class="story"><h3>${title}</h3><div class="story-preview">${cal}<p class="cal-out" aria-live="polite"></p></div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const markupSample = `<div class="calendar" role="group" aria-label="Start date"
     data-mode="single" data-value="2026-10-21" data-today="2026-10-21" data-min="2026-10-21">
  <div class="calendar__months">
    <div class="calendar__month">
      <div class="calendar__head">
        <button class="calendar__nav calendar__nav--prev" aria-label="Previous month">…chevron_left…</button>
        <span class="calendar__selects">
          <span class="calendar__sel"><select class="calendar__select calendar__select--month" aria-label="Month">…</select>…expand_more…</span>
          <span class="calendar__sel"><select class="calendar__select calendar__select--year" aria-label="Year">…</select>…expand_more…</span>
        </span>
        <button class="calendar__nav calendar__nav--next" aria-label="Next month">…chevron_right…</button>
      </div>
      <div class="calendar__grid" role="group"><!-- weekdays + days, rendered by hpCalendar --></div>
    </div>
    <!-- data-mode="range" + a second .calendar__month: prev on the first head, next on the last,
         .calendar__nav-sp spacers on the inner sides -->
  </div>
</div>

<script>
  const cal = hpCalendar.mount(el, { onChange: (value) => { /* single: {y,m,d} · range: {start, end} */ } });
  cal.setValue(…); cal.setView({ y: 2026, m: 9 }); cal.focus();
</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Calendar</title>
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
  .story-grid--wide { grid-template-columns: 1fr; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; overflow-x: auto; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .cal-out { font-family: var(--mono); font-size: 11.5px; color: var(--text-secondary); margin: 12px 0 0; min-height: 1.5em; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("calendar")}</nav>
  <main>
    <h1>Calendar</h1>
    <p class="sub">tokens/components/calendar.tokens.json · generated — the bare month grid every date component is built on. No trigger, no surface: DatePicker puts it in a popover, DateRangePicker puts two months of it in a popover with Reset / Apply, a page can drop it into a Card.</p>

    <div class="legend">
      <div class="row"><b>Header</b><span>Paging arrows (32px, <code class="tok">icon.default</code>) around a month + year select pair — 32px controls in the field family on <code class="tok">surface.default</code>, so a date two years out is two picks. With two months the arrows sit on the outer edges only.</span></div>
      <div class="row"><b>Grid</b><span>7 × 36px days = a 252px month. Weekdays in <code class="tok">label-sm</code> / <code class="tok">text.muted</code>. Columns sit flush so a range reads as one band; weeks are 2px apart.</span></div>
      <div class="row"><b>Days</b><span>Today gets a hairline <code class="tok">border.strong</code> ring. Selected (single) and start / end (range) fill <code class="tok">fill.primary</code>; the days between get a <code class="tok">bg.primary</code> wash. Days from the neighbouring months are muted and not pickable; days outside <code class="tok">min</code> / <code class="tok">max</code> are <code class="tok">text.disabled</code> and not pickable either.</span></div>
      <div class="row"><b>Keyboard</b><span>One day is in the tab order. Arrows move by a day / week, Home / End to the week's start / end, PageUp / PageDown by a month (with Shift — a year); Enter or Space picks.</span></div>
    </div>

    <h2 class="big-section">Single date</h2>
    <p class="section-desc">"Today" is pinned to Oct 21, 2026 on this page so it renders the same every day.</p>
    <div class="story-grid">
      ${story("Selected", calendarHtml({ value: "2026-10-21", today: TODAY, label: "Date" }), "Today is selected — the fill wins over the ring.")}
      ${story("Nothing selected", calendarHtml({ view: "2026-10", today: TODAY, label: "Date" }), "Only today's ring until a day is picked.")}
      ${story("With min date", calendarHtml({ view: "2026-10", today: TODAY, min: TODAY, label: "Date" }), "min = today: earlier days are disabled, and the prev arrow is disabled because the month before is entirely in the past.")}
    </div>

    <h2 class="big-section">Range</h2>
    <p class="section-desc">First click sets the start, the second sets the end; clicking a day before the start swaps them. A third click starts a new range.</p>
    <div class="story-grid story-grid--wide">
      ${story("Two months", calendarHtml({ mode: "range", months: 2, start: "2026-10-21", end: "2026-11-04", today: TODAY, label: "Date range" }), "The DateRangePicker panel. The months page together; each one's selects move only it (the other follows to stay consecutive). Under 560px they stack.")}
    </div>
    <div class="story-grid" style="margin-top:24px">
      ${story("One month", calendarHtml({ mode: "range", start: "2026-10-21", end: "2026-10-28", today: TODAY, label: "Date range" }), "For narrow containers — the filters drawer on a phone.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <p class="section-desc">The server renders the headers and empty grids; <code class="tok">hpCalendar.mount()</code> fills the days from the <code class="tok">data-*</code> attributes and keeps them in sync. Dates are ISO <code class="tok">YYYY-MM-DD</code>.</p>
    <pre class="code"><code>${esc(markupSample)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${CALENDAR_JS}
(function () {
  function fmt(a) { return a ? hpCalendar.iso(a) : "—"; }
  document.querySelectorAll(".story .calendar").forEach(function (el) {
    var out = el.parentNode.querySelector(".cal-out");
    function show(v) { out.textContent = el.dataset.mode === "range" ? "start " + fmt(v.start) + " · end " + fmt(v.end) : "value " + fmt(v); }
    var cal = hpCalendar.mount(el, { onChange: show });
    show(cal.getValue());
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/calendar.html"), html);
console.log("wrote docs/calendar.html");
