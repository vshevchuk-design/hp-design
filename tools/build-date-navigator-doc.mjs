// Regenerates docs/date-navigator.html from tokens/components/date-navigator.tokens.json.
// Steps a calendar view through time: ‹ › Today + the period as a trigger for
// the DS Calendar. The recipe lives in tools/lib/date-navigator.mjs; Schedule
// uses it.
// Run: node tools/build-date-navigator-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { DATE_NAV_CSS, DATE_NAV_BUTTON_CSS, DATE_NAV_COLOR_PATHS, DATE_NAV_JS, dateNavHtml } from "./lib/date-navigator.mjs";
import { CALENDAR_CSS, CALENDAR_JS, CALENDAR_COLOR_PATHS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS } from "./lib/date-picker.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, family: typo.family, ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolve(ref) { const v = get(ref).$value; return typeof v === "string" && v.startsWith("{") ? resolve(v) : v; }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TODAY = "2026-10-29";
const paths = [...new Set([...DATE_NAV_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS, ...CALENDAR_COLOR_PATHS, "surface.page", "border.default", "text.secondary"])];
const rootVars = renderRootVars([...paths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${DATE_NAV_CSS}
${DATE_NAV_BUTTON_CSS}
${CALENDAR_CSS}
${DATE_PICKER_CSS}`;
// demo only: a 343px frame standing in for a phone row
const demoCss = `
.dn-phone { width: 343px; max-width: 100%; padding: 12px 16px; border-radius: 12px; background: var(--tok-surface-page); border: 1px solid var(--tok-border-default); }
.dn-out { font-family: var(--mono); font-size: 11.5px; color: var(--text-secondary); margin: 12px 0 0; min-height: 1.5em; }`;

const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><p class="story-note">${note}</p></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Date Navigator</title>
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
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("date-navigator")}</nav>
  <main>
    <h1>Date Navigator</h1>
    <p class="sub">tokens/components/date-navigator.tokens.json · generated — steps a calendar view through time and names the period on screen: ‹ previous · › next · Today, then the period as a trigger that opens the Calendar to jump to any date.</p>

    <div class="legend">
      <div class="row"><b>Anatomy</b><span>Three Button secondary base (the arrows icon-only), then the period — heading-lg 18/600 with a chevron, a ghost trigger 40px high (Button ghost's hover and focus ring). The period opens the DS Calendar in DatePicker's panel.</span></div>
      <div class="row"><b>Units</b><span><code class="tok">day</code> "Thu, Oct 29, 2026" · <code class="tok">week</code> "Oct 25 – 31, 2026" (Sunday-first; across months "Oct 25 – Nov 1, 2026", across years both dates in full) · <code class="tok">month</code> "October 2026". The arrows step one unit and say which ("Previous week").</span></div>
      <div class="row"><b>Layouts</b><span><code class="tok">inline</code> — controls, then the period (desktop, tablet). <code class="tok">split</code> — the period first and flexible, the controls at the far end (a phone row). Under 768px the period drops to heading-md 16/600.</span></div>
      <div class="row"><b>Today</b><span>Always enabled — it is also how you get back to today's position inside a period that already contains it.</span></div>
      <div class="row"><b>Not for</b><span>Choosing a date for a form — that is DatePicker. This one moves a view; it holds no form value.</span></div>
      <div class="row"><b>API</b><span><code class="tok">hpDateNav.mount(el, { onChange(iso, reason) })</code> → <code class="tok">{ set({ unit, value }), get() }</code>; reason is prev · next · today · pick. Needs <code class="tok">CALENDAR_JS</code> before it.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid story-grid--wide">
      ${story("Week · inline", dateNavHtml({ id: "dn-week", unit: "week", value: TODAY, today: TODAY }) + '<p class="dn-out" id="dn-week-out"></p>', "Desktop. Step, go to Today, or open the period to pick a date — the event below shows what the page receives.")}
      ${story("Month · inline", dateNavHtml({ id: "dn-month", unit: "month", value: TODAY, today: TODAY }), "The arrows step a month; the value is the 1st.")}
      ${story("Day · inline", dateNavHtml({ id: "dn-day", unit: "day", value: TODAY, today: TODAY }), "One day at a time.")}
      ${story("Week · split (phone)", '<div class="dn-phone">' + dateNavHtml({ id: "dn-split", unit: "week", value: TODAY, today: TODAY, layout: "split" }) + "</div>", "The period first, the controls at the end — Schedule's phone row.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(dateNavHtml({ id: "schedule-nav", unit: "week", value: TODAY, today: TODAY }).replace(/<path[^>]*>/g, "…").replace(/<div class="calendar__months">[\s\S]*?<\/div><\/div><\/div>/, "…"))}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(DATE_NAV_CSS + "\n" + DATE_NAV_BUTTON_CSS)}</code></pre>
  </main>
</div>
<script>
${CALENDAR_JS}
${DATE_NAV_JS}
document.querySelectorAll(".date-nav").forEach(function (el) {
  var out = document.getElementById(el.id + "-out");
  hpDateNav.mount(el, { onChange: function (v, why) { if (out) out.textContent = 'onChange("' + v + '", "' + why + '")'; } });
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/date-navigator.html"), html);
console.log("wrote docs/date-navigator.html");
