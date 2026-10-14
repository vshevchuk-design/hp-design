// Generates the CX Dashboard (Designs → CX → Dashboard):
//   docs/designs/cx-dashboard.html      — viewer page (design-viewer.mjs chrome)
//   docs/designs/cx-dashboard-app.html  — the prototype
//
// A restyle of the live HighPoint CX Dashboard, read off a saved copy of it
// (2026-10-15): same content and flow — "Hello Ava! 👋", the Academics /
// Teaching / Advisor tabs, widgets per tab, Edit My Widgets with its
// checkbox list and Save changes, the Assistant with its six suggested
// questions, the footer links — on DS components. The shell is the new
// Sidebar component (tools/lib/sidebar.mjs) + a 64px topbar; below 1024 the
// sidebar becomes a drawer behind the topbar's menu button.
//
// Component recipes are Scheduling's (ss-css.mjs — Button, Card, Tabs,
// ChoiceTile, Chip, Toast, EmptyState, Badge…): the same resolved recipes,
// not a second copy. This file adds Checkbox and the cx-* layout layer.
// Run: node tools/build-design-cx-dashboard.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { ssCss, SS_COLOR_PATHS } from "./lib/ss-css.mjs";
import { hoverGuard } from "./lib/hover-guard.mjs";
import { SIDEBAR_CSS, SIDEBAR_COLOR_PATHS, SIDEBAR_JS, SIDEBAR_MENU_BUTTON, sidebarHtml } from "./lib/sidebar.mjs";
import * as CX from "./lib/cx-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
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

// Everything ss-css.mjs destructures, plus Checkbox for the widget picker.
const COMPONENTS = ["tabs", "button", "select", "search", "chip", "listbox", "card", "badge", "pagination", "choice-tile", "radio", "alert", "toast", "tooltip", "empty-state", "modal", "input", "counter", "progress", "attachment", "accordion", "date-picker", "drawer", "box", "menu", "checkbox", "stat"];
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
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const h = { tokens, resolve, resolveToken, cv, px, refPath, typoCss, textExt, get };
const R = (node) => cv(refPath(node.$value));
const D = (node) => px(resolve(node.$value));
const T = (node) => resolveToken(node);
const style = (name) => resolveToken(get(`text-style.${name}`));
const dim = (k) => px(resolve(`dim.${k}`));
const { checkbox: cb, card, button, drawer, chip, stat, input } = tokens;

const componentColorPaths = [];
(function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.$type === "color" && typeof node.$value === "string" && node.$value.startsWith("{")) componentColorPaths.push(refPath(node.$value));
  for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
})(tokens);
const CX_COLOR_PATHS = ["bg.primary", "surface.sunken", "surface.page", "surface.default", "text.default", "text.secondary", "text.muted", "text.primary", "icon.secondary", "icon.primary", "border.default", "fill.primary"];
const colorPaths = [...new Set([...SS_COLOR_PATHS, ...SIDEBAR_COLOR_PATHS, ...componentColorPaths, ...CX_COLOR_PATHS])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const bBase = button.secondary.size.base;
const cxCss = `
/* ============ CX shell: sidebar + topbar + page ============ */
html, body { height: auto; min-height: 100%; }
.cx { display: flex; min-height: 100dvh; }
.cx__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
/* topbar: 64px declared (the app-shell height), hairline inside it */
.cx-topbar { position: sticky; top: 0; z-index: 5; height: ${dim(16)}; display: flex; align-items: center; gap: ${dim(3)}; padding: 0 ${dim(6)}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.cx-topbar__title { margin: 0; flex: 1; min-width: 0; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
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

/* ============ widgets ============ */
.cx-tabs { width: 100%; }
/* Columns, not grid rows: widgets differ a lot in height, and a grid row
   left a hole under a short card the height of its tall neighbour. Each
   card stacks straight under the one above it in its column. */
.cx-widgets { columns: ${dim(96)} 3; column-gap: ${dim(6)}; }
.cx-widgets > * { break-inside: avoid; margin-bottom: ${dim(6)}; }
.cx-widgets > .cx-empty-tab { column-span: all; }
@media (max-width: 767px) { .cx-widgets > * { margin-bottom: ${dim(4)}; } }
.cx-widget .card__head { display: flex; align-items: center; gap: ${dim(2)}; min-height: ${dim(14)}; padding-block: 0; }
.cx-widget .card__title { flex: 1; min-width: 0; }
.cx-widget__meta { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
.cx-widget .card__body { padding: 0; gap: 0; }
.cx-widget .card__foot { padding-block: ${dim(2)}; }
/* the day switcher under Today's Schedule's title */
.cx-daynav { display: flex; align-items: center; gap: ${dim(2)}; padding: ${dim(3)} ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.cx-daynav__label { flex: 1; text-align: center; color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
/* rows inside a widget: time · what · where */
.cx-rows { list-style: none; margin: 0; padding: 0; }
.cx-row { display: grid; grid-template-columns: ${dim(20)} minmax(0, 1fr) auto; gap: ${dim(1)} ${dim(3)}; align-items: start; padding: ${dim(3)} ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.cx-row:last-child { border-bottom: none; }
.cx-row--plain { grid-template-columns: minmax(0, 1fr) auto; }
.cx-row__time { color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} white-space: nowrap; }
.cx-row__time small { display: block; color: ${cv("text.secondary")}; ${typoCss(style("body-xs"))} }
.cx-row__main { display: flex; flex-direction: column; gap: ${dim("0_5")}; min-width: 0; }
.cx-row__title { color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.cx-row__sub { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.cx-row__aside { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; text-align: right; }
.cx-row.is-unread .cx-row__title::before { content: ""; display: inline-block; width: ${dim(2)}; height: ${dim(2)}; margin-right: ${dim("1_5")}; border-radius: 50%; background: ${cv("fill.primary")}; vertical-align: 1px; }
.cx-widget .empty-state { padding: ${dim(6)} ${D(card.padding)}; }
/* My Advisees: three Stat figures */
.cx-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${dim(3)}; padding: ${D(card.padding)}; }
.cx-stat { display: flex; flex-direction: column; gap: ${dim(1)}; }
.cx-stat__value { color: ${cv("text.default")}; ${typoCss(style("title-xl"))} }
.cx-stat__label { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
/* Message Center v2: a shortcut */
.cx-shortcut { display: flex; align-items: center; gap: ${dim(3)}; padding: ${D(card.padding)}; }
.cx-shortcut__text { flex: 1; color: ${cv("text.secondary")}; ${typoCss(style("body-base"))} }
.cx-shortcut__text b { color: ${cv("text.default")}; }
.cx-link { align-self: flex-start; margin-inline-start: -${D(bBase.paddingX)}; }
.cx-empty-tab { display: flex; flex-direction: column; align-items: center; gap: ${dim(3)}; padding: ${dim(10)} 0; }

/* ============ Checkbox (the widget picker's box) ============ */
.cx-check { flex-shrink: 0; width: ${D(cb.size.box)}; height: ${D(cb.size.box)}; border-radius: ${D(cb.radius)}; border: ${D(cb.size.borderWidth)} solid ${R(cb.state.default.border)}; background: ${R(cb.state.default.bg)}; display: inline-flex; align-items: center; justify-content: center; color: ${R(cb.state.checked.icon)}; }
.cx-check svg { width: ${D(cb.size.iconSize)}; height: ${D(cb.size.iconSize)}; opacity: 0; }
.choice-tile__input:checked ~ .choice-tile__box .cx-check { background: ${R(cb.state.checked.bg)}; border-color: ${R(cb.state.checked.border)}; }
.choice-tile__input:checked ~ .choice-tile__box .cx-check svg { opacity: 1; }
.choice-tile:hover .choice-tile__input:checked ~ .choice-tile__box .cx-check { background: ${R(cb.state.checkedHover.bg)}; border-color: ${R(cb.state.checkedHover.border)}; }

/* ============ Edit my widgets ============ */
.cx-pick { display: flex; flex-direction: column; gap: ${dim(3)}; }
.cx-pick__title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.cx-pick__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(${dim(72)}, 100%), 1fr)); gap: ${dim(3)}; }
.cx-tile .choice-tile__box { align-items: flex-start; }
.cx-tile__icon { flex-shrink: 0; width: ${dim(6)}; height: ${dim(6)}; color: ${cv("icon.secondary")}; }
.cx-tile .choice-tile__text { flex: 1; }
.cx-tile .choice-tile__description { white-space: normal; }
/* phone: the actions ride in a bar at the bottom, like the workshop page */
@media (max-width: 767px) {
  .cx-view[data-view="edit"] .cx-head__actions { position: fixed; left: 0; right: 0; bottom: 0; z-index: 6; padding: ${dim(3)} ${dim(4)} calc(${dim(3)} + env(safe-area-inset-bottom)); background: ${cv("surface.default")}; border-top: 1px solid ${cv("border.default")}; }
  .cx-view[data-view="edit"] .cx-head__actions .btn { flex: 1; }
}

/* ============ footer ============ */
.cx-foot { display: flex; flex-wrap: wrap; justify-content: center; gap: ${dim(1)} ${dim(5)}; padding-top: ${dim(4)}; }
.cx-foot a { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} text-decoration: none; }
.cx-foot a:hover { color: ${cv("text.default")}; text-decoration: underline; }

/* ============ Assistant: a floating button → a right-hand Drawer ============ */
.cx-fab { position: fixed; right: ${dim(6)}; bottom: ${dim(6)}; z-index: 7; box-shadow: ${(() => { const s = resolveToken(drawer.shadow); return `${px(s.offsetX)} ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${s.color}`; })()}; }
@media (max-width: 767px) { .cx-fab { right: ${dim(4)}; bottom: ${dim(4)}; width: ${D(bBase.height)}; padding: 0; } .cx-fab span { display: none; } }
.cx-assistant { border: none; padding: 0; margin: 0 0 0 auto; height: 100dvh; max-height: 100dvh; width: min(${dim(96)}, 100vw); background: ${R(drawer.bg)}; box-shadow: ${(() => { const s = resolveToken(drawer.shadow); return `${px(s.offsetX)} ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${s.color}`; })()}; font-family: ${cv("family.sans")}; }
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

const appCss = hoverGuard(`${rootVars}
${ssCss(h)}
${SIDEBAR_CSS}
${cxCss}`);

const tabsHtml = Object.keys(CX.CX_WIDGETS).map((k, i) =>
  `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-tab="${k}">${CX.CX_TAB_LABEL[k]}</button>`
).join("\n          ");

const markup = `<div class="cx has-sidebar">
  ${sidebarHtml({ nav: CX.CX_NAV, active: "dashboard", user: CX.CX_USER, id: "cx" })}
  <div class="sidebar-scrim"></div>
  <div class="cx__main">
    <header class="cx-topbar">
      ${SIDEBAR_MENU_BUTTON("btn btn--secondary btn--base btn--icon-only")}
      <h1 class="cx-topbar__title" id="cx-topbar-title">Dashboard</h1>
      <button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">${icon("settings", "btn__icon")}</button>
    </header>
    <main class="cx-page">

      <!-- ============ Dashboard ============ -->
      <section class="cx-view is-active" data-view="dash">
        <div class="cx-head">
          <div class="cx-head__text"><h2 class="ss-title">Hello ${CX.CX_USER.name.split(" ")[0]}! 👋</h2></div>
          <div class="cx-head__actions"><button class="btn btn--secondary btn--base" id="cx-edit" type="button">${icon("tune", "btn__icon")}<span>Edit my widgets</span></button></div>
        </div>
        <div class="tabs--underline cx-tabs" id="cx-tabs" role="tablist" aria-label="Dashboard">
          ${tabsHtml}
        </div>
        <div class="cx-widgets" id="cx-widgets" role="tabpanel"></div>
      </section>

      <!-- ============ Edit my widgets ============ -->
      <section class="cx-view" data-view="edit">
        <div class="cx-head">
          <div class="cx-head__text">
            <h2 class="ss-title">Edit my widgets</h2>
            <p class="ss-sub">Choose what shows on each tab of your dashboard.</p>
          </div>
          <div class="cx-head__actions">
            <button class="btn btn--secondary btn--base" id="cx-edit-cancel" type="button">Cancel</button>
            <button class="btn btn--primary btn--base" id="cx-edit-save" type="button">Save changes</button>
          </div>
        </div>
        <div id="cx-pick" class="cx-view is-active" style="gap:${dim(8)}"></div>
      </section>

      <nav class="cx-foot" aria-label="More">${CX.CX_FOOTER_LINKS.map((l) => `<a href="#" data-foot>${l}</a>`).join("")}</nav>
    </main>
  </div>
</div>
<button class="btn btn--primary btn--base cx-fab" id="cx-fab" type="button" aria-haspopup="dialog">${icon("auto_awesome", "btn__icon")}<span>Assistant</span></button>
<dialog class="cx-assistant" id="cx-assistant" aria-labelledby="cx-assistant-title">
  <div class="ss-drawer__head"><h2 class="ss-drawer__title" id="cx-assistant-title">Assistant</h2><button class="btn btn--ghost btn--sm btn--icon-only" type="button" id="cx-assistant-close" aria-label="Close">${icon("close", "btn__icon")}</button></div>
  <div class="cx-assistant__body" id="cx-assistant-body">
    <p class="cx-assistant__intro">Ask about your classes, holds, balance or deadlines — or start with one of these.</p>
    <div class="cx-prompts">${CX.CX_ASSISTANT_PROMPTS.map((p) => `<button class="chip" type="button" data-prompt>${p}</button>`).join("")}</div>
  </div>
  <form class="cx-assistant__foot" id="cx-assistant-form">
    <div class="cx-compose">
      <textarea class="ss-q__field" id="cx-assistant-input" rows="1" maxlength="8000" placeholder="Ask a question" aria-label="Ask the Assistant"></textarea>
      <button class="btn btn--primary btn--base btn--icon-only" type="submit" aria-label="Send">${icon("send", "btn__icon")}</button>
    </div>
    <span class="cx-compose__count" id="cx-assistant-count">0/8000</span>
  </form>
</dialog>`;

const ICONS = {
  prev: icon("chevron_left", "btn__icon"),
  next: icon("chevron_right", "btn__icon"),
  arrow: icon("arrow_forward", "btn__icon"),
  check: icon("check", ""),
  checkCircle: icon("check_circle", "toast__icon"),
  widget: Object.fromEntries(Object.values(CX.CX_WIDGETS).flat().map((w) => [w.key, icon(w.icon, "cx-tile__icon")])),
};

const appJs = `(function () {
  var D = ${JSON.stringify({ ...CX, CX_NAV: undefined })};
  var ICONS = ${JSON.stringify(ICONS)};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtTime(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM"; return (h % 12 || 12) + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; }
  function fmtDate(d) { return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate(); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var today = new Date(D.CX_TODAY + "T00:00:00");

  function toast(text) {
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("popover", "manual"); t.setAttribute("role", "status");
    t.innerHTML = ICONS.checkCircle + '<span class="toast__label"></span>';
    t.querySelector(".toast__label").textContent = text;
    document.body.appendChild(t); t.showPopover();
    setTimeout(function () { t.hidePopover(); t.remove(); }, 3200);
  }

  // which widgets are on — the live defaults (everything but View Advisees)
  var on = {};
  Object.keys(D.CX_WIDGETS).forEach(function (tab) { D.CX_WIDGETS[tab].forEach(function (w) { on[w.key] = !w.off; }); });
  var st = { tab: "academics", dayOffset: 0 };

  // ---- widget bodies ----
  function rows(list) { return '<ul class="cx-rows">' + list.join("") + "</ul>"; }
  function row(time, sub, title, detail, aside, extra) {
    return '<li class="cx-row' + (extra || "") + '"><span class="cx-row__time">' + time + (sub ? "<small>" + sub + "</small>" : "") + '</span><span class="cx-row__main"><span class="cx-row__title">' + title + '</span><span class="cx-row__sub">' + detail + "</span></span>" + (aside ? '<span class="cx-row__aside">' + aside + "</span>" : "<span></span>") + "</li>";
  }
  function empty(text) { return '<div class="empty-state"><span class="empty-state__text">' + text + "</span></div>"; }
  function card(key, title, meta, body, foot) {
    return '<article class="card cx-widget" data-widget="' + key + '"><div class="card__head"><h3 class="card__title">' + title + "</h3>" + (meta ? '<span class="cx-widget__meta">' + meta + "</span>" : "") + '</div><div class="card__body">' + body + "</div>" + (foot ? '<div class="card__foot">' + foot + "</div>" : "") + "</article>";
  }
  function link(text) { return '<button type="button" class="btn btn--ghost btn--sm cx-link" data-go><span>' + text + "</span>" + ICONS.arrow + "</button>"; }
  function dur(a, b) { return (b - a) + " min"; }
  function daysLabel(days) { return days.map(function (d) { return DOW[d]; }).join(" & "); }

  var WIDGET = {
    today: function () {
      var d = addDays(today, st.dayOffset);
      var list = D.CX_CLASSES.filter(function (c) { return c.days.indexOf(d.getDay()) !== -1; }).sort(function (a, b) { return a.start - b.start; });
      var nav = '<div class="cx-daynav"><button type="button" class="btn btn--secondary btn--sm btn--icon-only" data-day="-1" aria-label="Previous day">' + ICONS.prev + '</button><span class="cx-daynav__label">' + (st.dayOffset === 0 ? "Today · " : "") + fmtDate(d) + '</span><button type="button" class="btn btn--secondary btn--sm btn--icon-only" data-day="1" aria-label="Next day">' + ICONS.next + "</button></div>";
      var body = list.length ? rows(list.map(function (c) { return row(fmtTime(c.start), dur(c.start, c.end), esc(c.code) + " · " + esc(c.title), esc(c.room)); })) : empty("You have no classes on this day.");
      return card("today", "Today's Schedule", "", nav + body, st.dayOffset !== 0 ? '<button type="button" class="btn btn--ghost btn--sm cx-link" data-day="0"><span>Back to today</span></button>' : "");
    },
    classes: function () {
      return card("classes", "Class Schedule", D.CX_TERM, rows(D.CX_CLASSES.map(function (c) { return row(esc(daysLabel(c.days)), fmtTime(c.start), esc(c.code) + " · " + esc(c.title), esc(c.room)); })), link("Full schedule"));
    },
    exams: function () {
      var list = D.CX_EXAMS;
      return card("exams", "Student Exams", D.CX_TERM, list.length ? rows(list.map(function (x) { var d = new Date(x.date + "T00:00:00"); return row(MON[d.getMonth()] + " " + d.getDate(), DOW[d.getDay()], esc(x.code) + " · " + esc(x.title), fmtTime(x.start) + " · " + esc(x.room)); })) : empty("You have no exams."));
    },
    "teach-exams": function () {
      return card("teach-exams", "Teaching Exams", D.CX_TERM, rows(D.CX_TEACHING_EXAMS.map(function (x) { var d = new Date(x.date + "T00:00:00"); return row(MON[d.getMonth()] + " " + d.getDate(), DOW[d.getDay()], esc(x.code) + " · " + esc(x.title), fmtTime(x.start) + " · " + esc(x.room)); })));
    },
    "teach-schedule": function () {
      return card("teach-schedule", "Teaching Schedule", D.CX_TERM, rows(D.CX_TEACHING.map(function (c) { return row(esc(daysLabel(c.days)), fmtTime(c.start), esc(c.code) + " · " + esc(c.title), esc(c.room), c.enrolled + "/" + c.cap + " enrolled"); })), link("Class rosters"));
    },
    inbox: function () {
      return card("inbox", "Inbox", D.CX_INBOX.filter(function (m) { return m.unread; }).length + " unread", '<ul class="cx-rows">' + D.CX_INBOX.map(function (m) {
        return '<li class="cx-row cx-row--plain' + (m.unread ? " is-unread" : "") + '"><span class="cx-row__main"><span class="cx-row__title">' + esc(m.from) + '</span><span class="cx-row__sub">' + esc(m.subject) + '</span></span><span class="cx-row__aside">' + esc(m.when) + "</span></li>";
      }).join("") + "</ul>", link("Open Message Center"));
    },
    appointments: function () {
      return card("appointments", "Appointments", "Today", rows(D.CX_ADVISOR_APPTS.map(function (a) { return row(fmtTime(a.min), "", esc(a.student), esc(a.service) + " · " + esc(a.format)); })), link("All appointments"));
    },
    mc2: function () {
      var n = D.CX_INBOX.filter(function (m) { return m.unread; }).length;
      return card("mc2", "Message Center v2", "", '<div class="cx-shortcut"><span class="cx-shortcut__text"><b>' + n + " unread</b> conversations waiting for you.</span>" + '<button type="button" class="btn btn--secondary btn--sm" data-go>Open</button></div>');
    },
    "my-advisees": function () {
      var a = D.CX_ADVISEES;
      var fig = function (v, l) { return '<div class="cx-stat"><span class="cx-stat__value">' + v + '</span><span class="cx-stat__label">' + l + "</span></div>"; };
      return card("my-advisees", "My Advisees", D.CX_TERM, '<div class="cx-stats">' + fig(a.total, "Advisees") + fig(a.holds, "With holds") + fig(a.notRegistered, "Not registered for Spring") + "</div>", link("View advisees"));
    },
    "view-advisees": function () {
      return card("view-advisees", "View Advisees", "", '<ul class="cx-rows">' + D.CX_ADVISEE_LIST.map(function (s) {
        return '<li class="cx-row cx-row--plain"><span class="cx-row__main"><span class="cx-row__title">' + esc(s.name) + '</span><span class="cx-row__sub">' + esc(s.program) + '</span></span><span class="cx-row__aside">' + esc(s.standing) + "</span></li>";
      }).join("") + "</ul>", link("All advisees"));
    }
  };

  function renderDash() {
    document.querySelectorAll("#cx-tabs .tab").forEach(function (t) {
      var a = t.dataset.tab === st.tab;
      t.classList.toggle("tab--active", a); t.setAttribute("aria-selected", a ? "true" : "false");
    });
    var shown = D.CX_WIDGETS[st.tab].filter(function (w) { return on[w.key]; });
    $("cx-widgets").innerHTML = shown.length ? shown.map(function (w) { return WIDGET[w.key](); }).join("")
      : '<div class="cx-empty-tab"><div class="empty-state"><span class="empty-state__text">No widgets on this tab</span></div><button type="button" class="btn btn--secondary btn--sm" data-edit>Choose widgets</button></div>';
  }
  document.querySelectorAll("#cx-tabs .tab").forEach(function (t) { t.addEventListener("click", function () { st.tab = t.dataset.tab; renderDash(); }); });
  $("cx-widgets").addEventListener("click", function (e) {
    var d = e.target.closest("[data-day]");
    if (d) { st.dayOffset = d.dataset.day === "0" ? 0 : st.dayOffset + (+d.dataset.day); renderDash(); return; }
    if (e.target.closest("[data-edit]")) { openEdit(); return; }
    if (e.target.closest("[data-go]")) toast("Prototype — only the Dashboard is designed so far");
  });

  // ---- views ----
  function show(view) {
    document.querySelectorAll(".cx-view[data-view]").forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === view); });
    $("cx-topbar-title").textContent = view === "edit" ? "Edit my widgets" : "Dashboard";
    window.scrollTo(0, 0);
  }

  // ---- edit my widgets: a draft, applied only on Save ----
  var draft = {};
  function openEdit() {
    draft = Object.assign({}, on);
    $("cx-pick").innerHTML = Object.keys(D.CX_WIDGETS).map(function (tab) {
      return '<section class="cx-pick"><h3 class="cx-pick__title">' + D.CX_TAB_LABEL[tab] + '</h3><div class="cx-pick__grid">' + D.CX_WIDGETS[tab].map(function (w) {
        return '<label class="choice-tile cx-tile"><input class="choice-tile__input" type="checkbox" data-w="' + w.key + '"' + (draft[w.key] ? " checked" : "") + '><span class="choice-tile__box">' + ICONS.widget[w.key] +
          '<span class="choice-tile__text"><span class="choice-tile__label">' + esc(w.label) + '</span><span class="choice-tile__description">' + esc(w.desc) + '</span></span><span class="cx-check">' + ICONS.check + "</span></span></label>";
      }).join("") + "</div></section>";
    }).join("");
    show("edit");
  }
  $("cx-edit").addEventListener("click", openEdit);
  $("cx-pick").addEventListener("change", function (e) { var k = e.target.dataset.w; if (k) draft[k] = e.target.checked; });
  $("cx-edit-cancel").addEventListener("click", function () { show("dash"); });
  $("cx-edit-save").addEventListener("click", function () { on = draft; renderDash(); show("dash"); toast("Dashboard updated"); });

  // ---- shell: other nav links, footer, account ----
  document.querySelector(".sidebar").addEventListener("click", function (e) {
    var a = e.target.closest("[data-nav]");
    if (a) { e.preventDefault(); if (a.dataset.nav === "dashboard") { show("dash"); return; } toast("Prototype — only the Dashboard is designed so far"); return; }
    if (e.target.closest(".sidebar__account")) toast("Profile and sign out live here");
  });
  document.querySelectorAll("[data-foot]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); toast("Prototype — only the Dashboard is designed so far"); }); });

  // ---- Assistant ----
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

  renderDash();
})();
${SIDEBAR_JS}`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Dashboard</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
${markup}
<script>
${appJs}
</script>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "cx-dashboard",
  title: "CX Dashboard",
  heading: "Dashboard",
  sub: `The CX Dashboard, restyled on hp-design components — same content and flow as the live app (read off a saved copy of it): the greeting, the <b>Academics / Teaching / Advisor</b> tabs with their widgets, <b>Edit my widgets</b> (every widget as a checkbox tile, applied on Save changes), the <b>Assistant</b> with the live app's six suggested questions, and the footer links. The shell is the new DS <b>Sidebar</b> — the brand-blue navigation, item for item from the live app; only the current page is a white pill, open groups stay on the blue. Below 1024px the sidebar leaves the layout and opens as a drawer from the topbar's menu button. The live copy's widgets were empty ("You have no classes on this day"), so classes, exams, messages and advisees here are sample data; step through days in Today's Schedule to reach an empty one. Only the Dashboard is designed — other nav links show a toast.`,
  versions: [{ label: "v1", note: "restyle of the live dashboard", file: "cx-dashboard-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/cx-dashboard-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/cx-dashboard.html"), viewerHtml);
console.log("wrote docs/designs/cx-dashboard-app.html");
console.log("wrote docs/designs/cx-dashboard.html");
