// Regenerates docs/accordion.html from tokens/components/accordion.tokens.json.
// Expandable disclosure rows on a real <details>/<summary> — the whole Degree
// Requirements tab of the Explore Degrees results is these.
// Run: node tools/build-accordion-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { STATUS_ICON_CSS, STATUS_ICON_COLOR_PATHS, statusIcon } from "./lib/status-icon.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const colorPrim = load("tokens/primitives/color.tokens.json").color;
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const radiusPrim = load("tokens/primitives/radius.tokens.json").radius;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const acc = load("tokens/components/accordion.tokens.json").component.accordion;
const card = load("tokens/components/card.tokens.json").component.card;
const badge = load("tokens/components/badge.tokens.json").component.badge;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

const it = acc.item;
const paddingX = px(resolve(it.paddingX.$value));
const paddingY = px(resolve(it.paddingY.$value));
const gap = px(resolve(it.gap.$value));
const dividerRole = refPath(it.divider.$value);
const titleType = resolveToken(acc.title);
const metaType = resolveToken(acc.meta);
const titleQuietType = resolveToken(acc.titleQuiet);
const chevronSize = px(resolve(acc.chevron.size.$value));
const bodyPad = px(resolve(acc.body.paddingBottom.$value));
const bodyGap = px(resolve(acc.body.gap.$value));
const hoverRole = refPath(acc.state.hover.bg.$value);
const ringRole = refPath(acc.state.focused.ringColor.$value);
const ringWidth = px(resolve(acc.state.focused.ringWidth.$value));

// Card wraps the rows; Badge carries the group count and the "covered by" chip
const cardBg = refPath(card.bg.$value), cardBorder = refPath(card.border.$value);
const cardRadius = px(resolve(card.radius.$value)), cardPadding = px(resolve(card.padding.$value));
const cardTitle = resolveToken(card.title);
const pill = { bg: refPath(badge.role.neutral.tint.bg.$value), text: refPath(badge.role.neutral.tint.text.$value) };
const okPill = { bg: refPath(badge.role.success.tint.bg.$value), text: refPath(badge.role.success.tint.text.$value) };
const badgeSm = { height: px(resolve(badge.size.sm.height.$value)), paddingX: px(resolve(badge.size.sm.paddingX.$value)), radius: px(resolve(badge.radius.$value)), label: resolveToken(badge.size.sm.label) };

const colorPaths = [...new Set([
  dividerRole, refPath(acc.titleColor.$value), refPath(acc.metaColor.$value), refPath(acc.chevron.color.$value),
  hoverRole, ringRole, cardBg, cardBorder, refPath(card.titleColor.$value),
  pill.bg, pill.text, okPill.bg, okPill.text, "text.secondary", "text.default",
  refPath(acc.chevron.colorPrimary.$value), refPath(acc.index.color.$value),
  ...STATUS_ICON_COLOR_PATHS,
])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const labelSm = resolveToken(get("text-style.label-sm"));
const labelSmTransform = (get("text-style.label-sm").$extensions || {})["hp.design/text"]?.textTransform || "none";
const bodySm = resolveToken(get("text-style.body-sm"));

const css = `${rootVars}

/* A real <details>/<summary>: open/close, keyboard and find-in-page all work
   with zero JS — same native-first rule Tooltip/Popover/Modal follow. */
.accordion { display: block; font-family: ${cv("family.sans")}; }
.accordion__item { border-bottom: 1px solid ${cv(dividerRole)}; }
.accordion__item:last-child { border-bottom: none; }
.accordion__summary { list-style: none; display: flex; align-items: center; gap: ${gap}; padding: ${paddingY} ${paddingX}; cursor: pointer; }
.accordion__summary::-webkit-details-marker { display: none; }
.accordion__summary:hover { background: ${cv(hoverRole)}; }
/* A row with nothing to expand. Same metrics, so it lines up with the rows
   around it, but no chevron, no pointer and no hover — a disclosure control
   that opens an empty region is a lie, and this list has rows that genuinely
   have nothing underneath (a requirement the student has not chosen classes
   for yet: the options are a whole catalogue, not a list this row can hold). */
.accordion__row { display: flex; align-items: center; gap: ${gap}; padding: ${paddingY} ${paddingX}; }
.accordion__summary:focus-visible { outline: ${ringWidth} solid ${cv(ringRole)}; outline-offset: calc(-1 * ${ringWidth}); }
/* two optional slots around the title: leading (StatusIcon, a number…) and
   trailing (meta label, Badge…) — content, not Accordion variants */
.accordion__leading, .accordion__trailing { flex-shrink: 0; display: flex; align-items: center; gap: ${px(resolve(acc.slot.gap.$value))}; }
/* a number in the leading slot — ordered rows (restriction lines, steps) */
.accordion__index { flex-shrink: 0; color: ${cv(refPath(acc.index.color.$value))}; ${typoCss(resolveToken(acc.index.label))} font-variant-numeric: tabular-nums; }
.accordion__title { flex: 1; min-width: 0; color: ${cv(refPath(acc.titleColor.$value))}; ${typoCss(titleType)} }
/* Rows inside a group that already has a heading: same size, normal weight, so
   the Card title stays the heading and the rows read as its contents. */
.accordion__title--quiet { ${typoCss(titleQuietType)} }
.accordion__meta { flex-shrink: 0; color: ${cv(refPath(acc.metaColor.$value))}; ${typoCss(metaType)} }
.accordion__chevron { flex-shrink: 0; width: ${chevronSize}; height: ${chevronSize}; color: ${cv(refPath(acc.chevron.color.$value))}; transition: transform 0.12s ease; }
.accordion__item[open] > .accordion__summary .accordion__chevron { transform: rotate(180deg); }
/* chevron before everything else in the row (it is the summary's last child) */
.accordion--chevron-start .accordion__chevron { order: -1; }
.accordion--chevron-primary .accordion__chevron { color: ${cv(refPath(acc.chevron.colorPrimary.$value))}; }
.accordion__body { display: flex; flex-direction: column; gap: ${bodyGap}; padding: 0 ${paddingX} ${bodyPad}; }`;

const demoCss = `
.acc-card { background: ${cv(cardBg)}; border: 1px solid ${cv(cardBorder)}; border-radius: ${cardRadius}; overflow: hidden; }
.acc-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: ${cardPadding}; border-bottom: 1px solid ${cv(cardBorder)}; }
.acc-card__title { color: ${cv(refPath(card.titleColor.$value))}; ${typoCss(cardTitle)} font-family: ${cv("family.sans")}; }
.badge { display: inline-flex; align-items: center; border-radius: ${badgeSm.radius}; height: ${badgeSm.height}; padding: 0 ${badgeSm.paddingX}; ${typoCss(badgeSm.label)} font-family: ${cv("family.sans")}; background: ${cv(pill.bg)}; color: ${cv(pill.text)}; }
.badge--success { background: ${cv(okPill.bg)}; color: ${cv(okPill.text)}; }
${STATUS_ICON_CSS}
.acc-sub { color: ${cv("text.secondary")}; ${typoCss(bodySm)} }
.acc-eyebrow { color: ${cv("text.secondary")}; ${typoCss(labelSm)} text-transform: ${labelSmTransform}; letter-spacing: ${labelSm.letterSpacing}; }
.acc-course { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: ${cv("text.default")}; ${typoCss(bodySm)} }
.acc-course b { font-weight: ${titleType.fontWeight}; }
`;

const icon = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconChevron = icon("expand_more", "accordion__chevron");
const leading = (status, index) => (status || index ? `<span class="accordion__leading">${index ? `<span class="accordion__index">${index}</span>` : ""}${status ? statusIcon(status) : ""}</span>` : "");
const trailing = (meta, badge) => (meta || badge ? `<span class="accordion__trailing">${meta ? `<span class="accordion__meta">${esc(meta)}</span>` : ""}${badge || ""}</span>` : "");

function item({ title, meta = "", status = null, body = "", open = false, quiet = false, name = "", index = "", badge = "" }) {
  return `  <details class="accordion__item"${name ? ` name="${name}"` : ""}${open ? " open" : ""}>
    <summary class="accordion__summary">
      ${leading(status, index)}
      <span class="accordion__title${quiet ? " accordion__title--quiet" : ""}">${esc(title)}</span>
      ${trailing(meta, badge)}
      ${iconChevron}
    </summary>
    <div class="accordion__body">${body}</div>
  </details>`;
}
function row({ title, meta = "", status = null, quiet = false }) {
  return `  <div class="accordion__item">
    <div class="accordion__row">
      ${leading(status)}
      <span class="accordion__title${quiet ? " accordion__title--quiet" : ""}">${esc(title)}</span>
      ${trailing(meta)}
    </div>
  </div>`;
}
const group = (items, mod = "") => `<div class="accordion${mod ? ` ${mod}` : ""}">\n${items.join("\n")}\n</div>`;

const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const requirementBody = `<span class="acc-sub">Life Science</span>
      <span class="acc-eyebrow">Classes that count toward this</span>
      <span class="acc-course"><b>BIOLOGY 100</b> General Biology I · 3.5 units <span class="badge badge--success">Covered by your credit from Long Beach City College</span></span>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Accordion</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root { --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa; --border: #e4e3df; --border-strong: #d2d1cb; --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87; --accent: #0468c4; --accent-bg: #eff6ff; --code-bg: #1e1e22; --code-text: #e4e3df; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; --sans: -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
  * { box-sizing: border-box; } body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); } .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; max-width: 78ch; line-height: 1.6; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 130px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("accordion")}</nav>
  <main>
    <h1>Accordion</h1>
    <p class="sub">tokens/components/accordion.tokens.json · generated — expandable disclosure rows on a real <code class="tok">&lt;details&gt;</code>/<code class="tok">&lt;summary&gt;</code>. Optional leading status icon, optional trailing state label, a chevron that flips when open. Every row here is genuinely interactive on this page — no forced states needed.</p>

    <div class="legend">
      <div class="row"><b>Native</b><span>A real <code class="tok">&lt;details&gt;</code>: open/close, keyboard operation and find-in-page work with <b>zero JS</b> — the same native-first rule Tooltip (pure CSS), Popover (Popover API) and Modal/SlideOverPanel (<code class="tok">&lt;dialog&gt;</code>) already follow.</span></div>
      <div class="row"><b>Rows, not boxes</b><span>An accordion is a <b>flush divided list</b>; the consumer wraps it in a Card if it needs an edge. Deliberate: the reference design stacks bordered boxes and it reads as a pile — the same content as divided rows reads as a list.</span></div>
      <div class="row"><b>Slots, not variants</b><span>Two optional slots around the title: <code class="tok">.accordion__leading</code> and <code class="tok">.accordion__trailing</code>. Whatever the product needs goes in them — a <a href="status-icon.html">StatusIcon</a> or a number before, a meta label or a Badge after. They are content, not kinds of Accordion: the component itself only knows rows, open / closed, single / multiple and where its chevron sits.</span></div>
      <div class="row"><b>Hover</b><span>The summary rests on a white surface, so it takes the wash tier <code class="tok">fill.neutralHover</code> (gray.100), not the Strong pair. See the two-tier rule in status.md.</span></div>
      <div class="row"><b>Rows that don't open</b><span>A row with nothing underneath uses <code class="tok">.accordion__row</code> — same metrics, no chevron, no hover, no pointer. A chevron that opens an empty region is a lie, and real lists mix the two: a requirement covered by a named class expands to show it, one the student has not picked classes for yet has nothing to show.</span></div>
      <div class="row"><b>Single / multiple</b><span>Give every <code class="tok">&lt;details&gt;</code> in a group the same <code class="tok">name</code> and the browser keeps only one open — still zero JS. Without it any number can be open (the default).</span></div>
      <div class="row"><b>Chevron</b><span>At the end by default; <code class="tok">.accordion--chevron-start</code> puts it first. Quiet <code class="tok">icon.muted</code> by default; <code class="tok">.accordion--chevron-primary</code> paints it <code class="tok">icon.primary</code>.</span></div>
      <div class="row"><b>Numbers</b><span><code class="tok">.accordion__index</code> styles a number in the leading slot — <code class="tok">body-base</code>, <code class="tok">text.secondary</code>, tabular figures.</span></div>
      <div class="row"><b>One row</b><span>A single section that opens under its heading (“Advanced options”) is an Accordion with one row. A small “Show details” / “Show all 8” button that opens a block is a <a href="collapsible.html">Collapsible</a>.</span></div>
      <div class="row"><b>Deferred</b><span>A nested second level.</span></div>
    </div>

    <h2 class="big-section">Variants</h2>
    <p class="section-desc">The same set as the product Storybook, in this system's styles: hairline-divided rows, quiet chevron, wash hover. Wrapped in a Card here only to give each list an edge.</p>
    <div class="story-grid">
      ${storyCard("Single", `<div class="acc-card">${group([
        item({ title: "Product information", body: `<span class="acc-sub">Our flagship product combines cutting-edge technology with a clean design. Key features include fast processing and an interface built for beginners and experts alike.</span>`, open: true, name: "faq-single" }),
        item({ title: "Shipping details", body: `<span class="acc-sub">Orders ship within two business days. Tracking is emailed as soon as the parcel leaves the warehouse.</span>`, name: "faq-single" }),
        item({ title: "Return policy", body: `<span class="acc-sub">Return anything within 30 days for a full refund — no questions asked.</span>`, name: "faq-single" }),
      ])}</div>`, "Every row shares name=\"faq-single\": opening one closes the open one. The open row can still be closed.")}
      ${storyCard("Multiple", `<div class="acc-card">${group([
        item({ title: "Product information", body: `<span class="acc-sub">Our flagship product combines cutting-edge technology with a clean design. Key features include fast processing and an interface built for beginners and experts alike.</span>`, open: true }),
        item({ title: "Shipping details", body: `<span class="acc-sub">Orders ship within two business days. Tracking is emailed as soon as the parcel leaves the warehouse.</span>` }),
        item({ title: "Return policy", body: `<span class="acc-sub">Return anything within 30 days for a full refund — no questions asked.</span>` }),
      ])}</div>`, "No name — any number of rows open at once. The default.")}
      ${storyCard("Chevron start", `<div class="acc-card">${group([
        item({ title: "Product information", body: `<span class="acc-sub">Our flagship product combines cutting-edge technology with a clean design. Key features include fast processing and an interface built for beginners and experts alike.</span>` }),
        item({ title: "Shipping details", body: `<span class="acc-sub">Orders ship within two business days. Tracking is emailed as soon as the parcel leaves the warehouse.</span>` }),
        item({ title: "Return policy", body: `<span class="acc-sub">Return anything within 30 days for a full refund — no questions asked.</span>` }),
      ], "accordion--chevron-start")}</div>`, ".accordion--chevron-start — chevron before the title.")}
      ${storyCard("Primary chevron", `<div class="acc-card">${group([
        item({ title: "Product information", body: `<span class="acc-sub">Our flagship product combines cutting-edge technology with a clean design. Key features include fast processing and an interface built for beginners and experts alike.</span>` }),
        item({ title: "Shipping details", body: `<span class="acc-sub">Orders ship within two business days. Tracking is emailed as soon as the parcel leaves the warehouse.</span>` }),
        item({ title: "Return policy", body: `<span class="acc-sub">Return anything within 30 days for a full refund — no questions asked.</span>` }),
      ], "accordion--chevron-primary")}</div>`, ".accordion--chevron-primary — chevron in icon.primary, for a list whose rows should read as openable at a glance.")}
      ${storyCard("With icon", `<div class="acc-card">${group([
        item({ index: "1", status: "error", title: "Unnamed restriction line", body: `<span class="acc-sub">This line has no name yet — give it one before saving.</span>` }),
        item({ index: "2", status: "done", title: "Freshmen only", body: `<span class="acc-sub">Class standing: Freshman.</span>` }),
        item({ index: "3", status: "todo", title: "Majors only", body: `<span class="acc-sub">Not checked yet.</span>` }),
      ])}</div>`, "Leading slot: a number + a StatusIcon (error, done, to do).")}
      ${storyCard("Trailing slot", `<div class="acc-card">${group([
        item({ title: "Tue, Oct 14 · Study skills workshop", badge: `<span class="badge badge--success">Attended</span>`, body: `<span class="acc-sub">From the organizer: slides are attached.</span>` }),
        item({ title: "Tue, Oct 7 · Study skills workshop", badge: `<span class="badge">Missed</span>`, body: `<span class="acc-sub">No notes for this session.</span>` }),
      ])}</div>`, "Trailing slot: a Badge — the Scheduling workshop sessions.")}
    </div>

    <h2 class="big-section">Rows</h2>
    <div class="story-grid">
      ${storyCard("Plain", group([
        item({ title: "Free Electives", body: `<span class="acc-sub">Anything not applied elsewhere counts here.</span>` }),
        item({ title: "Psych 100 Level Elective", body: `<span class="acc-sub">Any 100-level psychology course.</span>` }),
      ]), "No status, no meta — the minimal shape.")}
      ${storyCard("Quiet titles, and rows that do not open", group([
        row({ title: "Physical Science", meta: "3 units", quiet: true }),
        row({ title: "Lab Requirements", meta: "1 unit", quiet: true }),
        item({ title: "Life Science", meta: "3.5 units", quiet: true, body: requirementBody }),
      ]), "accordion.titleQuiet — normal weight at the same size, for rows under a heading that is already bold (compare the bold rows beside this). The first two are .accordion__row: nothing to disclose, so no chevron and no hover.")}
      ${storyCard("Status and state label", group([
        item({ title: "Social Science Courses", status: "done", meta: "Covered", body: `<span class="acc-sub">Satisfied by your transferred credit.</span>` }),
        item({ title: "Physical Science", status: "todo", meta: "Still to do", body: `<span class="acc-sub">No class applied to this yet.</span>` }),
      ]), "check + status.success for covered, an empty circle + icon.muted for outstanding.")}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">A requirement group from the Explore Degrees results: Card header with the group name and a Badge count, then the rows. Only the second one opens — it is the only one with a class matched to it. The others carry their state in the icon and the label and have nothing underneath, so they are plain rows.</p>
    <div class="story-grid">
      ${storyCard("Requirement group", `<div class="acc-card">
        <div class="acc-card__head"><span class="acc-card__title">LAU GE Distribution</span><span class="badge">2 of 6 covered</span></div>
        ${group([
          row({ title: "Social Science Courses", status: "done", meta: "Covered", quiet: true }),
          item({ title: "Life Science", status: "done", meta: "Covered", open: true, quiet: true, body: requirementBody }),
          row({ title: "Physical Science", status: "todo", meta: "Still to do", quiet: true }),
          row({ title: "Lab Requirements", status: "todo", meta: "Still to do", quiet: true }),
          row({ title: "LAU Math Requirement", status: "done", meta: "Covered", quiet: true }),
        ])}
      </div>`, "", true)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/accordion.html"), html);
console.log("wrote docs/accordion.html");
