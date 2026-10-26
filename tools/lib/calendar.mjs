// Calendar — the month grid every date component is built on, as one shared
// definition: CSS, markup and behaviour. Used by docs/calendar.html (the DS
// page), DatePicker and DateRangePicker, so the grid can't drift between them
// again — before 2026-10-21 each picker carried its own copy with a different
// header. Same reasoning as sidebar.mjs / nav.mjs.
//
// Self-resolving like sidebar.mjs: it reads calendar.tokens.json and resolves
// every role itself, so a consumer only has to put CALENDAR_COLOR_PATHS into
// its :root vars, CALENDAR_CSS into its sheet and CALENDAR_JS before its own
// script, then call hpCalendar.mount(el, { onChange }).
//
// Shapes:
//   single (default)  — one selected day
//   range             — filled start + end, a flush bg.primary band between;
//                       first click = start, second = end (earlier swaps)
//   months: 2         — two consecutive months side by side, paging arrows on
//                       the outer edges only; they stack under 560px
//   min / max         — days outside the window are disabled, and an arrow
//                       that would page entirely past it is disabled too
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
const cal = load("tokens/components/calendar.tokens.json").component.calendar;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`calendar: unresolved token ${ref}`);
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

const hd = cal.header, sel = cal.header.select, wd = cal.weekday, day = cal.day, mo = cal.months;

// Every colour role this recipe paints, read off the token nodes it uses.
const colorNodes = [
  hd.navIcon, hd.navHoverBg, hd.navDisabledIcon,
  sel.chevron, sel.bg, sel.border, sel.borderHover, sel.borderFocus, sel.valueColor,
  wd.color,
  day.color, day.hoverBg, day.todayBorder, day.selectedBg, day.selectedText, day.rangeBg, day.rangeText, day.outsideColor, day.disabledColor,
];
export const CALENDAR_COLOR_PATHS = [...new Set(colorNodes.map((n) => refPath(n.$value)))];

const wdNode = get(wd.label.$value);
const wdExt = wdNode.$extensions?.["hp.design/text"] || {};
const daySize = D(day.size), dayRadius = D(day.radius), navSize = D(hd.navSize);

export const CALENDAR_CSS = `
.calendar { display: inline-block; vertical-align: top; }
.calendar__months { display: flex; gap: ${D(mo.gap)}; }
.calendar__head { display: flex; align-items: center; justify-content: space-between; gap: ${D(hd.gap)}; margin-bottom: ${D(hd.marginBottom)}; }
.calendar__selects { display: flex; align-items: center; gap: ${D(sel.gap)}; }
/* month / year select — a 32px control in the field family, chevron = expand_more */
.calendar__sel { position: relative; display: inline-flex; }
.calendar__select { appearance: none; -webkit-appearance: none; box-sizing: border-box; height: ${D(sel.height)}; margin: 0; padding: 0 ${D(sel.paddingRight)} 0 ${D(sel.paddingLeft)}; border: 1px solid ${R(sel.border)}; border-radius: ${D(sel.radius)}; background: ${R(sel.bg)}; color: ${R(sel.valueColor)}; font-family: inherit; ${typoCss(resolveToken(get(sel.value.$value)))} cursor: pointer; }
.calendar__select:hover { border-color: ${R(sel.borderHover)}; }
.calendar__select:focus-visible { outline: none; border-color: ${R(sel.borderFocus)}; }
.calendar__sel-chevron { position: absolute; right: ${D(sel.chevronInset)}; top: 50%; transform: translateY(-50%); width: ${D(sel.chevronSize)}; height: ${D(sel.chevronSize)}; color: ${R(sel.chevron)}; pointer-events: none; }
/* paging arrows; with two months the inner sides keep a same-width spacer */
.calendar__nav { box-sizing: border-box; width: ${navSize}; height: ${navSize}; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: none; background: none; border-radius: ${D(sel.radius)}; cursor: pointer; color: ${R(hd.navIcon)}; }
.calendar__nav:hover { background: ${R(hd.navHoverBg)}; }
.calendar__nav:disabled { color: ${R(hd.navDisabledIcon)}; background: none; cursor: default; }
.calendar__nav:focus-visible { outline: 2px solid ${R(sel.borderFocus)}; outline-offset: -2px; }
.calendar__nav-icon { width: ${D(hd.navIconSize)}; height: ${D(hd.navIconSize)}; }
.calendar__nav-sp { width: ${navSize}; flex-shrink: 0; }
.calendar__grid { display: grid; grid-template-columns: repeat(7, ${daySize}); gap: ${D(day.rowGap)} 0; }
.calendar__weekday { width: ${daySize}; height: ${D(wd.height)}; display: inline-flex; align-items: center; justify-content: center; color: ${R(wd.color)}; ${typoCss(resolveToken(wdNode))}${wdExt.textTransform ? ` text-transform: ${wdExt.textTransform};` : ""}${wdExt.letterSpacing ? ` letter-spacing: ${wdExt.letterSpacing};` : ""} }
.calendar__day { box-sizing: border-box; width: ${daySize}; height: ${daySize}; margin: 0; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: ${dayRadius}; background: none; cursor: pointer; color: ${R(day.color)}; ${typoCss(resolveToken(get(day.label.$value)))} font-family: inherit; }
.calendar__day:hover { background: ${R(day.hoverBg)}; }
.calendar__day:focus-visible { outline: 2px solid ${R(sel.borderFocus)}; outline-offset: -2px; }
.calendar__day--outside { color: ${R(day.outsideColor)}; cursor: default; }
.calendar__day--outside:hover { background: none; }
.calendar__day--today { border-color: ${R(day.todayBorder)}; }
.calendar__day:disabled { color: ${R(day.disabledColor)}; background: none; cursor: default; }
/* range: the wash runs edge-to-edge; the ends round on their outer side */
.calendar__day--mid, .calendar__day--mid:hover { background: ${R(day.rangeBg)}; color: ${R(day.rangeText)}; border-radius: 0; }
.calendar__day--selected, .calendar__day--selected:hover { background: ${R(day.selectedBg)}; color: ${R(day.selectedText)}; border-color: ${R(day.selectedBg)}; }
.calendar__day--start { border-radius: ${dayRadius} 0 0 ${dayRadius}; }
.calendar__day--end { border-radius: 0 ${dayRadius} ${dayRadius} 0; }
.calendar__day--start.calendar__day--end { border-radius: ${dayRadius}; }
/* narrow containers: two months stack */
@media (max-width: 560px) { .calendar__months { flex-direction: column; gap: ${D(mo.stackedGap)}; } }`;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parseIso = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return { y, m: m - 1, d: d || 1 }; };

function monthHead(i, months, view) {
  const prev = i === 0 ? `<button class="calendar__nav calendar__nav--prev" type="button" aria-label="Previous month">${icon("chevron_left", "calendar__nav-icon")}</button>` : `<span class="calendar__nav-sp"></span>`;
  const next = i === months - 1 ? `<button class="calendar__nav calendar__nav--next" type="button" aria-label="Next month">${icon("chevron_right", "calendar__nav-icon")}</button>` : `<span class="calendar__nav-sp"></span>`;
  const v = new Date(view.y, view.m + i, 1);
  const monthOpts = MONTHS.map((m, k) => `<option value="${k}"${k === v.getMonth() ? " selected" : ""}>${m}</option>`).join("");
  const yearOpts = `<option value="${v.getFullYear()}" selected>${v.getFullYear()}</option>`;
  const chev = icon("expand_more", "calendar__sel-chevron");
  return `<div class="calendar__head">${prev}<span class="calendar__selects"><span class="calendar__sel"><select class="calendar__select calendar__select--month" aria-label="Month">${monthOpts}</select>${chev}</span><span class="calendar__sel"><select class="calendar__select calendar__select--year" aria-label="Year">${yearOpts}</select>${chev}</span></span>${next}</div>`;
}

/**
 * Calendar markup. The day grids are filled by hpCalendar.mount() on the client.
 * Dates are ISO strings (YYYY-MM-DD); `view` (YYYY-MM) defaults to the value / start.
 */
export function calendarHtml({ mode = "single", months = 1, value, start, end, view, today, min, max, label = "Calendar" } = {}) {
  const v = parseIso(view) || parseIso(value) || parseIso(start) || parseIso(today) || { y: 2026, m: 0 };
  const data = { mode, value, start, end, view, today, min, max };
  const attrs = Object.entries(data).filter(([, x]) => x).map(([k, x]) => ` data-${k}="${x}"`).join("");
  const monthsHtml = Array.from({ length: months }, (_, i) => `<div class="calendar__month">${monthHead(i, months, v)}<div class="calendar__grid" role="group"></div></div>`).join("");
  return `<div class="calendar" role="group" aria-label="${label}"${attrs}><div class="calendar__months">${monthsHtml}</div></div>`;
}

// Client runtime: one namespaced global (window.hpCalendar), so it can sit next
// to a prototype's own single IIFE without hoisting into it. Idempotent — a
// page that inlines it twice (DatePicker + DateRangePicker) keeps the first.
export const CALENDAR_JS = `window.hpCalendar = window.hpCalendar || (function () {
  var MONTHS = ${JSON.stringify(MONTHS)};
  var WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var WD_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function pad(n) { return ("0" + n).slice(-2); }
  function parse(s) { if (!s) return null; var p = s.split("-").map(Number); return { y: p[0], m: p[1] - 1, d: p[2] || 1 }; }
  function iso(a) { return a ? a.y + "-" + pad(a.m + 1) + "-" + pad(a.d) : ""; }
  function key(a) { return a.y * 10000 + a.m * 100 + a.d; }
  function mkey(a) { return a.y * 100 + a.m; }
  function fromDate(dt) { return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }; }
  function addDays(a, n) { return fromDate(new Date(a.y, a.m, a.d + n)); }
  function viewAdd(v, n) { var dt = new Date(v.y, v.m + n, 1); return { y: dt.getFullYear(), m: dt.getMonth() }; }
  function addMonths(a, n) { var last = new Date(a.y, a.m + n + 1, 0).getDate(); var dt = new Date(a.y, a.m + n, Math.min(a.d, last)); return fromDate(dt); }

  function mount(el, opts) {
    opts = opts || {};
    var ds = el.dataset, mode = ds.mode || "single";
    var monthEls = [].slice.call(el.querySelectorAll(".calendar__month"));
    var today = parse(ds.today) || fromDate(new Date());
    var min = parse(ds.min), max = parse(ds.max);
    var st = { value: parse(ds.value), start: parse(ds.start), end: parse(ds.end) };
    var anchor = parse(ds.view) || st.value || st.start || today;
    var view = { y: anchor.y, m: anchor.m };
    var focusDate = null;
    function allowed(a) { var k = key(a); return !(min && k < key(min)) && !(max && k > key(max)); }
    function visible(a) { var k = mkey(a); return k >= mkey(view) && k <= mkey(viewAdd(view, monthEls.length - 1)); }
    function tabTarget() {
      var c = [focusDate, mode === "single" ? st.value : st.start, today];
      for (var i = 0; i < c.length; i++) if (c[i] && visible(c[i]) && allowed(c[i])) return iso(c[i]);
      for (var d = 1; d <= 31; d++) { var f = { y: view.y, m: view.m, d: d }; if (allowed(f)) return iso(f); }
      return null;
    }
    function render() {
      var tab = tabTarget();
      var s = st.start, e = st.end;
      monthEls.forEach(function (mEl, i) {
        var v = viewAdd(view, i);
        var mSel = mEl.querySelector(".calendar__select--month"), ySel = mEl.querySelector(".calendar__select--year");
        mSel.value = v.m;
        var y0 = (min ? Math.min(min.y, v.y) : v.y - 10), y1 = (max ? Math.max(max.y, v.y) : v.y + 10), yo = "";
        for (var y = y0; y <= y1; y++) yo += '<option value="' + y + '"' + (y === v.y ? " selected" : "") + ">" + y + "</option>";
        ySel.innerHTML = yo;
        var first = new Date(v.y, v.m, 1).getDay(), days = new Date(v.y, v.m + 1, 0).getDate(), prevDays = new Date(v.y, v.m, 0).getDate();
        var html = WD.map(function (w, k) { return '<span class="calendar__weekday" title="' + WD_FULL[k] + '">' + w + "</span>"; }).join("");
        var i2, n = first + days;
        for (i2 = 0; i2 < first; i2++) html += '<span class="calendar__day calendar__day--outside" aria-hidden="true">' + (prevDays - first + 1 + i2) + "</span>";
        for (var d = 1; d <= days; d++) {
          var a = { y: v.y, m: v.m, d: d }, k = key(a), cls = ["calendar__day"], on = false;
          if (k === key(today)) cls.push("calendar__day--today");
          if (mode === "single") { if (st.value && k === key(st.value)) { cls.push("calendar__day--selected"); on = true; } }
          else if (s) {
            var eK = e ? key(e) : key(s);
            if (k === key(s)) { cls.push("calendar__day--selected", "calendar__day--start"); on = true; }
            if (k === eK) { cls.push("calendar__day--selected", "calendar__day--end"); on = true; }
            if (k > key(s) && k < eK) cls.push("calendar__day--mid");
          }
          var label = WD_FULL[new Date(v.y, v.m, d).getDay()] + ", " + MONTHS[v.m] + " " + d + ", " + v.y;
          html += '<button type="button" class="' + cls.join(" ") + '" data-iso="' + iso(a) + '" aria-label="' + label + '" aria-pressed="' + on + '"' +
            (k === key(today) ? ' aria-current="date"' : "") + (allowed(a) ? "" : " disabled") + ' tabindex="' + (iso(a) === tab ? 0 : -1) + '">' + d + "</button>";
        }
        for (i2 = 1; (n + i2 - 1) % 7 !== 0; i2++) html += '<span class="calendar__day calendar__day--outside" aria-hidden="true">' + i2 + "</span>";
        var grid = mEl.querySelector(".calendar__grid");
        grid.innerHTML = html;
        grid.setAttribute("aria-label", MONTHS[v.m] + " " + v.y);
      });
      var prev = el.querySelector(".calendar__nav--prev"), next = el.querySelector(".calendar__nav--next");
      if (prev) prev.disabled = !!(min && mkey(viewAdd(view, -1)) < mkey(min));
      if (next) next.disabled = !!(max && mkey(viewAdd(view, monthEls.length)) > mkey(max));
    }
    function setView(v) { view = { y: v.y, m: v.m }; render(); }
    function pick(a) {
      if (mode === "single") st.value = a;
      else if (!st.start || st.end) { st.start = a; st.end = null; }
      else if (key(a) < key(st.start)) { st.end = st.start; st.start = a; }
      else st.end = a;
      focusDate = a; render();
      if (opts.onChange) opts.onChange(api.getValue());
    }
    function moveFocus(a) {
      if (!allowed(a)) return;
      focusDate = a;
      if (!visible(a)) view = mkey(a) < mkey(view) ? { y: a.y, m: a.m } : viewAdd({ y: a.y, m: a.m }, -(monthEls.length - 1));
      render();
      var b = el.querySelector('.calendar__day[data-iso="' + iso(a) + '"]'); if (b) b.focus();
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest(".calendar__day[data-iso]");
      if (b && !b.disabled) { pick(parse(b.dataset.iso)); var f = el.querySelector('.calendar__day[data-iso="' + b.dataset.iso + '"]'); if (f) f.focus(); return; }
      if (e.target.closest(".calendar__nav--prev")) setView(viewAdd(view, -1));
      else if (e.target.closest(".calendar__nav--next")) setView(viewAdd(view, 1));
    });
    el.addEventListener("change", function (e) {
      var mEl = e.target.closest(".calendar__month"); if (!mEl) return;
      var i = monthEls.indexOf(mEl), v = viewAdd(view, i);
      if (e.target.classList.contains("calendar__select--month")) v.m = parseInt(e.target.value, 10);
      else v.y = parseInt(e.target.value, 10);
      setView(viewAdd(v, -i));
    });
    el.addEventListener("keydown", function (e) {
      var b = e.target.closest(".calendar__day[data-iso]"); if (!b) return;
      var a = parse(b.dataset.iso), wdn = new Date(a.y, a.m, a.d).getDay(), t = null;
      switch (e.key) {
        case "ArrowLeft": t = addDays(a, -1); break;
        case "ArrowRight": t = addDays(a, 1); break;
        case "ArrowUp": t = addDays(a, -7); break;
        case "ArrowDown": t = addDays(a, 7); break;
        case "Home": t = addDays(a, -wdn); break;
        case "End": t = addDays(a, 6 - wdn); break;
        case "PageUp": t = addMonths(a, e.shiftKey ? -12 : -1); break;
        case "PageDown": t = addMonths(a, e.shiftKey ? 12 : 1); break;
      }
      if (t) { e.preventDefault(); moveFocus(t); }
    });
    var api = {
      el: el, render: render, setView: setView,
      getValue: function () { return mode === "single" ? st.value : { start: st.start, end: st.end }; },
      setValue: function (v) { if (mode === "single") st.value = v; else { st.start = v ? v.start : null; st.end = v ? v.end : null; } focusDate = null; render(); },
      focus: function () { var b = el.querySelector('.calendar__day[tabindex="0"]'); if (b) b.focus(); }
    };
    render();
    return api;
  }
  return { mount: mount, parse: parse, iso: iso, key: key, viewAdd: viewAdd, addMonths: addMonths, MONTHS: MONTHS };
})();`;
