// Generates ARM Admin → Global Settings (Designs → ARM Admin → Global Settings):
//   docs/designs/arm-global-settings.html      — viewer page (design-viewer.mjs chrome)
//   docs/designs/arm-global-settings-app.html  — the prototype
//
// A restyle of the live ARM Admin Global Settings page, read off a saved copy
// of it (2026-10-31): same sections, fields, copy and order — Email, Phone,
// SMS (Twilio), Advising Note Email (with its rich-text body and Insert Tag),
// then Save — on DS components. ARM Admin is a section of the CX app (it's in
// CX_NAV), so the page sits on the shared CX shell (tools/lib/cx-shell.mjs).
//
// Deliberate changes from the live page, all "our language" rather than new UX:
// the "Last Updated" card became a quiet meta line beside Save, both moved to
// the top (context, not a section); Save is off until something changes and
// leaving with unsaved changes asks first; Test Email / Test SMS are the live dialogs on DS Dialog; the
// tag names in the Body's help text are neutral Badges. The live copy didn't
// serialise the SMS credentials, so those values are sample data.
// Run: node tools/build-design-arm-global-settings.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { cxApp, icon } from "./lib/cx-shell.mjs";
import { CX_USER } from "./lib/cx-data.mjs";
import { fieldHtml, textFieldHtml, describedBy, TEXT_FIELD_JS } from "./lib/field.mjs";
import { selectHtml, SELECT_JS } from "./lib/select.mjs";
import { checkboxHtml, CHECKBOX_CSS, CHOICE_COLOR_PATHS } from "./lib/choice.mjs";
import { COMPOSER_TOOLBAR_CSS, COMPOSER_BOX_CSS, COMPOSER_TOOLBAR_JS, COMPOSER_COLOR_PATHS, composerToolbarHtml } from "./lib/composer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const composer = JSON.parse(fs.readFileSync(path.join(root, "tokens/components/composer.tokens.json"))).component.composer;
const composerColorPaths = [];
(function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.$type === "color" && typeof node.$value === "string" && node.$value.startsWith("{")) composerColorPaths.push(node.$value.replace(/[{}]/g, ""));
  for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
})(composer);

// ---- content (live copy, verbatim) ----
const EMAIL_TYPES = ["Microsoft", "Google"].map((label) => ({ label }));
const PHONE_TYPES = ["Mobile", "Home", "Work"].map((label) => ({ label }));
const TAGS = [
  { tag: "{{%noteLink%}}", note: "the clickable link" },
  { tag: "{{%noteSubject%}}", note: "the note’s subject" },
  { tag: "{{%studentFirstName%}}", note: "" },
  { tag: "{{%studentLastName%}}", note: "" },
];
const TEXT_STYLES = ["Normal", "Heading 1", "Heading 2", "Heading 3", "Bulleted list", "Numbered list", "Quote"];
const UPDATED = { at: "10/23/2026 01:09 PM PDT", by: "Alexander Robinson" };
const PROMPTS = ["Show my advisees", "Find a student", "Show my upcoming appointments", "What action item types are available?"];

// ---- markup helpers ----
const card = ({ id, title, description, action = "", body }) => `<section class="card arm-card" aria-labelledby="${id}-title">
  <div class="card__header arm-card__header">
    <div class="arm-card__heading"><h2 class="card__title" id="${id}-title">${title}</h2><p class="card__description">${description}</p></div>
    ${action}
  </div>
  <div class="card__body arm-card__body">
${body}
  </div>
</section>`;
const testBtn = (kind, label) => `<button class="btn btn--secondary btn--sm" type="button" data-test="${kind}">${label}</button>`;
const enable = (id, label, description, checked = true) => `<div class="arm-enable">
      ${checkboxHtml({ id, label, checked })}
      <p class="field__description arm-enable__desc">${description}</p>
    </div>`;
const sel = (id, label, options, value) => fieldHtml({ id, control: selectHtml({ id, label, options, value, describedBy: describedBy(id, { description: false }) }) });
const text = (id, label, { description = "", value = "", type = "text", number = null } = {}) =>
  fieldHtml({ id, description, control: textFieldHtml({ id, label, value, type, number, describedBy: describedBy(id, { description: !!description }) }) });

const views = `<form class="arm-settings" id="arm-form" novalidate>
<div class="arm-actions">
  <p class="arm-actions__meta" id="arm-updated">Last updated <span id="arm-updated-at">${UPDATED.at}</span> by <span id="arm-updated-by">${UPDATED.by}</span></p>
  <button class="btn btn--primary btn--base" type="submit" id="arm-save" disabled>Save</button>
</div>
${card({
  id: "arm-email",
  title: "Email Settings",
  description: "The email switch and address types every product on this deployment sends by. Whether a product sends is set in that product — for Scheduling, on Scheduling Settings.",
  action: testBtn("email", "Test Email"),
  body: `    ${enable("arm-email-on", "Enable Email", "When off, ARM sends no email or calendar invites to students or staff. Advisors' own calendars still update.")}
    <div class="arm-grid">
      ${sel("arm-staff-email", "Staff Email Type", EMAIL_TYPES, "Microsoft")}
      ${sel("arm-student-email", "Student Email Type", EMAIL_TYPES, "Google")}
    </div>`,
})}
${card({
  id: "arm-phone",
  title: "Phone Settings",
  description: "Phone type for SMS reminders. Student phone also appears in notifications and calendar invites.",
  body: `    <div class="arm-grid">
      ${sel("arm-staff-phone", "Staff Phone Type", PHONE_TYPES, "Mobile")}
      ${sel("arm-student-phone", "Student Phone Type", PHONE_TYPES, "Mobile")}
    </div>`,
})}
${card({
  id: "arm-sms",
  title: "SMS Settings",
  description: "The platform SMS connection (Twilio), shared by every product on this deployment. Turning it off stops texting everywhere. Whether a product sends is set in that product — for Scheduling, on Scheduling Settings.",
  action: testBtn("sms", "Test SMS"),
  body: `    ${enable("arm-sms-on", "Enable SMS", "Enable or disable SMS notifications.")}
    <div class="arm-grid">
      ${text("arm-sid", "Account SID", { value: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" })}
      <div class="field" data-field>
        <div class="arm-secret">
          ${textFieldHtml({ id: "arm-token", label: "Auth Token", type: "password", value: "sample-auth-token", readOnly: true, describedBy: "arm-token-error" })}
          <button class="btn btn--secondary btn--base btn--icon-only" type="button" id="arm-token-edit" aria-label="Edit Auth Token" title="Edit Auth Token">${icon("edit", "btn__icon")}</button>
        </div>
        <p class="field__error" id="arm-token-error" hidden><span></span></p>
      </div>
    </div>
    ${text("arm-msid", "Message Service SID", { value: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" })}
    <div class="arm-grid">
      ${text("arm-window", "Appointment Window", { value: "24", number: { min: 0, max: 168 } })}
    </div>
    ${text("arm-trailer", "Message Trailer", { value: "Reply STOP to unsubscribe. Msg&amp;Data Rates May Apply." })}`,
})}
${card({
  id: "arm-note",
  title: "Advising Note Email Settings",
  description: "Configure email notifications sent to students when an advising note is created and marked visible to the student.",
  body: `    ${enable("arm-note-on", "Enable Advising Note Emails", "Send an email to the student when an advising note is created and visible to them.")}
    ${text("arm-from", "From Address", { type: "email", description: "Optional. Overrides the default sender address." })}
    ${text("arm-subject", "Subject", { description: "Leave blank to use the advising note’s subject." })}
    ${text("arm-link-text", "Link Display Text", { description: "Text shown for the clickable link to the note. Defaults to “View your advising note” when blank." })}
    <div class="field">
      <span class="field__label" id="arm-body-label">Body</span>
      <div class="composer composer--rich arm-editor">
        <div class="composer__box">
        ${composerToolbarHtml({ prefix: "arm-body", styles: TEXT_STYLES, menus: [{ kind: "tags", label: "Insert Tag", items: TAGS.map((t) => t.tag) }] })}
        <div class="composer__field arm-editor__field">
          <div class="composer__input arm-editor__input" id="arm-body" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="arm-body-label" aria-describedby="arm-body-desc"><p>Hi {{%studentFirstName%}},</p><p>A new note has been added to your profile. You can view it here: {{%noteLink%}}</p></div>
        </div>
        </div>
      </div>
      <p class="field__description" id="arm-body-desc">Use the toolbar to format the message. Click “Insert Tag” to add ${TAGS.map((t, i) => `<span class="badge badge--neutral badge--regular arm-tag">${t.tag}</span>${t.note ? ` (${t.note})` : ""}${i < TAGS.length - 2 ? ", " : i === TAGS.length - 2 ? ", or " : ""}`).join("")} to personalize the greeting.</p>
    </div>`,
})}
</form>`;

// Test Email / Test SMS — the live dialogs: title, fields, Cancel + Send, no description
const IB_HINT = "Sends through PeopleSoft Integration Broker instead of directly from ARM.";
const testDialog = (kind, title, fields) => `<dialog class="dialog" id="arm-test-${kind}" aria-labelledby="arm-test-${kind}-title">
  <form method="dialog" class="dialog__content" novalidate data-test-form="${kind}">
    <div class="dialog__header">
      <div class="dialog__heading"><h2 class="dialog__title" id="arm-test-${kind}-title">${title}</h2></div>
      <button class="dialog__close" type="button" data-close aria-label="Close">${icon("close", "dialog__close-icon")}</button>
    </div>
    <div class="dialog__body arm-dlg__body">${fields}
    </div>
    <div class="dialog__footer">
      <button class="btn btn--secondary btn--base" type="button" data-close>Cancel</button>
      <button class="btn btn--primary btn--base" type="submit">Send</button>
    </div>
  </form>
</dialog>`;

const after = `${testDialog("email", "Send Test Email", `
      ${fieldHtml({ id: "arm-te-to", required: true, control: textFieldHtml({ id: "arm-te-to", label: "To", type: "email", required: true, autocomplete: "email", describedBy: describedBy("arm-te-to", { description: false }) }) })}
      <div class="arm-ib">
        ${checkboxHtml({ id: "arm-te-ib", label: "Send via Integration Broker", checked: true })}
        <span class="tooltip-wrapper"><button class="arm-ib__info" type="button" aria-label="About Integration Broker" aria-describedby="arm-te-ib-tip">${icon("info", "arm-ib__icon")}</button><span class="tooltip" role="tooltip" id="arm-te-ib-tip">${IB_HINT}</span></span>
      </div>`)}
${testDialog("sms", "Send Test SMS", `
      ${fieldHtml({ id: "arm-ts-to", required: true, description: "Include the country code, e.g. +15551234567.", control: textFieldHtml({ id: "arm-ts-to", label: "Phone Number", type: "tel", required: true, autocomplete: "tel", describedBy: describedBy("arm-ts-to") }) })}
      ${fieldHtml({ id: "arm-ts-body", control: textFieldHtml({ id: "arm-ts-body", label: "Message Body", describedBy: describedBy("arm-ts-body", { description: false }) }) })}`)}
<dialog class="alert-dialog" id="arm-leave" role="alertdialog" aria-labelledby="arm-leave-title" aria-describedby="arm-leave-text">
  <div class="alert-dialog__content">
    <div class="alert-dialog__text"><h2 class="alert-dialog__title" id="arm-leave-title">Leave without saving?</h2><p class="alert-dialog__description" id="arm-leave-text">Your changes to Global Settings will be lost.</p></div>
    <div class="alert-dialog__actions">
      <button class="btn btn--secondary btn--base" type="button" id="arm-leave-stay" autofocus>Keep editing</button>
      <button class="btn btn--danger btn--base" type="button" id="arm-leave-go">Leave without saving</button>
    </div>
  </div>
</dialog>
<dialog class="dialog" id="arm-dlg" aria-labelledby="arm-dlg-title" aria-describedby="arm-dlg-desc">
  <form method="dialog" class="dialog__content" id="arm-dlg-form" novalidate>
    <div class="dialog__header">
      <div class="dialog__heading"><h2 class="dialog__title" id="arm-dlg-title"></h2><p class="dialog__description" id="arm-dlg-desc"></p></div>
      <button class="dialog__close" type="button" data-close aria-label="Close">${icon("close", "dialog__close-icon")}</button>
    </div>
    <div class="dialog__body arm-dlg__body">
      ${fieldHtml({ id: "arm-dlg-a", control: textFieldHtml({ id: "arm-dlg-a", label: "Value", describedBy: describedBy("arm-dlg-a", { description: false }) }) })}
      <div id="arm-dlg-b-wrap">${fieldHtml({ id: "arm-dlg-b", control: textFieldHtml({ id: "arm-dlg-b", label: "Value", describedBy: describedBy("arm-dlg-b", { description: false }) }) })}</div>
    </div>
    <div class="dialog__footer">
      <button class="btn btn--secondary btn--base" type="button" data-close>Cancel</button>
      <button class="btn btn--primary btn--base" type="submit" id="arm-dlg-submit"></button>
    </div>
  </form>
</dialog>`;

const pageCss = ({ R, D, dim, cv, typoCss, style, resolveToken, tokens }) => {
  const cb = tokens.checkbox;
  const c = composer;
  return `
${CHECKBOX_CSS}
/* ============ Global Settings — arm-* composition layer ============ */
/* one column of section Cards, the live page's 896px measure */
.arm-settings { width: 100%; max-width: 896px; margin: 0 auto; display: flex; flex-direction: column; gap: ${dim(6)}; }
.arm-card__header { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: ${dim(4)}; }
.arm-card__heading { display: flex; flex-direction: column; gap: ${D(tokens.card.headerGap)}; min-width: 0; }
.arm-card__body { gap: ${dim(5)}; }
.arm-grid { display: grid; grid-template-columns: 1fr; gap: ${dim(5)} ${dim(4)}; }
@container (min-width: 600px) { .arm-grid { grid-template-columns: 1fr 1fr; } }
/* Checkbox + its description, the description under the label (box + gap in) */
.arm-enable { display: flex; flex-direction: column; gap: ${dim(1)}; }
.arm-enable__desc { padding-inline-start: calc(${D(cb.size.box)} + ${D(cb.size.gap)}); }
/* Auth Token: read-only until Edit */
.arm-secret { display: flex; align-items: center; gap: ${dim(2)}; }
.arm-secret .text-field { flex: 1; min-width: 0; }
.arm-secret .btn[hidden] { display: none; }
/* Body = Composer rich: toolbar over the field, a multi-line editable area */
.arm-editor { display: flex; flex-direction: column; gap: ${D(c.field.gap)}; }
.composer__field { display: flex; gap: ${D(c.field.gap)}; padding: ${D(c.field.padding)}; border-radius: ${D(c.radius)}; background: ${R(c.field.bg)}; border: 1px solid ${R(c.field.border)}; }
.composer__field:hover { background: ${R(c.field.bgHover)}; border-color: ${R(c.field.borderHover)}; }
.composer__field:focus-within { border-color: ${R(c.field.borderFocus)}; }
${COMPOSER_TOOLBAR_CSS}
${COMPOSER_BOX_CSS}
.composer__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${R(c.textColor)}; ${typoCss(resolveToken(c.input))} font-family: ${cv("family.sans")}; }
.arm-editor__input { min-height: 160px; overflow-wrap: anywhere; }
.arm-editor__input > :first-child { margin-top: 0; }
.arm-editor__input > :last-child { margin-bottom: 0; }
.arm-editor__input p, .arm-editor__input ul, .arm-editor__input ol, .arm-editor__input blockquote { margin: 0 0 ${dim(2)}; }
.arm-editor__input h1 { margin: 0 0 ${dim(2)}; ${typoCss(style("heading-lg"))} }
.arm-editor__input h2 { margin: 0 0 ${dim(2)}; ${typoCss(style("heading-md"))} }
.arm-editor__input h3 { margin: 0 0 ${dim(2)}; ${typoCss(style("heading-sm"))} }
.arm-editor__input blockquote { padding-inline-start: ${dim(3)}; border-inline-start: 2px solid ${cv("border.default")}; color: ${cv("text.secondary")}; }
.arm-editor__input a { color: ${cv("text.primary")}; }
.arm-tag { vertical-align: baseline; }
/* Save row: who last saved (quiet context) + the one primary action */
.arm-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: ${dim(3)} ${dim(4)}; }
.arm-actions__meta { margin: 0; flex: 1; min-width: 0; color: ${cv("text.secondary")}; ${typoCss(style("body-sm"))} }
.composer__tb-lb { position: fixed; inset: auto; margin: 0; }
.arm-dlg__body { display: flex; flex-direction: column; gap: ${dim(5)}; }
#arm-dlg-b-wrap[hidden] { display: none; }
/* Send via Integration Broker + its info tooltip */
.arm-ib { display: flex; align-items: center; gap: ${dim(1)}; }
.arm-ib__info { display: inline-flex; align-items: center; justify-content: center; width: ${dim(6)}; height: ${dim(6)}; padding: 0; border: none; border-radius: ${D(tokens.button.ghost.radius)}; background: transparent; color: ${cv("icon.secondary")}; cursor: help; }
.arm-ib__info:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }
.arm-ib__icon { width: ${dim(4)}; height: ${dim(4)}; display: block; }
.arm-ib .tooltip { width: max-content; max-width: 240px; white-space: normal; }
.arm-ib .tooltip-wrapper:focus-within .tooltip { opacity: 1; }
`;
};

const pageJs = `${SELECT_JS}
${COMPOSER_TOOLBAR_JS}
${TEXT_FIELD_JS}
(function () {
  function $(id) { return document.getElementById(id); }
  var body = $("arm-body");

  // ---- formatting toolbar (DS Composer toolbar: tools/lib/composer.mjs) ----
  var tools = document.querySelector(".arm-editor .composer__toolbar");
  window.hpComposerToolbar(tools);
  var saved = null;
  function keepSelection() { var s = getSelection(); if (s.rangeCount && body.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); }
  function restoreSelection() { body.focus(); if (saved) { var s = getSelection(); s.removeAllRanges(); s.addRange(saved); } }
  document.addEventListener("selectionchange", function () { keepSelection(); syncPressed(); });
  // keep the caret in the editor while a toolbar control is pressed
  tools.addEventListener("mousedown", function (e) { if (e.target.closest("button")) e.preventDefault(); });
  var PRESSABLE = ["bold", "italic", "underline", "strikeThrough"];
  tools.querySelectorAll("[data-cmd]").forEach(function (b) { if (PRESSABLE.indexOf(b.getAttribute("data-cmd")) > -1) b.setAttribute("aria-pressed", "false"); });
  var ALIGN = ["justifyLeft", "justifyCenter", "justifyRight"], align = 0;
  tools.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cmd]");
    if (!b) return;
    var cmd = b.getAttribute("data-cmd");
    if (cmd === "link" || cmd === "email") return openInsert(cmd);
    restoreSelection();
    if (cmd === "code") { var t = getSelection().toString(); document.execCommand("insertHTML", false, "<code>" + (t || "code").replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</code>"); }
    else if (cmd === "align") { align = (align + 1) % ALIGN.length; document.execCommand(ALIGN[align]); }
    else document.execCommand(cmd);
    syncPressed();
  });
  // Text style + Insert Tag: Listbox popovers anchored under their button
  var styleLabel = tools.querySelector(".composer__tb-style-label");
  document.querySelectorAll(".arm-editor .composer__tb-lb").forEach(function (lb) {
    var btn = document.querySelector('[popovertarget="' + lb.id + '"]');
    lb.addEventListener("toggle", function (e) {
      btn.setAttribute("aria-expanded", e.newState === "open");
      if (e.newState !== "open") return;
      var r = btn.getBoundingClientRect();
      lb.style.top = (r.bottom + 4) + "px";
      lb.style.left = Math.max(8, Math.min(r.left, innerWidth - lb.offsetWidth - 8)) + "px";
      lb.querySelector(".listbox__option").focus();
    });
    lb.addEventListener("keydown", function (e) {
      var items = [].slice.call(lb.querySelectorAll(".listbox__option")), i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    lb.addEventListener("click", function (e) {
      var o = e.target.closest(".listbox__option"); if (!o) return;
      lb.hidePopover(); restoreSelection();
      if (o.hasAttribute("data-insert")) document.execCommand("insertText", false, o.getAttribute("data-insert"));
      else pickStyle(o.getAttribute("data-style"));
    });
  });
  var BLOCKS = { "Normal": "p", "Heading 1": "h1", "Heading 2": "h2", "Heading 3": "h3", "Quote": "blockquote" };
  function pickStyle(s) {
    if (s === "Bulleted list") document.execCommand("insertUnorderedList");
    else if (s === "Numbered list") document.execCommand("insertOrderedList");
    else document.execCommand("formatBlock", false, BLOCKS[s]);
    styleLabel.textContent = s;
  }
  function syncPressed() {
    if (!body.contains(getSelection().anchorNode)) return;
    tools.querySelectorAll("[aria-pressed]").forEach(function (b) { b.setAttribute("aria-pressed", document.queryCommandState(b.getAttribute("data-cmd"))); });
    var block = document.queryCommandValue("formatBlock").toLowerCase();
    var name = Object.keys(BLOCKS).filter(function (k) { return BLOCKS[k] === block; })[0];
    if (document.queryCommandState("insertUnorderedList")) name = "Bulleted list";
    else if (document.queryCommandState("insertOrderedList")) name = "Numbered list";
    styleLabel.textContent = name || "Normal";
  }

  // ---- one Dialog for Test Email / Test SMS / Insert link / Insert email ----
  var dlg = $("arm-dlg"), a = $("arm-dlg-a"), b = $("arm-dlg-b"), onSend = null;
  function setField(input, label, type, value) {
    input.type = type; input.value = value || ""; input.placeholder = label;
    input.closest(".text-field").querySelector(".text-field__label").textContent = label;
    var err = $(input.id + "-error"); err.hidden = true; input.removeAttribute("aria-invalid");
  }
  function openDialog(cfg) {
    $("arm-dlg-title").textContent = cfg.title;
    $("arm-dlg-desc").textContent = cfg.description;
    $("arm-dlg-submit").textContent = cfg.submit;
    setField(a, cfg.a.label, cfg.a.type, cfg.a.value);
    $("arm-dlg-b-wrap").hidden = !cfg.b;
    if (cfg.b) setField(b, cfg.b.label, cfg.b.type, cfg.b.value);
    onSend = cfg.onSend;
    dlg.showModal(); a.focus();
  }
  function invalid(input, msg) { var err = $(input.id + "-error"); err.querySelector("span").textContent = msg; err.hidden = false; input.setAttribute("aria-invalid", "true"); input.focus(); }
  $("arm-dlg-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = a.value.trim();
    if (!v) return invalid(a, "Enter " + a.placeholder.toLowerCase() + ".");
    if (a.type === "email" && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)) return invalid(a, "Enter an email like name@school.edu.");
    dlg.close(); onSend(v, b.value.trim());
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
  // Test Email / Test SMS
  var EMAIL_RE = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/;
  function fieldError(input, msg) { var err = $(input.id + "-error"); err.querySelector("span").textContent = msg; err.hidden = !msg; if (msg) { input.setAttribute("aria-invalid", "true"); input.focus(); } else input.removeAttribute("aria-invalid"); return !msg; }
  document.querySelectorAll("[data-test]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var d = $("arm-test-" + btn.getAttribute("data-test"));
      d.querySelectorAll(".text-field__control").forEach(function (i) { i.value = ""; fieldError(i, ""); });
      d.showModal(); d.querySelector(".text-field__control").focus();
    });
  });
  document.querySelectorAll("[data-test-form]").forEach(function (form) {
    var d = form.closest("dialog");
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.getAttribute("data-test-form") === "email") {
        var to = $("arm-te-to"), v = to.value.trim();
        if (!fieldError(to, !v ? "Enter an email address." : !EMAIL_RE.test(v) ? "Enter an email like name@school.edu." : "")) return;
        d.close(); cx.toast("Test email sent to " + v + ($("arm-te-ib").checked ? " via Integration Broker" : ""));
      } else {
        var ph = $("arm-ts-to"), n = ph.value.replace(/[\\s().-]/g, "");
        if (!fieldError(ph, !n ? "Enter a phone number." : !/^\\+\\d{8,15}$/.test(n) ? "Enter the number with its country code, like +15551234567." : "")) return;
        d.close(); cx.toast("Test SMS sent to " + n);
      }
    });
  });
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function openInsert(kind) {
    keepSelection();
    var sel = saved ? saved.toString() : "";
    var link = kind === "link";
    openDialog({
      title: link ? "Insert link" : "Insert email", description: link ? "Link text and the address it opens." : "An email address the student can click to write to.", submit: "Insert",
      a: link ? { label: "URL", type: "url" } : { label: "Email address", type: "email" },
      b: { label: "Text to show", type: "text", value: sel },
      onSend: function (v, t) {
        restoreSelection();
        var href = link ? (/^[a-z]+:/i.test(v) ? v : "https://" + v) : "mailto:" + v;
        document.execCommand("insertHTML", false, '<a href="' + esc(href) + '">' + esc(t || v) + "</a>");
      },
    });
  }
  body.addEventListener("click", function (e) { if (e.target.closest("a")) e.preventDefault(); });

  // ---- Auth Token: read-only until Edit ----
  $("arm-token-edit").addEventListener("click", function () {
    var t = $("arm-token"); t.readOnly = false; t.value = ""; t.focus();
    this.hidden = true;
  });

  // ---- unsaved changes: Save is on only while there are some; leaving asks first ----
  var form = $("arm-form"), save = $("arm-save"), dirty = false;
  function setDirty(v) { dirty = v; save.disabled = !v; }
  ["input", "change", "selectchange"].forEach(function (t) { form.addEventListener(t, function () { setDirty(true); }); });
  var leave = $("arm-leave"), pending = null;
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".sidebar [data-nav]");
    if (!a || !dirty || a.getAttribute("aria-current") === "page") return;
    e.preventDefault(); e.stopPropagation();
    pending = a; leave.showModal();
  }, true);
  $("arm-leave-stay").addEventListener("click", function () { pending = null; leave.close(); });
  leave.addEventListener("cancel", function () { pending = null; });
  // the other pages aren't designed — leaving reloads this one, changes gone
  $("arm-leave-go").addEventListener("click", function () { setDirty(false); leave.close(); location.reload(); });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ---- Save ----
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var from = $("arm-from"), err = $("arm-from-error");
    if (from.value.trim() && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(from.value.trim())) { err.querySelector("span").textContent = "Enter an email like name@school.edu."; err.hidden = false; from.setAttribute("aria-invalid", "true"); from.focus(); return; }
    err.hidden = true; from.removeAttribute("aria-invalid");
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); }, h = d.getHours() % 12 || 12;
    $("arm-updated-at").textContent = p(d.getMonth() + 1) + "/" + p(d.getDate()) + "/" + d.getFullYear() + " " + p(h) + ":" + p(d.getMinutes()) + " " + (d.getHours() < 12 ? "AM" : "PM") + " PDT";
    $("arm-updated-by").textContent = ${JSON.stringify(CX_USER.name)};
    setDirty(false);
    cx.toast("Global settings saved");
  });
})();`;

const appHtml = cxApp({
  title: "Global Settings",
  active: "arm-global",
  views,
  after,
  pageCss,
  pageJs,
  prompts: PROMPTS,
  navTheme: "neutral",
  colorPaths: [...CHOICE_COLOR_PATHS, ...composerColorPaths, ...COMPOSER_COLOR_PATHS, "border.focus", "text.primary"],
});

const viewerHtml = renderDesignViewer({
  activeKey: "arm-global-settings",
  title: "Global Settings",
  heading: "Global Settings",
  sub: `ARM Admin's Global Settings, restyled on hp-design components — same sections, fields, copy and order as the live page (read off a saved copy of it): <b>Email</b> (Enable Email + staff/student email type), <b>Phone</b>, <b>SMS</b> (the Twilio connection; the Auth Token stays read-only until Edit), <b>Advising Note Email</b> with a rich-text body on Composer's rich toolbar (text style, bold/italic/underline/strikethrough/code, link, email, Insert Tag), then <b>Save</b>. ARM Admin is a section of the CX app, so it sits on the CX shell. Changes from the live page are language only: section Cards with the test action in the header, "Last Updated" is a quiet line beside Save, both at the top instead of the bottom; Save stays off until something changes, and leaving the page with unsaved changes asks first (AlertDialog; the browser's own prompt on reload or close). The Sidebar wears its neutral (gray) theme. SMS credentials are sample values.`,
  versions: [{ label: "v1", note: "restyle of the live page", file: "arm-global-settings-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/arm-global-settings-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/arm-global-settings.html"), viewerHtml);
console.log("wrote docs/designs/arm-global-settings-app.html");
console.log("wrote docs/designs/arm-global-settings.html");
