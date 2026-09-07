// CSS for the Explore Degrees prototype: every component recipe resolved from
// its own token file, plus the `ed-*` composition layer (page shell, wizard
// chrome, the grids and the results layout).
//
// Split out of the builder for size, and shaped as a function taking the
// builder's own resolver helpers rather than re-implementing them — this repo
// already carries the resolver inlined in ~45 builders, and adding a 46th copy
// inside a lib would be worse than passing four functions.
//
// Read this file's own header note before adding a recipe: the rule that has
// caught real bugs three times is **resolve the role from the component's own
// token file, never retype the role name**. Everything below follows it.

/** @param h  { tokens, resolve, cv, px, refPath, typoCss, textExt } */
export function edCss(h) {
  const { tokens: t, resolve, cv, px, refPath, typoCss, textExt } = h;

  // ---- Stepper — the wizard's own progress, per the user's correction that
  // this is Stepper's job and not a new Progress variant ----
  const stp = t.stepper;
  const stpCircle = px(resolve(stp.circle.size.$value));
  const stpText = resolveTypo(stp.text);
  const stpNum = resolveTypo(stp.circle.label);

  // ---- ChoiceTile ----
  const ct = t.choiceTile;
  const ctSt = ct.state;

  // ---- Card / Alert / Accordion / Progress / Spinner ----
  const card = t.card, alert = t.alert, acc = t.accordion, pg = t.progress, sp = t.spinner;
  const badge = t.badge, chip = t.chip, lb = t.listbox, table = t.table;
  const button = t.button, input = t.input, select = t.select, search = t.search;
  const es = t.emptyState, avatar = t.avatar;

  function resolveTypo(node) { return h.resolveToken(node); }

  const btn = (variant, size) => ({
    height: px(resolve(button[variant].size[size].height.$value)),
    paddingX: px(resolve(button[variant].size[size].paddingX.$value)),
    gap: px(resolve(button[variant].size[size].gap.$value)),
    iconSize: px(resolve(button[variant].size[size].iconSize.$value)),
    label: h.resolveToken(button[variant].size[size].label),
  });
  const primaryBase = btn("primary", "base"), secondaryBase = btn("secondary", "base");
  const secondarySm = btn("secondary", "sm"), ghostSm = btn("ghost", "sm");
  const ringW = px(resolve(button.primary.state.focused.ringWidth.$value));
  const ringO = px(resolve(button.primary.state.focused.ringOffset.$value));

  const fieldSm = {
    height: px(resolve(input.size.sm.height.$value)),
    paddingX: px(resolve(input.size.sm.paddingX.$value)),
    value: h.resolveToken(input.size.sm.value),
  };
  const selSm = {
    height: px(resolve(select.size.sm.height.$value)),
    paddingX: px(resolve(select.size.sm.paddingX.$value)),
    gap: px(resolve(select.size.sm.gap.$value)),
    iconSize: px(resolve(select.size.sm.iconSize.$value)),
    value: h.resolveToken(select.size.sm.value),
  };
  const selBase = {
    height: px(resolve(select.size.base.height.$value)),
    paddingX: px(resolve(select.size.base.paddingX.$value)),
    gap: px(resolve(select.size.base.gap.$value)),
    iconSize: px(resolve(select.size.base.iconSize.$value)),
    value: h.resolveToken(select.size.base.value),
  };
  const srch = {
    height: px(resolve(search.size.base.height.$value)),
    paddingX: px(resolve(search.size.base.paddingX.$value)),
    gap: px(resolve(search.size.base.gap.$value)),
    iconSize: px(resolve(search.size.base.iconSize.$value)),
    // Search declares its value type ONCE at the component root, not per size
    // (Input/Select do it per size) — resolve it where it actually lives.
    value: h.resolveToken(search.value),
  };
  const badgeSm = {
    height: px(resolve(badge.size.sm.height.$value)),
    paddingX: px(resolve(badge.size.sm.paddingX.$value)),
    radius: px(resolve(badge.radius.$value)),
    label: h.resolveToken(badge.size.sm.label),
  };
  const shadow = h.resolveToken(lb.shadow);
  const lbShadow = `${px(shadow.offsetX)} ${px(shadow.offsetY)} ${px(shadow.blur)} ${px(shadow.spread)} ${shadow.color}`;

  const labelSm = h.resolveToken(h.get("text-style.label-sm"));
  const labelSmCase = textExt("text-style.label-sm").textTransform || "none";
  const linkSmDeco = textExt("text-style.link-sm").textDecoration || "none";

  return `
/* ============ page shell + wizard chrome (ed-* composition) ============ */
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; }
.ed { min-height: 100%; display: flex; flex-direction: column; }

/* This flow is PUBLIC — "No account needed" — so it does NOT wear the logged-in
   portal's shell (logo + settings). Its own header is what the reference shows:
   the wizard's name, the school, and that reassurance on the right. */
.ed__topbar { flex-shrink: 0; height: ${px(resolve("dim.16"))}; display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.3"))}; padding: 0 ${px(resolve("dim.4"))}; border-bottom: 1px solid ${cv("border.default")}; }
@media (min-width: 768px) { .ed__topbar { padding: 0 ${px(resolve("dim.6"))}; } }
.ed__brand { display: flex; align-items: baseline; gap: ${px(resolve("dim.1"))}; min-width: 0; }
.ed__brand-name { color: ${cv("text.primary")}; ${typoCss(h.resolveToken(h.get("text-style.heading-md")))} }
.ed__brand-school { color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-base")))} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed__noaccount { flex-shrink: 0; color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed__main { flex: 1; width: 100%; max-width: 880px; margin: 0 auto; padding: ${px(resolve("dim.6"))} ${px(resolve("dim.4"))} ${px(resolve("dim.10"))}; display: flex; flex-direction: column; gap: ${px(resolve("dim.6"))}; }
@media (min-width: 768px) { .ed__main { padding: ${px(resolve("dim.8"))} ${px(resolve("dim.6"))} ${px(resolve("dim.12"))}; } }
.ed__head { display: flex; flex-direction: column; gap: ${px(resolve("dim.1_5"))}; }
.ed__title { margin: 0; color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.title-2xl")))} }
.ed__sub { margin: 0; color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-base")))} }
.ed__step { display: none; flex-direction: column; gap: ${px(resolve("dim.6"))}; }
.ed__step.is-active { display: flex; }
.ed__footer { display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.3"))}; }
.ed__footer--end { justify-content: flex-end; }
/* One card per screen; inside it, sections are separated by a divider and a
   heading — never by another nested card. That stacking is what made the
   reference read as a pile. */
.ed-section { display: flex; flex-direction: column; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve(card.padding.$value))} 0 0; border-top: 1px solid ${cv(refPath(card.divider.$value))}; }
.ed-section:first-child { padding-top: 0; border-top: none; }
.ed-section__title { color: ${cv(refPath(card.titleColor.$value))}; ${typoCss(h.resolveToken(card.title))} }
.ed-section__hint { color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-note { color: ${cv("text.muted")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-eyebrow { color: ${cv("text.secondary")}; ${typoCss(labelSm)} text-transform: ${labelSmCase}; letter-spacing: ${labelSm.letterSpacing}; }
.ed-grid { display: grid; gap: ${px(resolve("dim.2"))}; grid-template-columns: 1fr; }
@media (min-width: 560px) { .ed-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 880px) { .ed-grid { grid-template-columns: repeat(3, 1fr); } }
.ed-row { display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.2"))}; align-items: center; }
.ed-stack { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.ed-scroll { max-height: 420px; overflow-y: auto; padding-right: ${px(resolve("dim.1"))}; }
/* Prototype-only scaffolding, marked as such — the same treatment the Message
   Center's fake keyboard gets. */
.ed-scaffold { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.2"))} ${px(resolve("dim.3"))}; border: 1px dashed ${cv("border.strong")}; border-radius: ${px(resolve(card.radius.$value))}; color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }

/* ============ Card ============ */
.card { background: ${cv(refPath(card.bg.$value))}; border: 1px solid ${cv(refPath(card.border.$value))}; border-radius: ${px(resolve(card.radius.$value))}; }
.card__body { padding: ${px(resolve(card.padding.$value))}; display: flex; flex-direction: column; gap: ${px(resolve(card.gap.$value))}; }
.card__head { display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve(card.padding.$value))}; border-bottom: 1px solid ${cv(refPath(card.divider.$value))}; }
.card__title { color: ${cv(refPath(card.titleColor.$value))}; ${typoCss(h.resolveToken(card.title))} }
.card--flush > .card__body { padding: 0; gap: 0; }

/* ============ Stepper ============ */
.stepper { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; }
.stepper__step { display: flex; align-items: center; gap: ${px(resolve(stp.gap.$value))}; }
.stepper__circle { flex-shrink: 0; width: ${stpCircle}; height: ${stpCircle}; border-radius: ${px(resolve("radius.full"))}; display: inline-flex; align-items: center; justify-content: center; ${typoCss(stpNum)} background: ${cv(refPath(stp.state.inactive.circleBg.$value))}; color: ${cv(refPath(stp.state.inactive.circleText.$value))}; }
.stepper__circle svg { width: ${px(resolve(stp.circle.iconSize.$value))}; height: ${px(resolve(stp.circle.iconSize.$value))}; display: none; }
.stepper__label { color: ${cv(refPath(stp.state.inactive.labelColor.$value))}; ${typoCss(stpText)} }
.stepper__connector { flex: 1; height: ${px(resolve(stp.connector.thickness.$value))}; background: ${cv(refPath(stp.connector.color.$value))}; border-radius: ${px(resolve("radius.full"))}; }
.stepper__step.is-active .stepper__circle { background: ${cv(refPath(stp.state.active.circleBg.$value))}; color: ${cv(refPath(stp.state.active.circleText.$value))}; }
.stepper__step.is-active .stepper__label { color: ${cv(refPath(stp.state.active.labelColor.$value))}; }
.stepper__step.is-complete .stepper__circle { background: ${cv(refPath(stp.state.complete.circleBg.$value))}; color: ${cv(refPath(stp.state.complete.circleIcon.$value))}; }
.stepper__step.is-complete .stepper__circle span { display: none; }
.stepper__step.is-complete .stepper__circle svg { display: block; }
.stepper__step.is-complete .stepper__label { color: ${cv(refPath(stp.state.complete.labelColor.$value))}; }
.stepper__connector.is-complete { background: ${cv(refPath(stp.connector.completeColor.$value))}; }
/* the labels are the first thing to go when there's no room for them */
@media (max-width: 640px) { .stepper__label { display: none; } }

/* ============ ChoiceTile ============ */
.choice-tile { display: block; position: relative; cursor: pointer; }
.choice-tile__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.choice-tile__box { height: 100%; display: flex; align-items: center; gap: ${px(resolve(ct.gap.$value))}; padding: ${px(resolve(ct.paddingY.$value))} ${px(resolve(ct.paddingX.$value))}; border-radius: ${px(resolve(ct.radius.$value))}; background: ${cv(refPath(ctSt.default.bg.$value))}; border: 1px solid ${cv(refPath(ctSt.default.border.$value))}; }
.choice-tile__marker { flex-shrink: 0; width: ${px(resolve(ct.marker.size.$value))}; height: ${px(resolve(ct.marker.size.$value))}; border-radius: ${px(resolve(avatar.squareRadius.$value))}; display: inline-flex; align-items: center; justify-content: center; text-transform: uppercase; ${typoCss(h.resolveToken(avatar.size.base.initials))} }
.choice-tile__marker svg { width: ${px(resolve(ct.marker.iconSize.$value))}; height: ${px(resolve(ct.marker.iconSize.$value))}; }
.choice-tile__text { display: flex; flex-direction: column; gap: ${px(resolve(ct.textGap.$value))}; min-width: 0; }
.choice-tile__label { color: ${cv(refPath(ct.labelColor.$value))}; ${typoCss(h.resolveToken(ct.label))} }
.choice-tile__description { color: ${cv(refPath(ct.descriptionColor.$value))}; ${typoCss(h.resolveToken(ct.description))} }
.choice-tile:hover .choice-tile__input:not(:checked):not(:disabled) ~ .choice-tile__box { background: ${cv(refPath(ctSt.hover.bg.$value))}; border-color: ${cv(refPath(ctSt.hover.border.$value))}; }
.choice-tile__input:checked ~ .choice-tile__box { background: ${cv(refPath(ctSt.selected.bg.$value))}; border-color: ${cv(refPath(ctSt.selected.border.$value))}; }
.choice-tile__input:focus-visible ~ .choice-tile__box { outline: ${px(resolve(ctSt.focused.ringWidth.$value))} solid ${cv(refPath(ctSt.focused.ringColor.$value))}; outline-offset: ${px(resolve(ctSt.focused.ringOffset.$value))}; }
.choice-tile__input:disabled ~ .choice-tile__box { background: ${cv(refPath(ctSt.disabled.bg.$value))}; cursor: default; }
.choice-tile__input:disabled ~ .choice-tile__box .choice-tile__label { color: ${cv(refPath(ctSt.disabled.label.$value))}; }

/* ============ Alert ============ */
.alert { display: flex; align-items: flex-start; gap: ${px(resolve(alert.gap.$value))}; padding: ${px(resolve(alert.paddingY.$value))} ${px(resolve(alert.paddingX.$value))}; border-radius: ${px(resolve(alert.radius.$value))}; border: 1px solid transparent; }
.alert__icon { flex-shrink: 0; width: ${px(resolve(alert.iconSize.$value))}; height: ${px(resolve(alert.iconSize.$value))}; }
.alert__stack { display: flex; flex-direction: column; gap: ${px(resolve(alert.stackGap.$value))}; min-width: 0; }
.alert__message { margin: 0; color: ${cv(refPath(alert.bodyColor.$value))}; ${typoCss(h.resolveToken(alert.body))} }
.alert__title { color: ${cv(refPath(alert.titleColor.$value))}; font-weight: ${h.resolveToken(alert.title).fontWeight}; }
.alert__detail { margin: 0; color: ${cv(refPath(alert.detailColor.$value))}; ${typoCss(h.resolveToken(alert.detail))} }
.alert__action { margin-top: ${px(resolve(alert.stackGap.$value))}; }
${["info", "success", "warning", "danger"].map((r) => `.alert--${r} { background: ${cv(refPath(alert.role[r].bg.$value))}; border-color: ${cv(refPath(alert.role[r].border.$value))}; }
.alert--${r} .alert__icon { color: ${cv(refPath(alert.role[r].icon.$value))}; }`).join("\n")}

/* ============ Spinner / Progress ============ */
.spinner { display: inline-block; flex-shrink: 0; border-style: solid; border-color: ${cv(refPath(sp.track.$value))}; border-top-color: ${cv(refPath(sp.indicator.$value))}; border-radius: ${px(resolve("radius.full"))}; animation: ed-spin ${sp.duration.$value} linear infinite; }
.spinner--sm { width: ${px(resolve(sp.sizes.sm.size.$value))}; height: ${px(resolve(sp.sizes.sm.size.$value))}; border-width: ${px(resolve(sp.sizes.sm.thickness.$value))}; }
.spinner--lg { width: ${px(resolve(sp.sizes.lg.size.$value))}; height: ${px(resolve(sp.sizes.lg.size.$value))}; border-width: ${px(resolve(sp.sizes.lg.thickness.$value))}; }
@keyframes ed-spin { to { transform: rotate(360deg); } }
.progress { display: block; width: 100%; overflow: hidden; border-radius: ${px(resolve(pg.radius.$value))}; background: ${cv(refPath(pg.track.$value))}; }
.progress--sm { height: ${px(resolve(pg.sizes.sm.height.$value))}; }
.progress--base { height: ${px(resolve(pg.sizes.base.height.$value))}; }
.progress__bar { display: block; height: 100%; border-radius: ${px(resolve(pg.radius.$value))}; background: ${cv(refPath(pg.indicator.$value))}; }
.progress--indeterminate .progress__bar { width: ${px(pg.indeterminate.sliverWidth.$value)}; animation: ed-slide ${pg.indeterminate.duration.$value} ease-in-out infinite; }
@keyframes ed-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
/* full-page veil for the roadmap build — a composition, not a component */
.ed-veil { position: fixed; inset: 0; z-index: 20; display: none; flex-direction: column; align-items: center; justify-content: center; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.6"))}; background: ${cv("surface.default")}; text-align: center; }
.ed-veil.is-active { display: flex; }
.ed-veil__title { color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.heading-md")))} }
.ed-veil__hint { color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-veil__bar { width: 100%; max-width: 320px; }

/* ============ Accordion ============ */
.accordion__item { border-bottom: 1px solid ${cv(refPath(acc.item.divider.$value))}; }
.accordion__item:last-child { border-bottom: none; }
.accordion__summary { list-style: none; display: flex; align-items: center; gap: ${px(resolve(acc.item.gap.$value))}; padding: ${px(resolve(acc.item.paddingY.$value))} ${px(resolve(acc.item.paddingX.$value))}; cursor: pointer; }
.accordion__summary::-webkit-details-marker { display: none; }
.accordion__summary:hover { background: ${cv(refPath(acc.state.hover.bg.$value))}; }
.accordion__summary:focus-visible { outline: ${px(resolve(acc.state.focused.ringWidth.$value))} solid ${cv(refPath(acc.state.focused.ringColor.$value))}; outline-offset: calc(-1 * ${px(resolve(acc.state.focused.ringWidth.$value))}); }
.accordion__status { flex-shrink: 0; width: ${px(resolve(acc.chevron.size.$value))}; height: ${px(resolve(acc.chevron.size.$value))}; }
.accordion__status--done { color: ${cv("status.success")}; }
.accordion__status--todo { color: ${cv("icon.muted")}; }
.accordion__title { flex: 1; min-width: 0; color: ${cv(refPath(acc.titleColor.$value))}; ${typoCss(h.resolveToken(acc.title))} }
.accordion__meta { flex-shrink: 0; color: ${cv(refPath(acc.metaColor.$value))}; ${typoCss(h.resolveToken(acc.meta))} }
.accordion__chevron { flex-shrink: 0; width: ${px(resolve(acc.chevron.size.$value))}; height: ${px(resolve(acc.chevron.size.$value))}; color: ${cv(refPath(acc.chevron.color.$value))}; transition: transform 0.12s ease; }
.accordion__item[open] > .accordion__summary .accordion__chevron { transform: rotate(180deg); }
.accordion__body { display: flex; flex-direction: column; gap: ${px(resolve(acc.body.gap.$value))}; padding: 0 ${px(resolve(acc.item.paddingX.$value))} ${px(resolve(acc.body.paddingBottom.$value))}; }

/* ============ Badge ============ */
.badge { display: inline-flex; align-items: center; flex-shrink: 0; height: ${badgeSm.height}; padding: 0 ${badgeSm.paddingX}; border-radius: ${badgeSm.radius}; ${typoCss(badgeSm.label)} }
${["neutral", "primary", "success", "warning"].map((r) => `.badge--${r} { background: ${cv(refPath(badge.role[r].tint.bg.$value))}; color: ${cv(refPath(badge.role[r].tint.text.$value))}; }`).join("\n")}
.badge--info { background: ${cv(refPath(badge.role.primary.tint.bg.$value))}; color: ${cv(refPath(badge.role.primary.tint.text.$value))}; }

/* ============ Chip (meta variant) ============ */
.chip { display: inline-flex; align-items: center; border-radius: ${px(resolve(chip.radius.$value))}; border: 1px solid ${cv("border.default")}; background: ${cv("surface.default")}; height: ${px(resolve(chip.size.base.height.$value))}; padding: 0 ${px(resolve(chip.size.base.paddingX.$value))}; gap: ${px(resolve(chip.meta.gap.$value))}; color: ${cv("text.default")}; ${typoCss(h.resolveToken(chip.size.base.label))} }
.chip__meta-action { flex-shrink: 0; border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; color: ${cv(refPath(chip.meta.action.color.$value))}; ${typoCss(h.resolveToken(chip.meta.action.label))} }
.chip__meta-action:hover { color: ${cv(refPath(chip.meta.action.hoverColor.$value))}; }
.chip__remove { flex-shrink: 0; width: ${px(resolve(chip.size.base.iconSize.$value))}; height: ${px(resolve(chip.size.base.iconSize.$value))}; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${px(resolve("radius.default"))}; background: transparent; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.chip__remove:hover { background: ${cv("fill.neutralHover")}; }
.chip__remove svg { width: 100%; height: 100%; }

/* ============ Button ============ */
.btn { display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-family: inherit; border-radius: ${px(resolve(button.primary.radius.$value))}; }
.btn:disabled { cursor: default; }
.btn__icon { flex-shrink: 0; }
.btn--primary { background: ${cv(refPath(button.primary.state.default.fill.$value))}; color: ${cv(refPath(button.primary.state.default.label.$value))}; }
.btn--primary:not(:disabled):hover { background: ${cv(refPath(button.primary.state.hover.fill.$value))}; }
.btn--primary:not(:disabled):active { background: ${cv(refPath(button.primary.state.pressed.fill.$value))}; }
.btn--primary:disabled { background: ${cv(refPath(button.primary.state.disabled.fill.$value))}; color: ${cv(refPath(button.primary.state.disabled.label.$value))}; }
.btn--secondary { background: ${cv(refPath(button.secondary.state.default.fill.$value))}; color: ${cv(refPath(button.secondary.state.default.label.$value))}; }
.btn--secondary:not(:disabled):hover { background: ${cv(refPath(button.secondary.state.hover.fill.$value))}; }
.btn--secondary:not(:disabled):active { background: ${cv(refPath(button.secondary.state.pressed.fill.$value))}; }
.btn--secondary:disabled { color: ${cv(refPath(button.secondary.state.disabled.label.$value))}; }
.btn--ghost { background: transparent; color: ${cv(refPath(button.ghost.state.default.label.$value))}; }
.btn--ghost:not(:disabled):hover { background: ${cv(refPath(button.ghost.state.hover.fill.$value))}; }
.btn--ghost .btn__icon { color: ${cv(refPath(button.ghost.state.default.icon.$value))}; }
.btn--base { height: ${primaryBase.height}; padding: 0 ${primaryBase.paddingX}; gap: ${primaryBase.gap}; ${typoCss(primaryBase.label)} }
.btn--base .btn__icon { width: ${primaryBase.iconSize}; height: ${primaryBase.iconSize}; }
.btn--sm { height: ${secondarySm.height}; padding: 0 ${secondarySm.paddingX}; gap: ${secondarySm.gap}; ${typoCss(secondarySm.label)} }
.btn--sm .btn__icon { width: ${secondarySm.iconSize}; height: ${secondarySm.iconSize}; }
.btn--icon-only.btn--sm { width: ${secondarySm.height}; padding: 0; }
.btn--block { width: 100%; }
.btn--primary .btn__icon, .btn--secondary .btn__icon { color: currentColor; }
.btn:focus-visible { outline: ${ringW} solid ${cv("border.focus")}; outline-offset: ${ringO}; }

/* ============ fields: Input / Select / Search ============ */
.field { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv(refPath(input.state.default.bg.$value))}; border: 1px solid ${cv(refPath(input.state.default.border.$value))}; border-radius: ${px(resolve(input.radius.$value))}; font-family: inherit; }
.field:hover { background: ${cv(refPath(input.state.hover.bg.$value))}; border-color: ${cv(refPath(input.state.hover.border.$value))}; }
.field:focus-within { border-color: ${cv(refPath(input.state.focus.border.$value))}; }
.field--sm { height: ${fieldSm.height}; padding: 0 ${fieldSm.paddingX}; }
.field__control { border: none; outline: none; background: transparent; padding: 0; width: 100%; min-width: 0; color: ${cv("text.default")}; ${typoCss(fieldSm.value)} font-family: inherit; }
.field__control::placeholder { color: ${cv(refPath(input.state.default.placeholder.$value))}; }
.select { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv(refPath(select.state.default.bg.$value))}; border: 1px solid ${cv(refPath(select.state.default.border.$value))}; border-radius: ${px(resolve(select.radius.$value))}; cursor: pointer; text-align: left; font-family: inherit; }
.select:hover { background: ${cv(refPath(select.state.hover.bg.$value))}; border-color: ${cv(refPath(select.state.hover.border.$value))}; }
.select:focus-visible { outline: none; border-color: ${cv(refPath(select.state.focus.border.$value))}; }
.select--base { height: ${selBase.height}; padding: 0 ${selBase.paddingX}; gap: ${selBase.gap}; }
.select--base .select__chevron { width: ${selBase.iconSize}; height: ${selBase.iconSize}; }
.select--sm { height: ${selSm.height}; padding: 0 ${selSm.paddingX}; gap: ${selSm.gap}; }
.select--sm .select__chevron { width: ${selSm.iconSize}; height: ${selSm.iconSize}; }
.select__value { flex: 1; min-width: 0; color: ${cv("text.default")}; ${typoCss(selBase.value)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.select--sm .select__value { ${typoCss(selSm.value)} }
.select__value.is-placeholder { color: ${cv(refPath(select.state.default.placeholder.$value))}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; }
.select--block { display: flex; width: 100%; }
.search { display: flex; align-items: center; box-sizing: border-box; width: 100%; height: ${srch.height}; padding: 0 ${srch.paddingX}; gap: ${srch.gap}; background: ${cv(refPath(search.state.default.bg.$value))}; border: 1px solid ${cv(refPath(search.state.default.border.$value))}; border-radius: ${px(resolve(search.radius.$value))}; }
.search:hover { background: ${cv(refPath(search.state.hover.bg.$value))}; border-color: ${cv(refPath(search.state.hover.border.$value))}; }
.search:focus-within { border-color: ${cv(refPath(search.state.focus.border.$value))}; }
.search__icon { flex-shrink: 0; width: ${srch.iconSize}; height: ${srch.iconSize}; color: ${cv(refPath(search.state.default.icon.$value))}; }
.search__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${cv("text.default")}; ${typoCss(srch.value)} font-family: inherit; }
.search__input::placeholder { color: ${cv(refPath(search.state.default.placeholder.$value))}; }

/* ============ Listbox (popover) ============ */
.listbox { margin: 0; box-sizing: border-box; padding: ${px(resolve(lb.padding.$value))}; border-radius: ${px(resolve(lb.radius.$value))}; background: ${cv(refPath(lb.bg.$value))}; border: 1px solid ${cv(refPath(lb.border.$value))}; box-shadow: ${lbShadow}; font-family: ${cv("family.sans")}; width: 340px; max-width: calc(100vw - ${px(resolve("dim.8"))}); }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${px(resolve(lb.gap.$value))}; max-height: 280px; overflow-y: auto; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${px(resolve(lb.optionGap.$value))}; padding: ${px(resolve(lb.optionPaddingY.$value))} ${px(resolve(lb.optionPaddingX.$value))}; border: none; background: none; border-radius: ${px(resolve(lb.optionRadius.$value))}; cursor: pointer; text-align: left; color: ${cv("text.default")}; font-family: inherit; ${typoCss(h.resolveToken(lb.label))} }
.listbox__option:hover { background: ${cv("fill.neutralHover")}; }
.listbox__stack { display: flex; flex-direction: column; gap: ${px(resolve(lb.stackGap.$value))}; min-width: 0; flex: 1; }
.listbox__desc { color: ${cv(refPath(lb.descriptionColor.$value))}; ${typoCss(h.resolveToken(lb.description))} }
.listbox__trailing { flex-shrink: 0; margin-left: ${px(resolve(lb.trailingGap.$value))}; }
.listbox__search-wrap { padding: ${px(resolve(lb.padding.$value))}; border-bottom: 1px solid ${cv(refPath(lb.divider.$value))}; margin-bottom: ${px(resolve(lb.gap.$value))}; }

/* ============ Table (the classes you're bringing) ============ */
.table { border: 1px solid ${cv(refPath(table.border.$value))}; border-radius: ${px(resolve(table.radius.$value))}; overflow: hidden; background: ${cv(refPath(table.surface.$value))}; }
.table__head, .table__row { display: grid; grid-template-columns: minmax(90px, 1.4fr) minmax(88px, 1fr) 76px 64px minmax(76px, 1fr) ${px(resolve("dim.8"))}; gap: ${px(resolve(table.row.gap.$value))}; align-items: center; padding: ${px(resolve("dim.2"))} ${px(resolve(table.row.paddingX.$value))}; }
.table__head { padding: ${px(resolve(table.header.paddingY.$value))} ${px(resolve(table.header.paddingX.$value))}; border-bottom: 1px solid ${cv(refPath(table.header.divider.$value))}; color: ${cv(refPath(table.header.labelColor.$value))}; ${typoCss(labelSm)} text-transform: ${labelSmCase}; letter-spacing: ${labelSm.letterSpacing}; }
.table__row { border-bottom: 1px solid ${cv(refPath(table.row.divider.$value))}; }
.table__row:last-child { border-bottom: none; }
.table__code { color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.heading-base")))} }
.table__req { color: ${cv("status.danger")}; }
@media (max-width: 640px) {
  .table__head { display: none; }
  .table__row { grid-template-columns: 1fr 1fr ${px(resolve("dim.8"))}; row-gap: ${px(resolve("dim.2"))}; }
}

/* ============ results ============ */
.ed-res__pills { display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.2"))}; }
.ed-res__actions { display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.2"))}; }
.ed-tabs { display: flex; gap: ${px(resolve("dim.4"))}; border-bottom: 1px solid ${cv("border.default")}; }
.ed-tab { border: none; background: none; padding: 0 0 ${px(resolve("dim.2"))}; margin-bottom: -1px; cursor: pointer; font-family: inherit; color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.heading-base")))} border-bottom: 2px solid transparent; }
.ed-tab:hover { color: ${cv("text.default")}; }
.ed-tab.is-active { color: ${cv("text.default")}; border-bottom-color: ${cv("fill.primary")}; }
.ed-tabpanel { display: none; flex-direction: column; gap: ${px(resolve("dim.4"))}; }
.ed-tabpanel.is-active { display: flex; }
/* A transfer result is a flat divided ROW, not its own bordered card — the
   reference stacks twenty bordered boxes and that pile is what reads as
   clutter. Grouped by status so the eight identical "we'll evaluate it" rows
   collapse into one labelled group with a count. */
.ed-tcredit { display: grid; grid-template-columns: 1fr; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; border-bottom: 1px solid ${cv("border.default")}; }
.ed-tcredit:last-child { border-bottom: none; }
@media (min-width: 640px) { .ed-tcredit { grid-template-columns: 1fr 1fr; gap: ${px(resolve("dim.4"))}; } }
.ed-tcredit__col { display: flex; flex-direction: column; gap: ${px(resolve("dim.0_5"))}; min-width: 0; }
.ed-tcredit__code { color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.heading-base")))} }
.ed-tcredit__meta { color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-tcredit__note { grid-column: 1 / -1; color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-course { display: flex; flex-wrap: wrap; align-items: center; gap: ${px(resolve("dim.2"))}; color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.body-sm")))} }
.ed-course b { font-weight: ${h.resolveToken(h.get("text-style.heading-base")).fontWeight}; }
.ed-summary { display: grid; grid-template-columns: 1fr; gap: ${px(resolve("dim.1"))}; padding: ${px(resolve("dim.3"))} 0; border-bottom: 1px solid ${cv("border.default")}; }
.ed-summary:last-child { border-bottom: none; }
@media (min-width: 560px) { .ed-summary { grid-template-columns: 180px 1fr; gap: ${px(resolve("dim.4"))}; } }
.ed-summary__key { color: ${cv("text.secondary")}; ${typoCss(h.resolveToken(h.get("text-style.heading-base")))} }
.ed-summary__val { display: flex; flex-direction: column; gap: ${px(resolve("dim.1"))}; color: ${cv("text.default")}; ${typoCss(h.resolveToken(h.get("text-style.body-base")))} }

/* ============ captcha stand-in ============ */
/* A third-party embed, not a DS component — a bordered box that behaves like
   the widget so the flow can be walked. Its geometry is the vendor's. */
.ed-captcha { display: inline-flex; align-items: center; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.3"))}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.sm"))}; background: ${cv("surface.dim")}; cursor: pointer; ${typoCss(h.resolveToken(h.get("text-style.body-base")))} color: ${cv("text.default")}; }
.ed-captcha__box { width: ${px(resolve("dim.6"))}; height: ${px(resolve("dim.6"))}; border: 2px solid ${cv("border.strong")}; border-radius: ${px(resolve("radius.xs"))}; background: ${cv("surface.default")}; display: inline-flex; align-items: center; justify-content: center; color: ${cv("status.success")}; }
.ed-captcha__box svg { width: 100%; height: 100%; display: none; }
.ed-captcha.is-checked .ed-captcha__box { border-color: ${cv("status.success")}; }
.ed-captcha.is-checked .ed-captcha__box svg { display: block; }
.ed-captcha__brand { color: ${cv("text.muted")}; ${typoCss(h.resolveToken(h.get("text-style.body-xs")))} }

.empty-state { width: 100%; display: flex; align-items: center; justify-content: center; padding: ${px(resolve(es.padding.$value))}; }
.empty-state__text { background: ${cv(refPath(es.pill.bg.$value))}; color: ${cv(refPath(es.textColor.$value))}; border-radius: ${px(resolve(es.pill.radius.$value))}; padding: ${px(resolve(es.pill.paddingY.$value))} ${px(resolve(es.pill.paddingX.$value))}; ${typoCss(h.resolveToken(es.text))} text-align: center; }
.ed-link { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; color: ${cv("text.primary")}; ${typoCss(h.resolveToken(h.get("text-style.link-sm")))} text-decoration: none; }
.ed-link:hover { text-decoration: ${linkSmDeco}; }
.is-hidden { display: none !important; }`;
}

/** Token paths the CSS above references, for the page's :root block. */
export const ED_COLOR_PATHS = [
  "surface.page", "surface.default", "surface.dim", "surface.dimHover", "surface.sunken", "surface.disabled",
  "border.default", "border.strong", "border.focus",
  "text.default", "text.secondary", "text.muted", "text.primary", "text.onFill", "text.disabled",
  "icon.default", "icon.secondary", "icon.muted", "icon.onFill", "icon.primary",
  "fill.primary", "fill.primaryHover", "fill.primaryActive", "fill.disabled",
  "fill.neutral", "fill.neutralHover", "fill.neutralActive", "fill.neutralHoverStrong", "fill.neutralActiveStrong",
  "fill.success",
  "bg.primary", "bg.primaryHover", "bg.neutral", "bg.success", "bg.warning", "bg.danger",
  "border.primary", "border.success", "border.warning", "border.danger",
  "status.success", "status.warning", "status.danger",
  "text.success", "text.warning", "text.danger",
];
