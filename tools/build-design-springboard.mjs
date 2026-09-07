// Generates the Springboard entry of the Designs pane (its own product):
//   docs/designs/springboard.html      — viewer page (shared chrome from
//     tools/lib/design-viewer.mjs: device tabs + Versions dropdown + iframe).
//   docs/designs/springboard-app.html  — the prototype itself.
//
// The live Springboard (the student portal's home screen: a topbar + a grid of
// quick-link tiles + ICS/RSS/social feed cards) rebuilt on hp-design — every
// recipe resolved from its own token file, nothing retyped. Card layout follows
// the refreshed reference: quick links are compact horizontal tiles (tinted
// icon square + label) instead of big centered squares, and each feed is a Card
// with a real header (icon + title + View All) over divided content rows.
// No new components were needed: Card (+ its interactive state tokens), Button
// ghost icon-only, EmptyState, Grid's gap scale, and the `tag.*` decorative
// hues for the icon squares cover all of it. The only bespoke CSS is the `sb-*`
// composition layer (shell/topbar/grids/rows), same rule as the MC prototypes'
// `mc-*` layer.
// Run: node tools/build-design-springboard.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

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
const card = load("tokens/components/card.tokens.json").component.card;
const button = load("tokens/components/button.tokens.json").component.button;
const emptyState = load("tokens/components/empty-state.tokens.json").component.emptyState;
const grid = load("tokens/components/grid.tokens.json").component.grid;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
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
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
// text-style.*'s textTransform/textDecoration live in $extensions, which
// resolveToken() silently drops (documented trap, bitten twice) — read them
// off the referenced node directly.
const textExt = (styleRef) => (get(styleRef).$extensions || {})["hp.design/text"] || {};

// ---- Card — the feed cards AND (its interactive state tokens) the tiles ----
const cardRadius = px(resolve(card.radius.$value));
const cardPadding = px(resolve(card.padding.$value));
const cardGap = px(resolve(card.gap.$value));
const cardTitleType = resolveToken(card.title);
const cardTitleColor = refPath(card.titleColor.$value);
const cardBg = refPath(card.bg.$value);
const cardBorder = refPath(card.border.$value);
const cardDivider = refPath(card.divider.$value);
const cardIx = {
  hoverBorder: refPath(card.interactive.state.hover.border.$value),
  hoverBg: refPath(card.interactive.state.hover.bg.$value),
  pressedBg: refPath(card.interactive.state.pressed.bg.$value),
  pressedBorder: refPath(card.interactive.state.pressed.border.$value),
  ringColor: refPath(card.interactive.state.focused.ringColor.$value),
  ringWidth: px(resolve(card.interactive.state.focused.ringWidth.$value)),
  ringOffset: px(resolve(card.interactive.state.focused.ringOffset.$value)),
};

// ---- Button secondary, icon-only, base (40×40) — the topbar settings action.
// Ghost first, changed on review: with no fill at rest it read as a bare glyph
// rather than a control. The system has no outline variant (primary filled /
// secondary gray-filled / ghost transparent), so "border or gray background"
// resolves to secondary — fill.neutral at rest, its own hover/pressed/focus.
// Its icon needs an explicit colour: secondary's label (text.default) and icon
// (icon.default) are different values, so currentColor would be wrong — the
// token file's own $description says so. ----
const btnRadius = px(resolve(button.secondary.radius.$value));
const btnBase = {
  height: px(resolve(button.secondary.size.base.height.$value)),
  iconSize: px(resolve(button.secondary.size.base.iconSize.$value)),
};
const btnSm = {
  height: px(resolve(button.secondary.size.sm.height.$value)),
  paddingX: px(resolve(button.secondary.size.sm.paddingX.$value)),
  gap: px(resolve(button.secondary.size.sm.gap.$value)),
  label: resolveToken(button.secondary.size.sm.label),
};
const btnSecondary = {
  fill: refPath(button.secondary.state.default.fill.$value),
  label: refPath(button.secondary.state.default.label.$value),
  icon: refPath(button.secondary.state.default.icon.$value),
  hoverFill: refPath(button.secondary.state.hover.fill.$value),
  pressedFill: refPath(button.secondary.state.pressed.fill.$value),
  ringColor: refPath(button.secondary.state.focused.ringColor.$value),
  ringWidth: px(resolve(button.secondary.state.focused.ringWidth.$value)),
  ringOffset: px(resolve(button.secondary.state.focused.ringOffset.$value)),
};

// ---- EmptyState — the social feed has no posts ----
const es = {
  textType: resolveToken(emptyState.text),
  textColor: refPath(emptyState.textColor.$value),
  pillBg: refPath(emptyState.pill.bg.$value),
  pillRadius: px(resolve(emptyState.pill.radius.$value)),
  pillPaddingX: px(resolve(emptyState.pill.paddingX.$value)),
  pillPaddingY: px(resolve(emptyState.pill.paddingY.$value)),
  padding: px(resolve(emptyState.padding.$value)),
};

// ---- Grid — both grids use the component's own gap scale, nothing invented.
// Column count stays untokenized per Grid's own "structural, not tokenized"
// rule: the tiles are one auto-fit track list (no breakpoint literal at all),
// the feed columns need a single 1024px literal. ----
const gridGapSm = px(resolve(grid.gap.sm.$value));
const gridGapMd = px(resolve(grid.gap.md.$value));
const gridGapLg = px(resolve(grid.gap.lg.$value));

// ---- typography used by the composition layer ----
const tHeadingBase = resolveToken(get("text-style.heading-base"));
const tHeadingMd = resolveToken(get("text-style.heading-md"));
const tBodySm = resolveToken(get("text-style.body-sm"));
const tBodyXs = resolveToken(get("text-style.body-xs"));
const tLabelSm = resolveToken(get("text-style.label-sm"));
const labelSmTransform = textExt("text-style.label-sm").textTransform || "none";
const tLinkSm = resolveToken(get("text-style.link-sm"));
const linkSmDecoration = textExt("text-style.link-sm").textDecoration || "none";

// ---- content ----
// Quick links — the live five plus Explore Degrees (requested). Hue is a
// `tag.*` decorative pick, NOT a status role: these tiles mean nothing
// stateful, which is exactly the case Badge's own role-vs-color split
// reserved the tag palette for. Violet is skipped on purpose — it's the
// `ai` role's hue and would read as "AI feature" here.
const TILES = [
  { label: "SIS Login", icon: "account_balance", hue: "blue" },
  { label: "Course Catalog", icon: "menu_book", hue: "green" },
  { label: "Browse Classes", icon: "explore", hue: "teal" },
  { label: "Class Search", icon: "search", hue: "violet" },
  { label: "Explore Degrees", icon: "school", hue: "magenta" },
  { label: "Campus Map", icon: "map", hue: "amber" },
];

const EVENTS = [
  {
    month: "Sep", day: "08", title: "We the People",
    when: "09/08/26, 12:00 AM – 03/07/27, 12:00 AM",
    where: "Library (William E. Morgan Library)",
  },
  {
    month: "Sep", day: "09", title: "Virtuoso Series Concert",
    when: "09/09/26, 7:30 PM – 9:30 PM",
    where: "Organ Recital Hall",
  },
  {
    month: "Sep", day: "12", title: "Fall Career Fair",
    when: "09/12/26, 10:00 AM – 2:00 PM",
    where: "Student Center Ballroom",
  },
];

const ARTICLES = [
  {
    title: "What It Takes to Show Up and What Comes Back With You",
    excerpt:
      "Global scholarship winners share what it takes to attend Alliance and what they bring back. Written and interviewed by Casey Hickman, HEUG Marketing.",
  },
  {
    title: "They Almost Didn't Apply. Now They're Presenting, Leading, and Building Community",
    excerpt:
      "Five U.S. scholarship winners. Five different journeys. One reason it all mattered — the people they met along the way.",
  },
];

const colorPaths = [
  "surface.page", "surface.default", "border.default", "border.focus",
  "text.default", "text.secondary", "text.primary",
  "icon.default", "icon.muted", "icon.primary",
  "fill.primary", "fill.neutral", "fill.neutralHover", "fill.neutralActive", "fill.neutralHoverStrong", "fill.neutralActiveStrong",
  "bg.primary", "bg.primaryHover", "bg.neutral",
  ...[...new Set([...TILES.map((t) => t.hue), "orange", "amber", "red"])].flatMap((h) => [
    `tag.${h}.tint.bg`,
    `tag.${h}.tint.text`,
  ]),
];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

// ---- icons ----
const iconOf = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
// The wordmark's own #090D19 text fill becomes currentColor so it follows
// text.default — same swap nav.mjs does; the blue mark stays brand-fixed.
const logoSvg = fs
  .readFileSync(path.join(root, "assets/highpoint-logo.svg"), "utf8")
  .replace(/fill="#090D19"/g, 'fill="currentColor"');

const hueVars = [...new Set([...TILES.map((t) => t.hue), "orange", "amber", "red"])]
  .map((h) => `.sb-ibox--${h} { background: ${cv(`tag.${h}.tint.bg`)}; color: ${cv(`tag.${h}.tint.text`)}; }`)
  .join("\n");

const appCss = `${rootVars}

* { box-sizing: border-box; }
html, body { height: 100%; }
/* White page, not a gray one (explicit call): the system's locked-in habit is
   white surfaces separated by border.default hairlines, never a second gray
   tint for hierarchy — so the cards read against the page by their border. */
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; }

/* ---- sb-* composition layer: shell, topbar, the two grids, feed rows.
   Everything colour/type/radius/spacing comes from a token; only the grid
   track lists and the 768/1024px breakpoints are structural literals
   (Grid's own "column count isn't tokenized" rule). ---- */
.sb { min-height: 100%; display: flex; flex-direction: column; }
/* Exactly dim.16 (64px) tall, border included — everything in this system
   lands on the 4px grid, and vertical padding + a 1px border can never total
   a multiple of 4 (dim.3 + 40 + dim.3 + 1 = 65). So the height is declared
   and the hairline sits inside it (border-box), which leaves a 63px content
   band with the 40px control optically centred. Both app shells share it. */
.sb__topbar { position: sticky; top: 0; z-index: 1; height: ${px(resolve("dim.16"))}; display: flex; align-items: center; justify-content: space-between; gap: ${gridGapSm}; padding: 0 ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.sb__logo { display: flex; align-items: center; color: ${cv("text.default")}; }
.sb__logo svg { display: block; height: ${px(resolve("dim.6"))}; width: auto; }
/* max-width so the six tiles stay a readable block instead of stretching
   across a 27" monitor; centred, the usual app-shell cap. */
.sb__main { flex: 1; width: 100%; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: ${px(resolve("dim.6"))}; padding: ${px(resolve("dim.4"))}; }
@media (min-width: 768px) {
  /* dim.8 — the quick links and the feeds are two distinct blocks, so they
     get a bigger gap than Grid's lg step gives inside either one */
  .sb__main { gap: ${px(resolve("dim.8"))}; padding: ${px(resolve("dim.6"))}; }
  /* match the content padding so the wordmark lines up with the tiles */
  .sb__topbar { padding: 0 ${px(resolve("dim.6"))}; }
}

/* Quick links — the tile SHAPE changes with width, not just the track count:
   under 768 it's the launcher shape from the live app (icon above a centred
   label) so at least two fit per row on a phone; from 768 it's the reference's
   horizontal row; from 1024 that row grows (see .sb-tile--lg values below),
   since on desktop the quick links are the primary target and should outweigh
   the feed detail. */
.sb__tiles { display: grid; gap: ${gridGapSm}; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
@media (min-width: 768px) { .sb__tiles { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .sb__tiles { gap: ${gridGapMd}; } }
/* Feeds — single column until there's genuinely room for two. */
.sb__feeds { display: grid; gap: ${gridGapSm}; grid-template-columns: 1fr; align-items: start; }
@media (min-width: 1024px) { .sb__feeds { gap: ${gridGapMd}; grid-template-columns: repeat(2, 1fr); } }

/* The tinted icon square: Attachment's "icon in a soft square" pattern with
   a tag.* tint instead of a raised white square — decorative hue, no status
   meaning (Badge's role-vs-color split). Colour is set explicitly per hue on
   BOTH background and icon; never inherited through currentColor. */
.sb-ibox { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: ${cardRadius}; }
.sb-ibox--lg { width: ${px(resolve("dim.10"))}; height: ${px(resolve("dim.10"))}; }
.sb-ibox--lg svg { width: ${px(resolve("dim.6"))}; height: ${px(resolve("dim.6"))}; }
.sb-ibox--sm { width: ${px(resolve("dim.7"))}; height: ${px(resolve("dim.7"))}; }
.sb-ibox--sm svg { width: ${px(resolve("dim.4"))}; height: ${px(resolve("dim.4"))}; }
${hueVars}

/* A tile is Card's interactive variant on a real <button> — its own
   hover/pressed/focus tokens, verbatim. Mobile-first: the vertical launcher
   shape, centred. Height stays content-driven HERE on purpose: a two-word
   label wraps at narrow widths, and a declared height would clip it. Fixed
   heights are for the single-line shapes at 768+ (see below). */
.sb-tile { display: flex; flex-direction: column; align-items: center; text-align: center; gap: ${px(resolve("dim.2"))}; width: 100%; padding: ${cardPadding}; background: ${cv(cardBg)}; border: 1px solid ${cv(cardBorder)}; border-radius: ${cardRadius}; cursor: pointer; font-family: inherit; }
.sb-tile:hover { background: ${cv(cardIx.hoverBg)}; border-color: ${cv(cardIx.hoverBorder)}; }
.sb-tile:active { background: ${cv(cardIx.pressedBg)}; border-color: ${cv(cardIx.pressedBorder)}; }
.sb-tile:focus-visible { outline: ${cardIx.ringWidth} solid ${cv(cardIx.ringColor)}; outline-offset: ${cardIx.ringOffset}; }
.sb-tile__label { color: ${cv(cardTitleColor)}; ${typoCss(cardTitleType)} }
/* From 768: the reference's horizontal row. */
/* From 768 the tile is a single-line row, so its height is DECLARED rather
   than summed — padding + a 1px border can't land on the 4px grid (dim.3 twice
   plus the 40px icon plus 2px of border = 66). Same lesson as the topbar.
   64px here = dim.16, matching the topbar's own height. */
@media (min-width: 768px) {
  .sb-tile { flex-direction: row; align-items: center; text-align: left; gap: ${gridGapSm}; height: ${px(resolve("dim.16"))}; padding: 0 ${px(resolve("dim.3"))}; }
}
/* From 1024: bigger — a 48px icon square, a 16px label and Card's own dim.4
   padding, so the quick links out-weigh the (now quieter) feed rows. */
/* Desktop: 88px — bigger, still on the grid, still declared. There is no 88
   step on the dim scale (it jumps 80 → 96), so this is a composition layout
   literal, the same call the MC prototypes' 560px modal and textarea heights
   already document. 96 read as too much for a "трохи більше". */
@media (min-width: 1024px) {
  .sb-tile { gap: ${cardPadding}; height: 88px; padding: 0 ${px(resolve("dim.6"))}; }
  .sb-tile .sb-ibox--lg { width: ${px(resolve("dim.12"))}; height: ${px(resolve("dim.12"))}; }
  .sb-tile .sb-ibox--lg svg { width: ${px(resolve("dim.7"))}; height: ${px(resolve("dim.7"))}; }
  .sb-tile__label { ${typoCss(tHeadingMd)} }
}

/* Feed cards — Card with a real header band. Header/body are separate
   full-width bands with their own padding so the divider spans edge to edge
   (the row list below it is full-bleed, an inset divider would misalign).
   Every band uses dim.3, one step under Card's dim.4: a feed is the same kind
   of card as a tile, just carrying more detail — it shouldn't outweigh it. */
.card { background: ${cv(cardBg)}; border: 1px solid ${cv(cardBorder)}; border-radius: ${cardRadius}; overflow: hidden; }
.card__header { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv(cardDivider)}; }
.card__title { flex: 1; min-width: 0; margin: 0; color: ${cv(cardTitleColor)}; ${typoCss(cardTitleType)} }

/* In-card action links (View All / Read Article) — link-sm's type + the
   text.primary role. Underline is hover-only: text-style.link-sm's own
   $extensions decoration reads too heavy for a quiet card affordance. */
.sb-link { display: inline-flex; align-items: center; gap: ${px(resolve("dim.1"))}; flex-shrink: 0; background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; color: ${cv("text.primary")}; ${typoCss(tLinkSm)} text-decoration: none; border-radius: ${px(resolve("radius.xs"))}; }
.sb-link:hover { text-decoration: ${linkSmDecoration}; }
.sb-link:focus-visible { outline: ${btnSecondary.ringWidth} solid ${cv(btnSecondary.ringColor)}; outline-offset: ${btnSecondary.ringOffset}; }
.sb-link svg { width: ${px(resolve("dim.3_5"))}; height: ${px(resolve("dim.3_5"))}; color: ${cv("icon.primary")}; }

/* Rows are the whole interactive element (a real <a>), never a link nested
   in a clickable div — Attachment's done-shape resolution, reused. */
/* flex-start, not the default stretch: when a long time range wraps to two
   lines the date chip must keep its own height instead of growing into a tall
   gray block (caught at 375px). */
.sb-row { display: flex; align-items: flex-start; gap: ${px(resolve("dim.2_5"))}; padding: ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv(cardDivider)}; text-decoration: none; }
.sb-row:last-child { border-bottom: none; }
.sb-row:hover { background: ${cv("fill.neutralHover")}; }
.sb-row:active { background: ${cv("fill.neutralActive")}; }
.sb-row:focus-visible { outline: ${btnSecondary.ringWidth} solid ${cv(btnSecondary.ringColor)}; outline-offset: calc(-1 * ${btnSecondary.ringWidth}); }
.sb-row__stack { display: flex; flex-direction: column; gap: ${px(resolve("dim.0_5"))}; min-width: 0; }

/* Date chip — bg.neutral (Badge's neutral tint / EmptyState's own pill fill),
   not a second surface layer. */
.sb-date { flex-shrink: 0; width: ${px(resolve("dim.10"))}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: ${px(resolve("dim.1"))} 0; border-radius: ${px(resolve("radius.sm"))}; background: ${cv("bg.neutral")}; }
.sb-date__month { color: ${cv("text.secondary")}; ${typoCss(tBodyXs)} font-weight: ${tLabelSm.fontWeight}; text-transform: ${labelSmTransform}; letter-spacing: ${tLabelSm.letterSpacing}; }
.sb-date__day { color: ${cv("text.default")}; ${typoCss(tHeadingBase)} }
.sb-event__title { color: ${cv("text.default")}; ${typoCss(tHeadingBase)} }
.sb-meta { display: flex; align-items: flex-start; gap: ${px(resolve("dim.1"))}; color: ${cv("text.secondary")}; ${typoCss(tBodySm)} }
.sb-meta svg { width: ${px(resolve("dim.3_5"))}; height: ${px(resolve("dim.3_5"))}; flex-shrink: 0; color: ${cv("icon.muted")}; }

.sb-article { display: flex; flex-direction: column; align-items: flex-start; gap: ${px(resolve("dim.1"))}; padding: ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv(cardDivider)}; text-decoration: none; }
.sb-article:hover { background: ${cv("fill.neutralHover")}; }
.sb-article:active { background: ${cv("fill.neutralActive")}; }
.sb-article:focus-visible { outline: ${btnSecondary.ringWidth} solid ${cv(btnSecondary.ringColor)}; outline-offset: calc(-1 * ${btnSecondary.ringWidth}); }
.sb-article:hover .sb-link { text-decoration: ${linkSmDecoration}; }
.sb-article:last-child { border-bottom: none; }
.sb-article__title { color: ${cv("text.default")}; ${typoCss(tHeadingBase)} }
.sb-article__excerpt { color: ${cv("text.secondary")}; ${typoCss(tBodySm)} display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sb-article .sb-link { margin-top: ${px(resolve("dim.0_5"))}; }

/* Button secondary, icon-only, base — the settings action, resolved from
   button.tokens.json (fill.neutral at rest, so it reads as a control) */
.btn { display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-family: inherit; border-radius: ${btnRadius}; }
.btn--secondary { background: ${cv(btnSecondary.fill)}; }
.btn--secondary.btn--base.btn--icon-only { width: ${btnBase.height}; height: ${btnBase.height}; padding: 0; }
/* sm text button — the feed headers' View All. Same variant as the settings
   action, so it inherits its hover/pressed/focus without a second recipe. */
.btn--secondary.btn--sm { height: ${btnSm.height}; padding: 0 ${btnSm.paddingX}; gap: ${btnSm.gap}; color: ${cv(btnSecondary.label)}; ${typoCss(btnSm.label)} }
.btn--secondary .btn__icon { width: ${btnBase.iconSize}; height: ${btnBase.iconSize}; color: ${cv(btnSecondary.icon)}; }
.btn--secondary:hover { background: ${cv(btnSecondary.hoverFill)}; }
.btn--secondary:active { background: ${cv(btnSecondary.pressedFill)}; }
.btn--secondary:focus-visible { outline: ${btnSecondary.ringWidth} solid ${cv(btnSecondary.ringColor)}; outline-offset: ${btnSecondary.ringOffset}; }

.empty-state { box-sizing: border-box; width: 100%; display: flex; align-items: center; justify-content: center; padding: ${es.padding}; font-family: ${cv("family.sans")}; }
.empty-state__text { background: ${cv(es.pillBg)}; color: ${cv(es.textColor)}; border-radius: ${es.pillRadius}; padding: ${es.pillPaddingY} ${es.pillPaddingX}; ${typoCss(es.textType)} text-align: center; }`;

const iconClock = iconOf("schedule", "");
const iconPin = iconOf("location_on", "");
const iconLaunch = iconOf("launch", "");

const tileMarkup = (t) => `        <button class="sb-tile" type="button">
          <span class="sb-ibox sb-ibox--lg sb-ibox--${t.hue}">${iconOf(t.icon, "")}</span>
          <span class="sb-tile__label">${esc(t.label)}</span>
        </button>`;

const feedHeader = (icon, hue, title, viewAll) => `        <div class="card__header">
          <span class="sb-ibox sb-ibox--sm sb-ibox--${hue}">${iconOf(icon, "")}</span>
          <h2 class="card__title">${esc(title)}</h2>
          ${viewAll ? `<button class="btn btn--secondary btn--sm" type="button">View All</button>` : ""}
        </div>`;

const eventMarkup = (e) => `        <a class="sb-row" href="#">
          <span class="sb-date"><span class="sb-date__month">${esc(e.month)}</span><span class="sb-date__day">${esc(e.day)}</span></span>
          <span class="sb-row__stack">
            <span class="sb-event__title">${esc(e.title)}</span>
            <span class="sb-meta">${iconClock}<span>${esc(e.when)}</span></span>
            <span class="sb-meta">${iconPin}<span>${esc(e.where)}</span></span>
          </span>
        </a>`;

// One <a> per item, with "Read Article" as a plain <span> inside it — the ICS
// rows are interactive and these weren't, which is the whole of the reported
// "на ics фіді є ховери, а на рсс нема". Keeping the inner text a real link
// would nest an <a> in an <a>; Attachment's done-shape already settled that
// the whole row is the one interactive element.
const articleMarkup = (a) => `        <a class="sb-article" href="#">
          <span class="sb-article__title">${esc(a.title)}</span>
          <span class="sb-article__excerpt">${esc(a.excerpt)}</span>
          <span class="sb-link">Read Article${iconLaunch}</span>
        </a>`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Springboard</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
<div class="sb">
  <header class="sb__topbar">
    <span class="sb__logo">${logoSvg}</span>
    <button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">${iconOf("settings", "btn__icon")}</button>
  </header>
  <main class="sb__main">
    <nav class="sb__tiles" aria-label="Quick links">
${TILES.map(tileMarkup).join("\n")}
    </nav>
    <div class="sb__feeds">
      <section class="card" aria-label="Demo ICS Feed">
${feedHeader("today", "orange", "Demo ICS Feed", true)}
${EVENTS.map(eventMarkup).join("\n")}
      </section>
      <section class="card" aria-label="Demo RSS Feed">
${feedHeader("rss_feed", "amber", "Demo RSS Feed", true)}
${ARTICLES.map(articleMarkup).join("\n")}
      </section>
      <section class="card" aria-label="Demo X Feed">
${feedHeader("campaign", "red", "Demo X Feed", false)}
        <div class="empty-state"><span class="empty-state__text">No posts to show</span></div>
      </section>
    </div>
  </main>
</div>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "springboard",
  title: "Springboard",
  heading: "Springboard",
  sub: "The student portal's home screen, rebuilt on hp-design — every recipe resolved from its own token file, no new components needed. Quick links are compact tiles (a tinted <code>tag.*</code> icon square + label) on Card's interactive recipe, so each one carries Card's own hover / pressed / focus states; the feeds are Cards with a real header band (icon + title + View All) over full-bleed rows — ICS events with a date chip, time and location, RSS articles with a clamped excerpt and a Read Article link, and the social feed on EmptyState. One auto-fit track list carries the tiles from one-per-row on a phone to all six across on desktop; the feeds go two-column at 1024. <strong>Explore Degrees</strong> is new (not in the live app): <code>school</code> on the magenta tag hue — violet was skipped on purpose, it reads as the <code>ai</code> role.",
  versions: [{ label: "v1", note: "current", file: "springboard-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/springboard-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/springboard.html"), viewerHtml);
console.log("wrote docs/designs/springboard-app.html");
console.log("wrote docs/designs/springboard.html");
