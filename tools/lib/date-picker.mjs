// DatePicker — a Select-style trigger that opens the shared Calendar in a
// native popover. One shared definition (CSS, markup, behaviour) so the
// DatePicker page and the joined date + time field on the TimePicker page
// render the same thing. The grid itself is tools/lib/calendar.mjs.
//
// Consumer: put DATE_PICKER_COLOR_PATHS into its :root vars, CALENDAR_CSS +
// DATE_PICKER_CSS into its sheet, and CALENDAR_JS before DATE_PICKER_JS.
// Each .datepicker fires a bubbling `datechange` event (detail.iso) on pick.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";
import { CALENDAR_COLOR_PATHS, calendarHtml } from "./calendar.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

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
const dp = load("tokens/components/date-picker.tokens.json").component.datePicker;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`date-picker: unresolved token ${ref}`);
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

const t = dp.trigger, panel = dp.panel;
const colorNodes = [t.bg, t.border, t.borderHover, t.borderFocus, t.valueColor, t.placeholderColor, t.icon, panel.bg, panel.border];
export const DATE_PICKER_COLOR_PATHS = [...new Set([...colorNodes.map((n) => refPath(n.$value)), ...CALENDAR_COLOR_PATHS])];

const sh = resolveToken(panel.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;

export const DATE_PICKER_CSS = `
.datepicker { display: inline-block; vertical-align: top; font-family: var(${cssVarName("family.sans")}); }
.datepicker--block { display: block; }
.datepicker__trigger { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${D(t.gap)}; height: ${D(t.height)}; margin: 0; padding: 0 ${D(t.paddingX)}; border-radius: ${D(t.radius)}; background: ${R(t.bg)}; border: 1px solid ${R(t.border)}; cursor: pointer; color: ${R(t.valueColor)}; ${typoCss(resolveToken(get(t.value.$value)))} font-family: inherit; text-align: left; }
.datepicker--block .datepicker__trigger { width: 100%; }
.datepicker__trigger:hover { border-color: ${R(t.borderHover)}; }
.datepicker__trigger:focus-visible { outline: none; border-color: ${R(t.borderFocus)}; }
.datepicker__icon, .datepicker__chevron { width: ${D(t.iconSize)}; height: ${D(t.iconSize)}; color: ${R(t.icon)}; flex-shrink: 0; }
.datepicker__chevron { margin-left: auto; }
.datepicker__value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.datepicker__value--placeholder { color: ${R(t.placeholderColor)}; }
.datepicker__panel { margin: 0; box-sizing: border-box; padding: ${D(panel.padding)}; border-radius: ${D(panel.radius)}; background: ${R(panel.bg)}; border: 1px solid ${R(panel.border)}; box-shadow: ${shadowCss}; font-family: inherit; color: inherit; }`;

const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${MONTHS_ABBR[m - 1]} ${d}, ${y}`; };

/** DatePicker markup. Dates are ISO (YYYY-MM-DD); `block` makes it fill its container.
 *  In a Field: `triggerId` is what the Field's <label for> points at (its name = that label + the chosen date), `describedBy` its description/error ids. */
export function datePickerHtml({ id, value, placeholder = "Select date", today, min, max, label = "Date", block = false, chevron = true, extraClass = "", triggerId = "", describedBy = "" }) {
  const pid = `${id}-panel`;
  const val = value ? `<span class="datepicker__value">${fmt(value)}</span>` : `<span class="datepicker__value datepicker__value--placeholder">${placeholder}</span>`;
  return `<div class="datepicker${block ? " datepicker--block" : ""}${extraClass ? ` ${extraClass}` : ""}" id="${id}"${value ? ` data-value="${value}"` : ""} data-placeholder="${placeholder}">
      <button class="datepicker__trigger" type="button"${triggerId ? ` id="${triggerId}"` : ""} popovertarget="${pid}" aria-haspopup="dialog"${triggerId ? ` aria-labelledby="${triggerId}-label ${triggerId}"` : ` aria-label="${label}"`}${describedBy ? ` aria-describedby="${describedBy}"` : ""}>${icon("calendar_today", "datepicker__icon")}${val}${chevron ? icon("expand_more", "datepicker__chevron") : ""}</button>
      <div class="datepicker__panel" id="${pid}" popover role="dialog" aria-label="Choose a date">${calendarHtml({ value, view: value ? undefined : (today || min)?.slice(0, 7), today, min, max, label })}</div>
    </div>`;
}

// Needs CALENDAR_JS first. Mounts every .datepicker once (re-running is safe).
export const DATE_PICKER_JS = `(function () {
  var ABBR = ${JSON.stringify(MONTHS_ABBR)};
  function fmt(a) { return ABBR[a.m] + " " + a.d + ", " + a.y; }
  document.querySelectorAll(".datepicker").forEach(function (el) {
    if (el._hpdp) return; el._hpdp = true;
    var trigger = el.querySelector(".datepicker__trigger"), panel = el.querySelector(".datepicker__panel"), valEl = el.querySelector(".datepicker__value");
    var calEl = panel.querySelector(".calendar");
    var cal = hpCalendar.mount(calEl, { onChange: function (a) {
      valEl.textContent = fmt(a); valEl.classList.remove("datepicker__value--placeholder");
      el.dataset.value = hpCalendar.iso(a);
      panel.hidePopover(); trigger.focus();
      el.dispatchEvent(new CustomEvent("datechange", { bubbles: true, detail: { iso: el.dataset.value } }));
    } });
    panel.addEventListener("toggle", function (e) {
      if (e.newState !== "open") return;
      var v = cal.getValue(), today = hpCalendar.parse(calEl.dataset.today), min = hpCalendar.parse(calEl.dataset.min);
      var at = v || (today && (!min || hpCalendar.key(today) >= hpCalendar.key(min)) ? today : min) || today;
      if (at) cal.setView(at);
      // float under the trigger; flip above if it doesn't fit; clamp to the viewport
      var r = trigger.getBoundingClientRect(), pr = panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, top;
      if (r.bottom + 4 + pr.height <= vh - 8) top = r.bottom + 4;
      else if (r.top - 4 - pr.height >= 8) top = r.top - 4 - pr.height;
      else top = Math.max(8, vh - pr.height - 8);
      panel.style.position = "fixed"; panel.style.margin = "0";
      panel.style.top = top + "px";
      panel.style.left = Math.max(8, Math.min(r.left, vw - pr.width - 8)) + "px";
      cal.focus();
    });
  });
})();`;
