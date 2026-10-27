// Slider — a number (or a range) on a scale. One definition for the Slider
// page and Form. Each thumb is a real <input type="range"> (keyboard, screen
// readers, forms for free); a range is two inputs over one painted track.
// The painted fill follows the thumbs' centres through --lo / --hi (0–1),
// which SLIDER_JS keeps in sync with the inputs.
//
// Consumer: SLIDER_COLOR_PATHS into :root, SLIDER_CSS into its sheet,
// SLIDER_JS after the markup. Each .slider fires a bubbling `sliderchange`
// event (detail.value — a number, or [lo, hi] for a range).
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
const sl = load("tokens/components/slider.tokens.json").component.slider;
// the label is the Field's label, resolved from field.tokens.json
const field = load("tokens/components/field.tokens.json").component.field;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`slider: unresolved token ${ref}`);
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

const colorNodes = [sl.track.bg, sl.track.fill, sl.track.fillHover, sl.thumb.bg, sl.thumb.border, sl.thumb.borderHover, sl.thumb.halo, sl.focus.ringColor,
  sl.disabled.track, sl.disabled.fill, sl.disabled.thumbBorder, sl.valueColor, sl.markColor, field.labelColor, field.descriptionColor];
export const SLIDER_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];

const sh = resolveToken(sl.thumb.shadow);
const shadow = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const thumb = resolveToken(sl.thumb.size).value;
const half = thumb / 2;
// a point at fraction f along the thumb's travel (its centre), as a CSS length
const at = (f) => `calc(${f} * (100% - ${thumb}px) + ${half}px)`;
const thumbCss = (sel, rules) => `${sel.replace(/THUMB/g, "::-webkit-slider-thumb")} { ${rules} }\n${sel.replace(/THUMB/g, "::-moz-range-thumb")} { ${rules} }`;

export const SLIDER_CSS = `
.slider { --lo: 0; --hi: 0; display: flex; flex-direction: column; gap: ${D(field.labelGap)}; min-width: 0; font-family: var(${cssVarName("family.sans")}); }
.slider__head { display: flex; align-items: baseline; justify-content: space-between; gap: ${D(field.labelGap)}; }
.slider__label { color: ${R(field.labelColor)}; ${T(field.label)} }
.slider__value { color: ${R(sl.valueColor)}; ${T(sl.value)} font-variant-numeric: tabular-nums; white-space: nowrap; }
.slider__control { position: relative; height: ${D(sl.height)}; }
/* the painted scale: empty track + the chosen part between the thumbs' centres */
.slider__track { position: absolute; left: ${half}px; right: ${half}px; top: 50%; height: ${D(sl.track.height)}; transform: translateY(-50%); border-radius: ${D(sl.track.radius)}; background: ${R(sl.track.bg)}; }
.slider__fill { position: absolute; top: 50%; height: ${D(sl.track.height)}; transform: translateY(-50%); left: ${at("var(--lo)")}; width: calc((var(--hi) - var(--lo)) * (100% - ${thumb}px)); border-radius: ${D(sl.track.radius)}; background: ${R(sl.track.fill)}; }
.slider:not(.is-disabled) .slider__control:hover .slider__fill { background: ${R(sl.track.fillHover)}; }
/* the real inputs: transparent, only their thumbs are drawn */
.slider__input { -webkit-appearance: none; appearance: none; position: absolute; inset: 0; width: 100%; height: ${D(sl.height)}; margin: 0; padding: 0; background: transparent; outline: none; cursor: pointer; }
.slider--range .slider__input { pointer-events: none; }
.slider__input::-webkit-slider-runnable-track { height: ${D(sl.height)}; background: transparent; }
.slider__input::-moz-range-track { height: ${D(sl.height)}; background: transparent; }
${thumbCss(".slider__inputTHUMB", `-webkit-appearance: none; appearance: none; pointer-events: auto; box-sizing: border-box; width: ${thumb}px; height: ${thumb}px; border-radius: 50%; background: ${R(sl.thumb.bg)}; border: ${D(sl.thumb.borderWidth)} solid ${R(sl.thumb.border)}; box-shadow: ${shadow}; cursor: grab; transition: box-shadow 0.12s ease`)}
${thumbCss(".slider__input:hover:not(:disabled)THUMB, .slider__input:active:not(:disabled)THUMB", `border-color: ${R(sl.thumb.borderHover)}; box-shadow: ${shadow}, 0 0 0 ${D(sl.thumb.haloSize)} ${R(sl.thumb.halo)}`)}
${thumbCss(".slider__input:active:not(:disabled)THUMB", "cursor: grabbing")}
${thumbCss(".slider__input:focus-visibleTHUMB", `outline: ${D(sl.focus.ringWidth)} solid ${R(sl.focus.ringColor)}; outline-offset: ${D(sl.focus.ringOffset)}`)}
/* disabled */
.slider.is-disabled .slider__track { background: ${R(sl.disabled.track)}; }
.slider.is-disabled .slider__fill { background: ${R(sl.disabled.fill)}; }
.slider.is-disabled .slider__label, .slider.is-disabled .slider__value { color: ${R(sl.disabled.fill)}; }
.slider__input:disabled { cursor: not-allowed; }
${thumbCss(".slider__input:disabledTHUMB", `border-color: ${R(sl.disabled.thumbBorder)}; box-shadow: none; cursor: not-allowed`)}
/* marks under the track */
.slider__marks { position: relative; height: ${px(resolveToken(sl.mark).fontSize)}; margin-top: calc(${D(sl.markGap)} - ${D(field.labelGap)}); color: ${R(sl.markColor)}; ${T(sl.mark)} font-variant-numeric: tabular-nums; }
.slider__mark { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
.slider__mark:first-child { transform: none; }
.slider__mark:last-child { transform: translateX(-100%); }`;

/** A Slider. value: a number, or [lo, hi] for a range. marks: true = the two ends, "steps" = every step
 *  (for a short integer scale), or an array of values. suffix / decimals format the shown value. */
export function sliderHtml({ id, label, min = 0, max = 100, step = 1, value = 0, marks = false, suffix = "", decimals = 0, disabled = false, describedBy = "" }) {
  const range = Array.isArray(value);
  const vals = range ? value : [value];
  const f = (v) => ((v - min) / (max - min)).toFixed(4);
  const fmt = (v) => `${Number(v).toFixed(decimals)}${suffix}`;
  const shown = range ? `${fmt(vals[0])} – ${fmt(vals[1])}` : fmt(vals[0]);
  const lo = range ? f(vals[0]) : 0, hi = f(vals[vals.length - 1]);
  const names = range ? [`${label}, minimum`, `${label}, maximum`] : [label];
  const inputs = vals.map((v, i) => `<input type="range" class="slider__input" id="${range ? `${id}-${i ? "max" : "min"}` : id}" min="${min}" max="${max}" step="${step}" value="${v}" aria-label="${names[i]}" aria-valuetext="${fmt(v)}"${describedBy ? ` aria-describedby="${describedBy}"` : ""}${disabled ? " disabled" : ""} />`).join("");
  let markVals = [];
  if (marks === true) markVals = [min, max];
  else if (marks === "steps") for (let v = min; v <= max + 1e-9; v += step) markVals.push(+v.toFixed(6));
  else if (Array.isArray(marks)) markVals = marks;
  const markHtml = markVals.length ? `<div class="slider__marks" aria-hidden="true">${markVals.map((v) => `<span class="slider__mark" style="left: ${at(f(v))}">${fmt(v)}</span>`).join("")}</div>` : "";
  return `<div class="slider${range ? " slider--range" : ""}${disabled ? " is-disabled" : ""}" data-slider data-suffix="${suffix}" data-decimals="${decimals}" style="--lo: ${lo}; --hi: ${hi}">
  <div class="slider__head"><span class="slider__label" id="${id}-label">${label}</span><output class="slider__value" id="${id}-value">${shown}</output></div>
  <div class="slider__control"><div class="slider__track"></div><div class="slider__fill"></div>${inputs}</div>${markHtml ? `\n  ${markHtml}` : ""}
</div>`;
}

// Keeps the fill, the shown value and aria-valuetext in step with the thumbs.
// A range can't cross: each thumb stops at the other; the one last moved is on
// top so two thumbs at the same spot can still be pulled apart.
export const SLIDER_JS = `(function () {
  document.querySelectorAll("[data-slider]").forEach(function (el) {
    if (el._hpsl) return; el._hpsl = true;
    var inputs = el.querySelectorAll(".slider__input"), out = el.querySelector(".slider__value");
    var suffix = el.dataset.suffix || "", dec = +el.dataset.decimals || 0;
    function fmt(v) { return Number(v).toFixed(dec) + suffix; }
    function frac(i) { var min = +i.min, max = +i.max; return (i.value - min) / (max - min); }
    function sync(moved) {
      if (inputs.length === 2) {
        var a = inputs[0], b = inputs[1];
        if (+a.value > +b.value) { if (moved === a) a.value = b.value; else b.value = a.value; }
        a.style.zIndex = moved === a ? 2 : 1; b.style.zIndex = moved === b ? 2 : 1;
        el.style.setProperty("--lo", frac(a)); el.style.setProperty("--hi", frac(b));
        out.textContent = fmt(a.value) + " – " + fmt(b.value);
      } else { el.style.setProperty("--lo", 0); el.style.setProperty("--hi", frac(inputs[0])); out.textContent = fmt(inputs[0].value); }
      inputs.forEach(function (i) { i.setAttribute("aria-valuetext", fmt(i.value)); });
      el.dispatchEvent(new CustomEvent("sliderchange", { bubbles: true, detail: { value: inputs.length === 2 ? [+inputs[0].value, +inputs[1].value] : +inputs[0].value } }));
    }
    inputs.forEach(function (i) { i.addEventListener("input", function () { sync(i); }); });
  });
})();`;
