// Regenerates docs/date-picker.html from tokens/components/date-picker.tokens.json.
// A single-date picker: a Select-style trigger + the shared Calendar in a
// native popover. The recipe lives in tools/lib/date-picker.mjs (trigger +
// panel) on top of tools/lib/calendar.mjs (the grid); this page lays out stories.
// Run: node tools/build-date-picker-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { CALENDAR_CSS, CALENDAR_JS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS, DATE_PICKER_JS, datePickerHtml } from "./lib/date-picker.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rootVars = renderRootVars([...DATE_PICKER_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${CALENDAR_CSS}
${DATE_PICKER_CSS}`;

// "today" is pinned so the page renders the same every day
const TODAY = "2026-10-21";
const story = (title, live, note = "") =>
  `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const markupSample = `<div class="datepicker" id="start-date" data-value="2026-10-21">
  <button class="datepicker__trigger" type="button" popovertarget="start-date-panel" aria-haspopup="dialog" aria-label="Start date">
    …calendar_today…<span class="datepicker__value">Oct 21, 2026</span>…expand_more…
  </button>
  <div class="datepicker__panel" id="start-date-panel" popover role="dialog" aria-label="Choose a date">
    <div class="calendar" data-mode="single" data-value="2026-10-21" data-min="2026-10-21">…see Calendar…</div>
  </div>
</div>
<!-- empty: <span class="datepicker__value datepicker__value--placeholder">Select date</span>
     full width: .datepicker--block
     on pick the .datepicker fires a bubbling "datechange" event, detail.iso = "2026-10-21" -->`;

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
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("date-picker")}</nav>
  <main>
    <h1>DatePicker</h1>
    <p class="sub">tokens/components/date-picker.tokens.json · generated — a single-date field: a Select-style trigger that opens the <a href="calendar.html">Calendar</a> in a popover. Click a trigger, page or jump with the month / year selects, pick a day.</p>

    <div class="legend">
      <div class="row"><b>Trigger</b><span>The locked-in field recipe — <code class="tok">surface.dim</code> fill + hairline border → <code class="tok">border.strong</code> hover → <code class="tok">border.focus</code>, 40px. Calendar icon, the formatted date (or a <code class="tok">text.muted</code> “Select date”), a chevron. 14px value, like Select — it's a button, not a text field.</span></div>
      <div class="row"><b>Panel</b><span>Native Popover shell — <code class="tok">border.default</code> + <code class="tok">shadow.sm</code>, 12px padding, free outside-click / Escape dismissal. Opens on the selected month (or today's), focuses the selected day, flips above the trigger when there's no room below.</span></div>
      <div class="row"><b>Calendar</b><span>The shared <a href="calendar.html">Calendar</a> in <code class="tok">single</code> mode — header, grid, day states and keyboard all come from there. <code class="tok">min</code> / <code class="tok">max</code> pass straight through.</span></div>
      <div class="row"><b>With time</b><span>Joined to a <a href="time-picker.html">TimePicker</a> as one date + time field — see “Date and time” on that page.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <p class="section-desc">"Today" is pinned to Oct 21, 2026 on this page so it renders the same every day.</p>
    <div class="story-grid">
      ${story("With a value", datePickerHtml({ id: "dp-value", value: "2026-11-15", today: TODAY, label: "Expiration date" }), "Opens on November with the 15th selected.")}
      ${story("Empty", datePickerHtml({ id: "dp-empty", today: TODAY, label: "Start date" }), "Placeholder until a day is picked; opens on today's month.")}
      ${story("With min date", datePickerHtml({ id: "dp-min", today: TODAY, min: TODAY, label: "Start date" }), "min = today: earlier days are disabled, and so is the arrow back into September.")}
    </div>
    <div class="story-grid" style="margin-top:24px">
      ${story("Full width (.datepicker--block)", datePickerHtml({ id: "dp-block", today: TODAY, label: "Start date", block: true }), "Fills its container, the way it sits in a form column. The popover keeps the calendar's own width.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <p class="section-desc">The panel is a native popover opened by the trigger; the calendar inside is rendered and kept in sync by <code class="tok">hpCalendar</code>.</p>
    <pre class="code"><code>${esc(markupSample)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${CALENDAR_JS}
${DATE_PICKER_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/date-picker.html"), html);
console.log("wrote docs/date-picker.html");
