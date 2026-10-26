// Regenerates docs/command.html from tokens/components/command.tokens.json.
// A search over actions: inline, and the command palette (Ctrl/⌘+K). The recipe
// lives in tools/lib/command.mjs; this page lays out stories.
// Run: node tools/build-command-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { COMMAND_CSS, COMMAND_COLOR_PATHS, COMMAND_JS, commandHtml, commandDialogHtml } from "./lib/command.mjs";

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
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// the page's "open" button is Button secondary sm — resolved from button.tokens.json
const sec = load("tokens/components/button.tokens.json").component.button.secondary;
const role = (n) => n.$value.replace(/[{}]/g, "");
const colorPaths = [...new Set([...COMMAND_COLOR_PATHS, role(sec.state.default.fill), role(sec.state.default.label), role(sec.state.hover.fill), "text.secondary"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${COMMAND_CSS}`;
const demoCss = `
.cmd-demo { width: 100%; max-width: 560px; }
.cmd-open { box-sizing: border-box; height: ${px(resolve(sec.size.sm.height.$value.replace(/[{}]/g, "")))}; padding: 0 ${px(resolve(sec.size.sm.paddingX.$value.replace(/[{}]/g, "")))}; border: none; border-radius: ${px(resolve(sec.radius.$value.replace(/[{}]/g, "")))}; background: ${cv(role(sec.state.default.fill))}; color: ${cv(role(sec.state.default.label))}; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(resolve(sec.size.sm.label.$value.replace(/[{}]/g, "")))} }
.cmd-open:hover { background: ${cv(role(sec.state.hover.fill))}; }
.cmd-out { margin: 12px 0 0; font: 11.5px/1.5 var(--mono); color: var(--text-secondary); min-height: 1.5em; }`;

const groups = [
  { heading: "Suggestions", items: [
    { label: "Book an appointment", icon: "calendar_today", keywords: "advising schedule meeting" },
    { label: "Messages", icon: "mail", keywords: "inbox email" },
    { label: "Degree planner", icon: "school", keywords: "courses requirements" },
  ] },
  { heading: "Settings", items: [
    { label: "Profile", icon: "person", shortcut: "Ctrl P" },
    { label: "Settings", icon: "settings", shortcut: "Ctrl S" },
    { label: "Sign out", icon: "logout", disabled: false },
  ] },
];
const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview"><div class="cmd-demo">${live}<p class="cmd-out" aria-live="polite"></p></div></div><p class="story-note">${note}</p></div>`;
const sample = `<div class="command" id="nav-cmd" data-command>
  <div class="command__input-row">…search icon…<input class="command__input" role="combobox" aria-controls="nav-cmd-list" placeholder="Type a command or search…"></div>
  <div class="command__list" id="nav-cmd-list" role="listbox">
    <div class="command__group" role="group" aria-labelledby="g0">
      <div class="command__heading" id="g0">Suggestions</div>
      <div class="command__item" role="option" id="o0" data-value="Messages" data-keywords="inbox email">…icon…<span class="command__label">Messages</span></div>
      <div class="command__item" role="option" id="o1" data-value="Profile">…icon…<span class="command__label">Profile</span><kbd class="command__shortcut">Ctrl P</kbd></div>
    </div>
    <div class="command__empty" hidden>No results found.</div>
  </div>
</div>

<!-- the palette: the same inside <dialog class="command-dialog" data-hotkey> — Ctrl/⌘+K toggles it -->
<script>
  document.addEventListener("commandselect", (e) => { /* e.detail.value — run it */ });
</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Command</title>
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
  <nav class="side">${renderNav("command")}</nav>
  <main>
    <h1>Command</h1>
    <p class="sub">tokens/components/command.tokens.json · generated — a search over actions: type, and the list narrows to the things you can do or the places you can go; Enter runs one. Inline, or as the command palette on Ctrl/⌘+K.</p>

    <div class="legend">
      <div class="row"><b>vs Listbox</b><span>Listbox picks a <i>value</i> that stays selected (a check mark). A Command item has no selected state — it <i>runs</i>: goes somewhere, does something. To pick a value with search, use a Listbox with its search header.</span></div>
      <div class="row"><b>Field</b><span>48px row, search icon (<code class="tok">icon.muted</code>), a borderless input in Search's value type — 16px, so iOS doesn't zoom — and a hairline under it.</span></div>
      <div class="row"><b>Rows</b><span>Listbox's option recipe at a declared 36px: icon (<code class="tok">icon.secondary</code>), label, an optional shortcut (<code class="tok">body-sm</code>, <code class="tok">text.muted</code>). The active row — keyboard or pointer — gets the <code class="tok">fill.neutralHover</code> wash. Groups have a 12px semibold heading and a hairline between them; a group with no matches hides.</span></div>
      <div class="row"><b>Keyboard</b><span>Type to filter (labels and keywords), ↑ ↓ / Home / End to move, Enter to run, Escape closes the palette.</span></div>
      <div class="row"><b>Radius</b><span><code class="tok">radius.default</code> (8px) inline and in the dialog — concentric with the rows: 4px row radius + 4px list padding = 8. Modal's 24px corner around 4px rows looked square and cramped.</span></div>
      <div class="row"><b>Dialog</b><span>Modal's <code class="tok">shadow.lg</code> and <code class="tok">surface.overlay</code>, 560px wide, 15% from the top. Ctrl/⌘+K opens and closes it; picking an item closes it.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid story-grid--wide">
      ${story("Inline", commandHtml({ id: "cmd-inline", groups }), "Try typing “mess” or “inbox” (a keyword), or a word that matches nothing.")}
      ${story("Dialog — the command palette", `<button class="cmd-open" type="button" onclick="document.getElementById('cmd-dialog').hpOpen()">Open command menu</button> <span class="story-note">or press Ctrl/⌘+K</span>${commandDialogHtml({ id: "cmd-dialog", groups })}`, "Opens with the field focused and the first row active; picking an item closes it.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(sample)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${COMMAND_JS}
document.addEventListener("commandselect", function (e) {
  var out = (e.target.closest(".cmd-demo") || document).querySelector(".cmd-out");
  if (out) out.textContent = "Ran: " + e.detail.value;
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/command.html"), html);
console.log("wrote docs/command.html");
