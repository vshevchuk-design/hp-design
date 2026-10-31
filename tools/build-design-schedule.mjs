// Generates Advising → Schedule:
//   docs/designs/schedule.html          — viewer page
//   docs/designs/schedule-app.html      — the prototype, CX + ARM (current)
//   docs/designs/schedule-cx-app.html   — the same page where ARM isn't licensed
//
// One Schedule for both products. The live app has two: CX's (main nav →
// Schedule: enrolled + wait-listed classes, Week / Month / list, Download
// .ics, print, Filter by Friend, an "Other" row for classes with no time) and
// ARM's (Advising → Schedule, read off a saved copy 2026-10-31: Class
// Schedule, Class Exams, Wait List Classes, Appointments, Workshops as
// checkboxes with a legend, Mon–Fri week only, an "Unscheduled" row, a
// Details / Information dialog per class). This page is their union, on DS
// components in the CX shell; ARM's types (appointments, drop-ins, workshops)
// are simply absent where ARM isn't installed — same page, fewer filters.
// What changed in the UI:
//   · the legend and the type checkboxes are one row of filter Chips, each
//     with its colour — the legend *is* the filter;
//   · Week / Month / List is one segmented Tabs (CX had a Time Period select
//     and a separate list / calendar switch);
//   · the date range is the page heading and opens a Calendar to jump;
//   · weekends show only when something is on them (ARM: never, CX: always);
//   · events carry title, time and room — no per-event time zone ("GMT-7" on
//     every block); one line under the grid says the zone;
//   · wait-listed classes are amber and dashed, so a backup class never reads
//     as one you're in; overlapping events sit side by side;
//   · on a phone Week becomes one day at a time with a day strip.
// Sample data: tools/lib/sch-data.mjs.
// Run: node tools/build-design-schedule.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { cxApp, icon } from "./lib/cx-shell.mjs";
import { CX_NAV, CX_ASSISTANT_PROMPTS } from "./lib/cx-data.mjs";
import { CALENDAR_CSS, CALENDAR_JS, CALENDAR_COLOR_PATHS, calendarHtml } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS } from "./lib/date-picker.mjs";
import * as S from "./lib/sch-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const pageCss = (X) => {
  const { tokens, R, D, dim, cv, px, typoCss, style, textExt } = X;
  const { badge, card, chip, button } = tokens;
  const tg = chip.toggle;
  const lbl = style("label-sm");
  const lblCase = textExt("text-style.label-sm").textTransform || "none";
  const evRadius = px(X.resolve("radius.sm"));
  const HOUR = dim(16); // 64px an hour — a 50-minute class fits title, time and room
  return `
${CALENDAR_CSS}
${DATE_PICKER_CSS}
/* ============ Schedule — sch-* composition layer ============ */
.cx-page { max-width: none; gap: ${dim(4)}; }
/* Event types: the Badge colours (badge.color.*) — tint fill, solid bar */
${S.SCH_TYPES.map((t) => `.sch-t--${t.key} { --ev-bg: ${R(badge.color[t.color].tint.bg)}; --ev-fg: ${R(badge.color[t.color].tint.text)}; --ev-bar: ${R(badge.color[t.color].solid.bg)}; }`).join("\n")}
.sch-t--friend { --ev-bg: ${cv("surface.default")}; --ev-fg: ${cv("text.secondary")}; --ev-bar: ${cv("border.default")}; }

/* ---- toolbar: ‹ › Today · range ……… Week|Month|List · print · .ics ---- */
.sch-bar { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(3)} ${dim(4)}; }
.sch-bar__nav { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
.sch-bar__end { margin-left: auto; display: flex; align-items: center; gap: ${dim(2)}; }
.sch-range { display: inline-flex; align-items: center; gap: ${dim(1)}; height: ${D(button.secondary.size.base.height)}; padding: 0 ${dim(2)}; margin-left: ${dim(1)}; border: none; border-radius: ${D(button.ghost.radius || button.secondary.radius)}; background: transparent; color: ${cv("text.default")}; cursor: pointer; font-family: inherit; ${typoCss(style("heading-lg"))} white-space: nowrap; }
.sch-range:hover { background: ${R(button.ghost.state.hover.fill)}; }
.sch-range:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }
.sch-range svg { width: ${dim(5)}; height: ${dim(5)}; color: ${cv("icon.secondary")}; }
.sch-pick { padding: ${dim(3)}; }

/* ---- filters: the legend is the filter ---- */
.sch-filters { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.sch-filters__friend { margin-left: auto; }
.sch-dot { width: ${dim(2)}; height: ${dim(2)}; border-radius: 50%; flex-shrink: 0; background: var(--ev-bar); }
.sch-t--waitlist .sch-dot { background: transparent; box-shadow: inset 0 0 0 2px var(--ev-bar); }
/* A type that's on is a plain Chip with its colour dot — six pressed chips
   in a row were a wall of blue; the dot carries "on". Off = muted label,
   dashed border, gray dot. */
.chip.sch-chip[aria-pressed="true"] { background: ${R(tg.default.bg)}; border-color: ${R(tg.default.border)}; color: ${R(tg.default.text)}; }
.chip.sch-chip:hover { background: ${R(tg.hover.bg)}; border-color: ${R(tg.hover.border)}; }
.chip.sch-chip[aria-pressed="false"] { color: ${cv("text.muted")}; border-style: dashed; }
.chip.sch-chip[aria-pressed="false"] .sch-dot { background: ${cv("border.default")}; box-shadow: none; }

/* ---- the calendar surface ---- */
.sch-surface { background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; }
.sch-eyebrow { color: ${cv("text.secondary")}; ${typoCss(lbl)} text-transform: ${lblCase}; letter-spacing: ${px(lbl.letterSpacing)}; }
.sch-note { margin: 0; color: ${cv("text.muted")}; ${typoCss(style("body-sm"))} }

/* No set time (ARM "Unscheduled", CX "Other") — classes with no meeting pattern */
.sch-notime { display: flex; align-items: center; gap: ${dim(3)} ${dim(4)}; flex-wrap: wrap; padding: ${dim(3)} ${dim(4)}; border-bottom: 1px solid ${cv("border.default")}; }
.sch-notime__list { display: flex; flex-wrap: wrap; gap: ${dim(2)}; min-width: 0; }
.sch-notime .sch-ev { position: static; width: auto; max-width: ${dim(72)}; height: auto; }

/* an event block — tint fill, a 4px bar in the type's solid colour */
.sch-ev { position: absolute; display: flex; flex-direction: column; gap: 0; min-width: 0; overflow: hidden; padding: ${dim(1)} ${dim(2)} ${dim(1)} ${dim(3)}; border: none; border-radius: ${evRadius}; background: var(--ev-bg); color: ${cv("text.default")}; text-align: left; cursor: pointer; font-family: inherit; box-shadow: inset ${dim(1)} 0 0 var(--ev-bar); }
.sch-ev:hover { filter: brightness(0.97); }
.sch-ev:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 1px; z-index: 3; }
.sch-ev__title { ${typoCss(style("heading-sm"))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sch-ev__meta { color: ${cv("text.secondary")}; ${typoCss(style("body-xs"))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* wait list: dashed outline — a backup class, not one you're in */
.sch-ev.sch-t--waitlist { background: ${cv("surface.default")}; box-shadow: inset ${dim(1)} 0 0 var(--ev-bar); outline: 1px dashed var(--ev-bar); outline-offset: -1px; }
.sch-ev.sch-t--friend { box-shadow: none; outline: 1px dashed ${cv("border.default")}; outline-offset: -1px; background: repeating-linear-gradient(135deg, ${cv("surface.sunken")} 0 ${dim(1)}, ${cv("surface.default")} ${dim(1)} ${dim(2)}); }
.sch-ev.is-past { opacity: 0.64; }

/* ---- Week ---- */
.sch-week { --cols: 5; }
.sch-week__head, .sch-week__body { display: grid; grid-template-columns: ${dim(14)} repeat(var(--cols), minmax(0, 1fr)); }
.sch-week__head { position: sticky; top: ${dim(16)}; z-index: 4; background: ${R(card.bg)}; border-bottom: 1px solid ${cv("border.default")}; border-radius: ${D(card.radius)} ${D(card.radius)} 0 0; }
.sch-dayhead { display: flex; align-items: center; justify-content: center; gap: ${dim(2)}; height: ${dim(12)}; border-left: 1px solid ${cv("border.default")}; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.sch-dayhead__num { display: inline-flex; align-items: center; justify-content: center; min-width: ${dim(8)}; height: ${dim(8)}; padding: 0 ${dim(1)}; border-radius: 999px; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
.sch-dayhead.is-today { color: ${cv("text.primary")}; }
.sch-dayhead.is-today .sch-dayhead__num { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; }
.sch-week__body { position: relative; }
.sch-times { position: relative; }
.sch-time { position: absolute; right: ${dim(2)}; transform: translateY(-50%); color: ${cv("text.muted")}; ${typoCss(style("body-xs"))} white-space: nowrap; }
.sch-col { position: relative; border-left: 1px solid ${cv("border.default")}; background-image: linear-gradient(${cv("border.default")} 1px, transparent 1px); background-size: 100% ${HOUR}; }
.sch-col.is-today { background-color: ${cv("surface.page")}; }
.sch-col .sch-ev { margin: 0 ${dim("0_5")}; }
.sch-now { position: absolute; left: 0; right: 0; height: 2px; background: ${cv("text.danger")}; z-index: 2; pointer-events: none; }
.sch-now::before { content: ""; position: absolute; left: -${dim(1)}; top: -${dim(1)}; width: ${dim(2)}; height: ${dim(2)}; margin-top: 1px; border-radius: 50%; background: ${cv("text.danger")}; }
.sch-foot { padding: ${dim(3)} ${dim(4)}; border-top: 1px solid ${cv("border.default")}; }
/* phone: one day at a time — a strip of the week's days picks it */
.sch-strip { display: none; }

/* ---- Month ---- */
.sch-month__dows, .sch-month__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.sch-month__dows { border-bottom: 1px solid ${cv("border.default")}; }
.sch-month__dow { padding: ${dim(2)} 0; text-align: center; color: ${cv("text.secondary")}; ${typoCss(lbl)} text-transform: ${lblCase}; letter-spacing: ${px(lbl.letterSpacing)}; }
.sch-mcell { display: flex; flex-direction: column; gap: ${dim("0_5")}; min-width: 0; min-height: ${dim(28)}; padding: ${dim(1)} ${dim(1)} ${dim(2)}; border-right: 1px solid ${cv("border.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.sch-mcell:nth-child(7n) { border-right: none; }
.sch-mcell.is-outside { background: ${cv("surface.page")}; }
.sch-mcell__num { align-self: flex-end; display: inline-flex; align-items: center; justify-content: center; min-width: ${dim(7)}; height: ${dim(7)}; padding: 0 ${dim(1)}; border: none; border-radius: 999px; background: transparent; color: ${cv("text.default")}; cursor: pointer; font-family: inherit; ${typoCss(style("body-sm"))} }
.sch-mcell__num:hover { background: ${R(button.ghost.state.hover.fill)}; }
.sch-mcell.is-outside .sch-mcell__num { color: ${cv("text.muted")}; }
.sch-mcell.is-today .sch-mcell__num { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; font-weight: 600; }
.sch-mev { display: flex; align-items: center; gap: ${dim("1_5")}; width: 100%; min-width: 0; height: ${dim(6)}; padding: 0 ${dim(1)}; border: none; border-radius: ${evRadius}; background: transparent; color: ${cv("text.default")}; cursor: pointer; font-family: inherit; text-align: left; ${typoCss(style("body-xs"))} }
.sch-mev:hover { background: var(--ev-bg); }
.sch-mev__title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sch-mev__time { flex-shrink: 0; color: ${cv("text.muted")}; }
.sch-mev.is-past { color: ${cv("text.muted")}; }
.sch-more { align-self: flex-start; height: ${dim(6)}; padding: 0 ${dim(1)}; border: none; border-radius: ${evRadius}; background: transparent; color: ${cv("text.primary")}; cursor: pointer; font-family: inherit; ${typoCss(style("heading-xs"))} }
.sch-more:hover { background: ${R(button.ghost.state.hover.fill)}; }
.sch-mdots { display: none; }

/* ---- List ---- */
.sch-list { display: flex; flex-direction: column; }
.sch-lday { border-bottom: 1px solid ${cv("border.default")}; }
.sch-lday:last-child { border-bottom: none; }
.sch-lday__head { display: flex; align-items: baseline; gap: ${dim(2)}; padding: ${dim(3)} ${dim(4)} ${dim(1)}; margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.sch-lday__head .badge { align-self: center; }
.sch-lrow { display: grid; grid-template-columns: ${dim(44)} minmax(0, 1fr) auto; align-items: center; gap: ${dim(4)}; width: 100%; min-height: ${dim(14)}; padding: ${dim(2)} ${dim(4)}; border: none; background: transparent; color: ${cv("text.default")}; cursor: pointer; font-family: inherit; text-align: left; }
.sch-lrow:hover { background: ${cv("surface.page")}; }
.sch-lrow:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: -2px; }
.sch-lrow__time { display: flex; align-items: center; gap: ${dim(2)}; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
.sch-lrow__main { display: flex; flex-direction: column; min-width: 0; }
.sch-lrow__title { ${typoCss(style("heading-base"))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sch-lrow__meta { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sch-lrow.is-past { color: ${cv("text.muted")}; }
.sch-badge { background: var(--ev-bg); color: var(--ev-fg); }

/* ---- the event dialog ---- */
.sch-dlg .dialog__body { display: flex; flex-direction: column; gap: ${dim(5)}; }
.sch-dlg__badges { display: flex; flex-wrap: wrap; gap: ${dim(2)}; }
.sch-dlg__section { display: flex; flex-direction: column; gap: ${dim(3)}; }
.sch-dlg__section + .sch-dlg__section { padding-top: ${dim(5)}; border-top: 1px solid ${R(card.divider)}; }
.sch-dlg .ss-dl { grid-template-columns: ${dim(32)} minmax(0, 1fr); }
.sch-dlg .ss-dl dd.is-empty { color: ${cv("text.muted")}; }

/* ---- tablet: the bar's end drops under the range ---- */
@container (max-width: 879px) {
  .sch-bar__end { margin-left: 0; width: 100%; }
  .sch-bar__end .tabs--segmented { margin-right: auto; }
}
/* ---- phone ---- */
@media (max-width: 767px) {
  .sch-range { ${typoCss(style("heading-md"))} margin-left: 0; padding: 0 ${dim(1)}; }
  .sch-bar__nav { width: 100%; }
  .sch-bar__nav .sch-range { margin-right: auto; order: -1; }
  .sch-print { display: none; }
  .sch-bar__end .tabs--segmented { flex: 1; }
  .sch-bar__end .tabs--segmented .tab { flex: 1; }
  .sch-filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -${dim(4)}; padding: 0 ${dim(4)}; }
  .sch-filters::-webkit-scrollbar { display: none; }
  .sch-filters__friend { margin-left: 0; }
  .sch-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: ${dim(1)}; padding: ${dim(2)}; border-bottom: 1px solid ${cv("border.default")}; }
  .sch-strip__day { display: flex; flex-direction: column; align-items: center; gap: ${dim("0_5")}; padding: ${dim(1)} 0; border: none; border-radius: ${D(card.radius)}; background: transparent; color: ${cv("text.secondary")}; cursor: pointer; font-family: inherit; ${typoCss(style("body-xs"))} }
  .sch-strip__num { display: inline-flex; align-items: center; justify-content: center; width: ${dim(8)}; height: ${dim(8)}; border-radius: 50%; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
  .sch-strip__dots { display: flex; gap: 2px; height: ${dim(1)}; }
  .sch-strip__dots .sch-dot { width: ${dim(1)}; height: ${dim(1)}; }
  .sch-strip__day.is-today .sch-strip__num { color: ${cv("text.primary")}; box-shadow: inset 0 0 0 1px ${cv("text.primary")}; }
  .sch-strip__day[aria-pressed="true"] .sch-strip__num { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; box-shadow: none; }
  .sch-week__head { display: none; }
  .sch-col.is-today { background-color: transparent; }
  .sch-week__body { grid-template-columns: ${dim(12)} minmax(0, 1fr); }
  .sch-notime { padding: ${dim(3)}; }
  .sch-notime .sch-ev { max-width: 100%; }
  /* month: dots, tap a day → that day */
  .sch-mcell { min-height: ${dim(14)}; align-items: center; padding: ${dim(1)} 0; gap: ${dim(1)}; border-right: none; }
  .sch-mcell__num { align-self: center; }
  .sch-mev, .sch-more { display: none; }
  .sch-mdots { display: flex; gap: 2px; }
  .sch-mdots .sch-dot { width: ${dim("1_5")}; height: ${dim("1_5")}; }
  .sch-lrow { grid-template-columns: minmax(0, 1fr); gap: ${dim(1)}; padding: ${dim(3)} ${dim(4)}; }
  .sch-lrow .badge { justify-self: start; }
  .sch-dlg .ss-dl { grid-template-columns: minmax(0, 1fr); gap: ${dim(1)} 0; }
  .sch-dlg .ss-dl dd { margin-bottom: ${dim(2)}; }
}
/* print: the calendar alone */
@media print {
  .sidebar, .sidebar-scrim, .cx-topbar, .fab, .sch-bar__end, .sch-filters, .sch-bar__nav .btn { display: none !important; }
  .cx-page { padding: 0; }
  .sch-week__head { position: static; }
}
`;
};

const chevronDown = icon("expand_more", "chip__icon");
const viewsFor = (arm) => {
  const types = S.SCH_TYPES.filter((t) => arm || !t.arm);
  return `
      <div class="sch-bar">
        <div class="sch-bar__nav">
          <button class="btn btn--secondary btn--base btn--icon-only" id="sch-prev" type="button" aria-label="Previous week">${icon("chevron_left", "btn__icon")}</button>
          <button class="btn btn--secondary btn--base btn--icon-only" id="sch-next" type="button" aria-label="Next week">${icon("chevron_right", "btn__icon")}</button>
          <button class="btn btn--secondary btn--base" id="sch-today" type="button">Today</button>
          <button class="sch-range" id="sch-range" type="button" popovertarget="sch-pick" aria-haspopup="dialog"><span id="sch-range-label"></span>${icon("expand_more", "")}</button>
        </div>
        <div class="sch-bar__end">
          <div class="tabs--segmented" id="sch-views" role="tablist" aria-label="View">
            <button class="tab tab--sm" type="button" role="tab" data-view="week">Week</button>
            <button class="tab tab--sm" type="button" role="tab" data-view="month">Month</button>
            <button class="tab tab--sm" type="button" role="tab" data-view="list">List</button>
          </div>
          <button class="btn btn--secondary btn--base btn--icon-only sch-print" id="sch-print" type="button" aria-label="Print">${icon("print", "btn__icon")}</button>
          <button class="btn btn--secondary btn--base" id="sch-ics" type="button" aria-haspopup="menu" aria-expanded="false">${icon("download", "btn__icon")}<span>.ics</span>${icon("expand_more", "btn__icon")}</button>
        </div>
      </div>
      <div class="sch-filters" role="group" aria-label="Show">
        ${types.map((t) => `<button class="chip chip--lg sch-chip sch-t--${t.key}" type="button" aria-pressed="true" data-type="${t.key}"><span class="sch-dot"></span>${t.label}</button>`).join("\n        ")}
        <button class="chip chip--lg chip--dropdown sch-filters__friend" id="sch-friend" type="button" aria-haspopup="listbox" aria-expanded="false">${icon("group", "chip__icon")}<span class="chip__label" id="sch-friend-label">Compare with a friend</span>${chevronDown}</button>
      </div>
      <section class="sch-surface" id="sch-surface" aria-labelledby="sch-range-label"></section>`;
};

const after = `<div class="datepicker__panel sch-pick" id="sch-pick" popover role="dialog" aria-label="Go to date">${calendarHtml({ value: S.SCH_TODAY, today: S.SCH_TODAY, label: "Go to date" })}</div>
<div class="listbox" id="sch-lb" popover role="listbox" aria-label="Compare with a friend"><div class="listbox__list"></div></div>
<div class="dropdown-menu" id="sch-ics-menu" popover role="menu" aria-label="Download .ics"><div class="dropdown-menu__list" role="none">
  <button type="button" class="dropdown-menu__item" role="menuitem" data-ics="view">What's shown</button>
  <button type="button" class="dropdown-menu__item" role="menuitem" data-ics="term">The whole term</button>
</div></div>
<dialog class="dialog sch-dlg" id="sch-dlg" aria-labelledby="sch-dlg-title" aria-describedby="sch-dlg-desc">
  <div class="dialog__content">
    <div class="dialog__header">
      <div class="dialog__heading"><h2 class="dialog__title" id="sch-dlg-title"></h2><p class="dialog__description" id="sch-dlg-desc"></p></div>
      <button class="dialog__close" type="button" data-close aria-label="Close">${icon("close", "dialog__close-icon")}</button>
    </div>
    <div class="dialog__body" id="sch-dlg-body"></div>
    <div class="dialog__footer" id="sch-dlg-foot"></div>
  </div>
</dialog>`;

const pageJsFor = (arm) => `${CALENDAR_JS}
(function () {
  var TYPES = ${JSON.stringify(S.SCH_TYPES.filter((t) => arm || !t.arm))};
  var CLASSES = ${JSON.stringify(S.SCH_CLASSES)};
  var EXAMS = ${JSON.stringify(S.SCH_EXAMS)};
  var APPTS = ${JSON.stringify(arm ? S.SCH_APPOINTMENTS : [])};
  var DROPINS = ${JSON.stringify(arm ? S.SCH_DROPINS : [])};
  var WORKSHOPS = ${JSON.stringify(arm ? S.SCH_WORKSHOPS : [])};
  var FRIENDS = ${JSON.stringify(S.SCH_FRIENDS)};
  var TERM = ${JSON.stringify(S.SCH_TERM)};
  var TODAY = "${S.SCH_TODAY}", NOW = ${S.SCH_NOW}, TZ = "${S.SCH_TZ}";
  var HOUR = 64;
  var ICON_SCHOOL = ${JSON.stringify(icon("school", "btn__icon"))};
  var ICON_OPEN = ${JSON.stringify(icon("launch", "btn__icon"))};
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var DOW2 = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ---- dates: ISO strings, Date at local noon (no DST edge) ----
  function d(iso) { var p = iso.split("-"); return new Date(+p[0], p[1] - 1, +p[2], 12); }
  function iso(dt) { return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
  function add(isoS, n) { var x = d(isoS); x.setDate(x.getDate() + n); return iso(x); }
  function dow(isoS) { return d(isoS).getDay(); }
  function weekStart(isoS) { return add(isoS, -dow(isoS)); }
  function hm(min) { var h = Math.floor(min / 60), m = min % 60; return ((h + 11) % 12 + 1) + ":" + ("0" + m).slice(-2); }
  function ap(min) { return min < 720 ? "AM" : "PM"; }
  function tRange(s, e) { return ap(s) === ap(e) ? hm(s) + " – " + hm(e) + " " + ap(e) : hm(s) + " " + ap(s) + " – " + hm(e) + " " + ap(e); }
  function tShort(min) { var h = (Math.floor(min / 60) + 11) % 12 + 1, m = min % 60; return h + (m ? ":" + ("0" + m).slice(-2) : "") + " " + ap(min).toLowerCase(); }
  function hourLabel(h) { return ((h + 11) % 12 + 1) + " " + (h < 12 ? "AM" : "PM"); }
  function longDate(isoS) { var x = d(isoS); return DOW_FULL[x.getDay()] + ", " + MON[x.getMonth()] + " " + x.getDate(); }
  function mdY(isoS) { var x = d(isoS); return MON[x.getMonth()] + " " + x.getDate() + ", " + x.getFullYear(); }
  function isPast(e) { return e.date < TODAY || (e.date === TODAY && e.end != null && e.end <= NOW); }

  // ---- state ----
  var mq = window.matchMedia("(max-width: 767px)");
  var st = { view: "week", anchor: TODAY, day: TODAY, on: {}, friend: "" };
  TYPES.forEach(function (t) { st.on[t.key] = true; });
  var byId = {};

  // ---- every event on one date ----
  function eventsOn(date) {
    var out = [], w = dow(date), inTerm = date >= TERM.start && date <= TERM.end;
    if (inTerm) CLASSES.forEach(function (c, i) {
      if (c.days.indexOf(w) < 0) return;
      out.push({ id: "c" + i + "-" + date, type: c.waitlist ? "waitlist" : "class", date: date, start: c.start, end: c.end, title: c.title, sub: c.code, where: c.room, src: c });
    });
    EXAMS.forEach(function (x, i) { if (x.date === date) out.push({ id: "x" + i, type: "exam", date: date, start: x.start, end: x.end, title: x.code + " " + x.name, sub: x.title, where: x.room, src: x }); });
    APPTS.forEach(function (a, i) { if (a.date === date) out.push({ id: "a" + i, type: "appointment", date: date, start: a.start, end: a.end, title: a.service, sub: "with " + a.advisor, where: a.format === "In person" ? a.where : a.format, src: a }); });
    DROPINS.forEach(function (v, i) { if (v.date === date) out.push({ id: "v" + i, type: "dropin", date: date, start: v.start, end: v.end, title: v.service, sub: v.dept, where: v.where, src: v }); });
    WORKSHOPS.forEach(function (ws, i) {
      if (w !== ws.day || date < ws.first) return;
      var k = Math.round((d(date) - d(ws.first)) / 864e5 / 7);
      if (k >= ws.count) return;
      out.push({ id: "w" + i + "-" + date, type: "workshop", date: date, start: ws.start, end: ws.end, title: ws.name, sub: "Session " + (k + 1) + " of " + ws.count, where: ws.format === "In person" ? ws.where : ws.format, src: ws, n: k + 1 });
    });
    var f = FRIENDS.filter(function (x) { return x.id === st.friend; })[0];
    if (f && inTerm) f.classes.forEach(function (c, i) {
      if (c.days.indexOf(w) < 0) return;
      out.push({ id: "f" + i + "-" + date, type: "friend", date: date, start: c.start, end: c.end, title: c.title, sub: f.name.split(" ")[0] + " · " + c.code, where: c.room, src: c, friend: f });
    });
    out = out.filter(function (e) { return e.type === "friend" || st.on[e.type]; });
    out.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    out.forEach(function (e) { byId[e.id] = e; });
    return out;
  }
  function noTime() {
    return CLASSES.map(function (c, i) { return { id: "u" + i, type: c.waitlist ? "waitlist" : "class", title: c.title, sub: c.code, where: c.room, src: c, notime: true, date: TODAY }; })
      .filter(function (e) { return !e.src.days.length && st.on[e.type]; })
      .map(function (e) { byId[e.id] = e; return e; });
  }
  function typeOf(k) { return TYPES.filter(function (t) { return t.key === k; })[0] || { key: "friend", one: "Friend's class", label: "Friend" }; }

  // ---- side-by-side columns for overlapping events ----
  function layout(evs) {
    var cluster = [], colsEnd = [], maxEnd = -1;
    function flush() { var n = colsEnd.length; cluster.forEach(function (e) { e.cols = n; }); cluster = []; colsEnd = []; }
    evs.forEach(function (e) {
      if (cluster.length && e.start >= maxEnd) { flush(); maxEnd = -1; }
      var c = 0; while (c < colsEnd.length && colsEnd[c] > e.start) c++;
      colsEnd[c] = e.end; e.col = c; cluster.push(e); maxEnd = Math.max(maxEnd, e.end);
    });
    flush();
    return evs;
  }

  function evBlock(e, h0) {
    var top = (e.start - h0 * 60) / 60 * HOUR, hgt = Math.max(24, (e.end - e.start) / 60 * HOUR - 2);
    var w = 100 / e.cols, lines = hgt >= 52 ? 3 : hgt >= 36 ? 2 : 1;
    var meta1 = tRange(e.start, e.end) + (e.cols === 1 && e.sub ? " · " + e.sub : "");
    return '<button type="button" class="sch-ev sch-t--' + e.type + (isPast(e) ? " is-past" : "") + '" data-ev="' + e.id + '" style="top:' + top + "px;height:" + hgt + "px;left:calc(" + (e.col * w) + "% + 0px);width:calc(" + w + '% - 4px)">' +
      '<span class="sch-ev__title">' + esc(e.title) + "</span>" +
      (lines > 1 ? '<span class="sch-ev__meta">' + esc(meta1) + "</span>" : "") +
      (lines > 2 && e.where ? '<span class="sch-ev__meta">' + esc(e.where) + "</span>" : "") +
      '<span class="visually-hidden">, ' + esc(typeOf(e.type).one) + ", " + esc(longDate(e.date)) + ", " + esc(tRange(e.start, e.end)) + "</span></button>";
  }
  function chipEv(e) {
    return '<button type="button" class="sch-ev sch-t--' + e.type + '" data-ev="' + e.id + '"><span class="sch-ev__title">' + esc(e.title) + '</span><span class="sch-ev__meta">' + esc(e.sub + (e.type === "waitlist" ? " · wait list" : "") + " · " + (e.src.mode || "")) + "</span></button>";
  }
  function noTimeRow() {
    var u = noTime(); if (!u.length) return "";
    return '<div class="sch-notime"><span class="sch-eyebrow">No set time</span><div class="sch-notime__list">' + u.map(chipEv).join("") + "</div></div>";
  }

  // ---- Week ----
  function renderWeek() {
    var ws = weekStart(st.anchor), days = [], all = {};
    for (var i = 0; i < 7; i++) { var dt = add(ws, i); all[dt] = eventsOn(dt); }
    for (i = 0; i < 7; i++) { dt = add(ws, i); if ((i > 0 && i < 6) || all[dt].length) days.push(dt); }
    var phone = mq.matches;
    if (st.day < ws || st.day > add(ws, 6)) st.day = (TODAY >= ws && TODAY <= add(ws, 6)) ? TODAY : add(ws, 1);
    var cols = phone ? [st.day] : days;
    var lo = 8, hi = 17;
    cols.forEach(function (dt) { all[dt].forEach(function (e) { lo = Math.min(lo, Math.floor(e.start / 60)); hi = Math.max(hi, Math.ceil(e.end / 60)); }); });
    var hours = hi - lo, html = "";
    if (phone) {
      html += '<div class="sch-strip" role="group" aria-label="Day">';
      for (i = 0; i < 7; i++) {
        dt = add(ws, i);
        var kinds = []; all[dt].forEach(function (e) { if (kinds.indexOf(e.type) < 0) kinds.push(e.type); });
        html += '<button type="button" class="sch-strip__day' + (dt === TODAY ? " is-today" : "") + '" data-day="' + dt + '" aria-pressed="' + (dt === st.day) + '" aria-label="' + esc(longDate(dt)) + ", " + all[dt].length + ' events">' + DOW2[i] + '<span class="sch-strip__num">' + d(dt).getDate() + '</span><span class="sch-strip__dots">' + kinds.slice(0, 3).map(function (k) { return '<span class="sch-dot sch-t--' + k + '"></span>'; }).join("") + "</span></button>";
      }
      html += "</div>";
    }
    html += noTimeRow();
    html += '<div class="sch-week" style="--cols:' + cols.length + '"><div class="sch-week__head"><div></div>' + cols.map(function (dt) {
      return '<div class="sch-dayhead' + (dt === TODAY ? " is-today" : "") + '"><span>' + DOW[dow(dt)] + '</span><span class="sch-dayhead__num">' + d(dt).getDate() + "</span></div>";
    }).join("") + "</div>";
    html += '<div class="sch-week__body" style="height:' + hours * HOUR + 'px"><div class="sch-times">';
    for (var h = lo + 1; h < hi; h++) html += '<span class="sch-time" style="top:' + (h - lo) * HOUR + 'px">' + hourLabel(h) + "</span>";
    html += "</div>";
    cols.forEach(function (dt) {
      html += '<div class="sch-col' + (dt === TODAY ? " is-today" : "") + '" aria-label="' + esc(longDate(dt)) + '">';
      layout(all[dt]).forEach(function (e) { html += evBlock(e, lo); });
      if (dt === TODAY && NOW > lo * 60 && NOW < hi * 60) html += '<div class="sch-now" style="top:' + ((NOW - lo * 60) / 60 * HOUR) + 'px" aria-hidden="true"></div>';
      html += "</div>";
    });
    html += "</div></div>";
    if (phone && !all[st.day].length) html += '<div class="empty-state"><span class="empty-state__text">Nothing on ' + esc(longDate(st.day)) + "</span></div>";
    html += '<div class="sch-foot"><p class="sch-note">Times are in ' + TZ + "." + (days.length === 5 ? " Weekends appear when something is on them." : "") + "</p></div>";
    return html;
  }

  // ---- Month ----
  function renderMonth() {
    var a = d(st.anchor), first = iso(new Date(a.getFullYear(), a.getMonth(), 1, 12)), m = a.getMonth();
    var start = weekStart(first), n = 35;
    if (d(add(start, 35)).getMonth() === m) n = 42;
    var html = noTimeRow() + '<div class="sch-month__dows">' + DOW.map(function (x) { return '<span class="sch-month__dow">' + x + "</span>"; }).join("") + '</div><div class="sch-month__grid">';
    for (var i = 0; i < n; i++) {
      var dt = add(start, i), evs = eventsOn(dt), out = d(dt).getMonth() !== m, max = 4;
      var shown = evs.length > max ? evs.slice(0, max - 1) : evs;
      var kinds = []; evs.forEach(function (e) { if (kinds.indexOf(e.type) < 0) kinds.push(e.type); });
      html += '<div class="sch-mcell' + (out ? " is-outside" : "") + (dt === TODAY ? " is-today" : "") + '">' +
        '<button type="button" class="sch-mcell__num" data-goday="' + dt + '" aria-label="' + esc(longDate(dt)) + ", " + evs.length + ' events — open the day">' + d(dt).getDate() + "</button>" +
        shown.map(function (e) { return '<button type="button" class="sch-mev sch-t--' + e.type + (isPast(e) ? " is-past" : "") + '" data-ev="' + e.id + '"><span class="sch-dot"></span><span class="sch-mev__title">' + esc(e.title) + '</span><span class="sch-mev__time">' + tShort(e.start) + "</span></button>"; }).join("") +
        (evs.length > shown.length ? '<button type="button" class="sch-more" data-goday="' + dt + '">' + (evs.length - shown.length) + " more</button>" : "") +
        '<span class="sch-mdots" aria-hidden="true">' + kinds.slice(0, 4).map(function (k) { return '<span class="sch-dot sch-t--' + k + '"></span>'; }).join("") + "</span></div>";
    }
    return html + "</div>";
  }

  // ---- List ----
  function renderList() {
    var ws = weekStart(st.anchor), html = noTimeRow() + '<div class="sch-list">', any = false;
    for (var i = 0; i < 7; i++) {
      var dt = add(ws, i), evs = eventsOn(dt);
      if (!evs.length) continue;
      any = true;
      html += '<div class="sch-lday"><h3 class="sch-lday__head">' + esc(longDate(dt)) + (dt === TODAY ? ' <span class="badge badge--primary">Today</span>' : "") + "</h3>" +
        evs.map(function (e) {
          var t = typeOf(e.type);
          return '<button type="button" class="sch-lrow' + (isPast(e) ? " is-past" : "") + '" data-ev="' + e.id + '"><span class="sch-lrow__time"><span class="sch-dot sch-t--' + e.type + '"></span>' + tRange(e.start, e.end) + '</span><span class="sch-lrow__main"><span class="sch-lrow__title">' + esc(e.title) + '</span><span class="sch-lrow__meta">' + esc([e.sub, e.where].filter(Boolean).join(" · ")) + '</span></span><span class="badge badge--regular sch-badge sch-t--' + e.type + '">' + esc(e.type === "friend" ? e.friend.name.split(" ")[0] + "'s class" : t.one) + "</span></button>";
        }).join("") + "</div>";
    }
    if (!any) html += '<div class="empty-state"><span class="empty-state__text">Nothing scheduled this week</span></div>';
    return html + '</div><div class="sch-foot"><p class="sch-note">Times are in ' + TZ + ".</p></div>";
  }

  // ---- render ----
  function rangeLabel() {
    if (st.view === "month") { var a = d(st.anchor); return MONTH[a.getMonth()] + " " + a.getFullYear(); }
    var s = d(weekStart(st.anchor)), e = d(add(weekStart(st.anchor), 6));
    if (s.getFullYear() !== e.getFullYear()) return mdY(iso(s)) + " – " + mdY(iso(e));
    if (s.getMonth() !== e.getMonth()) return MON[s.getMonth()] + " " + s.getDate() + " – " + MON[e.getMonth()] + " " + e.getDate() + ", " + e.getFullYear();
    return MON[s.getMonth()] + " " + s.getDate() + " – " + e.getDate() + ", " + e.getFullYear();
  }
  function render() {
    byId = {};
    $("sch-surface").innerHTML = st.view === "week" ? renderWeek() : st.view === "month" ? renderMonth() : renderList();
    $("sch-range-label").textContent = rangeLabel();
    var unit = st.view === "month" ? "month" : "week";
    $("sch-prev").setAttribute("aria-label", "Previous " + unit);
    $("sch-next").setAttribute("aria-label", "Next " + unit);
    document.querySelectorAll("#sch-views .tab").forEach(function (t) { var on = t.dataset.view === st.view; t.classList.toggle("tab--active", on); t.setAttribute("aria-selected", on); });
  }
  mq.addEventListener("change", render);

  // ---- toolbar ----
  $("sch-views").addEventListener("click", function (e) { var t = e.target.closest("[data-view]"); if (!t) return; st.view = t.dataset.view; render(); });
  function step(n) {
    if (st.view === "month") { var a = d(st.anchor); st.anchor = iso(new Date(a.getFullYear(), a.getMonth() + n, 1, 12)); }
    else if (st.view === "week" && mq.matches) { st.anchor = add(st.anchor, 7 * n); st.day = add(st.day, 7 * n); }
    else st.anchor = add(st.anchor, 7 * n);
    render();
  }
  $("sch-prev").addEventListener("click", function () { step(-1); });
  $("sch-next").addEventListener("click", function () { step(1); });
  $("sch-today").addEventListener("click", function () { st.anchor = TODAY; st.day = TODAY; render(); });
  $("sch-print").addEventListener("click", function () { window.print(); });

  // range → Calendar popover (the DS Calendar; DatePicker's panel)
  var pick = $("sch-pick"), calEl = pick.querySelector(".calendar");
  var cal = hpCalendar.mount(calEl, { onChange: function (a) { st.anchor = hpCalendar.iso(a); st.day = st.anchor; pick.hidePopover(); $("sch-range").focus(); render(); } });
  pick.addEventListener("toggle", function (e) {
    if (e.newState !== "open") return;
    var a = hpCalendar.parse(st.view === "week" && mq.matches ? st.day : st.anchor);
    cal.setValue(a); cal.setView(a);
    var r = $("sch-range").getBoundingClientRect(), pr = pick.getBoundingClientRect();
    pick.style.position = "fixed"; pick.style.margin = "0";
    pick.style.top = (r.bottom + 4) + "px";
    pick.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pr.width - 8)) + "px";
    cal.focus();
  });

  // type filters
  document.querySelectorAll(".sch-chip").forEach(function (c) {
    c.addEventListener("click", function () { var on = c.getAttribute("aria-pressed") !== "true"; c.setAttribute("aria-pressed", on); st.on[c.dataset.type] = on; render(); });
  });

  // friend — Chip trigger + Listbox
  var lb = $("sch-lb"), lbList = lb.querySelector(".listbox__list"), fBtn = $("sch-friend"), lbWasOpen = false;
  var CHECK = ${JSON.stringify(icon("check", "listbox__checkmark"))};
  lb.addEventListener("toggle", function (e) { if (e.newState === "closed") fBtn.setAttribute("aria-expanded", "false"); });
  fBtn.addEventListener("pointerdown", function () { lbWasOpen = lb.matches(":popover-open"); });
  fBtn.addEventListener("click", function () {
    if (lbWasOpen) { lbWasOpen = false; return; }
    var opts = [{ id: "", name: "No one" }].concat(FRIENDS);
    lbList.innerHTML = opts.map(function (f) { return '<button type="button" class="listbox__option" role="option" aria-selected="' + (f.id === st.friend) + '" data-friend="' + f.id + '"><span>' + esc(f.name) + "</span>" + CHECK + "</button>"; }).join("");
    lb.showPopover(); fBtn.setAttribute("aria-expanded", "true");
    var r = fBtn.getBoundingClientRect();
    lb.style.position = "fixed"; lb.style.minWidth = Math.max(220, r.width) + "px";
    lb.style.top = (r.bottom + 4) + "px";
    lb.style.left = Math.max(8, Math.min(r.left, window.innerWidth - lb.offsetWidth - 8)) + "px";
    (lbList.querySelector('[aria-selected="true"]') || lbList.firstChild).focus();
  });
  lbList.addEventListener("click", function (e) {
    var o = e.target.closest("[data-friend]"); if (!o) return;
    st.friend = o.dataset.friend; lb.hidePopover(); fBtn.focus();
    var f = FRIENDS.filter(function (x) { return x.id === st.friend; })[0];
    $("sch-friend-label").textContent = f ? f.name : "Compare with a friend";
    fBtn.classList.toggle("chip--checked-outline", !!f);
    render();
  });

  // .ics — what's shown, or the whole term
  var icsMenu = $("sch-ics-menu"), icsBtn = $("sch-ics"), icsWasOpen = false;
  icsMenu.addEventListener("toggle", function (e) { icsBtn.setAttribute("aria-expanded", e.newState === "open"); });
  icsBtn.addEventListener("pointerdown", function () { icsWasOpen = icsMenu.matches(":popover-open"); });
  icsBtn.addEventListener("click", function () {
    if (icsWasOpen) { icsWasOpen = false; return; }
    icsMenu.showPopover();
    var r = icsBtn.getBoundingClientRect();
    icsMenu.style.position = "fixed"; icsMenu.style.top = (r.bottom + 4) + "px"; icsMenu.style.left = Math.max(8, r.right - icsMenu.offsetWidth) + "px";
    icsMenu.querySelector(".dropdown-menu__item").focus();
  });
  icsMenu.addEventListener("click", function (e) {
    var it = e.target.closest("[data-ics]"); if (!it) return;
    icsMenu.hidePopover();
    var from, to;
    if (it.dataset.ics === "term") { from = TERM.start; to = TERM.end; }
    else if (st.view === "month") { var a = d(st.anchor); from = iso(new Date(a.getFullYear(), a.getMonth(), 1, 12)); to = iso(new Date(a.getFullYear(), a.getMonth() + 1, 0, 12)); }
    else { from = weekStart(st.anchor); to = add(from, 6); }
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HighPoint//Schedule prototype//EN"], n = 0;
    function stamp(dt, min) { return dt.replace(/-/g, "") + "T" + ("0" + Math.floor(min / 60)).slice(-2) + ("0" + min % 60).slice(-2) + "00"; }
    for (var dt = from; dt <= to; dt = add(dt, 1)) eventsOn(dt).forEach(function (ev) {
      if (ev.type === "friend") return; n++;
      lines.push("BEGIN:VEVENT", "UID:" + ev.id + "@highpoint.prototype", "DTSTART:" + stamp(dt, ev.start), "DTEND:" + stamp(dt, ev.end), "SUMMARY:" + ev.title + (ev.sub ? " (" + ev.sub + ")" : ""), "LOCATION:" + (ev.where || ""), "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    var url = URL.createObjectURL(new Blob([lines.join("\\r\\n")], { type: "text/calendar" }));
    var link = document.createElement("a"); link.href = url; link.download = "schedule-" + from + ".ics"; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    window.cx.toast(n + " events saved to schedule-" + from + ".ics");
  });

  // ---- surface clicks: an event → its dialog; a day → that day ----
  $("sch-surface").addEventListener("click", function (e) {
    var g = e.target.closest("[data-goday]");
    if (g) { st.anchor = g.dataset.goday; st.day = g.dataset.goday; st.view = "week"; render(); return; }
    var s = e.target.closest("[data-day]");
    if (s) { st.day = s.dataset.day; render(); return; }
    var b = e.target.closest("[data-ev]");
    if (b && byId[b.dataset.ev]) openEvent(byId[b.dataset.ev]);
  });

  // ---- the event dialog ----
  var dlg = $("sch-dlg");
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
  function row(k, v) { return "<dt>" + k + '</dt><dd' + (v ? "" : ' class="is-empty"') + ">" + (v ? esc(v) : "To be announced") + "</dd>"; }
  function section(title, rows) { return '<div class="sch-dlg__section"><h3 class="sch-eyebrow" style="margin:0">' + title + '</h3><dl class="ss-dl">' + rows + "</dl></div>"; }
  function badgeFor(ev) { var t = typeOf(ev.type); return '<span class="badge badge--base badge--regular sch-badge sch-t--' + ev.type + '">' + esc(t.one) + "</span>"; }
  function openEvent(ev) {
    var s = ev.src, title = ev.title, desc = ev.sub, badges = badgeFor(ev), body = "", foot = "";
    var when = ev.notime ? "" : longDate(ev.date) + " · " + tRange(ev.start, ev.end);
    if (ev.type === "class" || ev.type === "waitlist") {
      desc = s.code + " · " + s.section + " (" + s.classNumber + ")";
      if (s.waitlist) badges += '<span class="badge badge--base badge--regular badge--warning">Position ' + s.waitlist + " on the wait list</span>";
      var meets = s.days.length ? s.days.map(function (x) { return DOW2[x]; }).join(" ") + ", " + tRange(s.start, s.end) : "No set time";
      body = section("Details", (when ? row("This class", when) : "") + row("Meets", meets) + row("Dates", mdY(TERM.start) + " – " + mdY(TERM.end)) + row("Instructor", s.instructor) + row("Room", s.room) + row("Instruction mode", s.mode) + row("Campus", s.campus + " · " + s.location)) +
        section("Information", row("Class number", String(s.classNumber)) + row("Career", s.career) + row("Session", s.session) + row("Units", s.units) + row("Grading", s.grading));
      foot = '<button class="btn btn--secondary btn--base" type="button" data-nd>' + ICON_SCHOOL + "View class</button>";
    } else if (ev.type === "exam") {
      title = s.code + " " + s.name; desc = s.title;
      body = section("Details", row("When", when) + row("Room", s.room) + row("Term", TERM.name));
    } else if (ev.type === "appointment") {
      desc = s.dept; if (s.status) badges += '<span class="badge badge--base badge--regular badge--neutral">' + s.status + "</span>";
      body = section("Details", row("When", when) + row("Advisor", s.advisor) + row("Meeting", s.format) + row("Where", s.where) + row("Reference", s.ref));
      foot = '<a class="btn btn--secondary btn--base" href="student-scheduling-v7-app.html">' + ICON_OPEN + "Open in Scheduling</a>";
    } else if (ev.type === "dropin") {
      desc = s.dept; if (s.status) badges += '<span class="badge badge--base badge--regular badge--neutral">' + s.status + "</span>";
      body = section("Details", row("When", when) + row("Where", s.where));
      foot = '<a class="btn btn--secondary btn--base" href="student-scheduling-v7-app.html">' + ICON_OPEN + "Open in Scheduling</a>";
    } else if (ev.type === "workshop") {
      desc = s.dept; badges += '<span class="badge badge--base badge--regular badge--neutral">Session ' + ev.n + " of " + s.count + "</span>";
      body = section("Details", row("When", when) + row("Organizer", s.organizer) + row("Meeting", s.format) + row("Where", s.where));
      foot = '<a class="btn btn--secondary btn--base" href="student-scheduling-v7-app.html">' + ICON_OPEN + "Open in Scheduling</a>";
    } else {
      desc = ev.friend.name + "'s class · " + s.code;
      body = section("Details", row("When", when) + row("Room", s.room));
    }
    $("sch-dlg-title").textContent = title;
    $("sch-dlg-desc").textContent = desc;
    $("sch-dlg-body").innerHTML = '<div class="sch-dlg__badges">' + badges + "</div>" + body;
    $("sch-dlg-foot").innerHTML = foot + '<button class="btn btn--primary btn--base" type="button" data-close>Close</button>';
    dlg.showModal();
  }
  $("sch-dlg-foot").addEventListener("click", function (e) { if (e.target.closest("[data-nd]")) window.cx.notDesigned(); });

  render();
})();`;

// Where ARM isn't licensed the nav has no Advising / Advisor / ARM Admin
const NAV_CX_ONLY = CX_NAV.filter((s) => !["advising", "advisor", "arm-admin"].includes(s.key));
const appHtmlFor = (arm) => cxApp({
  navTheme: "neutral",
  nav: arm ? CX_NAV : NAV_CX_ONLY,
  title: "Schedule",
  active: "schedule",
  views: viewsFor(arm),
  after,
  pageCss,
  pageJs: pageJsFor(arm),
  prompts: arm ? S.SCH_PROMPTS : CX_ASSISTANT_PROMPTS,
  colorPaths: [...CALENDAR_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS, "text.danger", "text.onFill", "border.focus", "icon.secondary", "fill.primary"],
});

const viewerHtml = renderDesignViewer({
  activeKey: "schedule",
  title: "Schedule",
  heading: "Schedule",
  sub: `One Schedule for CX and ARM. The live app has two: CX's (enrolled and wait-listed classes; Week, Month and a list; Download .ics, print, Filter by Friend) and ARM's Advising → Schedule (classes, exams, wait list, appointments and workshops, Mon–Fri only). This page is both of them on hp-design components, in the CX shell. Where ARM isn't licensed the same page simply has fewer types — see the <b>CX only</b> version. What changed: the legend and the type checkboxes are one row of filter Chips (the legend <i>is</i> the filter); Week / Month / List is one segmented Tabs; the date range is the heading and opens a Calendar; weekends appear only when something's on them; wait-listed classes are amber and dashed; overlapping events sit side by side; one time-zone line instead of "GMT-7" on every block; classes with no meeting time sit in a "No set time" row. Click any event for its details (classes keep ARM's Details / Information); appointments, drop-ins and workshops link to Scheduling. <b>Compare with a friend</b> lays a friend's classes over yours (CX's Filter by Friend). On a phone, Week is one day at a time with a day strip. George Amalor's class list is the live one; rooms, exams, advising and friends are sample data. "Today" is Thu, Oct 29 2026, 10:40 AM.`,
  versions: [
    { label: "CX + ARM", note: "current", file: "schedule-app.html" },
    { label: "CX only", note: "no ARM — classes, wait list, exams", file: "schedule-cx-app.html" },
  ],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/schedule-app.html"), appHtmlFor(true));
fs.writeFileSync(path.join(root, "docs/designs/schedule-cx-app.html"), appHtmlFor(false));
fs.writeFileSync(path.join(root, "docs/designs/schedule.html"), viewerHtml);
console.log("wrote docs/designs/schedule-app.html (CX + ARM)");
console.log("wrote docs/designs/schedule-cx-app.html (CX only)");
console.log("wrote docs/designs/schedule.html");
