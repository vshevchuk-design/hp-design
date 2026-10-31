// Composer rich toolbar — one definition for the Composer docs page and every
// prototype that writes formatted text (Staff Message Center's compose, reply
// and group wizard; ARM Global Settings' email body). Extracted 2026-10-31: the
// toolbar was built and tuned inside the Staff MC builder (especially for
// phones) and never reached the DS, so the next page that needed one got a
// different, simpler copy.
//
// What it is: undo/redo · text style · B/I/U · strikethrough/code/align/link/
// email · the page's insert menus (Merge Tags, Hyperlinks, Insert Tag…) ·
// optional AI Assist. As the toolbar narrows, the collapsible controls
// (.composer__tb-adv) hide one at a time — rightmost group first, by
// data-tb-order — and a "More" chevron appears; pressing it drops the hidden
// controls onto a second row. B/I/U, More and AI Assist never collapse.
//
// Consumer: COMPOSER_COLOR_PATHS into :root, COMPOSER_TOOLBAR_CSS (+
// COMPOSER_BOX_CSS for the rich one-box editor) into its sheet, the markup
// from composerToolbarHtml(), and COMPOSER_TOOLBAR_JS after it; then call
// window.hpComposerToolbar(toolbarEl) per toolbar (sets toolbarEl._tbReflow
// for panes that start hidden). Commands are on data-cmd, insert menus are
// Listbox popovers whose options carry data-insert — what they do to the
// text is the page's job (textarea vs contenteditable).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const composer = load("tokens/components/composer.tokens.json").component.composer;
const ghost = load("tokens/components/button.tokens.json").component.button.ghost;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`composer: unresolved token ${ref}`);
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
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const dim = (k) => px(resolveToken(get(`dim.${k}`)));
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const gSm = ghost.size.sm;
const gSmLabel = resolveToken(get(gSm.label.$value));
const c = composer, rich = composer.rich;

export const COMPOSER_COLOR_PATHS = [...new Set([
  refPath(c.iconButton.color), refPath(c.iconButton.hoverBg), refPath(c.iconButton.activeBg),
  refPath(c.aiAssist.bg), refPath(c.aiAssist.text), refPath(c.aiAssist.icon), refPath(c.aiAssist.hoverBorder),
  ...["bg", "border", "borderHover", "borderFocus", "divider"].map((k) => refPath(rich[k])),
  "border.default", "border.focus", "text.secondary", "icon.secondary", "surface.sunken", "fill.neutralHover", "fill.neutralHoverStrong",
])];

export const COMPOSER_TOOLBAR_CSS = `
/* ============ Composer rich toolbar (tools/lib/composer.mjs) ============ */
.composer__icon-btn { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${D(c.iconButton.size)}; height: ${D(c.iconButton.size)}; border: none; border-radius: ${D(c.radius)}; background: transparent; padding: 0; cursor: pointer; color: ${R(c.iconButton.color)}; }
.composer__icon-btn .composer__icon { width: ${D(c.iconButton.iconSize)}; height: ${D(c.iconButton.iconSize)}; display: block; }
.composer__icon-btn:hover { background: ${R(c.iconButton.hoverBg)}; }
.composer__icon-btn:active, .composer__icon-btn[aria-pressed="true"] { background: ${R(c.iconButton.activeBg)}; }
.composer__icon-btn:focus-visible, .composer__tb-btn:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }
.composer__toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: ${dim(1)}; }
.composer__tb-sep { flex-shrink: 0; width: 1px; align-self: stretch; margin: ${dim("0_5")} ${dim(1)}; background: ${cv("border.default")}; }
/* text style + insert menus — ghost sm triggers opening a Listbox */
.composer__tb-btn { flex-shrink: 0; display: inline-flex; align-items: center; gap: ${dim(1)}; height: ${D(gSm.height)}; padding: 0 ${dim(2)}; border: none; border-radius: ${D(c.radius)}; background: transparent; cursor: pointer; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; ${typoCss(gSmLabel)} }
.composer__tb-btn:hover { background: ${cv("fill.neutralHover")}; }
.composer__tb-btn .composer__icon { width: ${D(gSm.iconSize)}; height: ${D(gSm.iconSize)}; color: ${cv("icon.secondary")}; flex-shrink: 0; }
.composer__tb-chev { width: 16px; height: 16px; opacity: 0.7; flex-shrink: 0; }
.composer__tb-lb { max-height: 260px; overflow-y: auto; }
/* progressive overflow: JS hides .composer__tb-adv one by one (lowest
   data-tb-order first) while the toolbar overflows and shows "More";
   expanded, the hidden ones drop onto a second row — a zero-height
   flex-basis:100% break forces the wrap, order:2 sends them past it */
.composer__tb-collapsed { display: none; }
.composer__toolbar.is-expanded .composer__tb-collapsed { display: inline-flex; order: 2; }
.composer__tb-break { display: none; flex-basis: 100%; width: 0; height: 0; }
.composer__toolbar.is-expanded .composer__tb-break { display: block; order: 1; }
/* measuring: one line, so scrollWidth vs clientWidth shows real overflow */
.composer__toolbar.is-measuring { flex-wrap: nowrap; overflow: hidden; }
.composer__tb-more { display: none; background: ${cv("surface.sunken")}; }
.composer__toolbar.has-overflow .composer__tb-more { display: inline-flex; }
/* rests on surface.sunken, so it hovers to the Strong tier */
.composer__tb-more:hover { background: ${cv("fill.neutralHoverStrong")}; }
.composer__tb-more-chev { width: ${D(gSm.iconSize)}; height: ${D(gSm.iconSize)}; color: ${cv("icon.secondary")}; flex-shrink: 0; transition: transform 0.15s ease; }
.composer__toolbar.is-expanded .composer__tb-more-chev { transform: rotate(180deg); }
.composer__ai-assist { flex-shrink: 0; display: inline-flex; align-items: center; gap: ${dim(1)}; height: ${D(gSm.height)}; padding: 0 ${dim(2)}; border: 1px solid transparent; border-radius: ${D(c.radius)}; background: ${R(c.aiAssist.bg)}; color: ${R(c.aiAssist.text)}; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(gSmLabel)} }
.composer__ai-assist .composer__icon { width: ${D(gSm.iconSize)}; height: ${D(gSm.iconSize)}; color: ${R(c.aiAssist.icon)}; }
.composer__ai-assist:hover { border-color: ${R(c.aiAssist.hoverBorder)}; }
`;

/** Rich = one bordered box: the toolbar is a header glued to the field (composer.rich). */
export const COMPOSER_BOX_CSS = `
.composer__box { display: flex; flex-direction: column; border: 1px solid ${R(rich.border)}; border-radius: ${D(c.radius)}; background: ${R(rich.bg)}; overflow: hidden; }
.composer__box:hover { border-color: ${R(rich.borderHover)}; }
.composer__box:focus-within { border-color: ${R(rich.borderFocus)}; }
.composer__box .composer__toolbar { padding: ${D(rich.toolbarPaddingY)} ${D(rich.toolbarPaddingX)}; border-bottom: 1px solid ${R(rich.divider)}; }
.composer__box .composer__ai-assist { margin-left: auto; }
/* the field drops its own outline and fill — kept apart from the :hover rule,
   since hover-guarded pages lift :hover rules into @media (hover: hover) */
.composer__box .composer__field, .composer__box .composer__field:focus-within { align-items: flex-start; border: none; border-radius: 0; background: transparent; }
.composer__box .composer__field:hover { background: transparent; }
`;

const tool = (name, label, cmd, order) =>
  `<button type="button" class="composer__icon-btn${order ? " composer__tb-adv" : ""}"${order ? ` data-tb-order="${order}"` : ""} data-cmd="${cmd}" aria-label="${label}" title="${label}"${order ? ' tabindex="-1"' : ""}>${icon(name, "composer__icon")}</button>`;
const sep = (order) => `<span class="composer__tb-sep composer__tb-adv" data-tb-order="${order}"></span>`;
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const menu = (prefix, kind, label, items, order, attr) => {
  const lb = `${prefix}-${kind}-lb`;
  return `<button type="button" class="composer__tb-btn composer__tb-adv" id="${prefix}-${kind}-btn" data-tb-order="${order}" popovertarget="${lb}" aria-haspopup="listbox" tabindex="-1">${label}${icon("expand_more", "composer__tb-chev")}</button>
              <div class="listbox composer__tb-lb" id="${lb}" data-tb="${kind}" popover>
                <ul class="listbox__list" role="listbox" aria-label="${label}">
                  ${items.map((t) => `<li><button class="listbox__option" role="option" type="button" ${attr}="${esc(t)}">${esc(t)}</button></li>`).join("\n                  ")}
                </ul>
              </div>`;
};

/**
 * The toolbar markup.
 * @param prefix  scopes the ids (`${prefix}-tb-more`, `${prefix}-<kind>-btn/-lb`, `${prefix}-style-btn/-lb`)
 * @param menus   insert menus, left to right: [{ kind, label, items }] — options carry data-insert
 * @param styles  text-style options for the "Normal" menu (omit for a plain button) — options carry data-style
 * @param ai      AI Assist button id (omit for none)
 */
export function composerToolbarHtml({ prefix, menus = [], styles = null, ai = null }) {
  const n = menus.length;
  const o = (k) => n + k; // data-tb-order: the insert menus collapse first (rightmost = 1), undo last
  const styleBtn = styles
    ? menu(prefix, "style", "Normal", styles, o(7), "data-style").replace(">Normal<", '><span class="composer__tb-style-label">Normal</span><').replace('class="composer__tb-btn composer__tb-adv"', 'class="composer__tb-btn composer__tb-style composer__tb-adv"')
    : `<button type="button" class="composer__tb-btn composer__tb-style composer__tb-adv" data-tb-order="${o(7)}" tabindex="-1">Normal${icon("expand_more", "composer__tb-chev")}</button>`;
  return `<div class="composer__toolbar" role="toolbar" aria-label="Formatting">
              ${tool("undo", "Undo", "undo", o(11))}
              ${tool("redo", "Redo", "redo", o(10))}
              ${sep(o(9))}
              ${styleBtn}
              ${sep(o(8))}
              ${tool("format_bold", "Bold", "bold")}
              ${tool("format_italic", "Italic", "italic")}
              ${tool("format_underlined", "Underline", "underline")}
              ${tool("format_strikethrough", "Strikethrough", "strikeThrough", o(6))}
              ${tool("code", "Code", "code", o(5))}
              ${tool("format_align_left", "Align", "align", o(4))}
              ${tool("insert_link", "Insert link", "link", o(3))}
              ${tool("email", "Insert email", "email", o(2))}
              ${n ? sep(o(1)) : ""}
              ${menus.map((m, i) => menu(prefix, m.kind, m.label, m.items, n - i, "data-insert")).join("\n              ")}
              <button type="button" class="composer__tb-btn composer__tb-more" id="${prefix}-tb-more" aria-expanded="false" aria-label="More formatting options">${icon("expand_more", "composer__tb-more-chev")}</button>
              ${ai ? `<button type="button" class="composer__ai-assist" id="${ai}">${icon("auto_awesome", "composer__icon")}AI Assist</button>` : ""}
              <span class="composer__tb-break" aria-hidden="true"></span>
            </div>`;
}

// Progressive overflow. Reflows on its own width changes (ResizeObserver) and
// window resize; a toolbar in a pane that starts hidden may get no observer
// tick when revealed — call toolbar._tbReflow() then.
export const COMPOSER_TOOLBAR_JS = `window.hpComposerToolbar = function (toolbar) {
  if (!toolbar || toolbar._tbReflow) return;
  var more = toolbar.querySelector(".composer__tb-more");
  var items = Array.prototype.slice.call(toolbar.querySelectorAll(".composer__tb-adv"));
  items.sort(function (a, b) { return (+a.dataset.tbOrder) - (+b.dataset.tbOrder); });
  function overflowing() { return toolbar.scrollWidth > toolbar.clientWidth + 1; }
  function reflow() {
    if (toolbar.classList.contains("is-expanded")) return;
    toolbar.classList.add("is-measuring");
    items.forEach(function (el) { el.classList.remove("composer__tb-collapsed"); });
    toolbar.classList.remove("has-overflow");
    if (overflowing()) {
      toolbar.classList.add("has-overflow");
      for (var i = 0; i < items.length && overflowing(); i++) items[i].classList.add("composer__tb-collapsed");
    }
    toolbar.classList.remove("is-measuring");
  }
  more.addEventListener("click", function () {
    var expanded = toolbar.classList.toggle("is-expanded");
    more.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (!expanded) reflow();
  });
  var lastW = -1;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(function () {
      var w = Math.round(toolbar.clientWidth);
      if (w === lastW) return;
      lastW = w;
      reflow();
    }).observe(toolbar);
  }
  toolbar._tbReflow = function () { lastW = -1; reflow(); };
  window.addEventListener("resize", toolbar._tbReflow);
  requestAnimationFrame(reflow);
  // label widths change once the web font arrives, the toolbar's own width doesn't
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(toolbar._tbReflow);
};`;
