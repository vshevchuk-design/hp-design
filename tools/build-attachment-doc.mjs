// Regenerates docs/attachment.html from tokens/components/attachment.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// A file/image row used in a composer (pre-send: idle/uploading, a real
// remove/cancel <button>) and in message display (post-send: "done", the
// whole row becomes a real <a> — no nested button inside it, avoids an
// interactive-inside-interactive anti-pattern). Media is either a generic
// file icon in a raised surface.default square (the "icon in a soft square"
// pattern noted years ago against Vercel's own post-deploy screen, first
// real use of it here) or a real <img> thumbnail for image attachments.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-attachment-doc.mjs
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
const attachment = load("tokens/components/attachment.tokens.json").component.attachment;

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
  "surface.sunken", "surface.dim", "border.default", "surface.default", "icon.secondary",
  "text.default", "text.muted", "fill.neutralHover", "fill.neutralActive",
  "fill.primary", "border.focus",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(attachment.radius.$value));
const padding = px(resolve(attachment.padding.$value));
const gap = px(resolve(attachment.gap.$value));
const mediaSize = px(resolve(attachment.media.size.$value));
const mediaRadius = px(resolve(attachment.media.radius.$value));
const mediaIconSize = px(resolve(attachment.media.iconSize.$value));
const titleType = resolveToken(attachment.title);
const descType = resolveToken(attachment.description);
const ringWidth = px(resolve(attachment.state.done.ringWidth.$value));
const ringOffset = px(resolve(attachment.state.done.ringOffset.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// ---- icons ----
const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconFile = iconOf("insert_drive_file", "attachment__icon");
const iconClose = iconOf("close", "attachment__action-glyph");
const iconDownload = iconOf("download", "attachment__action-glyph");

// ---- synthetic thumbnail for the image-media story only, same spirit as
// Avatar's own synthetic "photo" data-URIs — not shipped as part of the component ----
function thumbDataUri(a, b) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><path d="M14 58 L32 36 L46 50 L58 32 L66 58 Z" fill="rgba(255,255,255,0.55)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const thumb = thumbDataUri("#439afd", "#0468c4");

const css = `${rootVars}

.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${gap}; padding: ${padding}; border-radius: ${radius}; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; font-family: ${cv("family.sans")}; text-decoration: none; max-width: 320px; }
.attachment__media { flex-shrink: 0; width: ${mediaSize}; height: ${mediaSize}; border-radius: ${mediaRadius}; display: flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; overflow: hidden; }
.attachment__icon { width: ${mediaIconSize}; height: ${mediaIconSize}; color: ${cv("icon.secondary")}; }
.attachment__image { width: 100%; height: 100%; object-fit: cover; display: block; }
.attachment--image .attachment__media { background: transparent; }
.attachment__content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.attachment__title { margin: 0; color: ${cv("text.default")}; ${typoCss(titleType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { margin: 0; color: ${cv("text.muted")}; ${typoCss(descType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__action { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: ${px(resolve("radius.default"))}; background: transparent; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.attachment__action:hover { background: ${cv("fill.neutralHover")}; }
.attachment__action:active { background: ${cv("fill.neutralActive")}; }
.attachment__action:focus-visible { outline: ${ringWidth} solid ${cv("border.focus")}; outline-offset: ${ringOffset}; }
.attachment__action-glyph { width: 16px; height: 16px; display: block; }
.attachment--done { color: inherit; cursor: pointer; }
.attachment--done:hover { border-color: ${cv("fill.primary")}; }
.attachment--done:focus-visible { outline: ${ringWidth} solid ${cv("border.focus")}; outline-offset: ${ringOffset}; }
.attachment--done .attachment__action-glyph { color: ${cv("icon.secondary")}; }`;

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

function mediaMarkup(media) {
  return media === "image" ? `<img class="attachment__image" src="${thumb}" alt="" />` : iconFile;
}

function idleUploadingMarkup({ state, media = "icon", title = "Syllabus.pdf", description = "248 KB" }) {
  return `<div class="attachment attachment--${state}${media === "image" ? " attachment--image" : ""}">
      <span class="attachment__media">${mediaMarkup(media)}</span>
      <span class="attachment__content">
        <span class="attachment__title">${title}</span>
        <span class="attachment__description">${description}</span>
      </span>
      <button class="attachment__action" aria-label="${state === "uploading" ? "Cancel upload" : "Remove"} ${title}">${iconClose}</button>
    </div>`;
}
function doneMarkup({ media = "icon", title = "Syllabus.pdf", description = "PDF · 1.2 MB" }) {
  return `<a class="attachment attachment--done${media === "image" ? " attachment--image" : ""}" href="#" download>
      <span class="attachment__media">${mediaMarkup(media)}</span>
      <span class="attachment__content">
        <span class="attachment__title">${title}</span>
        <span class="attachment__description">${description}</span>
      </span>
      <span class="attachment__action-glyph">${iconDownload}</span>
    </a>`;
}

// ---- States ----
function stateStories() {
  const defs = [
    { title: "idle", html: idleUploadingMarkup({ state: "idle" }), note: "Just attached, ready to send. The × is a real remove button." },
    { title: "uploading", html: idleUploadingMarkup({ state: "uploading", description: "Uploading · 64%" }), note: "Description swaps to progress text. Same × button doubles as cancel — no separate cancel affordance needed." },
    { title: "done", html: doneMarkup({}), note: "Post-send — the whole row is a real <a download>, not a div with a nested button. Hover/focus reuse Card's own border→fill.primary language." },
  ];
  return defs.map((d) => storyCard(d.title, d.html, d.html, d.note)).join("\n");
}

// ---- Media variants ----
function mediaStories() {
  const defs = [
    { title: "icon (file)", html: idleUploadingMarkup({ state: "idle" }), note: "insert_drive_file.svg in a raised surface.default square." },
    { title: "image (thumbnail)", html: idleUploadingMarkup({ state: "idle", media: "image", title: "Campus-map.png", description: "1.4 MB" }), note: "A real <img>, object-fit: cover, filling the media box edge to edge." },
  ];
  return defs.map((d) => storyCard(d.title, d.html, d.html, d.note)).join("\n");
}

// ---- In context: composer row + message-display row ----
const composerDemo = `<div style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;">
      ${idleUploadingMarkup({ state: "idle", title: "Transcript-request.docx", description: "86 KB" })}
      ${idleUploadingMarkup({ state: "uploading", media: "image", title: "Photo-ID.jpg", description: "Uploading · 30%" })}
    </div>`;
const composerCode = `<div class="composer__attachments">
  <div class="attachment attachment--idle">…</div>
  <div class="attachment attachment--uploading attachment--image">…</div>
</div>`;

const messageDemo = `<div style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;">
      ${doneMarkup({ title: "Transcript-request.docx", description: "DOCX · 86 KB" })}
    </div>`;
const messageCode = `<a class="attachment attachment--done" href="/files/transcript-request.docx" download>…</a>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Attachment</title>
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

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 56px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .usage-preview { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 20px 24px; margin-bottom: 1rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("attachment")}
  </nav>
  <main>
    <h1>Attachment</h1>
    <p class="sub">tokens/components/attachment.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>Two contexts</b><span>Composer, pre-send (<code class="tok">idle</code>/<code class="tok">uploading</code> — a real remove/cancel <code class="tok">&lt;button&gt;</code>) and message display, post-send (<code class="tok">done</code> — the whole row becomes a real <code class="tok">&lt;a download&gt;</code>, not a div with a nested button).</span></div>
      <div class="row"><b>icon vs. image media</b><span><code class="tok">icon</code>: insert_drive_file.svg in a raised <code class="tok">surface.default</code> square inside the card's own <code class="tok">surface.sunken</code> — the "icon in a soft square" pattern noted years ago, first real use of it. <code class="tok">image</code>: a real <code class="tok">&lt;img&gt;</code> thumbnail filling the same box.</span></div>
      <div class="row"><b>One size</b><span>An attachment row doesn't need an sm/base/lg ladder — same reasoning as Card/Menu/Popover.</span></div>
      <div class="row"><b>No error state</b><span>Not seen as a real need in the driving screenshots — only idle/uploading/done exist. Revisit if a real failed-upload case appears.</span></div>
      <div class="row"><b>Remove button</b><span>Resolved from Popover/Drawer/Modal's own close-button recipe, not re-invented: transparent → fill.neutralHover → fill.neutralActive.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">States</h2>
    <p class="section-desc">idle / uploading (composer) → done (message display).</p>
    <div class="story-grid">
      ${stateStories()}
    </div>

    <h2 class="big-section">Media</h2>
    <p class="section-desc">icon vs. image, idle state.</p>
    <div class="story-grid">
      ${mediaStories()}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">A composer with two in-progress attachments, and a sent message's single downloadable attachment.</p>
    <div class="usage-preview">${composerDemo}</div>
    <pre class="code"><code>${esc(composerCode)}</code></pre>
    <div class="usage-preview" style="margin-top:1.5rem;">${messageDemo}</div>
    <pre class="code"><code>${esc(messageCode)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/attachment.html"), html);
console.log("wrote docs/attachment.html");
