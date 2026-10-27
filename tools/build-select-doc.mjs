// Regenerates docs/select.html from tokens/components/select.tokens.json.
// Every preview is the real Select from tools/lib/select.mjs — a <button>
// that opens a Listbox popover — so open, pick, keyboard and the states work.
// Run: node tools/build-select-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { SELECT_COLOR_PATHS, SELECT_CSS, LISTBOX_CSS, SELECT_JS, selectHtml } from "./lib/select.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sel = load("tokens/components/select.tokens.json").component.select;
const H = (k) => px(resolve(sel.size[k].height.$value.replace(/[{}]/g, "")));

const rootVars = renderRootVars([...SELECT_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${SELECT_CSS}
${LISTBOX_CSS}`;

const DEPTS = ["Advising", "Financial aid", "Registrar", "Career services"].map((label) => ({ label }));
const FOOD = [["Fruits", ["Apple", "Banana", "Cherry"]], ["Vegetables", ["Carrot", "Celery", "Lettuce"]]].flatMap(([group, items]) => items.map((label) => ({ label, group })));
const CHANNELS = ["Email", "SMS", "Push notifications", "Phone call"].map((label) => ({ label }));
const COURSES = ["Intro to Computer Science", "Linear Algebra", "English Composition", "Quantum Mechanics", "World History", "Organic Chemistry", "Microeconomics", "Statistics for the Social Sciences", "Creative Writing", "Introduction to Psychology"].map((label) => ({ label }));
const MAJORS = [["Majors", ["Biology", "Computer Science", "Economics", "English", "History", "Psychology"]], ["Minors", ["Data Science", "Film Studies", "Music", "Spanish"]]].flatMap(([group, items]) => items.map((label) => ({ label, group })));

const code = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, "…");
const story = (title, opts, note = "", wrapStyle = "") => {
  const live = selectHtml(opts);
  return `<div class="story"><h3>${title}</h3><div class="story-preview"><div class="sel-demo"${wrapStyle ? ` style="${wrapStyle}"` : ""}>${live}</div></div><pre class="code"><code>${esc(code(live))}</code></pre>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
};
// "Open" shown frozen: the field as it looks while its list is showing
const frozenOpen = selectHtml({ id: "st-open", label: "Department", options: DEPTS, value: "Registrar" }).replace('aria-expanded="false"', 'aria-expanded="true"');

const sizes = [
  story(`sm — ${H("sm")}`, { id: "z-sm", size: "sm", label: "Department", options: DEPTS, value: "Registrar" }, "No floating label — the value (or the label as a placeholder) is the one line."),
  story(`base — ${H("base")}`, { id: "z-base", label: "Department", options: DEPTS, value: "Registrar" }, "The default. Chosen: the label floats to 12px above the value."),
  story(`lg — ${H("lg")}`, { id: "z-lg", size: "lg", label: "Department", options: DEPTS, value: "Registrar" }),
];
const states = [
  story("Default", { id: "st-def", label: "Department", options: DEPTS }, "Nothing chosen: the label's text is the placeholder. Hover it."),
  story("Populated", { id: "st-pop", label: "Department", options: DEPTS, value: "Financial aid" }),
  `<div class="story"><h3>Open</h3><div class="story-preview"><div class="sel-demo">${frozenOpen}</div></div><p class="story-note">While the list is showing: focus border, blue label, the chevron turned up. Click any Select on this page to see it live. <b>Focus</b> (Tab onto a closed one) has the same border with the chevron still down.</p></div>`,
  story("Disabled", { id: "st-dis", label: "Department", options: DEPTS, disabled: true }, "Unavailable right now — faded, skipped by Tab."),
  story("Error", { id: "st-err", label: "Department", options: DEPTS, invalid: true }, `border.dangerStrong. When: required and nothing chosen on Submit, or a choice that stopped working ("This section is full"). The message goes under it — see <a href="form.html">Form</a>.`),
];
const content = [
  story("Icon left", { id: "c-ic", label: "Campus", icon: "location_on", options: ["Main campus", "Downtown", "Online"].map((label) => ({ label })), value: "Downtown" }),
  story("Multiple", { id: "c-multi", label: "Notify me by", options: CHANNELS, value: ["Email", "SMS", "Push notifications"], multiple: true }, "Checkbox options, the list stays open. The field shows the first choice + a Counter for the rest, so it never grows. A field that lists every choice as removable chips is MultiSelectBadges (Fields, later)."),
  story("With groups", { id: "c-groups", label: "Food", options: FOOD }, "Group headings (Command's heading-sm, text.muted) and a hairline between groups."),
];

const combobox = [
  story("Single", { id: "cb-single", label: "Course", options: COURSES, searchable: true, searchPlaceholder: "Search courses…" }, "Type to narrow the list; ↓ goes into it, Enter picks the first match. One choice → a checkmark, not checkboxes (a checkbox promises 'pick several'). No 'Clear selection' row — pick another; an optional field clears with a None option if it needs one."),
  story("Multi", { id: "cb-multi", label: "Courses", options: COURSES, value: ["Linear Algebra", "English Composition"], multiple: true, searchable: true, searchPlaceholder: "Search courses…" }, "Checkboxes, the list stays open while you search and tick. The field keeps one line: the first choice + a Counter."),
  story("With groups", { id: "cb-groups", label: "Program", options: MAJORS, searchable: true, searchPlaceholder: "Search programs…" }, "Search across groups; a group with nothing left hides, and so does the hairline. Try 'sci'. Nothing at all → 'No results'."),
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Select</title>
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
  .sel-demo { width: 280px; max-width: 100%; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("select")}</nav>
  <main>
    <h1>Select</h1>
    <p class="sub">tokens/components/select.tokens.json · generated — the field that shows a choice and opens a <a href="listbox.html">Listbox</a> under it. Every preview is the real one from <code class="tok">tools/lib/select.mjs</code>: click, pick, use the keyboard.</p>

    <div class="legend">
      <div class="row"><b>Select + Listbox</b><span>Two components, like Radix's Select.Trigger + Select.Content: Select is the field, Listbox the panel. The same Listbox serves Combobox, MultiSelect and filters.</span></div>
      <div class="row"><b>Box model</b><span>Input's: sm ${H("sm")} / base ${H("base")} / lg ${H("lg")}, surface.dim fill, floating label on base/lg.</span></div>
      <div class="row"><b>Focus vs open</b><span><b>Focus</b> — the field is active but closed (you Tabbed onto it): border.focus. <b>Open</b> — the list is showing: the same border, the label turns blue and the chevron turns up. Fields show focus on click too; the keyboard-only ring (focus-visible) is for buttons and checks.</span></div>
      <div class="row"><b>Error</b><span>Not "typed something wrong" — a choice can still be wrong: required and nothing chosen on Submit, or a choice that stopped working (the section filled up, the advisor isn't free that day). border.dangerStrong + the Field message.</span></div>
      <div class="row"><b>Multiple</b><span>The first choice + a Counter ("Email  +2") — the field keeps one line whatever you pick. Every choice as removable chips is a different field (MultiSelectBadges).</span></div>
      <div class="row"><b>Searchable</b><span><code class="tok">searchable: true</code> puts a search box at the top of the list — Storybook's <b>ComboboxField</b> (and SimpleCombobox, the same without a Field). Same Select, same field, Single or Multi. Use it past ~10 options, or when people know the name they want (courses, programs, people).</span></div>
      <div class="row"><b>Keyboard</b><span>↓ / ↑ / Enter / Space open; ↑ ↓ Home End move; Enter or Space pick; Escape closes back to the field; Tab closes. Single-select closes on pick.</span></div>
    </div>

    <h2 class="big-section">Sizes</h2>
    <div class="story-grid">${sizes.join("")}</div>

    <h2 class="big-section">States</h2>
    <div class="story-grid">${states.join("")}</div>

    <h2 class="big-section">Content</h2>
    <div class="story-grid">${content.join("")}</div>

    <h2 class="big-section" id="combobox">Searchable — ComboboxField</h2>
    <p class="section-desc">Storybook's ComboboxField is a Select with a search box in its list. Here it's one option on Select, not a second component: <code class="tok">selectHtml({ …, searchable: true, searchPlaceholder: "Search courses…" })</code>. Opening focuses the search; the list filters as you type (anywhere in the name, case-insensitive); closing clears it.</p>
    <div class="story-grid">${combobox.join("")}</div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${SELECT_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/select.html"), html);
console.log("wrote docs/select.html");
