// Regenerates docs/input.html from tokens/components/input.tokens.json.
// Every preview is the real <input> from tools/lib/field.mjs (textFieldHtml) —
// the same field Form uses — so hover, focus, typing and the floating label
// all work, and the printed CSS is that one shared recipe.
// Run: node tools/build-input-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { renderRootVars } from "./lib/css-vars.mjs";
import { FIELD_COLOR_PATHS, FIELD_CSS, TEXT_FIELD_JS, textFieldHtml } from "./lib/field.mjs";

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
const input = load("tokens/components/input.tokens.json").component.input;
const H = (k) => px(resolve(input.size[k].height.$value.replace(/[{}]/g, "")));

// only the text field part of the shared sheet (Field/Form live on form.html)
const fieldCss = FIELD_CSS.slice(0, FIELD_CSS.indexOf("/* Field — label"));
const rootVars = renderRootVars([...FIELD_COLOR_PATHS.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${fieldCss}`;

// live markup and printed sample from one call; the sample shows "…" for SVGs
const code = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, "…").replace(/></g, ">\n<");
const story = (title, opts, note = "") => {
  const live = textFieldHtml(opts);
  return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><pre class="code"><code>${esc(code(live))}</code></pre>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
};

const sizes = [
  story(`sm — ${H("sm")}`, { id: "i-sm", size: "sm", label: "Search classes" }, "No floating label — too short for two lines. The label is there for screen readers; the placeholder carries it on screen."),
  story(`base — ${H("base")}`, { id: "i-base", label: "Email", value: "name@school.edu", type: "email", autocomplete: "email" }, "The default. Populated: the label floats to 12px above the 16px value."),
  story(`lg — ${H("lg")}`, { id: "i-lg", size: "lg", label: "Email", value: "name@school.edu", type: "email", autocomplete: "email" }),
];
const content = [
  story("Value only", { id: "i-v", label: "Full name", value: "Ana Diaz", autocomplete: "name" }),
  story("Icon left", { id: "i-ic", label: "Search", icon: "search", type: "search" }, "Icon sizes follow Button's — 16 / 20 / 24 at sm / base / lg, 8px gap."),
];
const states = [
  story("Default", { id: "s-def", label: "Full name" }, "Empty, not focused: one 16px placeholder line. Hover it (border.strong) and click it (border.focus, the label floats in blue)."),
  story("Populated", { id: "s-pop", label: "Full name", value: "Ana Diaz" }, "The label stays floated; every colour is back to rest."),
  story("Disabled", { id: "s-dis", label: "Room", disabled: true }, "Unavailable right now — e.g. until a building is chosen. Faded, skipped by Tab, not submitted."),
  story("Read-only", { id: "s-ro", label: "Student ID", value: "A00123456", readOnly: true }, "Can't change, can read, select and copy. Full-contrast text on white (no recessed fill), no hover, focusable, submitted with the form."),
  story("Error", { id: "s-err", label: "Email", value: "name@school", type: "email", invalid: true }, `aria-invalid="true" → border.dangerStrong (red.600). In a form the message goes under it — see <a href="form.html">Form</a>.`),
];
const types = [
  story("Email", { id: "t-email", label: "Email", type: "email", autocomplete: "email" }, `type="email" + autocomplete="email": the @ keyboard on a phone, autofill. Not a variant — the same field.`),
  story("Password", { id: "t-pw", label: "Password", reveal: true, autocomplete: "current-password", value: "correct-horse" }, "A reveal button at the trailing edge — Button ghost sm icon-only. Its label says what the next press does."),
  story("Numeric code", { id: "t-num", label: "Student ID", inputmode: "numeric", autocomplete: "off" }, `inputmode="numeric" — digits keyboard, still a text field. Not type="number": its spinners are tiny, the scroll wheel changes it and it accepts "e". A quantity with steps is NumberField.`),
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Input</title>
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
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("input")}</nav>
  <main>
    <h1>Input</h1>
    <p class="sub">tokens/components/input.tokens.json · generated — every preview is the real field from <code class="tok">tools/lib/field.mjs</code>, the one <a href="form.html">Form</a> uses: hover it, click it, type.</p>

    <div class="legend">
      <div class="row"><b>Fill + border</b><span>surface.dim fill + border.default hairline at rest — a recessed place to type.</span></div>
      <div class="row"><b>Sizes</b><span>sm ${H("sm")} (no floating label) / base ${H("base")} (default) / lg ${H("lg")}. Value text is 16px at every size — Safari on iOS zooms the page on focus if it's smaller.</span></div>
      <div class="row"><b>Floating label</b><span>base/lg. Resting: the placeholder shows the label's text; the &lt;label&gt; is kept for screen readers. Focused or populated: a 12px label above the 16px value. Pure CSS — <code class="tok">:focus-within</code> / <code class="tok">:placeholder-shown</code>.</span></div>
      <div class="row"><b>States</b><span>hover border.strong · focus border.focus + blue label · disabled surface.disabled, faded · <b>read-only</b> white, full contrast, no hover · error <code class="tok">border.dangerStrong</code> (red.600 — the pale border.danger is Alert's).</span></div>
      <div class="row"><b>Disabled vs read-only</b><span>Disabled = unavailable right now; faded, skipped by Tab, not submitted. Read-only = this value doesn't change here, but read it, select it, copy it; submitted. If nothing on the page is editable, show text (label + value), not fields.</span></div>
      <div class="row"><b>Types</b><span>email / tel / url / search are <code class="tok">type</code> + <code class="tok">autocomplete</code> on this field, not variants. Password adds a reveal button. Numbers: a code or ID is <code class="tok">inputmode="numeric"</code>; a quantity with steps is NumberField — never <code class="tok">type="number"</code>.</span></div>
      <div class="row"><b>Not an Input</b><span>File upload — the native "Choose file / No file chosen" can't be styled and shows no list or progress. It's its own component (a button or drop zone + Attachment rows), on the backlog.</span></div>
    </div>

    <h2 class="big-section">Sizes</h2>
    <div class="story-grid">${sizes.join("")}</div>

    <h2 class="big-section">Content</h2>
    <div class="story-grid">${content.join("")}</div>

    <h2 class="big-section">States</h2>
    <div class="story-grid">${states.join("")}</div>

    <h2 class="big-section">Types</h2>
    <div class="story-grid">${types.join("")}</div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${TEXT_FIELD_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/input.html"), html);
console.log("wrote docs/input.html");
