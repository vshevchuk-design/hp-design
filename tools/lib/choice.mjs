// Checkbox, Radio and their groups — one definition for the Checkbox and
// Radio pages, Form, and anything else that needs a real choice control.
// The control is a native <input> kept in the DOM (clip-rect hidden) with a
// painted box/circle driven by :checked / :indeterminate / :disabled.
// A group is a Field: <fieldset class="field choice-group"> with its <legend>
// as the Field label, the helper as the Field description and the Field's
// error message — so FORM_JS validates it like any other field.
//
// Consumer: CHOICE_COLOR_PATHS into :root, CHECKBOX_CSS / RADIO_CSS (+
// CHOICE_GROUP_CSS and field.mjs's FIELD_WRAPPER_CSS for groups) into its sheet.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
};
const cb = load("tokens/components/checkbox.tokens.json").component.checkbox;
const rd = load("tokens/components/radio.tokens.json").component.radio;
const field = load("tokens/components/field.tokens.json").component.field;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`choice: unresolved token ${ref}`);
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
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const T = (node) => { const t = resolveToken(node); return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; };
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const c = cb.state, r = rd.state;
const colorNodes = [
  c.default.bg, c.default.border, c.default.label, c.hover.bg, c.hover.border, c.focused.ringColor, c.checked.bg, c.checked.border, c.checked.icon,
  c.checkedHover.bg, c.checkedHover.border, c.disabled.bg, c.disabled.border, c.disabled.label, c.disabledChecked.bg, c.disabledChecked.border, c.disabledChecked.icon,
  r.default.bg, r.default.border, r.default.label, r.hover.bg, r.hover.border, r.focused.ringColor, r.checked.bg, r.checked.border, r.checked.dot,
  r.checkedHover.border, r.checkedHover.dot, r.disabled.bg, r.disabled.border, r.disabled.label, r.disabledChecked.dot,
  field.labelColor, field.descriptionColor,
];
export const CHOICE_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];

const hide = "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";

export const CHECKBOX_CSS = `
.checkbox { display: inline-flex; align-items: center; gap: ${D(cb.size.gap)}; font-family: var(${cssVarName("family.sans")}); cursor: pointer; }
.checkbox__input { ${hide} }
.checkbox__box { box-sizing: border-box; width: ${D(cb.size.box)}; height: ${D(cb.size.box)}; border-radius: ${D(cb.radius)}; border: ${D(cb.size.borderWidth)} solid ${R(c.default.border)}; background: ${R(c.default.bg)}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.checkbox__icon { width: ${D(cb.size.iconSize)}; height: ${D(cb.size.iconSize)}; display: none; }
.checkbox__label { color: ${R(c.default.label)}; ${T(cb.label)} }
.checkbox:hover .checkbox__input:not(:checked):not(:indeterminate):not(:disabled) ~ .checkbox__box { background: ${R(c.hover.bg)}; border-color: ${R(c.hover.border)}; }
.checkbox__input:focus-visible ~ .checkbox__box { outline: ${D(c.focused.ringWidth)} solid ${R(c.focused.ringColor)}; outline-offset: ${D(c.focused.ringOffset)}; }
.checkbox__input:checked ~ .checkbox__box, .checkbox__input:indeterminate ~ .checkbox__box { background: ${R(c.checked.bg)}; border-color: ${R(c.checked.border)}; }
.checkbox:hover .checkbox__input:checked:not(:disabled) ~ .checkbox__box, .checkbox:hover .checkbox__input:indeterminate:not(:disabled) ~ .checkbox__box { background: ${R(c.checkedHover.bg)}; border-color: ${R(c.checkedHover.border)}; }
.checkbox__input:checked ~ .checkbox__box .checkbox__icon--check { display: block; color: ${R(c.checked.icon)}; }
.checkbox__input:indeterminate ~ .checkbox__box .checkbox__icon--remove { display: block; color: ${R(c.checked.icon)}; }
.checkbox__input:disabled ~ .checkbox__box { background: ${R(c.disabled.bg)}; border-color: ${R(c.disabled.border)}; cursor: not-allowed; }
.checkbox__input:disabled ~ .checkbox__label { color: ${R(c.disabled.label)}; }
.checkbox__input:disabled:checked ~ .checkbox__box, .checkbox__input:disabled:indeterminate ~ .checkbox__box { background: ${R(c.disabledChecked.bg)}; border-color: ${R(c.disabledChecked.border)}; }
.checkbox__input:disabled:checked ~ .checkbox__box .checkbox__icon--check, .checkbox__input:disabled:indeterminate ~ .checkbox__box .checkbox__icon--remove { color: ${R(c.disabledChecked.icon)}; }
.checkbox:has(.checkbox__input:disabled) { cursor: not-allowed; }`;

export const RADIO_CSS = `
.radio { display: inline-flex; align-items: center; gap: ${D(rd.size.gap)}; font-family: var(${cssVarName("family.sans")}); cursor: pointer; }
.radio__input { ${hide} }
.radio__circle { box-sizing: border-box; width: ${D(rd.size.circle)}; height: ${D(rd.size.circle)}; border-radius: ${D(rd.radius)}; border: ${D(rd.size.borderWidth)} solid ${R(r.default.border)}; background: ${R(r.default.bg)}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.radio__dot { width: ${D(rd.size.dot)}; height: ${D(rd.size.dot)}; border-radius: ${D(rd.radius)}; background: transparent; }
.radio__label { color: ${R(r.default.label)}; ${T(rd.label)} }
.radio:hover .radio__input:not(:checked):not(:disabled) ~ .radio__circle { background: ${R(r.hover.bg)}; border-color: ${R(r.hover.border)}; }
.radio__input:focus-visible ~ .radio__circle { outline: ${D(r.focused.ringWidth)} solid ${R(r.focused.ringColor)}; outline-offset: ${D(r.focused.ringOffset)}; }
.radio__input:checked ~ .radio__circle { background: ${R(r.checked.bg)}; border-color: ${R(r.checked.border)}; }
.radio__input:checked ~ .radio__circle .radio__dot { background: ${R(r.checked.dot)}; }
.radio:hover .radio__input:checked:not(:disabled) ~ .radio__circle { border-color: ${R(r.checkedHover.border)}; }
.radio:hover .radio__input:checked:not(:disabled) ~ .radio__circle .radio__dot { background: ${R(r.checkedHover.dot)}; }
.radio__input:disabled ~ .radio__circle { background: ${R(r.disabled.bg)}; border-color: ${R(r.disabled.border)}; cursor: not-allowed; }
.radio__input:disabled ~ .radio__label { color: ${R(r.disabled.label)}; }
.radio__input:disabled:checked ~ .radio__circle .radio__dot { background: ${R(r.disabledChecked.dot)}; }
.radio:has(.radio__input:disabled) { cursor: not-allowed; }`;

// Both groups share one layout; the gaps are the same values in both token files.
const g = rd.group;
export const CHOICE_GROUP_CSS = `
/* A group is a Field on a <fieldset>: the legend is its label, the helper its
   description, the error the Field's. A legend sits outside flex layout, so the
   fieldset is a plain block and the gaps are margins. */
.choice-group { display: block; margin: 0; padding: 0; border: 0; min-width: 0; }
.choice-group > legend { padding: 0; margin-bottom: ${D(g.labelGap)}; }
.choice-group__items { display: flex; flex-direction: column; align-items: flex-start; gap: ${D(g.gapVertical)}; }
.choice-group--horizontal .choice-group__items { flex-direction: row; flex-wrap: wrap; gap: ${D(g.gapHorizontal)}; }
.choice-group > .field__description, .choice-group > .field__error { margin-top: ${D(field.messageGap)}; }
.choice-group:disabled > legend, .choice-group:disabled > .field__description { color: ${R(c.disabled.label)}; }`;

const glyphs = `${icon("check", "checkbox__icon checkbox__icon--check")}${icon("remove", "checkbox__icon checkbox__icon--remove")}`;

/** One checkbox. Both glyphs are always in the markup; CSS shows the one that matches the real input. */
export function checkboxHtml({ id, name = id, label, value = "", checked = false, disabled = false, indeterminate = false }) {
  return `<label class="checkbox"><input type="checkbox" class="checkbox__input" id="${id}" name="${name}"${value ? ` value="${value}"` : ""}${checked ? " checked" : ""}${disabled ? " disabled" : ""}${indeterminate ? ' data-indeterminate="true"' : ""} /><span class="checkbox__box">${glyphs}</span><span class="checkbox__label">${label}</span></label>`;
}

/** One radio. */
export function radioHtml({ id, name, label, value = "", checked = false, disabled = false }) {
  return `<label class="radio"><input type="radio" class="radio__input" id="${id}" name="${name}"${value ? ` value="${value}"` : ""}${checked ? " checked" : ""}${disabled ? " disabled" : ""} /><span class="radio__circle"><span class="radio__dot"></span></span><span class="radio__label">${label}</span></label>`;
}

/** A RadioGroup / CheckboxGroup — a Field on a <fieldset>. `items`: [{ label, value, checked }].
 *  `required` + `errors.required` let FORM_JS check it on Submit ("choose one" / "choose at least one");
 *  `error` renders it already invalid; `disabled` disables the whole group through the fieldset. */
export function choiceGroupHtml({ type = "radio", name, legend, helper = "", items, direction = "vertical", disabled = false, required = false, errors = {}, error = "" }) {
  const ctl = type === "radio" ? radioHtml : checkboxHtml;
  const described = `${helper ? `${name}-desc ` : ""}${name}-error`;
  const data = `${required ? " data-required" : ""}${errors.required ? ` data-error-required="${errors.required}"` : ""}${error ? " data-invalid" : ""}`;
  const list = items.map((it, i) => ctl({ id: `${name}-${i}`, name, label: it.label, value: it.value || it.label, checked: !!it.checked })).join("\n    ");
  return `<fieldset class="field choice-group${direction === "horizontal" ? " choice-group--horizontal" : ""}" data-field${data} aria-describedby="${described}"${disabled ? " disabled" : ""}>
  <legend class="field__label">${legend}</legend>
  <div class="choice-group__items">
    ${list}
  </div>
  ${helper ? `<p class="field__description" id="${name}-desc">${helper}</p>\n  ` : ""}<p class="field__error" id="${name}-error"${error ? "" : " hidden"}>${icon("error", "field__error-icon")}<span>${error}</span></p>
</fieldset>`;
}

/** indeterminate is a JS-only property — set it from the data attribute. */
export const CHOICE_JS = `document.querySelectorAll("[data-indeterminate]").forEach(function (el) { el.indeterminate = true; });`;
