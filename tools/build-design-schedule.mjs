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
// components in the CX shell; ARM's types (appointments, workshops)
// are simply absent where ARM isn't installed — same page, fewer filters.
// What changed in the UI:
//   · the legend and the type checkboxes are one row of filter Chips, each
//     with its colour — the legend *is* the filter;
//   · Week / Month / List is one segmented Tabs (CX had a Time Period select
//     and a separate list / calendar switch);
//   · ‹ › Today + the date range (the page heading, opens a Calendar to
//     jump) are the DS Date Navigator;
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
import { CALENDAR_CSS, CALENDAR_JS, CALENDAR_COLOR_PATHS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS } from "./lib/date-picker.mjs";
import { DATE_NAV_CSS, DATE_NAV_JS, DATE_NAV_COLOR_PATHS, dateNavHtml } from "./lib/date-navigator.mjs";
import * as S from "./lib/sch-data.mjs";
import { ABOUT as SS_ABOUT, WORKSHOPS as SS_WORKSHOPS } from "./lib/ss-data.mjs";

// Scheduling's own texts, not retyped: a workshop's About, a service's About
const WS_ABOUT = Object.fromEntries(S.SCH_WORKSHOPS.map((w) => [w.name, (SS_WORKSHOPS.find((x) => x.name === w.name) || {}).about || ""]));
const APPTS = S.SCH_APPOINTMENTS.map((a) => ({ ...a, about: a.about || SS_ABOUT[a.service] || "" }));

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
${DATE_NAV_CSS}
/* ============ Schedule — sch-* composition layer ============ */
.cx-page { max-width: none; gap: ${dim(4)}; }
/* Event types: the Badge colours (badge.color.*) — tint fill, solid bar */
${S.SCH_TYPES.map((t) => `.sch-t--${t.key} { --ev-bg: ${R(badge.color[t.color].tint.bg)}; --ev-fg: ${R(badge.color[t.color].tint.text)}; --ev-bar: ${R(badge.color[t.color].solid.bg)}; }`).join("\n")}
.sch-t--friend { --ev-bg: ${cv("surface.default")}; --ev-fg: ${cv("text.secondary")}; --ev-bar: ${cv("border.default")}; }

/* ---- toolbar: ‹ › Today · range ……… Week|Month|List · print · .ics ---- */
.sch-bar { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(3)} ${dim(4)}; }
.sch-bar__nav { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
.sch-bar__end { margin-left: auto; display: flex; align-items: center; gap: ${dim(2)}; }
/* ‹ › Today + the period: the DS Date Navigator (tools/lib/date-navigator.mjs) */
.sch-bar .date-nav { flex: 0 1 auto; }

/* ---- filters: the legend is the filter ---- */
/* one row at every width (user, 2026-11-03: they wrapped on a tablet) —
   it scrolls sideways when it doesn't fit, bleeding into the page padding
   so a chip slides out at the screen edge rather than being cut in the page */
.sch-filters { display: flex; flex-wrap: nowrap; align-items: center; gap: ${dim(2)}; overflow-x: auto; scrollbar-width: none; margin: 0 -${dim(8)}; padding: 0 ${dim(8)}; }
.sch-filters::-webkit-scrollbar { display: none; }
@media (max-width: 1023px) { .sch-filters { margin: 0 -${dim(6)}; padding: 0 ${dim(6)}; } }
.sch-dot { width: ${dim(2)}; height: ${dim(2)}; border-radius: 50%; flex-shrink: 0; background: var(--ev-bar); }
.sch-t--waitlist .sch-dot { background: transparent; box-shadow: inset 0 0 0 2px var(--ev-bar); }
/* Pick one (user, 2026-11-02): All, or exactly the type you tap — a tap
   shows that type, it doesn't hide it. One pressed Chip at a time (Cmd /
   Shift-click adds a second — a desktop shortcut, not in the UI). The dots
   keep the row a legend; on a pressed (dark) chip the dot gets a white ring. */
.chip.sch-chip[aria-pressed="true"] .sch-dot { box-shadow: 0 0 0 2px ${cv("surface.default")}; }
.chip.sch-chip.sch-t--waitlist[aria-pressed="true"] .sch-dot { box-shadow: inset 0 0 0 2px var(--ev-bar), 0 0 0 2px ${cv("surface.default")}; background: ${cv("surface.default")}; }
/* Compare + .ics: label and chevron fold away on a phone (icon-only) */
.sch-friendbar .alert__message { margin: 0; }

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
.sch-panel__body--event { display: flex; flex-direction: column; gap: ${dim(5)}; }
.sch-panel a.btn { text-decoration: none; }
.sch-dlg__badges { display: flex; flex-wrap: wrap; gap: ${dim(2)}; }
.sch-dlg__section { display: flex; flex-direction: column; gap: ${dim(3)}; }
.sch-dlg__head { display: flex; align-items: center; justify-content: space-between; gap: ${dim(3)}; min-height: ${dim(5)}; }
.sch-dlg__head .sch-eyebrow { margin: 0; }
.sch-dlg__text { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
.sch-dlg__text--muted { color: ${cv("text.secondary")}; }
.sch-links { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: ${dim(2)}; }
.sch-link { display: inline-flex; align-items: center; gap: ${dim(1)}; color: ${cv("text.primary")}; ${typoCss(style("link-base"))} text-decoration: ${textExt("text-style.link-base").textDecoration || "underline"}; }
.sch-link__icon { width: ${dim(4)}; height: ${dim(4)}; }
/* appointment: the check-in note, the reference with its copy button;
   the advisor's questions */
.sch-note--icon { display: flex; align-items: center; gap: ${dim(2)}; }
.sch-note__icon { width: ${dim(4)}; height: ${dim(4)}; flex-shrink: 0; }
.sch-panel .ss-dl dd.sch-ref { display: flex; align-items: center; gap: ${dim(1)}; margin-block: -${dim(1)}; }
.sch-q { display: flex; flex-direction: column; gap: ${dim(2)}; }
.sch-q__label { color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.sch-q__field { min-height: ${dim(20)}; resize: vertical; }
.sch-panel__body--event:has(.sch-q) { gap: ${dim(5)}; }
/* workshop sessions: number | date · time | state; this one tinted */
.sch-sess { margin: 0; padding: 0; list-style: none; }
.sch-sess__item { display: grid; grid-template-columns: ${dim(6)} minmax(0, 1fr) auto; align-items: center; gap: ${dim(3)}; min-height: ${dim(12)}; padding: 0 ${D(card.padding)}; }
.sch-sess__item + .sch-sess__item { border-top: 1px solid ${R(card.divider)}; }
.sch-sess__num { color: ${cv("text.muted")}; ${typoCss(style("heading-sm"))} text-align: center; }
.sch-sess__when { color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
.sch-sess__item.is-past .sch-sess__when { color: ${cv("text.secondary")}; }
.sch-sess__item.is-current { background: ${cv("bg.primary")}; }
.sch-sess__item.is-current .sch-sess__num, .sch-sess__item.is-current .sch-sess__when { color: ${cv("text.primary")}; font-weight: 600; }
/* deadlines: name + date on one line, what it means under it */
/* each calendar is one flush Card: a date tile | the deadline and what it
   means; hairlines between. Passed = muted + "Passed"; the nearest one
   still ahead = "Next" (user, 2026-11-02: the plain list read as a wall of text) */
.sch-dls { margin: 0; padding: 0; list-style: none; }
.sch-dls__item { display: grid; grid-template-columns: ${dim(12)} minmax(0, 1fr); align-items: start; gap: ${dim(4)}; padding: ${dim(3)} ${D(card.padding)}; }
.sch-dls__item + .sch-dls__item { border-top: 1px solid ${R(card.divider)}; }
.sch-dls__tile { display: flex; flex-direction: column; align-items: center; justify-content: center; height: ${dim(12)}; border-radius: ${evRadius}; background: ${cv("surface.page")}; box-shadow: inset 0 0 0 1px ${cv("border.default")}; }
.sch-dls__mon { color: ${cv("text.secondary")}; ${typoCss(lbl)} text-transform: ${lblCase}; letter-spacing: ${px(lbl.letterSpacing)}; line-height: 1; }
.sch-dls__day { color: ${cv("text.default")}; ${typoCss(style("heading-md"))} line-height: 1.2; }
.sch-dls__top { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(1)} ${dim(2)}; }
.sch-dls__name { color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.sch-dls__text { margin: ${dim(1)} 0 0; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.sch-dls__item.is-past .sch-dls__name, .sch-dls__item.is-past .sch-dls__day, .sch-dls__item.is-past .sch-dls__text { color: ${cv("text.muted")}; }
.sch-dls__item.is-past .sch-dls__tile { background: transparent; }
.sch-dls__item.is-next .sch-dls__tile { background: ${cv("bg.primary")}; box-shadow: inset 0 0 0 1px ${cv("fill.primary")}; }
.sch-dls__item.is-next .sch-dls__mon, .sch-dls__item.is-next .sch-dls__day { color: ${cv("text.primary")}; }
/* the panel is Dialog md (640) on a desktop — a class's six sections and the
   deadline tables read cramped at sm */
dialog.dialog.sch-panel { width: min(${D(tokens.dialog.size.md)}, calc(100vw - ${D(tokens.dialog.viewportGutter)} * 2)); }
.sch-dlg__section + .sch-dlg__section { padding-top: ${dim(5)}; border-top: 1px solid ${R(card.divider)}; }
.sch-panel .ss-dl { grid-template-columns: ${dim(32)} minmax(0, 1fr); }
.sch-panel .ss-dl dd.is-empty { color: ${cv("text.muted")}; }

/* the month's day panel: List rows edge to edge (they carry the 16px inset) */
.sch-mcell { cursor: pointer; }
.sch-mcell:hover { background: ${cv("surface.page")}; }
/* One panel for a day and its events (no modal on a modal): the day's list,
   an event replaces it, "‹ Thu, Oct 29" over the title goes back. */
.sch-panel__body--list { padding: ${dim(2)} 0; gap: 0; display: flex; flex-direction: column; }
.sch-back { align-self: flex-start; margin: 0 0 ${dim(1)} -${D(button.ghost.size ? button.ghost.size.sm.paddingX : button.secondary.size.sm.paddingX)}; }
.sch-panel .dialog__heading, .sch-panel .slide-over-panel__heading { display: flex; flex-direction: column; min-width: 0; }
/* Dialog md (640): the List view's columns — time | title + code · room |
   type Badge; the time column fits "11:30 AM – 12:00 PM" */
dialog.dialog .sch-panel__body--list .sch-lrow { grid-template-columns: ${dim(40)} minmax(0, 1fr) auto; }
/* the phone sheet: the time goes over the title */
dialog.slide-over-panel .sch-panel__body--list .sch-lrow { grid-template-columns: minmax(0, 1fr) auto; gap: ${dim(1)} ${dim(4)}; padding-block: ${dim(3)}; }
dialog.slide-over-panel .sch-panel__body--list .sch-lrow__time { grid-column: 1 / -1; }
.sch-panel .dialog__title .badge, .sch-panel .slide-over-panel__title .badge { vertical-align: middle; margin-left: ${dim(1)}; }
/* lifted over iOS Safari's floating bottom bar (the Scheduling calendar sheet's fix) */
.sch-sheet__foot { padding-bottom: calc(${dim(4)} + env(safe-area-inset-bottom) + 100lvh - 100dvh); }
/* the phone sheet's actions share one row in equal parts (user, 2026-11-03:
   "Copy share link" + "View deadlines" stacked); icons drop to make room */
.sch-sheet__foot { flex-wrap: nowrap; }
.sch-sheet__foot > .btn { flex: 1 1 0; min-width: 0; padding-inline: ${dim(3)}; }
.sch-sheet__foot > .btn .btn__icon { display: none; }

/* ---- tablet: the bar's end drops under the range ---- */
@container (max-width: 879px) {
  .sch-bar__end { margin-left: 0; width: 100%; }
  .sch-bar__end .tabs--segmented { margin-right: auto; }
}
/* ---- phone ---- */
@media (max-width: 767px) {
  .sch-bar .date-nav { flex: 1 1 100%; }
  .sch-print { display: none; }
  .sch-bar__end .tabs--segmented { flex: 1; }
  .sch-bar__end .tabs--segmented .tab { flex: 1; }
  .sch-filters { margin: 0 -${dim(4)}; padding: 0 ${dim(4)}; }
  /* the panel's action-end Alert: the button drops under the text, lined up with it */
  .sch-panel .alert--action-end { flex-wrap: wrap; align-items: flex-start; }
  .sch-panel .alert--action-end .alert__stack { flex: 1 1 calc(100% - ${D(tokens.alert.iconSize)} - ${D(tokens.alert.gap)}); }
  .sch-panel .alert--action-end > .btn { margin-left: calc(${D(tokens.alert.iconSize)} + ${D(tokens.alert.gap)}); }
  .sch-squeeze { width: ${D(button.secondary.size.base.height)}; padding: 0; }
  .sch-squeeze .sch-squeeze__text, .sch-wide { display: none; }
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
  /* label | value stays one row on a phone (user, 2026-11-03: stacking
     doubled the length); a narrower label column, long labels wrap in it */
  .sch-panel .ss-dl { grid-template-columns: ${dim(28)} minmax(0, 1fr); gap: ${dim(3)}; }
}
/* print: the calendar alone */
@media print {
  .sidebar, .sidebar-scrim, .cx-topbar, .fab, .sch-bar__end, .sch-filters, .date-nav__controls { display: none !important; }
  .cx-page { padding: 0; }
  .sch-week__head { position: static; }
}
`;
};

const viewsFor = (arm) => {
  const types = S.SCH_TYPES.filter((t) => arm || !t.arm);
  return `
      <div class="sch-bar">
        ${dateNavHtml({ id: "sch-nav", unit: "week", value: S.SCH_TODAY, today: S.SCH_TODAY })}
        <div class="sch-bar__end">
          <div class="tabs--segmented" id="sch-views" role="tablist" aria-label="View">
            <button class="tab tab--sm" type="button" role="tab" data-view="week">Week</button>
            <button class="tab tab--sm" type="button" role="tab" data-view="month">Month</button>
            <button class="tab tab--sm" type="button" role="tab" data-view="list">List</button>
          </div>
          <button class="btn btn--secondary btn--base sch-squeeze" id="sch-friend" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Compare with a friend">${icon("group", "btn__icon")}<span class="sch-squeeze__text">Compare</span>${icon("expand_more", "btn__icon sch-squeeze__text")}</button>
          <button class="btn btn--secondary btn--base btn--icon-only sch-print" id="sch-print" type="button" aria-label="Print">${icon("print", "btn__icon")}</button>
          <button class="btn btn--secondary btn--base sch-squeeze" id="sch-ics" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Download .ics">${icon("download", "btn__icon")}<span class="sch-squeeze__text">.ics</span>${icon("expand_more", "btn__icon sch-squeeze__text")}</button>
        </div>
      </div>
      <div class="sch-filters" role="group" aria-label="Show">
        <button class="chip chip--lg sch-chip" type="button" aria-pressed="true" data-type="all">All</button>
        ${types.map((t) => `<button class="chip chip--lg sch-chip sch-t--${t.key}" type="button" aria-pressed="false" data-type="${t.key}"><span class="sch-dot"></span>${t.label}</button>`).join("\n        ")}
      </div>
      <div class="alert alert--action-end sch-friendbar is-hidden" id="sch-friendbar" role="status">
        ${icon("group", "alert__icon")}
        <div class="alert__stack"><p class="alert__message"><span class="alert__title" id="sch-friendbar-text"></span><span class="sch-wide"> Their classes are the hatched blocks.</span></p></div>
        <button class="btn btn--secondary btn--sm" id="sch-friend-stop" type="button">Stop<span class="sch-wide"> comparing</span></button>
      </div>
      <section class="sch-surface" id="sch-surface" aria-labelledby="sch-nav-label"></section>`;
};

const after = `<div class="listbox" id="sch-lb" popover role="listbox" aria-label="Compare with a friend"><div class="listbox__list"></div></div>
<div class="dropdown-menu" id="sch-ics-menu" popover role="menu" aria-label="Download .ics"><div class="dropdown-menu__list" role="none">
  <button type="button" class="dropdown-menu__item" role="menuitem" data-ics="view">What's shown</button>
  <button type="button" class="dropdown-menu__item" role="menuitem" data-ics="term">The whole term</button>
</div></div>
<dialog class="dialog sch-panel" id="sch-day" aria-labelledby="sch-day-title" aria-describedby="sch-day-desc">
  <div class="dialog__content">
    <div class="dialog__header">
      <div class="dialog__heading"><button class="btn btn--ghost btn--sm sch-back is-hidden" type="button" data-back>${icon("chevron_left", "btn__icon")}<span data-back-label></span></button><h2 class="dialog__title" id="sch-day-title" data-p-title></h2><p class="dialog__description" id="sch-day-desc" data-p-desc></p></div>
      <button class="dialog__close" type="button" data-close aria-label="Close">${icon("close", "dialog__close-icon")}</button>
    </div>
    <div class="dialog__body" data-p-body></div>
    <div class="dialog__footer is-hidden" data-p-foot></div>
  </div>
</dialog>
<dialog class="slide-over-panel slide-over-panel--bottom sch-panel" id="sch-day-sheet" aria-labelledby="sch-day-sheet-title" aria-describedby="sch-day-sheet-desc">
  <div class="slide-over-panel__content">
    <div class="slide-over-panel__header"><div class="slide-over-panel__heading"><button class="btn btn--ghost btn--sm sch-back is-hidden" type="button" data-back>${icon("chevron_left", "btn__icon")}<span data-back-label></span></button><h2 class="slide-over-panel__title" id="sch-day-sheet-title" data-p-title></h2><p class="slide-over-panel__description" id="sch-day-sheet-desc" data-p-desc></p></div><button class="slide-over-panel__close" type="button" data-close aria-label="Close">${icon("close", "slide-over-panel__close-icon")}</button></div>
    <div class="slide-over-panel__body" data-p-body></div>
    <div class="slide-over-panel__footer sch-sheet__foot is-hidden" data-p-foot></div>
  </div>
</dialog>`;

const pageJsFor = (arm) => `${CALENDAR_JS}
${DATE_NAV_JS}
(function () {
  var TYPES = ${JSON.stringify(S.SCH_TYPES.filter((t) => arm || !t.arm))};
  var CLASSES = ${JSON.stringify(S.SCH_CLASSES)};
  var EXAMS = ${JSON.stringify(S.SCH_EXAMS)};
  var APPTS = ${JSON.stringify(arm ? APPTS : [])};
  var WS_ABOUT = ${JSON.stringify(arm ? WS_ABOUT : {})};
  var CHECKIN_BEFORE = ${S.SCH_CHECKIN_BEFORE};
  // what the student did in this session: cancelled appointments, answered
  // questions, checked in, "can't make it" workshop sessions
  var done = { cancelled: {}, answered: {}, checkedIn: {}, notGoing: {} };
  var WORKSHOPS = ${JSON.stringify(arm ? S.SCH_WORKSHOPS : [])};
  var FRIENDS = ${JSON.stringify(S.SCH_FRIENDS)};
  var TERM = ${JSON.stringify(S.SCH_TERM)};
  var TODAY = "${S.SCH_TODAY}", NOW = ${S.SCH_NOW}, TZ = "${S.SCH_TZ}";
  var HOUR = 64;
  var ICON_OPEN = ${JSON.stringify(icon("launch", "btn__icon"))};
  var ICON_OPEN_SM = ${JSON.stringify(icon("launch", "sch-link__icon"))};
  var ICON_COPY = ${JSON.stringify(icon("content_copy", "btn__icon"))};
  var ICON_EVENT = ${JSON.stringify(icon("event_note", "btn__icon"))};
  var ICON_BOOK = ${JSON.stringify(icon("menu_book", "btn__icon"))};
  var ICON_INFO = ${JSON.stringify(icon("info", "alert__icon"))};
  var ICON_CLOCK = ${JSON.stringify(icon("schedule", "sch-note__icon"))};
  var ICON_COPY_SM = ${JSON.stringify(icon("content_copy", "btn__icon"))};

  var DEADLINES = ${JSON.stringify(S.SCH_DEADLINES)};
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  // sel: the picked types — empty = All
  var st = { view: "week", anchor: TODAY, day: TODAY, sel: [], friend: "" };
  function isOn(type) { return !st.sel.length || st.sel.indexOf(type) >= 0; }
  var byId = {};

  // ---- every event on one date ----
  function eventsOn(date) {
    var out = [], w = dow(date), inTerm = date >= TERM.start && date <= TERM.end;
    if (inTerm) CLASSES.forEach(function (c, i) {
      if (c.days.indexOf(w) < 0) return;
      out.push({ id: "c" + i + "-" + date, type: c.waitlist ? "waitlist" : "class", date: date, start: c.start, end: c.end, title: c.title, sub: c.code, where: c.room, src: c });
    });
    EXAMS.forEach(function (x, i) { if (x.date === date) out.push({ id: "x" + i, type: "exam", date: date, start: x.start, end: x.end, title: x.code + " " + x.name, sub: x.title, where: x.room, src: x }); });
    APPTS.forEach(function (a, i) { if (a.date === date && !done.cancelled[i]) out.push({ id: "a" + i, idx: i, type: "appointment", date: date, start: a.start, end: a.end, title: a.service, sub: "with " + a.advisor, where: a.format === "In person" ? a.where : a.format, src: a }); });
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
    out = out.filter(function (e) { return e.type === "friend" || isOn(e.type); });
    out.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    out.forEach(function (e) { byId[e.id] = e; });
    return out;
  }
  function noTime() {
    return CLASSES.map(function (c, i) { return { id: "u" + i, type: c.waitlist ? "waitlist" : "class", title: c.title, sub: c.code, where: c.room, src: c, notime: true, date: TODAY }; })
      .filter(function (e) { return !e.src.days.length && isOn(e.type); })
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
    return '<button type="button" class="sch-ev sch-t--' + e.type + (isPast(e) || done.notGoing[e.id] ? " is-past" : "") + '" data-ev="' + e.id + '" style="top:' + top + "px;height:" + hgt + "px;left:calc(" + (e.col * w) + "% + 0px);width:calc(" + w + '% - 4px)">' +
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
      html += '<div class="sch-mcell' + (out ? " is-outside" : "") + (dt === TODAY ? " is-today" : "") + '" data-goday="' + dt + '">' +
        '<button type="button" class="sch-mcell__num" data-goday="' + dt + '" aria-haspopup="dialog" aria-label="' + esc(longDate(dt)) + ", " + evs.length + (evs.length === 1 ? " event" : " events") + '">' + d(dt).getDate() + "</button>" +
        shown.map(function (e) { return '<button type="button" class="sch-mev sch-t--' + e.type + (isPast(e) ? " is-past" : "") + '" data-ev="' + e.id + '"><span class="sch-dot"></span><span class="sch-mev__title">' + esc(e.title) + '</span><span class="sch-mev__time">' + tShort(e.start) + "</span></button>"; }).join("") +
        (evs.length > shown.length ? '<button type="button" class="sch-more" data-goday="' + dt + '">' + (evs.length - shown.length) + ' more</button>' : "") +
        '<span class="sch-mdots" aria-hidden="true">' + kinds.slice(0, 4).map(function (k) { return '<span class="sch-dot sch-t--' + k + '"></span>'; }).join("") + "</span></div>";
    }
    return html + "</div>";
  }

  // ---- List ----
  // one row per event — the List view and the month's day panel share it
  function listRow(e) {
    var t = typeOf(e.type);
    return '<button type="button" class="sch-lrow' + (isPast(e) ? " is-past" : "") + '" data-ev="' + e.id + '"><span class="sch-lrow__time"><span class="sch-dot sch-t--' + e.type + '"></span>' + tRange(e.start, e.end) + '</span><span class="sch-lrow__main"><span class="sch-lrow__title">' + esc(e.title) + '</span><span class="sch-lrow__meta">' + esc([e.sub, e.where].filter(Boolean).join(" · ")) + '</span></span><span class="badge badge--regular sch-badge sch-t--' + e.type + '">' + esc(e.type === "friend" ? e.friend.name.split(" ")[0] + "'s class" : t.one) + "</span></button>";
  }
  function renderList() {
    var ws = weekStart(st.anchor), html = noTimeRow() + '<div class="sch-list">', any = false;
    for (var i = 0; i < 7; i++) {
      var dt = add(ws, i), evs = eventsOn(dt);
      if (!evs.length) continue;
      any = true;
      html += '<div class="sch-lday"><h3 class="sch-lday__head">' + esc(longDate(dt)) + (dt === TODAY ? ' <span class="badge badge--primary">Today</span>' : "") + "</h3>" +
        evs.map(listRow).join("") + "</div>";
    }
    if (!any) html += '<div class="empty-state"><span class="empty-state__text">Nothing scheduled this week</span></div>';
    return html + '</div><div class="sch-foot"><p class="sch-note">Times are in ' + TZ + ".</p></div>";
  }

  // ---- render ----
  function render() {
    byId = {};
    $("sch-surface").innerHTML = st.view === "week" ? renderWeek() : st.view === "month" ? renderMonth() : renderList();
    nav.set({ unit: st.view === "month" ? "month" : "week", value: st.anchor });
    $("sch-nav").classList.toggle("date-nav--split", mq.matches);
    document.querySelectorAll("#sch-views .tab").forEach(function (t) { var on = t.dataset.view === st.view; t.classList.toggle("tab--active", on); t.setAttribute("aria-selected", on); });
  }
  mq.addEventListener("change", render);

  // ---- toolbar ----
  $("sch-views").addEventListener("click", function (e) { var t = e.target.closest("[data-view]"); if (!t) return; st.view = t.dataset.view; render(); });
  // ‹ › Today + the period → the DS Date Navigator. On a phone Week shows one
  // day: stepping a week keeps the same weekday, Today / a picked date go there.
  var nav = hpDateNav.mount($("sch-nav"), { onChange: function (v, why) {
    if (why === "prev" || why === "next") { if (st.view === "week" && mq.matches) st.day = add(st.day, why === "next" ? 7 : -7); st.anchor = v; }
    else { st.anchor = v; st.day = v; }
    render();
  } });
  $("sch-print").addEventListener("click", function () { window.print(); });

  // type filters
  // type filter: a tap shows exactly that type (again, or All → everything);
  // Cmd / Ctrl / Shift-click adds or removes one — a desktop shortcut
  document.querySelector(".sch-filters").addEventListener("click", function (e) {
    var c = e.target.closest(".sch-chip"); if (!c) return;
    var k = c.dataset.type, i = st.sel.indexOf(k);
    if (k === "all") st.sel = [];
    else if (e.metaKey || e.ctrlKey || e.shiftKey) { if (i >= 0) st.sel.splice(i, 1); else st.sel.push(k); }
    else st.sel = st.sel.length === 1 && i === 0 ? [] : [k];
    if (st.sel.length === TYPES.length) st.sel = [];
    document.querySelectorAll(".sch-chip").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.type === "all" ? !st.sel.length : st.sel.indexOf(x.dataset.type) >= 0); });
    render();
  });

  // friend — Chip trigger + Listbox
  var lb = $("sch-lb"), lbList = lb.querySelector(".listbox__list"), fBtn = $("sch-friend"), lbWasOpen = false;
  var CHECK = ${JSON.stringify(icon("check", "listbox__checkmark"))};
  lb.addEventListener("toggle", function (e) { if (e.newState === "closed") fBtn.setAttribute("aria-expanded", "false"); });
  fBtn.addEventListener("pointerdown", function () { lbWasOpen = lb.matches(":popover-open"); });
  fBtn.addEventListener("click", function () {
    if (lbWasOpen) { lbWasOpen = false; return; }
    lbList.innerHTML = FRIENDS.map(function (f) { return '<button type="button" class="listbox__option" role="option" aria-selected="' + (f.id === st.friend) + '" data-friend="' + f.id + '"><span>' + esc(f.name) + "</span>" + CHECK + "</button>"; }).join("");
    lb.showPopover(); fBtn.setAttribute("aria-expanded", "true");
    var r = fBtn.getBoundingClientRect();
    lb.style.position = "fixed"; lb.style.minWidth = Math.max(220, r.width) + "px";
    lb.style.top = (r.bottom + 4) + "px";
    lb.style.left = Math.max(8, Math.min(r.right - lb.offsetWidth, window.innerWidth - lb.offsetWidth - 8)) + "px";
    (lbList.querySelector('[aria-selected="true"]') || lbList.firstChild).focus();
  });
  // the state lives in a bar over the calendar, not in the button
  function setFriend(id) {
    st.friend = id;
    var f = FRIENDS.filter(function (x) { return x.id === id; })[0];
    $("sch-friendbar").classList.toggle("is-hidden", !f);
    if (f) $("sch-friendbar-text").textContent = "Showing " + f.name + "\u2019s classes.";
    render();
  }
  lbList.addEventListener("click", function (e) {
    var o = e.target.closest("[data-friend]"); if (!o) return;
    lb.hidePopover(); fBtn.focus(); setFriend(o.dataset.friend);
  });
  $("sch-friend-stop").addEventListener("click", function () { setFriend(""); fBtn.focus(); });

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

  // ---- surface clicks: an event → its dialog; a month day → the day panel;
  // a phone day-strip day → that day ----
  $("sch-surface").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ev]");
    if (b && byId[b.dataset.ev]) { openEvent(byId[b.dataset.ev], b); return; }
    var g = e.target.closest("[data-goday]");
    if (g) { openDay(g.dataset.goday, g.closest(".sch-mcell").querySelector(".sch-mcell__num")); return; }
    var s = e.target.closest("[data-day]");
    if (s) { st.day = s.dataset.day; render(); }
  });

  // ---- one panel for a day, its events and a class's deadlines: a Dialog
  // (md) on a desktop, a bottom SlideOverPanel on a phone. It's a stack —
  // Month: day → event → (a class's) deadlines; Week / List start at the
  // event. Each level replaces the last; "‹ <previous>" over the title and
  // Esc go back one. No modal on a modal. ----
  var P = { stack: [], ret: null, skip: new Set() };
  function panel() { return mq.matches ? $("sch-day-sheet") : $("sch-day"); }
  function shortDate(isoS) { var x = d(isoS); return DOW[x.getDay()] + ", " + MON[x.getMonth()] + " " + x.getDate(); }
  function levelLabel(l) { return l.k === "day" ? shortDate(l.dt) : eventContent(l.ev).title; }
  function fill(p, o) {
    p.querySelector("[data-p-title]").innerHTML = o.title;
    p.querySelector("[data-p-desc]").textContent = o.desc || "";
    var body = p.querySelector("[data-p-body]"), foot = p.querySelector("[data-p-foot]"), back = p.querySelector("[data-back]");
    body.classList.remove("sch-panel__body--list", "sch-panel__body--event"); body.classList.add("sch-panel__body--" + o.kind);
    body.innerHTML = o.body; body.scrollTop = 0;
    foot.innerHTML = o.foot || ""; foot.classList.toggle("is-hidden", !o.foot);
    back.classList.toggle("is-hidden", !o.back);
    if (o.back) { p.querySelector("[data-back-label]").textContent = o.back; back.setAttribute("aria-label", "Back to " + o.back); }
  }
  function showTop(focusSel) {
    var p = panel(), l = P.stack[P.stack.length - 1], prev = P.stack[P.stack.length - 2];
    if (!l) return;
    if (!p.open) p.showModal();
    var back = prev ? levelLabel(prev) : "";
    if (l.k === "day") {
      var evs = eventsOn(l.dt);
      fill(p, {
        kind: "list", back: back,
        title: esc(longDate(l.dt)) + (l.dt === TODAY ? ' <span class="badge badge--primary">Today</span>' : ""),
        desc: evs.length ? evs.length + (evs.length === 1 ? " event" : " events") : "",
        body: evs.length ? evs.map(listRow).join("") : '<div class="empty-state"><span class="empty-state__text">Nothing on this day</span></div>',
      });
    } else if (l.k === "ev") {
      var c = eventContent(l.ev);
      fill(p, { kind: "event", back: back, title: esc(c.title), desc: c.desc, body: '<div class="sch-dlg__badges">' + c.badges + "</div>" + c.body, foot: c.foot });
    } else if (l.k === "dl") {
      var dl = deadlinesContent(l.ev.src);
      fill(p, { kind: "event", back: back, title: "Academic calendar deadlines", desc: l.ev.src.title + " · " + l.ev.src.code, body: dl });
    } else if (l.k === "cancel") {
      // Scheduling's cancel AlertDialog, as a level of this panel — no modal on a modal
      var a = l.ev.src;
      fill(p, { kind: "event", back: back, title: "Cancel this appointment?", desc: "",
        body: '<p class="sch-dlg__text">' + esc(a.service) + " with " + esc(a.advisor) + " on " + esc(longDate(a.date)) + " at " + tShort(a.start).replace(" am", " AM").replace(" pm", " PM") + ". The time goes back to other students — you can book again any time.</p>",
        foot: '<button class="btn btn--secondary btn--base" type="button" data-back-btn>Keep it</button><button class="btn btn--danger btn--base" type="button" data-confirm-cancel>Cancel appointment</button>' });
    } else {
      // the advisor's questions (Scheduling's "Answer questions")
      var q = l.ev.src;
      fill(p, { kind: "event", back: back, title: "Questions from " + esc(q.advisor), desc: "Answer before your meeting — " + q.advisor.split(" ")[0] + " reads them beforehand.",
        body: q.questions.map(function (t, i) { return '<label class="sch-q"><span class="sch-q__label">' + esc(t) + '</span><textarea class="ss-q__field sch-q__field" rows="3" data-q="' + i + '"></textarea></label>'; }).join(""),
        foot: '<button class="btn btn--primary btn--base" type="button" data-send-answers>Send answers</button>' });
    }
    var f = (focusSel && p.querySelector(focusSel)) || (l.k === "questions" && p.querySelector("textarea")) || p.querySelector("[data-back]:not(.is-hidden)") || p.querySelector("[data-close]");
    f.focus();
  }
  function push(level) { P.stack.push(level); showTop(); }
  function goBack() {
    var gone = P.stack.pop(), top = P.stack[P.stack.length - 1];
    // focus what opened the level we left: the day's row, the deadlines button
    showTop(gone.k === "ev" ? '[data-ev="' + gone.ev.id + '"]' : gone.k === "dl" ? "[data-deadlines]" : null);
  }
  function openDay(dt, from) { P.ret = from || null; P.stack = []; push({ k: "day", dt: dt }); }
  function openEvent(ev, from) { P.ret = from || null; P.stack = []; push({ k: "ev", ev: ev }); }
  ["sch-day", "sch-day-sheet"].forEach(function (id) {
    var p = $(id);
    p.addEventListener("click", function (e) {
      if (e.target === p || e.target.closest("[data-close]")) { p.close(); return; }
      if (e.target.closest("[data-back]")) { goBack(); return; }
      if (e.target.closest("[data-nd]")) { window.cx.notDesigned(); return; }
      var top = P.stack[P.stack.length - 1];
      if (e.target.closest("[data-deadlines]")) { push({ k: "dl", ev: top.ev }); return; }
      if (e.target.closest("[data-back-btn]")) { goBack(); return; }
      if (e.target.closest("[data-cancel-appt]")) { push({ k: "cancel", ev: top.ev }); return; }
      if (e.target.closest("[data-questions]")) { push({ k: "questions", ev: top.ev }); return; }
      if (e.target.closest("[data-confirm-cancel]")) {
        done.cancelled[top.ev.idx] = true; P.stack.pop(); render(); showTop();
        window.cx.toast("Appointment cancelled — " + top.ev.src.service); return;
      }
      if (e.target.closest("[data-send-answers]")) {
        done.answered[top.ev.idx] = true; P.stack.pop(); showTop();
        window.cx.toast("Answers sent to " + top.ev.src.advisor); return;
      }
      if (e.target.closest("[data-checkin]")) { done.checkedIn[top.ev.idx] = true; showTop(); window.cx.toast("You're checked in"); return; }
      if (e.target.closest("[data-copy-ref]")) {
        if (navigator.clipboard) navigator.clipboard.writeText(top.ev.src.ref).catch(function () {});
        window.cx.toast("Reference copied"); return;
      }
      if (e.target.closest("[data-notgoing]")) {
        var key = top.ev.id; done.notGoing[key] = !done.notGoing[key];
        window.cx.toast(done.notGoing[key] ? "We let " + top.ev.src.organizer + " know you can't make it" : "You're going again");
        render(); showTop("[data-notgoing]"); return;
      }
      var sh = e.target.closest("[data-share]");
      if (sh) {
        var url = location.href.split("#")[0] + "#class-" + sh.dataset.share;
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
        window.cx.toast("Link copied");
        return;
      }
      var b = e.target.closest("[data-ev]");
      if (b && byId[b.dataset.ev]) push({ k: "ev", ev: byId[b.dataset.ev] });
    });
    // Esc goes back a level while there is one, then closes
    p.addEventListener("cancel", function (e) { if (P.stack.length > 1) { e.preventDefault(); goBack(); } });
    // after "Cancel appointment" the event leaves the calendar: re-resolve it
    // from the day when going back to a day list (handled by eventsOn)
    p.addEventListener("close", function () {
      if (P.skip.has(p)) { P.skip.delete(p); return; } // carried to the other panel, not closed
      var r = P.ret; P.stack = []; P.ret = null;
      if (r && document.contains(r)) r.focus();
    });
  });
  // crossing the 768 breakpoint with the panel open: carry the stack across
  mq.addEventListener("change", function () {
    var open = $("sch-day").open ? $("sch-day") : $("sch-day-sheet").open ? $("sch-day-sheet") : null;
    if (!open) return;
    P.skip.add(open); open.close(); // its close event is queued — the handler skips it
    showTop();
  });

  function row(k, v) { return "<dt>" + k + '</dt><dd' + (v ? "" : ' class="is-empty"') + ">" + (v ? esc(v) : "To be announced") + "</dd>"; }
  function section(title, rows, aside) { return '<div class="sch-dlg__section"><div class="sch-dlg__head"><h3 class="sch-eyebrow">' + title + "</h3>" + (aside || "") + '</div><dl class="ss-dl">' + rows + "</dl></div>"; }
  function block(title, html, aside) { return '<div class="sch-dlg__section"><div class="sch-dlg__head"><h3 class="sch-eyebrow">' + title + "</h3>" + (aside || "") + "</div>" + html + "</div>"; }
  function badgeFor(ev) { var t = typeOf(ev.type); return '<span class="badge badge--base badge--regular sch-badge sch-t--' + ev.type + '">' + esc(t.one) + "</span>"; }
  var STATUS_BADGE = { "Open": "success", "Wait list": "warning", "Closed": "neutral" };
  // a class's Academic Calendar Deadlines (the live View Deadlines page)
  function deadlinesContent(s) {
    var html = section("Class details", row("Session", s.session) + row("Career", s.career) + row("Section", s.section.split("-")[0]) + row("Class starts", mdY(TERM.start)) + row("Class ends", mdY(TERM.end)) + row("Last date to wait list", mdY(DEADLINES.lastWaitlist)));
    var next = null;
    DEADLINES.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.date >= TODAY && (!next || it.date < next)) next = it.date; }); });
    DEADLINES.groups.forEach(function (g) {
      html += block(g.title + " calendar", '<ul class="card card--flush sch-dls">' + g.items.map(function (it) {
        var past = it.date < TODAY, isNext = it.date === next, x = d(it.date);
        var days = Math.round((x - d(TODAY)) / 864e5);
        var tag = past ? '<span class="badge badge--regular badge--neutral">Passed</span>' : isNext ? '<span class="badge badge--regular badge--primary">Next · in ' + days + (days === 1 ? " day" : " days") + "</span>" : "";
        return '<li class="sch-dls__item' + (past ? " is-past" : "") + (isNext ? " is-next" : "") + '"><span class="sch-dls__tile" aria-hidden="true"><span class="sch-dls__mon">' + MON[x.getMonth()] + '</span><span class="sch-dls__day">' + x.getDate() + '</span></span><div><div class="sch-dls__top"><span class="sch-dls__name">' + esc(it.name) + '</span><span class="visually-hidden">, ' + mdY(it.date) + "</span>" + tag + '</div><p class="sch-dls__text">' + esc(it.text) + "</p></div></li>";
      }).join("") + "</ul>");
    });
    return html;
  }
  // an event's title, description, body and footer actions
  function eventContent(ev) {
    var s = ev.src, title = ev.title, desc = ev.sub, badges = badgeFor(ev), body = "", foot = "";
    var when = ev.notime ? "" : longDate(ev.date) + " · " + tRange(ev.start, ev.end);
    if (ev.type === "class" || ev.type === "waitlist") {
      // the live CX class modal's sections, in its order
      desc = s.code + " · " + s.section + " (" + s.classNumber + ")";
      if (s.waitlist) badges += '<span class="badge badge--base badge--regular badge--warning">Position ' + s.waitlist + " on the wait list</span>";
      var meets = s.days.length ? s.days.map(function (x) { return DOW2[x]; }).join(" ") + ", " + tRange(s.start, s.end) : "No set time";
      body = section("Information", row("Institution", s.institution) + row("Section", s.section + " (" + s.classNumber + ")") + row("Class number", String(s.classNumber)) + row("Career", s.career) + row("Session", s.session) + row("Units", s.units + (s.units === "1" || s.units === "1.0" ? " unit" : " units")) + row("Grading", s.grading)) +
        block("Description", '<p class="sch-dlg__text">' + esc(s.description) + "</p>") +
        section("Details", (when ? row("This class", when) : "") + row("Instructor", s.instructor) + row("Dates", mdY(TERM.start) + " – " + mdY(TERM.end)) + row("Meets", meets) + row("Instruction mode", s.mode) + row("Room", s.room) + row("Topic", s.topic) + row("Campus", s.campus) + row("Location", s.location) + row("Components", s.components)) +
        block("Textbooks / course materials", '<p class="sch-dlg__text sch-dlg__text--muted">' + (s.textbooks ? esc(s.textbooks) : "Textbooks to be determined") + "</p>", '<button class="btn btn--secondary btn--sm" type="button" data-nd>' + ICON_BOOK + "Buy books</button>") +
        section("Availability", '<dt>Status</dt><dd><span class="badge badge--base badge--regular badge--' + STATUS_BADGE[s.status] + '">' + s.status + "</span></dd>" + row("Seats open", s.seats[0] + " of " + s.seats[1]) + row("Wait list open", s.wait[0] + " of " + s.wait[1])) +
        (s.links && s.links.length ? block("Additional links", '<ul class="sch-links">' + s.links.map(function (l) { return '<li><a class="sch-link" href="#" data-nd>' + esc(l) + ICON_OPEN_SM + "</a></li>"; }).join("") + "</ul>") : "");
      foot = '<button class="btn btn--secondary btn--base" type="button" data-share="' + s.classNumber + '">' + ICON_COPY + 'Copy share link</button><button class="btn btn--primary btn--base" type="button" data-deadlines>' + ICON_EVENT + "View deadlines</button>";
    } else if (ev.type === "exam") {
      title = s.code + " " + s.name; desc = s.title;
      body = section("Details", row("When", when) + row("Room", s.room) + row("Term", TERM.name));
    } else if (ev.type === "appointment") {
      // what Scheduling's appointment page shows
      var i = ev.idx, cancelled = !!done.cancelled[i], past = isPast(ev) || s.status === "Done";
      var status = cancelled ? ["Cancelled", "neutral"] : past ? ["Done", "neutral"] : done.checkedIn[i] ? ["Checked in", "success"] : ["Upcoming", "primary"];
      desc = s.dept;
      badges += '<span class="badge badge--base badge--regular badge--' + status[1] + '">' + status[0] + "</span>";
      var pre = "";
      if (!past && !cancelled && s.questions && !done.answered[i]) pre += '<div class="alert alert--action-end" role="status">' + ICON_INFO + '<div class="alert__stack"><p class="alert__message"><span class="alert__title">' + esc(s.advisor) + " asked " + s.questions.length + " questions.</span> Answer them before your meeting.</p></div>" + '<button class="btn btn--secondary btn--sm" type="button" data-questions>Answer questions</button></div>';
      var opensAt = s.start - CHECKIN_BEFORE, canCheckIn = !past && !cancelled && s.date === TODAY && NOW >= opensAt && !done.checkedIn[i];
      if (!past && !cancelled && s.date === TODAY && NOW < opensAt) pre += '<p class="sch-note sch-note--icon">' + ICON_CLOCK + "Check-in opens at " + hm(opensAt) + " " + ap(opensAt) + "</p>";
      var mins = s.end - s.start;
      body = pre + section("Details",
        row("When", longDate(s.date) + ", " + d(s.date).getFullYear() + " · " + tRange(s.start, s.end) + " (" + TZ + ")") +
        row("Duration", mins >= 60 ? (mins / 60) + (mins === 60 ? " hour" : " hours") : mins + " min") +
        row("Advisor", s.advisor) + row("Meeting", s.format) + row("Where", s.where) +
        (s.questions && done.answered[i] ? row("Questions", "Answered") : "") +
        '<dt>Reference</dt><dd class="sch-ref">' + esc(s.ref) + '<button class="btn btn--ghost btn--sm btn--icon-only" type="button" data-copy-ref aria-label="Copy reference">' + ICON_COPY_SM + "</button></dd>") +
        (s.about ? block("About this service", '<p class="sch-dlg__text">' + esc(s.about) + "</p>") : "");
      var BOOK = '<a class="btn btn--primary btn--base" href="student-scheduling-v7-app.html">Book again</a>';
      foot = cancelled || past ? BOOK
        : '<button class="btn btn--secondary btn--base" type="button" data-cancel-appt>Cancel appointment</button>' +
          (canCheckIn ? '<a class="btn btn--secondary btn--base" href="student-scheduling-v7-app.html">Reschedule</a><button class="btn btn--primary btn--base" type="button" data-checkin>Check in</button>'
                      : '<a class="btn btn--primary btn--base" href="student-scheduling-v7-app.html">Reschedule</a>');
    } else if (ev.type === "workshop") {
      // the registered workshop: this session, progress, every session, About
      var dates = []; for (var k = 0; k < s.count; k++) dates.push(add(s.first, 7 * k));
      var wi = WORKSHOPS.indexOf(s), off = !!done.notGoing[ev.id], sessPast = isPast(ev);
      var pastN = dates.filter(function (x) { return x < TODAY || (x === TODAY && s.end <= NOW); }).length;
      var attended = dates.slice(0, pastN).filter(function (x, n) { return s.missed.indexOf(n + 1) < 0; }).length;
      desc = s.dept;
      badges += '<span class="badge badge--base badge--regular badge--neutral">Session ' + ev.n + " of " + s.count + "</span>" +
        (sessPast ? '<span class="badge badge--base badge--regular badge--' + (s.missed.indexOf(ev.n) >= 0 ? 'neutral">Missed' : 'success">Attended') + "</span>" : off ? '<span class="badge badge--base badge--regular badge--warning">Not going</span>' : "");
      var sessions = '<ol class="card card--flush sch-sess">' + dates.map(function (x, n) {
        var num = n + 1, id = "w" + wi + "-" + x, isPastS = n < pastN, me = num === ev.n;
        var tag = me ? '<span class="badge badge--regular badge--primary">This session</span>'
          : isPastS ? (s.missed.indexOf(num) >= 0 ? '<span class="badge badge--regular badge--neutral">Missed</span>' : '<span class="badge badge--regular badge--success">Attended</span>')
          : done.notGoing[id] ? '<span class="badge badge--regular badge--warning">Not going</span>' : "";
        return '<li class="sch-sess__item' + (me ? " is-current" : "") + (isPastS ? " is-past" : "") + '"><span class="sch-sess__num">' + num + '</span><span class="sch-sess__when">' + esc(shortDate(x)) + " · " + tRange(s.start, s.end) + "</span>" + tag + "</li>";
      }).join("") + "</ol>";
      body = section("This session", row("When", longDate(ev.date) + " · " + tRange(s.start, s.end)) + row("Meeting", s.format) + row("Where", s.where) + row("Organizer", s.organizer)) +
        block("Your progress", '<p class="sch-dlg__text">' + pastN + " of " + s.count + " sessions done · you attended " + attended + '</p><div class="progress progress--base" role="progressbar" aria-label="Sessions done" aria-valuemin="0" aria-valuemax="' + s.count + '" aria-valuenow="' + pastN + '"><span class="progress__bar" style="width:' + Math.round(pastN / s.count * 100) + '%"></span></div>') +
        block("Sessions", sessions) +
        (WS_ABOUT[s.name] ? block("About", '<p class="sch-dlg__text">' + esc(WS_ABOUT[s.name]) + "</p>") : "");
      foot = (sessPast ? "" : '<button class="btn btn--secondary btn--base" type="button" data-notgoing>' + (off ? "I can make it" : "Can't make it") + "</button>") +
        '<a class="btn btn--primary btn--base" href="student-scheduling-v7-app.html">' + ICON_OPEN + "Open in Scheduling</a>";
    } else {
      desc = ev.friend.name + "'s class · " + s.code;
      body = section("Details", row("When", when) + row("Room", s.room));
    }
    // no Close in a footer (user, 2026-11-02) — the header × closes; the footer holds actions only
    return { title: title, desc: desc, badges: badges, body: body, foot: foot };
  }

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
  colorPaths: [...CALENDAR_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS, ...DATE_NAV_COLOR_PATHS, "text.danger", "text.onFill", "border.focus", "icon.secondary", "fill.primary"],
});

const viewerHtml = renderDesignViewer({
  activeKey: "schedule",
  title: "Schedule",
  heading: "Schedule",
  sub: `One Schedule for CX and ARM. The live app has two: CX's (enrolled and wait-listed classes; Week, Month and a list; Download .ics, print, Filter by Friend) and ARM's Advising → Schedule (classes, exams, wait list, appointments and workshops, Mon–Fri only). This page is both of them on hp-design components, in the CX shell. Where ARM isn't licensed the same page simply has fewer types — see the <b>CX only</b> version. What changed: the legend and the type checkboxes are one row of filter Chips (the legend <i>is</i> the filter); Week / Month / List is one segmented Tabs; the date range is the heading and opens a Calendar; weekends appear only when something's on them; wait-listed classes are amber and dashed; overlapping events sit side by side; one time-zone line instead of "GMT-7" on every block; classes with no meeting time sit in a "No set time" row. Click any event for its details (classes keep ARM's Details / Information); appointments and workshops link to Scheduling. <b>Compare with a friend</b> lays a friend's classes over yours (CX's Filter by Friend). On a phone, Week is one day at a time with a day strip. George Amalor's class list is the live one; rooms, exams, advising and friends are sample data. "Today" is Thu, Oct 29 2026, 10:40 AM.`,
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
