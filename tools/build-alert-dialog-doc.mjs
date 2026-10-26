// Regenerates docs/alert-dialog.html from tokens/components/alert-dialog.tokens.json.
// A modal confirmation the user must answer: no close (×), no outside-click,
// Escape blocked — only the actions close it. The shell (width, radius, shadow,
// surface, overlay, padding, type) is Modal's, resolved from modal.tokens.json,
// so the two dialogs can't drift; this file only adds the stacked layout.
// The generated <style> block IS the code shown in the "CSS" section below.
// Run: node tools/build-alert-dialog-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
  family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const ad = load("tokens/components/alert-dialog.tokens.json").component.alertDialog;
// the shell IS Modal's — resolved from its token file, never retyped
const modal = load("tokens/components/modal.tokens.json").component.modal;
const btnDanger = load("tokens/components/button.tokens.json").component.button.danger;

function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const role = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(role(node))})`;
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// demo buttons: the same docs-only Cancel / destructive pair the Modal page uses
const demoPaths = ["fill.primary", "fill.primaryHover", "fill.neutral", "fill.neutralHoverStrong", "fill.neutralActive", "fill.danger", "fill.dangerHover", "fill.dangerActive", "text.onFill", "border.focus"];
const colorPaths = [...new Set([...[modal.bg, modal.overlay, modal.titleColor, modal.bodyColor].map(role), ...demoPaths, "text.default"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const sh = resolveToken(modal.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const dur = `${modal.transitionDuration.$value.value}${modal.transitionDuration.$value.unit}`;

const css = `${rootVars}

dialog.alert-dialog { margin: auto; padding: 0; border: none; box-sizing: border-box; width: ${D(modal.width)}; max-width: 90vw; max-height: 85dvh; border-radius: ${D(modal.radius)}; background: ${R(modal.bg)}; box-shadow: ${shadowCss};
  opacity: 0; transform: scale(0.96); transition: opacity ${dur} ease, transform ${dur} ease, overlay ${dur} allow-discrete, display ${dur} allow-discrete; }
dialog.alert-dialog[open] { opacity: 1; transform: scale(1); }
@starting-style { dialog.alert-dialog[open] { opacity: 0; transform: scale(0.96); } }
dialog.alert-dialog::backdrop { background: ${R(modal.overlay)}; opacity: 0; transition: opacity ${dur} ease allow-discrete; }
dialog.alert-dialog[open]::backdrop { opacity: 1; }
@starting-style { dialog.alert-dialog[open]::backdrop { opacity: 0; } }

/* one padded block: title over description over actions — no bands, no dividers */
.alert-dialog__content { display: flex; flex-direction: column; gap: ${D(ad.actionsGap)}; box-sizing: border-box; max-height: 85dvh; overflow: auto; padding: ${D(modal.padding)}; font-family: ${cv("family.sans")}; }
.alert-dialog__text { display: flex; flex-direction: column; gap: ${D(ad.stackGap)}; }
.alert-dialog__title { margin: 0; color: ${R(modal.titleColor)}; ${typoCss(resolveToken(modal.title))} }
.alert-dialog__description { margin: 0; color: ${R(modal.bodyColor)}; ${typoCss(resolveToken(modal.body))} }
.alert-dialog__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: ${D(modal.gap)}; margin: 0; }

.ov-btn { box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border-radius: ${px(resolve("radius.default"))}; border: none; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(resolve("text-style.heading-base"))} }
.ov-btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
.ov-btn--secondary:hover { background: ${cv("fill.neutralHoverStrong")}; }
.ov-btn--secondary:active { background: ${cv("fill.neutralActive")}; }
.ov-btn--primary { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; font-weight: 600; }
.ov-btn--primary:hover { background: ${cv("fill.primaryHover")}; }
/* the destructive action is Button danger — roles read from button.tokens.json */
.ov-btn--danger { background: ${R(btnDanger.state.default.fill)}; color: ${R(btnDanger.state.default.label)}; font-weight: 600; }
.ov-btn--danger:hover { background: ${R(btnDanger.state.hover.fill)}; }
.ov-btn--danger:active { background: ${R(btnDanger.state.pressed.fill)}; }
.ov-btn:focus-visible { outline: ${px(resolve("dim.1"))} solid ${cv("border.focus")}; outline-offset: ${px(resolve("dim.0_5"))}; }`;

// open; block Escape (<dialog> fires a native 'cancel' just before Escape closes
// it); no click-outside handler at all — a backdrop click does nothing
const js = `document.querySelectorAll('[data-alert-dialog-open]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.alertDialogOpen).showModal());
});
document.querySelectorAll('dialog.alert-dialog').forEach((dlg) => {
  dlg.addEventListener('cancel', (e) => e.preventDefault());
});`;

function markup(id, { trigger, title, description, cancel = "Cancel", action, actionClass = "ov-btn--danger" }) {
  return `<button class="ov-btn ${actionClass}" data-alert-dialog-open="${id}">${trigger}</button>
    <dialog class="alert-dialog" id="${id}" role="alertdialog" aria-labelledby="${id}-title" aria-describedby="${id}-desc">
      <div class="alert-dialog__content">
        <div class="alert-dialog__text">
          <h2 class="alert-dialog__title" id="${id}-title">${title}</h2>
          <p class="alert-dialog__description" id="${id}-desc">${description}</p>
        </div>
        <form class="alert-dialog__actions" method="dialog">
          <button class="ov-btn ov-btn--secondary" value="cancel" autofocus>${cancel}</button>
          <button class="ov-btn ${actionClass}" value="confirm">${action}</button>
        </form>
      </div>
    </dialog>`;
}
const codeSample = `<button data-alert-dialog-open="delete-account">Delete account</button>

<dialog class="alert-dialog" id="delete-account" role="alertdialog"
        aria-labelledby="delete-account-title" aria-describedby="delete-account-desc">
  <div class="alert-dialog__content">
    <div class="alert-dialog__text">
      <h2 class="alert-dialog__title" id="delete-account-title">Delete your account?</h2>
      <p class="alert-dialog__description" id="delete-account-desc">This is permanent…</p>
    </div>
    <!-- method="dialog": either button closes it; dialog.returnValue = "cancel" | "confirm" -->
    <form class="alert-dialog__actions" method="dialog">
      <button value="cancel" autofocus>Cancel</button>
      <button value="confirm">Delete my account</button>
    </form>
  </div>
</dialog>`;

const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview">${live}</div><p class="story-note">${note}</p></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — AlertDialog</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, "Segoe UI", system-ui, sans-serif;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
      --border: #313035; --border-strong: #403f45;
      --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
      --accent: #5aa4ec; --accent-bg: #16283b;
      --code-bg: #0d0d0f; --code-text: #d7d6d2;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .brand { font-size: 14px; font-weight: 600; margin: 0 0 2px 8px; }
  .brand-sub { font-size: 11.5px; color: var(--text-muted); margin: 0 0 1.5rem 8px; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }

  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); }
  .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 150px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }

  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; }
  pre.code code { font-family: inherit; }

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 64px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .placeholder-note { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); border: 0.5px dashed var(--border-strong); border-radius: 6px; padding: 4px 10px; margin-top: 1.5rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("alert-dialog")}
  </nav>
  <main>
    <h1>AlertDialog</h1>
    <p class="sub">tokens/components/alert-dialog.tokens.json · generated — a confirmation the user has to answer. Same shell as <a href="modal.html">Modal</a>; no close (×), no click-outside, no Escape — only the actions close it.</p>

    <div class="legend">
      <div class="row"><b>Shell</b><span>Modal's, resolved from <code class="tok">modal.tokens.json</code>: ${D(modal.width)} wide, <code class="tok">radius.xl</code>, <code class="tok">shadow.lg</code>, <code class="tok">surface.default</code> over a <code class="tok">surface.overlay</code> backdrop, ${D(modal.padding)} padding, native <code class="tok">showModal()</code>.</span></div>
      <div class="row"><b>Layout</b><span>One block — title (<code class="tok">heading-lg</code>) over description (<code class="tok">body-base</code>, <code class="tok">text.secondary</code>) ${D(ad.stackGap)} apart, actions ${D(ad.actionsGap)} below, right-aligned, safe action first. No header / footer bands, no dividers.</span></div>
      <div class="row"><b>Can't be dismissed</b><span>No ×. A backdrop click does nothing (there's no outside-click handler), and Escape is blocked by preventDefault() on the dialog's native <code class="tok">cancel</code> event.</span></div>
      <div class="row"><b>A11y</b><span><code class="tok">role="alertdialog"</code>, <code class="tok">aria-labelledby</code> the title, <code class="tok">aria-describedby</code> the description. <code class="tok">autofocus</code> on Cancel, so Enter right after opening never confirms a destructive action.</span></div>
      <div class="row"><b>When</b><span>Irreversible or destructive confirmations only. Anything that can be undone, or that the user can safely walk away from, is a plain Modal.</span></div>
    </div>

    <h2 class="big-section">Examples</h2>
    <p class="section-desc">Open one, then try Escape or clicking the backdrop — it stays.</p>
    <div class="story-grid">
      ${story("Destructive", markup("ad-delete", { trigger: "Delete account", title: "Delete your account?", description: "This is permanent — your account, messages and history are deleted immediately. There's no undo.", action: "Delete my account" }), "The destructive action in fill.danger, Cancel first and focused.")}
      ${story("Discard changes", markup("ad-discard", { trigger: "Leave page", title: "Discard unsaved changes?", description: "You've edited this message. If you leave now, your changes are lost.", cancel: "Keep editing", action: "Discard" }), "Cancel can be renamed to say what staying means.")}
      ${story("Confirm (not destructive)", markup("ad-submit", { trigger: "Submit application", title: "Submit your application?", description: "Once it's sent you can't edit it. We'll email you as soon as an advisor has reviewed it.", action: "Submit application", actionClass: "ov-btn--primary" }), "Significant but not destructive — the action in fill.primary. Figma: Tone=Default.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(codeSample)}</code></pre>

    <h2 class="big-section">Script</h2>
    <p class="section-desc">Open, and block Escape. There is deliberately no click-outside handler.</p>
    <pre class="code"><code>${esc(js)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/alert-dialog.html"), html);
console.log("wrote docs/alert-dialog.html");
