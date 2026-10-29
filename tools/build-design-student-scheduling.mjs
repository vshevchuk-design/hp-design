// Generates the Student Scheduling screen (Scheduling):
//   docs/designs/student-scheduling.html      — viewer page (shared chrome from
//     tools/lib/design-viewer.mjs: device tabs + Versions dropdown + iframe).
//   docs/designs/student-scheduling-app.html  — the prototype itself.
//
// A UI rebuild of the live student Scheduling app on hp-design components —
// same flow (browse services → pick a time → confirm), same content, but each
// pattern swapped for the DS component that actually owns that job:
//   · sort was a filter-looking dropdown in the filter row → a ghost Button +
//     Listbox on the results line, beside the count it orders;
//   · the "Drop-In available" checkbox + a Clear button that appeared when it
//     was ticked → a toggle Chip, which clears itself (Clear filters survives
//     only in the no-results state, where there is something to clear);
//   · "All departments" Select → the dropdown chip the Message Center uses;
//   · date in one surface, advisor + Confirm in a side SlideOverPanel → one page: day
//     and time ChoiceTiles on the left, a sticky "Your appointment" Card on the
//     right with the advisor RadioGroup and the one primary action.
// Workflow: designed here first, carried into Figma once it settles.
//
// Split like Explore Degrees: lib/ss-data.mjs (fixtures), lib/ss-css.mjs
// (recipes + ss-* layer), lib/ss-app.mjs (client script); markup lives here.
// Run: node tools/build-design-student-scheduling.mjs
import { collapsibleTrigger } from "./lib/collapsible.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { SHELL_TOPBAR_CSS, SHELL_COLOR_PATHS, shellTopbar } from "./lib/app-shell.mjs";
import { ssCss, SS_COLOR_PATHS } from "./lib/ss-css.mjs";
import { ssAppJs } from "./lib/ss-app.mjs";
import { TOAST_JS } from "./lib/toast.mjs";
import { hoverGuard } from "./lib/hover-guard.mjs";
import * as DATA from "./lib/ss-data.mjs";
import { SIDEBAR_CSS, SIDEBAR_COLOR_PATHS, SIDEBAR_JS, SIDEBAR_MENU_BUTTON, sidebarHtml } from "./lib/sidebar.mjs";
import { CX_NAV, CX_USER } from "./lib/cx-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

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

const COMPONENTS = ["tabs", "button", "select", "search", "chip", "listbox", "card", "badge", "pagination", "choice-tile", "radio", "alert", "toast", "tooltip", "empty-state", "dialog", "alert-dialog", "input", "counter", "progress", "attachment", "accordion", "calendar", "date-picker", "slide-over-panel", "box", "dropdown-menu", "status-icon"];
const comp = (name) => load(`tokens/components/${name}.tokens.json`).component;
const tokens = Object.assign({}, ...COMPONENTS.map(comp));

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`unresolved token ${ref}`);
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
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;
const refPath = (ref) => ref.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
// text-style.*'s textTransform/textDecoration live in $extensions, which
// resolveToken() silently drops.
const textExt = (styleRef) => (get(styleRef).$extensions || {})["hp.design/text"] || {};
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

// Every colour role any of these components references, read off the token
// files themselves — so a component token repointed at a new role brings its
// var along instead of silently rendering nothing.
const componentColorPaths = [];
(function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.$type === "color" && typeof node.$value === "string" && node.$value.startsWith("{")) componentColorPaths.push(refPath(node.$value));
  for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
})(tokens);

const colorPaths = [...new Set([...SHELL_COLOR_PATHS, ...SS_COLOR_PATHS, ...componentColorPaths, ...SIDEBAR_COLOR_PATHS])];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

// Every :hover goes behind @media (hover: hover) — on touch screens a tapped
// chip/button otherwise keeps its hover fill until something else is tapped.
const appCss = hoverGuard(`${rootVars}
${SHELL_TOPBAR_CSS}
${ssCss({ tokens, resolve, resolveToken, cv, px, refPath, typoCss, textExt, get })}`);

// The topbar's settings action: Button secondary base icon-only — this page
// ships its own full Button recipe, so it takes only the topbar half of the shell.
const settingsBtn = `<button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">${icon("settings", "btn__icon")}</button>`;
const chevronDown = icon("expand_more", "chip__icon");

// v5's section bar: segmented Tabs (base) instead of underline; the bar is the track.
const sectionsSeg = DATA.SECTIONS.map(
  (s, i) => `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}">${s}</button>`
).join("\n      ");
const sections = DATA.SECTIONS.map(
  (s, i) => `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}">${s}</button>`
).join("\n      ");

const TODS = [["any", "Any time"], ["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]];

const markup = `<div class="app">
${shellTopbar({ title: "Scheduling", actions: settingsBtn })}
  <nav class="ss-sections" aria-label="Scheduling sections">
    <div class="tabs--underline" role="tablist">
      ${sections}
    </div>
  </nav>
  <main class="ss__main">

    <!-- ============ Browse ============ -->
    <section class="ss-view is-active" data-view="browse">
      <div class="ss-head">
        <h2 class="ss-title">Browse services</h2>
        <p class="ss-sub">Book time with an advisor: find the service you need, then pick a time that works for you.</p>
      </div>
      <div class="ss-tools">
        <label class="search" id="ss-search">
          ${icon("search", "search__icon")}
          <input class="search__input" id="ss-search-input" type="search" placeholder="Search services" aria-label="Search services" autocomplete="off" />
          <button class="search__clear" id="ss-search-clear" type="button" aria-label="Clear search">${icon("close", "")}</button>
        </label>
        <div class="ss-filters">
          <button class="chip chip--lg chip--dropdown" id="ss-dept-chip" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="chip__label" id="ss-dept-label">Department</span>${chevronDown}</button>
          <button class="chip chip--lg" id="ss-drop-chip" type="button" aria-pressed="false">Drop-in available</button>
        </div>
      </div>

      <div class="ss-results" id="ss-results">
        <div class="ss-results__bar">
          <button class="btn btn--ghost btn--sm" id="ss-sort" type="button" aria-haspopup="listbox" aria-expanded="false">${icon("sort", "btn__icon")}<span id="ss-sort-label">Name (A–Z)</span></button>
        </div>
        <div class="card card--flush ss-list" id="ss-list"></div>
        <div class="ss-pager" id="ss-pager">
          <span class="ss-note" id="ss-range"></span>
          <nav class="pagination" id="ss-pages" aria-label="Pages"></nav>
        </div>
      </div>
      <div class="card is-hidden" id="ss-empty">
        <div class="card__body">
          <div class="empty-state"><span class="empty-state__text">No services match these filters</span></div>
          <button class="btn btn--secondary btn--sm" id="ss-clear-filters" type="button" style="align-self:center">Clear filters</button>
        </div>
      </div>
    </section>

    <!-- ============ Pick a time ============ -->
    <section class="ss-view" data-view="pick">
      <button class="btn btn--ghost btn--sm ss-back" id="ss-back" type="button">${icon("arrow_back", "btn__icon")}<span>All services</span></button>
      <div class="ss-head">
        <h2 class="ss-title" id="ss-pick-title"></h2>
        <p class="ss-sub" id="ss-pick-meta"></p>
      </div>
      <div class="alert is-hidden" id="ss-resched-note" role="status">
        ${icon("info", "alert__icon")}
        <div class="alert__stack"><p class="alert__message"><span class="alert__title">Rescheduling.</span> <span id="ss-resched-text"></span></p></div>
      </div>
      <div class="ss-pick">
        <div class="ss-choose">
          <!-- Step one, before any times: the department. A Select when several
               offer the service, the plain name when only one does — same place,
               same heading, either way. (v1 shows it in the meta line instead.) -->
          <div class="ss-step is-hidden" id="ss-dept-step">
            <h3 class="ss-step__title" id="ss-dept-step-title">Department</h3>
            <button class="select select--sm ss-pick-dept" id="ss-pick-dept" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="ss-dept-step-title ss-pick-dept-value"><span class="select__value" id="ss-pick-dept-value"></span>${icon("expand_more", "select__chevron")}</button>
            <p class="ss-step__value" id="ss-pick-dept-text"></p>
          </div>
          <div class="empty-state is-hidden" id="ss-need-dept"><span class="empty-state__text">Choose a department to see open times</span></div>
          <div class="ss-week" id="ss-week">
            <h3 class="ss-week__label" id="ss-week-label"></h3>
            <div class="ss-week__nav">
              <button class="btn btn--secondary btn--sm btn--icon-only" id="ss-prev-week" type="button" aria-label="Previous week">${icon("chevron_left", "btn__icon")}</button>
              <button class="btn btn--secondary btn--sm btn--icon-only" id="ss-next-week" type="button" aria-label="Next week">${icon("chevron_right", "btn__icon")}</button>
            </div>
          </div>
          <div id="ss-choose-body" class="ss-choose">
            <div class="tabs--segmented" id="ss-tod" role="tablist" aria-label="Time of day">
              ${TODS.map(([k, l]) => `<button class="tab tab--sm" type="button" role="tab" data-tod="${k}">${l}</button>`).join("\n              ")}
            </div>
            <div class="ss-days" id="ss-days" role="radiogroup" aria-label="Day"></div>
            <div class="ss-slots-head">
              <h4 class="ss-slots-head__title" id="ss-day-title"></h4>
              <span class="ss-note" id="ss-day-count"></span>
            </div>
            <div class="ss-slots" id="ss-slots" role="radiogroup" aria-label="Time"></div>
            <p class="ss-note">Times shown in your time zone (${DATA.TIME_ZONE}).</p>
          </div>
          <div id="ss-noslots" class="ss-choose is-hidden">
            <div class="alert" role="status">
              ${icon("info", "alert__icon")}
              <div class="alert__stack">
                <p class="alert__message"><span class="alert__title">No open times right now.</span> Every slot for this service is taken for the next ${DATA.WEEKS_AHEAD} weeks.</p>
                <p class="alert__detail">We can email you as soon as an advisor opens a new time.</p>
                <div class="alert__actions">
                  <button class="btn btn--primary btn--sm" id="ss-notify" type="button">${icon("notifications", "btn__icon")}<span>Notify me when a spot opens</span></button>
                  <button class="btn btn--secondary btn--sm" id="ss-dropins" type="button">Go to Drop-Ins</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="card ss-summary" id="ss-summary" aria-label="Your appointment">
          <div class="card__header"><h3 class="card__title">Your appointment</h3></div>
          <div class="card__body">
            <dl class="ss-facts">
              <dt>Service</dt><dd id="ss-sum-service"></dd>
              <dt>Department</dt><dd id="ss-sum-dept"></dd>
              <dt class="ss-sum-when-row">When</dt><dd id="ss-sum-when" class="ss-sum-when-row is-empty"></dd>
              <dt>Duration</dt><dd id="ss-sum-duration"></dd>
            </dl>
            <div class="ss-rule ss-sum-booking"></div>
            <p class="ss-note ss-sum-booking" id="ss-advisor-hint">Pick a time to see which advisors are free.</p>
            <fieldset class="radio-group ss-sum-booking is-hidden" id="ss-advisor-group">
              <legend class="radio-group__label">Advisor</legend>
              <div class="radio-group__items" id="ss-advisors"></div>
            </fieldset>
            <div class="ss-rule ss-sum-loc"></div>
            <div class="ss-loc ss-sum-loc">
              <span class="ss-eyebrow">Location</span>
              <p class="ss-loc__text" id="ss-sum-location"></p>
              <p class="ss-note" id="ss-sum-formats"></p>
            </div>
          </div>
          <div class="card__footer ss-sum-booking">
            <button class="btn btn--primary btn--base btn--block" id="ss-confirm" type="button" disabled>Confirm appointment</button>
          </div>
        </aside>
      </div>
    </section>

    <!-- ============ My appointments ============ -->
    <!-- No "New appointment" button: it only went to the Browse tab, which is
         one tap away in the section bar. The empty state keeps that path. -->
    <section class="ss-view" data-view="appointments">
      <div class="ss-head">
        <h2 class="ss-title">My appointments</h2>
        <p class="ss-sub ss-sub--sm">Your visits with advisors — check in, reschedule or cancel here.</p>
      </div>
      <div class="tabs--segmented" id="ss-appt-tabs" role="tablist" aria-label="Appointments" style="align-self:flex-start">
        <button class="tab tab--sm tab--active" type="button" role="tab" aria-selected="true" data-appt-tab="upcoming">Upcoming <span class="counter" id="ss-upcoming-count">0</span></button>
        <button class="tab tab--sm" type="button" role="tab" aria-selected="false" data-appt-tab="past">Past</button>
        <button class="tab tab--sm" type="button" role="tab" aria-selected="false" data-appt-tab="cancelled">Cancelled</button>
      </div>
      <div class="ss-appts" id="ss-appts"></div>
      <div class="card is-hidden" id="ss-appts-empty">
        <div class="card__body">
          <div class="empty-state"><span class="empty-state__text" id="ss-appts-empty-text"></span></div>
          <button class="btn btn--secondary btn--sm is-hidden" id="ss-appts-browse" type="button" style="align-self:center">Browse services</button>
        </div>
      </div>
    </section>

    <!-- ============ Appointment details ============ -->
    <section class="ss-view" data-view="appt">
      <button class="btn btn--ghost btn--sm ss-back" id="ss-appt-back" type="button">${icon("arrow_back", "btn__icon")}<span>My appointments</span></button>
      <div class="ss-detail">
        <div class="ss-head">
          <div class="ss-detail__title"><h2 class="ss-title" id="ss-d-name"></h2><span id="ss-d-status"></span></div>
          <p class="ss-sub" id="ss-d-dept"></p>
        </div>
        <!-- v6: after Check in — what happens next, by meeting format -->
        <div class="alert alert--success is-hidden" id="ss-d-here" role="status">
          ${icon("check_circle", "alert__icon")}
          <div class="alert__stack"><p class="alert__message"><span class="alert__title">You're checked in.</span> <span id="ss-d-here-text"></span></p></div>
        </div>
        <div class="alert is-hidden" id="ss-d-questions" role="status">
          ${icon("info", "alert__icon")}
          <div class="alert__stack">
            <p class="alert__message"><span class="alert__title" id="ss-d-q-title"></span> <span id="ss-d-q-text"></span></p>
            <div class="alert__actions"><button class="btn btn--primary btn--sm" id="ss-d-q-open" type="button">Answer questions</button></div>
          </div>
        </div>
        <div class="card">
          <div class="card__body">
            <dl class="ss-dl" id="ss-d-facts"></dl>
            <!-- what the service is: a sunken Box under the facts, part of the
                 appointment rather than a caption under the card -->
            <div class="ss-detail__section ss-about" id="ss-d-about"><h3>About this service</h3><p id="ss-d-about-text"></p></div>
          </div>
          <div class="card__footer ss-detail__actions" id="ss-d-actions"></div>
        </div>
      </div>
    </section>

    <!-- ============ other sections (not designed yet) ============ -->
    <section class="ss-view" data-view="placeholder">
      <div class="empty-state"><span class="empty-state__text" id="ss-placeholder-text"></span></div>
    </section>
  </main>
</div>
<div class="listbox" id="ss-lb" popover role="listbox"><div class="listbox__list"></div></div>
<!-- Questions the advisor asked before the meeting — Dialog -->
<dialog class="dialog" id="ss-q-modal" aria-labelledby="ss-q-title" aria-describedby="ss-q-intro">
  <form method="dialog" id="ss-q-form" class="dialog__content">
    <div class="dialog__header">
      <div class="dialog__heading"><h2 class="dialog__title" id="ss-q-title">Before your appointment</h2><p class="dialog__description" id="ss-q-intro"></p></div>
      <button class="dialog__close" type="button" id="ss-q-close" aria-label="Close">${icon("close", "dialog__close-icon")}</button>
    </div>
    <div class="dialog__body"><div id="ss-q-fields" class="ss-detail"></div></div>
    <div class="dialog__footer">
      <button class="btn btn--secondary btn--base" type="button" id="ss-q-cancel">Not now</button>
      <button class="btn btn--primary btn--base" type="submit" id="ss-q-send">Send answers</button>
    </div>
  </form>
</dialog>
<!-- Cancel confirmation — AlertDialog: no backdrop or Escape dismiss -->
<dialog class="alert-dialog" id="ss-cancel-modal" role="alertdialog" aria-labelledby="ss-cancel-title" aria-describedby="ss-cancel-text">
  <div class="alert-dialog__content">
    <div class="alert-dialog__text"><h2 class="alert-dialog__title" id="ss-cancel-title">Cancel this appointment?</h2><p class="alert-dialog__description" id="ss-cancel-text"></p></div>
    <div class="alert-dialog__actions">
      <button class="btn btn--secondary btn--base" type="button" id="ss-cancel-keep" autofocus>Keep it</button>
      <button class="btn btn--danger btn--base" type="button" id="ss-cancel-confirm">Cancel appointment</button>
    </div>
  </div>
</dialog>`;

const ICONS = {
  check: icon("check", "listbox__checkmark"),
  chevron: icon("expand_more", "select__chevron"),
  chevronLeft: icon("chevron_left", ""),
  chevronRight: icon("chevron_right", ""),
  checkCircle: icon("check_circle", "toast__icon"),
  group: icon("group", ""),
  call: icon("call", ""),
  videocam: icon("videocam", ""),
  schedule: icon("schedule", ""),
  person: icon("person", ""),
  copy: icon("content_copy", "btn__icon"),
  noteClock: icon("schedule", ""),
  dateRange: icon("date_range", ""),
  today: icon("today", ""),
  people: icon("group", ""),
  file: icon("insert_drive_file", "attachment__icon"),
  download: icon("download", "attachment__action-glyph"),
  accChevron: icon("expand_more", "accordion__chevron"),
  alertInfo: icon("info", "alert__icon"),
  alertCall: icon("campaign", "alert__icon"),
};

const UNDERLINE_NAV = `<nav class="ss-sections" aria-label="Scheduling sections">
    <div class="tabs--underline" role="tablist">
      ${sections}
    </div>
  </nav>`;
const SEGMENTED_NAV = `<nav class="ss-sections ss-sections--seg" aria-label="Scheduling sections">
    <div class="tabs--segmented" role="tablist">
      ${sectionsSeg}
    </div>
  </nav>`;
if (!markup.includes(UNDERLINE_NAV)) throw new Error("section nav markup drifted — update UNDERLINE_NAV");
// v5's browse head: a row for the title + a search button (phone only), and
// a 12px subtitle. The search field itself moves into that row on a phone
// (script, on the breakpoint) and expands over the title when opened.
const BROWSE_HEAD = `<div class="ss-head">
        <h2 class="ss-title">Browse services</h2>
        <p class="ss-sub">Book time with an advisor: find the service you need, then pick a time that works for you.</p>
      </div>`;
const BROWSE_HEAD_V5 = `<div class="ss-head" id="ss-browse-head">
        <div class="ss-head__row" id="ss-head-row">
          <h2 class="ss-title">Browse services</h2>
          <button class="btn btn--secondary btn--base btn--icon-only ss-search-open" id="ss-search-open" type="button" aria-label="Search services" aria-expanded="false">${icon("search", "btn__icon")}</button>
        </div>
        <p class="ss-sub ss-sub--sm">Book time with an advisor: find the service you need, then pick a time that works for you.</p>
      </div>`;
if (!markup.includes(BROWSE_HEAD)) throw new Error("browse head markup drifted — update BROWSE_HEAD");
// v1 and v5 now share the whole shell (segmented section bar, browse head
// with the phone search button, flush divided list); they differ only in the
// item template and where the department is chosen.
const markupFor = () =>
  markup
    .replace('class="card card--flush ss-list" id="ss-list"', 'class="ss-hybrid ss-hybrid--flush" id="ss-list"')
    .replace(UNDERLINE_NAV, SEGMENTED_NAV)
    .replace(BROWSE_HEAD, BROWSE_HEAD_V5);

// ---------------- v6: Book + My schedule ----------------
// Six live tabs fold into two. Book is one catalogue — appointments, drop-in
// desks and workshops — narrowed by a Type dropdown chip next to Department
// (the drop-in toggle chip is gone: Type covers it). Two new views: the
// workshop page (choose a schedule or a date, register) and the success
// screen every booking ends on.
// Calendar is a top-level section from 768 up; on a phone its tab is hidden.
const sectionsV6 = DATA.SECTIONS_V6.map(
  (s, i) => `<button class="tab tab--base${i === 0 ? " tab--active" : ""}${s === "Calendar" ? " ss-tab--wide" : ""}" type="button" role="tab" aria-selected="${i === 0}">${s}${s === "My schedule" ? `<span class="counter ss-attn is-hidden" id="ss-attn-count"></span>` : ""}</button>`
).join("\n      ");
const SEGMENTED_NAV_V6 = SEGMENTED_NAV.replace(sectionsSeg, sectionsV6).replace('class="ss-sections ss-sections--seg"', 'class="ss-sections ss-sections--seg ss-sections--center"');
const DROP_CHIP = `<button class="chip chip--lg" id="ss-drop-chip" type="button" aria-pressed="false">Drop-in available</button>`;
const DEPT_CHIP = `<button class="chip chip--lg chip--dropdown" id="ss-dept-chip" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="chip__label" id="ss-dept-label">Department</span>${chevronDown}</button>`;
// Type is underline Tabs under the filter row (user, 2026-10-13), and sort
// moves up beside Department — one row of "narrow + order", then the kinds.
const SORT_BAR = `<div class="ss-results__bar">
          <button class="btn btn--ghost btn--sm" id="ss-sort" type="button" aria-haspopup="listbox" aria-expanded="false">${icon("sort", "btn__icon")}<span id="ss-sort-label">Name (A–Z)</span></button>
        </div>
        `;
const SORT_BTN = `<button class="btn btn--ghost btn--sm ss-sort-inline" id="ss-sort" type="button" aria-haspopup="listbox" aria-expanded="false">${icon("sort", "btn__icon")}<span id="ss-sort-label">Name (A–Z)</span></button>`;
const TOOLS_END = `</div>
      </div>

      <div class="ss-results" id="ss-results">`;
const TYPE_TABS = `</div>
      </div>
      <div class="tabs--underline ss-type-tabs" id="ss-type-tabs" role="tablist" aria-label="Type">
        ${[["", "All"], ["appointment", "Appointments"], ["dropin", "Drop-ins"], ["workshop", "Workshops"]].map(([v, l], i) => `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-type="${v}">${l}</button>`).join("\n        ")}
      </div>

      <div class="ss-results" id="ss-results">`;
const APPTS_HEAD = `<h2 class="ss-title">My appointments</h2>
        <p class="ss-sub ss-sub--sm">Your visits with advisors — check in, reschedule or cancel here.</p>`;
const APPTS_BACK = `<span>My appointments</span></button>`;
const PLACEHOLDER = `<!-- ============ other sections (not designed yet) ============ -->`;
const CANCELLED_TAB = `
        <button class="tab tab--sm" type="button" role="tab" aria-selected="false" data-appt-tab="cancelled">Cancelled</button>`;
const LISTBOX_EL = `<div class="listbox" id="ss-lb" popover role="listbox">`;
if (!markup.includes(CANCELLED_TAB) || !markup.includes(LISTBOX_EL)) throw new Error("v6: markup drifted — update CANCELLED_TAB / LISTBOX_EL");
for (const [name, frag] of Object.entries({ DROP_CHIP, DEPT_CHIP, APPTS_HEAD, APPTS_BACK, PLACEHOLDER, SORT_BAR, TOOLS_END })) {
  if (!markup.includes(frag)) throw new Error(`v6: markup drifted — update ${name}`);
}

const V6_VIEWS = `<!-- ============ Workshop ============ -->
    <!-- One page for every workshop: what it is, then the choice the workshop
         needs — a schedule (series with several), nothing (series with one),
         or a date (single sessions) — and the registration summary beside it.
         On a phone the Register button rides in a bar at the bottom. -->
    <section class="ss-view" data-view="workshop">
      <button class="btn btn--ghost btn--sm ss-back" id="ss-ws-back" type="button">${icon("arrow_back", "btn__icon")}<span>Book</span></button>
      <div class="ss-head">
        <div class="ss-detail__title"><h2 class="ss-title" id="ss-ws-name"></h2><span class="ss-ws-badges" id="ss-ws-badges"></span></div>
        <p class="ss-sub" id="ss-ws-meta"></p>
      </div>
      <div class="alert is-hidden" id="ss-ws-note" role="status">
        ${icon("info", "alert__icon")}
        <div class="alert__stack">
          <p class="alert__message"><span class="alert__title" id="ss-ws-note-title"></span> <span id="ss-ws-note-text"></span></p>
          <div class="alert__actions" id="ss-ws-note-actions"></div>
        </div>
      </div>
      <div class="ss-pick">
        <div class="ss-choose ss-choose--ws">
          <div class="ss-step" id="ss-ws-choose">
            <div class="ss-step__head"><h3 class="ss-step__title" id="ss-ws-choose-title"></h3><span class="ss-note" id="ss-ws-choose-hint"></span></div>
            <div class="ss-ws-options" id="ss-ws-options" role="radiogroup" aria-labelledby="ss-ws-choose-title"></div>
            <div class="ss-ws-fixed card card--flush is-hidden" id="ss-ws-fixed"></div>
          </div>
          <div class="ss-step is-hidden" id="ss-ws-sessions-step">
            <div class="ss-step__head"><h3 class="ss-step__title">Sessions</h3><span class="ss-note" id="ss-ws-sessions-count"></span></div>
            <ol class="ss-sessions" id="ss-ws-sessions"></ol>
            ${collapsibleTrigger({ id: "ss-ws-more", more: "Show all sessions", less: "Show fewer", extraClass: "ss-sessions__more is-hidden" })}
          </div>
        </div>
        <aside class="card ss-summary" id="ss-ws-summary" aria-label="Your registration">
          <div class="card__header"><h3 class="card__title">Your registration</h3></div>
          <div class="card__body">
            <dl class="ss-facts" id="ss-ws-facts"></dl>
            <div class="ss-detail__section ss-about"><h3>About this workshop</h3><p id="ss-ws-about"></p></div>
            <div class="ss-rule"></div>
            <div class="ss-loc">
              <span class="ss-eyebrow">Location</span>
              <p class="ss-loc__text" id="ss-ws-location"></p>
            </div>
          </div>
          <div class="card__footer ss-ws-foot">
            <button class="btn btn--primary btn--base btn--block" id="ss-ws-register" type="button" disabled>Register</button>
          </div>
        </aside>
      </div>
      <div class="ss-cta-bar" id="ss-ws-bar"><button class="btn btn--primary btn--base btn--block" id="ss-ws-register-bar" type="button" disabled>Register</button></div>
    </section>

    <!-- ============ Drop-in visit — the queue page ============ -->
    <!-- One page for a drop-in from joining to done: the status Card (your
         place / stepped away / in a meeting / done) or, when an advisor calls,
         a success Alert with "I'm on my way"; then the advisor's summary and a
         rating once it's over, and the visit's facts. -->
    <section class="ss-view" data-view="visit">
      <button class="btn btn--ghost btn--sm ss-back" id="ss-v-back" type="button">${icon("arrow_back", "btn__icon")}<span>Book</span></button>
      <div class="ss-head">
        <div class="ss-detail__title"><h2 class="ss-title" id="ss-v-name"></h2><span class="ss-ws-badges" id="ss-v-badges"></span></div>
        <p class="ss-sub" id="ss-v-dept"></p>
      </div>
      <div class="ss-detail">
        <div id="ss-v-status"></div>
        <div class="ss-step is-hidden" id="ss-v-summary-step">
          <h3 class="ss-step__title">Summary</h3>
          <div class="card"><div class="card__body" id="ss-v-summary"></div></div>
        </div>
        <div class="ss-step is-hidden" id="ss-v-rate-step">
          <h3 class="ss-step__title" id="ss-v-rate-title">How was this visit?</h3>
          <div class="ss-v-rate" id="ss-v-rate" role="group" aria-labelledby="ss-v-rate-title">
            <button class="chip" type="button" aria-pressed="false" data-rate="3">Very helpful</button>
            <button class="chip" type="button" aria-pressed="false" data-rate="2">Somewhat helpful</button>
            <button class="chip" type="button" aria-pressed="false" data-rate="1">Not helpful</button>
          </div>
          <p class="ss-note is-hidden" id="ss-v-rate-thanks"></p>
        </div>
        <div class="card"><div class="card__body"><dl class="ss-dl" id="ss-v-facts"></dl></div></div>
      </div>
    </section>

    <!-- ============ My workshop — a workshop you're registered for ============ -->
    <!-- Where a registration lives: how far along you are, the next session
         (check in / can't make it), what's coming, what happened — attendance
         and the organizer's notes and files per past session — and the
         workshop's materials. Leave sits in the details card's foot. -->
    <section class="ss-view" data-view="myws">
      <button class="btn btn--ghost btn--sm ss-back" id="ss-mw-back" type="button">${icon("arrow_back", "btn__icon")}<span>My schedule</span></button>
      <div class="ss-head">
        <div class="ss-detail__title"><h2 class="ss-title" id="ss-mw-name"></h2><span class="ss-ws-badges" id="ss-mw-badges"></span></div>
        <p class="ss-sub" id="ss-mw-meta"></p>
      </div>
      <div class="ss-pick">
        <div class="ss-choose ss-choose--ws">
          <div class="card ss-mw-progress" id="ss-mw-progress">
            <div class="card__body">
              <div class="ss-step__head"><h3 class="ss-step__title">Progress</h3><span class="ss-note" id="ss-mw-progress-text"></span></div>
              <div class="progress progress--base" role="progressbar" aria-labelledby="ss-mw-progress-text" id="ss-mw-bar"><span class="progress__bar" id="ss-mw-bar-fill"></span></div>
            </div>
          </div>
          <div class="ss-step" id="ss-mw-next-step">
            <h3 class="ss-step__title" id="ss-mw-next-title">Next session</h3>
            <div class="card"><div class="card__body ss-mw-next" id="ss-mw-next"></div></div>
          </div>
          <div class="ss-step" id="ss-mw-up-step">
            <div class="ss-step__head"><h3 class="ss-step__title">Coming up</h3><span class="ss-note" id="ss-mw-up-count"></span></div>
            <ol class="ss-sessions" id="ss-mw-up"></ol>
            ${collapsibleTrigger({ id: "ss-mw-more", more: "Show all", less: "Show fewer", extraClass: "ss-sessions__more is-hidden" })}
          </div>
          <div class="ss-step" id="ss-mw-past-step">
            <div class="ss-step__head"><h3 class="ss-step__title">Past sessions</h3><span class="ss-note" id="ss-mw-past-count"></span></div>
            <div class="card card--flush accordion" id="ss-mw-past"></div>
          </div>
          <div class="ss-step" id="ss-mw-mat-step">
            <h3 class="ss-step__title">Materials</h3>
            <div class="ss-files" id="ss-mw-materials"></div>
          </div>
        </div>
        <aside class="card ss-summary" aria-label="Workshop details">
          <!-- Leave is rare and final: it lives in the ⋯ menu, not as a button -->
          <div class="card__header ss-card-head"><h3 class="card__title">Your workshop</h3><button class="btn btn--ghost btn--sm btn--icon-only ss-card-head__more" id="ss-mw-more-btn" type="button" popovertarget="ss-mw-menu" aria-haspopup="menu" aria-label="More actions">${icon("more_horiz", "btn__icon")}</button></div>
          <div class="card__body">
            <dl class="ss-facts" id="ss-mw-facts"></dl>
            <div class="ss-detail__section ss-about"><h3>About this workshop</h3><p id="ss-mw-about"></p></div>
            <div class="ss-rule"></div>
            <div class="ss-loc">
              <span class="ss-eyebrow">Location</span>
              <p class="ss-loc__text" id="ss-mw-location"></p>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <!-- ============ Done — every booking ends here ============ -->
    <section class="ss-view" data-view="done">
      <div class="card ss-done">
        <div class="card__body ss-done__body">
          <span class="ss-done__icon">${icon("check_circle", "")}</span>
          <h2 class="ss-title" id="ss-done-title"></h2>
          <p class="ss-sub" id="ss-done-text"></p>
        </div>
        <div class="card__body ss-done__facts"><dl class="ss-dl" id="ss-done-facts"></dl></div>
        <div class="card__footer ss-done__actions" id="ss-done-actions"></div>
      </div>
    </section>

    `;

// Leaving a workshop — AlertDialog, like cancelling an appointment.
// Tablet: the chosen day in a SlideOverPanel, bottom placement.
// The my-workshop card's ⋯ menu (Menu, one destructive item).
const MW_MENU = `<div class="dropdown-menu" id="ss-mw-menu" popover role="menu" aria-label="Workshop actions">
  <div class="dropdown-menu__list" role="none"><button class="dropdown-menu__item dropdown-menu__item--destructive" type="button" role="menuitem" id="ss-mw-leave">${icon("logout", "dropdown-menu__icon")}<span id="ss-mw-leave-label">Leave workshop</span></button></div>
</div>
`;
const CAL_DRAWER = `<dialog class="slide-over-panel slide-over-panel--bottom ss-cal-drawer" id="ss-cal-drawer" aria-labelledby="ss-cal-drawer-title">
  <div class="slide-over-panel__content">
    <div class="slide-over-panel__header"><div class="slide-over-panel__heading"><h2 class="slide-over-panel__title" id="ss-cal-drawer-title"></h2></div><button class="slide-over-panel__close" type="button" id="ss-cal-drawer-close" aria-label="Close">${icon("close", "slide-over-panel__close-icon")}</button></div>
    <div class="slide-over-panel__body">
      <div class="ss-cal-rows" id="ss-cal-drawer-day"></div>
      <div class="empty-state is-hidden" id="ss-cal-drawer-empty"><span class="empty-state__text">Nothing on this day</span></div>
    </div>
  </div>
</dialog>
`;
const LEAVE_DIALOG = `<dialog class="alert-dialog" id="ss-leave-modal" role="alertdialog" aria-labelledby="ss-leave-title" aria-describedby="ss-leave-text">
  <div class="alert-dialog__content">
    <div class="alert-dialog__text"><h2 class="alert-dialog__title" id="ss-leave-title"></h2><p class="alert-dialog__description" id="ss-leave-text"></p></div>
    <div class="alert-dialog__actions">
      <button class="btn btn--secondary btn--base" type="button" id="ss-leave-keep" autofocus>Stay registered</button>
      <button class="btn btn--danger btn--base" type="button" id="ss-leave-confirm"></button>
    </div>
  </div>
</dialog>
`;

// While you're in a drop-in queue (or hold a seat), every other screen shows
// where you are: an Alert band at the top of the page column — info while
// waiting, success when an advisor calls you.
const QUEUE_BANNER = `<div class="alert ss-banner is-hidden" id="ss-banner" role="status">
      <span id="ss-banner-icon"></span>
      <div class="alert__stack"><p class="alert__message"><span class="alert__title" id="ss-banner-title"></span> <span id="ss-banner-text"></span></p></div>
      <button class="btn btn--secondary btn--sm" id="ss-banner-view" type="button">View</button>
    </div>
`;
const MAIN_OPEN = `<main class="ss__main">
`;
if (!markup.includes(MAIN_OPEN)) throw new Error("v6: markup drifted — update MAIN_OPEN");

// The Calendar section (top nav, from 768): a month on DatePicker's day recipe (today ring, selected fill) with a dot
// per event (chips with time + title from 768), then the chosen day's rows.
const APPTS_EMPTY_END = `<button class="btn btn--secondary btn--sm is-hidden" id="ss-appts-browse" type="button" style="align-self:center">Browse services</button>
        </div>
      </div>`;
if (!markup.includes(APPTS_EMPTY_END)) throw new Error("v6: markup drifted — update APPTS_EMPTY_END");
const CALENDAR = `
      <div class="ss-cal" id="ss-cal">
        <div class="card ss-cal__month">
          <div class="ss-cal__head">
            <h3 class="ss-cal__label" id="ss-cal-label"></h3>
            <button class="select select--sm ss-cal-pick" id="ss-cal-pick" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Month"><span class="select__value" id="ss-cal-pick-value"></span>${icon("expand_more", "select__chevron")}</button>
            <div class="ss-week__nav">
              <button class="btn btn--secondary btn--sm" id="ss-cal-today" type="button">Today</button>
              <button class="btn btn--secondary btn--sm btn--icon-only" id="ss-cal-prev" type="button" aria-label="Previous month">${icon("chevron_left", "btn__icon")}</button>
              <button class="btn btn--secondary btn--sm btn--icon-only" id="ss-cal-next" type="button" aria-label="Next month">${icon("chevron_right", "btn__icon")}</button>
            </div>
          </div>
          <div class="ss-cal__grid" id="ss-cal-grid"></div>
          <div class="ss-cal__legend">
            <span class="ss-cal__key"><span class="ss-cal__dot ss-cal__dot--appointment"></span>Appointment</span>
            <span class="ss-cal__key"><span class="ss-cal__dot ss-cal__dot--dropin"></span>Drop-in</span>
            <span class="ss-cal__key"><span class="ss-cal__dot ss-cal__dot--workshop"></span>Workshop</span>
          </div>
        </div>
        <!-- the chosen day: a sticky card beside the month from 1024; on a
             tablet the same rows open in a bottom SlideOverPanel instead -->
        <aside class="card card--flush ss-cal__side" aria-labelledby="ss-cal-day-title">
          <div class="card__header"><h3 class="card__title" id="ss-cal-day-title"></h3></div>
          <div class="ss-cal-rows" id="ss-cal-day"></div>
          <div class="empty-state is-hidden" id="ss-cal-empty"><span class="empty-state__text">Nothing on this day</span></div>
        </aside>
      </div>`;
const SCHED_TITLE = `<h2 class="ss-title">My schedule</h2>`;

// My schedule gets Book's Type tabs too, under Upcoming / Past.
const SCHED_LIST = `      <div class="ss-appts" id="ss-appts"></div>`;
const typeTabs = (id) => `      <div class="tabs--underline ss-type-tabs" id="${id}" role="tablist" aria-label="Type">
        ${[["", "All"], ["appointment", "Appointments"], ["dropin", "Drop-ins"], ["workshop", "Workshops"]].map(([v, l], i) => `<button class="tab tab--base${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-type="${v}">${l}</button>`).join("\n        ")}
      </div>
`;
const CALENDAR_VIEW = () => `<!-- ============ Calendar (from 768) ============ -->
    <section class="ss-view" data-view="calendar">
      <div class="ss-head">
        <h2 class="ss-title">Calendar</h2>
        <p class="ss-sub ss-sub--sm">Everything you've booked, by day — every workshop session included.</p>
      </div>
${CALENDAR}
    </section>

    `;

const markupV6 = () =>
  markupFor()
    .replace(SCHED_LIST, typeTabs("ss-sched-type") + SCHED_LIST)

    .replace(MAIN_OPEN, MAIN_OPEN + "    " + QUEUE_BANNER)
    .replace(CANCELLED_TAB, "")
    .replace(LISTBOX_EL, LEAVE_DIALOG + CAL_DRAWER + MW_MENU + LISTBOX_EL)
    .replace(SEGMENTED_NAV, SEGMENTED_NAV_V6)
    .replace('<h2 class="ss-title">Browse services</h2>', '<h2 class="ss-title">Book</h2>')
    .replace("Book time with an advisor: find the service you need, then pick a time that works for you.", "Appointments with an advisor, drop-in hours and workshops — find what you need and book it here.")
    .replace(/Search services/g, "Search")
    .replace(DROP_CHIP, "")
    .replace(DEPT_CHIP, DEPT_CHIP + "\n          " + SORT_BTN)
    .replace(SORT_BAR, "")
    .replace(TOOLS_END, TYPE_TABS)
    .replace(APPTS_HEAD, `${SCHED_TITLE}
        <p class="ss-sub ss-sub--sm">Everything you've booked — appointments, drop-ins and workshops.</p>`)
    .replace(APPTS_BACK, `<span>My schedule</span></button>`)
    .replace(">Go to Drop-Ins<", ">See drop-in hours<")
    .replace(PLACEHOLDER, V6_VIEWS + CALENDAR_VIEW() + PLACEHOLDER);

// Two layouts of the same app, both kept buildable rather than frozen as
// copies: v5 (departments as text under the name) is current, v1 (the
// original list) stays comparable in the viewer's Versions dropdown.
// (v2/v3 card grids and v4 inline department badges were dropped.)
// ---------------- v7: v6 inside the CX app ----------------
// Same app, now a page of CX: the gray Sidebar (Advisor → Scheduling) on the
// left, and the section switch is the DS segmented Tabs as it ships — its own
// gray track with radius, not a track stretched into a full-width band
// (user, 2026-10-28). From 768 it sits centred in the 64px topbar (title |
// tabs | settings); on a phone the topbar gets a second row for it. The
// band's tuck-on-scroll goes with the band.
const V7_TABS = `<nav class="ss-sections ss-sections--seg ss-sections--center" aria-label="Scheduling sections">
    <div class="tabs--segmented" role="tablist">`;
const V7_APP_END = `</div>
<dialog class="alert-dialog" id="ss-leave-modal"`;
const v7Css = () => {
  const tabs = tokens.tabs;
  const dm = (k) => px(resolve(`dim.${k}`));
  const track = `calc(${px(resolve(tabs.size.base.height.$value))} + 2 * ${px(resolve(tabs.segmented.trackPadding.$value))})`;
  const trackSm = `calc(${px(resolve(tabs.size.sm.height.$value))} + 2 * ${px(resolve(tabs.segmented.trackPadding.$value))})`;
  return `
/* ============ v7: CX shell — Sidebar + topbar with the section Tabs ============ */
html { background: ${cv("surface.page")}; }
.cx { display: flex; min-height: 100dvh; }
.cx__main { flex: 1; min-width: 0; }
.cx .app__topbar { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); grid-template-areas: "title tabs actions"; align-items: center; }
.cx .app__brand { grid-area: title; }
.cx .app__topbar > .btn:last-child { grid-area: actions; justify-self: end; }
.cx .sidebar-open { display: none; }
/* the Tabs as the component ships: track gray, track radius, 4px padding — base (48) in the topbar, sm (40) on a phone */
.cx .ss-sections--top { grid-area: tabs; position: static; padding: 0; background: none; }
.cx .ss-sections--top .tabs--segmented { height: ${track}; }
/* Department: a Select beside Search, up to 240 wide */
.cx .ss-filters .ss-dept-select { width: ${dm(60)}; flex: 0 1 auto; min-width: 0; }
/* My schedule: title + subtitle on the left, the Type Select on the right */
.cx .ss-sched-top { display: flex; align-items: flex-end; justify-content: space-between; gap: ${dm(4)}; }
.cx .ss-type-pick { width: ${dm(40)}; flex: none; min-width: 0; }
/* and Book's 12px rhythm (head → type tabs → list), not 24 — the 24s made the tabs float (user, 2026-10-29) */
.cx [data-view="appointments"] { gap: ${dm(3)}; }
/* sticky columns sit under the 64px topbar alone now (no band under it) */
@media (min-width: 1024px) {
  .cx .ss-summary { top: calc(${dm(16)} + ${dm(6)}); }
  .cx .ss-cal__side { top: calc(${dm(16)} + ${dm(6)}); max-height: calc(100dvh - ${dm(16)} - ${dm(12)}); }
}
@media (max-width: 767px) {
  /* phone: the topbar is one 64px row again (menu | title | settings); the
     section Tabs move to the top of the page, under it, and scroll with it
     (the script moves the element — one set of tabs, not two) */
  .cx .app__topbar { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "menu title actions"; }
  .cx .sidebar-open { display: inline-flex; grid-area: menu; }
  .cx .ss__main > .ss-sections--top .tabs--segmented { display: flex; width: 100%; height: ${trackSm}; }
  /* the section's own title + subtitle go (screen readers keep the h2): the
     selected tab already says where you are (user, 2026-10-29). One 16px
     rhythm — topbar → tabs → the section's controls; 12 inside a section. */
  .cx .ss__main { padding-top: ${dm(4)}; gap: ${dm(4)}; }
  .cx :is([data-view="browse"], [data-view="appointments"] > .ss-sched-top, [data-view="calendar"]) > .ss-head { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .cx [data-view="calendar"] { gap: ${dm(3)}; }
  /* Book: the type Tabs sit on the list (user, 2026-10-29) — their baseline,
     edge to edge, is the list's top edge: one line between the gray controls
     and the white results, not two 12px apart. (My schedule keeps the gap.) */
  .cx [data-view="browse"] .ss-type-tabs { margin-inline: -${dm(4)}; padding-inline: ${dm(4)}; width: calc(100% + 2 * ${dm(4)}); max-width: none; }
  .cx [data-view="browse"] .ss-type-tabs + .ss-results { margin-top: -${dm(3)}; }
  .cx [data-view="browse"] .ss-hybrid--flush { border-top: none; }
  /* each tab is its label + an equal share of what's left — My schedule (with its counter) gets the room it needs, Book and Calendar don't need more (user, 2026-10-29) */
  .cx .ss__main > .ss-sections--top .tab { flex: 1 1 auto; padding-inline: ${dm(2)}; }
  /* Calendar is a section on a phone too (user, 2026-10-29): the month with
     dots; a day opens its events in the bottom SlideOverPanel */
  .cx .ss-tab--wide { display: inline-flex; }
  /* Search: a button before Department; open, the field takes its own full
     row above Department and sort (the title stays) */
  .cx #ss-browse-head { grid-template-columns: minmax(0, 1fr); }
  .cx #ss-browse-head.is-search-open .ss-title { display: flex; }
  .cx .ss-filters { flex-wrap: wrap; }
  .cx .ss-filters .ss-dept-select { flex: 1 1 0; max-width: ${dm(60)}; }

  .cx .ss-filters > .search { display: none; }
  /* open, the field takes the whole row — over Department, not pushing it down (user, 2026-10-29) */
  .cx .ss-view:has(#ss-browse-head.is-search-open) .ss-filters > .search { display: flex; flex: 1 1 100%; order: -1; }
  .cx .ss-view:has(#ss-browse-head.is-search-open) .ss-filters > .ss-dept-select { display: none; }
  /* pagination: "Showing" and the pages centred, stacked */
  .cx .ss-pager { flex-direction: column; justify-content: center; }
  .cx .ss-view:has(#ss-browse-head.is-search-open) .ss-filters .search__clear { display: inline-flex; }
  .cx .ss-view:has(#ss-browse-head.is-search-open) .ss-filters > .ss-search-open { display: none; }
  /* full-screen nav needs no scrim; a dark one turned iOS Safari's bar dark */
  .has-nav-open .sidebar-scrim { background: transparent; }
}
${SIDEBAR_CSS}`;
};
// Department is a Select in v7, not a dropdown Chip (user, 2026-10-29), base
// at every width — on a phone too, beside the base search button.
// Same id / label id, so the browse script drives it unchanged.
const DEPT_SELECT = `<button class="select is-placeholder ss-dept-select" id="ss-dept-chip" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="ss-dept-name ss-dept-label"><span class="select__stack"><span class="select__label" id="ss-dept-name">Department</span><span class="select__value" id="ss-dept-label">Department</span></span>${icon("expand_more", "select__chevron")}</button>`;
const markupV7 = () => {
  let m = markupV6();
  if (!m.includes(DEPT_CHIP)) throw new Error("v7: markup drifted — update DEPT_CHIP");
  m = m.replace(DEPT_CHIP, DEPT_SELECT);
  // no sort in v7 (user, 2026-10-29): A–Z only — Type is already the tabs, and
  // a start time means something different for each kind of service
  if (!m.includes(SORT_BTN)) throw new Error("v7: markup drifted — update SORT_BTN");
  m = m.replace(SORT_BTN, "");
  // My schedule (user, 2026-10-29): the Type is a Select beside the title (on a
  // phone, the controls row) — Book's Department — and Upcoming / Past become
  // the underline Tabs on the list, where Book has its type Tabs. Not three
  // rows of tabs (section → Upcoming/Past → type) on a phone.
  const segAt = m.indexOf('<div class="tabs--segmented" id="ss-appt-tabs"'), segEnd = m.indexOf("</div>", segAt) + "</div>".length;
  const headAt = m.lastIndexOf('<div class="ss-head">', segAt);
  const typeTabsMy = typeTabs("ss-sched-type");
  if (segAt < 0 || headAt < 0 || !m.slice(headAt, segAt).includes("My schedule") || !m.includes(typeTabsMy)) throw new Error("v7: markup drifted — My schedule's tabs");
  const schedHead = m.slice(headAt, segAt).trimEnd();
  const whenTabs = m.slice(segAt, segEnd)
    .replace('class="tabs--segmented" id="ss-appt-tabs" role="tablist" aria-label="Appointments" style="align-self:flex-start"', 'class="tabs--underline ss-type-tabs" id="ss-appt-tabs" role="tablist" aria-label="When"')
    .replaceAll("tab tab--sm", "tab tab--base");
  m = m.slice(0, headAt) + `<div class="ss-sched-top">
      ${schedHead}
        <button class="select ss-type-pick" id="ss-sched-type-pick" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Type"><span class="select__value" id="ss-sched-type-value">All types</span>${icon("expand_more", "select__chevron")}</button>
      </div>
      ${whenTabs}` + m.slice(segEnd);
  m = m.replace(typeTabsMy, "");
  const tabsAt = m.indexOf(V7_TABS), navEnd = m.indexOf("</nav>", tabsAt) + "</nav>".length;
  const topEnd = m.indexOf("</header>");
  if (tabsAt < 0 || topEnd < 0 || topEnd > tabsAt || !m.includes(V7_APP_END) || !m.startsWith('<div class="app">')) throw new Error("v7: markup drifted — update V7_TABS / V7_APP_END");
  const nav = m.slice(tabsAt, navEnd).replace("ss-sections--seg ss-sections--center", "ss-sections--top");
  m = m.slice(0, tabsAt) + m.slice(navEnd);
  // the section Tabs go between the title and the settings button
  const settingsAt = m.lastIndexOf('<button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">', m.indexOf("</header>"));
  m = m.slice(0, settingsAt) + nav + "\n    " + m.slice(settingsAt);
  return m
    .replace('<header class="app__topbar">', `<header class="app__topbar">\n    ${SIDEBAR_MENU_BUTTON("btn btn--secondary btn--base btn--icon-only")}`)
    .replace('<div class="app">', `<div class="cx has-sidebar">\n  ${sidebarHtml({ nav: CX_NAV, active: "advisor-scheduling", user: CX_USER, id: "cx", theme: "neutral" })}\n  <div class="sidebar-scrim"></div>\n<div class="app cx__main">`)
    .replace(V7_APP_END, "</div>\n" + V7_APP_END);
};
// Sidebar links lead outside the prototype: say so instead of jumping to "#".
// Phone: the section Tabs live at the top of the page, not in the topbar.
const V7_JS = `(function () {
  var nav = document.querySelector(".ss-sections--top"), bar = document.querySelector(".app__topbar"), main = document.querySelector(".ss__main");
  var settings = bar.lastElementChild, phone = window.matchMedia("(max-width: 767px)");
  var dept = document.getElementById("ss-dept-chip"), filters = dept.parentNode;
  var openBtn = document.getElementById("ss-search-open"), searchBox = document.getElementById("ss-search"), headRow = document.getElementById("ss-head-row");
  function place() {
    if (phone.matches) main.insertBefore(nav, main.firstChild); else bar.insertBefore(nav, settings);
    // section Tabs: sm on a phone (a 40 track in the page), base in the topbar —
    // sm up there got lost (user, 2026-10-29)
    nav.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("tab--sm", phone.matches); t.classList.toggle("tab--base", !phone.matches); });
    // phone: the search button (base, like the Select) and the field it opens sit
    // in the filter row, before Department — where Search is from 768
    if (phone.matches) { filters.insertBefore(searchBox, dept); filters.insertBefore(openBtn, searchBox); }
    else headRow.appendChild(openBtn);
  }
  phone.addEventListener("change", place); place();
})();
document.querySelector(".sidebar").addEventListener("click", function (e) {
  var a = e.target.closest("[data-nav], .sidebar__logo, .sidebar__account");
  if (!a) return;
  e.preventDefault();
  if (a.getAttribute("aria-current") === "page") return;
  window.showToast({ role: "info", text: "Prototype \\u2014 this page isn\\u2019t designed yet" });
});
${SIDEBAR_JS}`;

const appHtmlFor = (layout) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1${layout === "v7" ? ", viewport-fit=cover" : ""}" />
${layout === "v7" ? `<meta name="theme-color" content="${(() => { const v = resolve("surface.page"); return typeof v === "string" ? v : v.hex; })()}" />\n` : ""}<title>Scheduling</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}${layout === "v7" ? hoverGuard(v7Css()) : ""}
</style>
</head>
<body>
${layout === "v7" ? markupV7() : layout === "v6" ? markupV6() : markupFor(layout)}
<script>
${TOAST_JS}
${ssAppJs({ ...DATA, ICONS, LAYOUT: layout === "v6" || layout === "v7" ? "text" : layout, V6: layout === "v6" || layout === "v7" })}
${layout === "v7" ? V7_JS : ""}
</script>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "student-scheduling",
  title: "Student Scheduling",
  heading: "Student Scheduling",
  sub: `The student side of Scheduling — browse services, pick a time, confirm. Same flow and content as the live app, rebuilt strictly from hp-design components. <b>What changed is the UI, not the flow:</b> sort is a ghost Button + Listbox on the results line instead of a third filter-looking dropdown; "Drop-in available" is a toggle Chip that clears itself (no separate Clear button); Department is the dropdown chip. <b>v7 (current)</b> is v6 as a page of the CX app: the gray Sidebar with Advisor → Scheduling selected, and Book / My schedule / Calendar as the DS segmented Tabs as they ship — their own rounded track, centred in the topbar (on a phone, in a second topbar row) — instead of a track stretched into a gray band. <b>v6</b> folds the live app's six tabs into <b>Book</b>, <b>My schedule</b> and (from 768) <b>Calendar</b>, centred in the top bar. Book is one catalogue of appointments (Pick a time), drop-in desks (Join queue while open, Reserve a seat before it opens) and workshops (Register), with Department and sort on one row and the kind as underline Tabs (All / Appointments / Drop-ins / Workshops) under it. A workshop page lists every schedule as a ChoiceTile (no carousel), the chosen schedule's sessions, and a sticky registration card — on a phone, Register sits in a bar at the bottom. Every booking ends on one success screen. Try <b>Resume Writing Workshop</b> (three schedules, one full), <b>Interview Prep</b> (pick one date) and <b>Time Management Essentials</b> (full). <b>My schedule</b> is Upcoming / Past (Done, Missed and Cancelled as neutral badges in Past): appointments plus each workshop's next session. A registered workshop opens its own page — progress (sessions done, attended), the next session with check-in and Can't make it, what's coming up, past sessions as an Accordion with attendance and the organizer's note and files, materials, and Leave workshop behind an AlertDialog. Try <b>First-Year Success Seminar</b> (in progress) and, under Past, <b>Library Research Basics</b> (finished). <b>Drop-ins</b>: Join queue / Reserve a seat in Book opens the desk's page first — who's waiting (or when it opens), the optional "What would you like help with?" Select and a note — and you commit with the button there; then the queue page — your place and wait with a Progress bar, Step away / I'm back, Leave queue (AlertDialog). The prototype's clock is frozen, so the line moves on its own (one student every 4 seconds): the advisor calls you (success Alert, "I'm on my way"), the meeting starts, and it ends with the advisor's summary and a three-chip rating. While you're in line or holding a seat, every other screen shows a banner at the top. Reserve a seat holds your place before the desk opens. A past drop-in with a summary and attachment: <b>Writing Center</b> under Past. <b>Calendar</b> (third top-nav section, from 768 — hidden on a phone): a month on DatePicker's day recipe — dots per event on a phone, time + title chips from 768, coloured like each kind's Badge (appointment violet, drop-in blue, workshop teal) — with every workshop session, not just the next; the chosen day's rows sit in a card to the right on desktop and open in a bottom SlideOverPanel on a tablet. <b>v5</b> is cards on a phone and list rows from 768px: the 16px service name, the departments that offer it as plain comma-separated text right under it, then duration and the booking-mode Badge (base, regular weight; Appointment in violet), then Pick a time in the Button <b>tint</b> variant. The department is chosen on the pick-a-time page — pre-set when the browse filter already named one. <b>v1</b> wears the same shell but picks the department in the list: a Select in the row when several departments offer the service, an outline Badge when only one does, and Pick a time in Button secondary. Picking a time is one page — day and time ChoiceTiles on the left, a sticky <b>Your appointment</b> Card on the right with the advisor RadioGroup and the one Confirm — instead of a time popup followed by a side drawer. Try <b>Academic Difficulty</b> for the no-openings state, <b>Career Counseling</b> or <b>Degree Planning</b> for a service offered by several departments. <b>Appointments</b> is built too: Upcoming (with a count) / Past / Cancelled as segmented Tabs, rows grouped by day, check-in that opens 15 minutes ahead (the 10:30 one today is open — the prototype's clock is 10:20 AM), a details page with the advisor's questions in a Modal, Reschedule back into pick-a-time, and Cancel behind an AlertDialog. Booking on Browse lands in Upcoming. Drop-Ins, Workshops, Reserve a Seat and Calendar are placeholders.`,
  versions: [
    { label: "v7", note: "in the CX app · gray sidebar · current", file: "student-scheduling-v7-app.html" },
    { label: "v6", note: "Book + My schedule · workshops", file: "student-scheduling-v6-app.html" },
    { label: "v5", note: "departments as text", file: "student-scheduling-app.html" },
    { label: "v1", note: "department picked in the list", file: "student-scheduling-v1-app.html" },
  ],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-app.html"), appHtmlFor("text"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-v1-app.html"), appHtmlFor("list"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-v6-app.html"), appHtmlFor("v6"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-v7-app.html"), appHtmlFor("v7"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling.html"), viewerHtml);
console.log("wrote docs/designs/student-scheduling-app.html (v5, departments as text)");
console.log("wrote docs/designs/student-scheduling-v1-app.html (v1, list)");
console.log("wrote docs/designs/student-scheduling-v6-app.html (v6, Book + My schedule)");
console.log("wrote docs/designs/student-scheduling.html");
