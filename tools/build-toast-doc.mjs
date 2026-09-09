// Regenerates docs/toast.html from tokens/components/toast.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Transient, self-dismissing feedback — one line (role icon + text), floating
// top-center, auto-dismissing. Native-first like every overlay here:
// popover="manual" + showPopover() gives free top-layer and opts out of
// light-dismiss (a toast dismisses on a timer, not on outside clicks).
// First consumer of the status.* semantic group ("badges, alerts, form
// validation" per its own $description). Shell = Popover's floating recipe.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-toast-doc.mjs
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
const shadowPrim = load("tokens/primitives/shadow.tokens.json").shadow;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const toast = load("tokens/components/toast.tokens.json").component.toast;

const registry = {
  color: colorPrim,
  dim,
  radius: radiusPrim,
  shadow: shadowPrim,
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
const refPath = (ref) => ref.replace(/[{}]/g, "");

const ROLES = ["success", "danger", "warning"];
const colorPaths = [
  "surface.default", "border.default", "text.default",
  ...ROLES.map((r) => refPath(toast.role[r].icon.$value)),
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(toast.radius.$value));
const paddingX = px(resolve(toast.paddingX.$value));
const paddingY = px(resolve(toast.paddingY.$value));
const gap = px(resolve(toast.gap.$value));
const offsetTop = px(resolve(toast.offsetTop.$value));
const iconSize = px(resolve(toast.iconSize.$value));
const labelType = resolveToken(get(toast.label.$value));
const labelColor = refPath(toast.labelColor.$value);
const shadow = resolveToken(toast.shadow);
const shadowCss = `${px(shadow.offsetX)} ${px(shadow.offsetY)} ${px(shadow.blur)} ${px(shadow.spread)} ${shadow.color}`;

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const ROLE_ICONS = { success: "check_circle", danger: "error", warning: "warning" };
const iconOf = (name) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", '<svg class="toast__icon" ');
const roleIconSvg = Object.fromEntries(ROLES.map((r) => [r, iconOf(ROLE_ICONS[r])]));

const css = `${rootVars}

.toast { position: fixed; inset: auto; top: ${offsetTop}; left: 50%; transform: translateX(-50%); margin: 0; box-sizing: border-box; display: flex; align-items: center; gap: ${gap}; padding: ${paddingY} ${paddingX}; border-radius: ${radius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${shadowCss}; font-family: ${cv("family.sans")}; }
.toast__icon { flex-shrink: 0; width: ${iconSize}; height: ${iconSize}; }
.toast__label { color: ${cv(labelColor)}; ${typoCss(labelType)} white-space: nowrap; }
${ROLES.map((r) => `.toast--${r} .toast__icon { color: ${cv(refPath(toast.role[r].icon.$value))}; }`).join("\n")}

/* entry transition — same @starting-style approach as Drawer/Modal */
.toast:popover-open { opacity: 1; translate: 0 0; transition: opacity 0.18s ease, translate 0.18s ease; }
@starting-style {
  .toast:popover-open { opacity: 0; translate: 0 -8px; }
}`;

const js = `// popover="manual": free top-layer, and NO light-dismiss — a toast leaves
// on its own timer, not because the user clicked elsewhere.
const TOAST_ICONS = ${JSON.stringify(Object.fromEntries(ROLES.map((r) => [r, roleIconSvg[r]])))};
function showToast(role, text, duration = 3200) {
  const t = document.createElement("div");
  t.className = "toast toast--" + role;
  t.setAttribute("popover", "manual");
  t.setAttribute("role", role === "danger" ? "alert" : "status");
  t.innerHTML = TOAST_ICONS[role] + '<span class="toast__label"></span>';
  t.querySelector(".toast__label").textContent = text;
  document.body.appendChild(t);
  t.showPopover();
  setTimeout(() => { t.hidePopover(); t.remove(); }, duration);
}`;

function toastMarkup(role, text) {
  return `<div class="toast toast--${role}" popover="manual" role="status">${roleIconSvg[role]}<span class="toast__label">${text}</span></div>`;
}
const ROLE_SAMPLES = {
  success: "Thread archived",
  danger: "Could not send the message",
  warning: "This thread expires tomorrow",
};

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

const roleStories = ROLES.map((r) =>
  storyCard(
    r,
    `<div class="toast toast--${r}" style="position: static; transform: none;">${roleIconSvg[r]}<span class="toast__label">${ROLE_SAMPLES[r]}</span></div>`,
    toastMarkup(r, ROLE_SAMPLES[r]),
    "Forced inline via style for this static preview — the real component is fixed top-center in the top layer."
  )
).join("\n");

const liveDemo = ROLES.map((r) => `<button class="demo-btn" onclick="showToast('${r}', '${ROLE_SAMPLES[r]}')">Show ${r}</button>`).join("\n      ");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Toast</title>
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

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 56px; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .usage-preview { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; margin-bottom: 1rem; display: flex; gap: 12px; flex-wrap: wrap; }
  .demo-btn { border: 0.5px solid var(--border-strong); background: var(--bg-card); color: var(--text-primary); border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: var(--sans); }
  .demo-btn:hover { background: var(--bg-card-hover); }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("toast")}
  </nav>
  <main>
    <h1>Toast</h1>
    <p class="sub">tokens/components/toast.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex. Press the buttons in "Live" — real toasts, real top layer, real timer.</p>

    <div class="legend">
      <div class="row"><b>Why "Toast"</b><span>The industry name for transient, self-dismissing feedback — Radix Toast, shadcn's toast, Sonner, Material's Snackbar and Ant's <code class="tok">message</code> are all this one pattern with different default positions. "Notification" usually means the richer, longer-lived card with a title, body and actions — deliberately NOT built yet.</span></div>
      <div class="row"><b>Top-center, one line</b><span>Role icon + text, fixed at <code class="tok">toast.offsetTop</code> from the viewport top, horizontally centered. Auto-dismisses (default 3200ms in the helper below).</span></div>
      <div class="row"><b>Neutral surface, colored icon</b><span>The shell stays white + hairline + shadow.sm at every role (Popover's own floating recipe) — only the icon carries the meaning: <code class="tok">status.success/danger/warning</code>, the status.* group's first consumer ("badges, alerts, form validation" per its own $description).</span></div>
      <div class="row"><b>Native-first</b><span><code class="tok">popover="manual"</code> + <code class="tok">showPopover()</code> — free top-layer, and "manual" opts out of light-dismiss: a toast leaves on its own timer, not because the user clicked elsewhere. Entry via @starting-style, same as Drawer/Modal.</span></div>
      <div class="row"><b>Deferred</b><span>Close (×) button, inline action link, title+body notification variant, stacking manager for simultaneous toasts — none needed by the driving use case (Message Center's archive confirmation), none built speculatively.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">JS</h2>
    <p class="section-desc">The whole behavior — create, show, auto-dismiss.</p>
    <pre class="code"><code>${esc(js)}</code></pre>

    <h2 class="big-section">Roles</h2>
    <p class="section-desc">success / danger / warning — same shell, different status icon.</p>
    <div class="story-grid">
      ${roleStories}
    </div>

    <h2 class="big-section">Live</h2>
    <p class="section-desc">Real toasts in the real top layer.</p>
    <div class="usage-preview">
      ${liveDemo}
    </div>
  </main>
</div>
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/toast.html"), html);
console.log("wrote docs/toast.html");
