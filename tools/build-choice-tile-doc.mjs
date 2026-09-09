// Regenerates docs/choice-tile.html from tokens/components/choice-tile.tokens.json.
// A card-sized selectable option on a visually hidden native radio — the
// Explore Degrees wizard's program / term / yes-no / focus-area tiles.
// Run: node tools/build-choice-tile-doc.mjs
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
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const ct = load("tokens/components/choice-tile.tokens.json").component.choiceTile;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// ---- Avatar's own initials + hash-hue logic, verbatim (same 8 hues, same
// modulo) — the program marks are Avatar's identity system in a square box.
const AVATAR_HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
// Avatar's initials rule, with one addition for programme names: only words
// that START with a letter count. Avatar was written for people, where every
// word is a name; "Art (BFA)" took the "(" of "(BFA)" and rendered "A(".
const initialsOf = (name) => {
  const words = name.trim().split(/\s+/).filter((w) => /^[a-z]/i.test(w));
  const p = words.length ? words : [name.trim()];
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
};
const hueOf = (name) => { let s = 0; for (const c of name) s += c.charCodeAt(0); return AVATAR_HUES[s % AVATAR_HUES.length]; };

const st = ct.state;
const PROGRAMS = ["Accounting", "Art History (BFA)", "Baking and Pastry Arts", "Biology (BS)", "Business Administration", "Chemistry (BS)", "Computer Science", "Economics", "English (BA)"];
const usedHues = [...new Set(PROGRAMS.map(hueOf))];

const colorPaths = [...new Set([
  refPath(st.default.bg.$value), refPath(st.default.border.$value),
  refPath(st.hover.bg.$value), refPath(st.hover.border.$value),
  refPath(st.selected.bg.$value), refPath(st.selected.border.$value),
  refPath(st.focused.ringColor.$value),
  refPath(st.disabled.bg.$value), refPath(st.disabled.label.$value), refPath(st.disabled.description.$value),
  refPath(ct.labelColor.$value), refPath(ct.descriptionColor.$value),
  "status.success", "icon.onFill", "text.onFill", "surface.default", "border.default", "text.secondary", "fill.success", "fill.neutral", "icon.secondary",
  ...usedHues.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const radius = px(resolve(ct.radius.$value));
const paddingX = px(resolve(ct.paddingX.$value));
const paddingY = px(resolve(ct.paddingY.$value));
const gap = px(resolve(ct.gap.$value));
const textGap = px(resolve(ct.textGap.$value));
const markerSize = px(resolve(ct.marker.size.$value));
const markerRadius = px(resolve(ct.marker.radius.$value));
const markerIcon = px(resolve(ct.marker.iconSize.$value));
const labelType = resolveToken(ct.label);
const descType = resolveToken(ct.description);
const ring = px(resolve(st.focused.ringWidth.$value));
const ringOffset = px(resolve(st.focused.ringOffset.$value));
// the mark's own initials type, read from Avatar's base size so the two match
const avInitials = resolveToken(avatar.size.base.initials);

const css = `${rootVars}

/* Native <input type="radio">, visually hidden with the clip-rect technique —
   the same approach Checkbox / Radio / Switch use, so arrow-key group
   navigation, form submission and screen readers all work for free. The tile
   is the paired <span>, repainted off :checked / :disabled / :focus-visible. */
.choice-tile { display: block; position: relative; cursor: pointer; }
.choice-tile__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.choice-tile__box { display: flex; align-items: center; gap: ${gap}; padding: ${paddingY} ${paddingX}; border-radius: ${radius}; background: ${cv(refPath(st.default.bg.$value))}; border: 1px solid ${cv(refPath(st.default.border.$value))}; }
.choice-tile__marker { flex-shrink: 0; width: ${markerSize}; height: ${markerSize}; border-radius: ${markerRadius}; display: inline-flex; align-items: center; justify-content: center; ${typoCss(avInitials)} }
.choice-tile__marker svg { width: ${markerIcon}; height: ${markerIcon}; }
.choice-tile__text { display: flex; flex-direction: column; gap: ${textGap}; min-width: 0; }
.choice-tile__label { color: ${cv(refPath(ct.labelColor.$value))}; ${typoCss(labelType)} }
.choice-tile__description { color: ${cv(refPath(ct.descriptionColor.$value))}; ${typoCss(descType)} }

/* rest → hover (blue.50) → selected (blue.100): the same three-step blue
   escalation Card's interactive variant uses. Selected is a persistent fill,
   NOT a thicker border — swapping border width either shifts the layout by a
   pixel or forces every resting tile to carry a heavier hairline. */
.choice-tile:hover .choice-tile__input:not(:checked):not(:disabled) ~ .choice-tile__box { background: ${cv(refPath(st.hover.bg.$value))}; border-color: ${cv(refPath(st.hover.border.$value))}; }
.choice-tile__input:checked ~ .choice-tile__box { background: ${cv(refPath(st.selected.bg.$value))}; border-color: ${cv(refPath(st.selected.border.$value))}; }
.choice-tile__input:focus-visible ~ .choice-tile__box { outline: ${ring} solid ${cv(refPath(st.focused.ringColor.$value))}; outline-offset: ${ringOffset}; }
.choice-tile__input:disabled ~ .choice-tile__box { background: ${cv(refPath(st.disabled.bg.$value))}; border-color: ${cv(refPath(st.disabled.border.$value))}; cursor: default; }
.choice-tile__input:disabled ~ .choice-tile__box .choice-tile__label { color: ${cv(refPath(st.disabled.label.$value))}; }
.choice-tile__input:disabled ~ .choice-tile__box .choice-tile__description { color: ${cv(refPath(st.disabled.description.$value))}; }
.choice-tile:has(.choice-tile__input:disabled) { cursor: default; }`;

const hueCss = usedHues.map((h) => `.ct-mark--${h} { background: ${cv(`avatar.${h}.bg`)}; color: ${cv(`avatar.${h}.text`)}; }`).join("\n");
const demoCss = `
${hueCss}
.ct-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.ct-stack { display: flex; flex-direction: column; gap: 12px; }
.ct-row { display: flex; flex-wrap: wrap; gap: 12px; }
.ct-mark--yes { background: ${cv("fill.success")}; color: ${cv("icon.onFill")}; }
.ct-mark--no { background: ${cv("fill.neutral")}; color: ${cv("icon.secondary")}; }
.ct-mark--term { background: ${cv("avatar.blue.bg")}; color: ${cv("avatar.blue.text")}; }`;

const icon = (name) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8");

let uid = 0;
function tile({ name, label, description = "", mark = "", markClass = "", checked = false, disabled = false }) {
  const id = `ct-${++uid}`;
  return `<label class="choice-tile" for="${id}">
  <input class="choice-tile__input" type="radio" id="${id}" name="${name}"${checked ? " checked" : ""}${disabled ? " disabled" : ""} />
  <span class="choice-tile__box">
    <span class="choice-tile__marker ${markClass}">${mark}</span>
    <span class="choice-tile__text">
      <span class="choice-tile__label">${esc(label)}</span>
      ${description ? `<span class="choice-tile__description">${esc(description)}</span>` : ""}
    </span>
  </span>
</label>`;
}
const programTile = (name, group) => tile({ name: group, label: name, mark: initialsOf(name), markClass: `ct-mark--${hueOf(name)}` });

const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — ChoiceTile</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
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
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; max-width: 78ch; line-height: 1.6; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 130px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("choice-tile")}</nav>
  <main>
    <h1>ChoiceTile</h1>
    <p class="sub">tokens/components/choice-tile.tokens.json · generated — a card-sized selectable option: marker + label + optional description, with a real <b>selected</b> state. Every group on this page is live: click one, or tab in and use the arrow keys.</p>

    <div class="legend">
      <div class="row"><b>Why a component</b><span>The Explore Degrees wizard carries this exact pattern on four different screens — ~50 program tiles, the term grid, the Yes/No credits question, and optional focus areas. That repetition is what makes it a component instead of a per-screen composition.</span></div>
      <div class="row"><b>Native input</b><span>A visually hidden <code class="tok">&lt;input type="radio"&gt;</code> with the tile repainted off <code class="tok">:checked</code>/<code class="tok">:disabled</code>/<code class="tok">:focus-visible</code> — the same technique Checkbox, Radio and Switch use, so arrow-key group navigation, form submission and screen readers come free. The identical recipe works for <code class="tok">type="checkbox"</code> when a screen needs multi-select.</span></div>
      <div class="row"><b>Selected is blue</b><span>Not the reference's black border (explicit call): the system already says selected = <code class="tok">bg.primary</code> + <code class="tok">fill.primary</code> everywhere — ThreadListItem, Table, the Springboard tiles. Three-step escalation, same as Card: rest → hover <code class="tok">bg.primaryHover</code> (blue.50) → selected <code class="tok">bg.primary</code> (blue.100).</span></div>
      <div class="row"><b>Not a thicker border</b><span>The persistent fill is the differentiator. Swapping border width on select either shifts the layout by a pixel or forces every resting tile to carry a heavier hairline — the opposite of what a 50-tile grid needs.</span></div>
      <div class="row"><b>Marker</b><span>The tile owns a 40px square; what goes in it is the consumer's — a program's initials on <code class="tok">avatar.*</code>'s hash-derived hue (Avatar's own logic, verbatim), an icon, or a short string. Pastel 100/600 tints, not saturated 500s: fifty saturated squares fight each other.</span></div>
      <div class="row"><b>Deferred</b><span>A stacked layout (marker above a centred label — the Springboard's mobile tile shape) and a size axis.</span></div>
    </div>

    <h2 class="big-section">States</h2>
    <div class="story-grid">
      ${storyCard("Rest, selected, disabled", `<div class="ct-stack">
        ${tile({ name: "st-a", label: "Physics", mark: "PH", markClass: "ct-mark--blue" })}
        ${tile({ name: "st-b", label: "Physics", mark: "PH", markClass: "ct-mark--blue", checked: true })}
        ${tile({ name: "st-c", label: "Physics", mark: "PH", markClass: "ct-mark--blue", disabled: true })}
      </div>`, "Each is its own group so all three read at once. Hover the first, tab to it for the focus ring.")}
      ${storyCard("With a description", `<div class="ct-stack">
        ${tile({ name: "desc", label: "Yes, I have credits", description: "We'll match them to requirements", mark: icon("check"), markClass: "ct-mark--yes", checked: true })}
        ${tile({ name: "desc", label: "No, starting fresh", description: "Straight to your results", mark: icon("remove"), markClass: "ct-mark--no" })}
      </div>`, "One live radio group — the wizard's credits question. The description is where the reference truncated its copy.")}
    </div>

    <h2 class="big-section">Program grid</h2>
    <p class="section-desc">Nine of the ~50 programs, each mark coloured by Avatar's own <code class="tok">hash(name) % 8</code> on the pastel <code class="tok">avatar.*</code> palette. One live group — pick one.</p>
    <div class="story-grid">
      ${storyCard("Pick a major", `<div class="ct-grid">${PROGRAMS.map((p) => programTile(p, "programs")).join("")}</div>`, "", true)}
    </div>

    <h2 class="big-section">Term grid</h2>
    <p class="section-desc">The start-term step. The marker carries the two-digit year, and its hue varies by year so thirteen tiles don't read as thirteen identical blue blocks.</p>
    <div class="story-grid">
      ${storyCard("When would you like to start?", `<div class="ct-grid">
        ${tile({ name: "term", label: "2027 Spring", description: "Next intake", mark: "27", markClass: "ct-mark--blue", checked: true })}
        ${tile({ name: "term", label: "2027 Summer", mark: "27", markClass: "ct-mark--blue" })}
        ${tile({ name: "term", label: "2027 Fall", mark: "27", markClass: "ct-mark--blue" })}
        ${tile({ name: "term", label: "2028 Spring", mark: "28", markClass: "ct-mark--teal" })}
        ${tile({ name: "term", label: "2028 Summer", mark: "28", markClass: "ct-mark--teal" })}
        ${tile({ name: "term", label: "2028 Fall", mark: "28", markClass: "ct-mark--teal" })}
      </div>`, "", true)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/choice-tile.html"), html);
console.log("wrote docs/choice-tile.html");
