// Stepper + Wizard — the step indicator (with completed steps you can click
// back to and a compact phone line) and the flow around it: one step's Fields
// at a time, Cancel / Back / Next, the action's own name on the last step,
// validation on Next through Form. One definition for the Stepper page and any
// prototype wizard.
//
// Consumer: STEPPER_COLOR_PATHS into :root, STEPPER_CSS (+ WIZARD_CSS) into its
// sheet, WIZARD_JS after FORM_JS. A Wizard is a <form class="form"> so Form's
// validation and `formvalid` event work on its last step.
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
  breakpoint: load("tokens/primitives/breakpoint.tokens.json").breakpoint,
  ...load("tokens/semantic/color.tokens.json"),
};
const st = load("tokens/components/stepper.tokens.json").component.stepper;
const progress = load("tokens/components/progress.tokens.json").component.progress;
// a step's title sits like a Form section title: 16px above its first field
const form = load("tokens/components/form.tokens.json").component.form;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`stepper: unresolved token ${ref}`);
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

const s = st.state;
const colorNodes = [form.sectionTitleColor, st.connector.color, st.connector.completeColor, s.inactive.circleBg, s.inactive.circleText, s.inactive.labelColor, s.active.circleBg, s.active.circleText, s.active.labelColor,
  s.complete.circleBg, s.complete.circleIcon, s.complete.labelColor, s.complete.hoverCircleBg, s.complete.hoverLabelColor, st.focus.ringColor, st.compact.count, progress.track, progress.indicator];
export const STEPPER_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];
const bp = resolveToken(get("breakpoint.md"));

export const STEPPER_CSS = `
.stepper { display: flex; align-items: center; margin: 0; padding: 0; list-style: none; font-family: var(${cssVarName("family.sans")}); }
.stepper__step { display: inline-flex; align-items: center; gap: ${D(st.gap)}; flex-shrink: 0; margin: 0; padding: 0; border: none; background: none; font-family: inherit; border-radius: ${D(st.focus.radius)}; }
.stepper__circle { box-sizing: border-box; flex-shrink: 0; width: ${D(st.circle.size)}; height: ${D(st.circle.size)}; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; ${T(st.circle.label)} }
.stepper__check { width: ${D(st.circle.iconSize)}; height: ${D(st.circle.iconSize)}; display: none; }
.stepper__label { ${T(st.text)} white-space: nowrap; }
.stepper__connector { flex: 1; min-width: 24px; height: ${D(st.connector.thickness)}; background: ${R(st.connector.color)}; margin: 0 ${D(st.gap)}; }
.stepper__connector--filled { background: ${R(st.connector.completeColor)}; }
.stepper__step--inactive .stepper__circle { background: ${R(s.inactive.circleBg)}; color: ${R(s.inactive.circleText)}; }
.stepper__step--inactive .stepper__label { color: ${R(s.inactive.labelColor)}; }
.stepper__step--active .stepper__circle { background: ${R(s.active.circleBg)}; color: ${R(s.active.circleText)}; }
.stepper__step--active .stepper__label { color: ${R(s.active.labelColor)}; }
.stepper__step--complete .stepper__circle { background: ${R(s.complete.circleBg)}; color: ${R(s.complete.circleIcon)}; }
.stepper__step--complete .stepper__label { color: ${R(s.complete.labelColor)}; }
.stepper__step--complete .stepper__num { display: none; }
.stepper__step--complete .stepper__check { display: block; }
/* a completed step you can go back to */
button.stepper__step--complete { cursor: pointer; }
button.stepper__step--complete:hover .stepper__circle { background: ${R(s.complete.hoverCircleBg)}; }
button.stepper__step--complete:hover .stepper__label { color: ${R(s.complete.hoverLabelColor)}; }
button.stepper__step:focus-visible { outline: ${D(st.focus.ringWidth)} solid ${R(st.focus.ringColor)}; outline-offset: ${D(st.focus.ringOffset)}; }
/* compact — "Step 2 of 3 · Time" over a Progress sm bar */
.stepper-compact { display: none; flex-direction: column; gap: ${D(st.compact.gap)}; font-family: var(${cssVarName("family.sans")}); }
.stepper-compact__text { margin: 0; color: ${R(s.active.labelColor)}; ${T(st.text)} }
.stepper-compact__count { color: ${R(st.compact.count)}; }
.stepper-compact__bar { height: ${D(progress.sizes.sm.height)}; border-radius: ${D(progress.radius)}; background: ${R(progress.track)}; overflow: hidden; }
.stepper-compact__fill { height: 100%; border-radius: inherit; background: ${R(progress.indicator)}; transition: width 0.2s ease; }
.stepper-wrap--compact .stepper { display: none; }
.stepper-wrap--compact .stepper-compact { display: flex; }
.stepper .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: ${bp.value - 0.02}${bp.unit}) {
  .stepper-wrap .stepper { display: none; }
  .stepper-wrap .stepper-compact { display: flex; }
}`;

export const WIZARD_CSS = `
.wizard { display: flex; flex-direction: column; gap: ${D(st.wizard.gap)}; }
.wizard__panel { display: flex; flex-direction: column; gap: ${D(st.wizard.gap)}; }
.wizard__panel[hidden], .wizard__footer [hidden] { display: none; }
.wizard__title { margin: 0 0 calc(${D(form.sectionTitleGap)} - ${D(st.wizard.gap)}); padding: 0; outline: none; color: ${R(form.sectionTitleColor)}; ${T(form.sectionTitle)} }
.wizard__footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: ${D(st.wizard.footerGap)}; }`;

const check = () => icon("check", "stepper__check");

/** The indicator. steps: [{ label }]; current: index; navigable: completed steps are buttons. */
export function stepperHtml(steps, current = 0, { navigable = false, compact = false } = {}) {
  const parts = [];
  steps.forEach((step, i) => {
    const state = i < current ? "complete" : i === current ? "active" : "inactive";
    if (i > 0) parts.push(`<li class="stepper__connector${i <= current ? " stepper__connector--filled" : ""}" aria-hidden="true"></li>`);
    const inner = `<span class="stepper__circle"><span class="stepper__num">${i + 1}</span>${check()}</span><span class="stepper__label">${step.label}</span>`;
    const a11y = state === "active" ? ' aria-current="step"' : "";
    parts.push(state === "complete" && navigable
      ? `<li style="display:contents"><button type="button" class="stepper__step stepper__step--complete" data-goto="${i}">${inner}<span class="visually-hidden"> (completed — go back)</span></button></li>`
      : `<li class="stepper__step stepper__step--${state}"${a11y}>${inner}${state === "complete" ? '<span class="visually-hidden"> (completed)</span>' : ""}</li>`);
  });
  const pct = Math.round(((current + 1) / steps.length) * 100);
  return `<div class="stepper-wrap${compact ? " stepper-wrap--compact" : ""}">
  <ol class="stepper" aria-label="Progress">${parts.join("")}</ol>
  <div class="stepper-compact" aria-hidden="true"><p class="stepper-compact__text"><span class="stepper-compact__count">Step ${current + 1} of ${steps.length}</span> · ${steps[current].label}</p><div class="stepper-compact__bar"><div class="stepper-compact__fill" style="width:${pct}%"></div></div></div>
</div>`;
}

/** A Wizard: steps [{ label, title, body }], the last step's action name (`submit`). */
export function wizardHtml({ id, steps, submit, navigable = true }) {
  const panels = steps.map((st, i) => `<section class="wizard__panel" data-step="${i}"${i ? " hidden" : ""} aria-labelledby="${id}-t${i}">
    <h2 class="wizard__title" id="${id}-t${i}" tabindex="-1">${st.title || st.label}</h2>
    ${st.body}
  </section>`).join("\n  ");
  return `<form class="form wizard" id="${id}" data-wizard${navigable ? " data-navigable" : ""} data-labels='${JSON.stringify(steps.map((x) => x.label)).replace(/'/g, "&#39;")}'>
  ${stepperHtml(steps, 0, { navigable })}
  ${panels}
  <div class="wizard__footer">
    <button class="btn btn--secondary" type="button" data-back>Cancel</button>
    <button class="btn btn--primary" type="button" data-next>Next</button>
    <button class="btn btn--primary" type="submit" data-submit hidden>${submit}</button>
  </div>
  <p class="form-status" role="status"></p>
</form>`;
}

// Next checks the current step's Fields (Form's own check — messages under the
// fields, focus on the first); Back goes back; on the first step the secondary
// button is Cancel. A completed step in a navigable wizard is a button back to
// it. The new step's title takes focus so a screen reader announces it.
export const WIZARD_JS = `(function () {
  document.querySelectorAll("[data-wizard]").forEach(function (form) {
    if (form._hpwiz) return; form._hpwiz = true;
    var labels = JSON.parse(form.dataset.labels), n = labels.length, cur = 0, navigable = form.hasAttribute("data-navigable");
    var panels = form.querySelectorAll(".wizard__panel"), back = form.querySelector("[data-back]"), next = form.querySelector("[data-next]"), submit = form.querySelector("[data-submit]");
    var list = form.querySelector(".stepper"), ctext = form.querySelector(".stepper-compact__text"), cfill = form.querySelector(".stepper-compact__fill");
    var check = list.querySelector(".stepper__check") ? list.querySelector(".stepper__check").outerHTML : "";
    function render() {
      var html = "";
      labels.forEach(function (label, i) {
        var state = i < cur ? "complete" : i === cur ? "active" : "inactive";
        if (i) html += '<li class="stepper__connector' + (i <= cur ? " stepper__connector--filled" : "") + '" aria-hidden="true"></li>';
        var inner = '<span class="stepper__circle"><span class="stepper__num">' + (i + 1) + "</span>" + check + '</span><span class="stepper__label">' + label + "</span>";
        html += state === "complete" && navigable
          ? '<li style="display:contents"><button type="button" class="stepper__step stepper__step--complete" data-goto="' + i + '">' + inner + '<span class="visually-hidden"> (completed — go back)</span></button></li>'
          : '<li class="stepper__step stepper__step--' + state + '"' + (state === "active" ? ' aria-current="step"' : "") + ">" + inner + (state === "complete" ? '<span class="visually-hidden"> (completed)</span>' : "") + "</li>";
      });
      list.innerHTML = html;
      ctext.innerHTML = '<span class="stepper-compact__count">Step ' + (cur + 1) + " of " + n + "</span> · " + labels[cur];
      cfill.style.width = Math.round(((cur + 1) / n) * 100) + "%";
      panels.forEach(function (p, i) { p.hidden = i !== cur; });
      back.textContent = cur === 0 ? "Cancel" : "Back";
      next.hidden = cur === n - 1; submit.hidden = cur !== n - 1;
    }
    function go(i, focus) { cur = i; render(); if (focus !== false) { var t = panels[cur].querySelector(".wizard__title"); if (t) t.focus(); } }
    next.addEventListener("click", function () { if (form._hpValidate(panels[cur])) go(cur + 1); });
    back.addEventListener("click", function () {
      if (cur > 0) { go(cur - 1); return; }
      form.reset(); go(0, false); form.dispatchEvent(new CustomEvent("wizardcancel", { bubbles: true }));
    });
    list.addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (b) go(+b.dataset.goto); });
    // the last step submits the whole form: check the steps in order and open the first that isn't right
    form.addEventListener("submit", function (e) {
      for (var i = 0; i < n; i++) if (!form._hpValidate(panels[i])) { e.preventDefault(); e.stopImmediatePropagation(); go(i, false); form._hpValidate(panels[i]); return; }
    }, true);
    render();
  });
})();`;
