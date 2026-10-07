// CSS for the Student Scheduling prototype: every component recipe resolved
// from its own token file, plus the `ss-*` composition layer (section bar,
// page column, the browse list rows and the two-column pick-a-time layout).
//
// Same shape as ed-css.mjs — a function taking the builder's resolver helpers,
// so the resolver isn't copied a 46th time. Same rule too: resolve the role
// from the component's token file, never retype the role name.

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

  const { tabs, button, select, search, chip, listbox: lb, card, badge, pagination: pg, choiceTile: ct, radio, alert, toast, tooltip: tt, emptyState: es } = t;

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
  const tg = chip.toggle;

  // Row department + Pick a time are both base (40px): at sm the Select's fixed
  // 16px value (the iOS-zoom rule) out-weighed the sm button beside it.
  const selRow = { height: D(select.size.base.height), paddingX: D(select.size.base.paddingX), gap: D(select.size.base.gap), iconSize: D(select.size.base.iconSize), value: T(select.size.base.value), label: T(select.size.base.label), labelGap: D(select.size.base.labelGap) };
  const srch = { height: D(search.size.base.height), paddingX: D(search.size.base.paddingX), gap: D(search.size.base.gap), iconSize: D(search.size.base.iconSize), value: T(search.value) };
  const badgeSm = { height: D(badge.size.sm.height), paddingX: D(badge.size.sm.paddingX), radius: D(badge.radius), label: T(badge.size.sm.label) };

  const labelSm = style("label-sm");
  const labelSmCase = textExt("text-style.label-sm").textTransform || "none";

  const ttShow = h.resolveToken(tt.showDelay);

  return `
/* ============ page frame (ss-* composition) ============ */
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; color: ${cv("text.default")}; }
/* The section bar is Tabs underline, laid edge to edge under the topbar as
   one band — same white, same hairline, same gutters as the bar above, so the
   two read as one header. Sticky under the 64px topbar. Its height is the
   tab's own 40px: the hairline is the tabs' baseline, which each tab overlaps
   by 1px, so the band never sums to 41. */
.ss-sections { position: sticky; top: ${dim(16)}; z-index: 1; background: ${cv("surface.default")}; padding: 0 ${dim(2)}; }
.ss-sections .tabs--underline { width: 100%; }
@media (min-width: 768px) { .ss-sections { padding: 0 ${dim(4)}; } }
.ss__main { flex: 1; width: 100%; max-width: 1040px; margin: 0 auto; padding: ${dim(6)} ${dim(4)} ${dim(12)}; display: flex; flex-direction: column; gap: ${dim(6)}; }
@media (min-width: 768px) { .ss__main { padding: ${dim(8)} ${dim(6)} ${dim(16)}; } }
.ss-view { display: none; flex-direction: column; gap: ${dim(6)}; }
.ss-view.is-active { display: flex; }
.ss-head { display: flex; flex-direction: column; gap: ${dim("1_5")}; }
.ss-title { margin: 0; color: ${cv("text.default")}; ${typoCss(style("title-xl"))} }
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
.tabs--underline .tab { border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: ${D(tabs.segmented.pillRadius)} ${D(tabs.segmented.pillRadius)} 0 0; }
.tabs--underline .tab:not(.tab--active):not(:disabled):hover { background: ${cv("fill.neutralHover")}; color: ${R(tabs.underline.state.hover.label)}; }
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
.btn--secondary:disabled { color: ${R(button.secondary.state.disabled.label)}; }
.btn--secondary:disabled .btn__icon { color: ${R(button.secondary.state.disabled.icon)}; }
.btn--ghost { background: transparent; color: ${R(button.ghost.state.default.label)}; }
.btn--ghost .btn__icon { color: ${R(button.ghost.state.default.icon)}; }
.btn--ghost:not(:disabled):hover { background: ${R(button.ghost.state.hover.fill)}; }
.btn--ghost:not(:disabled):active { background: ${R(button.ghost.state.pressed.fill)}; }
.btn--ghost:disabled { color: ${R(button.ghost.state.disabled.label)}; }
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
.card { background: ${R(card.bg)}; border: 1px solid ${R(card.border)}; border-radius: ${D(card.radius)}; }
.card__head { padding: ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.card__title { margin: 0; color: ${R(card.titleColor)}; ${typoCss(T(card.title))} }
.card__body { padding: ${D(card.padding)}; display: flex; flex-direction: column; gap: ${D(card.gap)}; }
.card__foot { padding: ${D(card.padding)}; border-top: 1px solid ${R(card.divider)}; }

/* ============ Badge ============ */
.badge { display: inline-flex; align-items: center; flex-shrink: 0; height: ${badgeSm.height}; padding: 0 ${badgeSm.paddingX}; border-radius: ${badgeSm.radius}; white-space: nowrap; ${typoCss(badgeSm.label)} }
.badge--base { height: ${D(badge.size.base.height)}; padding: 0 ${D(badge.size.base.paddingX)}; ${typoCss(T(badge.size.base.label))} }
/* outline: white + hairline (inside the box, so the height holds) + default text */
.badge--outline { background: ${R(badge.outline.bg)}; border: 1px solid ${R(badge.outline.border)}; color: ${R(badge.outline.text)}; }
.badge--regular { font-weight: ${resolve(badge.regular.fontWeight.$value)}; }
.badge--violet { background: ${R(badge.color.violet.tint.bg)}; color: ${R(badge.color.violet.tint.text)}; }
${["neutral", "primary", "success"].map((r) => `.badge--${r} { background: ${R(badge.role[r].tint.bg)}; color: ${R(badge.role[r].tint.text)}; }`).join("\n")}

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
.radio-group__label { padding: 0; color: ${R(radio.group.labelColor)}; ${typoCss(T(radio.group.label))} }
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
.alert__icon { flex-shrink: 0; width: ${D(alert.iconSize)}; height: ${D(alert.iconSize)}; color: ${R(alert.role.info.icon)}; }
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
.toast { position: fixed; inset: auto; top: ${D(toast.offsetTop)}; left: 50%; transform: translateX(-50%); margin: 0; display: flex; align-items: center; gap: ${D(toast.gap)}; padding: ${D(toast.paddingY)} ${D(toast.paddingX)}; border-radius: ${D(toast.radius)}; background: ${R(toast.bg)}; border: 1px solid ${R(toast.border)}; box-shadow: ${shadowCss(toast.shadow)}; font-family: ${cv("family.sans")}; max-width: calc(100vw - ${dim(8)}); }
.toast__icon { flex-shrink: 0; width: ${D(toast.iconSize)}; height: ${D(toast.iconSize)}; color: ${R(toast.role.success.icon)}; }
.toast__label { color: ${R(toast.labelColor)}; ${typoCss(T(toast.label))} }
.toast:popover-open { opacity: 1; translate: 0 0; transition: opacity 0.18s ease, translate 0.18s ease; }
@starting-style { .toast:popover-open { opacity: 0; translate: 0 -${dim(2)}; } }

/* ============ browse (ss-*) ============ */
/* Search on its own line on a phone; from 768 it shares one row with the
   filters. Sort is NOT in this row — it orders the results, it doesn't narrow
   them, so it sits on the results line beside the count. */
.ss-tools { display: flex; flex-direction: column; gap: ${dim(3)}; }
.ss-filters { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; }
@media (min-width: 768px) {
  .ss-tools { flex-direction: row; align-items: center; }
  .ss-tools .search { flex: 1; min-width: 0; max-width: 360px; }
}
.ss-results { display: flex; flex-direction: column; gap: ${dim(2)}; }
.ss-results__bar { display: flex; align-items: center; min-height: ${bSm.height}; }
/* Sort sits at the list's left edge; pulled out by the ghost button's own
   padding so its icon lines up with the card edge, not with its padding box. */
.ss-results__bar .btn--ghost { margin-inline-start: -${bSm.paddingX}; }
/* Rows, not boxes: one Card, flush, rows divided by its own hairline. */
.ss-list { overflow: hidden; }
.ss-svc { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)} ${dim(4)}; padding: ${D(card.padding)}; border-bottom: 1px solid ${R(card.divider)}; }
.ss-svc:last-child { border-bottom: none; }
.ss-svc__main { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: ${dim(1)}; }
.ss-svc__name { margin: 0; color: ${cv("text.default")}; ${typoCss(style("heading-base"))} }
.ss-svc__meta { display: flex; flex-wrap: wrap; align-items: center; gap: ${dim(2)}; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.ss-svc__aside { display: flex; align-items: center; gap: ${dim(2)}; min-width: 0; margin-left: auto; }
.ss-svc__aside .select { max-width: 240px; }
/* On a phone the department picker and the action share a row of their own,
   the action pushed right — the name never has to fight them for width. */
@media (max-width: 559px) {
  .ss-svc__aside { flex: 1 1 100%; justify-content: flex-end; }
  .ss-svc__aside .select { flex: 1; min-width: 0; max-width: none; }
}
/* v4/v5 pick page: the department Select sits above the week. */
.ss-pick-dept { align-self: flex-start; width: min(100%, 320px); }
/* ---- v4: one item, two shapes ----
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
/* duration: 16px icon + body-sm text */
.ss-fact { display: flex; align-items: center; gap: ${dim("1_5")}; min-width: 0; }
.ss-fact > svg { flex-shrink: 0; width: ${dim(4)}; height: ${dim(4)}; color: ${cv("icon.secondary")}; }
.ss-fact__text { color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} white-space: nowrap; }
.ss-item__cta { width: 100%; }
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
.is-hidden { display: none !important; }
`;
}

/** Colour roles the CSS above references directly (by name, not via a
 *  component token) — merged with every component token's role in the builder. */
export const SS_COLOR_PATHS = [
  "surface.page", "surface.default", "border.default", "border.focus",
  "text.default", "text.secondary", "text.muted", "icon.secondary", "fill.neutralHover",
];
