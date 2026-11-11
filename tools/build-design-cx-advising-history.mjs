// Generates Advising → History (Designs → Advising → History):
//   docs/designs/cx-advising-history.html          — viewer page (design-viewer.mjs chrome)
//   docs/designs/cx-advising-history-app.html      — v1: table text 12px (the DS Table token, body-sm)
//   docs/designs/cx-advising-history-v2-app.html   — v2: table text 14px (body-base, as the other CX tables)
//
// The student's Advising History (CX → Advising → History), restyled on DS
// components from a saved copy of the live page (2026-11-11) and the team's
// screenshot of ARM 26.3.1's refresh: three sections — Notes, Action Items,
// Appointments (Summaries / No Shows / Cancellations). The live copy was empty
// for Notes and Action Items, so their rows are sample data in the screenshot's
// voice (its five notes and two action items verbatim).
//
// Built to answer one question (user, 2026-11-11): how large should table text
// be — 12 or 14? The two versions differ ONLY in the cells' font size (and the
// avatar initials that ride on it); headers, paddings, columns are the same.
//
// "Our language" over the live page:
// - each section is one Card: title + Counter in the header, the table flush
//   inside (no bordered table nested in a bordered card), the Pagination Bar in
//   the footer; a "1–5 of 15" range beside the pages
// - a person cell = Avatar sm (identity hue) + name (text.default) + a second
//   line (text.muted) at the SAME size — the ticket's bug was a second line
//   larger than the name; one line each, truncated, never wrapped
// - the second line is dropped where the table already has a Department column
// - dates on one line, short ("Oct 22, 2026, 12:12 PM")
// - the row's only action, View, is a tint Button (not a one-item "Actions"
//   menu); View opens the record in a right-hand SlideOverPanel
// - Appointments: underline Tabs with Counters instead of "Summaries (7)"
// - below a 760px column a row stacks into a labelled list (no sideways scroll)
// Run: node tools/build-design-cx-advising-history.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { cxApp, icon } from "./lib/cx-shell.mjs";
import { selectHtml, SELECT_JS } from "./lib/select.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// ---- data ----
const HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const hueOf = (name) => HUES[hash(name) % HUES.length];
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

const DEPT = { ar: "Academic Advising", reg: "Office of the Registrar", psy: "Psychology Dept", la: "Liberal Arts", en: "English Dept", ca: "Career Center", fa: "Financial Aid" };
// notes: the screenshot's five verbatim, then sample rows in the same voice
const NOTES = [
  ["Advisor Outreach", "Spring registration and MATH 140 plan", "Alexander Robinson", DEPT.ar, "Oct 22, 2026, 12:12 PM", "We went over your spring schedule. MATH 140 fits Tuesday/Thursday mornings; register the day your window opens — sections fill in the first hour."],
  ["Academics", "Fall Course Registration Review", "Alexander Robinson", DEPT.reg, "Jun 12, 2026, 11:44 AM", "Your fall schedule is complete and meets full-time status. The prerequisite hold on CHEM 201 has been cleared."],
  ["Advisor Outreach", "Cait Adelson Semester Review", "Alexander Robinson", DEPT.ar, "Apr 30, 2026, 12:16 PM", "Semester review: on track for your degree. Next step is the degree audit before the October deadline."],
  ["General", "Skills Assessment", "Alexander Robinson", DEPT.ar, "Mar 25, 2026, 10:52 AM", "Completed the skills assessment together. Strengths in writing and quantitative reasoning; we talked about the tutoring center for statistics."],
  ["Advisor Outreach", "Testing", "Alexander Robinson", DEPT.ar, "Feb 26, 2026, 10:34 AM", "Placement testing is booked for March 3 at 9:00 AM in the Learning Commons."],
  ["Career", "Internship search kickoff", "Caitlin Moore", DEPT.ca, "Feb 12, 2026, 2:05 PM", "Reviewed your resume and three internship listings. Draft a cover letter for the county health department posting."],
  ["Financial Aid", "FAFSA renewal reminder", "George Amalor", DEPT.fa, "Jan 28, 2026, 9:30 AM", "Your FAFSA renewal is open. Submit it before March 2 to keep your state grant."],
  ["Academics", "Change of major questions", "Alexander Robinson", DEPT.ar, "Jan 14, 2026, 3:48 PM", "Talked through switching to Health Sciences. Your Biology courses count toward the core; we'll confirm electives with the department."],
  ["General", "Check-in after midterms", "Abigail Reed", DEPT.la, "Nov 20, 2025, 1:10 PM", "Midterms went well overall. Keep the weekly study group for ECON 101."],
  ["Advisor Outreach", "Study abroad information", "Alexander Robinson", DEPT.ar, "Nov 3, 2025, 11:22 AM", "Sent the study-abroad info session dates. Spring applications close December 15."],
  ["Academics", "Withdrawal deadline", "Abigail Reed", DEPT.la, "Oct 16, 2025, 4:02 PM", "Discussed the last day to withdraw with a W (Oct 31). We decided to keep the course and add tutoring."],
  ["Career", "Career fair prep", "Caitlin Moore", DEPT.ca, "Sep 30, 2025, 10:15 AM", "Practised the 30-second introduction. Bring ten printed resumes to the fair."],
  ["General", "Welcome meeting", "Alexander Robinson", DEPT.ar, "Sep 2, 2025, 9:00 AM", "First advising meeting. Set goals for the first term and walked through the student portal."],
  ["Financial Aid", "Work-study placement", "George Amalor", DEPT.fa, "Aug 25, 2025, 2:40 PM", "You're placed in the library work-study position, 10 hours a week."],
  ["Academics", "Transfer credit review", "Abigail Reed", DEPT.reg, "Aug 12, 2025, 10:05 AM", "Three community-college courses transferred: ENGL 1A, PSYC 1, MATH 13."],
];
const ACTIONS = [
  ["Advising Referral", DEPT.ar, "Alexander Robinson", "Oct 22, 2026, 12:31 PM", "Cait, please complete your spring degree audit review before our Oct 30 meeting."],
  ["Advising Referral", DEPT.ar, "Alexander Robinson", "Oct 21, 2026, 11:27 AM", "Cait is considering a change of major to Health Sciences and wants to know how her completed Biology courses will apply. She also asked about the deadline to declare before spring."],
  ["Follow-up", DEPT.ca, "Caitlin Moore", "Sep 18, 2026, 3:15 PM", "Send the updated resume before the career fair on Oct 2."],
  ["Document Request", DEPT.reg, "Abigail Reed", "Aug 30, 2026, 10:40 AM", "Upload the official transcript from your previous college."],
  ["Hold Review", DEPT.fa, "George Amalor", "Aug 4, 2026, 9:12 AM", "Your financial aid hold clears once the verification worksheet is signed."],
  ["Follow-up", DEPT.ar, "Alexander Robinson", "Jun 15, 2026, 1:55 PM", "Book a summer check-in to confirm your fall schedule."],
  ["Advising Referral", DEPT.la, "Abigail Reed", "May 2, 2026, 2:30 PM", "Referred to the Writing Center for the ENGL 201 research paper."],
  ["Document Request", DEPT.fa, "George Amalor", "Apr 10, 2026, 11:05 AM", "Submit the independent-student appeal form."],
];
// appointments: the live copy's summaries (advisor renamed — Ava Robinson is the signed-in student here)
const SUMMARIES = [
  [DEPT.psy, "Advising", "Caitlin Moore", "George Amalor", "Dec 3, 2024, 8:54 AM", "Reviewed your Psychology minor requirements. Two courses left: PSYC 210 and PSYC 315."],
  [DEPT.psy, "Advising", "Caitlin Moore", "George Amalor", "Sep 26, 2024, 10:02 AM", "Talked about research assistant openings in the department; apply through the department site."],
  [DEPT.la, "Academic Difficulty", "Abigail Reed", "George Amalor", "Oct 26, 2023, 3:42 PM", "Made a study plan for the second half of the term and signed up for tutoring."],
  [DEPT.en, "Degree Planning", "Caitlin Moore", "George Amalor", "Sep 22, 2023, 8:45 AM", "Mapped the English requirements across four terms."],
  [DEPT.la, "Degree Planning", "Abigail Reed", "George Amalor", "Sep 5, 2023, 10:37 AM", "Chose general-education courses for fall."],
  [DEPT.ar, "Registration", "Alexander Robinson", "Alexander Robinson", "Aug 14, 2023, 1:20 PM", "Registered for first-term classes together."],
  [DEPT.ar, "Orientation", "Alexander Robinson", "Alexander Robinson", "Jul 28, 2023, 9:00 AM", "New-student orientation advising session."],
];
const CANCELLATIONS = [[DEPT.ar, "Advising", "Alexander Robinson", "Alexander Robinson", "Oct 9, 2024, 2:00 PM", "Cancelled by the student — schedule conflict."]];

// ---- markup ----
const ICON = { chevron: icon("expand_more", "hs-toggle__icon"), search: icon("search", "search__icon"), close: icon("close", "search__clear-icon"), prev: icon("chevron_left", ""), next: icon("chevron_right", "") };
const rowsSelect = (id) => selectHtml({ id, label: "Rows per page", options: ["5", "10", "20"].map((v) => ({ label: v, value: v })), value: "5", size: "sm" });
const section = ({ id, title, count, headRight = "", tabs = "", table }) => `<section class="card card--flush hs-card${tabs ? " hs-card--tabs" : ""}" aria-labelledby="${id}-title">
  <div class="card__header hs-card__header">
    <div class="hs-card__title"><h2 class="card__title" id="${id}-title"><button class="hs-toggle" type="button" aria-expanded="true">${ICON.chevron}<span>${title}</span></button></h2><span class="counter" aria-label="${count} total">${count}</span></div>
    ${headRight}
  </div>
  ${tabs}
  <div class="hs-table" id="${id}-table">${table}</div>
  <div class="card__footer hs-foot" id="${id}-foot">
    <div class="rows-per-page"><span class="rows-per-page__label" id="${id}-rpp-label">Rows per page</span>${rowsSelect(`${id}-rpp`)}</div>
    <div class="hs-pager"><span class="hs-range" id="${id}-range"></span><nav class="pagination" id="${id}-pages" aria-label="${title} pages"></nav></div>
  </div>
</section>`;

const views = `<section class="cx-view is-active hs" data-view="history">
${section({
  id: "hs-notes", title: "Notes", count: NOTES.length,
  headRight: `<label class="search hs-search"><span class="visually-hidden">Search notes</span>${ICON.search}<input class="search__input" id="hs-notes-q" type="search" placeholder="Search notes" autocomplete="off" /><button class="search__clear" type="button" aria-label="Clear search">${ICON.close}</button></label>`,
  table: "",
})}
${section({ id: "hs-actions", title: "Action Items", count: ACTIONS.length, table: "" })}
${section({
  id: "hs-appts", title: "Appointments", count: SUMMARIES.length + CANCELLATIONS.length,
  tabs: `<div class="tabs tabs--underline hs-tabs" role="tablist" aria-label="Appointments">
    <button class="tab tab--base tab--active" role="tab" type="button" aria-selected="true" data-tab="summaries">Summaries <span class="counter">${SUMMARIES.length}</span></button>
    <button class="tab tab--base" role="tab" type="button" aria-selected="false" data-tab="noshows">No Shows <span class="counter">0</span></button>
    <button class="tab tab--base" role="tab" type="button" aria-selected="false" data-tab="cancellations">Cancellations <span class="counter">${CANCELLATIONS.length}</span></button>
  </div>`,
  table: "",
})}
</section>`;

const after = `<dialog class="slide-over-panel slide-over-panel--right slide-over-panel--md hs-sheet" id="hs-sheet" aria-labelledby="hs-sheet-title" aria-describedby="hs-sheet-sub">
  <div class="slide-over-panel__content">
    <div class="slide-over-panel__header"><div class="slide-over-panel__heading"><h2 class="slide-over-panel__title" id="hs-sheet-title"></h2><p class="slide-over-panel__description" id="hs-sheet-sub"></p></div><button class="slide-over-panel__close" type="button" id="hs-sheet-close" aria-label="Close">${icon("close", "slide-over-panel__close-icon")}</button></div>
    <div class="slide-over-panel__body hs-sheet__body" id="hs-sheet-body"></div>
  </div>
</dialog>`;

// ---- CSS ----
const pageCss = (cell) => (X) => {
  const { cv, dim, typoCss, style, tokens, D, R, T } = X;
  const tb = tokens.table;
  const cellType = style(cell);
  // Avatar sm (avatar.tokens.json: 32px, initials semibold size.sm) — the shell doesn't load avatar tokens
  const avInit = { fontWeight: X.resolve("weight.semibold"), fontSize: X.resolve("size.sm"), lineHeight: X.resolve("leading.none") };
  return `
.hs { gap: ${dim(6)}; }
.hs-card__header { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: ${dim(3)}; }
.hs-card__title { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
/* the section collapses: a chevron before the title, the title is the button */
.hs-toggle { display: inline-flex; align-items: center; gap: ${dim(2)}; margin: 0; padding: 0; border: none; background: none; color: inherit; font: inherit; cursor: pointer; border-radius: ${X.px(X.resolve("radius.xs"))}; }
.hs-toggle:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }
.hs-toggle__icon { width: ${dim(5)}; height: ${dim(5)}; flex-shrink: 0; color: ${cv("icon.secondary")}; transition: transform 0.15s ease; }
.hs-toggle[aria-expanded="false"] .hs-toggle__icon { transform: rotate(-90deg); }
.hs-toggle:hover .hs-toggle__icon { color: ${cv("icon.default")}; }
.hs-card.is-collapsed > .card__header { border-bottom: none; }
.hs-card.is-collapsed .hs-search { display: none; }
@media (prefers-reduced-motion: reduce) { .hs-toggle__icon { transition: none; } }
.hs-search { width: 280px; max-width: 100%; height: ${dim(8)}; }
/* the first tab's label lines up with the card title: card padding minus the tab's own paddingX */
.hs-tabs { padding: 0 calc(${dim(4)} - ${D(tokens.tabs.size.base.paddingX)}); }
/* tabs under the title: their baseline is the header's divider (one line, not two) */
.hs-card--tabs > .card__header { border-bottom: none; padding-bottom: ${dim(1)}; }
/* the table sits flush in the card: no border / radius of its own */
.hs-table .table { border: none; border-radius: 0; }
/* the size under test: every cell's text — v1 ${cell === "body-sm" ? "12px (DS token)" : "14px (body-base)"} */
.hs-table .table__row:not(.table__row--head) { ${typoCss(cellType)} min-height: ${dim(14)}; }
.hs-cols-notes { grid-template-columns: minmax(120px, 1fr) minmax(180px, 2.2fr) minmax(180px, 1.6fr) minmax(170px, 1.2fr) 72px; }
.hs-cols-actions { grid-template-columns: minmax(120px, 1fr) minmax(140px, 1.2fr) minmax(170px, 1.4fr) minmax(170px, 1.2fr) minmax(220px, 2.4fr); }
.hs-cols-appts { grid-template-columns: minmax(130px, 1.2fr) minmax(120px, 1fr) minmax(170px, 1.4fr) minmax(170px, 1.4fr) minmax(170px, 1.2fr) 72px; }
.hs-cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hs-cell--wrap { white-space: normal; overflow: visible; }
.hs-cell--end { justify-self: end; }
/* person: Avatar sm + name + a muted second line at the SAME size */
.hs-person { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
.hs-person__text { display: flex; flex-direction: column; min-width: 0; }
.hs-person__name, .hs-person__sub { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hs-person__sub { color: ${R(tb.cell.mutedColor)}; }
.avatar { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${dim(8)}; height: ${dim(8)}; border-radius: ${X.px(X.resolve("radius.full"))}; ${typoCss(avInit)} user-select: none; }
${["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"].map((h) => `.avatar--${h} { background: ${cv(`avatar.${h}.bg`)}; color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}
.is-hidden-section { display: none !important; }
/* v3 card rows (the .ss-appt recipe from Student Scheduling) */
.hs-list { display: flex; flex-direction: column; }
.hs-item .ss-appt__clock { white-space: nowrap; }
.hs-item__text { margin: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-base"))} }
.hs-item__text--clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hs-item .ss-appt__name { ${typoCss(style("heading-base"))} }
@media (max-width: 767px) {
  /* a phone: View stays a small button under the text, not a full-width bar per record */
  .hs-item .ss-appt__actions { align-items: flex-start; }
  .hs-item .ss-appt__btns > .btn { flex: none; }
  .hs-item { gap: ${dim(2)}; }
  /* three tabs share the width (Scheduling's Upcoming / Past rule) */
  .hs-tabs { padding: 0; gap: 0; }
  .hs-tabs .tab { flex: 1 1 auto; padding-inline: ${dim(1)}; gap: ${dim(1)}; }
}
.hs-empty { padding: ${dim(8)} ${dim(4)}; display: flex; justify-content: center; }
/* footer: Rows per page left; range + pages right */
.hs-foot { justify-content: space-between; align-items: center; flex-wrap: wrap; gap: ${dim(3)} ${dim(6)}; }
.rows-per-page { display: inline-flex; align-items: center; gap: ${dim(2)}; }
.rows-per-page__label { color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
.rows-per-page .select { width: 72px; }
.hs-pager { display: inline-flex; align-items: center; gap: ${dim(4)}; }
.hs-range { color: ${cv("text.muted")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
.page-ellipsis { color: ${cv("text.muted")}; padding: 0 ${dim(1)}; }
/* the record sheet */
.hs-sheet__body { display: flex; flex-direction: column; gap: ${dim(4)}; }
.hs-facts { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: ${dim(2)} ${dim(4)}; ${typoCss(style("body-base"))} }
.hs-facts dt { color: ${cv("text.secondary")}; }
.hs-facts dd { margin: 0; color: ${cv("text.default")}; min-width: 0; }
.hs-sheet__text { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
.hs-sheet__h { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
/* narrow column: each row becomes a labelled list — no sideways scroll */
@container (max-width: 759px) {
  .hs-table .table__row--head { display: none; }
  .hs-table .table__row:not(.table__row--head) { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: ${dim(2)} ${dim(3)}; align-items: start; }
  .hs-table .table__row > [data-label]::before { content: attr(data-label); grid-column: 1; color: ${cv("text.muted")}; }
  .hs-table .table__row > [data-label] { display: contents; }
  .hs-table .table__row > [data-label] > * { grid-column: 2; min-width: 0; white-space: normal; overflow-wrap: anywhere; }
  .hs-table .hs-person__name, .hs-table .hs-person__sub { white-space: normal; }
  .hs-table .table__row > .hs-cell--end { grid-column: 1 / -1; justify-self: start; }
  .hs-search { width: 100%; }
  .hs-foot { justify-content: center; }
}`;
};

// ---- script ----
const pageJs = (cards) => `${SELECT_JS}
(function () {
  var CARDS = ${cards ? "true" : "false"};
  var IC = ${JSON.stringify({ person: icon("person", ""), edit: icon("edit", "") })};
  var D = ${JSON.stringify({ NOTES, ACTIONS, SUMMARIES, CANCELLATIONS })};
  var HUES = ${JSON.stringify(HUES)};
  var VIEW_ICON = "";
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function avatar(name) { var ini = name.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join(""); return '<span class="avatar avatar--' + HUES[hash(name) % HUES.length] + '" aria-hidden="true">' + ini + "</span>"; }
  function person(name, sub) { return '<span class="hs-person">' + avatar(name) + '<span class="hs-person__text"><span class="hs-person__name">' + esc(name) + "</span>" + (sub ? '<span class="hs-person__sub">' + esc(sub) + "</span>" : "") + "</span></span>"; }
  function cell(label, html, cls) { return '<div class="hs-cell' + (cls ? " " + cls : "") + '" data-label="' + label + '"><span>' + html + "</span></div>"; }
  // v3: a record as a card row — the Scheduling My schedule recipe (.ss-appt):
  // the date on the left, title + badge, icon facts, a 2-line preview, View right
  function fact(ic, text) { return '<span class="ss-fact">' + IC[ic] + '<span class="ss-fact__text">' + text + "</span></span>"; }
  function when(d) { var p = d.split(", "); return '<div class="ss-appt__time"><span class="ss-appt__clock">' + p[0] + '</span><span class="ss-appt__dur">' + p[1] + " \u00b7 " + p[2] + "</span></div>"; }
  function item(o) {
    return '<article class="ss-appt hs-item">' + when(o.date) + '<div class="ss-appt__main"><div class="ss-appt__title"><h3 class="ss-appt__name">' + esc(o.title) + "</h3>" + (o.badge ? '<span class="badge badge--base badge--regular badge--neutral">' + esc(o.badge) + "</span>" : "") + "</div>" +
      '<div class="ss-appt__meta">' + o.facts.join("") + "</div>" + (o.text ? '<p class="hs-item__text' + (o.clamp ? " hs-item__text--clamp" : "") + '">' + esc(o.text) + "</p>" : "") + "</div>" +
      (o.view ? '<div class="ss-appt__actions"><div class="ss-appt__btns"><button class="btn btn--secondary btn--sm" type="button" data-view-rec="' + o.view + '">View</button></div></div>' : "") + "</article>";
  }
  function viewBtn(kind, i) { return '<div class="hs-cell--end"><button class="btn btn--tint btn--sm" type="button" data-view-rec="' + kind + ":" + i + '">View</button></div>'; }

  // one paged table: rows() → array of row html, head html, cols class
  function pager(id, opts) {
    var st = { page: 1, per: 5 };
    function render() {
      var rows = CARDS ? opts.cards() : opts.rows(), n = rows.length, pages = Math.max(1, Math.ceil(n / st.per));
      if (st.page > pages) st.page = pages;
      var from = (st.page - 1) * st.per, shown = rows.slice(from, from + st.per);
      $(id + "-table").innerHTML = n && CARDS ? '<div class="hs-list" role="list" aria-label="' + opts.label + '">' + shown.join("") + "</div>" : n
        ? '<div class="table" role="table" aria-label="' + opts.label + '"><div class="table__row table__row--head ' + opts.cols + '" role="row">' + opts.head + "</div>" + shown.map(function (r) { return '<div class="table__row ' + opts.cols + '" role="row">' + r + "</div>"; }).join("") + "</div>"
        : '<div class="hs-empty"><div class="empty-state"><span class="empty-state__text">' + opts.empty() + "</span></div></div>";
      $(id + "-foot").hidden = !n;
      $(id + "-range").textContent = n ? (from + 1) + "\\u2013" + Math.min(from + st.per, n) + " of " + n : "";
      var nav = $(id + "-pages"), h = '<button class="page-item" type="button" aria-label="Previous page" data-pg="' + (st.page - 1) + '"' + (st.page === 1 ? " disabled" : "") + ">" + ${JSON.stringify(ICON.prev)} + "</button>";
      for (var p = 1; p <= pages; p++) h += '<button class="page-item" type="button" data-pg="' + p + '"' + (p === st.page ? ' aria-current="page"' : "") + ">" + p + "</button>";
      h += '<button class="page-item" type="button" aria-label="Next page" data-pg="' + (st.page + 1) + '"' + (st.page === pages ? " disabled" : "") + ">" + ${JSON.stringify(ICON.next)} + "</button>";
      nav.innerHTML = h; nav.hidden = pages < 2;
    }
    $(id + "-pages").addEventListener("click", function (e) { var b = e.target.closest("[data-pg]"); if (!b || b.disabled) return; st.page = +b.dataset.pg; render(); });
    document.querySelector("#" + id + "-foot .select-field").addEventListener("selectchange", function (e) { st.per = +e.detail.value; st.page = 1; render(); });
    st.render = render; render(); return st;
  }
  var H = function (labels) { return labels.map(function (l) { return '<div class="hs-cell" role="columnheader">' + l + "</div>"; }).join(""); };

  // Notes (search filters subject / category / name)
  var q = "";
  var notes = pager("hs-notes", {
    label: "Notes", cols: "hs-cols-notes",
    head: H(["Category", "Subject", "Created by", "Created on", '<span class="visually-hidden">Actions</span>']),
    empty: function () { return q ? "No notes match \\u201c" + esc(q) + "\\u201d" : "No notes yet"; },
    rows: function () {
      return D.NOTES.map(function (r, i) { return [r, i]; }).filter(function (x) { var r = x[0]; return !q || (r[0] + " " + r[1] + " " + r[2]).toLowerCase().indexOf(q.toLowerCase()) > -1; }).map(function (x) {
        var r = x[0]; return cell("Category", esc(r[0])) + cell("Subject", esc(r[1])) + cell("Created by", person(r[2], r[3])) + cell("Created on", esc(r[4])) + viewBtn("note", x[1]);
      });
    },
    cards: function () {
      return D.NOTES.map(function (r, i) { return [r, i]; }).filter(function (x) { var r = x[0]; return !q || (r[0] + " " + r[1] + " " + r[2]).toLowerCase().indexOf(q.toLowerCase()) > -1; }).map(function (x) {
        var r = x[0]; return item({ date: r[4], title: r[1], badge: r[0], facts: [fact("person", esc(r[2]) + " \u00b7 " + esc(r[3]))], text: r[5], clamp: true, view: "note:" + x[1] });
      });
    },
  });
  var qi = $("hs-notes-q"), sb = qi.closest(".search");
  qi.addEventListener("input", function () { q = qi.value.trim(); sb.classList.toggle("is-populated", !!qi.value); notes.render(); });
  sb.querySelector(".search__clear").addEventListener("click", function () { qi.value = ""; qi.dispatchEvent(new Event("input")); qi.focus(); });

  // Action Items (Department column → no department under the name)
  pager("hs-actions", {
    label: "Action items", cols: "hs-cols-actions",
    head: H(["Type", "Department", "Created by", "Created on", "Comment"]),
    empty: function () { return "No action items"; },
    rows: function () { return D.ACTIONS.map(function (r) { return cell("Type", esc(r[0])) + cell("Department", esc(r[1])) + cell("Created by", person(r[2])) + cell("Created on", esc(r[3])) + cell("Comment", esc(r[4]), "hs-cell--wrap"); }); },
    cards: function () { return D.ACTIONS.map(function (r) { return item({ date: r[3], title: r[0], facts: [fact("person", esc(r[2]) + " \u00b7 " + esc(r[1]))], text: r[4] }); }); },
  });

  // Appointments (tabs)
  var tab = "summaries";
  var appts = pager("hs-appts", {
    label: "Appointments", cols: "hs-cols-appts",
    head: H(["Department", "Type", "Department member", "Created by", "Created on", '<span class="visually-hidden">Actions</span>']),
    empty: function () { return tab === "noshows" ? "No missed appointments" : tab === "cancellations" ? "No cancelled appointments" : "No appointment summaries"; },
    rows: function () {
      var list = tab === "summaries" ? D.SUMMARIES : tab === "cancellations" ? D.CANCELLATIONS : [];
      return list.map(function (r, i) { return cell("Department", esc(r[0])) + cell("Type", esc(r[1])) + cell("Member", person(r[2])) + cell("Created by", person(r[3])) + cell("Created on", esc(r[4])) + viewBtn(tab, i); });
    },
    cards: function () {
      var list = tab === "summaries" ? D.SUMMARIES : tab === "cancellations" ? D.CANCELLATIONS : [];
      return list.map(function (r, i) { return item({ date: r[4], title: r[1], badge: tab === "cancellations" ? "Cancelled" : "", facts: [fact("person", "With " + esc(r[2]) + " \u00b7 " + esc(r[0])), fact("edit", "Created by " + esc(r[3]))], text: r[5], clamp: true, view: tab + ":" + i }); });
    },
  });
  document.querySelector(".hs-tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]"); if (!b) return;
    tab = b.dataset.tab;
    document.querySelectorAll(".hs-tabs .tab").forEach(function (t) { var on = t === b; t.classList.toggle("tab--active", on); t.setAttribute("aria-selected", on); });
    appts.page = 1; appts.render();
  });

  // View → the record in a right-hand SlideOverPanel
  var sheet = $("hs-sheet");
  function facts(pairs) { return '<dl class="hs-facts">' + pairs.map(function (p) { return "<dt>" + p[0] + "</dt><dd>" + esc(p[1]) + "</dd>"; }).join("") + "</dl>"; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-view-rec]"); if (!b) return;
    var k = b.dataset.viewRec.split(":"), i = +k[1], r;
    if (k[0] === "note") { r = D.NOTES[i]; $("hs-sheet-title").textContent = r[1]; $("hs-sheet-sub").textContent = r[0] + " note"; $("hs-sheet-body").innerHTML = facts([["Created by", r[2] + " \\u00b7 " + r[3]], ["Created on", r[4]]]) + '<h3 class="hs-sheet__h">Note</h3><p class="hs-sheet__text">' + esc(r[5]) + "</p>"; }
    else { r = (k[0] === "cancellations" ? D.CANCELLATIONS : D.SUMMARIES)[i]; $("hs-sheet-title").textContent = r[1] + " appointment"; $("hs-sheet-sub").textContent = r[0]; $("hs-sheet-body").innerHTML = facts([["With", r[2]], ["Created by", r[3]], ["Created on", r[4]]]) + '<h3 class="hs-sheet__h">' + (k[0] === "cancellations" ? "Cancellation" : "Summary") + '</h3><p class="hs-sheet__text">' + esc(r[5]) + "</p>"; }
    sheet.showModal();
  });
  // collapse / expand a section
  document.querySelectorAll(".hs-toggle").forEach(function (b) {
    b.addEventListener("click", function () {
      var card = b.closest(".hs-card"), open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open);
      card.classList.toggle("is-collapsed", !open);
      Array.prototype.forEach.call(card.children, function (c) { if (!c.classList.contains("card__header")) c.classList.toggle("is-hidden-section", !open); });
    });
  });
  $("hs-sheet-close").addEventListener("click", function () { sheet.close(); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });
})();`;

const PROMPTS = ["Show my advising notes", "What action items do I have?", "When was my last appointment?", "Book an appointment"];
const appFor = (cell, cards = false) => cxApp({
  title: "History",
  active: "advising-history",
  views,
  after,
  pageCss: pageCss(cell),
  pageJs: pageJs(cards),
  prompts: PROMPTS,
  navTheme: "neutral",
  colorPaths: [...HUES.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]), "text.secondary", "icon.default", "icon.secondary", "border.focus"],
});

const viewerHtml = renderDesignViewer({
  activeKey: "cx-advising-history",
  title: "History",
  heading: "Advising History",
  sub: `The student's Advising → History, restyled on hp-design components from a saved copy of the live page and ARM 26.3.1's refresh: <b>Notes</b> (search), <b>Action Items</b>, <b>Appointments</b> (Summaries / No Shows / Cancellations as underline Tabs with Counters). Each section is one Card — title + Counter, the table flush inside, the Pagination Bar (Rows per page + range + pages) in the footer. A person cell is Avatar sm + name + a muted second line <b>at the same size</b> (the ticket: the second line was bigger than the name); one line each, truncated; no department under a name when the table already has a Department column. Dates on one line. View (the row's only action, a tint Button) opens the record in a right-hand SlideOverPanel. Below a 760px column every row stacks into a labelled list. <b>v1 and v2 differ only in the table text size</b> — 12px (the DS Table token, body-sm) vs 14px (body-base, what other CX tables use) — to decide which one ships. Notes and Action Items are sample data (the live copy had none); the screenshot's five notes and two action items are verbatim.`,
  versions: [
    { label: "v1", note: "table text 12px — DS Table token (body-sm)", file: "cx-advising-history-app.html" },
    { label: "v2", note: "table text 14px — body-base, as CX tables", file: "cx-advising-history-v2-app.html" },
    { label: "v3", note: "cards instead of tables (Student Scheduling's My schedule rows)", file: "cx-advising-history-v3-app.html" },
  ],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/cx-advising-history-app.html"), appFor("body-sm"));
fs.writeFileSync(path.join(root, "docs/designs/cx-advising-history-v2-app.html"), appFor("body-base"));
fs.writeFileSync(path.join(root, "docs/designs/cx-advising-history-v3-app.html"), appFor("body-base", true));
fs.writeFileSync(path.join(root, "docs/designs/cx-advising-history.html"), viewerHtml);
console.log("wrote docs/designs/cx-advising-history-app.html, -v2-app.html, cx-advising-history.html");
