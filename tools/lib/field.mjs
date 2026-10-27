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
  st.default.icon, st.disabled.bg, st.disabled.border, st.disabled.placeholder, st.disabled.value, st.disabled.icon, st.disabled.label, st.readOnly.bg, st.readOnly.border, st.readOnly.label, st.readOnly.value,
  field.labelColor, field.optionalColor, field.descriptionColor, field.error.color, field.error.icon, form.sectionTitleColor,
];
const ghostB = load("tokens/components/button.tokens.json").component.button.ghost;
export const FIELD_COLOR_PATHS = [...new Set([...colorNodes, ghostB.state.default.icon, ghostB.state.hover.fill, ghostB.state.pressed.fill, ghostB.state.focused.ringColor].map(refPath))];

const labelExtra = resolveToken(field.labelGap).value - resolveToken(field.messageGap).value;

// the reveal button is Button ghost sm icon-only, resolved from button.tokens.json.
// base first: the size modifiers share its specificity and must come after it.
const ghost = ghostB;
const ro = st.readOnly, dis = st.disabled;
const sizeCss = ["base", "sm", "lg"].map((k) => {
  const z = input.size[k];
  const sel = k === "base" ? ".text-field" : `.text-field--${k}`;
  const lines = [
    `${sel} { height: ${D(z.height)}; padding: 0 ${D(z.paddingX)}; gap: ${D(z.gap)}; }`,
    `${sel} .text-field__icon { width: ${D(z.iconSize)}; height: ${D(z.iconSize)}; }`,
    `${sel} .text-field__action { margin-inline-end: -${resolveToken(z.paddingX).value - 4}px; }`,
    `${sel} { --tf-action-pull: -${resolveToken(z.paddingX).value - 4}px; }`,
  ];
  if (z.label) lines.push(`${sel} .text-field__stack { gap: ${D(z.labelGap)}; }`, `${sel} .text-field__label { ${T(z.label)} }`);
  return lines.join("\n");
}).join("\n");

export const TEXT_FIELD_CSS = `
/* Text field — a real <input> on Input's recipe. base/lg float the label in at
   12px on focus or once there is a value; resting, the placeholder shows the
   label's text and the label itself is kept for screen readers only. sm never
   floats (too short for two lines) — its label is screen-reader only. */
.text-field { box-sizing: border-box; display: flex; align-items: center; background: ${R(st.default.bg)}; border: 1px solid ${R(st.default.border)}; border-radius: ${D(input.radius)}; cursor: text; font-family: var(${cssVarName("family.sans")}); }
.text-field__stack { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
${sizeCss}
.text-field__icon { flex-shrink: 0; color: ${R(st.default.icon)}; }
.text-field__label { color: ${R(st.populated.label)}; cursor: text; }
.text-field__control { box-sizing: border-box; width: 100%; margin: 0; padding: 0; border: none; outline: none; background: transparent; color: ${R(st.default.value)}; font-family: inherit; ${T(base.value)} }
.text-field__control::placeholder { color: ${R(st.default.placeholder)}; opacity: 1; }
.text-field:not(:focus-within):has(.text-field__control:placeholder-shown) .text-field__label,
.text-field--sm .text-field__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.text-field:focus-within .text-field__control::placeholder { color: transparent; }
/* hover / focus — not on a disabled or read-only field */
.text-field:not(:has(:disabled, [readonly])):hover { background: ${R(st.hover.bg)}; border-color: ${R(st.hover.border)}; }
.text-field:focus-within { border-color: ${R(st.focus.border)}; }
.text-field:not(:has([readonly])):focus-within .text-field__label { color: ${R(st.focus.label)}; }
/* disabled — unavailable right now: faded, not focusable */
.text-field:has(.text-field__control:disabled) { background: ${R(dis.bg)}; border-color: ${R(dis.border)}; cursor: not-allowed; }
.text-field:has(.text-field__control:disabled) .text-field__control { color: ${R(dis.value)}; cursor: not-allowed; }
.text-field:has(.text-field__control:disabled) .text-field__control::placeholder { color: ${R(dis.placeholder)}; }
.text-field:has(.text-field__control:disabled) .text-field__label { color: ${R(dis.label)}; }
.text-field:has(.text-field__control:disabled) .text-field__icon { color: ${R(dis.icon)}; }
/* read-only — can't change, can read, select and copy: full contrast, no recessed fill */
.text-field:has(.text-field__control[readonly]) { background: ${R(ro.bg)}; border-color: ${R(ro.border)}; cursor: default; }
.text-field:has(.text-field__control[readonly]) .text-field__label { color: ${R(ro.label)}; }
.text-field:has(.text-field__control[readonly]) .text-field__control { color: ${R(ro.value)}; }
/* error — set aria-invalid on the control (FORM_JS does) */
.text-field:has(.text-field__control[aria-invalid="true"]), .text-field:has(.text-field__control[aria-invalid="true"]):hover { border-color: ${R(st.error.border)}; }
/* trailing action (password reveal) — Button ghost sm icon-only, pulled to 4px from the edge */
.text-field__action { flex-shrink: 0; box-sizing: border-box; width: ${D(ghost.size.sm.height)}; height: ${D(ghost.size.sm.height)}; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: none; border-radius: ${D(ghost.radius)}; background: transparent; color: ${R(ghost.state.default.icon)}; cursor: pointer; }
.text-field__action:hover { background: ${R(ghost.state.hover.fill)}; }
.text-field__action:active { background: ${R(ghost.state.pressed.fill)}; }
.text-field__action:focus-visible { outline: ${D(ghost.state.focused.ringWidth)} solid ${R(ghost.state.focused.ringColor)}; outline-offset: -${D(ghost.state.focused.ringWidth)}; }
.text-field__action svg { width: ${D(ghost.size.sm.iconSize)}; height: ${D(ghost.size.sm.iconSize)}; }
.text-field__action[aria-pressed="true"] .text-field__show, .text-field__action[aria-pressed="false"] .text-field__hide { display: none; }
.text-field--sm .text-field__action { width: ${px(resolveToken(get("dim.6")))}; height: ${px(resolveToken(get("dim.6")))}; }
.text-field__action:disabled { color: ${R(st.disabled.icon)}; background: transparent; cursor: not-allowed; }
/* NumberField — the same field + − / + (two of the trailing actions, 0 apart) and an optional unit.
   The input is type=text inputmode=decimal role=spinbutton: type=number's spinners are tiny, the
   scroll wheel changes it and it takes "e". */
.text-field__steps { display: flex; flex-shrink: 0; }
.text-field__steps .text-field__action { margin-inline-end: 0; }
.text-field__steps .text-field__action:last-child { margin-inline-end: var(--tf-action-pull, 0); }
.text-field__unit { flex-shrink: 0; color: ${R(st.default.placeholder)}; ${T(base.value)} }
.text-field__control[role="spinbutton"] { font-variant-numeric: tabular-nums; }
/* Text area — the same field, growing downward; the label sits on top */
.text-field--area { height: auto; min-height: ${px(resolveToken(get("dim.24")))}; align-items: stretch; padding-top: ${px(resolveToken(get("dim.2")))}; padding-bottom: ${px(resolveToken(get("dim.2")))}; }
.text-field--area .text-field__stack { justify-content: flex-start; }
.text-field--area .text-field__control { flex: 1; min-height: ${px(resolveToken(get("dim.16")))}; resize: vertical; }
`;

export const FIELD_WRAPPER_CSS = `
/* Field — label (only for controls without a floating one), control, description, error */
.field { display: flex; flex-direction: column; gap: ${D(field.messageGap)}; min-width: 0; }
.field__label { margin-bottom: ${labelExtra}px; color: ${R(field.labelColor)}; ${T(field.label)} }
.field__optional { color: ${R(field.optionalColor)}; ${T(field.optional)} }
.field__description { margin: 0; color: ${R(field.descriptionColor)}; ${T(field.description)} }
.field__error { margin: 0; display: flex; align-items: flex-start; gap: ${D(field.error.iconGap)}; color: ${R(field.error.color)}; ${T(field.error.text)} }
.field__error[hidden] { display: none; }
.field__error-icon { width: ${D(field.error.iconSize)}; height: ${D(field.error.iconSize)}; flex-shrink: 0; color: ${R(field.error.icon)}; }
/* invalid: a DatePicker takes Input's error border too (a text field does via aria-invalid) */
.field[data-invalid] .datepicker__trigger, .field[data-invalid] .datepicker__trigger:hover, .field[data-invalid] .datepicker__trigger:focus-visible { border-color: ${R(st.error.border)}; }
`;

export const FORM_LAYOUT_CSS = `
/* Form — one column, sections, actions under the last field */
.form { display: flex; flex-direction: column; gap: ${D(form.fieldGap)}; max-width: ${D(form.maxWidth)}; margin: 0; font-family: var(${cssVarName("family.sans")}); }
.form__section { display: flex; flex-direction: column; gap: ${D(form.fieldGap)}; margin: 0; padding: 0; border: none; min-width: 0; }
.form__section + .form__section { margin-top: ${resolveToken(form.sectionGap).value - resolveToken(form.fieldGap).value}px; }
.form__section-title { margin: 0; padding: 0 0 ${D(form.sectionTitleGap)}; color: ${R(form.sectionTitleColor)}; ${T(form.sectionTitle)} }
.form__actions { display: flex; flex-wrap: wrap; gap: ${D(form.actionsGap)}; }`;

/** Everything: text field + Field + Form. */
export const FIELD_CSS = TEXT_FIELD_CSS + FIELD_WRAPPER_CSS + FORM_LAYOUT_CSS;

const errorIcon = () => icon("error", "field__error-icon");

/** A text field: a real <input> (or <textarea> with `area`) on Input's recipe.
 *  size sm | base | lg · icon: a leading material icon name · reveal: password show/hide button
 *  (type becomes password) · readOnly / disabled / invalid: those states on the real control. */
export function textFieldHtml({ id, label, size = "base", type = "text", required = false, value = "", placeholder = "", autocomplete = "", inputmode = "", area = false, describedBy = "", icon: iconName = "", reveal = false, readOnly = false, disabled = false, invalid = false, number = null }) {
  // number: { min, max, step = 1, decimals = 0, unit } — NumberField: − / + and the arrow keys step it
  const num = number ? { step: 1, decimals: 0, ...number } : null;
  if (num) inputmode = num.decimals ? "decimal" : "numeric";
  const numAttrs = num ? ` role="spinbutton" data-number data-step="${num.step}" data-decimals="${num.decimals}"${num.unit ? ` data-unit="${num.unit}"` : ""}${num.min != null ? ` data-min="${num.min}" aria-valuemin="${num.min}"` : ""}${num.max != null ? ` data-max="${num.max}" aria-valuemax="${num.max}"` : ""}${value !== "" ? ` aria-valuenow="${value}"` : ""} autocomplete="off"` : "";
  const attrs = `class="text-field__control" id="${id}" name="${id}" placeholder="${placeholder || label}"${required ? " required" : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${inputmode ? ` inputmode="${inputmode}"` : ""}${numAttrs}${describedBy ? ` aria-describedby="${describedBy}"` : ""}${readOnly ? " readonly" : ""}${disabled ? " disabled" : ""}${invalid ? ' aria-invalid="true"' : ""}`;
  const control = area ? `<textarea ${attrs} rows="3">${value}</textarea>` : `<input ${attrs} type="${reveal ? "password" : type}"${value ? ` value="${value}"` : ""} />`;
  const cls = `text-field${size !== "base" ? ` text-field--${size}` : ""}${area ? " text-field--area" : ""}`;
  const lead = iconName ? icon(iconName, "text-field__icon") : "";
  const off = disabled || readOnly;
  const steps = num ? `${num.unit ? `<span class="text-field__unit" aria-hidden="true">${num.unit}</span>` : ""}<div class="text-field__steps"><button class="text-field__action" type="button" tabindex="-1" aria-label="Decrease" aria-controls="${id}" data-step-by="-1"${off || (num.min != null && value !== "" && +value <= num.min) ? " disabled" : ""}>${icon("remove", "")}</button><button class="text-field__action" type="button" tabindex="-1" aria-label="Increase" aria-controls="${id}" data-step-by="1"${off || (num.max != null && value !== "" && +value >= num.max) ? " disabled" : ""}>${icon("add", "")}</button></div>` : "";
  const action = reveal ? `<button class="text-field__action" type="button" aria-label="Show password" aria-pressed="false" aria-controls="${id}" data-reveal${disabled ? " disabled" : ""}>${icon("visibility", "text-field__show")}${icon("visibility_off", "text-field__hide")}</button>` : "";
  return `<div class="${cls}">${lead}<div class="text-field__stack"><label class="text-field__label" for="${id}">${label}</label>${control}</div>${action}${steps}</div>`;
}

// Password reveal: flips the input between password and text; the button's
// label says what the next press does.
// NumberField: − / + step it (press and hold repeats); ↑ ↓ step, Shift or
// PageUp / PageDown ×10, Home / End go to min / max. Typing keeps digits,
// one "-" and one "."; on blur the value snaps to the step, stays in min–max
// and shows its decimals — text that isn't a number goes back to the last one.
// The buttons are out of the Tab order (the arrows do the same) and keep focus
// in the input; each change fires input + change.
export const TEXT_FIELD_JS = `(function () {
  document.querySelectorAll("[data-number]").forEach(function (inp) {
    if (inp._hpnum) return; inp._hpnum = true;
    var box = inp.closest(".text-field"), dn = box.querySelector('[data-step-by="-1"]'), up = box.querySelector('[data-step-by="1"]');
    var step = +inp.dataset.step || 1, dec = +inp.dataset.decimals || 0;
    var min = inp.dataset.min !== undefined ? +inp.dataset.min : -Infinity, max = inp.dataset.max !== undefined ? +inp.dataset.max : Infinity;
    var base = isFinite(min) ? min : 0, last = inp.value;
    function parse() { var t = inp.value.replace(/[\s,]/g, ""); return t === "" ? null : (isFinite(+t) ? +t : NaN); }
    function fit(n) { n = Math.round((n - base) / step) * step + base; return Math.min(max, Math.max(min, +n.toFixed(dec))); }
    function update() {
      var n = parse(), off = inp.disabled || inp.readOnly, ok = n !== null && !isNaN(n);
      dn.disabled = off || (ok && n <= min); up.disabled = off || (ok && n >= max);
      if (ok) inp.setAttribute("aria-valuenow", n); else inp.removeAttribute("aria-valuenow");
      if (ok && inp.dataset.unit) inp.setAttribute("aria-valuetext", inp.value + " " + inp.dataset.unit); else inp.removeAttribute("aria-valuetext"); // the unit is aria-hidden on screen
    }
    function set(n) {
      n = fit(n); var v = n.toFixed(dec); if (v === inp.value) { update(); return; }
      inp.value = v; last = v; update();
      inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function bump(k) { var n = parse(); if (n === null || isNaN(n)) n = k > 0 ? (isFinite(min) ? min - step : -step) : (isFinite(max) ? max + step : step); set(n + k * step); }
    inp.addEventListener("keydown", function (e) {
      var big = 10;
      if (e.key === "ArrowUp") { e.preventDefault(); bump(e.shiftKey ? big : 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); bump(e.shiftKey ? -big : -1); }
      else if (e.key === "PageUp") { e.preventDefault(); bump(big); }
      else if (e.key === "PageDown") { e.preventDefault(); bump(-big); }
      else if (e.key === "Home" && isFinite(min)) { e.preventDefault(); set(min); }
      else if (e.key === "End" && isFinite(max)) { e.preventDefault(); set(max); }
    });
    inp.addEventListener("input", function (e) {
      if (!e.isTrusted) return;
      var t = inp.value.replace(dec ? /[^0-9.\-]/g : /[^0-9\-]/g, "").replace(/(?!^)-/g, "").replace(/(\..*)\./g, "$1");
      if (!(min < 0)) t = t.replace(/-/g, "");
      if (t !== inp.value) inp.value = t; update();
    });
    inp.addEventListener("blur", function () { var n = parse(); if (n === null) { last = ""; update(); return; } if (isNaN(n)) { inp.value = last; update(); return; } set(n); });
    [dn, up].forEach(function (b) {
      var hold = null, rep = null;
      function stop() { clearTimeout(hold); clearInterval(rep); hold = rep = null; }
      b.addEventListener("pointerdown", function (e) {
        if (b.disabled || e.button !== 0) return; e.preventDefault(); inp.focus();
        var k = +b.dataset.stepBy; bump(k);
        hold = setTimeout(function () { rep = setInterval(function () { if (b.disabled) stop(); else bump(k); }, 80); }, 400);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, stop); });
    });
    update();
  });
  document.querySelectorAll("[data-reveal]").forEach(function (btn) {
    if (btn._hpreveal) return; btn._hpreveal = true;
    var input = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });
})();`;

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
// once it has data-value; a RadioGroup / CheckboxGroup once one item is picked; a Select once it has a value.
export const FORM_JS = `(function () {
  document.querySelectorAll("form.form").forEach(function (form) {
    if (form._hpform) return; form._hpform = true;
    form.noValidate = true;
    var tried = false;
    function controlOf(f) { return f.querySelector(".choice-group__items input:checked") || f.querySelector(".select, input, textarea, .datepicker__trigger"); }
    function check(f) {
      var ctl = controlOf(f), dp = f.querySelector(".datepicker"), msg = "";
      var group = f.classList.contains("choice-group");
      if (group) {
        // a RadioGroup / CheckboxGroup: required = at least one picked
        var picked = f.querySelector(".choice-group__items input:checked");
        if (f.hasAttribute("data-required") && !picked && !f.disabled) msg = f.dataset.errorRequired;
      }
      else if (dp) { if (f.hasAttribute("data-required") && !dp.dataset.value) msg = f.dataset.errorRequired; }
      else if (f.querySelector("[data-select]")) { if (f.hasAttribute("data-required") && !f.querySelector("[data-select]").dataset.value) msg = f.dataset.errorRequired; }
      else if (ctl && ctl.validity) {
        if (ctl.validity.valueMissing) msg = f.dataset.errorRequired || ctl.validationMessage;
        else if (!ctl.validity.valid) msg = f.dataset.errorFormat || ctl.validationMessage;
      }
      var err = f.querySelector(".field__error");
      f.toggleAttribute("data-invalid", !!msg);
      err.hidden = !msg; err.querySelector("span").textContent = msg || "";
      var marked = group ? f.querySelectorAll(".choice-group__items input") : [ctl];
      Array.prototype.forEach.call(marked, function (c) { if (msg) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); });
      return !msg;
    }
    // check every Field inside scope (the whole form, or one wizard step); focus the first invalid
    form._hpValidate = function (scope) {
      tried = true;
      var bad = Array.prototype.filter.call((scope || form).querySelectorAll("[data-field]"), function (f) { return !check(f); });
      if (bad.length) { controlOf(bad[0]).focus(); return false; }
      return true;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._hpValidate(form)) form.dispatchEvent(new CustomEvent("formvalid", { bubbles: true }));
    });
    function recheck(e) { if (!tried) return; var f = e.target.closest("[data-field]"); if (f) check(f); }
    form.addEventListener("input", recheck);
    form.addEventListener("change", recheck);
    form.addEventListener("datechange", recheck);
    form.addEventListener("selectchange", recheck);
    form.addEventListener("reset", function () { tried = false; setTimeout(function () { form.querySelectorAll("[data-field]").forEach(function (f) { f.removeAttribute("data-invalid"); f.querySelector(".field__error").hidden = true; f.querySelectorAll("[aria-invalid]").forEach(function (c) { c.removeAttribute("aria-invalid"); }); }); }); });
  });
})();`;
