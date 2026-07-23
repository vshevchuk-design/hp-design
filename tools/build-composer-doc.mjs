// Regenerates docs/composer.html from tokens/components/composer.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// The seventh and final piece of the Message/Bubble/Attachment family. Two
// variants sharing one field recipe (Input/Select/Search's own surface.sunken
// + border convention, verbatim): "simple" (student side — input + attach +
// Send) and "rich" (staff side — B/I/U + Merge Tags + AI Assist + a real
// Switch for Allow Replies + an expiration trigger). AI Assist resolves the
// new bg.ai/text.ai/icon.ai/fill.ai semantic roles added specifically for
// this component (the plan's one flagged open question) — a genuine
// cross-product need shared with the future AI chat product, same bar
// surface.inverse was added under for Tooltip. Every button/switch here is
// the real component, resolved from its own token file, not a lookalike.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-composer-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const colorPrim = load("tokens/primitives/color.tokens.json").color;
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const radiusPrim = load("tokens/primitives/radius.tokens.json").radius;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const composer = load("tokens/components/composer.tokens.json").component.composer;
const button = load("tokens/components/button.tokens.json").component.button;
const swtch = load("tokens/components/switch.tokens.json").component.switch;

const registry = {
  color: colorPrim,
  dim,
  radius: radiusPrim,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": textStyle,
  ...semantic,
};
function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
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
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;

const colorPaths = [
  "surface.sunken", "border.default", "border.strong", "border.focus", "text.default", "text.muted",
  "icon.secondary", "fill.neutralHover", "fill.neutralActive",
  "bg.ai", "text.ai", "icon.ai", "fill.ai",
  "fill.primary", "fill.primaryHover", "text.onFill", "icon.onFill",
  "text.secondary",
  "fill.primaryActive",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(composer.radius.$value));
const fieldPadding = px(resolve(composer.field.padding.$value));
const fieldGap = px(resolve(composer.field.gap.$value));
const inputType = resolveToken(composer.input);
const iconBtnSize = px(resolve(composer.iconButton.size.$value));
const iconBtnIconSize = px(resolve(composer.iconButton.iconSize.$value));
const settingsGap = px(resolve(composer.settings.gap.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// ---- Button primary (sm icon-only for simple Send, base for rich Send),
// resolved from its own tokens, not retyped ----
const btnRadius = px(resolve(button.primary.radius.$value));
const btnSm = button.primary.size.sm;
const btnSmHeight = px(resolve(btnSm.height.$value));
const btnBase = button.primary.size.base;
const btnBaseHeight = px(resolve(btnBase.height.$value));
const btnBasePaddingX = px(resolve(btnBase.paddingX.$value));
const btnBaseGap = px(resolve(btnBase.gap.$value));
const btnBaseIconSize = px(resolve(btnBase.iconSize.$value));
const btnBaseLabelType = resolveToken(get(btnBase.label.$value));
const btnSmIconSize = px(resolve(btnSm.iconSize.$value));

// ---- Button ghost sm (Merge Tags), resolved from its own tokens ----
const ghostSm = button.ghost.size.sm;
const ghostSmHeight = px(resolve(ghostSm.height.$value));
const ghostSmPaddingX = px(resolve(ghostSm.paddingX.$value));
const ghostSmGap = px(resolve(ghostSm.gap.$value));
const ghostSmIconSize = px(resolve(ghostSm.iconSize.$value));
const ghostSmLabelType = resolveToken(get(ghostSm.label.$value));

// ---- Switch (Allow Replies), resolved from its own tokens ----
const swRadius = px(resolve(swtch.radius.$value));
const swTrackWidth = resolve(swtch.size.trackWidth.$value);
const swTrackHeight = resolve(swtch.size.trackHeight.$value);
const swThumb = resolve(swtch.size.thumb.$value);
const swInset = resolve(swtch.size.thumbInset.$value);
const swTravel = swTrackWidth.value - swThumb.value - 2 * swInset.value;

// ---- icons ----
const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconAttach = iconOf("attach_file", "composer__icon");
// Icons inside a real .btn use Button's own .btn__icon class (matches
// button.html's real markup); composer-specific icon slots (the toolbar's
// plain icon buttons, AI Assist, the expiration trigger) use .composer__icon.
const iconSend = iconOf("send", "btn__icon");
const iconTag = iconOf("local_offer", "btn__icon");
const iconBold = iconOf("format_bold", "composer__icon");
const iconItalic = iconOf("format_italic", "composer__icon");
const iconUnderline = iconOf("format_underlined", "composer__icon");
const iconAi = iconOf("auto_awesome", "composer__icon");
const iconChevron = iconOf("chevron_right", "composer__icon");

const css = `${rootVars}

.composer { display: flex; flex-direction: column; gap: ${fieldGap}; font-family: ${cv("family.sans")}; max-width: 420px; }
.composer__toolbar { display: flex; align-items: center; gap: ${px(resolve("dim.1"))}; }
.composer__icon-btn { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${iconBtnSize}; height: ${iconBtnSize}; border: none; border-radius: ${px(resolve("radius.default"))}; background: transparent; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.composer__icon-btn .composer__icon { width: ${iconBtnIconSize}; height: ${iconBtnIconSize}; display: block; }
.composer__icon-btn:hover { background: ${cv("fill.neutralHover")}; }
.composer__icon-btn:active { background: ${cv("fill.neutralActive")}; }
.composer__icon-btn:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }

.composer__ai-assist { flex-shrink: 0; display: inline-flex; align-items: center; gap: ${px(resolve("dim.1"))}; height: ${ghostSmHeight}; padding: 0 ${px(resolve("dim.2"))}; border: 1px solid transparent; border-radius: ${px(resolve("radius.default"))}; background: ${cv("bg.ai")}; color: ${cv("text.ai")}; cursor: pointer; ${typoCss(ghostSmLabelType)} }
.composer__ai-assist .composer__icon { width: ${ghostSmIconSize}; height: ${ghostSmIconSize}; color: ${cv("icon.ai")}; }
.composer__ai-assist:hover { border-color: ${cv("fill.ai")}; }

.composer__field { display: flex; align-items: center; gap: ${fieldGap}; padding: ${fieldPadding}; border-radius: ${radius}; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; }
.composer__field:hover { border-color: ${cv("border.strong")}; }
.composer__field:focus-within { border-color: ${cv("border.focus")}; }
.composer__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; resize: none; color: ${cv("text.default")}; ${typoCss(inputType)} font-family: ${cv("family.sans")}; }
.composer__input::placeholder { color: ${cv("text.muted")}; }

.composer__settings { display: flex; flex-direction: column; gap: ${settingsGap}; }
.composer__settings-row { display: flex; align-items: center; justify-content: space-between; }
.composer__settings-label { color: ${cv("text.default")}; font-size: 13px; }
.composer__expiration-trigger { display: inline-flex; align-items: center; gap: 2px; border: none; background: transparent; padding: 0; cursor: pointer; color: ${cv("text.secondary")}; font-size: 13px; font-family: ${cv("family.sans")}; }
.composer__expiration-trigger .composer__icon { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-family: ${cv("family.sans")}; }
.btn__icon { flex-shrink: 0; }
.btn--primary { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; border-radius: ${btnRadius}; }
.btn--primary:hover { background: ${cv("fill.primaryHover")}; }
.btn--primary .btn__icon { color: ${cv("icon.onFill")}; }
.btn--primary.btn--sm.btn--icon-only { width: ${btnSmHeight}; height: ${btnSmHeight}; padding: 0; flex-shrink: 0; }
.btn--primary.btn--sm.btn--icon-only .btn__icon { width: ${btnSmIconSize}; height: ${btnSmIconSize}; }
.btn--primary.btn--base { height: ${btnBaseHeight}; padding: 0 ${btnBasePaddingX}; gap: ${btnBaseGap}; ${typoCss(btnBaseLabelType)} }
.btn--primary.btn--base .btn__icon { width: ${btnBaseIconSize}; height: ${btnBaseIconSize}; }
.btn--ghost { background: transparent; color: ${cv("text.secondary")}; border-radius: ${btnRadius}; }
.btn--ghost .btn__icon { color: ${cv("icon.secondary")}; }
.btn--ghost:hover { background: ${cv("fill.neutralHover")}; }
.btn--ghost.btn--sm { height: ${ghostSmHeight}; padding: 0 ${ghostSmPaddingX}; gap: ${ghostSmGap}; ${typoCss(ghostSmLabelType)} }
.btn--ghost.btn--sm .btn__icon { width: ${ghostSmIconSize}; height: ${ghostSmIconSize}; }

.switch { display: inline-flex; align-items: center; cursor: pointer; }
.switch__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.switch__track { box-sizing: border-box; position: relative; flex-shrink: 0; width: ${px(swTrackWidth)}; height: ${px(swTrackHeight)}; border-radius: ${swRadius}; background: ${cv("border.default")}; }
.switch__thumb { position: absolute; top: ${px(swInset)}; left: ${px(swInset)}; width: ${px(swThumb)}; height: ${px(swThumb)}; border-radius: ${swRadius}; background: #fff; transform: translateX(0); }
.switch__input:checked ~ .switch__track { background: ${cv("fill.primary")}; }
.switch__input:checked ~ .switch__track .switch__thumb { transform: translateX(${swTravel}px); }
.switch__input:focus-visible ~ .switch__track { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }`;

function iconBtn(icon, label) {
  return `<button class="composer__icon-btn" aria-label="${label}">${icon}</button>`;
}
function switchMarkup(checked) {
  return `<label class="switch">
      <input type="checkbox" class="switch__input"${checked ? " checked" : ""} />
      <span class="switch__track"><span class="switch__thumb"></span></span>
    </label>`;
}

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

// ---- Simple variant ----
const simpleComposer = `<div class="composer composer--simple">
      <div class="composer__field">
        <input class="composer__input" placeholder="Write a message..." />
        ${iconBtn(iconAttach, "Attach file")}
        <button class="btn btn--primary btn--sm btn--icon-only" aria-label="Send">${iconSend}</button>
      </div>
    </div>`;
const simpleComposerCode = `<div class="composer composer--simple">
  <div class="composer__field">
    <input class="composer__input" placeholder="Write a message..." />
    <button class="composer__icon-btn" aria-label="Attach file"><!-- icon: attach_file --></button>
    <button class="btn btn--primary btn--sm btn--icon-only" aria-label="Send"><!-- icon: send --></button>
  </div>
</div>`;

// ---- Rich variant ----
const richComposer = `<div class="composer composer--rich">
      <div class="composer__toolbar">
        ${iconBtn(iconBold, "Bold")}
        ${iconBtn(iconItalic, "Italic")}
        ${iconBtn(iconUnderline, "Underline")}
        <button class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button>
        <button class="composer__ai-assist">${iconAi}AI Assist</button>
      </div>
      <div class="composer__field">
        <textarea class="composer__input" rows="3" placeholder="Reply to Cait...">Hi Cait — yes, we can review the minor requirements too.</textarea>
      </div>
      <div class="composer__settings">
        <div class="composer__settings-row">
          <span class="composer__settings-label">Allow Replies</span>
          ${switchMarkup(true)}
        </div>
        <div class="composer__settings-row">
          <span class="composer__settings-label">Expiration</span>
          <button class="composer__expiration-trigger">Aug 15, 2026 ${iconChevron}</button>
        </div>
      </div>
      <button class="btn btn--primary btn--base">${iconSend}Send</button>
    </div>`;
const richComposerCode = `<div class="composer composer--rich">
  <div class="composer__toolbar">
    <button class="composer__icon-btn" aria-label="Bold"><!-- icon: format_bold --></button>
    <button class="composer__icon-btn" aria-label="Italic"><!-- icon: format_italic --></button>
    <button class="composer__icon-btn" aria-label="Underline"><!-- icon: format_underlined --></button>
    <button class="btn btn--ghost btn--sm"><!-- icon: local_offer -->Merge Tags</button>
    <button class="composer__ai-assist"><!-- icon: auto_awesome -->AI Assist</button>
  </div>
  <div class="composer__field">
    <textarea class="composer__input" placeholder="Reply to Cait...">…</textarea>
  </div>
  <div class="composer__settings">
    <div class="composer__settings-row">
      <span class="composer__settings-label">Allow Replies</span>
      <label class="switch">…</label>
    </div>
    <div class="composer__settings-row">
      <span class="composer__settings-label">Expiration</span>
      <button class="composer__expiration-trigger">Aug 15, 2026 <!-- icon: chevron_right --></button>
    </div>
  </div>
  <button class="btn btn--primary btn--base"><!-- icon: send -->Send</button>
</div>`;

// ---- Merge Tags story (button.ghost sm) ----
const mergeTagsHtml = `<button class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Composer</title>
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

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 56px; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .usage-preview { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; margin-bottom: 1rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("composer")}
  </nav>
  <main>
    <h1>Composer</h1>
    <p class="sub">tokens/components/composer.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex. Try typing in a field, checking the Switch, or focusing the field — all real.</p>

    <div class="legend">
      <div class="row"><b>simple vs. rich</b><span>Two variants, one field recipe. <code class="tok">simple</code> (student side) = input + attach + Send. <code class="tok">rich</code> (staff side) = B/I/U + AI Assist toolbar, a larger field, Allow Replies (a real Switch) + Expiration, then Send.</span></div>
      <div class="row"><b>Field reuses Input</b><span>surface.sunken + border.default, strengthening to border.strong on hover and border.focus on focus — the exact same locked-in convention Input/Select/Search already established, not a new field recipe. Value text is size.md (16px), the same Safari-iOS-auto-zoom reason Input's own value text is.</span></div>
      <div class="row"><b>AI Assist: the open call, resolved</b><span>New semantic roles — bg.ai/text.ai/icon.ai/fill.ai (tokens/semantic/color.tokens.json), violet, added specifically for this. Rest state is the pale bg.ai tint (matches Badge's own tint recipe); a border appears on hover using fill.ai — the same "border previews the role color" language Chip's unchecked-hover and Card's own hover already use.</span></div>
      <div class="row"><b>Every button/switch is real</b><span>Send is a real Button primary (icon-only sm for simple, icon+label base for rich). Merge Tags is a real Button ghost (sm). Allow Replies is a real Switch. None of them are lookalikes — all resolved from their own token files.</span></div>
      <div class="row"><b>No date-picker</b><span>Expiration is a display/trigger row (label + value + chevron) only — a full date-picker component doesn't exist in this system yet, out of scope here, not silently skipped.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Simple</h2>
    <p class="section-desc">Student side — matches the live Message Center app.</p>
    <div class="usage-preview">${simpleComposer}</div>
    <pre class="code"><code>${esc(simpleComposerCode)}</code></pre>

    <h2 class="big-section">Rich</h2>
    <p class="section-desc">Staff side — matches the staff mobile mockups. Every control here is real: type in the field, toggle the switch, focus anything.</p>
    <div class="usage-preview">${richComposer}</div>
    <pre class="code"><code>${esc(richComposerCode)}</code></pre>

    <h2 class="big-section">Merge Tags (isolated)</h2>
    <p class="section-desc">A real Button ghost, sm — resolved from button.tokens.json, not a lookalike.</p>
    <div class="story-grid">
      ${storyCard("Merge Tags", mergeTagsHtml, mergeTagsHtml, "component.button.ghost, size.sm.")}
    </div>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/composer.html"), html);
console.log("wrote docs/composer.html");
