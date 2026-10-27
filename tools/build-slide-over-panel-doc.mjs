// Regenerates docs/slide-over-panel.html from tokens/components/slide-over-panel.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Uses the native <dialog> element with showModal() — free focus-trap,
// Escape-to-close, ::backdrop, top-layer rendering, no z-index needed.
// Close button uses <form method="dialog">, the fully-declarative native way
// to close a dialog, no onclick handler. Open/close animates via
// @starting-style + transitions on transform/::backdrop (allow-discrete) —
// no JS animation.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-slide-over-panel-doc.mjs
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
const sop = load("tokens/components/slide-over-panel.tokens.json").component.slideOverPanel;
// the description under the title is Dialog's recipe; header-end demo uses a real Badge
const dialog = load("tokens/components/dialog.tokens.json").component.dialog;
const badge = load("tokens/components/badge.tokens.json").component.badge;
const breakpoint = load("tokens/primitives/breakpoint.tokens.json").breakpoint;
// Close (×) IS a Button — ghost, sm, icon-only — so its size/colors come from button.tokens.json, not a local recipe.
const ghost = load("tokens/components/button.tokens.json").component.button.ghost;
const ghostRole = (n) => n.$value.replace(/[{}]/g, "");

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
  breakpoint,
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

const role = (n) => n.$value.replace(/[{}]/g, "");
const colorPaths = [...new Set([
  "fill.neutralHoverStrong",
  "surface.default", "surface.overlay", "border.default", "border.focus", "text.default", "text.secondary", "text.onFill", "text.primary", "icon.secondary",
  "fill.neutral", "fill.neutralHover", "fill.neutralActive", "fill.primary", "fill.primaryHover", "fill.primaryActive",
  role(dialog.descriptionColor), role(badge.role.success.tint.bg), role(badge.role.success.tint.text),
  ...[ghost.state.default.icon, ghost.state.hover.fill, ghost.state.pressed.fill, ghost.state.focused.ringColor].map(ghostRole),
])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const P = (node) => px(resolve(node.$value));
const sizes = Object.fromEntries(Object.entries(sop.size).map(([k, n]) => [k, P(n)]));
const radius = P(sop.radius), bottomRadius = P(sop.bottomRadius);
const padding = P(sop.padding), gap = P(sop.gap), gutter = P(sop.phoneGutter);
const dur = `${sop.transitionDuration.$value.value}${sop.transitionDuration.$value.unit}`;
const maxH = `${sop.bottomMaxHeight.$value.value}${sop.bottomMaxHeight.$value.unit}`;
const bp = resolve(dialog.sheet.breakpoint.$value);
const shadow = resolveToken(sop.shadow);
const shadowCss = `${px(shadow.offsetX)} ${px(shadow.offsetY)} ${px(shadow.blur)} ${px(shadow.spread)} ${shadow.color}`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const closeSize = P(ghost.size.sm.height);
const iconClose = fs.readFileSync(path.join(root, "assets/icons/material-filled/close.svg"), "utf8").replace("<svg ", '<svg class="slide-over-panel__close-icon" aria-hidden="true" ');
const slide = (axis, from) => `transform: translate${axis}(${from}); transition: transform ${dur} ease, overlay ${dur} allow-discrete, display ${dur} allow-discrete;`;

const css = `${rootVars}

dialog.slide-over-panel { position: fixed; margin: 0; padding: 0; border: none; box-sizing: border-box; background: ${cv(role(sop.bg))}; box-shadow: ${shadowCss}; }
dialog.slide-over-panel::backdrop { background: ${cv(role(sop.overlay))}; opacity: 0; transition: opacity ${dur} ease allow-discrete; }
dialog.slide-over-panel[open]::backdrop { opacity: 1; }
@starting-style { dialog.slide-over-panel[open]::backdrop { opacity: 0; } }

/* side placements: full height, square corners (three edges sit flush), a strip of page left visible on a phone */
dialog.slide-over-panel--right, dialog.slide-over-panel--left { top: 0; bottom: 0; height: 100dvh; max-height: none; width: ${sizes.sm}; max-width: calc(100vw - ${gutter}); border-radius: ${radius}; }
dialog.slide-over-panel--md { width: ${sizes.md}; }
dialog.slide-over-panel--lg { width: ${sizes.lg}; }
dialog.slide-over-panel--right { right: 0; left: auto; ${slide("X", "100%")} }
dialog.slide-over-panel--left { left: 0; right: auto; ${slide("X", "-100%")} }
dialog.slide-over-panel--right[open], dialog.slide-over-panel--left[open] { transform: translateX(0); }
@starting-style { dialog.slide-over-panel--right[open] { transform: translateX(100%); } dialog.slide-over-panel--left[open] { transform: translateX(-100%); } }

/* bottom placement: full width, as tall as its content up to ${maxH}, top corners rounded (its one free edge) */
dialog.slide-over-panel--bottom { top: auto; bottom: 0; left: 0; right: 0; width: 100%; max-width: 100%; max-height: ${maxH}; border-radius: ${bottomRadius} ${bottomRadius} 0 0; ${slide("Y", "100%")} }
dialog.slide-over-panel--bottom[open] { transform: translateY(0); }
@starting-style { dialog.slide-over-panel--bottom[open] { transform: translateY(100%); } }

.slide-over-panel__content { display: flex; flex-direction: column; height: 100%; max-height: inherit; box-sizing: border-box; font-family: ${cv("family.sans")}; }
.slide-over-panel__header { flex-shrink: 0; box-sizing: border-box; display: flex; align-items: flex-start; gap: ${gap}; padding: ${padding}; border-bottom: 1px solid ${cv(role(sop.divider))}; }
/* title + description: at least as tall as the × and centred in it */
.slide-over-panel__heading { flex: 1; min-width: 0; min-height: ${closeSize}; display: flex; flex-direction: column; justify-content: center; gap: ${P(dialog.headerGap)}; }
.slide-over-panel__title { margin: 0; color: ${cv(role(sop.titleColor))}; ${typoCss(resolveToken(sop.title))} }
.slide-over-panel__description { margin: 0; color: ${cv(role(dialog.descriptionColor))}; ${typoCss(resolveToken(dialog.description))} }
.slide-over-panel__description a { color: ${cv("text.primary")}; }
/* header end: any small thing before the × — a status Badge, a button, a ⋯ menu */
.slide-over-panel__header-end { flex-shrink: 0; min-height: ${closeSize}; display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; }
.slide-over-panel__body { flex: 1; min-height: 0; box-sizing: border-box; overflow: auto; padding: ${padding}; }
.slide-over-panel__body-text { margin: 0; color: ${cv(role(sop.bodyColor))}; ${typoCss(resolveToken(sop.body))} }
/* footer: a slot — any actions, right-aligned */
.slide-over-panel__footer { flex-shrink: 0; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: ${gap}; justify-content: flex-end; padding: ${padding}; border-top: 1px solid ${cv(role(sop.divider))}; }

.slide-over-panel__close { flex-shrink: 0; box-sizing: border-box; width: ${closeSize}; height: ${closeSize}; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${P(ghost.radius)}; background: transparent; padding: 0; cursor: pointer; color: ${cv(ghostRole(ghost.state.default.icon))}; }
.slide-over-panel__close:hover { background: ${cv(ghostRole(ghost.state.hover.fill))}; }
.slide-over-panel__close:active { background: ${cv(ghostRole(ghost.state.pressed.fill))}; }
.slide-over-panel__close:focus-visible { outline: ${P(ghost.state.focused.ringWidth)} solid ${cv(ghostRole(ghost.state.focused.ringColor))}; outline-offset: ${P(ghost.state.focused.ringOffset)}; }
.slide-over-panel__close-icon { width: ${P(ghost.size.sm.iconSize)}; height: ${P(ghost.size.sm.iconSize)}; display: block; }`;

const demoCss = `
.ov-btn { box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border-radius: ${px(resolve("radius.default"))}; border: none; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(resolveToken(get("text-style.heading-base")))} }
.ov-btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
.ov-btn--secondary:hover { background: ${cv("fill.neutralHoverStrong")}; }
.ov-btn--secondary:active { background: ${cv("fill.neutralActive")}; }
.ov-btn--primary { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; font-weight: 600; }
.ov-btn--primary:hover { background: ${cv("fill.primaryHover")}; }
.ov-btn--primary:active { background: ${cv("fill.primaryActive")}; }
.ov-btn:focus-visible { outline: ${px(resolve("dim.1"))} solid ${cv("border.focus")}; outline-offset: ${px(resolve("dim.0_5"))}; }
/* a real Badge (success tint, sm) for the header-end demo */
.demo-badge { display: inline-flex; align-items: center; height: ${P(badge.size.sm.height)}; padding: 0 ${P(badge.size.sm.paddingX)}; border-radius: ${P(badge.radius)}; background: ${cv(role(badge.role.success.tint.bg))}; color: ${cv(role(badge.role.success.tint.text))}; ${typoCss(resolveToken(badge.size.sm.label))} }`;

const BODY = "Row-click drill-in: the list behind stays in context under the overlay. Click the overlay or press Escape to close.";
// One shape for every story; live and printed come from the same options.
function panel(id, o, live) {
  const cls = `slide-over-panel slide-over-panel--${o.placement || "right"}${o.size && o.size !== "sm" ? ` slide-over-panel--${o.size}` : ""}`;
  const desc = o.description ? `\n        <p class="slide-over-panel__description" id="${id}-desc">${o.description}</p>` : "";
  const end = o.headerEnd ? `\n      <div class="slide-over-panel__header-end">${o.headerEnd}</div>` : "";
  const footer = o.footer ? `\n    <div class="slide-over-panel__footer">\n      ${o.footer}\n    </div>` : "";
  return `<dialog class="${cls}" id="${id}" aria-labelledby="${id}-title"${o.description ? ` aria-describedby="${id}-desc"` : ""}>
  <div class="slide-over-panel__content">${o.title ? `
    <div class="slide-over-panel__header">
      <div class="slide-over-panel__heading">
        <h2 class="slide-over-panel__title" id="${id}-title">${o.title}</h2>${desc}
      </div>${end}
      <form method="dialog"><button class="slide-over-panel__close" aria-label="Close">${live ? iconClose : "…"}</button></form>
    </div>` : ""}
    <div class="slide-over-panel__body">
      <p class="slide-over-panel__body-text">${o.body || BODY}</p>
    </div>${footer}
  </div>
</dialog>`;
}
const actions = (a, b) => `<form method="dialog"><button class="ov-btn ov-btn--secondary">${a}</button></form><form method="dialog"><button class="ov-btn ov-btn--primary">${b}</button></form>`;
const story = (title, id, o, note) => `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview"><button class="ov-btn ov-btn--secondary" data-panel-open="${id}">Open panel</button>${panel(id, o, true)}</div>
        <pre class="code"><code>${esc(panel(id, o, false))}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;

const openScript = `document.querySelectorAll('[data-panel-open]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.panelOpen).showModal());
});`;
// showModal() gives Escape for free, not click-outside. The dialog's padding is 0
// and __content fills it, so a click on the <dialog> itself can only be the backdrop.
const dismissScript = `document.querySelectorAll('dialog.slide-over-panel').forEach((dlg) => {
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — SlideOverPanel</title>
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

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 64px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .demo-slot { display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border-strong); border-radius: 8px; font: 12px var(--mono); color: var(--text-muted); }
  .placeholder-note { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); border: 0.5px dashed var(--border-strong); border-radius: 6px; padding: 4px 10px; margin-top: 1.5rem; }

  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("slide-over-panel")}</nav>
  <main>
    <h1>SlideOverPanel</h1>
    <p class="sub">tokens/components/slide-over-panel.tokens.json · generated — a modal panel attached to an edge: a record's detail from a row click, filters, settings. Renamed from Drawer (2026-10-27, the Storybook name).</p>

    <div class="legend">
      <div class="row"><b>Native &lt;dialog&gt;</b><span>Real <code class="tok">showModal()</code> — focus trap, Escape, ::backdrop, top layer. Click-outside is a small script (below). Every demo opens for real.</span></div>
      <div class="row"><b>Placement</b><span>right (default) · left · bottom. Bottom is full width, as tall as its content up to ${maxH}.</span></div>
      <div class="row"><b>Sizes</b><span>Side placements: <code class="tok">sm</code> ${sizes.sm} (filters, settings — default) · <code class="tok">--md</code> ${sizes.md} (a record's detail) · <code class="tok">--lg</code> ${sizes.lg} (dense content, editing). On a narrow screen a side panel leaves ${gutter} of the page visible.</span></div>
      <div class="row"><b>Corners</b><span>Square on the sides — three edges sit flush to the screen. Bottom rounds its <b>top</b> corners (${bottomRadius}, Dialog's radius): Dialog md/lg/xl become this panel on a phone and keep their corner.</span></div>
      <div class="row"><b>Header</b><span>Title + optional description (Dialog's recipe: body-sm, text.secondary, ${P(dialog.headerGap)} under the title, <code class="tok">aria-describedby</code>; a link is fine inside it) + an optional <b>header-end slot</b> before the × — a status Badge, a button, a ⋯ menu.</span></div>
      <div class="row"><b>Footer</b><span>A slot: any actions, right-aligned, Primary last. Header and footer are both optional — a panel can be body-only.</span></div>
      <div class="row"><b>vs Dialog</b><span>Dialog is centred and holds a task; SlideOverPanel keeps the page it came from beside it (a list, a table) — use it for drill-in detail and side tools.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <p class="section-desc">Open each — Escape, the overlay or a footer button closes it.</p>
    <div class="story-grid">
      ${story("Default", "sop-default", { title: "Customer detail" })}
      ${story("With description", "sop-desc", { title: "Customer detail", description: "CX0001 · Tue May 19" }, "One line of context under the title.")}
      ${story("Header end", "sop-end", { title: "Customer detail", description: "CX0001 · Tue May 19", headerEnd: `<span class="demo-badge">Active</span>` }, "The slot before the ×: here a real Badge (success tint, sm).")}
      ${story("With footer", "sop-footer", { title: "Edit customer", description: "CX0001", size: "md", footer: actions("Cancel", "Save") }, "The footer slot: any actions, right-aligned.")}
      ${story("Link in the description", "sop-link", { title: "Customer detail", description: `CX0001 · <a href="#sop-link">Open in CRM</a>` }, "Storybook's Interactive Subtitle — just a link inside the description.")}
      ${story("Left", "sop-left", { title: "Filters", placement: "left", footer: actions("Reset", "Apply") })}
      ${story("lg — wide", "sop-lg", { title: "Customer detail", description: "Wider layout for dense content", size: "lg" }, `${sizes.lg}.`)}
      ${story("Bottom", "sop-bottom", { title: "Tue, Oct 27", description: "3 appointments", placement: "bottom" }, "Top corners rounded; full width; as tall as its content.")}
      ${story("Body only", "sop-plain", {}, "No header, no footer — Escape and click-outside are the only ways out, which is why click-outside isn't optional.")}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Scripts</h2>
    <p class="section-desc">Open, and click-outside-to-close (showModal() only gives Escape).</p>
    <pre class="code"><code>${esc(openScript + "\n\n" + dismissScript)}</code></pre>
  </main>
</div>
<script>${openScript}
${dismissScript}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/slide-over-panel.html"), html);
console.log("wrote docs/slide-over-panel.html");
