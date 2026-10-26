// Regenerates docs/modal.html from tokens/components/modal.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Native <dialog> with showModal() — free focus-trap, Escape-to-close,
// ::backdrop, top-layer. Unlike Drawer, needs almost no positioning CSS:
// showModal()'s own UA stylesheet already centers a <dialog>. Close buttons
// use <form method="dialog">, the fully-declarative native way to close.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-modal-doc.mjs
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
const modal = load("tokens/components/modal.tokens.json").component.modal;
// Below breakpoint.sm, md/lg/xl take Drawer's bottom placement — its shape is read from drawer.tokens.json.
const drawer = load("tokens/components/drawer.tokens.json").component.drawer;
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

const colorPaths = [
  "fill.neutralHoverStrong",
  "surface.default", "surface.overlay", "border.default", "border.focus", "text.default", "text.secondary", "text.onFill", "icon.secondary",
  "fill.neutral", "fill.neutralHover", "fill.neutralActive", "fill.danger", "fill.dangerHover", "fill.primary", "fill.primaryHover",
].concat([ghost.state.default.icon, ghost.state.hover.fill, ghost.state.pressed.fill, ghost.state.focused.ringColor].map(ghostRole)).filter((p, i, a) => a.indexOf(p) === i);
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const sizes = Object.fromEntries(Object.entries(modal.size).map(([k, n]) => [k, px(resolve(n.$value))]));
const gutter = px(resolve(modal.viewportGutter.$value));
const capped = (w) => `min(${w}, calc(100vw - ${gutter} * 2))`;
const bp = resolve(modal.sheet.breakpoint.$value);
const descType = resolveToken(modal.description);
const headerGap = px(resolve(modal.headerGap.$value));
const drRadius = px(resolve(drawer.radius.$value));
const drMax = `${drawer.bottomMaxHeight.$value.value}${drawer.bottomMaxHeight.$value.unit}`;
const drDur = `${drawer.transitionDuration.$value.value}${drawer.transitionDuration.$value.unit}`;
const drShadow = resolveToken(drawer.shadow);
const drShadowCss = `${px(drShadow.offsetX)} ${px(drShadow.offsetY)} ${px(drShadow.blur)} ${px(drShadow.spread)} ${drShadow.color}`;
const radius = px(resolve(modal.radius.$value));
const padding = px(resolve(modal.padding.$value));
const gap = px(resolve(modal.gap.$value));
const duration = modal.transitionDuration.$value;
const titleType = resolveToken(modal.title);
const bodyType = resolveToken(modal.body);
const shadow = resolveToken(modal.shadow);
const shadowCss = `${px(shadow.offsetX)} ${px(shadow.offsetY)} ${px(shadow.blur)} ${px(shadow.spread)} ${shadow.color}`;
const dur = `${duration.value}${duration.unit}`;

const iconClose = fs.readFileSync(path.join(root, "assets/icons/material-filled/close.svg"), "utf8").replace("<svg ", '<svg class="modal__close-icon" ');

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const css = `${rootVars}

dialog.modal { margin: auto; padding: 0; border: none; box-sizing: border-box; width: ${capped(sizes.sm)}; max-width: none; max-height: 85dvh; border-radius: ${radius}; background: ${cv("surface.default")}; box-shadow: ${shadowCss};
  opacity: 0; transform: scale(0.96); transition: opacity ${dur} ease, transform ${dur} ease, overlay ${dur} allow-discrete, display ${dur} allow-discrete; }
dialog.modal[open] { opacity: 1; transform: scale(1); }
@starting-style { dialog.modal[open] { opacity: 0; transform: scale(0.96); } }
dialog.modal::backdrop { background: ${cv("surface.overlay")}; opacity: 0; transition: opacity ${dur} ease allow-discrete; }
dialog.modal[open]::backdrop { opacity: 1; }
@starting-style { dialog.modal[open]::backdrop { opacity: 0; } }
dialog.modal--md { width: ${capped(sizes.md)}; }
dialog.modal--lg { width: ${capped(sizes.lg)}; }
dialog.modal--xl { width: ${capped(sizes.xl)}; }

/* Phone (< breakpoint.sm): md/lg/xl take Drawer's bottom placement — shape
   from drawer.tokens.json. sm stays a centered card. */
@media (max-width: ${bp.value - 0.02}${bp.unit}) {
  dialog.modal--md, dialog.modal--lg, dialog.modal--xl { margin: 0; inset: auto 0 0 0; width: 100%; max-height: ${drMax}; border-radius: ${drRadius}; box-shadow: ${drShadowCss};
    opacity: 1; transform: translateY(100%); transition: transform ${drDur} ease, overlay ${drDur} allow-discrete, display ${drDur} allow-discrete; }
  dialog.modal--md[open], dialog.modal--lg[open], dialog.modal--xl[open] { transform: translateY(0); }
  @starting-style { dialog.modal--md[open], dialog.modal--lg[open], dialog.modal--xl[open] { transform: translateY(100%); } }
  :is(dialog.modal--md, dialog.modal--lg, dialog.modal--xl) .modal__content { max-height: ${drMax}; }
}

.modal__content { display: flex; flex-direction: column; max-height: 85dvh; box-sizing: border-box; font-family: ${cv("family.sans")}; }
.modal__header { flex-shrink: 0; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: space-between; gap: ${gap}; padding: ${padding}; border-bottom: 1px solid ${cv("border.default")}; }
/* At least as tall as the × and centered in it: a lone title lines up with
   the ×, a title + description grows down from the top. */
.modal__heading { display: flex; flex-direction: column; justify-content: center; gap: ${headerGap}; min-width: 0; min-height: ${px(resolve(ghost.size.sm.height.$value))}; }
.modal__title { margin: 0; color: ${cv("text.default")}; ${typoCss(titleType)} }
.modal__description { margin: 0; color: ${cv(modal.descriptionColor.$value.replace(/[{}]/g, ""))}; ${typoCss(descType)} }
.modal__body { flex: 1; box-sizing: border-box; overflow: auto; padding: ${padding}; }
.modal__body-text { margin: 0; color: ${cv("text.secondary")}; ${typoCss(bodyType)} }
.modal__footer { flex-shrink: 0; box-sizing: border-box; display: flex; gap: ${gap}; justify-content: flex-end; padding: ${padding}; border-top: 1px solid ${cv("border.default")}; }

.modal__close { flex-shrink: 0; box-sizing: border-box; width: ${px(resolve(ghost.size.sm.height.$value))}; height: ${px(resolve(ghost.size.sm.height.$value))}; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${px(resolve(ghost.radius.$value))}; background: transparent; padding: 0; cursor: pointer; color: ${cv(ghostRole(ghost.state.default.icon))}; }
.modal__close:hover { background: ${cv(ghostRole(ghost.state.hover.fill))}; }
.modal__close:active { background: ${cv(ghostRole(ghost.state.pressed.fill))}; }
.modal__close:focus-visible { outline: ${px(resolve(ghost.state.focused.ringWidth.$value))} solid ${cv(ghostRole(ghost.state.focused.ringColor))}; outline-offset: ${px(resolve(ghost.state.focused.ringOffset.$value))}; }
.modal__close-icon { width: ${px(resolve(ghost.size.sm.iconSize.$value))}; height: ${px(resolve(ghost.size.sm.iconSize.$value))}; display: block; }

.ov-btn { box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border-radius: ${px(resolve("radius.default"))}; border: none; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(resolveToken(get("text-style.heading-base")))} }
.ov-btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
/* Strong tier — this button rests on fill.neutral (gray.100), where the
   fill.neutralHover wash is the same colour and the hover shows nothing. */
.ov-btn--secondary:hover { background: ${cv("fill.neutralHoverStrong")}; }
.ov-btn--secondary:active { background: ${cv("fill.neutralActive")}; }
.ov-btn--primary { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; font-weight: 600; }
.ov-btn--primary:hover { background: ${cv("fill.primaryHover")}; }
.ov-btn--danger { background: ${cv("fill.danger")}; color: ${cv("text.onFill")}; font-weight: 600; }
.ov-btn--danger:hover { background: ${cv("fill.dangerHover")}; }
.ov-btn:focus-visible { outline: ${px(resolve("dim.1"))} solid ${cv("border.focus")}; outline-offset: ${px(resolve("dim.0_5"))}; }`;

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

// One shape for every story: the live markup and the printed sample are built
// from the same options. `slot` = height of a Body placeholder (any content
// goes there); without it the body is the confirm sentence.
const CONFIRM = { title: "Delete project?", text: "This can't be undone. Everything in this project will be permanently deleted.", cancel: "Cancel", confirm: "Delete", tone: "danger" };
function parts(id, o) {
  const cls = `modal${o.size && o.size !== "sm" ? ` modal--${o.size}` : ""}`;
  const descId = `${id}-desc`;
  const body = o.slot ? `<div class="demo-slot" style="height: ${o.slot}px">Body — any content</div>` : `<p class="modal__body-text">${esc(o.text)}</p>`;
  return { cls, descId, body };
}
function modalMarkup(id, o) {
  const { cls, descId, body } = parts(id, o);
  return `<button class="ov-btn ov-btn--secondary" data-modal-open="${id}">${o.open || "Open modal"}</button>
    <dialog class="${cls}" id="${id}" aria-labelledby="${id}-title"${o.description ? ` aria-describedby="${descId}"` : ""}>
      <div class="modal__content">
        ${o.title ? `<div class="modal__header">
          <div class="modal__heading">
            <h2 class="modal__title" id="${id}-title">${esc(o.title)}</h2>${o.description ? `
            <p class="modal__description" id="${descId}">${esc(o.description)}</p>` : ""}
          </div>
          <form method="dialog"><button class="modal__close" aria-label="Close">${iconClose}</button></form>
        </div>` : ""}
        <div class="modal__body">
          ${body}
        </div>
        ${o.confirm ? `<div class="modal__footer">
          <form method="dialog"><button class="ov-btn ov-btn--secondary">${o.cancel}</button></form>
          <form method="dialog"><button class="ov-btn ov-btn--${o.tone || "primary"}">${o.confirm}</button></form>
        </div>` : ""}
      </div>
    </dialog>`;
}
function modalCode(id, o) {
  const { cls, descId } = parts(id, o);
  return `<dialog class="${cls}" id="${id}" aria-labelledby="${id}-title"${o.description ? ` aria-describedby="${descId}"` : ""}>
  <div class="modal__content">
${o.title ? `    <div class="modal__header">
      <div class="modal__heading">
        <h2 class="modal__title" id="${id}-title">${o.title}</h2>
${o.description ? `        <p class="modal__description" id="${descId}">${o.description}</p>
` : ""}      </div>
      <form method="dialog"><button class="modal__close" aria-label="Close">…</button></form>
    </div>
` : ""}    <div class="modal__body">
      ${o.slot ? "<!-- any content -->" : `<p class="modal__body-text">${o.text}</p>`}
    </div>
${o.confirm ? `    <div class="modal__footer">
      <form method="dialog"><button>${o.cancel}</button></form>
      <form method="dialog"><button>${o.confirm}</button></form>
    </div>
` : ""}  </div>
</dialog>`;
}
const story = (title, id, o, note) => storyCard(title, modalMarkup(id, o), modalCode(id, o), note);

const openScript = `document.querySelectorAll('[data-modal-open]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.modalOpen).showModal();
  });
});`;

// showModal() gives Escape-to-close for free, but NOT click-outside-to-close —
// same gotcha as Drawer, same fix: the dialog's own padding is 0 and
// .modal__content fills 100% of it, so a click landing on the <dialog>
// element itself (not a descendant) can only mean it hit the backdrop.
const dismissScript = `document.querySelectorAll('dialog.modal').forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Modal</title>
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
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("modal")}
  </nav>
  <main>
    <h1>Modal</h1>
    <p class="sub">tokens/components/modal.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, not hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>Native &lt;dialog&gt;</b><span>Real <code class="tok">showModal()</code> — free focus-trap, Escape-to-close, ::backdrop, top-layer (no z-index). This demo is genuinely interactive.</span></div>
      <div class="row"><b>Centering is free</b><span>Unlike Drawer, no positioning CSS needed at all — showModal()'s own UA stylesheet already centers a &lt;dialog&gt; via position:fixed + inset:0 + margin:auto.</span></div>
      <div class="row"><b>Sizes</b><span><code class="tok">sm</code> ${sizes.sm} (default — confirmations), <code class="tok">.modal--md</code> ${sizes.md} (forms), <code class="tok">.modal--lg</code> ${sizes.lg} (two columns, a list or table), <code class="tok">.modal--xl</code> ${sizes.xl} (a working view). Every size is capped at the viewport minus ${gutter} each side. The body is a slot — anything goes there.</span></div>
      <div class="row"><b>Phone</b><span>Below <code class="tok">breakpoint.sm</code> (${bp.value}${bp.unit}) md/lg/xl take <a href="drawer.html">Drawer</a>'s bottom placement — shape read from <code class="tok">drawer.tokens.json</code>. sm stays a centered card: a short question reads as a question in the middle, from the bottom it reads like a menu. Still one Modal in code — resize this window under ${bp.value}${bp.unit} and open md to see it.</span></div>
      <div class="row"><b>Description</b><span>Optional line under the title, <code class="tok">body-sm</code> · <code class="tok">text.secondary</code>, ${headerGap} below it — same as Card's. Wire it with <code class="tok">aria-describedby</code>: a screen reader reads it right after the title on open.</span></div>
      <div class="row"><b>radius.xl</b><span>Already named for exactly this case in radius's own legend ('modals, large panels, hero cards') — not a new choice.</span></div>
      <div class="row"><b>Nested modals</b><span>A modal opened from within another modal 'just works' via the browser's native top-layer stacking — the z-index.tokens.json modal-2/modal-overlay-2 tiers were designed for a non-native implementation and aren't needed here.</span></div>
      <div class="row"><b>Native close</b><span><code class="tok">&lt;form method="dialog"&gt;</code> around each action button, same as Drawer.</span></div>
      <div class="row"><b>Click-outside</b><span>Not native — showModal() only gives Escape for free. A small script (below) closes on backdrop click, same as Drawer.</span></div>
      <div class="row"><b>Header/footer optional</b><span>Same composition philosophy as Card/Drawer — a Modal can be body-only. Each section is its own full-width band with its own padding, so the divider spans the whole modal edge to edge.</span></div>
      <div class="row"><b>Real button states</b><span>Close (×) and the footer actions are genuine interactive elements — the same fill.neutral/fill.neutralHover/fill.neutralActive/fill.danger recipe Button itself uses, not unstyled placeholders.</span></div>
      <div class="row"><b>AlertDialog</b><span>A confirmation that can't be dismissed (no ×, no click-outside, no Escape) is its own component — <a href="alert-dialog.html">AlertDialog</a>, on this same shell.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Open script</h2>
    <p class="section-desc">The only JS needed to open — focus-trap/Escape/::backdrop are native, same reasoning as Drawer.</p>
    <pre class="code"><code>${esc(openScript)}</code></pre>

    <h2 class="big-section">Click-outside-to-close</h2>
    <p class="section-desc">showModal() doesn't give this for free — same gotcha and same fix as Drawer.</p>
    <pre class="code"><code>${esc(dismissScript)}</code></pre>

    <h2 class="big-section">Examples</h2>
    <p class="section-desc">Click to open for real — try pressing Escape, clicking outside the panel, or clicking Cancel/Delete.</p>
    <div class="story-grid">
      ${story("sm · confirm", "modal-basic", { ...CONFIRM, open: "Open sm" }, `${sizes.sm} — the default. Stays a centered card on a phone.`)}
      ${story("md · form", "modal-md", { size: "md", open: "Open md", title: "Edit session", description: "Changes are sent to the student when you save.", slot: 240, cancel: "Cancel", confirm: "Save" }, `${sizes.md} — a few fields, a date + time pick.`)}
      ${story("lg · two columns, a list", "modal-lg", { size: "lg", open: "Open lg", title: "Add recipients", description: "Pick students or whole groups.", slot: 360, cancel: "Cancel", confirm: "Add" }, `${sizes.lg} — a two-column form, a list or a table of a few columns.`)}
      ${story("xl · working view", "modal-xl", { size: "xl", open: "Open xl", title: "Review roster", description: "Fall 2026 · Biology 101 · 48 students", slot: 1200, cancel: "Close", confirm: "Export" }, `${sizes.xl} — a table, a preview, an editor. The body scrolls; header and footer stay put.`)}
      ${story("Body only", "modal-plain", { text: CONFIRM.text, open: "Open body only" }, "No header, no footer, no close button — Escape and click-outside are the only ways to dismiss this one, which is exactly why click-outside isn't optional.")}
    </div>

    <p class="placeholder-note">Every code sample on this page is printed from the same resolved token values driving the live previews above it — copy it directly, nothing here is hand-typed.</p>
  </main>
</div>
<script>${openScript}</script>
<script>${dismissScript}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/modal.html"), html);
console.log("wrote docs/modal.html");
