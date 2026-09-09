// Regenerates docs/split-button.html from tokens/components/split-button.tokens.json.
// A primary button + attached chevron segment that opens a Menu. Shares Button
// primary's fill/size; a darker fill.primaryActive seam splits the two segments.
// Run: node tools/build-split-button-doc.mjs
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
const shadowPrim = load("tokens/primitives/shadow.tokens.json").shadow;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const sb = load("tokens/components/split-button.tokens.json").component.splitButton;
const menu = load("tokens/components/menu.tokens.json").component.menu;

const registry = { color: colorPrim, dim, radius: radiusPrim, shadow: shadowPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
function typoCss(t) { return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; }

const colorPaths = ["fill.primary", "fill.primaryHover", "fill.primaryActive", "text.onFill", "icon.onFill", "border.focus", "surface.default", "border.default", "text.default", "icon.secondary", "fill.neutralHover"];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const radius = px(resolve(sb.radius.$value));
const h = px(resolve(sb.size.height.$value));
const padX = px(resolve(sb.size.paddingX.$value));
const gap = px(resolve(sb.size.gap.$value));
const iconSize = px(resolve(sb.size.iconSize.$value));
const label = resolveToken(get(sb.size.label.$value));
const chevW = px(resolve(sb.size.chevronWidth.$value));
const chevIcon = px(resolve(sb.size.chevronIcon.$value));
const ringW = px(resolve(sb.focus.ringWidth.$value));
const ringOff = px(resolve(sb.focus.ringOffset.$value));

// menu recipe (resolved from menu.tokens.json — the chevron opens the real Menu)
const mRadius = px(resolve(menu.radius.$value));
const mPadding = px(resolve(menu.padding.$value));
const mItemRadius = px(resolve(menu.itemRadius.$value));
const mItemPadX = px(resolve(menu.itemPaddingX.$value));
const mItemPadY = px(resolve(menu.itemPaddingY.$value));
const mItemGap = px(resolve(menu.itemGap.$value));
const mLabel = resolveToken(get(menu.label.$value));
const mIconSize = px(resolve(menu.iconSize.$value));
const mShadow = resolveToken(menu.shadow);
const mShadowCss = `${px(mShadow.offsetX)} ${px(mShadow.offsetY)} ${px(mShadow.blur)} ${px(mShadow.spread)} ${mShadow.color}`;

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconEdit = iconOf("edit", "split__icon");
const iconChevron = iconOf("expand_more", "split__chevron-icon");
const iconPerson = iconOf("person", "menu__icon");
const iconGroup = iconOf("group", "menu__icon");

const css = `${rootVars}

.split { display: inline-flex; align-items: stretch; height: ${h}; border-radius: ${radius}; font-family: ${cv("family.sans")}; }
.split__main, .split__chevron { border: none; background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; cursor: pointer; display: inline-flex; align-items: center; }
.split__main { gap: ${gap}; padding: 0 ${padX}; border-radius: ${radius} 0 0 ${radius}; ${typoCss(label)} }
.split__chevron { justify-content: center; width: ${chevW}; padding: 0; border-radius: 0 ${radius} 0 ${radius} 0; border-radius: 0 ${radius} ${radius} 0; border-left: 1px solid ${cv(refPath(sb.divider.$value))}; }
.split__icon { width: ${iconSize}; height: ${iconSize}; color: ${cv("icon.onFill")}; }
.split__chevron-icon { width: ${chevIcon}; height: ${chevIcon}; color: ${cv("icon.onFill")}; }
.split__main:hover, .split__chevron:hover { background: ${cv("fill.primaryHover")}; }
.split__main:active, .split__chevron:active { background: ${cv("fill.primaryActive")}; }
.split__main:focus-visible, .split__chevron:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: ${ringOff}; position: relative; }

/* the Menu the chevron opens — resolved from menu.tokens.json */
.menu { margin: 0; box-sizing: border-box; padding: ${mPadding}; border-radius: ${mRadius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${mShadowCss}; min-width: 200px; font-family: ${cv("family.sans")}; }
.menu__item { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${mItemGap}; padding: ${mItemPadY} ${mItemPadX}; border: none; background: none; border-radius: ${mItemRadius}; cursor: pointer; text-align: left; color: ${cv("text.default")}; ${typoCss(mLabel)} }
.menu__item:hover { background: ${cv("fill.neutralHover")}; }
.menu__icon { width: ${mIconSize}; height: ${mIconSize}; color: ${cv("icon.secondary")}; flex-shrink: 0; }`;

const js = `document.querySelectorAll(".split__chevron").forEach((btn) => {
  var menu = document.getElementById(btn.getAttribute("popovertarget"));
  if (!menu) return;
  menu.addEventListener("toggle", (e) => {
    if (e.newState === "open") {
      var r = btn.getBoundingClientRect();
      menu.style.position = "fixed"; menu.style.margin = "0";
      menu.style.top = (r.bottom + 4) + "px";
      menu.style.left = Math.max(8, r.right - menu.offsetWidth) + "px";
    }
  });
});`;

function storyCard(title, live, note = "") { return `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`; }

const splitDemo = `<div class="split">
      <button class="split__main" type="button">${iconEdit}New Message</button>
      <button class="split__chevron" type="button" popovertarget="sb-menu" aria-label="More send options" aria-haspopup="menu">${iconChevron}</button>
    </div>
    <div class="menu" id="sb-menu" popover role="menu">
      <button class="menu__item" role="menuitem" type="button">${iconPerson}New Message</button>
      <button class="menu__item" role="menuitem" type="button">${iconGroup}New Group Message</button>
    </div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — SplitButton</title>
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
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }
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
  <nav class="side">${renderNav("split-button")}</nav>
  <main>
    <h1>SplitButton</h1>
    <p class="sub">tokens/components/split-button.tokens.json · generated — a primary button with an attached chevron segment: the main part does the default action, the chevron opens a Menu of alternatives. Shares Button primary's fill/size; the chevron below opens the real Menu — try it.</p>

    <div class="legend">
      <div class="row"><b>One button</b><span>Two segments in one pill sharing Button primary's <code class="tok">fill.primary</code> + base size. A 1px <code class="tok">fill.primaryActive</code> seam is the only split at rest; each segment darkens on hover/press independently.</span></div>
      <div class="row"><b>Chevron</b><span>Opens the real <code class="tok">Menu</code> (native popover, resolved from menu.tokens.json) — this component owns the split trigger, the Menu owns the list. Main-part = default action, chevron = the rest.</span></div>
      <div class="row"><b>Use</b><span>"New Message ▾" → New Message / New Group Message. The one entry point where a primary action has a close sibling.</span></div>
    </div>

    <h2 class="big-section">New Message</h2>
    <p class="section-desc">Click the chevron to open the Menu.</p>
    <div class="story-grid">
      ${storyCard("Split primary", splitDemo)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/split-button.html"), html);
console.log("wrote docs/split-button.html");
