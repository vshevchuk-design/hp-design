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
//   · date in one surface, advisor + Confirm in a side Drawer → one page: day
//     and time ChoiceTiles on the left, a sticky "Your appointment" Card on the
//     right with the advisor RadioGroup and the one primary action.
// Workflow: designed here first, carried into Figma once it settles.
//
// Split like Explore Degrees: lib/ss-data.mjs (fixtures), lib/ss-css.mjs
// (recipes + ss-* layer), lib/ss-app.mjs (client script); markup lives here.
// Run: node tools/build-design-student-scheduling.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { SHELL_TOPBAR_CSS, SHELL_COLOR_PATHS, shellTopbar } from "./lib/app-shell.mjs";
import { ssCss, SS_COLOR_PATHS } from "./lib/ss-css.mjs";
import { ssAppJs } from "./lib/ss-app.mjs";
import { hoverGuard } from "./lib/hover-guard.mjs";
import * as DATA from "./lib/ss-data.mjs";

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

const COMPONENTS = ["tabs", "button", "select", "search", "chip", "listbox", "card", "badge", "pagination", "choice-tile", "radio", "alert", "toast", "tooltip", "empty-state"];
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

const colorPaths = [...new Set([...SHELL_COLOR_PATHS, ...SS_COLOR_PATHS, ...componentColorPaths])];
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

// v5's section bar: segmented sm Tabs instead of underline.
const sectionsSeg = DATA.SECTIONS.map(
  (s, i) => `<button class="tab tab--sm${i === 0 ? " tab--active" : ""}" type="button" role="tab" aria-selected="${i === 0}">${s}</button>`
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
          <button class="chip chip--dropdown" id="ss-dept-chip" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="chip__label" id="ss-dept-label">Department</span>${chevronDown}</button>
          <button class="chip" id="ss-drop-chip" type="button" aria-pressed="false">Drop-in available</button>
        </div>
      </div>

      <div class="ss-results" id="ss-results">
        <div class="ss-results__bar">
          <button class="btn btn--ghost btn--sm" id="ss-sort" type="button" aria-haspopup="listbox" aria-expanded="false">${icon("sort", "btn__icon")}<span id="ss-sort-label">Name (A–Z)</span></button>
        </div>
        <div class="card ss-list" id="ss-list"></div>
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
      <div class="ss-pick">
        <div class="ss-choose">
          <button class="select ss-pick-dept is-hidden" id="ss-pick-dept" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="select__stack"><span class="select__label">Department</span><span class="select__value" id="ss-pick-dept-value"></span></span>${icon("expand_more", "select__chevron")}</button>
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
          <div class="card__head"><h3 class="card__title">Your appointment</h3></div>
          <div class="card__body">
            <dl class="ss-facts">
              <dt>Service</dt><dd id="ss-sum-service"></dd>
              <dt>Department</dt><dd id="ss-sum-dept"></dd>
              <dt>When</dt><dd id="ss-sum-when" class="is-empty"></dd>
              <dt>Duration</dt><dd id="ss-sum-duration"></dd>
            </dl>
            <div class="ss-rule"></div>
            <p class="ss-note" id="ss-advisor-hint">Pick a time to see which advisors are free.</p>
            <fieldset class="radio-group is-hidden" id="ss-advisor-group">
              <legend class="radio-group__label">Advisor</legend>
              <div class="radio-group__items" id="ss-advisors"></div>
            </fieldset>
            <div class="ss-rule"></div>
            <div class="ss-loc">
              <span class="ss-eyebrow">Location</span>
              <p class="ss-loc__text" id="ss-sum-location"></p>
              <p class="ss-note" id="ss-sum-formats"></p>
            </div>
          </div>
          <div class="card__foot">
            <button class="btn btn--primary btn--base btn--block" id="ss-confirm" type="button" disabled>Confirm appointment</button>
          </div>
        </aside>
      </div>
    </section>

    <!-- ============ other sections (not designed yet) ============ -->
    <section class="ss-view" data-view="placeholder">
      <div class="empty-state"><span class="empty-state__text" id="ss-placeholder-text"></span></div>
    </section>
  </main>
</div>
<div class="listbox" id="ss-lb" popover role="listbox"><div class="listbox__list"></div></div>`;

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
const markupFor = (layout) => {
  if (layout === "list") return markup;
  let m = markup.replace('class="card ss-list" id="ss-list"', layout === "text" ? 'class="ss-hybrid ss-hybrid--flush" id="ss-list"' : 'class="ss-hybrid" id="ss-list"');
  if (layout === "text") m = m.replace(UNDERLINE_NAV, SEGMENTED_NAV);
  return m;
};

// Three layouts of the same app, all kept buildable rather than frozen as
// copies: v5 (departments as text under the name) is current, v4 (departments
// as outline badges inline) and v1 (the original list) stay comparable in the
// viewer's Versions dropdown. Only the browse container and the client
// script's item template differ. (v2/v3 — card grids — were dropped.)
const appHtmlFor = (layout) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Scheduling</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
${markupFor(layout)}
<script>
${ssAppJs({ ...DATA, ICONS, LAYOUT: layout })}
</script>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "student-scheduling",
  title: "Student Scheduling",
  heading: "Student Scheduling",
  sub: `The student side of Scheduling — browse services, pick a time, confirm. Same flow and content as the live app, rebuilt strictly from hp-design components. <b>What changed is the UI, not the flow:</b> sort is a ghost Button + Listbox on the results line instead of a third filter-looking dropdown; "Drop-in available" is a toggle Chip that clears itself (no separate Clear button); Department is the dropdown chip. <b>v5 (current)</b> is cards on a phone and list rows from 768px: the 16px service name, the departments that offer it as plain comma-separated text right under it, then duration and the booking-mode Badge (base, regular weight; By appointment in violet), then Pick a time in the Button <b>tint</b> variant. The department is chosen on the pick-a-time page — pre-set when the browse filter already named one. <b>v4</b> is the same layout with departments as outline Badges inline after the booking mode; <b>v1</b> is the original list with a per-row department Select. Picking a time is one page — day and time ChoiceTiles on the left, a sticky <b>Your appointment</b> Card on the right with the advisor RadioGroup and the one Confirm — instead of a time popup followed by a side drawer. Try <b>Academic Difficulty</b> for the no-openings state, <b>Career Counseling</b> or <b>Degree Planning</b> for a service offered by several departments. Only Browse is built; the other five sections are placeholders.`,
  versions: [
    { label: "v5", note: "departments as text · current", file: "student-scheduling-app.html" },
    { label: "v4", note: "departments as badges", file: "student-scheduling-v4-app.html" },
    { label: "v1", note: "list", file: "student-scheduling-v1-app.html" },
  ],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-app.html"), appHtmlFor("text"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-v4-app.html"), appHtmlFor("hybrid"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-v1-app.html"), appHtmlFor("list"));
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling.html"), viewerHtml);
console.log("wrote docs/designs/student-scheduling-app.html (v5, departments as text)");
console.log("wrote docs/designs/student-scheduling-v4-app.html (v4, departments as badges)");
console.log("wrote docs/designs/student-scheduling-v1-app.html (v1, list)");
console.log("wrote docs/designs/student-scheduling.html");
