// Sidebar — the CX app's brand-blue primary navigation, as one shared
// definition: CSS, markup and behaviour. Used by docs/sidebar.html (the DS
// page) and by every CX prototype screen, so the nav can't drift between
// pages — same reasoning as app-shell.mjs / nav.mjs / design-viewer.mjs.
//
// Self-resolving like app-shell.mjs: it reads sidebar.tokens.json (plus the
// Counter and Avatar recipes it reuses) and resolves every role itself, so a
// consumer only has to put SIDEBAR_COLOR_PATHS into its :root vars.
//
// Shapes:
//   expanded (default)  — 288px, labels, groups open/close in place
//   collapsed rail      — .sidebar--collapsed, 64px, icons only (native title
//                         as the label); opening a group from the rail
//                         expands the panel first
//   auto rail (768–1279) — in an app (.has-sidebar) the panel folds to the
//                         rail by itself below 1280, as the live app does;
//                         expanding it opens a 320px panel OVER the page
//                         (scrim + close button), the content stays put
//   phone (< 768px)     — off-canvas, full screen with a close button, opened by
//                         the topbar's menu button (.has-nav-open on the app)
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
const sb = load("tokens/components/sidebar.tokens.json").component.sidebar;
const counter = load("tokens/components/counter.tokens.json").component.counter;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`sidebar: unresolved token ${ref}`);
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
const refPath = (ref) => ref.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node.$value))})`;
const T = (node) => resolveToken(node);
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

// Every colour role this recipe paints, read off the token nodes it uses.
const colorNodes = [
  sb.bg, sb.divider, sb.chevron.color,
  sb.state.default.text, sb.state.default.icon, sb.state.child.text,
  sb.state.hover.bg, sb.state.hover.text,
  sb.state.active.bg, sb.state.active.text, sb.state.active.icon,
  sb.state.focused.ringColor,
  counter.onPrimary.state.active.bg, counter.onPrimary.state.active.label,
  avatar.fallback.identity.blue.bg, avatar.fallback.identity.blue.text,
  // neutral theme
  ...["bg", "divider", "text", "icon", "childText", "chevron", "hoverBg", "hoverText", "ringColor", "edge"].map((k) => sb.neutral[k]),
  counter.onNeutral.state.active.bg, counter.onNeutral.state.active.label,
  counter.onNeutral.state.inactive.bg, counter.onNeutral.state.inactive.label,
];
export const SIDEBAR_COLOR_PATHS = [...new Set([...colorNodes.map((n) => refPath(n.$value)), "surface.overlay", "surface.brand", "text.onFill", "text.primary", "text.default"])];

const ringW = D(sb.state.focused.ringWidth);
const cSm = counter.size.sm;
const avSm = avatar.size.sm;

export const SIDEBAR_CSS = `
/* ============ Sidebar (brand-blue primary navigation) ============ */
.sidebar { flex-shrink: 0; width: ${D(sb.width)}; height: 100dvh; position: sticky; top: 0; display: flex; flex-direction: column; background: ${R(sb.bg)}; color: ${R(sb.state.default.text)}; font-family: var(--tok-family-sans); transition: width 0.2s ease; }
.sidebar__head { flex-shrink: 0; height: ${D(sb.header.height)}; display: flex; align-items: center; justify-content: space-between; gap: ${dim(2)}; padding: 0 ${D(sb.padding)} 0 calc(${D(sb.padding)} + ${D(sb.item.paddingX)}); border-bottom: 1px solid ${R(sb.divider)}; }
.sidebar__logo { display: flex; color: ${R(sb.state.default.text)}; }
.sidebar__logo svg { display: block; height: ${dim(6)}; width: auto; }
/* the logo's three parts, painted per theme: on blue it inverts (white
   square, brand glyph, white wordmark); on gray it's the normal logo */
.sidebar__logo-mark { fill: ${R(sb.state.default.text)}; }
.sidebar__logo-glyph { fill: var(${cssVarName("surface.brand")}); }
.sidebar__logo-word { fill: ${R(sb.state.default.text)}; }
/* the 24px square mark alone, for the rail */
.sidebar__mark { display: none; }
.sidebar__list, .sidebar__sub { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(sb.gap)}; }
.sidebar__body { flex: 1; min-height: 0; overflow-y: auto; padding: ${D(sb.padding)}; scrollbar-width: thin; scrollbar-color: ${R(sb.state.hover.bg)} transparent; }
.sidebar__sub { margin-top: ${D(sb.gap)}; }
.sidebar__sub[hidden] { display: none; }
/* one row recipe for links, group headers, the account button and the
   collapse button */
.sidebar__item { width: 100%; height: ${D(sb.item.height)}; display: flex; align-items: center; gap: ${D(sb.item.gap)}; padding: 0 ${D(sb.item.paddingX)}; border: none; border-radius: ${D(sb.item.radius)}; background: transparent; color: ${R(sb.state.default.text)}; text-decoration: none; text-align: left; cursor: pointer; font-family: inherit; ${typoCss(T(sb.item.label))} }
.sidebar__icon { flex-shrink: 0; width: ${D(sb.item.iconSize)}; height: ${D(sb.item.iconSize)}; color: ${R(sb.state.default.icon)}; }
.sidebar__label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar__chevron { flex-shrink: 0; width: ${D(sb.chevron.size)}; height: ${D(sb.chevron.size)}; color: ${R(sb.chevron.color)}; transition: transform 0.15s ease; }
.sidebar__item[aria-expanded="true"] .sidebar__chevron { transform: rotate(180deg); }
.sidebar__item--child { padding-left: ${D(sb.item.childIndent)}; color: ${R(sb.state.child.text)}; }
.sidebar__item:hover { background: ${R(sb.state.hover.bg)}; color: ${R(sb.state.hover.text)}; }
.sidebar__item:focus-visible { outline: ${ringW} solid ${R(sb.state.focused.ringColor)}; outline-offset: -${ringW}; }
/* the current page — the one loud thing in the panel */
.sidebar__item[aria-current="page"] { background: ${R(sb.state.active.bg)}; color: ${R(sb.state.active.text)}; ${typoCss(T(sb.item.activeLabel))} }
.sidebar__item[aria-current="page"] .sidebar__icon { color: ${R(sb.state.active.icon)}; }
.sidebar__item[aria-current="page"]:focus-visible { outline-color: ${R(sb.state.active.icon)}; }
/* a group holding the current page reads semibold even while closed */
.sidebar__item.has-current { ${typoCss(T(sb.item.activeLabel))} }
/* group count: Counter sm, onPrimary ACTIVE colours (inactive = the panel's own blue) */
.sidebar__count { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; height: ${D(cSm.height)}; min-width: ${D(cSm.minWidth)}; padding: 0 ${D(cSm.paddingX)}; border-radius: ${px(resolveToken(get("radius.full")))}; background: ${R(counter.onPrimary.state.active.bg)}; color: ${R(counter.onPrimary.state.active.label)}; ${typoCss(T(cSm.label))} }
/* an open group keeps its total, but quiet — the loud count belongs to the
   child that actually has the items. (The rail keeps the loud dot: the
   children aren't visible there.) Blue: one surface step up, white label —
   the inactive onPrimary chip is the panel's own blue and would vanish. */
.sidebar:not(.sidebar--collapsed) .sidebar__item[aria-expanded="true"] > .sidebar__count { background: ${R(sb.state.hover.bg)}; color: ${R(sb.state.hover.text)}; }
/* the footer band matches the header: 64px declared, hairline inside it */
.sidebar__foot { flex-shrink: 0; height: ${D(sb.header.height)}; display: flex; align-items: center; padding: 0 ${D(sb.padding)}; border-top: 1px solid ${R(sb.divider)}; }
.sidebar__account { height: ${D(sb.account.height)}; }
.sidebar__avatar { flex-shrink: 0; width: ${D(avSm.diameter)}; height: ${D(avSm.diameter)}; margin-left: -${dim(1)}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: ${R(avatar.fallback.identity.blue.bg)}; color: ${R(avatar.fallback.identity.blue.text)}; ${typoCss(T(avSm.initials))} }
.sidebar__collapse { width: ${D(sb.item.height)}; padding: 0; justify-content: center; flex-shrink: 0; }
.sidebar__collapse .sidebar__icon { transition: transform 0.2s ease; }

/* ---- neutral theme: the same recipe on gray ---- */
.sidebar--neutral { background: ${R(sb.neutral.bg)}; color: ${R(sb.neutral.text)}; scrollbar-color: ${R(sb.neutral.hoverBg)} transparent; box-shadow: inset -1px 0 0 ${R(sb.neutral.edge)}; }
.sidebar--neutral .sidebar__head { border-bottom-color: ${R(sb.neutral.divider)}; }
.sidebar--neutral .sidebar__foot { border-top-color: ${R(sb.neutral.divider)}; }
.sidebar--neutral .sidebar__body { scrollbar-color: ${R(sb.neutral.hoverBg)} transparent; }
.sidebar--neutral .sidebar__logo { color: ${R(sb.neutral.text)}; }
.sidebar--neutral .sidebar__logo-mark { fill: ${R(sb.state.active.text)}; }
.sidebar--neutral .sidebar__logo-glyph { fill: ${R(sb.state.default.text)}; }
.sidebar--neutral .sidebar__logo-word { fill: ${R(sb.neutral.text)}; }
.sidebar--neutral .sidebar__item { color: ${R(sb.neutral.text)}; }
.sidebar--neutral .sidebar__icon { color: ${R(sb.neutral.icon)}; }
.sidebar--neutral .sidebar__item--child { color: ${R(sb.neutral.childText)}; }
.sidebar--neutral .sidebar__chevron { color: ${R(sb.neutral.chevron)}; }
.sidebar--neutral .sidebar__item:hover { background: ${R(sb.neutral.hoverBg)}; color: ${R(sb.neutral.hoverText)}; }
.sidebar--neutral .sidebar__item:focus-visible { outline: ${D(sb.neutral.ringWidth)} solid ${R(sb.neutral.ringColor)}; outline-offset: -${D(sb.neutral.ringWidth)}; }
.sidebar--neutral .sidebar__item[aria-current="page"] { background: ${R(sb.state.active.bg)}; color: ${R(sb.state.active.text)}; }
.sidebar--neutral .sidebar__item[aria-current="page"] .sidebar__icon { color: ${R(sb.state.active.icon)}; }
.sidebar--neutral .sidebar__count { background: ${R(counter.onNeutral.state.active.bg)}; color: ${R(counter.onNeutral.state.active.label)}; }
/* gray: Counter onNeutral INACTIVE for an open group's total */
.sidebar--neutral:not(.sidebar--collapsed) .sidebar__item[aria-expanded="true"] > .sidebar__count { background: ${R(counter.onNeutral.state.inactive.bg)}; color: ${R(counter.onNeutral.state.inactive.label)}; }

/* ---- collapsed rail: icons only (desktop; below 1024 the panel is a drawer) ---- */
@media (min-width: 768px) {
  .sidebar--collapsed { width: ${D(sb.collapsedWidth)}; }
  .sidebar--collapsed .sidebar__head { flex-direction: column; justify-content: center; padding: 0; }
  .sidebar--collapsed .sidebar__logo { display: none; }
  .sidebar--collapsed .sidebar__collapse .sidebar__icon { transform: rotate(180deg); }
  .sidebar--collapsed .sidebar__label, .sidebar--collapsed .sidebar__chevron, .sidebar--collapsed .sidebar__sub { display: none; }
  .sidebar--collapsed .sidebar__item { justify-content: center; padding: 0; }
  .sidebar--collapsed .sidebar__avatar { margin-left: 0; }
  /* the count shrinks to a dot on the icon's corner */
  .sidebar--collapsed .sidebar__item { position: relative; }
  .sidebar--collapsed .sidebar__count { position: absolute; top: ${dim(1)}; right: ${dim(1)}; min-width: 0; width: ${dim(2)}; height: ${dim(2)}; padding: 0; font-size: 0; }
}

/* ---- the panel opened over the page (tablet overlay, phone full screen) ---- */
/* its close button replaces the collapse button while it's open */
.sidebar__close { display: none; }
.sidebar-scrim { display: none; }
@media (max-width: 1279px) {
  .has-nav-open .sidebar__close { display: inline-flex; width: ${D(sb.item.height)}; padding: 0; justify-content: center; flex-shrink: 0; }
  .has-nav-open .sidebar__collapse { display: none; }
  .has-nav-open .sidebar-scrim { display: block; position: fixed; inset: 0; z-index: 19; background: var(${cssVarName("surface.overlay")}); }
}
/* tablet (768–1279): the rail stays in the page; opening it lays a 320px
   panel over the content — the content keeps the rail's 64px, so nothing
   underneath moves */
@media (min-width: 768px) and (max-width: 1279px) {
  .has-nav-open .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 20; height: auto; width: ${D(sb.overlayWidth)}; box-shadow: 0 0 0 1px ${R(sb.divider)}; }
  .has-nav-open > .sidebar-scrim + * { margin-left: ${D(sb.collapsedWidth)}; }
}
/* phone (< 768): off-canvas, opened full screen by the topbar's menu button */
@media (max-width: 767px) {
  .sidebar, .sidebar.sidebar--collapsed { position: fixed; left: 0; top: 0; bottom: auto; z-index: 20; width: 100vw; height: 100lvh; transform: translateX(-100%); transition: transform 0.25s ease; }
  /* full LARGE-viewport height (under iOS Safari's floating bottom bar), the
     account row lifted above the bar and the home indicator */
  .sidebar__foot { height: calc(${D(sb.header.height)} + env(safe-area-inset-bottom) + 100lvh - 100dvh); padding-bottom: calc(env(safe-area-inset-bottom) + 100lvh - 100dvh); }
  .sidebar__collapse { display: none; }
  .has-nav-open .sidebar { transform: none; }
}
@media (prefers-reduced-motion: reduce) { .sidebar, .sidebar__chevron, .sidebar__collapse .sidebar__icon { transition: none; } }
`;

const LOGO = fs
  .readFileSync(path.join(root, "assets/highpoint-logo.svg"), "utf8")
  // on the brand panel the logo inverts: white square, brand glyph, white wordmark
  .replace('<rect width="24" height="24" fill="#0468C4"/>', '<rect class="sidebar__logo-mark" width="24" height="24"/>')
  .replace('fill="white"/>', 'class="sidebar__logo-glyph"/>')
  .replace(/fill="#090D19"/g, 'class="sidebar__logo-word"')
  .replace("<svg ", '<svg aria-hidden="true" ');

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * @param nav     [{ key, label, icon, count?, children?: [{ key, label }] }]
 * @param active  key of the current page (a top-level key or a child key)
 * @param open    group keys rendered open (the group holding `active` always is)
 * @param user    { name, initials }
 * @param id      prefix for group ids (several sidebars on one docs page)
 * @param collapsed  render as the rail
 * @param theme   "brand" (blue, default) or "neutral" (gray)
 */
export function sidebarHtml({ nav, active, open = [], user, id = "sb", collapsed = false, theme = "brand" }) {
  const rows = nav
    .map((it) => {
      if (!it.children) {
        const cur = it.key === active;
        return `<li><a class="sidebar__item" href="#" data-nav="${esc(it.key)}"${cur ? ' aria-current="page"' : ""} title="${esc(it.label)}">${icon(it.icon, "sidebar__icon")}<span class="sidebar__label">${esc(it.label)}</span></a></li>`;
      }
      const holds = it.children.some((c) => c.key === active);
      const isOpen = holds || open.includes(it.key);
      const gid = `${id}-g-${it.key}`;
      const kids = it.children
        .map((c) => `<li><a class="sidebar__item sidebar__item--child" href="#" data-nav="${esc(c.key)}"${c.key === active ? ' aria-current="page"' : ""}><span class="sidebar__label">${esc(c.label)}</span>${c.count ? `<span class="sidebar__count" aria-label="${c.count} new">${c.count}</span>` : ""}</a></li>`)
        .join("");
      return `<li><button class="sidebar__item${holds ? " has-current" : ""}" type="button" aria-expanded="${isOpen}" aria-controls="${gid}" title="${esc(it.label)}">${icon(it.icon, "sidebar__icon")}<span class="sidebar__label">${esc(it.label)}</span>${it.count ? `<span class="sidebar__count" aria-label="${it.count} new">${it.count}</span>` : ""}${icon("expand_more", "sidebar__chevron")}</button><ul class="sidebar__sub" id="${gid}"${isOpen ? "" : " hidden"}>${kids}</ul></li>`;
    })
    .join("\n      ");
  return `<nav class="sidebar${theme === "neutral" ? " sidebar--neutral" : ""}${collapsed ? " sidebar--collapsed" : ""}" aria-label="Main">
    <div class="sidebar__head">
      <a class="sidebar__logo" href="#" aria-label="HighPoint — Dashboard">${LOGO}</a>
      <button class="sidebar__item sidebar__close" type="button" aria-label="Close navigation">${icon("close", "sidebar__icon")}</button>
      <button class="sidebar__item sidebar__collapse" type="button" aria-label="${collapsed ? "Expand" : "Collapse"} navigation" aria-expanded="${!collapsed}">${icon("first_page", "sidebar__icon")}</button>
    </div>
    <div class="sidebar__body">
      <ul class="sidebar__list">
      ${rows}
      </ul>
    </div>
    <div class="sidebar__foot">
      <button class="sidebar__item sidebar__account" type="button" aria-haspopup="menu" title="${esc(user.name)}"><span class="sidebar__avatar" aria-hidden="true">${esc(user.initials)}</span><span class="sidebar__label">${esc(user.name)}</span>${icon("expand_more", "sidebar__chevron")}</button>
    </div>
  </nav>`;
}

/** The topbar's menu button (below 1024 only) — put it first in the topbar. */
export const SIDEBAR_MENU_BUTTON = (cls) => `<button class="${cls} sidebar-open" type="button" aria-label="Open navigation" aria-expanded="false">${icon("menu", "btn__icon")}</button>`;

// Behaviour, scoped to every .sidebar on the page:
//  · a group header toggles its list (from the rail it expands the panel first)
//  · the collapse button toggles the rail
//  · below 1024 the topbar's .sidebar-open shows the drawer; the scrim,
//    Escape or picking a link closes it
export const SIDEBAR_JS = `(function () {
  // In an app (.has-sidebar) the panel has three behaviours by width:
  //   ≥1280  in the page; collapse button toggles the rail
  //   768–1279  the rail by itself; expanding opens a 320px panel OVER the
  //             page (scrim, ✕, Escape) instead of pushing the content
  //   <768   off-canvas; the topbar's menu button opens it full screen
  var app = document.querySelector(".has-sidebar");
  var mid = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");
  var openBtn = app && app.querySelector(".sidebar-open");
  function isOverlay() { return !!app && (mid.matches || window.innerWidth < 768); }
  function setCollapsed(nav, c) {
    nav.classList.toggle("sidebar--collapsed", c);
    var cb = nav.querySelector(".sidebar__collapse");
    if (cb) { cb.setAttribute("aria-label", (c ? "Expand" : "Collapse") + " navigation"); cb.setAttribute("aria-expanded", c ? "false" : "true"); }
  }
  function setOpen(o) {
    if (!app) return;
    var nav = app.querySelector(".sidebar");
    app.classList.toggle("has-nav-open", o);
    if (mid.matches) setCollapsed(nav, !o);
    if (openBtn) openBtn.setAttribute("aria-expanded", o ? "true" : "false");
  }
  document.querySelectorAll(".sidebar").forEach(function (nav) {
    var inApp = !!app && app.contains(nav);
    nav.addEventListener("click", function (e) {
      if (e.target.closest(".sidebar__close")) { setOpen(false); return; }
      var col = e.target.closest(".sidebar__collapse");
      if (col) {
        if (inApp && mid.matches) { setOpen(true); return; }
        setCollapsed(nav, !nav.classList.contains("sidebar--collapsed"));
        return;
      }
      var g = e.target.closest("[aria-controls]");
      if (g && nav.contains(g)) {
        if (nav.classList.contains("sidebar--collapsed")) {
          if (inApp && mid.matches) setOpen(true); else setCollapsed(nav, false);
          g.setAttribute("aria-expanded", "true");
        } else {
          g.setAttribute("aria-expanded", g.getAttribute("aria-expanded") === "true" ? "false" : "true");
        }
        document.getElementById(g.getAttribute("aria-controls")).hidden = g.getAttribute("aria-expanded") !== "true";
        return;
      }
      // picking a page closes an open overlay / phone panel
      if (inApp && e.target.closest("[data-nav]") && isOverlay()) setOpen(false);
    });
  });
  if (!app) return;
  if (openBtn) openBtn.addEventListener("click", function () { setOpen(true); var f = app.querySelector(".sidebar__close"); if (f) f.focus(); });
  var scrim = app.querySelector(".sidebar-scrim");
  if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && app.classList.contains("has-nav-open")) { setOpen(false); if (openBtn && window.innerWidth < 768) openBtn.focus(); } });
  // crossing a breakpoint resets: closed, and the rail in the middle band
  function reset() { app.classList.remove("has-nav-open"); if (openBtn) openBtn.setAttribute("aria-expanded", "false"); setCollapsed(app.querySelector(".sidebar"), mid.matches); }
  mid.addEventListener("change", reset);
  window.matchMedia("(max-width: 767px)").addEventListener("change", reset);
  reset();
})();`;
