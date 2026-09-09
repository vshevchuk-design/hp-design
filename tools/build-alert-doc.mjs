// Regenerates docs/alert.html from tokens/components/alert.tokens.json.
// Persistent inline status message — the in-flow counterpart to Toast.
// Run: node tools/build-alert-doc.mjs
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
const alert = load("tokens/components/alert.tokens.json").component.alert;
const button = load("tokens/components/button.tokens.json").component.button;

const registry = { color: colorPrim, dim, radius: radiusPrim, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": textStyle, ...semantic };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (r) => r.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

const ROLES = ["info", "success", "warning", "danger"];
// Icon per role, from the shared Material set — the same glyphs Toast picked,
// plus `info` for the fourth role Toast doesn't have.
const ROLE_ICON = { info: "info", success: "check_circle", warning: "warning", danger: "error" };

// Every colour this page paints, read off the token file — never retyped.
const rolePaths = ROLES.flatMap((r) => ["bg", "border", "icon"].map((k) => refPath(alert.role[r][k].$value)));
const colorPaths = [...new Set([
  ...rolePaths,
  refPath(alert.titleColor.$value), refPath(alert.bodyColor.$value), refPath(alert.detailColor.$value),
  // the action slot demo is a real Button ghost sm
  refPath(button.ghost.state.default.label.$value), refPath(button.ghost.state.hover.fill.$value),
  refPath(button.ghost.state.pressed.fill.$value), refPath(button.ghost.state.focused.ringColor.$value),
  "surface.default", "border.default",
])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);

const radius = px(resolve(alert.radius.$value));
const paddingX = px(resolve(alert.paddingX.$value));
const paddingY = px(resolve(alert.paddingY.$value));
const gap = px(resolve(alert.gap.$value));
const stackGap = px(resolve(alert.stackGap.$value));
const iconSize = px(resolve(alert.iconSize.$value));
const titleType = resolveToken(alert.title);
const bodyType = resolveToken(alert.body);
const detailType = resolveToken(alert.detail);

const btnGhostSm = {
  height: px(resolve(button.ghost.size.sm.height.$value)),
  paddingX: px(resolve(button.ghost.size.sm.paddingX.$value)),
  label: resolveToken(button.ghost.size.sm.label),
  radius: px(resolve(button.ghost.radius.$value)),
  ring: px(resolve(button.ghost.state.focused.ringWidth.$value)),
  ringOffset: px(resolve(button.ghost.state.focused.ringOffset.$value)),
};

const css = `${rootVars}

.alert { display: flex; align-items: flex-start; gap: ${gap}; padding: ${paddingY} ${paddingX}; border-radius: ${radius}; border: 1px solid transparent; font-family: ${cv("family.sans")}; }
.alert__icon { flex-shrink: 0; width: ${iconSize}; height: ${iconSize}; }
.alert__stack { display: flex; flex-direction: column; gap: ${stackGap}; min-width: 0; }
/* The lead runs INLINE with the body — one paragraph, so short copy stays one line. */
.alert__message { margin: 0; color: ${cv(refPath(alert.bodyColor.$value))}; ${typoCss(bodyType)} }
.alert__title { color: ${cv(refPath(alert.titleColor.$value))}; font-weight: ${titleType.fontWeight}; }
.alert__detail { margin: 0; color: ${cv(refPath(alert.detailColor.$value))}; ${typoCss(detailType)} }
.alert__action { margin-top: ${stackGap}; }
${ROLES.map((r) => `.alert--${r} { background: ${cv(refPath(alert.role[r].bg.$value))}; border-color: ${cv(refPath(alert.role[r].border.$value))}; }
.alert--${r} .alert__icon { color: ${cv(refPath(alert.role[r].icon.$value))}; }`).join("\n")}

/* the optional action slot is a real Button ghost sm, resolved from button.tokens.json */
.btn { display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; font-family: inherit; border-radius: ${btnGhostSm.radius}; }
.btn--ghost.btn--sm { height: ${btnGhostSm.height}; padding: 0 ${btnGhostSm.paddingX}; color: ${cv(refPath(button.ghost.state.default.label.$value))}; ${typoCss(btnGhostSm.label)} }
.btn--ghost:hover { background: ${cv(refPath(button.ghost.state.hover.fill.$value))}; }
.btn--ghost:active { background: ${cv(refPath(button.ghost.state.pressed.fill.$value))}; }
.btn--ghost:focus-visible { outline: ${btnGhostSm.ring} solid ${cv(refPath(button.ghost.state.focused.ringColor.$value))}; outline-offset: ${btnGhostSm.ringOffset}; }`;

const icon = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);

function alertMarkup(role, { title = "", body = "", detail = "", action = "" } = {}) {
  return `<div class="alert alert--${role}" role="${role === "danger" ? "alert" : "status"}">
  ${icon(ROLE_ICON[role], "alert__icon")}
  <div class="alert__stack">
    <p class="alert__message">${title ? `<span class="alert__title">${esc(title)}</span> ` : ""}${esc(body)}</p>
    ${detail ? `<p class="alert__detail">${esc(detail)}</p>` : ""}
    ${action ? `<div class="alert__action"><button class="btn btn--ghost btn--sm" type="button">${esc(action)}</button></div>` : ""}
  </div>
</div>`;
}

const storyCard = (title, live, note = "", full = false) =>
  `<div class="story${full ? " story--full" : ""}"><h3>${title}</h3><div class="story-preview">${live}</div>${note ? `<p class="story-note">${note}</p>` : ""}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Alert</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
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
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; max-width: 78ch; line-height: 1.6; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 130px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story--full { grid-column: 1 / -1; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("alert")}</nav>
  <main>
    <h1>Alert</h1>
    <p class="sub">tokens/components/alert.tokens.json · generated — a persistent, inline status message: role icon + a lead-and-body paragraph, on the role's own pale tint. The in-flow counterpart to <a class="navlink" style="display:inline;padding:0;background:none;color:var(--accent)" href="toast.html">Toast</a>, not a variant of it.</p>

    <div class="legend">
      <div class="row"><b>vs Toast</b><span>Toast is transient and floats in the top layer over arbitrary content, so it must stay on a neutral surface with only its icon carrying meaning. An Alert sits in the document flow and owns a known slot, so it takes the role's pale <code class="tok">bg.*</code> tint — the use that group's own description reserves it for.</span></div>
      <div class="row"><b>Roles</b><span>info / success / warning / danger — one more than Toast, which has no info (a transient toast for neutral news is noise). Each = pale <code class="tok">bg.*</code> + matching pale <code class="tok">border.*</code> 200-tint + a saturated icon.</span></div>
      <div class="row"><b>Text colour</b><span>Always <code class="tok">text.default</code>, never the role colour. Coloured text on a coloured tint is two colour languages at once, and it costs readability on the longer copy these carry — the icon is what carries saturation.</span></div>
      <div class="row"><b>Anatomy</b><span>The lead runs <b>inline</b> with the body as one paragraph (so short copy stays one line and a screen reader reads one sentence). Optional quieter <code class="tok">detail</code> line beneath, optional action slot holding a real Button.</span></div>
      <div class="row"><b>ARIA</b><span><code class="tok">role="alert"</code> for danger (interrupts), <code class="tok">role="status"</code> for the rest (polite).</span></div>
      <div class="row"><b>Deferred</b><span>A dismissible (×) variant and a solid high-contrast fill — nothing needs either yet.</span></div>
    </div>

    <h2 class="big-section">Roles</h2>
    <div class="story-grid">
      ${storyCard("info", alertMarkup("info", { body: "Read as a transcript from Bainbridge Junior College." }), "Body only — the quietest shape.")}
      ${storyCard("success", alertMarkup("success", { body: "We found 10 classes we can import from your transcript. Review the grades and remove anything you don't want below." }))}
      ${storyCard("warning", alertMarkup("warning", { body: "Four classes still need a quick review by an advisor before they count." }))}
      ${storyCard("danger", alertMarkup("danger", { body: "This is a photograph of a house and pool, not a transcript — it contains no coursework, grades, or academic information. Please upload an official or unofficial transcript from your student portal.", action: "Try another file" }), "Danger with an action slot: a real Button ghost sm.")}
    </div>

    <h2 class="big-section">Lead + detail</h2>
    <p class="section-desc">The full anatomy — a bold lead clause inline with the body, then the quieter detail line for an enumeration that shouldn't compete with the message.</p>
    <div class="story-grid">
      ${storyCard("Lead, body and detail", alertMarkup("success", {
        title: "9 classes applied to your plan.",
        body: "4 more need a quick advisor review. They're checked off in your Degree Requirements.",
        detail: "Applied to: HISTORY 120, PSYCH 120, PSYCH 210, MATH 111, ENGLCOMP 200, ENGLCOMP 100, ECON 140, BIOLOGY 100",
      }), "The results-summary alert from the Explore Degrees flow.", true)}
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/alert.html"), html);
console.log("wrote docs/alert.html");
