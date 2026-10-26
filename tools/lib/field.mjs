// Field + Form — the wrapper every form control sits in (label above when the
// control has no floating one, description, error message) and the form
// around a set of them (one column, sections, actions, validate on Submit).
// Also the real text field: an <input>/<textarea> on Input base's recipe with
// a CSS-only floating label, resolved from input.tokens.json.
//
// Consumer: put FIELD_COLOR_PATHS into its :root vars, FIELD_CSS into its
// sheet and FORM_JS after the markup. A DatePicker inside a Field needs
// date-picker.mjs's own CSS/JS too. Each valid submit fires a bubbling
// `formvalid` event on the <form>.
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
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const field = load("tokens/components/field.tokens.json").component.field;
const form = load("tokens/components/form.tokens.json").component.form;
const input = load("tokens/components/input.tokens.json").component.input;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`field: unresolved token ${ref}`);
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
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const T = (node) => typoCss(resolveToken(node));
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const base = input.size.base, st = input.state;
const colorNodes = [
  st.default.bg, st.default.border, st.default.placeholder, st.default.value, st.hover.bg, st.hover.border, st.focus.border, st.focus.label, st.populated.label, st.error.border,
  field.labelColor, field.optionalColor, field.descriptionColor, field.error.color, field.error.icon, form.sectionTitleColor,
];
export const FIELD_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];

const labelExtra = resolveToken(field.labelGap).value - resolveToken(field.messageGap).value;

export const FIELD_CSS = `
/* Text field — a real <input> on Input base. The label floats in at 12px on
   focus or once there is a value; resting, the placeholder shows the label's
   text and the label itself is kept for screen readers only. */
.text-field { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: ${D(base.labelGap)}; height: ${D(base.height)}; padding: 0 ${D(base.paddingX)}; background: ${R(st.default.bg)}; border: 1px solid ${R(st.default.border)}; border-radius: ${D(input.radius)}; cursor: text; font-family: var(${cssVarName("family.sans")}); }
.text-field:hover { background: ${R(st.hover.bg)}; border-color: ${R(st.hover.border)}; }
.text-field:focus-within { border-color: ${R(st.focus.border)}; }
.text-field__label { color: ${R(st.populated.label)}; ${T(base.label)} cursor: text; }
.text-field:focus-within .text-field__label { color: ${R(st.focus.label)}; }
.text-field:not(:focus-within):has(.text-field__control:placeholder-shown) .text-field__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.text-field__control { box-sizing: border-box; width: 100%; margin: 0; padding: 0; border: none; outline: none; background: transparent; color: ${R(st.default.value)}; font-family: inherit; ${T(base.value)} }
.text-field__control::placeholder { color: ${R(st.default.placeholder)}; opacity: 1; }
.text-field:focus-within .text-field__control::placeholder { color: transparent; }
/* Text area — the same field, growing downward; the label sits on top */
.text-field--area { height: auto; min-height: ${px(resolveToken(get("dim.24")))}; justify-content: flex-start; padding-top: ${px(resolveToken(get("dim.2")))}; padding-bottom: ${px(resolveToken(get("dim.2")))}; }
.text-field--area .text-field__control { flex: 1; min-height: ${px(resolveToken(get("dim.16")))}; resize: vertical; }

/* Field — label (only for controls without a floating one), control, description, error */
.field { display: flex; flex-direction: column; gap: ${D(field.messageGap)}; min-width: 0; }
.field__label { margin-bottom: ${labelExtra}px; color: ${R(field.labelColor)}; ${T(field.label)} }
.field__optional { color: ${R(field.optionalColor)}; ${T(field.optional)} }
.field__description { margin: 0; color: ${R(field.descriptionColor)}; ${T(field.description)} }
.field__error { margin: 0; display: flex; align-items: flex-start; gap: ${D(field.error.iconGap)}; color: ${R(field.error.color)}; ${T(field.error.text)} }
.field__error[hidden] { display: none; }
.field__error-icon { width: ${D(field.error.iconSize)}; height: ${D(field.error.iconSize)}; flex-shrink: 0; color: ${R(field.error.icon)}; }
/* invalid: the control takes Input's error border, on hover and focus too */
.field[data-invalid] .text-field, .field[data-invalid] .text-field:hover, .field[data-invalid] .text-field:focus-within,
.field[data-invalid] .datepicker__trigger, .field[data-invalid] .datepicker__trigger:hover, .field[data-invalid] .datepicker__trigger:focus-visible { border-color: ${R(st.error.border)}; }

/* Form — one column, sections, actions under the last field */
.form { display: flex; flex-direction: column; gap: ${D(form.fieldGap)}; max-width: ${D(form.maxWidth)}; margin: 0; font-family: var(${cssVarName("family.sans")}); }
.form__section { display: flex; flex-direction: column; gap: ${D(form.fieldGap)}; margin: 0; padding: 0; border: none; min-width: 0; }
.form__section + .form__section { margin-top: ${resolveToken(form.sectionGap).value - resolveToken(form.fieldGap).value}px; }
.form__section-title { margin: 0; padding: 0 0 ${D(form.sectionTitleGap)}; color: ${R(form.sectionTitleColor)}; ${T(form.sectionTitle)} }
.form__actions { display: flex; flex-wrap: wrap; gap: ${D(form.actionsGap)}; }`;

const errorIcon = () => icon("error", "field__error-icon");

/** A text field: a real <input> (or <textarea> with `area`) with Input base's floating label. */
export function textFieldHtml({ id, label, type = "text", required = false, value = "", autocomplete = "", area = false, describedBy = "" }) {
  const attrs = `class="text-field__control" id="${id}" name="${id}" placeholder="${label}"${required ? " required" : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${describedBy ? ` aria-describedby="${describedBy}"` : ""}`;
  const control = area ? `<textarea ${attrs} rows="3">${value}</textarea>` : `<input ${attrs} type="${type}"${value ? ` value="${value}"` : ""} />`;
  return `<div class="text-field${area ? " text-field--area" : ""}"><label class="text-field__label" for="${id}">${label}</label>${control}</div>`;
}

/** A Field around `control`. `label` renders above it (only for controls without a floating label).
 *  `errors` are the messages FORM_JS shows: { required, format }. `error` renders the field already invalid. */
export function fieldHtml({ id, control, label = "", optional = false, description = "", required = false, errors = {}, error = "" }) {
  const data = `${required ? " data-required" : ""}${errors.required ? ` data-error-required="${errors.required}"` : ""}${errors.format ? ` data-error-format="${errors.format}"` : ""}`;
  return `<div class="field" data-field${data}${error ? " data-invalid" : ""}>
  ${label ? `<label class="field__label" id="${id}-label" for="${id}">${label}${optional ? ` <span class="field__optional">(optional)</span>` : ""}</label>\n  ` : ""}${control}
  ${description ? `<p class="field__description" id="${id}-desc">${description}</p>\n  ` : ""}<p class="field__error" id="${id}-error"${error ? "" : " hidden"}>${errorIcon()}<span>${error}</span></p>
</div>`;
}

/** The ids a control inside fieldHtml points aria-describedby at. */
export const describedBy = (id, { description = true } = {}) => `${description ? `${id}-desc ` : ""}${id}-error`;

// Validate on Submit; after the first attempt each field re-checks as it is
// corrected. Uses the browser's own constraint validation (required, type,
// pattern) with the messages from data-error-*; a DatePicker counts as filled
// once it has data-value.
export const FORM_JS = `(function () {
  document.querySelectorAll("form.form").forEach(function (form) {
    if (form._hpform) return; form._hpform = true;
    form.noValidate = true;
    var tried = false;
    function controlOf(f) { return f.querySelector("input, textarea, .datepicker__trigger"); }
    function check(f) {
      var ctl = controlOf(f), dp = f.querySelector(".datepicker"), msg = "";
      if (dp) { if (f.hasAttribute("data-required") && !dp.dataset.value) msg = f.dataset.errorRequired; }
      else if (ctl && ctl.validity) {
        if (ctl.validity.valueMissing) msg = f.dataset.errorRequired || ctl.validationMessage;
        else if (!ctl.validity.valid) msg = f.dataset.errorFormat || ctl.validationMessage;
      }
      var err = f.querySelector(".field__error");
      f.toggleAttribute("data-invalid", !!msg);
      err.hidden = !msg; err.querySelector("span").textContent = msg || "";
      if (msg) ctl.setAttribute("aria-invalid", "true"); else ctl.removeAttribute("aria-invalid");
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); tried = true;
      var bad = Array.prototype.filter.call(form.querySelectorAll("[data-field]"), function (f) { return !check(f); });
      if (bad.length) { controlOf(bad[0]).focus(); return; }
      form.dispatchEvent(new CustomEvent("formvalid", { bubbles: true }));
    });
    function recheck(e) { if (!tried) return; var f = e.target.closest("[data-field]"); if (f) check(f); }
    form.addEventListener("input", recheck);
    form.addEventListener("datechange", recheck);
    form.addEventListener("reset", function () { tried = false; setTimeout(function () { form.querySelectorAll("[data-field]").forEach(function (f) { f.removeAttribute("data-invalid"); f.querySelector(".field__error").hidden = true; var c = controlOf(f); if (c) c.removeAttribute("aria-invalid"); }); }); });
  });
})();`;
