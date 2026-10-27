// Select + Listbox — the trigger field and the panel it opens, one definition
// for the Select and Listbox pages, Form, and every later field built on them
// (Combobox, MultiSelect…). Select is a real <button aria-haspopup="listbox">
// on Input's box model; the panel is a native popover with role="listbox".
//
// Consumer: SELECT_COLOR_PATHS into :root, LISTBOX_CSS (+ SELECT_CSS) into its
// sheet and SELECT_JS after the markup. Each .select-field fires a bubbling
// `selectchange` event (detail.value — a string, or an array when multiple).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

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
const lb = load("tokens/components/listbox.tokens.json").component.listbox;
const sel = load("tokens/components/select.tokens.json").component.select;
const search = load("tokens/components/search.tokens.json").component.search;
const badge = load("tokens/components/badge.tokens.json").component.badge;
const command = load("tokens/components/command.tokens.json").component.command;
const counter = load("tokens/components/counter.tokens.json").component.counter;
const checkbox = load("tokens/components/checkbox.tokens.json").component.checkbox;
const spinner = load("tokens/components/spinner.tokens.json").component.spinner;
const chip = load("tokens/components/chip.tokens.json").component.chip;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`select: unresolved token ${ref}`);
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
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const P = (ref) => px(resolveToken(get(ref)));
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const T = (node) => typoCss(resolveToken(node));
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const st = sel.state, cbS = checkbox.state;
const cnt = sel.more, cntSize = counter.size.sm;
const colorNodes = [
  st.default.bg, st.default.border, st.default.placeholder, st.default.value, st.default.icon, st.default.chevron, st.hover.bg, st.hover.border,
  st.focus.border, st.focus.label, st.open.border, st.open.label, st.populated.label, st.disabled.bg, st.disabled.border, st.disabled.placeholder, st.disabled.value, st.disabled.icon, st.disabled.chevron, st.disabled.label, st.error.border,
  lb.bg, lb.border, lb.divider, lb.state.default.text, lb.state.hover.bg, lb.state.selected.checkmark, lb.descriptionColor,
  badge.role.neutral.tint.bg, badge.role.neutral.tint.text, command.group.headingColor, cnt.bg, cnt.label,
  cbS.default.bg, cbS.default.border, cbS.checked.bg, cbS.checked.border, cbS.checked.icon, spinner.track, spinner.indicator,
  chip.removable.default.bg, chip.removable.default.border, chip.removable.default.text, chip.removable.hover.border, chip.removable.remove.icon, chip.removable.remove.hoverBg, chip.removable.remove.activeBg, chip.focus.ringColor,
];
export const SELECT_COLOR_PATHS = [...new Set([...colorNodes.map(refPath), "border.focus", "surface.dim", "icon.default", "text.default", "text.secondary", "text.muted", "text.primary"])];

const sh = resolveToken(lb.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const clearNode = get(lb.selectAllRow.clearAction.$value);
const clearDeco = clearNode.$extensions?.["hp.design/text"]?.textDecoration;
const hide = "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";

export const LISTBOX_CSS = `
.listbox { margin: 0; box-sizing: border-box; padding: ${D(lb.padding)}; border-radius: ${D(lb.radius)}; background: ${R(lb.bg)}; border: 1px solid ${R(lb.border)}; box-shadow: ${shadowCss}; font-family: ${cv("family.sans")}; min-width: 220px; }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(lb.gap)}; max-height: ${D(lb.maxHeight)}; overflow: auto; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; border: none; background: none; border-radius: ${D(lb.optionRadius)}; cursor: pointer; text-align: left; color: ${R(lb.state.default.text)}; font-family: inherit; ${T(lb.label)} }
.listbox__option:hover, .listbox__option:focus-visible { background: ${R(lb.state.hover.bg)}; outline: none; }
/* An option with a description + a trailing kind badge. The text stack takes
   the remaining width so a long programme name wraps instead of pushing the
   badge out of the panel. */
.listbox__stack { display: flex; flex-direction: column; gap: ${D(lb.stackGap)}; min-width: 0; flex: 1; }
.listbox__desc { color: ${R(lb.descriptionColor)}; ${T(lb.description)} }
.listbox__trailing { flex-shrink: 0; margin-left: ${D(lb.trailingGap)}; display: inline-flex; align-items: center; height: ${D(badge.size.sm.height)}; padding: 0 ${D(badge.size.sm.paddingX)}; border-radius: ${D(badge.radius)}; background: ${R(badge.role.neutral.tint.bg)}; color: ${R(badge.role.neutral.tint.text)}; ${T(badge.size.sm.label)} }
/* single-select: a trailing checkmark on the chosen option, no tint */
.listbox__checkmark { width: ${D(lb.checkmarkSize)}; height: ${D(lb.checkmarkSize)}; margin-left: auto; color: ${R(lb.state.selected.checkmark)}; flex-shrink: 0; }
.listbox__option[aria-selected="false"] .listbox__checkmark { visibility: hidden; }

/* multi-select: a real Checkbox marker per option (checkbox.tokens.json) */
.listbox__cb-option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; border-radius: ${D(lb.optionRadius)}; cursor: pointer; }
.listbox__cb-option:hover { background: ${R(lb.state.hover.bg)}; }
.listbox__cb-input { ${hide} }
.listbox__cb-box { box-sizing: border-box; width: ${D(lb.checkbox.box)}; height: ${D(lb.checkbox.box)}; border-radius: ${D(lb.checkbox.radius)}; border: ${D(lb.checkbox.borderWidth)} solid ${R(cbS.default.border)}; background: ${R(cbS.default.bg)}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.listbox__cb-icon { width: ${D(checkbox.size.iconSize)}; height: ${D(checkbox.size.iconSize)}; display: none; color: ${R(cbS.checked.icon)}; }
.listbox__cb-input:checked ~ .listbox__cb-box, .listbox__option[aria-selected="true"] .listbox__cb-box { background: ${R(cbS.checked.bg)}; border-color: ${R(cbS.checked.border)}; }
.listbox__cb-input:checked ~ .listbox__cb-box .listbox__cb-icon, .listbox__option[aria-selected="true"] .listbox__cb-box .listbox__cb-icon { display: block; }
.listbox__cb-label { color: ${R(lb.state.default.text)}; font-family: inherit; ${T(lb.label)} }

.listbox__search-wrap { padding: ${P("dim.1")} ${P("dim.1")} ${D(lb.search.gapBelow)}; margin-bottom: ${P("dim.0_5")}; border-bottom: 1px solid ${R(lb.divider)}; }
.listbox__search { display: flex; align-items: center; box-sizing: border-box; height: ${D(search.size.sm.height)}; padding: 0 ${D(search.size.sm.paddingX)}; gap: ${D(search.size.sm.gap)}; border-radius: ${P("radius.default")}; background: ${cv("surface.dim")}; border: 1px solid ${R(lb.border)}; }
.listbox__search-icon { width: ${D(search.size.sm.iconSize)}; height: ${D(search.size.sm.iconSize)}; color: ${cv("icon.default")}; flex-shrink: 0; }
.listbox__search input { border: none; background: none; outline: none; width: 100%; color: ${cv("text.default")}; font-family: inherit; ${T(search.value)} }
.listbox__search input::placeholder { color: ${cv("text.muted")}; }
/* searchable Select (ComboboxField): typing filters; nothing left → "No results" */
.listbox__empty { margin: 0; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; color: ${cv("text.muted")}; ${T(lb.label)} }
.listbox__empty[hidden] { display: none; }
/* creatable: the first row offers what you typed ("Add "Vue"") when nothing matches it exactly */
.listbox__create { color: ${cv("text.primary")}; }
.listbox__create-icon { width: ${D(lb.checkbox.box)}; height: ${D(lb.checkbox.box)}; flex-shrink: 0; color: ${cv("text.primary")}; }
.listbox__create-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.listbox__search:focus-within { border-color: ${cv("border.focus")}; }
/* infinite Select (InfiniteComboboxField): the last row of the list is its status —
   "Loading…" while there's more (scrolling to it loads the next page), "No results",
   or "Couldn't load" + Retry. Spinner sm, resolved from spinner.tokens.json. */
.listbox__status { list-style: none; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; color: ${cv("text.muted")}; ${T(lb.label)} }
.listbox__status[hidden] { display: none; }
.listbox__spinner { flex-shrink: 0; box-sizing: border-box; width: ${D(spinner.sizes.sm.size)}; height: ${D(spinner.sizes.sm.size)}; border: ${D(spinner.sizes.sm.thickness)} solid ${R(spinner.track)}; border-top-color: ${R(spinner.indicator)}; border-radius: 50%; animation: listbox-spin ${spinner.duration.$value} linear infinite; }
@keyframes listbox-spin { to { transform: rotate(360deg); } }
.listbox__retry { margin-left: auto; border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; font-family: inherit; ${T(lb.label)} }
.listbox__retry:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; border-radius: 2px; }

.listbox__select-all { display: flex; align-items: center; justify-content: space-between; gap: ${P("dim.2")}; padding: ${P("dim.1")} ${P("dim.2")}; }
.listbox__select-all-label { color: ${cv("text.secondary")}; margin: 0; ${T(lb.selectAllRow.label)} }
.listbox__select-all[hidden] { display: none; }
.listbox__clear:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; border-radius: 2px; }
.listbox__clear { border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; ${T(lb.selectAllRow.clearAction)}${clearDeco ? ` text-decoration: ${clearDeco};` : ""} }

/* groups ("Fruits", "Vegetables") — Command's group heading, a hairline between groups */
.listbox__group { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(lb.gap)}; }
.listbox__group-label { box-sizing: border-box; height: ${D(command.group.headingHeight)}; display: flex; align-items: center; padding: 0 ${D(lb.optionPaddingX)}; color: ${R(command.group.headingColor)}; ${T(command.group.heading)} }
.listbox__divider { height: 1px; margin: ${P("dim.1")} 0; background: ${R(lb.divider)}; }`;

const sizeCss = ["base", "sm", "lg"].map((k) => {
  const z = sel.size[k];
  const s = k === "base" ? ".select" : `.select--${k}`;
  const lines = [
    `${s} { height: ${D(z.height)}; padding: 0 ${D(z.paddingX)}; gap: ${D(z.gap)}; }`,
    `${s} .select__icon, ${s} .select__chevron { width: ${D(z.iconSize)}; height: ${D(z.iconSize)}; }`,
    `${s} .select__value { ${T(z.value)} }`,
  ];
  if (z.label) lines.push(`${s} .select__stack { gap: ${D(z.labelGap)}; }`, `${s} .select__label { ${T(z.label)} }`);
  return lines.join("\n");
}).join("\n");

// chips: the 24px Chip sm centred in the 40px box (7px + 1px border), 4px apart
const chipGap = D(chip.size.sm.gap);
const chipPad = `${(resolveToken(sel.size.base.height).value - resolveToken(chip.size.sm.height).value) / 2 - 1}px`;
const chipToggleMin = "96px";
export const SELECT_CSS = `
/* Select — the trigger. A real <button> on Input's box model; the value floats
   a 12px label above it once something is chosen (base/lg). */
.select-field { position: relative; display: block; min-width: 0; }
.select { box-sizing: border-box; display: flex; align-items: center; width: 100%; margin: 0; background: ${R(st.default.bg)}; border: 1px solid ${R(st.default.border)}; border-radius: ${D(sel.radius)}; font-family: ${cv("family.sans")}; text-align: left; cursor: pointer; }
${sizeCss}
.select__stack { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; }
.select__label { color: ${R(st.populated.label)}; white-space: nowrap; }
.select__value { display: flex; align-items: center; gap: ${P("dim.2")}; min-width: 0; color: ${R(st.default.value)}; }
.select__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select__icon { flex-shrink: 0; color: ${R(st.default.icon)}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${R(st.default.chevron)}; transition: transform 0.12s ease; }
/* nothing chosen: the label's text is the placeholder; sm never floats */
.select.is-placeholder .select__label, .select--sm .select__label { ${hide} }
.select.is-placeholder .select__value { color: ${R(st.default.placeholder)}; }
/* multiple: the first choice + "+N" for the rest ("Email  +2") — Counter's size, select.more's quieter colours */
.select__more { flex-shrink: 0; box-sizing: border-box; min-width: ${D(cntSize.minWidth)}; height: ${D(cntSize.height)}; padding: 0 ${D(cntSize.paddingX)}; display: inline-flex; align-items: center; justify-content: center; border-radius: ${D(counter.radius)}; background: ${R(cnt.bg)}; color: ${R(cnt.label)}; ${T(cntSize.label)} }
.select__more[hidden] { display: none; }
/* states */
.select:not(:disabled):hover { background: ${R(st.hover.bg)}; border-color: ${R(st.hover.border)}; }
.select:focus-visible { outline: none; border-color: ${R(st.focus.border)}; }
/* open — the list is showing: focus border, blue label, the chevron turns up */
.select[aria-expanded="true"], .select[aria-expanded="true"]:hover { border-color: ${R(st.open.border)}; }
.select[aria-expanded="true"] .select__label { color: ${R(st.open.label)}; }
.select[aria-expanded="true"] .select__chevron { transform: rotate(${st.open.chevronRotation.$value}deg); }
.select:disabled { background: ${R(st.disabled.bg)}; border-color: ${R(st.disabled.border)}; cursor: not-allowed; }
.select:disabled .select__value { color: ${R(st.disabled.value)}; }
.select:disabled.is-placeholder .select__value { color: ${R(st.disabled.placeholder)}; }
.select:disabled .select__label { color: ${R(st.disabled.label)}; }
.select:disabled .select__icon { color: ${R(st.disabled.icon)}; }
.select:disabled .select__chevron { color: ${R(st.disabled.chevron)}; }
.select[aria-invalid="true"], .select[aria-invalid="true"]:hover { border-color: ${R(st.error.border)}; }
/* chips: every choice is a removable Chip sm inside the box; the box wraps
   and grows a row at a time (40 → 68 → 96: 24px chips, 4px apart). The label is the Field's,
   above — there's no room to float one. The toggle (a real <button>) takes the rest of the last row. */
.select--chips { height: auto; min-height: ${D(sel.size.base.height)}; flex-wrap: wrap; gap: ${chipGap}; padding: ${chipPad} ${D(sel.size.base.paddingX)} ${chipPad} ${chipPad}; cursor: pointer; }
.select__chips { display: contents; list-style: none; }
.select__chip { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${D(chip.size.sm.gap)}; height: ${D(chip.size.sm.height)}; max-width: 100%; padding: 0 ${D(chip.size.sm.gap)} 0 ${D(chip.size.sm.paddingX)}; border-radius: ${D(chip.radius)}; background: ${R(chip.removable.default.bg)}; border: 1px solid ${R(chip.removable.default.border)}; color: ${R(chip.removable.default.text)}; cursor: default; ${T(chip.size.sm.label)} }
.select__chip:hover { border-color: ${R(chip.removable.hover.border)}; }
.select__chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select__chip-remove { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${D(chip.size.sm.iconSize)}; height: ${D(chip.size.sm.iconSize)}; padding: 0; border: none; border-radius: ${P("radius.default")}; background: transparent; color: ${R(chip.removable.remove.icon)}; cursor: pointer; }
.select__chip-remove svg { width: calc(${D(chip.size.sm.iconSize)} * 0.75); height: calc(${D(chip.size.sm.iconSize)} * 0.75); }
.select__chip-remove:hover { background: ${R(chip.removable.remove.hoverBg)}; }
.select__chip-remove:active { background: ${R(chip.removable.remove.activeBg)}; }
.select__chip-remove:focus-visible { outline: ${D(chip.focus.ringWidth)} solid ${R(chip.focus.ringColor)}; outline-offset: ${D(chip.focus.ringOffset)}; }
.select__toggle { flex: 1 0 ${chipToggleMin}; display: flex; align-items: center; gap: ${D(sel.size.base.gap)}; height: ${D(chip.size.sm.height)}; min-width: 0; margin: 0; padding: 0 0 0 calc(${D(sel.size.base.paddingX)} - ${chipPad}); border: none; background: none; font-family: inherit; text-align: left; color: ${R(st.default.placeholder)}; cursor: pointer; ${T(sel.size.base.value)} }
.select__toggle:focus { outline: none; }
.select--chips:not(.is-placeholder) .select__toggle { flex-basis: ${D(sel.size.base.iconSize)}; padding-left: 0; justify-content: flex-end; } /* with chips: just the chevron, at the end of the last row */
.select--chips .select__chevron { width: ${D(sel.size.base.iconSize)}; height: ${D(sel.size.base.iconSize)}; }
.select--chips:focus-within { border-color: ${R(st.focus.border)}; }
.select--chips:has([aria-expanded="true"]), .select--chips:has([aria-expanded="true"]):hover { border-color: ${R(st.open.border)}; }
.select--chips:has([aria-expanded="true"]) .select__chevron { transform: rotate(${st.open.chevronRotation.$value}deg); }
.select--chips:has([aria-invalid="true"]), .select--chips:has([aria-invalid="true"]):hover { border-color: ${R(st.error.border)}; }
.select--chips.is-disabled { background: ${R(st.disabled.bg)}; border-color: ${R(st.disabled.border)}; cursor: not-allowed; }
.select--chips.is-disabled .select__toggle { color: ${R(st.disabled.placeholder)}; cursor: not-allowed; }
.select--chips.is-disabled .select__chevron { color: ${R(st.disabled.chevron)}; }
.select--chips.is-disabled .select__chip-remove { display: none; }
/* the panel — Listbox, under the field, at least as wide as it */
.select__panel { margin: 0; }`;

const chevron = () => icon("expand_more", "select__chevron");
const check = () => icon("check", "listbox__checkmark");
const cbGlyph = () => icon("check", "listbox__cb-icon");

/** A Select. options: [{ label, value, group }] — consecutive options with the same `group` render under its heading.
 *  value: a value (single) or an array (multiple). */
export function selectHtml({ id, label, options = [], value = "", multiple = false, chips = false, placeholder = "", searchable = false, searchPlaceholder = "Search…", source = "", creatable = false, emptyHint = "", size = "base", icon: iconName = "", disabled = false, invalid = false, describedBy = "", panelWidth = "" }) {
  if (chips) multiple = true; // chips are always a multi-select
  if (creatable) { searchable = true; multiple = true; } // a creatable list is a multi-select you can type into
  const chosen = new Set([].concat(value).filter(Boolean));
  const picked = options.filter((o) => chosen.has(o.value ?? o.label));
  const empty = picked.length === 0;
  const first = empty ? label : picked[0].label;
  const lid = `${id}-list`;
  const opt = (o, i) => {
    const v = o.value ?? o.label, on = chosen.has(v);
    const inner = multiple ? `<span class="listbox__cb-box">${cbGlyph()}</span><span class="listbox__cb-label">${o.label}</span>` : `<span>${o.label}</span>${check()}`;
    return `<li role="none"><button type="button" class="listbox__option" role="option" id="${id}-opt-${i}" aria-selected="${on}" data-value="${v}" tabindex="-1">${inner}</button></li>`;
  };
  // group consecutive options
  const blocks = [];
  options.forEach((o, i) => { const g = o.group || ""; if (!blocks.length || blocks[blocks.length - 1].g !== g) blocks.push({ g, items: [] }); blocks[blocks.length - 1].items.push([o, i]); });
  const body = blocks.map((b, bi) => b.g
    ? `${bi ? `<li role="none"><div class="listbox__divider" role="separator"></div></li>` : ""}<li role="none"><ul class="listbox__group" role="group" aria-labelledby="${id}-g${bi}"><li role="presentation" class="listbox__group-label" id="${id}-g${bi}">${b.g}</li>${b.items.map(([o, i]) => opt(o, i)).join("")}</ul></li>`
    : b.items.map(([o, i]) => opt(o, i)).join("")).join("");
  const cls = `select${size !== "base" ? ` select--${size}` : ""}${empty ? " is-placeholder" : ""}`;
  // infinite: the options come from window[source](query, offset) a page at a time; `options` only names
  // what's already chosen (so the field can show it before anything loads)
  // creatable: an "Add "…"" row first in the list (hidden until you type something new)
  const createRow = creatable ? `<li role="none" hidden><button type="button" class="listbox__option listbox__create" role="option" aria-selected="false" tabindex="-1" data-create>${icon("add", "listbox__create-icon")}<span class="listbox__create-text"></span></button></li>` : "";
  const list = source ? `<li role="none" class="listbox__status" aria-live="polite"><span class="listbox__spinner" aria-hidden="true"></span><span class="listbox__status-text">Loading…</span></li>` : body;
  const labels = source ? ` data-source="${source}" data-labels='${JSON.stringify(Object.fromEntries(picked.map((o) => [o.value ?? o.label, o.label]))).replace(/'/g, "&#39;")}'` : "";
  if (source) searchable = true;
  const xIcon = () => icon("close", "");
  const chipHtml = (o) => `<li class="select__chip" data-value="${o.value ?? o.label}"><span class="select__chip-label">${o.label}</span><button type="button" class="select__chip-remove" aria-label="Remove ${o.label}"${disabled ? " disabled" : ""}>${xIcon()}</button></li>`;
  const triggerHtml = chips
    // chips: the box is a div (chips hold their own × buttons — no buttons inside a button); the toggle is the button.
    // Its label is the Field's (<label id="ID-label" for="ID">), so wrap this in fieldHtml.
    ? `<div class="select select--chips${empty ? " is-placeholder" : ""}${disabled ? " is-disabled" : ""}"><ul class="select__chips" aria-label="Chosen">${picked.map(chipHtml).join("")}</ul><button type="button" class="select__toggle" id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${lid}" aria-labelledby="${id}-label ${id}-text"${disabled ? " disabled" : ""}${invalid ? ' aria-invalid="true"' : ""}${describedBy ? ` aria-describedby="${describedBy}"` : ""}><span class="select__text" id="${id}-text">${empty ? placeholder || label : ""}</span>${chevron()}</button></div>`
    : "";
  return `<div class="select-field" data-select${creatable ? " data-creatable" : ""}${multiple ? " data-multiple" : ""}${chips ? ` data-chips data-placeholder="${placeholder || label}"` : ""}${searchable ? " data-searchable" : ""}${labels} data-value="${[...chosen].join(",")}" data-label="${label}">
  ${chips ? triggerHtml : `<button type="button" class="${cls}" id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${lid}" aria-labelledby="${id}-label ${id}-text"${disabled ? " disabled" : ""}${invalid ? ' aria-invalid="true"' : ""}${describedBy ? ` aria-describedby="${describedBy}"` : ""}>${iconName ? icon(iconName, "select__icon") : ""}<span class="select__stack"><span class="select__label" id="${id}-label">${label}</span><span class="select__value"><span class="select__text" id="${id}-text">${first}</span><span class="select__more"${picked.length > 1 ? "" : " hidden"}>+${Math.max(picked.length - 1, 0)}</span></span></span>${chevron()}</button>`}
  ${searchable
    // searchable: the panel holds a search box + the list, so the listbox role moves onto the list
    ? `<div class="listbox select__panel" popover${panelWidth ? ` style="width:${panelWidth}"` : ""}><div class="listbox__search-wrap"><div class="listbox__search">${icon("search", "listbox__search-icon")}<input type="text" class="listbox__search-input" placeholder="${searchPlaceholder}" aria-label="${searchPlaceholder.replace(/…$/, "")}" aria-controls="${lid}" autocomplete="off" /></div></div>${multiple ? `<div class="listbox__select-all"${picked.length ? "" : " hidden"}><p class="listbox__select-all-label" aria-live="polite">${picked.length} selected</p><button type="button" class="listbox__clear">Clear all</button></div>` : ""}<ul class="listbox__list" id="${lid}" role="listbox" aria-labelledby="${id}-label"${multiple ? ' aria-multiselectable="true"' : ""}>${createRow}${list}</ul>${source ? "" : `<p class="listbox__empty"${creatable && !options.length ? "" : " hidden"}${emptyHint ? ` data-hint="${emptyHint}"` : ""}>${creatable && !options.length && emptyHint ? emptyHint : "No results"}</p>`}</div>`
    : `<div class="listbox select__panel" id="${lid}" popover role="listbox" aria-labelledby="${id}-label"${multiple ? ' aria-multiselectable="true"' : ""}${panelWidth ? ` style="width:${panelWidth}"` : ""}><ul class="listbox__list" role="none">${body}</ul></div>`}
</div>`;
}

// Opens under the field (flips above when there's no room), at least as wide
// as it. Keyboard: ↓/↑/Enter/Space open; in the list ↑/↓/Home/End move, Enter
// or Space pick, Escape closes back to the field, Tab closes. Single-select
// closes on pick; multiple stays open and the field shows "first +N".
// Searchable: opening focuses the search box; typing filters (case-insensitive,
// anywhere in the label), groups and dividers hide when empty; ↓ goes into the
// list, ↑ from the first option back to the box, Enter in the box picks the
// first match; typing on an option goes to the box. Closing clears the search.
// Infinite (data-source): the list starts empty and asks window[source](query,
// offset) → Promise<{ items: [{ label, value }], hasMore }> for a page; the last
// row ("Loading…") — scrolling near it loads the next page; typing asks
// the source again after a 250ms pause (the server filters, not the list).
// Choices are kept by value, so they survive a new search.
// Creatable (data-creatable): typing something no option matches exactly shows
// "Add "…"" first; Enter (or a comma) adds it — a new chosen option, the search
// clears, the list stays open; an exact match is picked instead (never
// un-picked); fires `selectcreate` (detail.value). With no options at all the
// list shows the hint ("Type a topic and press Enter").
export const SELECT_JS = `(function () {
  var GAP = ${resolveToken(get("dim.1")).value};
  var XICON = ${JSON.stringify(icon("close", ""))}, CHECK = ${JSON.stringify(check())}, CB = ${JSON.stringify(`<span class="listbox__cb-box">${cbGlyph()}</span>`)};
  document.querySelectorAll("[data-select]").forEach(function (wrap) {
    if (wrap._hpsel) return; wrap._hpsel = true;
    var box = wrap.querySelector(".select"), trigger = wrap.querySelector(".select__toggle") || box, chipList = wrap.querySelector(".select__chips"), panel = wrap.querySelector(".select__panel"), multiple = wrap.hasAttribute("data-multiple");
    var text = wrap.querySelector(".select__text"), more = wrap.querySelector(".select__more");
    // focus an option without scrolling the page; keep it in view inside a long list
    function go(el) { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest" }); }
    var search = panel.querySelector(".listbox__search-input"), empty = panel.querySelector(".listbox__empty");
    var opts = function () { return Array.prototype.slice.call(panel.querySelectorAll(".listbox__option")).filter(function (o) { return !o.parentNode.hidden; }); };
    var source = wrap.dataset.source ? window[wrap.dataset.source] : null, chosen = {}, list = panel.querySelector(".listbox__list"), status = panel.querySelector(".listbox__status");
    var query = "", offset = 0, hasMore = true, busy = false, loaded = false, ticket = 0, seq = 0, timer = null;
    if (source) chosen = JSON.parse(wrap.dataset.labels || "{}");
    function setStatus(kind) {
      status.hidden = kind === "done";
      var text = { loading: "Loading…", empty: "No results", error: "Couldn't load." }[kind] || "";
      status.innerHTML = (kind === "loading" ? '<span class="listbox__spinner" aria-hidden="true"></span>' : "") + '<span class="listbox__status-text">' + text + "</span>" + (kind === "error" ? '<button type="button" class="listbox__retry">Retry</button>' : "");
    }
    function row(item) {
      var v = item.value != null ? String(item.value) : item.label, li = document.createElement("li"), b = document.createElement("button");
      li.setAttribute("role", "none"); b.type = "button"; b.className = "listbox__option"; b.setAttribute("role", "option"); b.id = trigger.id + "-opt-" + (seq++); b.tabIndex = -1; b.dataset.value = v; b.setAttribute("aria-selected", String(v in chosen));
      if (multiple) { b.innerHTML = CB; var l = document.createElement("span"); l.className = "listbox__cb-label"; l.textContent = item.label; b.appendChild(l); }
      else { var t = document.createElement("span"); t.textContent = item.label; b.appendChild(t); b.insertAdjacentHTML("beforeend", CHECK); }
      li.appendChild(b); list.insertBefore(li, status);
    }
    function load(reset) {
      if (reset) { ticket++; offset = 0; hasMore = true; busy = false; Array.prototype.slice.call(list.children).forEach(function (c) { if (c !== status) c.remove(); }); }
      if (busy || !hasMore) return;
      busy = true; loaded = true; var mine = ticket; setStatus("loading"); list.setAttribute("aria-busy", "true");
      Promise.resolve(source(query, offset)).then(function (r) {
        if (mine !== ticket) return;
        r.items.forEach(row); offset += r.items.length; hasMore = !!r.hasMore; busy = false; list.removeAttribute("aria-busy");
        setStatus(hasMore ? "loading" : (offset ? "done" : "empty"));
        if (hasMore && status.getBoundingClientRect().top < list.getBoundingClientRect().bottom) load();
      }, function () { if (mine !== ticket) return; busy = false; list.removeAttribute("aria-busy"); setStatus("error"); });
    }
    if (source) {
      // near the bottom (the Loading… row in sight) → the next page
      list.addEventListener("scroll", function () { if (list.scrollTop + list.clientHeight >= list.scrollHeight - status.offsetHeight * 2) load(); }, { passive: true });
      status.addEventListener("click", function (e) { if (e.target.closest(".listbox__retry")) load(); });
    }
    var creatable = wrap.hasAttribute("data-creatable"), createBtn = panel.querySelector("[data-create]");
    function exact(q) { q = q.trim().toLowerCase(); return Array.prototype.filter.call(panel.querySelectorAll(".listbox__option:not([data-create])"), function (o) { return o.textContent.trim().toLowerCase() === q; })[0]; }
    function filter(q) {
      var raw = q.trim(); q = raw.toLowerCase();
      panel.querySelectorAll(".listbox__option:not([data-create])").forEach(function (o) { o.parentNode.hidden = !!q && o.textContent.toLowerCase().indexOf(q) < 0; });
      if (createBtn) { createBtn.parentNode.hidden = !raw || !!exact(raw); createBtn.querySelector(".listbox__create-text").textContent = "Add \u201c" + raw + "\u201d"; createBtn.dataset.value = raw; }
      panel.querySelectorAll(".listbox__group").forEach(function (g) { g.parentNode.hidden = !Array.prototype.some.call(g.querySelectorAll(".listbox__option"), function (o) { return !o.parentNode.hidden; }); });
      panel.querySelectorAll(".listbox__divider").forEach(function (d) { d.parentNode.hidden = !!q; });
      if (empty) { empty.hidden = opts().length > 0; if (empty.dataset.hint) empty.textContent = q ? "No results" : empty.dataset.hint; }
    }
    function create(text) {
      text = text.trim(); if (!text) return;
      var hit = exact(text);
      if (hit) { if (hit.getAttribute("aria-selected") !== "true") pick(hit); }
      else {
        var li = document.createElement("li"), b = document.createElement("button"), l = document.createElement("span");
        li.setAttribute("role", "none"); b.type = "button"; b.className = "listbox__option"; b.setAttribute("role", "option"); b.id = trigger.id + "-new-" + (seq++); b.tabIndex = -1; b.dataset.value = text; b.setAttribute("aria-selected", "true");
        b.innerHTML = CB; l.className = "listbox__cb-label"; l.textContent = text; b.appendChild(l); li.appendChild(b); list.appendChild(li);
        sync(); wrap.dispatchEvent(new CustomEvent("selectcreate", { bubbles: true, detail: { value: text } }));
      }
      search.value = ""; filter(""); search.focus(); place();
    }
    function place() {
      var r = box.getBoundingClientRect(); panel.style.position = "fixed"; panel.style.right = "auto"; panel.style.bottom = "auto"; panel.style.minWidth = r.width + "px";
      var h = panel.offsetHeight, top = r.bottom + GAP;
      if (top + h > window.innerHeight - 8 && r.top - GAP - h > 8) top = r.top - GAP - h;
      panel.style.top = top + "px"; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
    }
    function open(focusWhich) {
      if (trigger.disabled) return;
      if (!panel.matches(":popover-open")) { panel.showPopover(); place(); if (source && !loaded) load(true); }
      var list = opts(), sel = list.filter(function (o) { return o.getAttribute("aria-selected") === "true"; })[0];
      if (search) { search.focus({ preventScroll: true }); if (sel) sel.scrollIntoView({ block: "nearest" }); return; }
      var target = focusWhich === "last" ? list[list.length - 1] : (sel || list[0]);
      go(target);
    }
    function close(refocus) { if (panel.matches(":popover-open")) panel.hidePopover(); if (refocus) trigger.focus(); }
    // the choices as [value, label] — from the store (source) or every option, filtered out or not
    function chosenPairs() {
      if (source) return Object.keys(chosen).map(function (v) { return [v, chosen[v]]; });
      return Array.prototype.slice.call(panel.querySelectorAll(".listbox__option[aria-selected='true']")).map(function (o) { return [o.dataset.value, o.textContent]; });
    }
    function renderChips(pairs) {
      chipList.innerHTML = "";
      pairs.forEach(function (p) {
        var li = document.createElement("li"), l = document.createElement("span"), x = document.createElement("button");
        li.className = "select__chip"; li.dataset.value = p[0]; l.className = "select__chip-label"; l.textContent = p[1];
        x.type = "button"; x.className = "select__chip-remove"; x.setAttribute("aria-label", "Remove " + p[1]); x.innerHTML = XICON;
        li.appendChild(l); li.appendChild(x); chipList.appendChild(li);
      });
    }
    function sync() {
      var pairs = chosenPairs(), vals = pairs.map(function (p) { return p[0]; });
      wrap.dataset.value = vals.join(","); box.classList.toggle("is-placeholder", pairs.length === 0);
      if (selectAll) { var was = selectAll.hidden; selectAll.hidden = !pairs.length; selectAll.firstChild.textContent = pairs.length + " selected"; if (was !== selectAll.hidden && panel.matches(":popover-open")) place(); }
      if (chipList) { renderChips(pairs); text.textContent = pairs.length ? "" : wrap.dataset.placeholder; if (panel.matches(":popover-open")) place(); }
      else { text.textContent = pairs.length ? pairs[0][1] : wrap.dataset.label; more.hidden = pairs.length < 2; more.textContent = "+" + Math.max(pairs.length - 1, 0); }
      wrap.dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: { value: multiple ? vals : (vals[0] || "") } }));
    }
    // chips: × takes a choice out (focus moves to the next ×, or the toggle); a click anywhere else on the box opens
    // searchable multi: "N selected · Clear all" under the search — every choice out, even ones filtered out of view
    var selectAll = panel.querySelector(".listbox__select-all");
    if (selectAll) selectAll.querySelector(".listbox__clear").addEventListener("click", function () {
      chosen = {}; panel.querySelectorAll(".listbox__option").forEach(function (o) { o.setAttribute("aria-selected", "false"); });
      sync(); if (search) search.focus();
    });
    function unpick(v) {
      if (source) delete chosen[v];
      panel.querySelectorAll(".listbox__option").forEach(function (o) { if (o.dataset.value === v) o.setAttribute("aria-selected", "false"); });
      sync();
    }
    if (chipList) {
      box.addEventListener("click", function (e) {
        var x = e.target.closest(".select__chip-remove");
        if (x) { if (trigger.disabled) return; var li = x.closest(".select__chip"), i = Array.prototype.indexOf.call(chipList.children, li); unpick(li.dataset.value); var nx = chipList.children[i] || chipList.children[i - 1]; (nx ? nx.querySelector(".select__chip-remove") : trigger).focus(); return; }
        if (!e.target.closest(".select__toggle") && !e.target.closest(".select__chip")) trigger.click();
      });
      trigger.addEventListener("keydown", function (e) { if (e.key === "Backspace" && chipList.lastElementChild) { e.preventDefault(); unpick(chipList.lastElementChild.dataset.value); } });
    }
    function pick(o) {
      if (o.hasAttribute("data-create")) { create(o.dataset.value); return; }
      if (source) {
        var v = o.dataset.value, label = o.textContent;
        if (multiple) { if (v in chosen) delete chosen[v]; else chosen[v] = label; o.setAttribute("aria-selected", String(v in chosen)); sync(); return; }
        chosen = {}; chosen[v] = label; opts().forEach(function (x) { x.setAttribute("aria-selected", String(x === o)); }); sync(); close(true); return;
      }
      if (multiple) { o.setAttribute("aria-selected", String(o.getAttribute("aria-selected") !== "true")); sync(); return; }
      opts().forEach(function (x) { x.setAttribute("aria-selected", String(x === o)); });
      sync(); close(true);
    }
    panel.addEventListener("toggle", function (e) { trigger.setAttribute("aria-expanded", String(e.newState === "open")); if (e.newState !== "open" && search) { var had = search.value; search.value = ""; if (!source) filter(""); else if (had || query) { query = ""; loaded = false; } } });
    if (search) {
      search.addEventListener("input", function () {
        if (!source) { filter(search.value); place(); return; }
        clearTimeout(timer); timer = setTimeout(function () { query = search.value.trim(); load(true); }, 250);
      });
      search.addEventListener("keydown", function (e) {
        var list = opts();
        if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); go(list[0]); }
        else if (creatable && (e.key === "Enter" || e.key === ",")) { e.preventDefault(); e.stopPropagation(); create(search.value); }
        else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (list[0]) pick(list[0]); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === "Tab") { close(false); }
        else e.stopPropagation();
      });
    }
    trigger.addEventListener("click", function () { if (panel.matches(":popover-open")) close(false); else open(); });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); open("last"); }
    });
    panel.addEventListener("click", function (e) { var o = e.target.closest(".listbox__option"); if (o) pick(o); });
    panel.addEventListener("keydown", function (e) {
      var list = opts(), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); go(list[i + 1] || list[i]); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (search && i <= 0) search.focus(); else go(list[i - 1] || list[i]); }
      else if (search && e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey) { search.focus(); }
      else if (e.key === "Home") { e.preventDefault(); go(list[0]); }
      else if (e.key === "End") { e.preventDefault(); go(list[list.length - 1]); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (list[i]) pick(list[i]); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") { close(false); }
    });
  });
})();`;
