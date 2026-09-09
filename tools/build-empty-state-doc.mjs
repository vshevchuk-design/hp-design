// Regenerates docs/empty-state.html from tokens/components/empty-state.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Placeholder for an area whose content is currently absent — text-only
// variant for now: a box filling the space its content would occupy, with a
// centered one-line hint on a long, weak, fully-rounded gray pill (Badge's
// neutral-tint recipe stretched under body text). Heading/illustration/action
// variants are deferred until a real surface needs them.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-empty-state-doc.mjs
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
const emptyState = load("tokens/components/empty-state.tokens.json").component.emptyState;

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
const refPath = (ref) => ref.replace(/[{}]/g, "");

const colorPaths = ["bg.neutral", "text.secondary"];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const textType = resolveToken(get(emptyState.text.$value));
const textColor = refPath(emptyState.textColor.$value);
const pillBg = refPath(emptyState.pill.bg.$value);
const pillRadius = px(resolve(emptyState.pill.radius.$value));
const pillPaddingX = px(resolve(emptyState.pill.paddingX.$value));
const pillPaddingY = px(resolve(emptyState.pill.paddingY.$value));
const padding = px(resolve(emptyState.padding.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const css = `${rootVars}

.empty-state { box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: ${padding}; font-family: ${cv("family.sans")}; }
.empty-state__text { background: ${cv(pillBg)}; color: ${cv(textColor)}; border-radius: ${pillRadius}; padding: ${pillPaddingY} ${pillPaddingX}; ${typoCss(textType)} text-align: center; }`;

const markup = (text) => `<div class="empty-state"><span class="empty-state__text">${text}</span></div>`;

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

const stories = [
  storyCard(
    "Text only",
    `<div style="height: 180px; border: 1px dashed var(--border-strong); border-radius: 10px;">${markup("Choose a Thread")}</div>`,
    markup("Choose a Thread"),
    "The dashed frame is demo chrome — the component itself is invisible except for the pill; it just fills whatever box it's given and centers the hint."
  ),
  storyCard(
    "Longer hint",
    `<div style="height: 180px; border: 1px dashed var(--border-strong); border-radius: 10px;">${markup("No threads found — try a different search")}</div>`,
    markup("No threads found — try a different search"),
    "One line, body-base — an empty state hint is a nudge, not a paragraph. If it needs to wrap, it's probably trying to say too much."
  ),
].join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — EmptyState</title>
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

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("empty-state")}
  </nav>
  <main>
    <h1>EmptyState</h1>
    <p class="sub">tokens/components/empty-state.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>What it is</b><span>A placeholder for an area whose content is currently absent — a reading pane before a selection, a search before typing, a filter with no matches. It fills the space the content would occupy and centers one line of hint text.</span></div>
      <div class="row"><b>The pill</b><span>The hint sits on a long, weak, fully-rounded gray pill — <code class="tok">bg.neutral</code> (Badge's own neutral-tint fill) + <code class="tok">radius.full</code>, with wider paddingX than a Badge so it reads "long" — a quiet chip anchored in the space, not bare text floating in a void.</span></div>
      <div class="row"><b>Text only, on purpose</b><span>No heading, no illustration, no action button — this is the minimal variant, built for the Message Center prototype's three empty surfaces. Richer variants are deferred until a real surface needs them.</span></div>
      <div class="row"><b>Purely presentational</b><span>No states, no interactivity — same category as Separator/Box/Grid.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Stories</h2>
    <p class="section-desc">The component fills whatever box it's given — the dashed frames below are demo chrome, not part of the component.</p>
    <div class="story-grid">
      ${stories}
    </div>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/empty-state.html"), html);
console.log("wrote docs/empty-state.html");
