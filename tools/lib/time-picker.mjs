// TimePicker — a time-of-day field: DatePicker's trigger recipe opening a
// Listbox of fixed slots. Plus the joined date + time field (DatePicker and
// TimePicker sharing one border). One shared definition (CSS, markup,
// behaviour), same reasoning as calendar.mjs / date-picker.mjs.
//
// Self-resolving: the field box comes from date-picker.tokens.json (so date
// and time sit flush), the option rows from listbox.tokens.json, and only
// what neither has from time-picker.tokens.json.
//
// Consumer: TIME_PICKER_COLOR_PATHS into its :root vars, TIME_PICKER_CSS into
// its sheet, TIME_PICKER_JS after it. The joined field also needs the
// DatePicker + Calendar pieces and DATE_TIME_CSS. Each .timepicker fires a
// bubbling `timechange` event (detail.value = "HH:MM" or "").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";
import { datePickerHtml } from "./date-picker.mjs";

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
const tp = load("tokens/components/time-picker.tokens.json").component.timePicker;
const t = load("tokens/components/date-picker.tokens.json").component.datePicker.trigger;
const lb = load("tokens/components/listbox.tokens.json").component.listbox;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`time-picker: unresolved token ${ref}`);
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
const typoCss = (x) => `font-weight: ${x.fontWeight}; font-size: ${px(x.fontSize)}; line-height: ${x.lineHeight};`;
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const colorNodes = [
  t.bg, t.border, t.borderHover, t.borderFocus, t.valueColor, t.placeholderColor, t.icon,
  tp.clear.icon, tp.clear.hoverBg, tp.option.zoneColor,
  lb.bg, lb.border, lb.state.default.text, lb.state.hover.bg, lb.state.selected.checkmark,
];
export const TIME_PICKER_COLOR_PATHS = [...new Set([...colorNodes.map((n) => refPath(n.$value)), "border.focus"])];

const sh = resolveToken(lb.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const valueType = typoCss(resolveToken(get(t.value.$value)));

export const TIME_PICKER_CSS = `
.timepicker { display: inline-block; vertical-align: top; font-family: var(${cssVarName("family.sans")}); }
.timepicker--block { display: block; }
/* the field box is DatePicker's trigger recipe; the trigger button fills it */
.timepicker__control { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${D(t.gap)}; height: ${D(t.height)}; padding: 0 ${D(t.paddingX)}; border-radius: ${D(t.radius)}; background: ${R(t.bg)}; border: 1px solid ${R(t.border)}; cursor: pointer; }
.timepicker--block .timepicker__control { display: flex; width: 100%; }
.timepicker__control:hover { border-color: ${R(t.borderHover)}; }
.timepicker__control:focus-within { border-color: ${R(t.borderFocus)}; }
.timepicker__trigger { flex: 1; min-width: 0; height: 100%; display: inline-flex; align-items: center; gap: ${D(t.gap)}; margin: 0; padding: 0; border: none; background: none; cursor: pointer; color: ${R(t.valueColor)}; ${valueType} font-family: inherit; text-align: left; }
.timepicker__trigger:focus-visible { outline: none; }
.timepicker__icon, .timepicker__chevron { width: ${D(t.iconSize)}; height: ${D(t.iconSize)}; color: ${R(t.icon)}; flex-shrink: 0; }
.timepicker__chevron { pointer-events: none; }
.timepicker__value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timepicker__value--placeholder { color: ${R(t.placeholderColor)}; }
.timepicker__zone { color: ${R(tp.option.zoneColor)}; }
.timepicker__clear { box-sizing: border-box; width: ${D(tp.clear.size)}; height: ${D(tp.clear.size)}; margin: 0; padding: 0; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${D(tp.clear.radius)}; background: none; cursor: pointer; color: ${R(tp.clear.icon)}; }
.timepicker__clear[hidden] { display: none; }
.timepicker__clear:hover { background: ${R(tp.clear.hoverBg)}; }
.timepicker__clear:focus-visible { outline: 2px solid ${R(t.borderFocus)}; outline-offset: -2px; }
.timepicker__clear-icon { width: ${D(tp.clear.iconSize)}; height: ${D(tp.clear.iconSize)}; }
/* the list: Listbox's panel + single-select option rows */
.timepicker__panel { margin: 0; box-sizing: border-box; min-width: ${D(tp.panel.minWidth)}; padding: ${D(lb.padding)}; border-radius: ${D(lb.radius)}; background: ${R(lb.bg)}; border: 1px solid ${R(lb.border)}; box-shadow: ${shadowCss}; font-family: inherit; }
.timepicker__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(lb.gap)}; max-height: ${D(lb.maxHeight)}; overflow-y: auto; }
.timepicker__option { box-sizing: border-box; height: ${D(tp.option.height)}; flex-shrink: 0; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: 0 ${D(lb.optionPaddingX)}; border-radius: ${D(lb.optionRadius)}; cursor: pointer; color: ${R(lb.state.default.text)}; ${typoCss(resolveToken(get(lb.label.$value)))} white-space: nowrap; }
.timepicker__option:hover, .timepicker__option--active { background: ${R(lb.state.hover.bg)}; }
.timepicker__option:focus-visible { outline: 2px solid ${R(t.borderFocus)}; outline-offset: -2px; }
.timepicker__check { width: ${D(lb.checkmarkSize)}; height: ${D(lb.checkmarkSize)}; margin-left: auto; color: ${R(lb.state.selected.checkmark)}; flex-shrink: 0; visibility: hidden; }
.timepicker__option[aria-selected="true"] .timepicker__check { visibility: visible; }`;

// the joined date + time field: one shared border, inner corners square
export const DATE_TIME_CSS = `
.datetime { display: inline-flex; vertical-align: top; }
.datetime > .datepicker, .datetime > .timepicker { flex-shrink: 0; }
.datetime--block { display: flex; }
.datetime--block > .datepicker, .datetime--block > .timepicker { display: block; flex: 1; min-width: 0; }
.datetime--block .datepicker__trigger, .datetime--block .timepicker__control { width: 100%; }
.datetime > .datepicker .datepicker__trigger { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.datetime > .timepicker .timepicker__control { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: -1px; }
/* the hovered / focused half draws its border over the shared hairline */
.datetime .datepicker__trigger:hover, .datetime .datepicker__trigger:focus-visible, .datetime .timepicker__control:hover, .datetime .timepicker__control:focus-within { position: relative; z-index: 1; }`;

const pad = (n) => String(n).padStart(2, "0");
const label12 = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${pad(h % 12 || 12)}:${pad(m)} ${h < 12 ? "AM" : "PM"}`; };
const toMins = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const zoneHtml = (zone) => (zone ? ` <span class="timepicker__zone">${zone}</span>` : "");

/** TimePicker markup. `value` is 24h "HH:MM"; slots every `step` minutes between `min` and `max`. */
export function timePickerHtml({ id, value, step = 30, min = "00:00", max = "23:59", zone = "EST", placeholder = "Select time", label = "Time", block = false, icon: showIcon = true }) {
  const pid = `${id}-panel`;
  const opts = [];
  for (let m = toMins(min); m <= toMins(max); m += step) {
    const v = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    opts.push(`<li class="timepicker__option" role="option" id="${id}-${v.replace(":", "")}" data-value="${v}" aria-selected="${v === value}" tabindex="-1"><span>${label12(m)}${zoneHtml(zone)}</span>${icon("check", "timepicker__check")}</li>`);
  }
  const val = value
    ? `<span class="timepicker__value">${label12(toMins(value))}${zoneHtml(zone)}</span>`
    : `<span class="timepicker__value timepicker__value--placeholder">${placeholder}</span>`;
  return `<div class="timepicker${block ? " timepicker--block" : ""}" id="${id}"${value ? ` data-value="${value}"` : ""} data-placeholder="${placeholder}">
      <div class="timepicker__control">
        <button class="timepicker__trigger" type="button" popovertarget="${pid}" aria-haspopup="listbox" aria-label="${label}">${showIcon ? icon("schedule", "timepicker__icon") : ""}${val}</button>
        <button class="timepicker__clear" type="button" aria-label="Clear ${label.toLowerCase()}"${value ? "" : " hidden"}>${icon("close", "timepicker__clear-icon")}</button>
        ${icon("expand_more", "timepicker__chevron")}
      </div>
      <div class="timepicker__panel" id="${pid}" popover>
        <ul class="timepicker__list" role="listbox" aria-label="${label}">${opts.join("")}</ul>
      </div>
    </div>`;
}

/** The joined date + time field. */
export function dateTimeHtml({ id, date, time, today, min, zone, label = "Date and time", dateLabel = "Date", timeLabel = "Time", block = false }) {
  return `<div class="datetime${block ? " datetime--block" : ""}" role="group" aria-label="${label}">
    ${datePickerHtml({ id: `${id}-date`, value: date, today, min, label: dateLabel })}
    ${timePickerHtml({ id: `${id}-time`, value: time, zone, label: timeLabel, icon: false })}
  </div>`;
}

// Mounts every .timepicker once (re-running is safe).
export const TIME_PICKER_JS = `(function () {
  document.querySelectorAll(".timepicker").forEach(function (el) {
    if (el._hptp) return; el._hptp = true;
    var control = el.querySelector(".timepicker__control"), trigger = el.querySelector(".timepicker__trigger");
    var clear = el.querySelector(".timepicker__clear"), panel = el.querySelector(".timepicker__panel");
    var opts = [].slice.call(el.querySelectorAll(".timepicker__option"));
    var active = null;
    function setActive(o) {
      if (active) active.classList.remove("timepicker__option--active");
      active = o; if (!o) return;
      o.classList.add("timepicker__option--active"); o.focus({ preventScroll: true });
      var l = o.parentNode, top = o.offsetTop - l.offsetTop;
      if (top < l.scrollTop) l.scrollTop = top; else if (top + o.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = top + o.offsetHeight - l.clientHeight;
    }
    function show(o) {
      var v = trigger.querySelector(".timepicker__value");
      if (o) { v.innerHTML = o.firstElementChild.innerHTML; v.classList.remove("timepicker__value--placeholder"); el.dataset.value = o.dataset.value; }
      else { v.textContent = el.dataset.placeholder; v.classList.add("timepicker__value--placeholder"); delete el.dataset.value; }
      opts.forEach(function (x) { x.setAttribute("aria-selected", x === o ? "true" : "false"); });
      clear.hidden = !o;
      el.dispatchEvent(new CustomEvent("timechange", { bubbles: true, detail: { value: o ? o.dataset.value : "" } }));
    }
    function choose(o) { show(o); panel.hidePopover(); trigger.focus(); }
    // the whole box opens the list, not just the text
    // (the chevron has pointer-events: none, so it lands here too); the list may
    // already have light-dismissed itself on pointerdown — don't reopen it then
    var wasOpen = false;
    control.addEventListener("pointerdown", function () { wasOpen = panel.matches(":popover-open"); });
    control.addEventListener("click", function (e) { if (e.target === control && !wasOpen) trigger.click(); });
    clear.addEventListener("click", function () { show(null); trigger.focus(); });
    panel.addEventListener("click", function (e) { var o = e.target.closest(".timepicker__option"); if (o) choose(o); });
    panel.addEventListener("keydown", function (e) {
      var i = opts.indexOf(active), n = null;
      if (e.key === "ArrowDown") n = opts[Math.min(opts.length - 1, i + 1)];
      else if (e.key === "ArrowUp") n = opts[Math.max(0, i - 1)];
      else if (e.key === "Home") n = opts[0];
      else if (e.key === "End") n = opts[opts.length - 1];
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (active) choose(active); return; }
      if (n) { e.preventDefault(); setActive(n); }
    });
    panel.addEventListener("toggle", function (e) {
      if (e.newState !== "open") { setActive(null); return; }
      var r = control.getBoundingClientRect();
      panel.style.width = r.width + "px";
      var pr = panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, top;
      if (r.bottom + 4 + pr.height <= vh - 8) top = r.bottom + 4;
      else if (r.top - 4 - pr.height >= 8) top = r.top - 4 - pr.height;
      else top = Math.max(8, vh - pr.height - 8);
      panel.style.position = "fixed"; panel.style.margin = "0";
      panel.style.top = top + "px";
      panel.style.left = Math.max(8, Math.min(r.left, vw - pr.width - 8)) + "px";
      // land on the selected slot, else the working day's start
      var sel = el.querySelector('.timepicker__option[aria-selected="true"]');
      var start = sel || opts.filter(function (o) { return o.dataset.value >= "09:00"; })[0] || opts[0];
      var l = start.parentNode; l.scrollTop = start.offsetTop - l.offsetTop;
      setActive(start);
    });
  });
})();`;
