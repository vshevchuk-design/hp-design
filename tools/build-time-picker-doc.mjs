// Regenerates docs/time-picker.html from tokens/components/time-picker.tokens.json.
// A time-of-day field (DatePicker's trigger + a Listbox of fixed slots) and the
// joined date + time field. The recipes live in tools/lib/time-picker.mjs,
// date-picker.mjs and calendar.mjs; this page lays out stories.
// Run: node tools/build-time-picker-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { CALENDAR_CSS, CALENDAR_JS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS, DATE_PICKER_JS } from "./lib/date-picker.mjs";
import { TIME_PICKER_CSS, TIME_PICKER_COLOR_PATHS, TIME_PICKER_JS, DATE_TIME_CSS, timePickerHtml, dateTimeHtml } from "./lib/time-picker.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const colorPaths = [...new Set([...TIME_PICKER_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${TIME_PICKER_CSS}
${DATE_TIME_CSS}`;
// the joined field also needs DatePicker + Calendar
const pageCss = `${css}
${CALENDAR_CSS}
${DATE_PICKER_CSS}`;

const TODAY = "2026-10-21";
const story = (title, live, note = "") =>
  `<div class="story"><h3>${title}</h3><div class="story-preview">${live}<p class="tp-out" aria-live="polite"></p></div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const markupSample = `<div class="timepicker" id="start-time" data-value="09:30">
  <div class="timepicker__control">
    <button class="timepicker__trigger" type="button" popovertarget="start-time-panel" aria-haspopup="listbox" aria-label="Start time">
      …schedule…<span class="timepicker__value">09:30 AM <span class="timepicker__zone">EST</span></span>
    </button>
    <button class="timepicker__clear" type="button" aria-label="Clear start time">…close…</button>
    …expand_more (class="timepicker__chevron")…
  </div>
  <div class="timepicker__panel" id="start-time-panel" popover>
    <ul class="timepicker__list" role="listbox" aria-label="Start time">
      <li class="timepicker__option" role="option" data-value="09:30" aria-selected="true" tabindex="-1">
        <span>09:30 AM <span class="timepicker__zone">EST</span></span>…check (class="timepicker__check")…
      </li>
      …one per slot…
    </ul>
  </div>
</div>
<!-- on pick / clear the .timepicker fires a bubbling "timechange" event, detail.value = "09:30" or "" -->

<!-- date + time: a DatePicker and a TimePicker in one group, sharing a border -->
<div class="datetime" role="group" aria-label="Event date and time">
  <div class="datepicker" …>…</div>
  <div class="timepicker" …>…</div>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — TimePicker</title>
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
  .story-preview { min-height: 52px; }
  .story-grid--dt { grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); }
  .tp-out { font-family: var(--mono); font-size: 11.5px; color: var(--text-secondary); margin: 12px 0 0; min-height: 1.5em; }
  ${pageCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("time-picker")}</nav>
  <main>
    <h1>TimePicker</h1>
    <p class="sub">tokens/components/time-picker.tokens.json · generated — a time-of-day field: the same trigger as <a href="date-picker.html">DatePicker</a>, opening a list of fixed slots. Joined to a DatePicker it makes the date + time field.</p>

    <div class="legend">
      <div class="row"><b>Field</b><span>DatePicker's trigger recipe, resolved from its token file — <code class="tok">surface.dim</code>, hairline border → <code class="tok">border.strong</code> hover → <code class="tok">border.focus</code>, 40px, 14px value — so a date and a time sit flush. Clock icon, the time (or a muted “Select time”), a clear × once there's a value, a chevron. The whole box opens the list.</span></div>
      <div class="row"><b>List</b><span>Listbox's panel and single-select rows (trailing <code class="tok">fill.primary</code> check, no row tint), rows declared at 36px. Every 30 minutes by default; <code class="tok">step</code>, <code class="tok">min</code>, <code class="tok">max</code> narrow it. The timezone suffix is <code class="tok">text.muted</code>. Opens scrolled to the selected slot, or to 9 AM.</span></div>
      <div class="row"><b>Pick-only</b><span>No free typing: half-hours are faster to scan than a typed time is to validate. Keyboard: ↑ / ↓, Home / End, Enter picks, Escape closes.</span></div>
    </div>

    <h2 class="big-section">Time</h2>
    <div class="story-grid">
      ${story("With a value", timePickerHtml({ id: "tp-value", value: "09:30", label: "Start time" }), "Opens on 09:30 AM, checked.")}
      ${story("Empty", timePickerHtml({ id: "tp-empty", label: "Start time" }), "No clear button until there's something to clear; opens at 9 AM.")}
      ${story("Office hours, 15 min", timePickerHtml({ id: "tp-range", step: 15, min: "08:00", max: "18:00", label: "Appointment time" }), "step 15, min 08:00, max 18:00.")}
    </div>

    <h2 class="big-section">Date and time</h2>
    <p class="section-desc">A DatePicker and a TimePicker as one field: they share the middle hairline and square their inner corners; whichever half is hovered or focused draws its border on top. Each half keeps its own popover and its own event. "Today" is pinned to Oct 21, 2026.</p>
    <div class="story-grid story-grid--dt">
      ${story("Empty", dateTimeHtml({ id: "dt-empty", today: TODAY, label: "Event date and time", dateLabel: "Event date", timeLabel: "Event time" }))}
      ${story("With values", dateTimeHtml({ id: "dt-value", date: "2026-10-28", time: "14:00", today: TODAY, label: "Event date and time", dateLabel: "Event date", timeLabel: "Event time" }))}
      ${story("With min date", dateTimeHtml({ id: "dt-min", today: TODAY, min: TODAY, label: "Event date and time", dateLabel: "Event date", timeLabel: "Event time" }), "No days before today.")}
    </div>
    <div class="story-grid" style="margin-top:24px">
      ${story("Full width (.datetime--block)", dateTimeHtml({ id: "dt-block", today: TODAY, block: true, label: "Event date and time", dateLabel: "Event date", timeLabel: "Event time" }), "The halves split the row evenly.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(markupSample)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <p class="section-desc">TimePicker and the joined date + time field, followed by the Calendar and DatePicker CSS the joined field also needs — the whole sheet this page runs on.</p>
    <pre class="code"><code>${esc(pageCss)}</code></pre>
  </main>
</div>
<script>
${CALENDAR_JS}
${DATE_PICKER_JS}
${TIME_PICKER_JS}
(function () {
  document.querySelectorAll(".story-preview").forEach(function (pv) {
    var out = pv.querySelector(".tp-out"), val = {};
    function paint() { out.textContent = Object.keys(val).map(function (k) { return k + " " + (val[k] || "—"); }).join(" · "); }
    pv.querySelectorAll(".datepicker").forEach(function (d) { val.date = d.dataset.value; });
    pv.querySelectorAll(".timepicker").forEach(function (t) { val.time = t.dataset.value; });
    pv.addEventListener("datechange", function (e) { val.date = e.detail.iso; paint(); });
    pv.addEventListener("timechange", function (e) { val.time = e.detail.value; paint(); });
    paint();
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/time-picker.html"), html);
console.log("wrote docs/time-picker.html");
