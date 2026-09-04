// Regenerates docs/avatar-group.html from tokens/components/avatar-group.tokens.json.
// AvatarGroup composes the real Avatar (its diameters/hues) and owns only the
// stacking recipe: overlap, the surface ring that separates overlapping circles,
// and the trailing "+N" overflow chip. Avatar tokens are loaded into the
// registry so avatar-group's cross-refs ({avatar.size.*.diameter}) resolve.
// Run: node tools/build-avatar-group-doc.mjs
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
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;
const grp = load("tokens/components/avatar-group.tokens.json").component.avatarGroup;

// NOTE: the `avatar.*` namespace is used by BOTH the semantic hue group and the
// Avatar component; the semantic spread wins here, so avatar-group's tokens
// reference primitives directly (dim.8/dim.10 = Avatar sm/base) rather than
// cross-referencing the component. `avatar` (component) is read only for the
// initials typography, via the local const below.
const registry = {
  color: colorPrim, dim, radius: radiusPrim,
  family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking,
  "text-style": textStyle, ...semantic,
};
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; }
  if (v && typeof v === "object" && "value" in v) return v;
  return resolveValue(v);
}
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const AVATAR_HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
const colorPaths = [
  "surface.default", "border.default", "fill.neutral", "text.secondary",
  ...AVATAR_HUES.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const sizes = ["sm", "base"].map((k) => ({
  key: k,
  diameter: px(resolve(grp.size[k].diameter.$value)),
  overlap: px(resolve(grp.size[k].overlap.$value)),
}));
const ringW = px(resolve(grp.ring.width.$value));
const overflowLabel = resolveToken(grp.overflow.label);
const avInitialsSm = resolveToken(avatar.size.sm.initials);
const avInitialsBase = resolveToken(avatar.size.base.initials);

const css = `${rootVars}

.avatar-group { display: inline-flex; align-items: center; }
.avatar-group__item { box-sizing: border-box; position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 999px; border: 1px solid ${cv("border.default")}; box-shadow: 0 0 0 ${ringW} ${cv(refPath(grp.ring.color.$value))}; font-family: ${cv("family.sans")}; user-select: none; }
.avatar-group__item:not(:first-child) { margin-left: var(--ag-overlap); }
.avatar-group__item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-group__initials { text-transform: uppercase; }
.avatar-group__more { color: ${cv(refPath(grp.overflow.text.$value))}; background: ${cv(refPath(grp.overflow.bg.$value))}; ${typoCss(overflowLabel)} }
${sizes.map((s) => `.avatar-group--${s.key} { --ag-overlap: -${s.overlap}; }
.avatar-group--${s.key} .avatar-group__item { width: ${s.diameter}; height: ${s.diameter}; }`).join("\n")}
.avatar-group--sm .avatar-group__initials { ${typoCss(avInitialsSm)} }
.avatar-group--base .avatar-group__initials { ${typoCss(avInitialsBase)} }
${AVATAR_HUES.map((h) => `.ag-${h} { background: ${cv(`avatar.${h}.bg`)}; } .ag-${h} .avatar-group__initials { color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}`;

const PEOPLE = [
  { name: "Maya Okafor", hue: "magenta" }, { name: "Cait Adelson", hue: "blue" },
  { name: "Calam Xavier", hue: "amber" }, { name: "Allison Rao", hue: "teal" },
  { name: "L Arcos", hue: "green" }, { name: "Dana Torres", hue: "violet" },
];
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
function groupMarkup(size, visible, total, { photo = false } = {}) {
  const shown = PEOPLE.slice(0, visible).map((p, i) => {
    if (photo && i === 0) return `<span class="avatar-group__item"><img src="../assets/avatars/betty-locherty.jpg" alt="" /></span>`;
    return `<span class="avatar-group__item ag-${p.hue}"><span class="avatar-group__initials">${initials(p.name)}</span></span>`;
  }).join("\n        ");
  const more = total > visible ? `\n        <span class="avatar-group__item avatar-group__more">+${total - visible}</span>` : "";
  return `<span class="avatar-group avatar-group--${size}" role="img" aria-label="${total} people">
        ${shown}${more}</span>`;
}

function storyCard(title, live, code, note = "") {
  return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${code ? `<pre class="code"><code>${esc(code)}</code></pre>` : ""}${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — AvatarGroup</title>
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
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); } .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 130px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 52px; display: flex; align-items: center; padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("avatar-group")}</nav>
  <main>
    <h1>AvatarGroup</h1>
    <p class="sub">tokens/components/avatar-group.tokens.json · generated — an overlapping stack of the real Avatar with a trailing "+N" overflow chip. The group owns only the stacking recipe; diameters and hues come straight from Avatar.</p>

    <div class="legend">
      <div class="row"><b>Composes Avatar</b><span>Diameters (sm 32 / base 40) and the initials/hue system are Avatar's own — resolved through <code class="tok">{avatar.size.*.diameter}</code>, not re-declared.</span></div>
      <div class="row"><b>Overlap</b><span>Each avatar shifts left by <code class="tok">size.overlap</code> (sm 10 / base 12), overlapping ~a third of the previous — the standard stack density.</span></div>
      <div class="row"><b>Ring</b><span>A <code class="tok">surface.default</code> ring (box-shadow, 2px) around each item so overlapping circles read as distinct — like a gap punched out of the layer behind. Sits over Avatar's own 1px hairline.</span></div>
      <div class="row"><b>+N overflow</b><span>A same-diameter chip in <code class="tok">fill.neutral</code> with secondary ink — reads as "more", not another person. Cap visible avatars, the rest collapse into it.</span></div>
    </div>

    <h2 class="big-section">Sizes</h2>
    <p class="section-desc">sm / base, four visible + a "+N".</p>
    <div class="story-grid">
      ${storyCard("sm — 32px", groupMarkup("sm", 4, 39), groupMarkup("sm", 4, 39).replace(/\n\s+/g, "\n  ").trim())}
      ${storyCard("base — 40px", groupMarkup("base", 4, 39), "")}
    </div>

    <h2 class="big-section">Variations</h2>
    <div class="story-grid">
      ${storyCard("With a photo", groupMarkup("base", 4, 12, { photo: true }), "", "Avatar's photo tier works inside the stack unchanged.")}
      ${storyCard("No overflow", groupMarkup("base", 3, 3), "", "When everyone fits, the +N chip is simply omitted.")}
      ${storyCard('Group "M +35"', groupMarkup("sm", 2, 37), "", "The group-message recipient stack: 2 shown + 35 more.")}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/avatar-group.html"), html);
console.log("wrote docs/avatar-group.html");
