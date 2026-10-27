// Regenerates docs/stepper.html from tokens/components/stepper.tokens.json.
// The indicator and the Wizard around it live in tools/lib/stepper.mjs; the
// Wizard's steps are real Fields (tools/lib/field.mjs, select.mjs,
// date-picker.mjs) and Next validates them through Form.
// Run: node tools/build-stepper-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { STEPPER_COLOR_PATHS, STEPPER_CSS, WIZARD_CSS, WIZARD_JS, stepperHtml, wizardHtml } from "./lib/stepper.mjs";
import { FIELD_COLOR_PATHS, FIELD_CSS, FORM_JS, TEXT_FIELD_JS, fieldHtml, textFieldHtml, describedBy } from "./lib/field.mjs";
import { SELECT_COLOR_PATHS, SELECT_CSS, LISTBOX_CSS, SELECT_JS, selectHtml } from "./lib/select.mjs";
import { CALENDAR_CSS, CALENDAR_JS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS, DATE_PICKER_JS, datePickerHtml } from "./lib/date-picker.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// Submit / Cancel are Button primary / secondary base — resolved from button.tokens.json
const button = load("tokens/components/button.tokens.json").component.button;
const role = (n) => n.$value.replace(/[{}]/g, "");
const pr = button.primary, se = button.secondary, bs = pr.size.base;
const btnPaths = [pr.state.default.fill, pr.state.default.label, pr.state.hover.fill, pr.state.pressed.fill, pr.state.focused.ringColor, se.state.default.fill, se.state.default.label, se.state.hover.fill, se.state.pressed.fill].map(role);
const colorPaths = [...new Set([...STEPPER_COLOR_PATHS, ...FIELD_COLOR_PATHS, ...SELECT_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS, ...btnPaths, "text.success"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${STEPPER_CSS}
${WIZARD_CSS}`;
const btnCss = `
/* Button primary / secondary base (see button.html) */
.btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: ${px(resolve(role(bs.height)))}; padding: 0 ${px(resolve(role(bs.paddingX)))}; border: none; border-radius: ${px(resolve(role(pr.radius)))}; cursor: pointer; white-space: nowrap; font-family: ${cv("family.sans")}; ${typoCss(resolve(role(bs.label)))} }
.btn:focus-visible { outline: ${px(resolve(role(pr.state.focused.ringWidth)))} solid ${cv(role(pr.state.focused.ringColor))}; outline-offset: ${px(resolve(role(pr.state.focused.ringOffset)))}; }
.btn--primary { background: ${cv(role(pr.state.default.fill))}; color: ${cv(role(pr.state.default.label))}; }
.btn--primary:hover { background: ${cv(role(pr.state.hover.fill))}; }
.btn--primary:active { background: ${cv(role(pr.state.pressed.fill))}; }
.btn--secondary { background: ${cv(role(se.state.default.fill))}; color: ${cv(role(se.state.default.label))}; }
.btn--secondary:hover { background: ${cv(role(se.state.hover.fill))}; }
.btn--secondary:active { background: ${cv(role(se.state.pressed.fill))}; }
${FIELD_CSS}
${SELECT_CSS}
${LISTBOX_CSS}
${CALENDAR_CSS}
${DATE_PICKER_CSS}
.form-status { margin: 0; min-height: 1.4em; color: ${cv("text.success")}; ${typoCss(resolve("text-style.body-sm"))} }`;

const story = (title, live, note = "") => `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;
const GM = [{ label: "Select students" }, { label: "Message details" }];
const THREE = [{ label: "Details" }, { label: "Time" }, { label: "Review" }];
const indicator = [
  story("Step 1 of 2", stepperHtml(GM, 0), "First step active, the next not yet reached (gray connector)."),
  story("Step 2 of 2", stepperHtml(GM, 1), "Step 1 complete (check, filled connector)."),
  story("Going back — completed steps are buttons", stepperHtml(THREE, 2, { navigable: true }), "Hover a completed step: the disc darkens and the label turns link blue. Upcoming steps are never clickable — no skipping ahead."),
  story("Compact — a phone", stepperHtml(THREE, 1, { compact: true }), "Below 768px the row becomes 'Step 2 of 3 · Time' over a Progress sm bar (forced here)."),
];

const today = "2026-10-27";
const wizard = wizardHtml({ id: "wz", submit: "Book appointment", steps: [
  { label: "Details", title: "Your details", body: `${fieldHtml({ id: "wz-name", required: true, errors: { required: "Enter your full name." }, control: textFieldHtml({ id: "wz-name", label: "Full name", required: true, autocomplete: "name", describedBy: describedBy("wz-name", { description: false }) }) })}
    ${fieldHtml({ id: "wz-email", required: true, description: "We send the confirmation there.", errors: { required: "Enter your email.", format: "Enter an email like name@school.edu." }, control: textFieldHtml({ id: "wz-email", label: "Email", type: "email", required: true, autocomplete: "email", describedBy: describedBy("wz-email") }) })}` },
  { label: "Time", title: "When and with whom", body: `${fieldHtml({ id: "wz-dept", required: true, errors: { required: "Choose a department." }, control: selectHtml({ id: "wz-dept", label: "Department", options: ["Advising", "Financial aid", "Registrar"].map((label) => ({ label })), describedBy: describedBy("wz-dept", { description: false }) }) })}
    ${fieldHtml({ id: "wz-date-trigger", label: "Preferred date", required: true, errors: { required: "Choose a date." }, control: datePickerHtml({ id: "wz-date", today, min: today, block: true, triggerId: "wz-date-trigger", describedBy: describedBy("wz-date-trigger", { description: false }) }) })}` },
  { label: "Review", title: "Anything else?", body: `${fieldHtml({ id: "wz-notes", description: "Anything your advisor should know before you meet.", control: textFieldHtml({ id: "wz-notes", label: "Notes (optional)", area: true, describedBy: describedBy("wz-notes") }) })}` },
] });
const statusScript = `document.addEventListener("formvalid", (e) => { const s = e.target.querySelector(".form-status"); if (s) s.textContent = "Booked."; });
document.addEventListener("wizardcancel", (e) => { const s = e.target.querySelector(".form-status"); if (s) s.textContent = "Cancelled — back to the start."; });`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Stepper</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root { --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa; --border: #e4e3df; --border-strong: #d2d1cb; --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87; --accent: #0468c4; --accent-bg: #eff6ff; --code-bg: #1e1e22; --code-text: #e4e3df; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; --sans: -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
  * { box-sizing: border-box; } body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); } .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; min-width: 0; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 110px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story--wide { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  .wz-demo { max-width: 480px; }
  ${css}
  ${btnCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("stepper")}</nav>
  <main>
    <h1>Stepper</h1>
    <p class="sub">tokens/components/stepper.tokens.json · generated — the step indicator for a short (2–4 step) flow, and the <b>Wizard</b> around it. Recipe and behaviour in <code class="tok">tools/lib/stepper.mjs</code>.</p>

    <div class="legend">
      <div class="row"><b>States</b><span>inactive = gray disc · active = fill.primary disc + number · complete = the same fill, the number becomes a check. The connector into a reached step fills blue.</span></div>
      <div class="row"><b>Going back</b><span>Completed steps are buttons back to that step (hover: the disc darkens, the label turns link blue). Upcoming steps never are. Turn it off when a step can't be undone (after a payment).</span></div>
      <div class="row"><b>Phone</b><span>Below 768px: "Step 2 of 3 · Time" over a Progress sm bar — the full row doesn't fit.</span></div>
      <div class="row"><b>Wizard footer</b><span>Right-aligned, Secondary then Primary. First step: <b>Cancel</b> (nowhere to go back to). Middle steps: <b>Back</b> + <b>Next</b>. Last step: the action's own name — "Book appointment", "Send" — never "Submit" or "Finish".</span></div>
      <div class="row"><b>Validation</b><span>Next is never disabled (a gray button doesn't say why). It checks the step's Fields like <a href="form.html">Form</a> does — messages under the fields, focus on the first — and only then moves on. The last step checks every step and opens the first one that isn't right.</span></div>
      <div class="row"><b>A11y</b><span>An ordered list with <code class="tok">aria-current="step"</code>; completed steps say so; each step's title takes focus when it opens, so a screen reader announces where you are.</span></div>
    </div>

    <h2 class="big-section">Indicator</h2>
    <div class="story-grid" style="grid-template-columns: 1fr">${indicator.join("")}</div>

    <h2 class="big-section" id="wizard">Wizard</h2>
    <p class="section-desc">A real three-step flow. Press Next with the fields empty, fill them in, go back through a completed step, press Cancel on the first step.</p>
    <div class="story-grid">${story("Book an appointment", `<div class="wz-demo">${wizard}</div>`)}</div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${CALENDAR_JS}
${DATE_PICKER_JS}
${TEXT_FIELD_JS}
${SELECT_JS}
${FORM_JS}
${WIZARD_JS}
${statusScript}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/stepper.html"), html);
console.log("wrote docs/stepper.html");
