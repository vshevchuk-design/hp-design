// Regenerates docs/form.html from tokens/components/field.tokens.json and
// form.tokens.json. Field (label, control, description, error) and Form (one
// column, sections, actions, validate on Submit) — the recipe and behaviour
// live in tools/lib/field.mjs, so later Fields (Combobox, NumberField, …)
// plug into the same wrapper.
// Run: node tools/build-form-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { FIELD_COLOR_PATHS, FIELD_CSS, FORM_JS, TEXT_FIELD_JS, fieldHtml, textFieldHtml, describedBy } from "./lib/field.mjs";
import { CALENDAR_CSS, CALENDAR_JS } from "./lib/calendar.mjs";
import { DATE_PICKER_CSS, DATE_PICKER_COLOR_PATHS, DATE_PICKER_JS, datePickerHtml } from "./lib/date-picker.mjs";
import { CHOICE_COLOR_PATHS, RADIO_CSS, CHOICE_GROUP_CSS, choiceGroupHtml } from "./lib/choice.mjs";
import { SELECT_COLOR_PATHS, SELECT_CSS, LISTBOX_CSS, SELECT_JS, selectHtml } from "./lib/select.mjs";

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
const field = load("tokens/components/field.tokens.json").component.field;
const form = load("tokens/components/form.tokens.json").component.form;

const colorPaths = [...new Set([...FIELD_COLOR_PATHS, ...CHOICE_COLOR_PATHS, ...SELECT_COLOR_PATHS, ...DATE_PICKER_COLOR_PATHS, ...btnPaths, "text.success", "text.secondary"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
${FIELD_CSS}`;
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
${CALENDAR_CSS}
${DATE_PICKER_CSS}
${RADIO_CSS}
${CHOICE_GROUP_CSS}
${SELECT_CSS}
${LISTBOX_CSS}
.form-status { margin: 0; min-height: 1.4em; color: ${cv("text.success")}; ${typoCss(resolve("text-style.body-sm"))} }`;

// ---- stories ----
const today = "2026-10-26";
const username = (id, { required = false } = {}) => fieldHtml({
  id, required, description: "Your public display name.", errors: { required: "Username is required." },
  control: textFieldHtml({ id, label: "Username", required, autocomplete: "username", describedBy: describedBy(id) }),
});
const formWrap = (id, fields, actions = `<button class="btn btn--primary" type="submit">Submit</button>`) => `<form class="form" id="${id}">
${fields}
<div class="form__actions">${actions}</div>
<p class="form-status" role="status"></p>
</form>`;

const defaultForm = formWrap("form-default", username("f1-username"));
const validationForm = formWrap("form-validation", username("f2-username", { required: true }));

// Field states — static, each one a single Field
const states = [
  ["Default", fieldHtml({ id: "s1", control: textFieldHtml({ id: "s1", label: "Username", describedBy: describedBy("s1", { description: false }) }) }), "Floating label, nothing under the field."],
  ["With description", fieldHtml({ id: "s2", description: "Your public display name.", control: textFieldHtml({ id: "s2", label: "Username", describedBy: describedBy("s2") }) }), `${px(resolve(role(field.messageGap)))} under the field, body-sm · text.secondary.`],
  ["Error", fieldHtml({ id: "s3", description: "Your public display name.", error: "Username is required.", control: textFieldHtml({ id: "s3", label: "Username", describedBy: describedBy("s3") }) }), "Description stays; the error goes under it with its icon. Input's error border. The label stays text.default."],
  ["Label above", fieldHtml({ id: "s4-trigger", label: "Preferred date", description: "We'll confirm by email.", control: datePickerHtml({ id: "s4", today, min: today, block: true, triggerId: "s4-trigger", describedBy: describedBy("s4-trigger") }) }), "For a control with no floating label of its own — here a DatePicker. heading-sm, 8px above the control."],
  ["Optional", fieldHtml({ id: "s5", description: "Anything your advisor should know before you meet.", control: textFieldHtml({ id: "s5", label: "Notes (optional)", area: true, describedBy: describedBy("s5") }) }), "Required is the norm and isn't marked — the rare optional field says so in its label."],
];

// A real form: sections, several controls, validation
const bookForm = formWrap("form-book", `<fieldset class="form__section">
  <legend class="form__section-title">Your details</legend>
  ${fieldHtml({ id: "b-name", required: true, errors: { required: "Enter your full name." }, control: textFieldHtml({ id: "b-name", label: "Full name", required: true, autocomplete: "name", describedBy: describedBy("b-name", { description: false }) }) })}
  ${fieldHtml({ id: "b-email", required: true, description: "Your school email — we send the confirmation there.", errors: { required: "Enter your email.", format: "Enter an email like name@school.edu." }, control: textFieldHtml({ id: "b-email", label: "Email", type: "email", required: true, autocomplete: "email", describedBy: describedBy("b-email") }) })}
</fieldset>
<fieldset class="form__section">
  <legend class="form__section-title">Appointment</legend>
  ${fieldHtml({ id: "b-dept", required: true, errors: { required: "Choose a department." }, control: selectHtml({ id: "b-dept", label: "Department", options: ["Advising", "Financial aid", "Registrar", "Career services"].map((label) => ({ label })), describedBy: describedBy("b-dept", { description: false }) }) })}
  ${fieldHtml({ id: "b-date-trigger", label: "Preferred date", required: true, errors: { required: "Choose a date." }, control: datePickerHtml({ id: "b-date", today, min: today, block: true, triggerId: "b-date-trigger", describedBy: describedBy("b-date-trigger", { description: false }) }) })}
  ${choiceGroupHtml({ name: "b-format", legend: "Meeting format", required: true, errors: { required: "Choose a meeting format." }, direction: "horizontal", items: [{ label: "In person" }, { label: "Online" }] })}
  ${fieldHtml({ id: "b-notes", description: "Anything your advisor should know before you meet.", control: textFieldHtml({ id: "b-notes", label: "Notes (optional)", area: true, describedBy: describedBy("b-notes") }) })}
</fieldset>`, `<button class="btn btn--primary" type="submit">Book appointment</button><button class="btn btn--secondary" type="reset">Cancel</button>`);

const story = (title, live, note, wide = false) => `<div class="story${wide ? " story--wide" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div><p class="story-note">${note}</p></div>`;
const statusScript = `document.addEventListener("formvalid", function (e) { var s = e.target.querySelector(".form-status"); if (s) s.textContent = "Submitted."; });
document.addEventListener("reset", function (e) { var s = e.target.querySelector && e.target.querySelector(".form-status"); if (s) s.textContent = ""; }, true);
document.addEventListener("input", function (e) { var f = e.target.closest && e.target.closest("form"); var s = f && f.querySelector(".form-status"); if (s) s.textContent = ""; });`;

const sample = `<form class="form">
  <div class="field" data-field data-required data-error-required="Username is required.">
    <div class="text-field">
      <label class="text-field__label" for="username">Username</label>
      <input class="text-field__control" id="username" placeholder="Username" required
             aria-describedby="username-desc username-error" />
    </div>
    <p class="field__description" id="username-desc">Your public display name.</p>
    <p class="field__error" id="username-error" hidden>…error icon…<span></span></p>
  </div>
  <div class="form__actions"><button class="btn btn--primary" type="submit">Submit</button></div>
</form>

<!-- A control without a floating label gets the Field's own label above it: -->
<div class="field" data-field>
  <label class="field__label" id="date-label" for="date">Preferred date</label>
  …DatePicker, trigger id="date", aria-labelledby="date-label date"…
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Form</title>
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
  ${css}
  ${btnCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("form")}</nav>
  <main>
    <h1>Form</h1>
    <p class="sub">tokens/components/field.tokens.json + form.tokens.json · generated — <b>Field</b> wraps any control with its label, description and error; <b>Form</b> stacks Fields, splits them into sections and validates on Submit.</p>

    <div class="legend">
      <div class="row"><b>Field</b><span>Control, then a description (${px(resolve(role(field.messageGap)))} below, body-sm · text.secondary), then the error. Every later field (Combobox, NumberField, MultiSelect…) sits in this same wrapper.</span></div>
      <div class="row"><b>Label</b><span>Input and Select keep their <b>floating</b> label — resting, the placeholder shows it; it floats to 12px on focus or once there's a value. A label <b>above</b> (heading-sm, ${px(resolve(role(field.labelGap)))}) only for controls without one: DatePicker, a checkbox or radio group, Switch, Input sm.</span></div>
      <div class="row"><b>No Label component</b><span>Radix/shadcn's <code class="tok">Label</code> is a styled <code class="tok">&lt;label&gt;</code>. Here it's built in where labels live: the Field's label above, Input/Select's floating label, the text beside a <a href="checkbox.html">Checkbox</a> / <a href="radio.html">Radio</a>. Each wires <code class="tok">for</code>/<code class="tok">id</code> itself, and there are exactly two looks (heading-sm above a field, body-base beside a check) — no weight or tone props to pick per screen.</span></div>
      <div class="row"><b>Error</b><span>Under the description — it stays, since it usually explains the rule. text.danger with the error icon (never colour alone), the control takes Input's <code class="tok">border.danger</code>, the label stays text.default. <code class="tok">aria-invalid</code> on the control, the message wired through <code class="tok">aria-describedby</code>.</span></div>
      <div class="row"><b>When</b><span>On Submit — nothing is red before the first attempt. After it, each field re-checks as it's corrected, so the error clears the moment it's fixed. Submit with errors moves focus to the first invalid field.</span></div>
      <div class="row"><b>Required</b><span>The norm, not marked. The rare optional field says "(optional)" — fewer marks than asterisks on every field.</span></div>
      <div class="row"><b>Layout</b><span>One column, max ${px(resolve(role(form.maxWidth)))} (Dialog sm's width). ${px(resolve(role(form.fieldGap)))} between fields, ${px(resolve(role(form.sectionGap)))} between sections (<code class="tok">&lt;fieldset&gt;</code> + <code class="tok">&lt;legend&gt;</code>, heading-md). Actions under the last field, Primary first.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">
      ${story("Default", defaultForm, "Username with a description. Not required — Submit goes through.")}
      ${story("With validation", validationForm, "Required. Press Submit with it empty: the error appears under the description and focus moves to the field. Type — it clears.")}
    </div>

    <h2 class="big-section">Field states</h2>
    <div class="story-grid">
      ${states.map(([t, live, note]) => story(t, live, note)).join("\n      ")}
    </div>

    <h2 class="big-section">A real form</h2>
    <p class="section-desc">Two sections, a floating-label input, an email with a format rule, a Select, a DatePicker with its label above, a RadioGroup, an optional text area. Press Book appointment empty, then fill it in.</p>
    <div class="story-grid">
      ${story("Book an appointment", bookForm, "Email checks its format only once it isn't empty; Cancel resets the form and clears the errors.", true)}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(sample)}</code></pre>

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
${statusScript}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/form.html"), html);
console.log("wrote docs/form.html");
