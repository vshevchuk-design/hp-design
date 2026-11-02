// Date Navigator — steps a calendar view through time and names the period on
// screen: ‹ › Today, then the period ("Oct 25 – 31, 2026") as a ghost trigger
// that opens the DS Calendar to jump to any date. One shared definition (CSS,
// markup, behaviour) — used by docs/date-navigator.html and Schedule; Student
// Scheduling's Calendar header does the same job and should move onto it.
//
// Self-resolving like date-picker.mjs. The three buttons ARE DS Button
// secondary base (markup classes .btn …); a page that already ships a Button
// recipe (every CX page, via ssCss) needs only DATE_NAV_CSS. A page without
// one adds DATE_NAV_BUTTON_CSS — Button secondary base resolved from
// button.tokens.json and scoped to .date-nav, the same split app-shell.mjs
// makes with SHELL_BUTTON_CSS. The Calendar panel is DatePicker's
// (.datepicker__panel) — put DATE_PICKER_CSS + CALENDAR_CSS in the sheet and
// CALENDAR_JS before DATE_NAV_JS.
//
// Units: day · week (Sunday-first) · month. Layouts: inline (‹ › Today
// period — desktop) · split (period … ‹ › Today — a phone row).
// Client: hpDateNav.mount(el, { onChange(iso, reason) }) → { set({ unit, value }), get() };
// reason is "prev" | "next" | "today" | "pick".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";
import { calendarHtml } from "./calendar.mjs";

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
const dn = load("tokens/components/date-navigator.tokens.json").component.dateNavigator;
const button = load("tokens/components/button.tokens.json").component.button;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`date-navigator: unresolved token ${ref}`);
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
const refPath = (ref) => ref.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node.$value))})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const p = dn.period;
const sec = button.secondary, secBase = sec.size.base, ring = button.ghost.state.focused;
export const DATE_NAV_COLOR_PATHS = [...new Set([p.labelColor, p.chevronColor, p.hoverBg, ring.ringColor,
  sec.state.default.fill, sec.state.default.label, sec.state.default.icon, sec.state.hover.fill, sec.state.pressed.fill, sec.state.focused.ringColor].map((n) => refPath(n.$value)))];

export const DATE_NAV_CSS = `
.date-nav { display: flex; align-items: center; gap: ${D(dn.periodGap)}; min-width: 0; }
.date-nav__controls { display: flex; align-items: center; gap: ${D(dn.gap)}; flex-shrink: 0; }
.date-nav__period { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${D(p.gap)}; min-width: 0; height: ${D(p.height)}; margin: 0; padding: 0 ${D(p.paddingX)}; border: none; border-radius: ${D(p.radius)}; background: transparent; color: ${R(p.labelColor)}; cursor: pointer; font-family: inherit; ${typoCss(resolveToken(p.label))} white-space: nowrap; }
.date-nav__period:hover { background: ${R(p.hoverBg)}; }
.date-nav__period:focus-visible { outline: ${D(ring.ringWidth)} solid ${R(ring.ringColor)}; outline-offset: ${D(ring.ringOffset)}; }
.date-nav__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.date-nav__chevron { width: ${D(p.chevronSize)}; height: ${D(p.chevronSize)}; flex-shrink: 0; color: ${R(p.chevronColor)}; }
/* the chevron points up while the Calendar is open (Collapsible / Sidebar's rule) */
.date-nav__period[aria-expanded="true"] .date-nav__chevron { transform: rotate(180deg); }
/* split: the period first and flexible, the buttons at the far end */
.date-nav--split .date-nav__period { order: -1; margin-right: auto; margin-left: -${D(p.paddingX)}; }
@media (max-width: 767px) { .date-nav__period { ${typoCss(resolveToken(p.labelPhone))} } }`;

export const DATE_NAV_BUTTON_CSS = `/* Button secondary base, for a page without its own Button recipe — resolved from button.tokens.json */
.date-nav .btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: ${D(secBase.gap)}; height: ${D(secBase.height)}; margin: 0; padding: 0 ${D(secBase.paddingX)}; border: none; border-radius: ${D(sec.radius)}; background: ${R(sec.state.default.fill)}; color: ${R(sec.state.default.label)}; cursor: pointer; font-family: inherit; ${typoCss(resolveToken(secBase.label))} }
.date-nav .btn--icon-only { width: ${D(secBase.height)}; padding: 0; }
.date-nav .btn__icon { width: ${D(secBase.iconSize)}; height: ${D(secBase.iconSize)}; color: ${R(sec.state.default.icon)}; }
.date-nav .btn:hover { background: ${R(sec.state.hover.fill)}; }
.date-nav .btn:active { background: ${R(sec.state.pressed.fill)}; }
.date-nav .btn:focus-visible { outline: ${D(sec.state.focused.ringWidth)} solid ${R(sec.state.focused.ringColor)}; outline-offset: ${D(sec.state.focused.ringOffset)}; }`;

// ---- the period's name — the same rules on the server and the client ----
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LABEL_FN = `function (unit, iso) {
    var MON = ${JSON.stringify(MON)}, MONTH = ${JSON.stringify(MONTH)}, DOW = ${JSON.stringify(DOW)};
    var p = iso.split("-"), d = new Date(+p[0], p[1] - 1, +p[2], 12);
    if (unit === "month") return MONTH[d.getMonth()] + " " + d.getFullYear();
    if (unit === "day") return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    var s = new Date(d); s.setDate(d.getDate() - d.getDay());
    var e = new Date(s); e.setDate(s.getDate() + 6);
    if (s.getFullYear() !== e.getFullYear()) return MON[s.getMonth()] + " " + s.getDate() + ", " + s.getFullYear() + " \\u2013 " + MON[e.getMonth()] + " " + e.getDate() + ", " + e.getFullYear();
    if (s.getMonth() !== e.getMonth()) return MON[s.getMonth()] + " " + s.getDate() + " \\u2013 " + MON[e.getMonth()] + " " + e.getDate() + ", " + e.getFullYear();
    return MON[s.getMonth()] + " " + s.getDate() + " \\u2013 " + e.getDate() + ", " + e.getFullYear();
  }`;
// eslint-disable-next-line no-new-func
const periodLabel = new Function(`return ${LABEL_FN}`)();

/**
 * Date Navigator markup. `value` and `today` are ISO dates; `unit` is day | week | month;
 * `layout` inline | split. `label` names the Calendar panel ("Go to date").
 */
export function dateNavHtml({ id, unit = "week", value, today, layout = "inline", label = "Go to date" }) {
  if (!id || !value) throw new Error("date-navigator: id and value are required");
  const pid = `${id}-panel`;
  return `<div class="date-nav${layout === "split" ? " date-nav--split" : ""}" id="${id}" data-unit="${unit}" data-value="${value}"${today ? ` data-today="${today}"` : ""}>
  <div class="date-nav__controls">
    <button class="btn btn--secondary btn--base btn--icon-only" type="button" data-step="-1" aria-label="Previous ${unit}">${icon("chevron_left", "btn__icon")}</button>
    <button class="btn btn--secondary btn--base btn--icon-only" type="button" data-step="1" aria-label="Next ${unit}">${icon("chevron_right", "btn__icon")}</button>
    <button class="btn btn--secondary btn--base" type="button" data-today>Today</button>
  </div>
  <button class="date-nav__period" type="button" popovertarget="${pid}" aria-haspopup="dialog" aria-expanded="false"><span class="date-nav__label" id="${id}-label">${periodLabel(unit, value)}</span>${icon("expand_more", "date-nav__chevron")}</button>
  <div class="datepicker__panel date-nav__panel" id="${pid}" popover role="dialog" aria-label="${label}">${calendarHtml({ value, today, label })}</div>
</div>`;
}

// Needs CALENDAR_JS first.
export const DATE_NAV_JS = `window.hpDateNav = window.hpDateNav || (function () {
  var label = ${LABEL_FN};
  function d(iso) { var p = iso.split("-"); return new Date(+p[0], p[1] - 1, +p[2], 12); }
  function iso(dt) { return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
  function step(unit, v, n) {
    var x = d(v);
    if (unit === "month") return iso(new Date(x.getFullYear(), x.getMonth() + n, 1, 12));
    x.setDate(x.getDate() + (unit === "day" ? n : 7 * n)); return iso(x);
  }
  function mount(el, opts) {
    opts = opts || {};
    var st = { unit: el.dataset.unit || "week", value: el.dataset.value, today: el.dataset.today || iso(new Date()) };
    var trigger = el.querySelector(".date-nav__period"), panel = el.querySelector(".date-nav__panel");
    var cal = hpCalendar.mount(panel.querySelector(".calendar"), { onChange: function (a) { panel.hidePopover(); trigger.focus(); change(hpCalendar.iso(a), "pick"); } });
    function paint() {
      el.querySelector(".date-nav__label").textContent = label(st.unit, st.value);
      el.querySelectorAll("[data-step]").forEach(function (b) { b.setAttribute("aria-label", (b.dataset.step < 0 ? "Previous " : "Next ") + st.unit); });
      el.dataset.unit = st.unit; el.dataset.value = st.value;
    }
    function change(v, reason) { st.value = v; paint(); if (opts.onChange) opts.onChange(v, reason); }
    el.addEventListener("click", function (e) {
      var s = e.target.closest("[data-step]"); if (s) { change(step(st.unit, st.value, +s.dataset.step), +s.dataset.step < 0 ? "prev" : "next"); return; }
      if (e.target.closest("[data-today]")) change(st.today, "today");
    });
    // float the Calendar under the trigger, flip above if it doesn't fit (DatePicker's rule)
    panel.addEventListener("toggle", function (e) {
      trigger.setAttribute("aria-expanded", e.newState === "open");
      if (e.newState !== "open") return;
      var a = hpCalendar.parse(st.value); cal.setValue(a); cal.setView(a);
      var r = trigger.getBoundingClientRect(), pr = panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, top;
      if (r.bottom + 4 + pr.height <= vh - 8) top = r.bottom + 4; else if (r.top - 4 - pr.height >= 8) top = r.top - 4 - pr.height; else top = Math.max(8, vh - pr.height - 8);
      panel.style.position = "fixed"; panel.style.margin = "0"; panel.style.top = top + "px";
      panel.style.left = Math.max(8, Math.min(r.left, vw - pr.width - 8)) + "px";
      cal.focus();
    });
    paint();
    return { set: function (o) { if (o.unit) st.unit = o.unit; if (o.value) st.value = o.value; paint(); }, get: function () { return { unit: st.unit, value: st.value }; } };
  }
  return { mount: mount, label: label, step: step };
})();`;
