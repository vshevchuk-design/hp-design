// The CX app shell — one definition for every CX prototype page (Dashboard,
// Browse Classes, …): the Sidebar, a 64px topbar, the page column, the footer
// links, the Assistant (FAB + right-hand Drawer, with the page's own
// suggested questions), a Toast helper, and the resolved component recipes
// (Scheduling's ssCss() — Button, Card, Tabs, Select, Listbox, ChoiceTile,
// Chip, Badge, EmptyState, Toast, Drawer… — plus Checkbox and Table here).
// Extracted 2026-10-15 when the second CX page arrived, before a second copy
// could exist (the same rule app-shell.mjs / nav.mjs follow).
//
// A page builder calls cxApp({ … }) with its views' markup, its own CSS
// (a function of the helpers in X, so it resolves tokens the same way) and
// its own script. The shell script exposes window.cx.toast(text) and
// window.cx.notDesigned() for links that lead outside the prototype.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./css-vars.mjs";
import { ssCss, SS_COLOR_PATHS } from "./ss-css.mjs";
import { hoverGuard } from "./hover-guard.mjs";
import { SIDEBAR_CSS, SIDEBAR_COLOR_PATHS, SIDEBAR_JS, SIDEBAR_MENU_BUTTON, sidebarHtml } from "./sidebar.mjs";
import { CX_NAV, CX_USER, CX_FOOTER_LINKS } from "./cx-data.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};

// Everything ss-css.mjs destructures, plus Checkbox and Table.
const COMPONENTS = ["tabs", "button", "select", "search", "chip", "listbox", "card", "badge", "pagination", "choice-tile", "radio", "alert", "toast", "tooltip", "empty-state", "modal", "input", "counter", "progress", "attachment", "accordion", "date-picker", "drawer", "box", "menu", "checkbox", "stat", "table"];
const tokens = Object.assign({}, ...COMPONENTS.map((n) => load(`tokens/components/${n}.tokens.json`).component));

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`unresolved token ${ref}`);
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
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;
const refPath = (ref) => ref.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const textExt = (styleRef) => (get(styleRef).$extensions || {})["hp.design/text"] || {};
export const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

/** Helpers a page's CSS function receives. */
export const X = {
  tokens, get, resolve, resolveToken, px, cv, refPath, typoCss, textExt, icon,
  R: (node) => cv(refPath(node.$value)),
  D: (node) => px(resolve(node.$value)),
  T: (node) => resolveToken(node),
  style: (name) => resolveToken(get(`text-style.${name}`)),
  dim: (k) => px(resolve(`dim.${k}`)),
  shadow: (node) => { const s = resolveToken(node); return `${px(s.offsetX)} ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${s.color}`; },
};
const { R, D, T, style, dim } = X;
const { checkbox: cb, card, button, drawer, chip, table: tb } = tokens;
const bBase = button.secondary.size.base;

const componentColorPaths = [];
(function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.$type === "color" && typeof node.$value === "string" && node.$value.startsWith("{")) componentColorPaths.push(refPath(node.$value));
  for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
})(tokens);
const SHELL_COLOR_PATHS = ["bg.primary", "surface.sunken", "surface.page", "surface.default", "text.default", "text.secondary", "text.muted", "text.primary", "icon.secondary", "icon.primary", "border.default", "fill.primary"];
const headLabel = style("label-sm");
const headCase = textExt("text-style.label-sm").textTransform || "none";

const SHELL_CSS = `
/* ============ CX shell: sidebar + topbar + page ============ */
html, body { height: auto; min-height: 100%; }
.cx { display: flex; min-height: 100dvh; }
.cx__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
/* topbar: 64px declared (the app-shell height), hairline inside it */
.cx-topbar { position: sticky; top: 0; z-index: 5; height: ${dim(16)}; display: flex; align-items: center; gap: ${dim(3)}; padding: 0 ${dim(6)}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.cx-topbar__title { margin: 0; flex: 1; min-width: 0; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cx-topbar .sidebar-open { display: none; }
@media (max-width: 1023px) { .cx-topbar .sidebar-open { display: inline-flex; } .cx-topbar { padding: 0 ${dim(4)}; } }
.cx-page { flex: 1; width: 100%; max-width: 1280px; margin: 0 auto; padding: ${dim(8)} ${dim(8)} ${dim(12)}; display: flex; flex-direction: column; gap: ${dim(6)}; }
@media (max-width: 1023px) { .cx-page { padding: ${dim(6)} ${dim(6)} ${dim(12)}; } }
@media (max-width: 767px) { .cx-page { padding: ${dim(5)} ${dim(4)} ${dim(24)}; gap: ${dim(5)}; } }
.cx-view { display: none; flex-direction: column; gap: ${dim(6)}; }
.cx-view.is-active { display: flex; }
.cx-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: ${dim(3)} ${dim(4)}; }
.cx-head__text { display: flex; flex-direction: column; gap: ${dim(1)}; min-width: 0; }
.cx-head__actions { display: flex; gap: ${dim(2)}; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.cx-link { align-self: flex-start; margin-inline-start: -${D(bBase.paddingX)}; }

/* ============ Checkbox (box only — for a ChoiceTile or a row) ============ */
.cx-check { flex-shrink: 0; width: ${D(cb.size.box)}; height: ${D(cb.size.box)}; border-radius: ${D(cb.radius)}; border: ${D(cb.size.borderWidth)} solid ${R(cb.state.default.border)}; background: ${R(cb.state.default.bg)}; display: inline-flex; align-items: center; justify-content: center; color: ${R(cb.state.checked.icon)}; }
.cx-check svg { width: ${D(cb.size.iconSize)}; height: ${D(cb.size.iconSize)}; opacity: 0; }
.choice-tile__input:checked ~ .choice-tile__box .cx-check { background: ${R(cb.state.checked.bg)}; border-color: ${R(cb.state.checked.border)}; }
.choice-tile__input:checked ~ .choice-tile__box .cx-check svg { opacity: 1; }
.choice-tile:hover .choice-tile__input:checked ~ .choice-tile__box .cx-check { background: ${R(cb.state.checkedHover.bg)}; border-color: ${R(cb.state.checkedHover.border)}; }

/* ============ Table (container + header + rows; columns are the page's grid) ============ */
.table { background: ${R(tb.surface)}; border: 1px solid ${R(tb.border)}; border-radius: ${D(tb.radius)}; overflow: hidden; }
.table__row { display: grid; align-items: center; gap: ${D(tb.row.gap)}; padding: ${D(tb.row.paddingY)} ${D(tb.row.paddingX)}; border-bottom: 1px solid ${R(tb.row.divider)}; color: ${R(tb.cell.textColor)}; ${typoCss(T(tb.cell.text))} }
.table__row:last-child { border-bottom: none; }
.table__row--head { padding: ${D(tb.header.paddingY)} ${D(tb.header.paddingX)}; color: ${R(tb.header.labelColor)}; ${typoCss(headLabel)} text-transform: ${headCase}; letter-spacing: ${headLabel.letterSpacing}; border-bottom-color: ${R(tb.header.divider)}; }
.table__row--link { cursor: pointer; }
.table__row--link:hover { background: ${R(tb.row.hoverBg)}; }
.table__muted { color: ${R(tb.cell.mutedColor)}; }

/* ============ footer ============ */
.cx-foot { display: flex; flex-wrap: wrap; justify-content: center; gap: ${dim(1)} ${dim(5)}; padding-top: ${dim(4)}; }
.cx-foot a { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} text-decoration: none; }
.cx-foot a:hover { color: ${cv("text.default")}; text-decoration: underline; }

/* ============ Assistant: a floating button → a right-hand Drawer ============ */
.cx-fab { position: fixed; right: ${dim(6)}; bottom: ${dim(6)}; z-index: 7; box-shadow: ${X.shadow(drawer.shadow)}; }
@media (max-width: 767px) { .cx-fab { right: ${dim(4)}; bottom: ${dim(4)}; width: ${D(bBase.height)}; padding: 0; } .cx-fab span { display: none; } }
.cx-assistant { border: none; padding: 0; margin: 0 0 0 auto; height: 100dvh; max-height: 100dvh; width: min(${dim(96)}, 100vw); background: ${R(drawer.bg)}; box-shadow: ${X.shadow(drawer.shadow)}; font-family: ${cv("family.sans")}; }
.cx-assistant[open] { display: flex; flex-direction: column; transform: none; transition: transform ${px(resolveToken(drawer.transitionDuration))} ease; }
@starting-style { .cx-assistant[open] { transform: translateX(100%); } }
.cx-assistant::backdrop { background: ${R(drawer.overlay)}; }
.cx-assistant .ss-drawer__head { padding: 0 ${dim(4)} 0 ${D(drawer.padding)}; height: ${dim(16)}; }
.cx-assistant__body { flex: 1; min-height: 0; overflow-y: auto; padding: ${D(drawer.padding)}; display: flex; flex-direction: column; gap: ${dim(4)}; }
.cx-assistant__intro { margin: 0; color: ${R(drawer.bodyColor)}; ${typoCss(T(drawer.body))} }
.cx-prompts { display: flex; flex-wrap: wrap; gap: ${dim(2)}; }
.cx-prompts .chip { height: auto; min-height: ${D(chip.size.base.height)}; padding-block: ${dim(1)}; white-space: normal; text-align: left; }
.cx-msg { max-width: 85%; padding: ${dim(2)} ${dim(3)}; border-radius: ${D(card.radius)}; ${typoCss(style("body-base"))} }
.cx-msg--me { align-self: flex-end; background: ${cv("bg.primary")}; color: ${cv("text.default")}; }
.cx-msg--bot { align-self: flex-start; background: ${cv("surface.sunken")}; color: ${cv("text.default")}; }
.cx-assistant__foot { flex-shrink: 0; display: flex; flex-direction: column; gap: ${dim(2)}; padding: ${dim(3)} ${D(drawer.padding)} calc(${dim(3)} + env(safe-area-inset-bottom)); border-top: 1px solid ${R(drawer.divider)}; }
.cx-compose { display: flex; align-items: flex-end; gap: ${dim(2)}; }
.cx-compose .ss-q__field { min-height: ${D(bBase.height)}; height: ${D(bBase.height)}; resize: none; }
.cx-compose__count { align-self: flex-end; color: ${cv("text.muted")}; ${typoCss(style("body-xs"))} }
`;

const SHELL_JS = `window.cx = (function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var CHECK = ${JSON.stringify(icon("check_circle", "toast__icon"))};
  function toast(text) {
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("popover", "manual"); t.setAttribute("role", "status");
    t.innerHTML = CHECK + '<span class="toast__label"></span>';
    t.querySelector(".toast__label").textContent = text;
    document.body.appendChild(t); t.showPopover();
    setTimeout(function () { t.hidePopover(); t.remove(); }, 3200);
  }
  function notDesigned() { toast("Prototype — this page isn\\u2019t designed yet"); }
  // nav links outside this page, the account row, footer links
  document.querySelector(".sidebar").addEventListener("click", function (e) {
    var a = e.target.closest("[data-nav]");
    if (a) { e.preventDefault(); if (a.getAttribute("aria-current") !== "page") notDesigned(); return; }
    if (e.target.closest(".sidebar__account")) toast("Profile and sign out live here");
  });
  document.querySelectorAll("[data-foot]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); notDesigned(); }); });
  // Assistant
  var dlg = $("cx-assistant"), inp = $("cx-assistant-input");
  $("cx-fab").addEventListener("click", function () { dlg.showModal(); inp.focus(); });
  $("cx-assistant-close").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  inp.addEventListener("input", function () { $("cx-assistant-count").textContent = inp.value.length + "/8000"; });
  $("cx-assistant-body").addEventListener("click", function (e) { var p = e.target.closest("[data-prompt]"); if (p) { inp.value = p.textContent; inp.dispatchEvent(new Event("input")); inp.focus(); } });
  $("cx-assistant-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = inp.value.trim(); if (!q) return;
    var body = $("cx-assistant-body");
    body.insertAdjacentHTML("beforeend", '<div class="cx-msg cx-msg--me">' + esc(q) + '</div><div class="cx-msg cx-msg--bot">This prototype isn\\u2019t connected to an assistant — in the app, the answer would appear here.</div>');
    inp.value = ""; inp.dispatchEvent(new Event("input"));
    body.scrollTop = body.scrollHeight;
  });
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("cx-assistant-form").requestSubmit(); } });
  return { toast: toast, notDesigned: notDesigned };
})();`;

/**
 * @param title     <title> and the topbar's heading
 * @param active    CX_NAV key of the current page
 * @param views     the page's markup (goes inside <main class="cx-page">)
 * @param after     markup after the app (the page's own dialogs, popovers)
 * @param pageCss   (X) => css string — the page's own layer
 * @param pageJs    the page's script (runs after the shell script)
 * @param prompts   the Assistant's suggested questions on this page (live text)
 * @param colorPaths extra colour roles the page CSS uses directly
 */
export function cxApp({ title, active, views, after = "", pageCss = () => "", pageJs = "", prompts, colorPaths = [] }) {
  const paths = [...new Set([...SS_COLOR_PATHS, ...SIDEBAR_COLOR_PATHS, ...componentColorPaths, ...SHELL_COLOR_PATHS, ...colorPaths])];
  const rootVars = renderRootVars([...paths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
  const css = hoverGuard(`${rootVars}
${ssCss({ tokens, resolve, resolveToken, cv, px, refPath, typoCss, textExt, get })}
${SIDEBAR_CSS}
${SHELL_CSS}
${pageCss(X)}`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${css}
</style>
</head>
<body>
<div class="cx has-sidebar">
  ${sidebarHtml({ nav: CX_NAV, active, user: CX_USER, id: "cx" })}
  <div class="sidebar-scrim"></div>
  <div class="cx__main">
    <header class="cx-topbar">
      ${SIDEBAR_MENU_BUTTON("btn btn--secondary btn--base btn--icon-only")}
      <h1 class="cx-topbar__title" id="cx-topbar-title">${title}</h1>
      <button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">${icon("settings", "btn__icon")}</button>
    </header>
    <main class="cx-page">
${views}
      <nav class="cx-foot" aria-label="More">${CX_FOOTER_LINKS.map((l) => `<a href="#" data-foot>${l}</a>`).join("")}</nav>
    </main>
  </div>
</div>
<button class="btn btn--primary btn--base cx-fab" id="cx-fab" type="button" aria-haspopup="dialog">${icon("auto_awesome", "btn__icon")}<span>Assistant</span></button>
<dialog class="cx-assistant" id="cx-assistant" aria-labelledby="cx-assistant-title">
  <div class="ss-drawer__head"><h2 class="ss-drawer__title" id="cx-assistant-title">Assistant</h2><button class="btn btn--ghost btn--sm btn--icon-only" type="button" id="cx-assistant-close" aria-label="Close">${icon("close", "btn__icon")}</button></div>
  <div class="cx-assistant__body" id="cx-assistant-body">
    <p class="cx-assistant__intro">Ask a question — or start with one of these.</p>
    <div class="cx-prompts">${prompts.map((p) => `<button class="chip" type="button" data-prompt>${p}</button>`).join("")}</div>
  </div>
  <form class="cx-assistant__foot" id="cx-assistant-form">
    <div class="cx-compose">
      <textarea class="ss-q__field" id="cx-assistant-input" rows="1" maxlength="8000" placeholder="Ask a question" aria-label="Ask the Assistant"></textarea>
      <button class="btn btn--primary btn--base btn--icon-only" type="submit" aria-label="Send">${icon("send", "btn__icon")}</button>
    </div>
    <span class="cx-compose__count" id="cx-assistant-count">0/8000</span>
  </form>
</dialog>
${after}
<script>
${SHELL_JS}
${pageJs}
${SIDEBAR_JS}
</script>
</body>
</html>
`;
}
