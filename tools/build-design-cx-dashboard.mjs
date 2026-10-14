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
// The shell (sidebar, topbar, footer, Assistant, resolved component recipes)
// is tools/lib/cx-shell.mjs, shared by every CX page; this file is only the
// dashboard's own views, CSS layer and script.
// Run: node tools/build-design-cx-dashboard.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { cxApp, icon } from "./lib/cx-shell.mjs";
import * as CX from "./lib/cx-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const pageCss = ({ tokens, R, D, dim, cv, typoCss, style }) => {
  const { card, button } = tokens;
  const bBase = button.secondary.size.base;
  return `
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
`;
};

const tabsHtml = Object.keys(CX.CX_WIDGETS).map((k, i) =>
  `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-tab="${k}">${CX.CX_TAB_LABEL[k]}</button>`
).join("\n          ");
const dim8 = "32px";

const views = `
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
        <div id="cx-pick" class="cx-view is-active" style="gap:${dim8}"></div>
      </section>
`;

const ICONS = {
  prev: icon("chevron_left", "btn__icon"),
  next: icon("chevron_right", "btn__icon"),
  arrow: icon("arrow_forward", "btn__icon"),
  check: icon("check", ""),
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

  var toast = window.cx.toast;

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
    if (e.target.closest("[data-go]")) window.cx.notDesigned();
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

  // the Dashboard link brings the dashboard view back (e.g. from Edit)
  document.querySelector(".sidebar").addEventListener("click", function (e) { var a = e.target.closest('[data-nav="dashboard"]'); if (a) show("dash"); });

  renderDash();
})();
`;

const appHtml = cxApp({ title: "Dashboard", active: "dashboard", views, pageCss, pageJs: appJs, prompts: CX.CX_ASSISTANT_PROMPTS });

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
