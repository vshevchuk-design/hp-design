// Generates CX → Browse Classes:
//   docs/designs/cx-browse-classes.html      — viewer page
//   docs/designs/cx-browse-classes-app.html  — the prototype
//
// A restyle of the live Browse Classes, read off three saved copies of it
// (2026-10-15): same flow — Term (required) / Career / Subject + Search →
// a Class · Description table with View Sections → the course's sections,
// each expanding into Information / Details / Textbooks / Availability /
// Additional links with the section actions. On DS components, in the shared
// CX shell (tools/lib/cx-shell.mjs). What changed is the UI:
//   · the three filters are Select base with floating labels, and "Any …" is
//     an option instead of a × inside the field;
//   · View Sections is Button tint base (40px — the live solid blue button on
//     every one of eleven rows made the column the loudest thing on screen);
//   · Start and End are one Time column; Session moves under the section;
//   · seven equal buttons under an open section → Add to cart (primary),
//     Enroll and Add to planner (secondary), and the rest in a ⋯ Menu — the
//     same Menu the row's Actions button (tint sm) opens;
//   · filters reflow in the live page's three steps (one row → search field
//     on its own row → two columns), by the page column's width; the
//     sections table stacks when the column is under 860px.
// Run: node tools/build-design-cx-browse-classes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { cxApp, icon } from "./lib/cx-shell.mjs";
import * as B from "./lib/cx-classes-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const pageCss = ({ tokens, R, D, dim, cv, typoCss, style, textExt }) => {
  const { card, table: tb, button, select } = tokens;
  const bSm = button.secondary.size.sm;
  const lbl = style("label-sm");
  const lblCase = textExt("text-style.label-sm").textTransform || "none";
  return `
/* ============ filters ============ */
/* The live page's three steps, by the room the page column actually has
   (it changes with the sidebar: full / rail / drawer — so container
   queries, not the screen width):
     wide    Term · Career · Subject · Search ……… [search field]
     medium  Term · Career · Subject · Search / [search field] on its own row
     narrow  Term | Career / Subject | Search / [search field]
   8px between everything. */
.cb-filters { display: grid; gap: ${dim(2)}; align-items: center; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; grid-template-areas: "term career subject go" "q q q q"; }
.cb-filters > #cb-term { grid-area: term; } .cb-filters > #cb-career { grid-area: career; } .cb-filters > #cb-subject { grid-area: subject; }
.cb-filters > #cb-go { grid-area: go; } .cb-filters > .search { grid-area: q; }
.cb-filters .select { width: 100%; }
/* the results' search field keeps its place but stays hidden until there
   are results to search (visibility, not display — the layout doesn't jump) */
.cb-filters > .search.is-concealed { visibility: hidden; }
.cb-filters .select__value { flex: 1; }
@container (min-width: 960px) {
  .cb-filters { grid-template-columns: repeat(3, minmax(0, ${dim(60)})) auto 1fr minmax(${dim(56)}, ${dim(80)}); grid-template-areas: "term career subject go . q"; }
}
@container (max-width: 559px) {
  .cb-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "term career" "subject go" "q q"; }
  .cb-filters > #cb-go { width: 100%; }
}
/* a required field's mark */
.cb-req { color: ${cv("text.danger")}; }

/* ============ results ============ */
.cb-courses .table__row { grid-template-columns: ${dim(36)} minmax(0, 1fr) auto; }
.cb-code { color: ${cv("text.default")}; ${typoCss(style("body-base"))} font-weight: ${style("heading-sm").fontWeight}; white-space: nowrap; }
@container (max-width: 559px) {
  .cb-courses .table__row--head { display: none; }
  .cb-courses .table__row { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "code act" "desc act"; row-gap: ${dim("0_5")}; }
  .cb-courses .cb-code { grid-area: code; } .cb-courses .cb-desc { grid-area: desc; } .cb-courses .cb-act { grid-area: act; }
}

/* ============ sections ============ */
.cb-back { align-self: flex-start; margin-inline-start: -${D(bSm.paddingX)}; margin-block-end: -${dim(3)}; }
/* the course head — by the page column's width, like the filters */
.cb-shead { display: grid; align-items: center; gap: ${dim(2)} ${dim(3)}; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "title title" "code meta" "q q"; }
.cb-shead > .ss-title { grid-area: title; margin: 0; }
.cb-shead > .badge { grid-area: code; justify-self: start; }
.cb-shead > .ss-sub { grid-area: meta; margin: 0; }
.cb-shead > .search { grid-area: q; }
@container (min-width: 760px) {
  .cb-shead { grid-template-columns: auto auto minmax(0, 1fr) minmax(${dim(56)}, ${dim(80)}); grid-template-areas: "title code . q" "meta meta meta ."; row-gap: ${dim(1)}; }
}
.cb-sections .table__row { grid-template-columns: minmax(${dim(36)}, 1.2fr) ${dim(16)} ${dim(36)} minmax(${dim(20)}, 1fr) minmax(${dim(28)}, 1.2fr) ${dim(36)} ${dim(28)}; }
/* every row is its own grid, so every column must be sized the same way in
   the header and the rows — an "auto" Actions column sized to the button in
   the rows but to nothing in the header, and shifted every column */
.cb-sections .cb-kebab { justify-self: end; }
.cb-sec__main { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
.cb-sec__toggle { margin-inline-start: -${dim(2)}; }
.cb-sec__toggle .btn__icon { transition: transform 0.15s ease; }
.cb-sec[aria-expanded="true"] .cb-sec__toggle .btn__icon, .cb-sec__toggle[aria-expanded="true"] .btn__icon { transform: rotate(180deg); }
.cb-sec__name { display: flex; flex-direction: column; min-width: 0; }
.cb-sec__name b { color: ${cv("text.default")}; ${typoCss(style("body-base"))} font-weight: ${style("heading-sm").fontWeight}; }
.cb-sec__name span { color: ${R(tb.cell.mutedColor)}; ${typoCss(style("body-sm"))} }
.cb-status { display: flex; align-items: center; gap: ${dim(2)}; white-space: nowrap; }
.cb-cell-label { display: none; }
/* the open section's details — a band under its row */
/* white, and joined to its row: no hairline between the two — the line
   comes after the details, before the next section */
.cb-detail { padding: 0 ${D(tb.row.paddingX)} ${dim(4)}; border-bottom: 1px solid ${R(tb.row.divider)}; background: ${R(tb.surface)}; display: flex; flex-direction: column; gap: ${dim(4)}; }
.cb-sections .table__row:has(+ .cb-detail:not([hidden])) { border-bottom: none; }
.cb-detail[hidden] { display: none; }
.cb-detail:last-child { border-bottom: none; }
.cb-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(${dim(72)}, 100%), 1fr)); gap: ${dim(3)}; }
.cb-group { background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; padding: ${D(card.padding)}; display: flex; flex-direction: column; gap: ${dim(3)}; }
.cb-group h4 { margin: 0; color: ${cv("text.secondary")}; ${typoCss(lbl)} text-transform: ${lblCase}; letter-spacing: ${lbl.letterSpacing}; }
.cb-dl { display: grid; grid-template-columns: ${dim(32)} minmax(0, 1fr); gap: ${dim(2)} ${dim(3)}; margin: 0; }
.cb-dl dt { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.cb-dl dd { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-sm"))} }
.cb-group p { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-sm"))} }
.cb-group .btn { align-self: flex-start; }
.cb-group ul { margin: 0; padding-left: ${dim(4)}; }
.cb-group a { color: ${cv("text.primary")}; ${typoCss(style("body-sm"))} }
.cb-actions { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
/* stacked rows when the page column is under 860px (by the column's own
   width — the sidebar's state changes it) */
@container (max-width: 859px) {
  .cb-sections .table__row--head { display: none; }
  .cb-sections .table__row:not(.table__row--head) { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "main status" "when when" "who who" "more more"; align-items: start; row-gap: ${dim(1)}; }
  .cb-sections .cb-sec__main { grid-area: main; } .cb-sections .cb-status { grid-area: status; justify-self: end; }
  .cb-sections .cb-days, .cb-sections .cb-time { display: none; }
  .cb-sections .cb-when { display: block !important; grid-area: when; }
  .cb-sections .cb-room { display: none; }
  .cb-sections .cb-who { grid-area: who; color: ${cv("text.secondary")}; }
  .cb-sections .cb-kebab { grid-area: more; padding-left: calc(${D(bSm.height)} + ${dim(2)} - ${dim(2)}); padding-top: ${dim(1)}; }
  .cb-sections .cb-when { padding-left: calc(${D(bSm.height)} + ${dim(2)} - ${dim(2)}); }
  .cb-sections .cb-who { padding-left: calc(${D(bSm.height)} + ${dim(2)} - ${dim(2)}); }
}
.cb-when { display: none; color: ${cv("text.default")}; }
`;
};

const chev = icon("expand_more", "btn__icon");
const ICONS = {
  chevron: icon("expand_more", "select__chevron"),
  check: icon("check", "listbox__checkmark"),
  expand: chev,
  more: icon("more_vert", "btn__icon"),
  moreH: icon("more_horiz", "btn__icon"),
  back: icon("arrow_back", "btn__icon"),
  search: icon("search", "search__icon"),
  close: icon("close", ""),
};

const selectHtml = (id, label, placeholder, required) =>
  `<button class="select is-placeholder" id="${id}" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="select__stack"><span class="select__label">${label}${required ? ' <span class="cb-req" aria-hidden="true">*</span>' : ""}</span><span class="select__value">${placeholder}</span></span>${ICONS.chevron}</button>`;

const views = `
      <!-- ============ Search + results ============ -->
      <section class="cx-view is-active" data-view="browse">
        <div class="cb-filters" role="search">
          ${selectHtml("cb-term", "Term", "Term *", true)}
          ${selectHtml("cb-career", "Career", "Career", false)}
          ${selectHtml("cb-subject", "Subject", "Subject", false)}
          <button class="btn btn--primary btn--base" id="cb-go" type="button" disabled>Search</button>
          <label class="search is-concealed" id="cb-q-box">${ICONS.search}<input class="search__input" id="cb-q" type="search" placeholder="Search" aria-label="Search these classes" autocomplete="off" /><button class="search__clear" id="cb-q-clear" type="button" aria-label="Clear search">${ICONS.close}</button></label>
        </div>
        <!-- the hint is EmptyState on its own — no Card round it -->
        <div class="empty-state" id="cb-hint"><span class="empty-state__text">Select at least one criteria to view classes.</span></div>
        <div class="cx-view" id="cb-results" style="gap:12px">
          <div class="table cb-courses" id="cb-courses" role="table" aria-label="Classes"></div>
        </div>
      </section>

      <!-- ============ A course's sections ============ -->
      <section class="cx-view" data-view="sections">
        <button class="btn btn--ghost btn--sm cb-back" id="cb-back" type="button">${ICONS.back}<span>Browse classes</span></button>
        <!-- wide: title + code · search on the title's row, meta under it.
             narrow: title / code + meta on one row / search -->
        <div class="cb-shead">
          <h2 class="ss-title" id="cb-s-title"></h2>
          <span class="badge badge--base badge--outline badge--regular" id="cb-s-code"></span>
          <p class="ss-sub ss-sub--sm" id="cb-s-meta"></p>
          <label class="search" id="cb-sq-box">${ICONS.search}<input class="search__input" id="cb-sq" type="search" placeholder="Search" aria-label="Search sections" autocomplete="off" /><button class="search__clear" id="cb-sq-clear" type="button" aria-label="Clear search">${ICONS.close}</button></label>
        </div>
        <div class="table cb-sections" id="cb-sections" role="table" aria-label="Sections"></div>
      </section>
`;

const after = `<div class="listbox" id="cb-lb" popover role="listbox"><div class="listbox__list"></div></div>
<div class="menu" id="cb-menu" popover role="menu" aria-label="Section actions"><div class="menu__list" id="cb-menu-list"></div></div>`;

const pageJs = `(function () {
  var B = ${JSON.stringify(B)};
  var ICONS = ${JSON.stringify(ICONS)};
  var toast = window.cx.toast;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---- one Listbox popover for the three filters ----
  var lb = $("cb-lb"), lbList = lb.querySelector(".listbox__list"), lbTrigger = null, lbPick = null, lbSuppress = null;
  lb.addEventListener("toggle", function (e) { if (e.newState === "closed" && lbTrigger) lbTrigger.setAttribute("aria-expanded", "false"); });
  document.addEventListener("pointerdown", function (e) { lbSuppress = lb.matches(":popover-open") && lbTrigger && lbTrigger.contains(e.target) ? lbTrigger : null; }, true);
  function openLb(trigger, options, selected, onPick) {
    if (lbSuppress === trigger) { lbSuppress = null; return; }
    lbTrigger = trigger; lbPick = onPick;
    lbList.innerHTML = options.map(function (o) { return '<button type="button" class="listbox__option" role="option" aria-selected="' + (o.value === selected) + '" data-value="' + esc(o.value) + '"><span>' + esc(o.label) + "</span>" + ICONS.check + "</button>"; }).join("");
    lb.showPopover(); trigger.setAttribute("aria-expanded", "true");
    var r = trigger.getBoundingClientRect();
    lb.style.position = "fixed"; lb.style.minWidth = r.width + "px";
    var top = r.bottom + 4; if (top + lb.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - 4 - lb.offsetHeight);
    lb.style.top = top + "px"; lb.style.left = Math.max(8, Math.min(r.left, innerWidth - lb.offsetWidth - 8)) + "px";
    var cur = lbList.querySelector('[aria-selected="true"]') || lbList.firstChild; if (cur) cur.focus();
  }
  lbList.addEventListener("click", function (e) { var o = e.target.closest(".listbox__option"); if (!o) return; var fn = lbPick, t = lbTrigger; lb.hidePopover(); t.setAttribute("aria-expanded", "false"); t.focus(); fn(o.dataset.value); });

  var st = { term: "", career: "", subject: "", q: "", searched: false, course: null, sq: "", open: {} };
  function setSelect(el, value, placeholder) {
    el.classList.toggle("is-placeholder", !value);
    el.querySelector(".select__value").textContent = value || placeholder;
  }
  function filterSelect(id, key, options, anyLabel, placeholder) {
    var el = $(id);
    el.addEventListener("click", function () {
      var opts = (anyLabel ? [{ value: "", label: anyLabel }] : []).concat(options);
      openLb(el, opts, st[key], function (v) {
        st[key] = v;
        var o = options.filter(function (x) { return x.value === v; })[0];
        setSelect(el, o ? o.label : "", placeholder);
        $("cb-go").disabled = !st.term;
      });
    });
  }
  filterSelect("cb-term", "term", B.TERMS.map(function (t) { return { value: t, label: t }; }), "", "Term *");
  filterSelect("cb-career", "career", B.CAREERS.map(function (t) { return { value: t, label: t }; }), "Any career", "Career");
  filterSelect("cb-subject", "subject", B.SUBJECTS.map(function (s) { return { value: s.code, label: s.code + " - " + s.name }; }), "Any subject", "Subject");

  // ---- results ----
  function courses() {
    return B.COURSES.filter(function (c) {
      if (st.subject && c[0] !== st.subject) return false;
      if (st.career && c[3] !== st.career) return false;
      if (st.q) { var q = st.q.toLowerCase(); if ((c[0] + " " + c[1] + " " + c[2]).toLowerCase().indexOf(q) === -1) return false; }
      return true;
    });
  }
  function renderResults() {
    $("cb-hint").classList.toggle("is-hidden", st.searched);
    $("cb-q-box").classList.toggle("is-concealed", !st.searched);
    $("cb-results").classList.toggle("is-active", st.searched);
    if (!st.searched) return;
    var list = courses();
    $("cb-courses").innerHTML = '<div class="table__row table__row--head" role="row"><span role="columnheader">Class</span><span role="columnheader">Description</span><span role="columnheader"><span class="visually-hidden">Actions</span></span></div>' +
      (list.length ? list.map(function (c) {
        var id = c[0] + " " + c[1];
        return '<div class="table__row table__row--link" role="row" data-course="' + esc(id) + '"><span class="cb-code" role="cell">' + esc(id) + '</span><span class="cb-desc" role="cell">' + esc(c[2]) + '</span><span class="cb-act" role="cell"><button type="button" class="btn btn--tint btn--base" data-course="' + esc(id) + '" aria-label="View sections for ' + esc(id) + '">View sections</button></span></div>';
      }).join("") : '<div class="empty-state"><span class="empty-state__text">No classes match “' + esc(st.q) + '”</span></div>');
  }
  $("cb-go").addEventListener("click", function () { st.searched = true; st.q = ""; $("cb-q").value = ""; $("cb-q-box").classList.remove("is-populated"); renderResults(); });
  function searchBox(inputId, boxId, clearId, key, render) {
    var inp = $(inputId), box = $(boxId);
    inp.addEventListener("input", function () { st[key] = inp.value.trim(); box.classList.toggle("is-populated", !!inp.value); render(); });
    $(clearId).addEventListener("click", function () { inp.value = ""; st[key] = ""; box.classList.remove("is-populated"); render(); inp.focus(); });
  }
  searchBox("cb-q", "cb-q-box", "cb-q-clear", "q", renderResults);
  $("cb-courses").addEventListener("click", function (e) { var r = e.target.closest("[data-course]"); if (r) openCourse(r.dataset.course); });

  // ---- sections ----
  var DAYS = ["Mo We", "Tu Th", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var DAYS_LONG = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday" };
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + ":" + (mm < 10 ? "0" : "") + mm + " " + (h >= 12 ? "pm" : "am"); }
  function sectionsFor(id) {
    var out = [];
    if (id === "ACCT C2003") out.push(B.ACCT_C2003_SECTION);
    var n = (id === "ACCT C2003" ? 1 : 1) + hash(id) % 3;
    for (var i = 0; i < n; i++) {
      var k = id + "|" + i, online = hash(k + "o") % 4 === 0;
      var start = 480 + (hash(k + "t") % 20) * 30, len = [75, 90, 150][hash(k + "l") % 3];
      var cap = [24, 30, 35, 40][hash(k + "c") % 4], taken = hash(k + "s") % (cap + 6), open = Math.max(0, cap - taken);
      var days = online ? "" : DAYS[hash(k + "d") % DAYS.length];
      out.push({
        section: String((online ? 4000 : 1000) + i + 1), component: hash(k + "c2") % 5 === 0 ? "LAB" : "LEC", classNumber: String(2000 + hash(k) % 8000),
        session: ["1", "12W", "8W1"][hash(k + "se") % 3], sessionName: { "1": "Regular Academic Session", "12W": "Twelve Week", "8W1": "First Eight Week" }[["1", "12W", "8W1"][hash(k + "se") % 3]],
        days: days, daysLong: days.split(" ").map(function (d) { return DAYS_LONG[d]; }).join(", "),
        start: online ? "" : fmt(start), end: online ? "" : fmt(start + len),
        room: online ? "Online" : B.ROOMS[hash(k + "r") % (B.ROOMS.length - 1)], instructor: B.INSTRUCTORS[hash(k + "i") % B.INSTRUCTORS.length],
        status: open > 0 ? "Open" : "Waitlist", seats: [open, cap], waitlist: open > 0 ? [0, 0] : [hash(k + "w") % 6, 10],
        career: "Undergraduate", units: "3 units", grading: "Graded",
        dates: "01/23/2027 - 05/07/2027", meets: online ? "Online, no set meeting time" : days + " " + fmt(start).replace(" ", "").toUpperCase() + " - " + fmt(start + len).replace(" ", "").toUpperCase(),
        mode: online ? "Online" : "In Person", campus: online ? "Online" : "Hacienda Campus - Test", location: online ? "Online" : "Hacienda",
        components: "Lecture Required", textbooks: "Textbooks to be determined", links: ["HighPoint - test"]
      });
    }
    return out;
  }
  var course = null, secs = [];
  function openCourse(id) {
    course = B.COURSES.filter(function (c) { return c[0] + " " + c[1] === id; })[0];
    secs = sectionsFor(id); st.open = {}; st.sq = ""; $("cb-sq").value = ""; $("cb-sq-box").classList.remove("is-populated");
    // every section starts closed (the live copy opened the first — user asked not to)
    $("cb-s-title").textContent = course[2];
    $("cb-s-code").textContent = id;
    $("cb-s-meta").textContent = st.term + " · " + course[3];
    $("cx-topbar-title").textContent = "Browse Classes";
    renderSections();
    show("sections");
  }
  function statusHtml(s) {
    var b = s.status === "Open" ? '<span class="badge badge--base badge--regular badge--success">Open</span>' : '<span class="badge badge--base badge--regular badge--neutral">Waitlist</span>';
    return b + '<span class="table__muted">' + s.seats[0] + "/" + s.seats[1] + "</span>";
  }
  function dl(rows) { return '<dl class="cb-dl">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>"; }
  function detailHtml(s) {
    return '<div class="cb-groups">' +
      '<section class="cb-group"><h4>Information</h4>' + dl([["Class number", s.classNumber], ["Career", s.career], ["Session", s.sessionName], ["Units", s.units], ["Grading", s.grading]]) + "</section>" +
      '<section class="cb-group"><h4>Details</h4>' + dl([["Instructor", s.instructor], ["Dates", s.dates], ["Meets", s.meets], ["Instruction mode", s.mode], ["Room", s.room], ["Campus", s.campus], ["Location", s.location], ["Components", s.components]]) + '<button type="button" class="btn btn--secondary btn--sm" data-act="See Location">See location</button></section>' +
      '<section class="cb-group"><h4>Availability</h4>' + dl([["Status", s.status], ["Seats open", s.seats[0] + "/" + s.seats[1]], ["Wait list open", s.waitlist[0] + "/" + s.waitlist[1]]]) + "</section>" +
      '<section class="cb-group"><h4>Textbooks / course materials</h4><p>' + esc(s.textbooks) + '</p><button type="button" class="btn btn--secondary btn--sm" data-act="Buy Books">Buy books</button></section>' +
      '<section class="cb-group"><h4>Additional links</h4><ul>' + s.links.map(function (l) { return '<li><a href="#" data-act="' + esc(l) + '">' + esc(l) + "</a></li>"; }).join("") + "</ul></section>" +
      "</div>" +
      '<div class="cb-actions"><button type="button" class="btn btn--primary btn--base" data-act="Add to Cart">Add to cart</button><button type="button" class="btn btn--secondary btn--base" data-act="Enroll">Enroll</button><button type="button" class="btn btn--secondary btn--base" data-act="Add to Planner">Add to planner</button>' +
      '<button type="button" class="btn btn--secondary btn--base btn--icon-only" data-menu="' + s.classNumber + '" data-menu-rest aria-haspopup="menu" aria-label="More actions">' + ICONS.moreH + "</button></div>";
  }
  function renderSections() {
    var q = st.sq.toLowerCase();
    var list = secs.filter(function (s) { return !q || [s.section, s.component, s.classNumber, s.days, s.room, s.instructor, s.status].join(" ").toLowerCase().indexOf(q) !== -1; });
    $("cb-sections").innerHTML = '<div class="table__row table__row--head" role="row"><span role="columnheader">Section</span><span role="columnheader">Days</span><span role="columnheader">Time</span><span role="columnheader">Room</span><span role="columnheader">Instructor</span><span role="columnheader">Status</span><span role="columnheader"><span class="visually-hidden">Actions</span></span></div>' +
      (list.length ? list.map(function (s) {
        var open = !!st.open[s.classNumber], did = "cb-d-" + s.classNumber;
        var time = s.start ? s.start + " – " + s.end : "—";
        return '<div class="table__row" role="row">' +
          '<span class="cb-sec__main" role="cell"><button type="button" class="btn btn--ghost btn--sm btn--icon-only cb-sec__toggle" data-toggle="' + s.classNumber + '" aria-expanded="' + open + '" aria-controls="' + did + '" aria-label="Details for section ' + s.section + '">' + ICONS.expand + '</button><span class="cb-sec__name"><b>' + esc(s.section) + " · " + esc(s.component) + "</b><span>Class " + esc(s.classNumber) + " · " + esc(s.session) + "</span></span></span>" +
          '<span class="cb-days" role="cell">' + (s.days ? esc(s.days) : "—") + "</span>" +
          '<span class="cb-time" role="cell">' + esc(time) + "</span>" +
          '<span class="cb-when" role="cell">' + (s.days ? esc(s.days) + " · " + esc(time) + " · " : "") + esc(s.room) + "</span>" +
          '<span class="cb-room" role="cell">' + esc(s.room) + "</span>" +
          '<span class="cb-who" role="cell">' + esc(s.instructor) + "</span>" +
          '<span class="cb-status" role="cell">' + statusHtml(s) + "</span>" +
          '<span class="cb-kebab" role="cell"><button type="button" class="btn btn--tint btn--sm" data-menu="' + s.classNumber + '" aria-haspopup="menu" aria-label="Actions for section ' + s.section + '"><span>Actions</span>' + ICONS.expand + "</button></span>" +
          "</div>" +
          '<div class="cb-detail" id="' + did + '"' + (open ? "" : " hidden") + ">" + detailHtml(s) + "</div>";
      }).join("") : '<div class="empty-state"><span class="empty-state__text">No sections match “' + esc(st.sq) + '”</span></div>');
  }
  searchBox("cb-sq", "cb-sq-box", "cb-sq-clear", "sq", renderSections);
  // the whole row toggles too (except its buttons)
  $("cb-sections").addEventListener("click", function (e) {
    var t = e.target.closest("[data-toggle]");
    if (!t && !e.target.closest("button, a")) { var row = e.target.closest(".table__row:not(.table__row--head)"); if (row) t = row.querySelector("[data-toggle]"); }
    if (t) { var k = t.dataset.toggle; st.open[k] = !st.open[k]; t.setAttribute("aria-expanded", st.open[k] ? "true" : "false"); $("cb-d-" + k).hidden = !st.open[k]; return; }
    var m = e.target.closest("[data-menu]");
    if (m) { openMenu(m); return; }
    var a = e.target.closest("[data-act]");
    if (a) { e.preventDefault(); act(a.dataset.act, a.closest(".cb-detail").id.slice(5)); }
  });
  function secByNumber(n) { return secs.filter(function (s) { return s.classNumber === n; })[0]; }
  function act(what, n) {
    var s = secByNumber(n), name = course[0] + " " + course[1] + " · " + s.section;
    var msg = { "Add to Cart": "Added to cart: " + name, "Enroll": "Enrollment request sent: " + name, "Add to Planner": "Added to your planner: " + name, "Add to Wishlist": "Added to your wishlist: " + name, "Add to Schedule Builder": "Added to Schedule Builder: " + name, "Share": "Link copied: " + name, "View Deadlines": null, "See Location": null, "Buy Books": null }[what];
    if (msg) toast(msg); else window.cx.notDesigned();
  }
  // ---- the section Menu (row ⋮ = all actions; the details' ⋯ = the rest) ----
  var menu = $("cb-menu"), menuFor = null, menuBtn = null;
  function openMenu(btn) {
    if (menu.matches(":popover-open") && menuBtn === btn) { menu.hidePopover(); return; }
    menuFor = btn.dataset.menu; menuBtn = btn;
    var rest = btn.hasAttribute("data-menu-rest");
    var acts = rest ? B.SECTION_ACTIONS.slice(3) : B.SECTION_ACTIONS;
    $("cb-menu-list").innerHTML = acts.map(function (a) { return '<button type="button" class="menu__item" role="menuitem" data-mact="' + esc(a) + '">' + esc(a) + "</button>"; }).join("");
    menu.showPopover();
    var r = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    var top = r.bottom + 4; if (top + menu.offsetHeight > innerHeight - 8) top = r.top - 4 - menu.offsetHeight;
    menu.style.top = top + "px"; menu.style.left = Math.max(8, r.right - menu.offsetWidth) + "px";
    menu.querySelector(".menu__item").focus();
  }
  menu.addEventListener("click", function (e) { var it = e.target.closest("[data-mact]"); if (!it) return; menu.hidePopover(); act(it.dataset.mact, menuFor); });

  // ---- views ----
  function show(v) {
    document.querySelectorAll(".cx-view[data-view]").forEach(function (x) { x.classList.toggle("is-active", x.dataset.view === v); });
    window.scrollTo(0, 0);
  }
  $("cb-back").addEventListener("click", function () { show("browse"); });
})();`;

// Two builds of one page: v2 wears the neutral (gray) Sidebar, v1 the blue one.
const appHtmlFor = (navTheme) => cxApp({
  navTheme,
  title: "Browse Classes",
  active: "class-browse",
  views,
  after,
  pageCss,
  pageJs,
  prompts: B.BROWSE_PROMPTS,
  colorPaths: ["text.danger", "surface.page", "text.primary"],
});

const viewerHtml = renderDesignViewer({
  activeKey: "cx-browse-classes",
  title: "CX Browse Classes",
  heading: "Browse Classes",
  sub: `Browse Classes, restyled on hp-design components in the CX shell — same flow and content as the live page (read off three saved copies): <b>Term</b> (required), <b>Career</b> and <b>Subject</b> → Search → a Class · Description table → a course's sections, each opening into Information / Details / Availability / Textbooks / Additional links with the section actions. What changed is the UI: the filters are Select base with floating labels ("Any …" is an option, not a × in the field); results get a count beside the table's own Search; <b>View sections</b> is Button tint (pale blue), not eleven solid blue ones; Start and End are one Time column and Session sits under the section; the seven equal buttons under an open section become <b>Add to cart</b>, Enroll, Add to planner and a ⋯ Menu (the row's <b>Actions</b> button opens the full Menu); the filters reflow like the live page (one row → the search field on its own row → two columns; below 1280 the sidebar folds to icons first), and the sections table stacks in a narrow column. Try 2027 Spring + ACCT, then <b>ACCT C2003</b> — its section 2000 is the live one, verbatim. Other subjects and sections are sample data. <b>v2 (current)</b> wears the Sidebar's neutral theme — gray.100 panel, dark text, the same white current-page pill; <b>v1</b> the brand-blue one.`,
  versions: [
    { label: "v2", note: "gray sidebar · current", file: "cx-browse-classes-v2-app.html" },
    { label: "v1", note: "blue sidebar", file: "cx-browse-classes-app.html" },
  ],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/cx-browse-classes-app.html"), appHtmlFor("brand"));
fs.writeFileSync(path.join(root, "docs/designs/cx-browse-classes-v2-app.html"), appHtmlFor("neutral"));
fs.writeFileSync(path.join(root, "docs/designs/cx-browse-classes.html"), viewerHtml);
console.log("wrote docs/designs/cx-browse-classes-app.html (v1, blue sidebar)");
console.log("wrote docs/designs/cx-browse-classes-v2-app.html (v2, gray sidebar)");
console.log("wrote docs/designs/cx-browse-classes.html");
