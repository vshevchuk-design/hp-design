// CSS for the Student Scheduling prototype: every component recipe resolved
// from its own token file, plus the `ss-*` composition layer (section bar,
// page column, the browse list rows and the two-column pick-a-time layout).
//
// Same shape as ed-css.mjs — a function taking the builder's resolver helpers,
// so the resolver isn't copied a 46th time. Same rule too: resolve the role
// from the component's token file, never retype the role name.

import { COLLAPSIBLE_CSS } from "./collapsible.mjs";
/** @param h  { tokens, resolve, resolveToken, cv, px, refPath, typoCss, textExt, get } */
export function ssCss(h) {
  const { tokens: t, resolve, cv, px, refPath, typoCss, textExt } = h;
  const R = (node) => cv(refPath(node.$value)); // a colour-role token → its var()
  const D = (node) => px(resolve(node.$value)); // a dimension token → px
  const T = (node) => h.resolveToken(node); // a typography token (inline or aliased)
  const style = (name) => h.resolveToken(h.get(`text-style.${name}`));
  const dim = (k) => px(resolve(`dim.${k}`));
  const shadowCss = (node) => {
    const s = h.resolveToken(node);
  return `${px(s.offsetX)} ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${s.color}`;
  };

  const { tabs, button, select, search, chip, listbox: lb, card, badge, pagination: pg, choiceTile: ct, radio, alert, toast, tooltip: tt, emptyState: es, dialog: modal, alertDialog: ad, input, counter, progress, attachment: att, accordion: acc, datePicker: dp, calendar: cal, slideOverPanel: drawer, box, dropdownMenu: menu, statusIcon: si } = t;

  const btn = (variant, size) => ({
    height: D(button[variant].size[size].height),
    paddingX: D(button[variant].size[size].paddingX),
    gap: D(button[variant].size[size].gap),
    iconSize: D(button[variant].size[size].iconSize),
    label: T(button[variant].size[size].label),
  });
  const bBase = btn("primary", "base"), bSm = btn("secondary", "sm");
  // Primary/secondary/ghost share one size grid — asserted in button's own
  // builder; spot-check the two sizes this page leans on.
  for (const size of ["base", "sm"]) {
    for (const v of ["secondary", "ghost"]) {
      if (D(button[v].size[size].height) !== D(button.primary.size[size].height)) throw new Error(`button ${v} ${size} height diverged`);
    }
  }
  const ringW = D(button.primary.state.focused.ringWidth);
  const ringO = D(button.primary.state.focused.ringOffset);

  const tabLabel = T(tabs.item.label);
  const tabActiveWeight = resolve(tabs.underline.state.active.fontWeight.$value);
  const segActiveWeight = resolve(tabs.segmented.state.active.fontWeight.$value);

  const chipBase = { height: D(chip.size.base.height), paddingX: D(chip.size.base.paddingX), gap: D(chip.size.base.gap), iconSize: D(chip.size.base.iconSize), label: T(chip.size.base.label) };
  const chipLg = { height: D(chip.size.lg.height), paddingX: D(chip.size.lg.paddingX), gap: D(chip.size.lg.gap), iconSize: D(chip.size.lg.iconSize), label: T(chip.size.lg.label) };
  const tg = chip.toggle;

  // Row department + Pick a time are both base (40px): at sm the Select's fixed
  // 16px value (the iOS-zoom rule) out-weighed the sm button beside it.
  const selRow = { height: D(select.size.base.height), paddingX: D(select.size.base.paddingX), gap: D(select.size.base.gap), iconSize: D(select.size.base.iconSize), value: T(select.size.base.value), label: T(select.size.base.label), labelGap: D(select.size.base.labelGap) };
  const srch = { height: D(search.size.base.height), paddingX: D(search.size.base.paddingX), gap: D(search.size.base.gap), iconSize: D(search.size.base.iconSize), value: T(search.value) };
  const badgeSm = { height: D(badge.size.sm.height), paddingX: D(badge.size.sm.paddingX), radius: D(badge.radius), label: T(badge.size.sm.label) };

  const labelSm = style("label-sm");
  const labelSmCase = textExt("text-style.label-sm").textTransform || "none";

  const ttShow = h.resolveToken(tt.showDelay);

  const modalDur = `${modal.transitionDuration.$value.value}${modal.transitionDuration.$value.unit}`;
  return `
/* ============ page frame (ss-* composition) ============ */
* { box-sizing: border-box; }
html, body { height: 100%; }
/* iOS Safari inflates some text in landscape ("text size adjust") — the
   service names grew when the phone was turned. Sizes come from the tokens;
   the browser doesn't get to rescale them. */
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; color: ${cv("text.default")}; }
/* The section bar is Tabs underline, laid edge to edge under the topbar as
   one band — same white, same hairline, same gutters as the bar above, so the
   two read as one header. Sticky under the 64px topbar. Its height is the
   tab's own 40px: the hairline is the tabs' baseline, which each tab overlaps
   by 1px, so the band never sums to 41. */
.ss-sections { position: sticky; top: ${dim(16)}; z-index: 1; background: ${cv("surface.default")}; padding: 0 ${dim(2)}; }
.ss-sections .tabs--underline { width: 100%; }
@media (min-width: 768px) { .ss-sections { padding: 0 ${dim(4)}; } }
/* v5: the section bar IS the segmented Tabs track — its gray, edge to edge,
   no radius — with the base (40px) pills inside it: dim.12 tall = the
   track's own 4px padding + 40 + 4. Horizontal padding lines the first
   label up with the topbar title (gutter − the tab's paddingX). It tucks up
   under the topbar while scrolling down and returns on any scroll up. */
.app__topbar { z-index: 2; }
.ss-sections--seg { height: ${dim(12)}; display: flex; align-items: center; gap: ${D(tabs.segmented.trackPadding)}; padding: ${D(tabs.segmented.trackPadding)} calc(${dim(4)} - ${D(tabs.size.base.paddingX)}); background: ${R(tabs.segmented.trackBg)}; transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
.ss-sections--seg .tabs--segmented { height: 100%; padding: 0; border-radius: 0; background: transparent; }
.ss-sections--seg.is-tucked { transform: translateY(-100%); }
/* When the tabs overflow (a phone), the ROW scrolls inside the bar and its
   edges fade out — a mask on the tabs themselves, so they dissolve into the
   track gray rather than a gradient being painted over them. The script
   turns each side on only while something is hidden that way. (black in a
   mask is alpha, not a colour.) */
.ss-sections--seg .tabs--segmented { flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.ss-sections--seg .tabs--segmented::-webkit-scrollbar { display: none; }
.ss-sections--seg.has-more-end .tabs--segmented { -webkit-mask-image: linear-gradient(to right, black calc(100% - ${dim(10)}), transparent); mask-image: linear-gradient(to right, black calc(100% - ${dim(10)}), transparent); }
.ss-sections--seg.has-more-start .tabs--segmented { -webkit-mask-image: linear-gradient(to right, transparent, black ${dim(10)}); mask-image: linear-gradient(to right, transparent, black ${dim(10)}); }
.ss-sections--seg.has-more-start.has-more-end .tabs--segmented { -webkit-mask-image: linear-gradient(to right, transparent, black ${dim(10)}, black calc(100% - ${dim(10)}), transparent); mask-image: linear-gradient(to right, transparent, black ${dim(10)}, black calc(100% - ${dim(10)}), transparent); }
@media (min-width: 768px) { .ss-sections--seg { padding-inline: calc(${dim(6)} - ${D(tabs.size.base.paddingX)}); } }
@media (prefers-reduced-motion: reduce) { .ss-sections--seg { transition: none; } }
.ss__main { flex: 1; width: 100%; max-width: 1040px; margin: 0 auto; padding: ${dim(6)} ${dim(4)} ${dim(12)}; display: flex; flex-direction: column; gap: ${dim(6)}; }
@media (min-width: 768px) { .ss__main { padding: ${dim(8)} ${dim(6)} ${dim(16)}; } }
.ss-view { display: none; flex-direction: column; gap: ${dim(6)}; }
.ss-view.is-active { display: flex; }
.ss-head { display: flex; flex-direction: column; gap: ${dim("1_5")}; }
.ss-title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("title-xl"))} }
.ss-sub.ss-sub--sm { ${typoCss(style("body-sm"))} }
/* v5 browse head: title + a search button on a phone. The button is base
   (40px) — the same height as the Search field that replaces the row when it
   opens, so nothing jumps. From 768 the button goes and the field stays in
   the filter row. */
.ss-head__row { display: flex; align-items: center; justify-content: space-between; gap: ${dim(3)}; }
/* Phone: two columns — title + subtitle on the left, the search button on
   the right — so the subtitle wraps short of the button instead of running
   under it. The button column is fixed at the button's own 40px, not auto:
   auto collapsed to 0 when the button hid behind the open Search, and the
   subtitle re-wrapped wider. The row dissolves (display: contents) so its children become grid
   items; the opened Search spans both columns of the first row. */
@media (max-width: 767px) {
  #ss-browse-head { display: grid; grid-template-columns: minmax(0, 1fr) ${D(button.secondary.size.base.height)}; column-gap: ${dim(3)}; row-gap: ${dim("1_5")}; }
  #ss-browse-head .ss-head__row { display: contents; }
  #ss-browse-head .ss-title { grid-column: 1; grid-row: 1; align-self: center; min-height: ${D(button.secondary.size.base.height)}; display: flex; align-items: center; }
  #ss-browse-head .ss-search-open { grid-column: 2; grid-row: 1; }
  #ss-browse-head .search { grid-column: 1 / -1; grid-row: 1; }
  #ss-browse-head .ss-sub { grid-column: 1; grid-row: 2; }
}
/* v5, every width: subtitle → filters → sort, 12 each */
.ss-view[data-view="browse"]:has(#ss-browse-head) { gap: ${dim(3)}; }
.ss-head__row .search { display: none; }
.ss-head.is-search-open .ss-head__row .ss-title, .ss-head.is-search-open .ss-search-open { display: none; }
.ss-head.is-search-open .ss-head__row .search { display: flex; flex: 1; }
/* open on a phone, the × is always there: it clears, then closes */
.ss-head.is-search-open .search__clear { display: inline-flex; }
@media (min-width: 768px) { .ss-head .ss-search-open { display: none; } }
.ss-sub { margin: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-base"))} max-width: 640px; }
.ss-note { margin: 0; color: ${cv("text.muted")}; ${typoCss(style("body-sm"))} }
.ss-eyebrow { color: ${cv("text.secondary")}; ${typoCss(labelSm)} text-transform: ${labelSmCase}; letter-spacing: ${labelSm.letterSpacing}; }
/* Back sits above the heading, un-indented so its word lines up with the
   heading rather than with the ghost button's padding box. */
.ss-back { align-self: flex-start; margin-inline-start: -${dim(2)}; margin-block-end: -${dim(3)}; }

/* ============ Tabs (underline: sections · segmented: time of day) ============ */
.tab { display: inline-flex; align-items: center; justify-content: center; gap: ${D(tabs.item.gap)}; border: none; background: transparent; cursor: pointer; white-space: nowrap; color: ${R(tabs.underline.state.default.label)}; font-family: inherit; ${typoCss(tabLabel)} }
.tab--sm { height: ${D(tabs.size.sm.height)}; padding: 0 ${D(tabs.size.sm.paddingX)}; }
.tab--base { height: ${D(tabs.size.base.height)}; padding: 0 ${D(tabs.size.base.paddingX)}; }
.tab:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: -${ringW}; }
.tabs--underline { display: flex; align-items: stretch; gap: ${D(tabs.underline.gap)}; border-bottom: 1px solid ${R(tabs.underline.baselineColor)}; max-width: 100%; overflow-x: auto; scrollbar-width: none; }
/* hover: a fully rounded wash lifted off the underline (::before) */
.tabs--underline .tab { position: relative; isolation: isolate; border-bottom: 2px solid transparent; margin-bottom: -1px; padding-bottom: calc(${D(tabs.underline.hover.gap)} - ${D(tabs.underline.hover.insetTop)}); }
.tabs--underline .tab::before { content: ""; position: absolute; z-index: -1; left: 0; right: 0; top: ${D(tabs.underline.hover.insetTop)}; bottom: ${D(tabs.underline.hover.gap)}; border-radius: ${D(tabs.segmented.pillRadius)}; background: transparent; }
.tabs--underline .tab:not(.tab--active):not(:disabled):hover { color: ${R(tabs.underline.state.hover.label)}; }
.tabs--underline .tab:not(.tab--active):not(:disabled):hover::before { background: ${R(tabs.underline.hover.bg)}; }
.tabs--underline .tab--active { color: ${R(tabs.underline.state.active.label)}; font-weight: ${tabActiveWeight}; border-bottom-color: ${R(tabs.underline.indicatorColor)}; }
.tabs--segmented { display: inline-flex; align-items: center; gap: ${D(tabs.segmented.trackPadding)}; background: ${R(tabs.segmented.trackBg)}; border-radius: ${D(tabs.segmented.trackRadius)}; padding: ${D(tabs.segmented.trackPadding)}; max-width: 100%; overflow-x: auto; scrollbar-width: none; }
.tabs--segmented .tab { border-radius: ${D(tabs.segmented.pillRadius)}; color: ${R(tabs.segmented.state.default.label)}; }
.tabs--segmented .tab:not(.tab--active):not(:disabled):hover { background: ${R(tabs.segmented.state.hover.bg)}; color: ${R(tabs.segmented.state.hover.label)}; }
.tabs--segmented .tab--active { background: ${R(tabs.segmented.state.active.bg)}; color: ${R(tabs.segmented.state.active.label)}; font-weight: ${segActiveWeight}; }
.tabs--segmented .tab:disabled, .tabs--underline .tab:disabled { color: ${R(tabs.segmented.state.disabled.label)}; cursor: not-allowed; }

/* ============ Button ============ */
.btn { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; border-radius: ${D(button.primary.radius)}; }
.btn:disabled { cursor: not-allowed; }
.btn__icon { flex-shrink: 0; }
.btn--primary { background: ${R(button.primary.state.default.fill)}; color: ${R(button.primary.state.default.label)}; }
.btn--primary .btn__icon { color: ${R(button.primary.state.default.icon)}; }
.btn--primary:not(:disabled):hover { background: ${R(button.primary.state.hover.fill)}; }
.btn--primary:not(:disabled):active { background: ${R(button.primary.state.pressed.fill)}; }
.btn--primary:disabled { background: ${R(button.primary.state.disabled.fill)}; color: ${R(button.primary.state.disabled.label)}; }
.btn--primary:disabled .btn__icon { color: ${R(button.primary.state.disabled.icon)}; }
.btn--secondary { background: ${R(button.secondary.state.default.fill)}; color: ${R(button.secondary.state.default.label)}; }
.btn--secondary .btn__icon { color: ${R(button.secondary.state.default.icon)}; }
.btn--secondary:not(:disabled):hover { background: ${R(button.secondary.state.hover.fill)}; }
.btn--secondary:not(:disabled):active { background: ${R(button.secondary.state.pressed.fill)}; }
.btn--secondary:disabled { background: ${R(button.secondary.state.disabled.fill)}; color: ${R(button.secondary.state.disabled.label)}; }
.btn--secondary:disabled .btn__icon { color: ${R(button.secondary.state.disabled.icon)}; }
.btn--ghost { background: transparent; color: ${R(button.ghost.state.default.label)}; }
.btn--ghost .btn__icon { color: ${R(button.ghost.state.default.icon)}; }
.btn--ghost:not(:disabled):hover { background: ${R(button.ghost.state.hover.fill)}; }
.btn--ghost:not(:disabled):active { background: ${R(button.ghost.state.pressed.fill)}; }
.btn--ghost:disabled { background: transparent; color: ${R(button.ghost.state.disabled.label)}; }
/* Tint — pale brand fill, blue label: the repeated per-card action. */
.btn--tint { background: ${R(button.tint.state.default.fill)}; color: ${R(button.tint.state.default.label)}; }
.btn--tint .btn__icon { color: ${R(button.tint.state.default.icon)}; }
.btn--tint:not(:disabled):hover { background: ${R(button.tint.state.hover.fill)}; }
.btn--tint:not(:disabled):active { background: ${R(button.tint.state.pressed.fill)}; }
.btn--tint:disabled { background: ${R(button.tint.state.disabled.fill)}; color: ${R(button.tint.state.disabled.label)}; }
.btn--base { height: ${bBase.height}; padding: 0 ${bBase.paddingX}; gap: ${bBase.gap}; ${typoCss(bBase.label)} }
.btn--base .btn__icon { width: ${bBase.iconSize}; height: ${bBase.iconSize}; }
.btn--sm { height: ${bSm.height}; padding: 0 ${bSm.paddingX}; gap: ${bSm.gap}; ${typoCss(bSm.label)} }
.btn--sm .btn__icon { width: ${bSm.iconSize}; height: ${bSm.iconSize}; }
.btn--icon-only.btn--sm { width: ${bSm.height}; padding: 0; }
.btn--icon-only.btn--base { width: ${bBase.height}; padding: 0; }
.btn--block { width: 100%; }
.btn:focus-visible { outline: ${ringW} solid ${R(button.primary.state.focused.ringColor)}; outline-offset: ${ringO}; }

/* ============ Search ============ */
.search { display: flex; align-items: center; width: 100%; height: ${srch.height}; padding: 0 ${srch.paddingX}; gap: ${srch.gap}; background: ${R(search.state.default.bg)}; border: 1px solid ${R(search.state.default.border)}; border-radius: ${D(search.radius)}; }
.search:hover { background: ${R(search.state.hover.bg)}; border-color: ${R(search.state.hover.border)}; }
.search:focus-within { border-color: ${R(search.state.focus.border)}; }
.search__icon { flex-shrink: 0; width: ${srch.iconSize}; height: ${srch.iconSize}; color: ${R(search.state.default.icon)}; }
.search__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${R(search.state.default.value)}; ${typoCss(srch.value)} font-family: inherit; }
.search__input::placeholder { color: ${R(search.state.default.placeholder)}; }
.search__input::-webkit-search-cancel-button { display: none; }
/* The clear × appears only while there's a value — Search's populated state. */
.search__clear { flex-shrink: 0; display: none; width: ${srch.iconSize}; height: ${srch.iconSize}; padding: 0; border: none; background: none; cursor: pointer; color: ${R(search.state.populated.clearIcon)}; border-radius: ${D(search.radius)}; }
.search__clear svg { width: 100%; height: 100%; display: block; }
.search.is-populated .search__clear { display: inline-flex; }

/* ============ Chip — toggle, and the dropdown chip (Chip trigger + Listbox) ============ */
.chip { display: inline-flex; align-items: center; justify-content: center; gap: ${chipBase.gap}; height: ${chipBase.height}; padding: 0 ${chipBase.paddingX}; border-radius: ${D(chip.radius)}; background: ${R(tg.default.bg)}; border: 1px solid ${R(tg.default.border)}; color: ${R(tg.default.text)}; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: inherit; ${typoCss(chipBase.label)} }
.chip__icon { flex-shrink: 0; width: ${chipBase.iconSize}; height: ${chipBase.iconSize}; color: ${R(tg.default.icon)}; }
.chip:not([aria-pressed="true"]):not(.chip--checked-outline):hover { background: ${R(tg.hover.bg)}; border-color: ${R(tg.hover.border)}; }
.chip[aria-pressed="true"] { background: ${R(tg.checked.bg)}; border-color: ${R(tg.checked.bg)}; color: ${R(tg.checked.text)}; }
.chip[aria-pressed="true"] .chip__icon { color: ${R(tg.checked.icon)}; }
.chip[aria-pressed="true"]:hover { background: ${R(tg.checkedHover.bg)}; border-color: ${R(tg.checkedHover.bg)}; }
/* A dropdown chip holding a value wears checkedOutline — selected, but quieter
   than a pressed toggle, since its label already says what's chosen. */
.chip--checked-outline { background: ${R(tg.checkedOutline.bg)}; border-color: ${R(tg.checkedOutline.border)}; color: ${R(tg.checkedOutline.text)}; }
.chip--checked-outline .chip__icon { color: ${R(tg.checkedOutline.icon)}; }
.chip:focus-visible { outline: ${D(chip.focus.ringWidth)} solid ${R(chip.focus.ringColor)}; outline-offset: ${D(chip.focus.ringOffset)}; }
/* lg — the filters, level with the 40px Search beside them */
.chip--lg { height: ${chipLg.height}; padding: 0 ${chipLg.paddingX}; gap: ${chipLg.gap}; ${typoCss(chipLg.label)} }
.chip--lg .chip__icon { width: ${chipLg.iconSize}; height: ${chipLg.iconSize}; }
/* On a phone the filters sit on their own line, not beside the Search, so
   there's nothing to be level with — back to Chip base (32px). */
@media (max-width: 767px) {
  .ss-filters .chip--lg { height: ${chipBase.height}; padding: 0 ${chipBase.paddingX}; gap: ${chipBase.gap}; ${typoCss(chipBase.label)} }
  .ss-filters .chip--lg .chip__icon { width: ${chipBase.iconSize}; height: ${chipBase.iconSize}; }
}
.chip--dropdown { flex-shrink: 1; min-width: 0; max-width: 100%; }
.chip__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

/* ============ Listbox (single-select popover) ============ */
.listbox { margin: 0; padding: ${D(lb.padding)}; border-radius: ${D(lb.radius)}; background: ${R(lb.bg)}; border: 1px solid ${R(lb.border)}; box-shadow: ${shadowCss(lb.shadow)}; font-family: ${cv("family.sans")}; min-width: 220px; max-width: calc(100vw - ${dim(8)}); }
.listbox__list { display: flex; flex-direction: column; gap: ${D(lb.gap)}; max-height: ${D(lb.maxHeight)}; overflow-y: auto; }
.listbox__option { width: 100%; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; border: none; background: none; border-radius: ${D(lb.optionRadius)}; cursor: pointer; text-align: left; white-space: nowrap; color: ${R(lb.state.default.text)}; font-family: inherit; ${typoCss(T(lb.label))} }
.listbox__option:hover { background: ${R(lb.state.hover.bg)}; }
.listbox__option:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: -${ringW}; }
.listbox__checkmark { flex-shrink: 0; margin-left: auto; width: ${D(lb.checkmarkSize)}; height: ${D(lb.checkmarkSize)}; color: ${R(lb.state.selected.checkmark)}; visibility: hidden; }
.listbox__option[aria-selected="true"] .listbox__checkmark { visibility: visible; }

/* ============ Select (closed trigger, sm — the per-row department) ============ */
.select { display: inline-flex; align-items: center; max-width: 100%; height: ${selRow.height}; padding: 0 ${selRow.paddingX}; gap: ${selRow.gap}; background: ${R(select.state.default.bg)}; border: 1px solid ${R(select.state.default.border)}; border-radius: ${D(select.radius)}; cursor: pointer; text-align: left; font-family: inherit; }
.select:hover { background: ${R(select.state.hover.bg)}; border-color: ${R(select.state.hover.border)}; }
.select:focus-visible, .select[aria-expanded="true"] { outline: none; border-color: ${R(select.state.focus.border)}; }
/* Base Select's populated state: the floating label ("Department") over the
   value — says what the control picks without a separate caption. */
.select__stack { display: flex; flex-direction: column; justify-content: center; gap: ${selRow.labelGap}; flex: 1; min-width: 0; }
.select__label { color: ${R(select.state.populated.label)}; ${typoCss(selRow.label)} white-space: nowrap; }
.select[aria-expanded="true"] .select__label { color: ${R(select.state.focus.label)}; }
/* Resting (no value yet): the placeholder alone, no floating label. */
.select.is-placeholder .select__label { display: none; }
.select.is-placeholder .select__value { color: ${R(select.state.default.placeholder)}; }
.select__value { min-width: 0; color: ${R(select.state.default.value)}; ${typoCss(selRow.value)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.select__chevron { flex-shrink: 0; width: ${selRow.iconSize}; height: ${selRow.iconSize}; color: ${R(select.state.default.chevron)}; }

/* ============ Card ============ */
/* Card as the DS ships it (docs/card.html): padding on the card, 12px
   between parts, header / footer hairlines inset by that padding, footer
   actions right-aligned. */
.card { display: flex; flex-direction: column; gap: ${D(card.gap)}; background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; padding: ${D(card.padding)}; min-width: 0; }
.card__header { display: flex; flex-direction: column; gap: ${D(card.headerGap)}; padding-bottom: ${D(card.gap)}; border-bottom: 1px solid ${R(card.divider)}; }
.card__title { margin: 0; color: ${R(card.titleColor)}; ${typoCss(T(card.title))} }
.card__description { margin: 0; color: ${R(card.descriptionColor)}; ${typoCss(T(card.description))} }
.card__footer { padding-top: ${D(card.gap)}; border-top: 1px solid ${R(card.divider)}; display: flex; justify-content: flex-end; gap: ${dim(2)}; }
/* composition: a group of the card's content (no padding of its own) */
.card__body { display: flex; flex-direction: column; gap: ${D(card.gap)}; min-width: 0; }
/* composition: content that runs edge to edge (a list, an Accordion) — the
   card's padding moves onto its header / footer, their hairlines go full width */
.card--flush { padding: 0; gap: 0; overflow: hidden; }
.card--flush > .card__header { padding: ${D(card.padding)}; }
.card--flush > .card__footer { padding: ${D(card.gap)} ${D(card.padding)}; }

/* ============ Badge ============ */
.badge { display: inline-flex; align-items: center; flex-shrink: 0; height: ${badgeSm.height}; padding: 0 ${badgeSm.paddingX}; border-radius: ${badgeSm.radius}; white-space: nowrap; ${typoCss(badgeSm.label)} }
.badge--base { height: ${D(badge.size.base.height)}; padding: 0 ${D(badge.size.base.paddingX)}; ${typoCss(T(badge.size.base.label))} }
/* outline: white + hairline (inside the box, so the height holds) + default text */
.badge--outline { background: transparent; border: 1px solid ${R(badge.outline.border)}; color: ${R(badge.outline.text)}; }
.badge--regular { font-weight: ${resolve(badge.regular.fontWeight.$value)}; }
.badge--violet { background: ${R(badge.color.violet.tint.bg)}; color: ${R(badge.color.violet.tint.text)}; }
${["neutral", "primary", "success", "warning", "danger"].map((r) => `.badge--${r} { background: ${R(badge.role[r].tint.bg)}; color: ${R(badge.role[r].tint.text)}; }`).join("\n")}

/* ============ Pagination ============ */
.pagination { display: inline-flex; align-items: center; gap: ${D(pg.item.gap)}; }
.page-item { display: inline-flex; align-items: center; justify-content: center; height: ${D(pg.item.size)}; min-width: ${D(pg.item.minWidth)}; padding: 0 ${D(pg.item.paddingX)}; border: none; border-radius: ${D(pg.item.radius)}; background: transparent; color: ${R(pg.state.default.label)}; font-family: inherit; ${typoCss(T(pg.item.label))} cursor: pointer; }
.page-item svg { width: ${D(pg.item.iconSize)}; height: ${D(pg.item.iconSize)}; }
.page-item:not([aria-current]):not(:disabled):hover { background: ${R(pg.state.hover.bg)}; }
.page-item[aria-current] { background: ${R(pg.state.active.bg)}; color: ${R(pg.state.active.label)}; cursor: default; }
.page-item:disabled { color: ${R(pg.state.disabled.label)}; cursor: not-allowed; }
.page-item:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: ${ringO}; }

/* ============ ChoiceTile (days and times) ============ */
.choice-tile { display: block; position: relative; cursor: pointer; min-width: 0; }
.choice-tile__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.choice-tile__box { height: 100%; display: flex; align-items: center; gap: ${D(ct.gap)}; padding: ${D(ct.paddingY)} ${D(ct.paddingX)}; border-radius: ${D(ct.radius)}; background: ${R(ct.state.default.bg)}; border: 1px solid ${R(ct.state.default.border)}; }
.choice-tile__text { display: flex; flex-direction: column; gap: ${D(ct.textGap)}; min-width: 0; }
.choice-tile__label { color: ${R(ct.labelColor)}; ${typoCss(T(ct.label))} }
.choice-tile__description { color: ${R(ct.descriptionColor)}; ${typoCss(T(ct.description))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.choice-tile:hover .choice-tile__input:not(:checked):not(:disabled) ~ .choice-tile__box { background: ${R(ct.state.hover.bg)}; border-color: ${R(ct.state.hover.border)}; }
.choice-tile__input:checked ~ .choice-tile__box { background: ${R(ct.state.selected.bg)}; border-color: ${R(ct.state.selected.border)}; }
.choice-tile__input:focus-visible ~ .choice-tile__box { outline: ${D(ct.state.focused.ringWidth)} solid ${R(ct.state.focused.ringColor)}; outline-offset: ${D(ct.state.focused.ringOffset)}; }
.choice-tile__input:disabled ~ .choice-tile__box { background: ${R(ct.state.disabled.bg)}; border-color: ${R(ct.state.disabled.border)}; cursor: not-allowed; }
.choice-tile__input:disabled ~ .choice-tile__box .choice-tile__label, .choice-tile__input:disabled ~ .choice-tile__box .ss-day__num { color: ${R(ct.state.disabled.label)}; }
.choice-tile__input:disabled ~ .choice-tile__box .choice-tile__description, .choice-tile__input:disabled ~ .choice-tile__box .ss-day__dow { color: ${R(ct.state.disabled.description)}; }

/* ============ Radio (advisor) ============ */
.radio-group { display: flex; flex-direction: column; gap: ${D(radio.group.labelGap)}; border: none; margin: 0; padding: 0; min-width: 0; }
/* The heading is a <legend>, which doesn't take part in the fieldset's flex
   gap — so the label gap goes on it as a margin, or it sits flush on the
   first option. */
.radio-group__label { padding: 0; margin-bottom: ${D(radio.group.labelGap)}; color: ${R(radio.group.labelColor)}; ${typoCss(T(radio.group.label))} }
.radio-group__items { display: flex; flex-direction: column; gap: ${D(radio.group.gapVertical)}; }
.radio-group__helper { margin: 0; color: ${R(radio.group.helperColor)}; ${typoCss(T(radio.group.helper))} }
.radio { display: inline-flex; align-items: center; gap: ${D(radio.size.gap)}; cursor: pointer; color: ${R(radio.state.default.label)}; ${typoCss(T(radio.label))} }
.radio__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.radio__circle { flex-shrink: 0; width: ${D(radio.size.circle)}; height: ${D(radio.size.circle)}; border-radius: ${D(radio.radius)}; border: ${D(radio.size.borderWidth)} solid ${R(radio.state.default.border)}; background: ${R(radio.state.default.bg)}; display: inline-flex; align-items: center; justify-content: center; }
.radio__circle::after { content: ""; width: ${D(radio.size.dot)}; height: ${D(radio.size.dot)}; border-radius: ${D(radio.radius)}; background: ${R(radio.state.checked.dot)}; display: none; }
.radio:hover .radio__input:not(:checked):not(:disabled) ~ .radio__circle { border-color: ${R(radio.state.hover.border)}; background: ${R(radio.state.hover.bg)}; }
.radio__input:checked ~ .radio__circle { border-color: ${R(radio.state.checked.border)}; background: ${R(radio.state.checked.bg)}; }
.radio__input:checked ~ .radio__circle::after { display: block; }
.radio:hover .radio__input:checked:not(:disabled) ~ .radio__circle { border-color: ${R(radio.state.checkedHover.border)}; }
.radio:hover .radio__input:checked:not(:disabled) ~ .radio__circle::after { background: ${R(radio.state.checkedHover.dot)}; }
.radio__input:focus-visible ~ .radio__circle { outline: ${D(radio.state.focused.ringWidth)} solid ${R(radio.state.focused.ringColor)}; outline-offset: ${D(radio.state.focused.ringOffset)}; }
.radio__text { display: inline-flex; align-items: center; gap: ${dim(2)}; min-width: 0; }

/* ============ Alert (info) ============ */
.alert { display: flex; align-items: flex-start; gap: ${D(alert.gap)}; padding: ${D(alert.paddingY)} ${D(alert.paddingX)}; border-radius: ${D(alert.radius)}; border: 1px solid ${R(alert.role.info.border)}; background: ${R(alert.role.info.bg)}; }
.alert__icon { flex-shrink: 0; width: ${D(alert.iconSize)}; height: ${D(alert.iconSize)}; color: ${R(si.info.color)}; }
.alert__stack { display: flex; flex-direction: column; gap: ${D(alert.stackGap)}; min-width: 0; }
.alert__message { margin: 0; color: ${R(alert.bodyColor)}; ${typoCss(T(alert.body))} }
.alert__title { color: ${R(alert.titleColor)}; font-weight: ${T(alert.title).fontWeight}; }
.alert__detail { margin: 0; color: ${R(alert.detailColor)}; ${typoCss(T(alert.detail))} }
.alert__actions { display: flex; flex-wrap: wrap; gap: ${dim(2)}; margin-top: ${D(alert.stackGap)}; }

/* ============ EmptyState ============ */
.empty-state { width: 100%; display: flex; align-items: center; justify-content: center; padding: ${D(es.padding)}; }
.empty-state__text { background: ${R(es.pill.bg)}; color: ${R(es.textColor)}; border-radius: ${D(es.pill.radius)}; padding: ${D(es.pill.paddingY)} ${D(es.pill.paddingX)}; ${typoCss(T(es.text))} text-align: center; }

/* ============ Tooltip (meeting-format icons) ============ */
.tooltip-wrapper { position: relative; display: inline-flex; }
.tooltip { position: absolute; z-index: 2; bottom: calc(100% + ${dim("1_5")}); left: 50%; transform: translateX(-50%); padding: ${D(tt.paddingY)} ${D(tt.paddingX)}; border-radius: ${D(tt.radius)}; background: ${R(tt.bg)}; color: ${R(tt.text)}; box-shadow: ${shadowCss(tt.shadow)}; white-space: nowrap; pointer-events: none; opacity: 0; ${typoCss(T(tt.label))} }
.tooltip::after { content: ""; position: absolute; bottom: -${px({ value: resolve(tt.arrowSize.$value).value / 2, unit: "px" })}; left: 50%; margin-left: -${px({ value: resolve(tt.arrowSize.$value).value / 2, unit: "px" })}; width: ${D(tt.arrowSize)}; height: ${D(tt.arrowSize)}; background: ${R(tt.bg)}; transform: rotate(45deg); }
.tooltip-wrapper:hover .tooltip { opacity: 1; transition: opacity 0.12s ease ${ttShow.value}${ttShow.unit}; }

/* ============ Toast ============ */
.toast { position: fixed; inset: auto; top: ${D(toast.offsetTop)}; left: 50%; transform: translateX(-50%); margin: 0; width: max-content; display: flex; align-items: center; gap: ${D(toast.gap)}; padding: ${D(toast.paddingY)} ${D(toast.paddingX)}; border-radius: ${D(toast.radius)}; background: ${R(toast.bg)}; border: 1px solid ${R(toast.border)}; box-shadow: ${shadowCss(toast.shadow)}; font-family: ${cv("family.sans")}; max-width: calc(100vw - ${dim(8)}); }
.toast__icon { flex-shrink: 0; width: ${D(toast.iconSize)}; height: ${D(toast.iconSize)}; color: ${R(si.success.color)}; }
.toast__label { color: ${R(toast.labelColor)}; ${typoCss(T(toast.label))} }
.toast:popover-open { opacity: 1; translate: 0 0; transition: opacity 0.18s ease, translate 0.18s ease; }
@starting-style { .toast:popover-open { opacity: 0; translate: 0 -${dim(2)}; } }

/* ============ browse (ss-*) ============ */
/* Search on its own line on a phone; from 768 it shares one row with the
   filters. Sort is NOT in this row — it orders the results, it doesn't narrow
   them, so it sits on the results line beside the count. */
.ss-tools { display: flex; flex-direction: column; gap: ${dim(3)}; }
/* The two filters never wrap: the department chip gives way (its label
   ellipsizes), the drop-in toggle keeps its width. */
.ss-filters { display: flex; flex-wrap: nowrap; align-items: center; gap: ${dim(2)}; min-width: 0; }
.ss-filters .chip:not(.chip--dropdown) { flex-shrink: 0; }
@media (min-width: 768px) {
  .ss-tools { flex-direction: row; align-items: center; }
  .ss-tools .search { flex: 1; min-width: 0; max-width: 360px; }
}
.ss-results { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-results__bar { display: flex; align-items: center; min-height: ${bSm.height}; }
/* Sort sits at the list's left edge; pulled out by the ghost button's own
   padding so its icon lines up with the card edge, not with its padding box. */
.ss-results__bar .btn--ghost { margin-inline-start: -${bSm.paddingX}; }
/* v5 pick page: the department Select sits above the week. */
/* The department step: a heading, then the Select (several departments) or
   the name as text (one). */
.ss-step { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-step__title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.ss-step__value { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
.ss-pick-dept { align-self: flex-start; width: min(100%, 320px); }
/* Select sm — no floating label at this size (DS), the step heading names it */
.select--sm { height: ${D(select.size.sm.height)}; padding: 0 ${D(select.size.sm.paddingX)}; gap: ${D(select.size.sm.gap)}; }
.select--sm .select__value { ${typoCss(T(select.size.sm.value))} flex: 1; }
.select--sm .select__chevron { width: ${D(select.size.sm.iconSize)}; height: ${D(select.size.sm.iconSize)}; }
/* ---- v5: one item, two shapes ----
   Phone: a card per service (12px padding — Card's 16 plus the 16 page gutter
   spent 64px of a 375 screen on air). From 768: rows inside one Card — name
   over one wrapping line (duration, booking mode, every department), then
   the action. */
.ss-hybrid { display: flex; flex-direction: column; gap: ${dim(3)}; }
.ss-item { display: flex; flex-direction: column; gap: ${dim(3)}; padding: ${dim(3)}; background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; min-width: 0; }
.ss-item__main { display: flex; flex-direction: column; gap: ${dim(3)}; min-width: 0; }
.ss-item__name { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
.ss-item__line { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.ss-item__line .ss-fact { margin-inline-end: ${dim(1)}; }
/* a long fact (a workshop's schedule) wraps instead of running under the button */
.ss-item__line .ss-fact__text { white-space: normal; }
.ss-item__line .ss-fact { align-items: flex-start; }
/* duration: 16px icon + body-sm text */
.ss-fact { display: flex; align-items: center; gap: ${dim("1_5")}; min-width: 0; }
.ss-fact > svg { flex-shrink: 0; width: ${dim(4)}; height: ${dim(4)}; color: ${cv("icon.secondary")}; }
.ss-fact__text { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
.ss-item__cta { width: 100%; }
/* v1: name → duration/badges 8; the row's aside holds the department Select
   (when several) and Pick a time. On a phone a row WITH a Select gives the
   aside its own line under the text, Select taking the width. */
.ss-item--pick .ss-item__main { gap: ${dim(2)}; }
.ss-item__aside { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; }
.ss-item__aside .select { width: ${dim(60)}; max-width: 100%; }
@media (max-width: 767px) {
  .ss-hybrid--flush .ss-item:has(.select) .ss-item__aside { grid-column: 1 / -1; }
  .ss-hybrid--flush .ss-item:has(.select) .ss-item__aside .select { flex: 1; width: auto; min-width: 0; }
  /* beside the 40px Select, the button goes back to base so the pair is level */
  .ss-hybrid--flush .ss-item:has(.select) .ss-item__cta { height: ${bBase.height}; padding: 0 ${bBase.paddingX}; gap: ${bBase.gap}; ${typoCss(bBase.label)} }
}
/* v5: departments as plain text under the name. Name → departments 4,
   departments → duration/mode 8. */
.ss-item--text .ss-item__main { gap: ${dim(1)}; }
.ss-item--text .ss-item__line { margin-top: ${dim(1)}; }
/* v5 on a phone: no cards — a flush list like the desktop rows and the
   Message Center's thread list. Edge to edge (pulled out of the page gutter),
   hairlines between rows, the action on the right of each row. */
@media (max-width: 767px) {
  .ss-hybrid--flush { gap: 0; margin-inline: -${dim(4)}; background: ${R(card.bg)}; border-block: 1px solid ${R(card.border)}; }
  .ss-hybrid--flush .ss-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: ${dim(3)}; padding: ${dim(4)}; border: none; border-bottom: 1px solid ${R(card.divider)}; border-radius: 0; }
  .ss-hybrid--flush .ss-item:last-child { border-bottom: none; }
  /* Button sm on a phone row: base left the content column too narrow for
     "Drop-in until 10:00 PM" beside the duration. */
  .ss-hybrid--flush .ss-item__cta { width: auto; height: ${bSm.height}; padding: 0 ${bSm.paddingX}; gap: ${bSm.gap}; ${typoCss(bSm.label)} }
}
.ss-item__depts { margin: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
@media (min-width: 768px) {
  .ss-hybrid { gap: 0; background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; overflow: hidden; }
  .ss-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: ${dim(4)}; padding: ${D(card.padding)}; border: none; border-bottom: 1px solid ${R(card.divider)}; border-radius: 0; }
  .ss-item:last-child { border-bottom: none; }
  .ss-item__cta { width: auto; }
}
/* v6: sort sits at the end of the filter row, after Department; pulled
   in by the ghost button's padding so its label lines up with the edge. */
.ss-filters .ss-sort-inline { margin-inline-start: auto; margin-inline-end: -${bSm.paddingX}; flex-shrink: 0; }
@media (min-width: 768px) { .ss-tools:has(.ss-sort-inline) .ss-filters { flex: 1; } }
/* v6: Type tabs under the filter row, full width (scrolls on a narrow phone) */
.ss-type-tabs { width: 100%; }
/* on a phone all four fit: Tabs sm's horizontal padding, extra width shared */
@media (max-width: 767px) { .ss-type-tabs { gap: 0; } .ss-type-tabs .tab { flex: 1 1 auto; padding: 0 ${D(tabs.size.sm.paddingX)}; } }
.ss-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: ${dim(3)}; }

/* ============ pick a time (ss-*) ============ */
/* Two columns from 1024: the choosing on the left, the appointment you are
   building on the right, sticky, with its Confirm. One page, one decision
   flow — the reference's popup-for-time + side-drawer-for-advisor split it
   across two surfaces and put the confirm inside the second. */
.ss-pick { display: grid; grid-template-columns: minmax(0, 1fr); gap: ${dim(6)}; align-items: start; }
@media (min-width: 1024px) {
  .ss-pick { grid-template-columns: minmax(0, 1fr) 340px; }
  .ss-summary { position: sticky; top: calc(${dim(16)} + ${D(tabs.size.base.height)} + ${dim(6)}); }
}
#ss-tod { align-self: flex-start; }
.ss-choose { display: flex; flex-direction: column; gap: ${dim(4)}; min-width: 0; }
.ss-week { display: flex; align-items: center; justify-content: space-between; gap: ${dim(3)}; }
.ss-week__label { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
.ss-week__nav { display: flex; gap: ${dim(1)}; }
/* The day strip: six tiles, one per open day. A row that scrolls sideways on
   a phone rather than wrapping — wrapping put Thursday under Friday. */
.ss-days { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(${dim(20)}, 1fr); gap: ${dim(2)}; overflow-x: auto; scrollbar-width: none; padding: ${dim("1_5")}; margin: -${dim("1_5")}; }
.ss-day .choice-tile__box { flex-direction: column; justify-content: center; gap: ${dim("0_5")}; padding: ${dim(2)} ${dim(1)}; text-align: center; }
.ss-day__dow { color: ${cv("text.secondary")}; ${typoCss(labelSm)} text-transform: ${labelSmCase}; letter-spacing: ${labelSm.letterSpacing}; }
.ss-day__num { color: ${cv("text.default")}; ${typoCss(style("heading-lg"))} }
.ss-day .choice-tile__description { ${typoCss(style("body-xs"))} }
.ss-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(${dim(56)}, 100%), 1fr)); gap: ${dim(2)}; }
.ss-slot .choice-tile__text { flex: 1; }
.ss-slot__formats { flex-shrink: 0; align-self: flex-start; display: flex; gap: ${dim(1)}; color: ${cv("icon.secondary")}; }
.ss-slot__formats svg { width: ${dim(4)}; height: ${dim(4)}; display: block; }
.ss-slots-head { display: flex; align-items: baseline; justify-content: space-between; gap: ${dim(3)}; }
.ss-slots-head__title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }

/* The summary card: what you've picked so far, then who and where, then the
   one action. Read-only rows are a definition list. */
.ss-facts { display: grid; grid-template-columns: auto 1fr; gap: ${dim(2)} ${dim(4)}; margin: 0; }
.ss-facts dt { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.ss-facts dd { margin: 0; text-align: right; color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.ss-facts dd.is-empty { color: ${cv("text.muted")}; font-weight: ${style("body-sm").fontWeight}; }
.ss-rule { height: 1px; background: ${R(card.divider)}; }
.ss-loc { display: flex; flex-direction: column; gap: ${dim(1)}; }
.ss-loc__text { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-sm"))} }
/* ============ Counter (onNeutral sm — on the Upcoming tab) ============ */
.counter { display: inline-flex; align-items: center; justify-content: center; height: ${D(counter.size.sm.height)}; min-width: ${D(counter.size.sm.minWidth)}; padding: 0 ${D(counter.size.sm.paddingX)}; border-radius: ${D(counter.radius)}; background: ${R(counter.onNeutral.state.inactive.bg)}; color: ${R(counter.onNeutral.state.inactive.label)}; ${typoCss(T(counter.size.sm.label))} }
.tab--active .counter { background: ${R(counter.onNeutral.state.active.bg)}; color: ${R(counter.onNeutral.state.active.label)}; }

/* ============ Button — danger (AlertDialog's confirm, Modal's own recipe) ============ */
/* Button danger — roles read from button.tokens.json (button.danger) */
.btn--danger { background: ${R(button.danger.state.default.fill)}; color: ${R(button.danger.state.default.label)}; }
.btn--danger .btn__icon { color: ${R(button.danger.state.default.icon)}; }
.btn--danger:not(:disabled):hover { background: ${R(button.danger.state.hover.fill)}; }
.btn--danger:not(:disabled):active { background: ${R(button.danger.state.pressed.fill)}; }

/* ============ Dialog + AlertDialog (native <dialog>) — as the DS ships them ============ */
/* Dialog (docs/dialog.html): header band (title, description, ×) and footer
   band, 16px vertical, hairlines inside; body scrolls. Size sm (480). */
dialog.dialog, dialog.alert-dialog { margin: auto; padding: 0; border: none; width: min(${D(modal.size.sm)}, calc(100vw - ${D(modal.viewportGutter)} * 2)); max-width: none; max-height: 85dvh; border-radius: ${D(modal.radius)}; background: ${R(modal.bg)}; box-shadow: ${shadowCss(modal.shadow)};
  opacity: 0; transform: scale(0.96); transition: opacity ${modalDur} ease, transform ${modalDur} ease, overlay ${modalDur} allow-discrete, display ${modalDur} allow-discrete; }
dialog.dialog[open], dialog.alert-dialog[open] { opacity: 1; transform: scale(1); }
@starting-style { dialog.dialog[open], dialog.alert-dialog[open] { opacity: 0; transform: scale(0.96); } }
dialog.dialog::backdrop, dialog.alert-dialog::backdrop { background: ${R(modal.overlay)}; opacity: 0; transition: opacity ${modalDur} ease allow-discrete; }
dialog.dialog[open]::backdrop, dialog.alert-dialog[open]::backdrop { opacity: 1; }
@starting-style { dialog.dialog[open]::backdrop, dialog.alert-dialog[open]::backdrop { opacity: 0; } }
html:has(dialog.dialog[open], dialog.alert-dialog[open]) { overflow: hidden; }
.dialog__content { display: flex; flex-direction: column; max-height: 85dvh; font-family: ${cv("family.sans")}; }
.dialog__header { flex-shrink: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: ${D(modal.gap)}; padding: ${D(modal.barPaddingY)} ${D(modal.padding)}; box-shadow: inset 0 -1px 0 ${R(modal.divider)}; }
.dialog__heading { display: flex; flex-direction: column; justify-content: center; gap: ${D(modal.headerGap)}; min-width: 0; min-height: ${D(button.ghost.size.sm.height)}; }
.dialog__title { margin: 0; color: ${R(modal.titleColor)}; ${typoCss(T(modal.title))} }
.dialog__description { margin: 0; color: ${R(modal.descriptionColor)}; ${typoCss(T(modal.description))} }
.dialog__body { flex: 1; overflow: auto; padding: ${D(modal.padding)}; }
.dialog__body-text { margin: 0; color: ${R(modal.bodyColor)}; ${typoCss(T(modal.body))} }
.dialog__footer { flex-shrink: 0; display: flex; gap: ${D(modal.gap)}; justify-content: flex-end; padding: ${D(modal.barPaddingY)} ${D(modal.padding)}; box-shadow: inset 0 1px 0 ${R(modal.divider)}; }
.dialog__close { flex-shrink: 0; width: ${D(button.ghost.size.sm.height)}; height: ${D(button.ghost.size.sm.height)}; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${D(button.ghost.radius)}; background: transparent; padding: 0; cursor: pointer; color: ${R(button.ghost.state.default.icon)}; }
.dialog__close:hover { background: ${R(button.ghost.state.hover.fill)}; }
.dialog__close:active { background: ${R(button.ghost.state.pressed.fill)}; }
.dialog__close:focus-visible { outline: ${D(button.ghost.state.focused.ringWidth)} solid ${R(button.ghost.state.focused.ringColor)}; outline-offset: ${D(button.ghost.state.focused.ringOffset)}; }
.dialog__close-icon { width: ${dim(4)}; height: ${dim(4)}; display: block; }
/* AlertDialog (docs/alert-dialog.html): one padded block — title over
   description over actions, no bands, no hairlines */
.alert-dialog__content { display: flex; flex-direction: column; gap: ${D(ad.actionsGap)}; max-height: 85dvh; overflow: auto; padding: ${D(modal.padding)}; font-family: ${cv("family.sans")}; }
.alert-dialog__text { display: flex; flex-direction: column; gap: ${D(ad.stackGap)}; }
.alert-dialog__title { margin: 0; color: ${R(modal.titleColor)}; ${typoCss(T(modal.title))} }
.alert-dialog__description { margin: 0; color: ${R(modal.bodyColor)}; ${typoCss(T(modal.body))} }
.alert-dialog__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: ${D(modal.gap)}; margin: 0; }
/* a text area on Input's own field recipe (fill + hairline → strong → focus) */
.ss-q { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-q__label { color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.ss-q__field { width: 100%; min-height: ${dim(24)}; resize: vertical; padding: ${dim(2)} ${D(input.size.base.paddingX)}; border-radius: ${D(input.radius)}; background: ${R(input.state.default.bg)}; border: 1px solid ${R(input.state.default.border)}; color: ${R(input.state.default.value)}; font-family: inherit; ${typoCss(T(input.size.base.value))} line-height: ${style("body-base").lineHeight}; }
.ss-q__field:hover { background: ${R(input.state.hover.bg)}; border-color: ${R(input.state.hover.border)}; }
.ss-q__field:focus { outline: none; border-color: ${R(input.state.focus.border)}; }
.ss-q__field::placeholder { color: ${R(input.state.default.placeholder)}; }

/* ============ My appointments (ss-appt*) ============ */
.ss-appts { display: flex; flex-direction: column; gap: ${dim(5)}; }
.ss-appt-group { display: flex; flex-direction: column; gap: ${dim(2)}; }
/* A row: time column, then what/who/where, then the actions. Flush rows in
   one Card from 768 — the browse list's shell; on a phone the shell goes
   edge to edge and the row stacks. */
.ss-appt { display: grid; grid-template-columns: ${dim(24)} minmax(0, 1fr) auto; gap: ${dim(1)} ${dim(4)}; align-items: start; padding: ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.ss-appt:last-child { border-bottom: none; }
.ss-appt__time { display: flex; flex-direction: column; gap: ${dim("0_5")}; }
.ss-appt__clock { color: ${cv("text.default")}; ${typoCss(style("heading-base"))} white-space: nowrap; }
.ss-appt__dur { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.ss-appt__main { display: flex; flex-direction: column; gap: ${dim(2)}; min-width: 0; }
.ss-appt__title { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.ss-appt__name { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
.ss-appt__meta { display: flex; flex-direction: column; gap: ${dim(1)}; }
/* where/who lines wrap (a long location on a phone), icon pinned to line one */
.ss-appt__meta .ss-fact { align-items: flex-start; }
.ss-appt__meta .ss-fact > svg { margin-top: 1px; }
.ss-appt__meta .ss-fact__text { white-space: normal; }
.ss-appt__actions { display: flex; flex-direction: column; align-items: flex-end; gap: ${dim(2)}; }
.ss-appt__btns { display: flex; gap: ${dim(2)}; }
@media (max-width: 767px) {
  .ss-appt { grid-template-columns: minmax(0, 1fr); gap: ${dim(3)}; }
  .ss-appt__time { flex-direction: row; align-items: baseline; gap: ${dim(2)}; }
  .ss-appt__actions { align-items: stretch; }
  .ss-appt__btns > .btn { flex: 1; }
}
/* check-in not open yet: a quiet note where the button will be */
.ss-note--icon { display: inline-flex; align-items: center; gap: ${dim(1)}; }
.ss-note--icon svg { width: ${dim(4)}; height: ${dim(4)}; color: ${cv("icon.secondary")}; flex-shrink: 0; }

/* ---- details page ---- */
.ss-detail { display: flex; flex-direction: column; gap: ${dim(4)}; max-width: 720px; }
/* The single-column detail pages (appointment, drop-in visit) are 720 wide —
   centred in the page column with their back link and title, not pinned to
   its left edge with 320px of nothing on the right. */
.ss-view[data-view="appt"], .ss-view[data-view="visit"] { width: 100%; max-width: 720px; margin-inline: auto; }
.ss-detail__title { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(3)}; }
.ss-dl { display: grid; grid-template-columns: ${dim(28)} minmax(0, 1fr); gap: ${dim(3)} ${dim(4)}; margin: 0; }
.ss-dl dt { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} padding-top: 1px; }
.ss-dl dd { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-base"))} min-width: 0; }
.ss-dl dd .ss-note { margin-top: ${dim("0_5")}; }
@media (max-width: 559px) { .ss-dl { grid-template-columns: minmax(0, 1fr); gap: ${dim("0_5")}; } .ss-dl dd { margin-bottom: ${dim(2)}; } }
.ss-ref { display: inline-flex; align-items: center; gap: ${dim(1)}; }
.ss-detail__section { display: flex; flex-direction: column; gap: ${dim(1)}; }
.ss-detail__section h3 { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.ss-detail__section p { margin: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-base"))} }
/* A card head with an action on the right: the ghost icon button's 32px is
   pulled into the title's line box, so the head keeps its height. */
.ss-card-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: ${dim(2)}; }
.ss-card-head__more { margin-block: -${dim("1_5")}; margin-inline-end: -${dim(2)}; }
/* ============ Menu (popover; one destructive item) ============ */
.menu { margin: 0; padding: ${D(menu.padding)}; border-radius: ${D(menu.radius)}; background: ${R(menu.bg)}; border: 1px solid ${R(menu.border)}; box-shadow: ${shadowCss(menu.shadow)}; font-family: ${cv("family.sans")}; min-width: ${dim(48)}; }
.menu__list { display: flex; flex-direction: column; gap: ${D(menu.gap)}; }
.menu__item { width: 100%; display: flex; align-items: center; gap: ${D(menu.itemGap)}; height: ${D(menu.itemHeight)}; padding: 0 ${D(menu.itemPaddingX)}; border: none; background: none; border-radius: ${D(menu.itemRadius)}; cursor: pointer; text-align: left; white-space: nowrap; color: ${R(menu.state.default.text)}; font-family: inherit; ${typoCss(T(menu.label))} }
.menu__icon { flex-shrink: 0; width: ${D(menu.iconSize)}; height: ${D(menu.iconSize)}; color: ${R(menu.state.default.icon)}; }
.menu__item:hover { background: ${R(menu.state.hover.bg)}; }
.menu__item:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: -${ringW}; }
.menu__item--destructive { color: ${R(menu.state.destructive.text)}; }
.menu__item--destructive .menu__icon { color: ${R(menu.state.destructive.icon)}; }
.menu__item--destructive:hover { background: ${R(menu.state.destructive.hoverBg)}; }
/* Box: sunken surface, md padding, the card's radius */
.ss-about { padding: ${D(box.padding.md)}; background: ${R(box.surface.sunken)}; border-radius: ${D(card.radius)}; }
.ss-detail__actions { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.ss-detail__actions .ss-push { margin-left: auto; }
@media (max-width: 559px) { .ss-detail__actions > .btn { flex: 1 1 100%; } .ss-detail__actions .ss-push { margin-left: 0; } }

/* ============ v6 — Book catalogue, workshop page, done screen ============ */
/* Workshop is the catalogue's third kind — the teal tag hue, so the three
   booking modes read apart: violet (appointment), green/blue (drop-in), teal. */
.badge--teal { background: ${R(badge.color.teal.tint.bg)}; color: ${R(badge.color.teal.tint.text)}; }
.ss-ws-badges { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.ss-choose--ws { gap: ${dim(6)}; }
.ss-step__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: ${dim(1)} ${dim(3)}; }
/* Schedules / dates: ChoiceTiles in a column — every option visible at once
   (the live app's dot carousel hid Schedule 2 and 3 behind a swipe). Seats
   left on the right; a full option is disabled with a Full badge. */
.ss-ws-options { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-ws-option .choice-tile__text { flex: 1; }
.ss-ws-option .choice-tile__description { white-space: normal; }
.ss-ws-option__seats { flex-shrink: 0; align-self: flex-start; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
/* Nothing to choose (one schedule / one date): the same facts, read-only. */
.ss-ws-fixed { padding: ${D(ct.paddingY)} ${D(ct.paddingX)}; display: flex; flex-direction: column; gap: ${D(ct.textGap)}; }
.ss-ws-fixed__label { margin: 0; color: ${R(ct.labelColor)}; ${typoCss(T(ct.label))} }
.ss-ws-fixed__desc { margin: 0; color: ${R(ct.descriptionColor)}; ${typoCss(T(ct.description))} }
/* The sessions of the chosen schedule: a numbered flush list in a Card. */
.ss-sessions { list-style: none; margin: 0; padding: 0; background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; }
.ss-session { display: grid; grid-template-columns: ${dim(6)} minmax(0, 1fr) auto; align-items: center; gap: ${dim(3)}; padding: ${dim(3)} ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.ss-session:last-child { border-bottom: none; }
.ss-session__num { color: ${cv("text.muted")}; ${typoCss(style("body-sm"))} }
.ss-session__date { color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.ss-session__time { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
/* the show-all trigger is the DS Collapsible trigger (tools/lib/collapsible.mjs) */
${COLLAPSIBLE_CSS}
/* Below 1024 the summary card falls under the choices, so Register rides in
   a bar pinned to the bottom of the screen instead of in the card's foot. */
.ss-cta-bar { display: none; }
@media (max-width: 1023px) {
  .ss-view[data-view="workshop"].is-active .ss-cta-bar { display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 2; padding: ${dim(3)} ${dim(4)} calc(${dim(3)} + env(safe-area-inset-bottom)); background: ${cv("surface.default")}; border-top: 1px solid ${cv("border.default")}; }
  .ss-view[data-view="workshop"] .ss-ws-foot { display: none; }
  .ss-view[data-view="workshop"].is-active { padding-bottom: ${dim(16)}; }
}
@media (min-width: 768px) and (max-width: 1023px) { .ss-view[data-view="workshop"].is-active .ss-cta-bar { padding-inline: ${dim(6)}; } }
/* Done: one centred Card — the check, what happened, the facts, what next. */
.ss-done { width: 100%; max-width: 560px; align-self: center; }
.ss-done__body { align-items: center; text-align: center; gap: ${dim(2)}; padding-top: ${dim(4)}; }
.ss-done__icon { display: flex; margin-bottom: ${dim(2)}; }
.ss-done__icon svg { width: ${dim(12)}; height: ${dim(12)}; color: ${cv("icon.success")}; }
.ss-done__facts { padding-top: ${D(card.gap)}; border-top: 1px solid ${R(card.divider)}; }
.ss-done__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: ${dim(2)}; }
@media (max-width: 559px) { .ss-done__actions > .btn { flex: 1 1 100%; } }

/* ============ Progress (determinate, base) ============ */
.progress { display: block; width: 100%; height: ${D(progress.sizes.base.height)}; overflow: hidden; border-radius: ${D(progress.radius)}; background: ${R(progress.track)}; }
.progress__bar { display: block; height: 100%; border-radius: ${D(progress.radius)}; background: ${R(progress.indicator)}; }

/* ============ Attachment (done — a file to download) ============ */
.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${D(att.gap)}; padding: ${D(att.padding)}; border-radius: ${D(att.radius)}; background: ${R(att.bg)}; border: 1px solid ${R(att.border)}; text-decoration: none; min-width: 0; }
.attachment__media { flex-shrink: 0; width: ${D(att.media.size)}; height: ${D(att.media.size)}; border-radius: ${D(att.media.radius)}; display: flex; align-items: center; justify-content: center; background: ${R(att.media.iconBg)}; }
.attachment__icon { width: ${D(att.media.iconSize)}; height: ${D(att.media.iconSize)}; color: ${R(att.media.iconColor)}; }
.attachment__content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: ${dim("0_5")}; }
.attachment__title { color: ${R(att.titleColor)}; ${typoCss(T(att.title))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { color: ${R(att.descriptionColor)}; ${typoCss(T(att.description))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__action-glyph { flex-shrink: 0; width: ${D(att.compact.iconSize)}; height: ${D(att.compact.iconSize)}; color: ${R(att.action.icon)}; }
.attachment--done { cursor: pointer; }
.attachment--done:hover { border-color: ${R(att.state.done.hoverBorder)}; }
.attachment--done:focus-visible { outline: ${D(att.state.done.ringWidth)} solid ${R(att.state.done.ringColor)}; outline-offset: ${D(att.state.done.ringOffset)}; }
/* files sit in a grid: two across from 560, one on a phone */
.ss-files { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(${dim(60)}, 100%), 1fr)); gap: ${dim(2)}; }

/* ============ Accordion (past sessions, inside a Card) ============ */
.accordion__item { border-bottom: 1px solid ${R(acc.item.divider)}; }
.accordion__item:last-child { border-bottom: none; }
.accordion__summary, .accordion__row { display: flex; align-items: center; gap: ${D(acc.item.gap)}; padding: ${D(acc.item.paddingY)} ${D(acc.item.paddingX)}; }
.accordion__summary { list-style: none; cursor: pointer; }
.accordion__summary::-webkit-details-marker { display: none; }
.accordion__summary:hover { background: ${R(acc.state.hover.bg)}; }
.accordion__summary:focus-visible { outline: ${D(acc.state.focused.ringWidth)} solid ${R(acc.state.focused.ringColor)}; outline-offset: -${D(acc.state.focused.ringWidth)}; }
.accordion__item:first-child .accordion__summary { border-radius: ${D(card.radius)} ${D(card.radius)} 0 0; }
.accordion__item:last-child:not([open]) .accordion__summary { border-radius: 0 0 ${D(card.radius)} ${D(card.radius)}; }
.accordion__title { flex: 1; min-width: 0; color: ${R(acc.titleColor)}; ${typoCss(T(acc.title))} }
.accordion__title--quiet { ${typoCss(T(acc.titleQuiet))} }
.accordion__meta { flex-shrink: 0; color: ${R(acc.metaColor)}; ${typoCss(T(acc.meta))} }
.accordion__chevron { flex-shrink: 0; width: ${D(acc.chevron.size)}; height: ${D(acc.chevron.size)}; color: ${R(acc.chevron.color)}; transition: transform 0.12s ease; }
.accordion__item[open] > .accordion__summary .accordion__chevron { transform: rotate(180deg); }
.accordion__body { display: flex; flex-direction: column; gap: ${D(acc.body.gap)}; padding: 0 ${D(acc.item.paddingX)} ${D(acc.body.paddingBottom)}; }
/* a row with nothing to open keeps the chevron's column, so badges line up */
.ss-acc-spacer { flex-shrink: 0; width: ${D(acc.chevron.size)}; }

/* ============ v6 — my workshop ============ */
.ss-mw-progress .card__body { gap: ${dim(3)}; }
.ss-mw-next { gap: ${dim(3)}; }
.ss-mw-next__when { display: flex; flex-direction: column; gap: ${dim("0_5")}; }
.ss-mw-next__date { color: ${cv("text.default")}; ${typoCss(style("heading-md"))} }
.ss-mw-next .ss-fact__text { white-space: normal; }
.ss-mw-next__actions { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
.ss-mw-next__actions .ss-push { margin-left: auto; }
/* coming-up rows: number · date over time · the row's action */
.ss-session--act { grid-template-columns: ${dim(6)} minmax(0, 1fr) auto; }
.ss-session__main { display: flex; flex-direction: column; gap: ${dim("0_5")}; min-width: 0; }
.ss-session__act { display: flex; align-items: center; gap: ${dim(2)}; }
.ss-mw-past__num { color: ${cv("text.muted")}; }
.ss-mw-note { margin: 0; color: ${cv("text.default")}; ${typoCss(style("body-base"))} }
@media (max-width: 559px) { .ss-mw-past__num { display: none; } }

/* ============ v6 — drop-in visit + queue banner ============ */
/* Alert success: an advisor is calling you */
.alert--success { background: ${R(alert.role.success.bg)}; border-color: ${R(alert.role.success.border)}; }
.alert--success .alert__icon { color: ${R(si.success.color)}; }
/* the banner: one line — status + desk, View on the right */
.ss-banner { align-items: center; }
.ss-banner .alert__stack { flex: 1; }
.ss-banner > .btn { flex-shrink: 0; }
.ss-visit { gap: ${dim(2)}; }
.ss-visit__title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-lg"))} }
.ss-visit__text { margin: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-base"))} }
.ss-visit .progress { margin-top: ${dim(2)}; }
.ss-v-rate { display: flex; flex-wrap: wrap; gap: ${dim(2)}; }
/* before joining: the optional fields, in their own band of the card */
.ss-pre-fields { padding-top: ${D(card.gap)}; border-top: 1px solid ${R(card.divider)}; gap: ${dim(4)}; }
.ss-field { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-field__label { color: ${cv("text.default")}; ${typoCss(style("heading-sm"))} }
.ss-field__opt { color: ${cv("text.muted")}; ${typoCss(style("body-sm"))} margin-inline-start: ${dim(1)}; }
.ss-field__select { width: min(100%, 400px); }
.ss-field__select .select__value { flex: 1; }
.ss-pre-go { min-width: ${dim(40)}; }
@media (max-width: 559px) { .ss-pre-go { flex: 1 1 100%; } }

/* ============ v6 — My schedule: List / Calendar ============ */
/* Tabs icon: segmented Tabs have no icon role of their own — the icon takes
   the label's colour in every state (state.*.label), by design. */
.tab__icon { flex-shrink: 0; width: ${D(tabs.size.sm.iconSize)}; height: ${D(tabs.size.sm.iconSize)}; color: currentColor; }
/* v6 top nav: three sections, centred in the band (the row still scrolls if
   it ever overflows). Calendar's tab exists from 768 only. */
.ss-sections--center { justify-content: center; }
.ss-sections--center .tabs--segmented { flex: 0 1 auto; }
@media (max-width: 767px) { .ss-tab--wide { display: none; } }
.ss-cal { display: flex; flex-direction: column; gap: ${dim(5)}; }
.ss-cal__month { gap: ${dim(3)}; }
.ss-cal__head { display: flex; align-items: center; justify-content: space-between; gap: ${dim(3)}; }
/* the month: 7 columns, DatePicker's weekday + day recipe, stretched */
.ss-cal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: ${dim(1)}; }
.ss-cal__dow { text-align: center; color: ${R(cal.weekday.color)}; ${typoCss(T(cal.weekday.label))} text-transform: ${labelSmCase}; letter-spacing: ${labelSm.letterSpacing}; padding-bottom: ${dim(1)}; }
.ss-cal__cell { display: flex; flex-direction: column; align-items: center; gap: ${dim(1)}; min-width: 0; min-height: ${dim(14)}; padding: ${dim(1)} 0; border: none; border-radius: ${D(cal.day.radius)}; background: transparent; cursor: pointer; font-family: inherit; }
.ss-cal__cell:hover { background: ${R(cal.day.hoverBg)}; }
.ss-cal__cell:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: -${ringW}; }
.ss-cal__num { display: inline-flex; align-items: center; justify-content: center; width: ${D(cal.day.size)}; height: ${D(cal.day.size)}; border-radius: ${D(cal.day.radius)}; color: ${R(cal.day.color)}; ${typoCss(T(cal.day.label))} }
.ss-cal__cell.is-outside .ss-cal__num { color: ${R(cal.day.outsideColor)}; }
.ss-cal__cell.is-today .ss-cal__num { box-shadow: inset 0 0 0 1px ${R(cal.day.todayBorder)}; }
.ss-cal__cell.is-selected .ss-cal__num { background: ${R(cal.day.selectedBg)}; color: ${R(cal.day.selectedText)}; box-shadow: none; }
.ss-cal__dots { display: flex; gap: ${dim(1)}; height: ${dim("1_5")}; }
.ss-cal__dot { width: ${dim("1_5")}; height: ${dim("1_5")}; border-radius: 50%; flex-shrink: 0; }
/* event colours = the Badges each kind wears elsewhere: violet, blue, teal */
.ss-cal__dot--appointment { background: ${R(badge.color.violet.solid.bg)}; }
.ss-cal__dot--dropin { background: ${R(badge.role.primary.solid.bg)}; }
.ss-cal__dot--workshop { background: ${R(badge.color.teal.solid.bg)}; }
.ss-cal__evs { display: none; }
.ss-cal__legend { display: flex; flex-wrap: wrap; gap: ${dim(2)} ${dim(4)}; border-top: 1px solid ${R(card.divider)}; padding-top: ${dim(3)}; }
.ss-cal__key { display: inline-flex; align-items: center; gap: ${dim("1_5")}; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.ss-cal__key .ss-cal__dot { width: ${dim(2)}; height: ${dim(2)}; }
/* The chosen day's rows in the 320px side card: the list's phone shape (one
   column, time inline, buttons stretched). The tablet drawer is full width,
   so it keeps the ordinary row. */
.ss-cal__side .ss-appt { grid-template-columns: minmax(0, 1fr); gap: ${dim(3)}; }
.ss-cal__side .ss-appt__time { flex-direction: row; align-items: baseline; gap: ${dim(2)}; }
.ss-cal__side .ss-appt__actions { align-items: stretch; }
.ss-cal__side .ss-appt__btns > .btn { flex: 1; }
.ss-cal__side .empty-state { padding: ${dim(6)} ${D(card.padding)}; }
/* The Calendar page is wider than the rest (1280, not 1040): beside the day
   card, the month still gets cells wide enough for its event chips. */
.ss__main:has(.ss-view[data-view="calendar"].is-active) { max-width: 1280px; }
/* Desktop: the month and the day side by side; the day card stays put. */
.ss-cal__side { display: none; }
@media (min-width: 1024px) {
  .ss-cal { display: grid; grid-template-columns: minmax(0, 1fr) ${dim(80)}; align-items: start; gap: ${dim(6)}; }
  .ss-cal__side { display: block; position: sticky; top: calc(${dim(16)} + ${D(tabs.size.base.height)} + ${dim(6)}); max-height: calc(100dvh - ${dim(16)} - ${D(tabs.size.base.height)} - ${dim(12)}); overflow-y: auto; }
}
/* Tablet: the day in a SlideOverPanel, bottom placement — edge-attached, its
   rounded top corners, shadow, scrim and 250ms slide; as tall as its rows, up
   to 80% of the screen. */
.ss-drawer { border: none; padding: 0; margin: 0; position: fixed; inset: auto 0 0 0; width: 100%; max-width: 100%; max-height: 80dvh; border-radius: ${D(drawer.bottomRadius)} ${D(drawer.bottomRadius)} 0 0; background: ${R(drawer.bg)}; box-shadow: ${shadowCss(drawer.shadow)}; font-family: ${cv("family.sans")}; }
.ss-drawer[open] { display: flex; flex-direction: column; transform: translateY(0); transition: transform ${px(h.resolveToken(drawer.transitionDuration))} ease; }
@starting-style { .ss-drawer[open] { transform: translateY(100%); } }
.ss-drawer::backdrop { background: ${R(drawer.overlay)}; }
html:has(.ss-drawer[open]) { overflow: hidden; }
.ss-drawer__head { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: ${D(drawer.gap)}; padding: ${dim(4)} ${D(drawer.padding)}; border-bottom: 1px solid ${R(drawer.divider)}; }
.ss-drawer__title { margin: 0; color: ${R(drawer.titleColor)}; ${typoCss(T(drawer.title))} }
.ss-drawer__head .btn--ghost { margin-inline-end: -${dim(2)}; }
.ss-drawer__body { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom); }
.ss-drawer .ss-appt { padding-inline: ${D(drawer.padding)}; }
@media (prefers-reduced-motion: reduce) { .ss-drawer[open] { transition: none; } }
/* from 768 a day shows its first two events as chips (time + title) */
@media (min-width: 768px) {
  .ss-cal__cell { align-items: stretch; min-height: ${dim(24)}; padding: ${dim(1)}; }
  .ss-cal__num { align-self: flex-start; }
  .ss-cal__dots { display: none; }
  .ss-cal__evs { display: flex; flex-direction: column; gap: ${dim("0_5")}; min-width: 0; }
  .ss-cal__ev { display: block; padding: 0 ${dim(1)}; border-radius: ${D(badge.radius)}; ${typoCss(style("body-xs"))} line-height: ${dim(4)}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
  .ss-cal__ev--appointment { background: ${R(badge.color.violet.tint.bg)}; color: ${R(badge.color.violet.tint.text)}; }
  .ss-cal__ev--dropin { background: ${R(badge.role.primary.tint.bg)}; color: ${R(badge.role.primary.tint.text)}; }
  .ss-cal__ev--workshop { background: ${R(badge.color.teal.tint.bg)}; color: ${R(badge.color.teal.tint.text)}; }
  .ss-cal__more { padding: 0 ${dim(1)}; color: ${cv("text.secondary")}; ${typoCss(style("body-xs"))} text-align: left; }
}
.is-hidden { display: none !important; }
`;
}

/** Colour roles the CSS above references directly (by name, not via a
 *  component token) — merged with every component token's role in the builder. */
export const SS_COLOR_PATHS = [
  "surface.page", "surface.default", "border.default", "border.focus",
  "text.default", "text.secondary", "text.muted", "icon.secondary", "fill.neutralHover",
  "fill.danger", "fill.dangerHover", "fill.dangerActive", "text.onFill", "icon.success",
];
