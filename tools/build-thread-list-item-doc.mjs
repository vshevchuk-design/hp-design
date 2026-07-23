// Regenerates docs/thread-list-item.html from tokens/components/thread-list-item.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// The left-rail clickable row Message Center's thread list is built from —
// subject + chevron, a Department/Received-style 2-column metadata block,
// and a persistent "selected" accent. Built on Card's own `interactive`
// shell: hover/pressed/focused colors are the exact same semantic values
// Card's interactive variant resolves to, verified at build time against
// Card's real tokens (an assertion, not a comment) — same discipline as
// Button's own primary/secondary/ghost identical-size-grid check. The demo
// below is a real, single-select list (click any row to select it) rather
// than a static screenshot of one forced "selected" state.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-thread-list-item-doc.mjs
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
const threadListItem = load("tokens/components/thread-list-item.tokens.json").component.threadListItem;
const card = load("tokens/components/card.tokens.json").component.card;
const badge = load("tokens/components/badge.tokens.json").component.badge;

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

// ---- Verify (not just assume) this component's hover/pressed/focused colors
// are the exact same semantic values Card's own interactive variant already
// resolved to — thrown, not silently trusted, same pattern Button's
// primary/secondary/ghost size-grid check already established. ----
function assertSameRef(a, b, label) {
  if (refPath(a.$value) !== refPath(b.$value)) {
    throw new Error(`threadListItem.state.${label} (${refPath(a.$value)}) diverged from card.interactive.state.${label} (${refPath(b.$value)}) — they're meant to be the exact same recipe.`);
  }
}
assertSameRef(threadListItem.state.hover.border, card.interactive.state.hover.border, "hover.border");
assertSameRef(threadListItem.state.pressed.bg, card.interactive.state.pressed.bg, "pressed.bg");
assertSameRef(threadListItem.state.pressed.border, card.interactive.state.pressed.border, "pressed.border");
assertSameRef(threadListItem.state.focused.ringColor, card.interactive.state.focused.ringColor, "focused.ringColor");
assertSameRef(threadListItem.state.focused.ringWidth, card.interactive.state.focused.ringWidth, "focused.ringWidth");
assertSameRef(threadListItem.state.focused.ringOffset, card.interactive.state.focused.ringOffset, "focused.ringOffset");

const colorPaths = [
  "surface.default", "border.default", "text.default", "icon.muted", "text.muted",
  "fill.primary", "bg.primary", "border.focus",
  "bg.danger", "text.danger",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(threadListItem.radius.$value));
const padding = px(resolve(threadListItem.padding.$value));
const gap = px(resolve(threadListItem.gap.$value));
const subjectType = resolveToken(get(threadListItem.subject.$value));
const chevronSize = px(resolve(threadListItem.chevron.iconSize.$value));
const metaGap = px(resolve(threadListItem.metadata.gap.$value));
const labelType = resolveToken(threadListItem.metadata.label);
const valueType = resolveToken(threadListItem.metadata.value);
const ringWidth = px(resolve(threadListItem.state.focused.ringWidth.$value));
const ringOffset = px(resolve(threadListItem.state.focused.ringOffset.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const iconChevron = fs.readFileSync(path.join(root, "assets/icons/material-filled/chevron_right.svg"), "utf8").replace("<svg ", '<svg class="thread-item__chevron" ');

// ---- Badge, resolved from its own tokens (not retyped) — sm size, role=danger,
// tint fill, used for the Expires value in place of the live app's bare
// red-colored text ----
const badgeRadius = px(resolve(badge.radius.$value));
const badgeSm = badge.size.sm;
const badgeHeight = px(resolve(badgeSm.height.$value));
const badgePaddingX = px(resolve(badgeSm.paddingX.$value));
const badgeLabelType = resolveToken(badgeSm.label);
const badgeDangerTint = { bg: refPath(badge.role.danger.tint.bg.$value), text: refPath(badge.role.danger.tint.text.$value) };

const css = `${rootVars}

.thread-item { box-sizing: border-box; width: 100%; text-align: left; appearance: none; cursor: pointer; display: flex; flex-direction: column; gap: ${gap}; padding: ${padding}; border-radius: ${radius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; font-family: ${cv("family.sans")}; }
.thread-item__header { display: flex; align-items: flex-start; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item__subject { color: ${cv("text.default")}; ${typoCss(subjectType)} }
.thread-item__chevron { flex-shrink: 0; width: ${chevronSize}; height: ${chevronSize}; color: ${cv("icon.muted")}; }
.thread-item__divider { border-top: 1px solid ${cv("border.default")}; }
.thread-item__metadata { display: flex; flex-direction: column; gap: ${metaGap}; }
.thread-item__row { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item__label { flex-shrink: 0; color: ${cv("text.muted")}; ${typoCss(labelType)} }
.thread-item__value { text-align: right; color: ${cv("text.default")}; ${typoCss(valueType)} }

.thread-item:not(.thread-item--selected):hover { border-color: ${cv("fill.primary")}; }
.thread-item:not(.thread-item--selected):active { background: ${cv("bg.primary")}; border-color: ${cv("fill.primary")}; }
.thread-item:focus-visible { outline: ${ringWidth} solid ${cv("border.focus")}; outline-offset: ${ringOffset}; }
.thread-item--selected { background: ${cv("bg.primary")}; border-color: ${cv("fill.primary")}; }

.badge { box-sizing: border-box; display: inline-flex; align-items: center; border-radius: ${badgeRadius}; height: ${badgeHeight}; padding: 0 ${badgePaddingX}; ${typoCss(badgeLabelType)} white-space: nowrap; }
.badge--role-danger { background: ${cv(badgeDangerTint.bg)}; color: ${cv(badgeDangerTint.text)}; }`;

function metaRow(label, valueHtml) {
  return `<div class="thread-item__row"><span class="thread-item__label">${label}</span>${valueHtml}</div>`;
}
function textValue(v) {
  return `<span class="thread-item__value">${v}</span>`;
}
function badgeValue(v) {
  return `<span class="badge badge--role-danger">${v}</span>`;
}
function threadItemMarkup({ subject, rows, selected = false }) {
  return `<button class="thread-item${selected ? " thread-item--selected" : ""}">
      <div class="thread-item__header">
        <span class="thread-item__subject">${subject}</span>
        ${iconChevron}
      </div>
      <div class="thread-item__divider"></div>
      <div class="thread-item__metadata">
        ${rows.join("\n        ")}
      </div>
    </button>`;
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

// ---- States ----
function stateStories() {
  const rows = [metaRow("Department:", textValue("Academic Advising")), metaRow("Received:", textValue("12/19/2025"))];
  const defs = [
    { title: "default", html: threadItemMarkup({ subject: "Winter Intersession", rows }) },
    { title: "hover", html: `<div style="border-color:${cv("fill.primary")}; box-sizing:border-box; width:100%; text-align:left; display:flex; flex-direction:column; gap:${gap}; padding:${padding}; border-radius:${radius}; background:${cv("surface.default")}; border:1px solid ${cv("fill.primary")}; font-family:${cv("family.sans")};"><div class="thread-item__header"><span class="thread-item__subject">Winter Intersession</span>${iconChevron}</div><div class="thread-item__divider"></div><div class="thread-item__metadata">${rows.join("")}</div></div>`, note: "border-color: fill.primary — verified identical to Card interactive's own hover, not retyped." },
    { title: "selected", html: threadItemMarkup({ subject: "Winter Intersession", rows, selected: true }), note: "bg.primary + fill.primary border — the same pair as Card interactive's pressed state, applied persistently (this thread is open in the reading pane right now)." },
    { title: "focused", html: `<button class="thread-item" style="outline:${ringWidth} solid ${cv("border.focus")}; outline-offset:${ringOffset};"><div class="thread-item__header"><span class="thread-item__subject">Winter Intersession</span>${iconChevron}</div><div class="thread-item__divider"></div><div class="thread-item__metadata">${rows.join("")}</div></button>`, note: "Real CSS is :focus-visible on the button — forced here via inline style for a static screenshot." },
  ];
  return defs.map((d) => storyCard(d.title, d.html, d.html, d.note || "")).join("\n");
}

// ---- Metadata shapes ----
function metadataStories() {
  const defs = [
    {
      title: "2 rows",
      html: threadItemMarkup({ subject: "Winter Intersession", rows: [metaRow("Department:", textValue("Academic Advising")), metaRow("Received:", textValue("12/19/2025"))] }),
    },
    {
      title: "4 rows + Badge value",
      html: threadItemMarkup({
        subject: "Close to Pell Lifetime Limits",
        rows: [
          metaRow("Regarding:", textValue("Your Financial Aid")),
          metaRow("Department:", textValue("Financial Aid")),
          metaRow("Received:", textValue("03/01/2024")),
          metaRow("Expires:", badgeValue("03/01/2027")),
        ],
      }),
      note: "The live app shows this Expires value as bare red-colored text — upgraded here to a real Badge (role=danger, tint, sm), the same component this thread-list row was one of the driving use cases for in the first place.",
    },
  ];
  return defs.map((d) => storyCard(d.title, d.html, d.html, d.note || "")).join("\n");
}

// ---- In context: a real, single-select list ----
const listDemo = `<div class="thread-item-demo" style="display:flex; flex-direction:column; gap:12px; max-width:360px;">
      ${threadItemMarkup({ subject: "Winter Intersession", rows: [metaRow("Department:", textValue("Academic Advising")), metaRow("Received:", textValue("12/19/2025"))], selected: true })}
      ${threadItemMarkup({ subject: "Hello World", rows: [metaRow("Department:", textValue("Academic Advising")), metaRow("Received:", textValue("12/18/2025"))] })}
      ${threadItemMarkup({ subject: "Close to Pell Lifetime Limits", rows: [metaRow("Regarding:", textValue("Your Financial Aid")), metaRow("Expires:", badgeValue("03/01/2027"))] })}
    </div>`;
const listDemoCode = `<div class="thread-item-demo">
  <button class="thread-item thread-item--selected">…</button>
  <button class="thread-item">…</button>
  <button class="thread-item">…</button>
</div>
<script>
  // click any row to select it — real single-select, not a forced state
  document.querySelectorAll(".thread-item-demo .thread-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll(".thread-item").forEach((b) => b.classList.remove("thread-item--selected"));
      btn.classList.add("thread-item--selected");
    });
  });
</script>`;
const js = `document.querySelectorAll(".thread-item-demo .thread-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.parentElement.querySelectorAll(".thread-item").forEach((b) => b.classList.remove("thread-item--selected"));
    btn.classList.add("thread-item--selected");
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — ThreadListItem</title>
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

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
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
    ${renderNav("thread-list-item")}
  </nav>
  <main>
    <h1>ThreadListItem</h1>
    <p class="sub">tokens/components/thread-list-item.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Click a row in "In context" below — real single-select, not a forced screenshot state.</p>

    <div class="legend">
      <div class="row"><b>Built on Card</b><span>hover (fill.primary border) / pressed (bg.primary+fill.primary) / focused (border.focus ring) are the exact same values Card's own <code class="tok">interactive</code> variant resolves to — checked with a build-time assertion, not just retyped by eye.</span></div>
      <div class="row"><b>selected = persistent pressed</b><span>The currently-open thread reuses the identical pressed pair (bg.primary+fill.primary border), just applied continuously instead of only for the moment of a click.</span></div>
      <div class="row"><b>Metadata rows</b><span>Label:value pairs, same line, spread apart — Department/Received/Regarding/Expires, matching the live app exactly. size.xs both, differentiated by color (muted label, default value) not weight.</span></div>
      <div class="row"><b>Expires uses Badge now</b><span>The live app shows an expiry as bare red-colored text. This component uses a real Badge (role=danger, tint, sm) for that value instead — the thread list was literally one of the driving use cases Badge was built for.</span></div>
      <div class="row"><b>No unread indicator</b><span>Not asked for — deferred rather than built speculatively.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">JS</h2>
    <p class="section-desc">The only script this page needs — click-to-select for the "In context" demo below.</p>
    <pre class="code"><code>${esc(js)}</code></pre>

    <h2 class="big-section">States</h2>
    <p class="section-desc">default / hover / selected / focused.</p>
    <div class="story-grid">
      ${stateStories()}
    </div>

    <h2 class="big-section">Metadata shapes</h2>
    <p class="section-desc">2 rows (plain text) vs. 4 rows with a Badge value.</p>
    <div class="story-grid">
      ${metadataStories()}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">A real, single-select thread list — click any row.</p>
    <div class="usage-preview">${listDemo}</div>
    <pre class="code"><code>${esc(listDemoCode)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/thread-list-item.html"), html);
console.log("wrote docs/thread-list-item.html");
