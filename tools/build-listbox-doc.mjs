// Regenerates docs/listbox.html from tokens/components/listbox.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json
// (plus search.tokens.json for the embedded search field's own sm-size values).
// Same panel shell as Menu/Popover (native popover attribute, border+shadow.sm+
// radius.default) — kept as its own component because options carry selection
// state (checked/selected), unlike Menu's one-shot action items. Separate from
// Menu for the same reason Modal/Drawer stayed separate despite sharing <dialog>.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-listbox-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { SELECT_COLOR_PATHS, LISTBOX_CSS } from "./lib/select.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const colorPrim = load("tokens/primitives/color.tokens.json").color;
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const radiusPrim = load("tokens/primitives/radius.tokens.json").radius;
const shadowPrim = load("tokens/primitives/shadow.tokens.json").shadow;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const listbox = load("tokens/components/listbox.tokens.json").component.listbox;
const search = load("tokens/components/search.tokens.json").component.search;

const registry = {
  color: colorPrim,
  dim,
  radius: radiusPrim,
  shadow: shadowPrim,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": textStyle,
  ...semantic,
};
function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  return node;
}
function resolveValue(v) {
  if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v));
  return v;
}
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) {
    const out = {};
    for (const [k, sub] of Object.entries(v)) out[k] = resolveValue(sub);
    return out;
  }
  if (v && typeof v === "object" && "value" in v) return v;
  return resolveValue(v);
}
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;

// the recipe lives in tools/lib/select.mjs — one Listbox for this page, Select and Form
const colorPaths = [...new Set([...SELECT_COLOR_PATHS, "fill.neutral", "fill.neutralHoverStrong", "fill.neutralActive"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const iconCheck = fs.readFileSync(path.join(root, "assets/icons/material-filled/check.svg"), "utf8");
const iconCheckmark = iconCheck.replace("<svg ", '<svg class="listbox__checkmark" ');
const iconCheckboxGlyph = iconCheck.replace("<svg ", '<svg class="listbox__cb-icon" ');
const iconSearch = fs.readFileSync(path.join(root, "assets/icons/material-filled/search.svg"), "utf8").replace("<svg ", '<svg class="listbox__search-icon" ');

const css = `${rootVars}
${LISTBOX_CSS}`;

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

const singleCountries = ["Ukraine", "Poland", "Germany", "France"];
const singleDemo = `<button class="ov-btn ov-btn--secondary" popovertarget="listbox-single">Country: Poland</button>
    <div id="listbox-single" class="listbox" popover>
      <ul class="listbox__list">
        ${singleCountries.map((c) => `<li><button class="listbox__option">${c}${c === "Poland" ? iconCheckmark : ""}</button></li>`).join("\n        ")}
      </ul>
    </div>`;
const singleCode = `<button popovertarget="listbox-single">Country: Poland</button>
<div id="listbox-single" class="listbox" popover>
  <ul class="listbox__list">
    <li><button class="listbox__option">Ukraine</button></li>
    <li><button class="listbox__option">Poland<svg class="listbox__checkmark">…</svg></button></li>
    <li><button class="listbox__option">Germany</button></li>
    <li><button class="listbox__option">France</button></li>
  </ul>
</div>`;

const multiOptions = [
  { label: "Bug", checked: true },
  { label: "Feature request", checked: true },
  { label: "Documentation", checked: false },
  { label: "Question", checked: false },
];
function cbOption(id, label, checked) {
  return `<li><label class="listbox__cb-option" for="${id}">
          <input type="checkbox" class="listbox__cb-input" id="${id}"${checked ? " checked" : ""} />
          <span class="listbox__cb-box">${iconCheckboxGlyph}</span>
          <span class="listbox__cb-label">${label}</span>
        </label></li>`;
}
const PROGRAM_OPTIONS = [
  { label: "A B C", desc: "Liberal Arts Undergraduate", kind: "Major" },
  { label: "Accounting AA", desc: "Associate of Arts", kind: "Major" },
  { label: "Accounting AB", desc: "Liberal Arts Undergraduate", kind: "Major" },
  { label: "Art (BFA)", desc: "Fine Arts Undergraduate", kind: "Major" },
  { label: "Art History Minor", desc: "Liberal Arts Undergraduate", kind: "Minor" },
  { label: "Auto Technology", desc: "Associate of Science", kind: "Major" },
];
function programOption(id, o, checked = false) {
  return `<li><label class="listbox__cb-option" for="${id}">
          <input type="checkbox" class="listbox__cb-input" id="${id}"${checked ? " checked" : ""} />
          <span class="listbox__cb-box">${iconCheckboxGlyph}</span>
          <span class="listbox__stack">
            <span class="listbox__cb-label">${o.label}</span>
            <span class="listbox__desc">${o.desc}</span>
          </span>
          <span class="listbox__trailing">${o.kind}</span>
        </label></li>`;
}
const programDemo = `<button class="ov-btn ov-btn--secondary" popovertarget="listbox-programs">Add a major or minor</button>
    <div id="listbox-programs" class="listbox" popover>
      <div class="listbox__search-wrap">
        <div class="listbox__search">${iconSearch}<input type="text" placeholder="Search majors and minors…" /></div>
      </div>
      <ul class="listbox__list">
        ${PROGRAM_OPTIONS.map((o, i) => programOption(`lb-prog-${i}`, o, i === 2)).join("\n        ")}
      </ul>
    </div>`;
const programCode = `<li><label class="listbox__cb-option" for="opt">
  <input type="checkbox" class="listbox__cb-input" id="opt" />
  <span class="listbox__cb-box">…</span>
  <span class="listbox__stack">
    <span class="listbox__cb-label">Accounting AA</span>
    <span class="listbox__desc">Associate of Arts</span>
  </span>
  <span class="listbox__trailing">Major</span>
</label></li>`;
const multiDemo = `<button class="ov-btn ov-btn--secondary" popovertarget="listbox-multi">Labels (2)</button>
    <div id="listbox-multi" class="listbox" popover>
      <div class="listbox__search-wrap">
        <div class="listbox__search">${iconSearch}<input type="text" placeholder="Search labels…" /></div>
      </div>
      <div class="listbox__select-all">
        <p class="listbox__select-all-label">2 of 4 selected</p>
        <button class="listbox__clear">Clear all</button>
      </div>
      <ul class="listbox__list">
        ${multiOptions.map((o, i) => cbOption(`lb-multi-${i}`, o.label, o.checked)).join("\n        ")}
      </ul>
    </div>`;
const multiCode = `<button popovertarget="listbox-multi">Labels (2)</button>
<div id="listbox-multi" class="listbox" popover>
  <div class="listbox__search-wrap">
    <div class="listbox__search">…<input type="text" placeholder="Search labels…" /></div>
  </div>
  <div class="listbox__select-all">
    <p class="listbox__select-all-label">2 of 4 selected</p>
    <button class="listbox__clear">Clear all</button>
  </div>
  <ul class="listbox__list">
    <li><label class="listbox__cb-option">
      <input type="checkbox" class="listbox__cb-input" checked />
      <span class="listbox__cb-box">…</span>
      <span class="listbox__cb-label">Bug</span>
    </label></li>
    …
  </ul>
</div>`;

const GROUPS = [["Fruits", ["Apple", "Banana", "Cherry"]], ["Vegetables", ["Carrot", "Celery", "Lettuce"]]];
const groupBody = (live) => GROUPS.map(([g, items], gi) => `${gi ? `<li role="none"><div class="listbox__divider" role="separator"></div></li>\n        ` : ""}<li role="none"><ul class="listbox__group" role="group" aria-labelledby="lbg-${gi}">
          <li role="presentation" class="listbox__group-label" id="lbg-${gi}">${g}</li>
          ${items.map((it) => `<li role="none"><button class="listbox__option" role="option" aria-selected="${it === "Banana"}"><span>${it}</span>${live ? iconCheckmark : "…"}</button></li>`).join("\n          ")}
        </ul></li>`).join("\n        ");
const groupDemo = `<button class="ov-btn ov-btn--secondary" popovertarget="listbox-groups">Food: Banana</button>
    <div id="listbox-groups" class="listbox" popover role="listbox">
      <ul class="listbox__list" role="none">
        ${groupBody(true)}
      </ul>
    </div>`;
const groupCode = `<div class="listbox" popover role="listbox">
  <ul class="listbox__list" role="none">
    ${groupBody(false)}
  </ul>
</div>`;

const triggerGap = resolve("dim.2").value;
const positionScript = `document.querySelectorAll('[popovertarget]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panel = document.getElementById(trigger.getAttribute('popovertarget'));
    const rect = trigger.getBoundingClientRect();
    panel.style.top = (rect.bottom + ${triggerGap}) + 'px';
    panel.style.left = rect.left + 'px';
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Listbox</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, "Segoe UI", system-ui, sans-serif;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
      --border: #313035; --border-strong: #403f45;
      --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
      --accent: #5aa4ec; --accent-bg: #16283b;
      --code-bg: #0d0d0f; --code-text: #d7d6d2;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .brand { font-size: 14px; font-weight: 600; margin: 0 0 2px 8px; }
  .brand-sub { font-size: 11.5px; color: var(--text-muted); margin: 0 0 1.5rem 8px; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }

  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); }
  .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 150px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }

  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; }
  pre.code code { font-family: inherit; }

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 64px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .ov-btn { box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border-radius: ${px(resolve("radius.default"))}; border: none; cursor: pointer; font-family: var(--sans); ${typoCss(resolveToken(get("text-style.heading-base")))} }
  .ov-btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
  /* Strong tier — this button rests on fill.neutral (gray.100), where the
   fill.neutralHover wash is the same colour and the hover shows nothing. */
.ov-btn--secondary:hover { background: ${cv("fill.neutralHoverStrong")}; }
  .ov-btn--secondary:active { background: ${cv("fill.neutralActive")}; }
  .ov-btn:focus-visible { outline: ${px(resolve("dim.1"))} solid ${cv("border.focus")}; outline-offset: ${px(resolve("dim.0_5"))}; }

  .placeholder-note { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); border: 0.5px dashed var(--border-strong); border-radius: 6px; padding: 4px 10px; margin-top: 1.5rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("listbox")}
  </nav>
  <main>
    <h1>Listbox</h1>
    <p class="sub">tokens/components/listbox.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, not hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>Not Menu</b><span>Options carry persistent selection state (checked/selected) — Menu's items are one-shot actions with no state. Different ARIA role too: listbox/option here vs. menu/menuitem there.</span></div>
      <div class="row"><b>Same panel shell</b><span>border.default + shadow.sm + radius.default, native popover attribute, same positioning script as Menu/Popover.</span></div>
      <div class="row"><b>Single-select</b><span>Trailing checkmark (check.svg, fill.primary) on the selected option, no background tint — same convention as Radix Select / a native &lt;select&gt;. Picking an option would close the listbox in a real implementation.</span></div>
      <div class="row"><b>Multi-select</b><span>A real Checkbox marker per option — literally the Checkbox component's own tokens (dim.5 box, radius.xs, fill.primary checked), not re-derived. Stays open across picks.</span></div>
      <div class="row"><b>Search + select-all</b><span>Search reuses Search component's own sm-size tokens verbatim. "Clear all" uses text-style.link-sm (the underlined-link style), not a button — both only shown for the multi-select variant, where a long option list actually benefits from them.</span></div>
      <div class="row"><b>Groups</b><span>A heading per group (the Command heading: heading-sm, text.muted, 28px) and a hairline between groups; each group is <code class="tok">role="group"</code> labelled by its heading.</span></div>
      <div class="row"><b>Live in Select</b><span>The demos here are the panel on its own. Keyboard, picking and closing are wired in <a href="select.html">Select</a> (tools/lib/select.mjs).</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Positioning script</h2>
    <p class="section-desc">Identical to Menu/Popover's.</p>
    <pre class="code"><code>${esc(positionScript)}</code></pre>

    <h2 class="big-section">Examples</h2>
    <p class="section-desc">Click to open for real.</p>
    <div class="story-grid">
      ${storyCard("Single-select", singleDemo, singleCode, "Poland is selected — trailing checkmark, no other visual change.")}
      ${storyCard("Multi-select, with search + select-all", multiDemo, multiCode, "Bug and Feature request are checked. Clicking a checkbox in a real implementation wouldn't close the panel.")}
      ${storyCard("With groups", groupDemo, groupCode, "Group headings — the Command heading-sm in text.muted, 28px — and a hairline between groups. Each group is role=group labelled by its heading.")}
      ${storyCard("Option with a description + kind badge", programDemo, programCode, "The Explore Degrees 'Add a major or minor' picker. The label alone is ambiguous — several programmes share a name and differ only by degree type — so the description carries what the option IS, and the trailing pill (a real Badge, neutral tint, sm) carries its kind.")}
    </div>

    <p class="placeholder-note">Every code sample on this page is printed from the same resolved token values driving the live previews above it — copy it directly, nothing here is hand-typed.</p>
  </main>
</div>
<script>${positionScript}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/listbox.html"), html);
console.log("wrote docs/listbox.html");
