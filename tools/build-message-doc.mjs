// Regenerates docs/message.html from tokens/components/message.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// The rich, institution-authored content block — the actual centerpiece of
// the Message/Bubble/Attachment family. Chrome default is NONE (a plain
// block, matching the real live Message Center app exactly); the staff-
// mobile mockups' white-bubble chrome is documented as an optional "card"
// variant, not built as the default — the live product is the source of
// truth here, not the aspirational mockup. Sender row reuses Avatar's own
// recipe (resolved from avatar.tokens.json, not retyped) and the CTA button
// reuses Button primary's own recipe (resolved from button.tokens.json) —
// this component only owns the layout rhythm and body typography around them.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-message-doc.mjs
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
const message = load("tokens/components/message.tokens.json").component.message;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;
const button = load("tokens/components/button.tokens.json").component.button;
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
const refPath = (ref) => ref.replace(/[{}]/g, "");

const colorPaths = [
  "text.default", "text.secondary", "text.muted", "text.primary",
  "surface.default", "border.default",
  "avatar.blue.bg", "avatar.blue.text",
  "fill.primary", "fill.primaryHover", "text.onFill",
  "surface.sunken", "surface.dim", "icon.secondary",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const gap = px(resolve(message.gap.$value));
const senderGap = px(resolve(message.sender.gap.$value));
const nameType = resolveToken(message.sender.name);
const nameColor = refPath(message.sender.nameColor.$value);
const metaType = resolveToken(message.sender.meta);
const bodyGap = px(resolve(message.body.gap.$value));
const paragraphType = resolveToken(get(message.body.paragraph.$value));
const linkType = resolveToken(get(message.body.link.$value));
// resolveToken() only ever reads a token's $value — it silently drops
// $extensions, the field link-sm/base use for textDecoration (documented
// gap, caught once already on Listbox's "Clear all"). Fetch it directly
// from the referenced node instead of trusting the resolved object to carry it.
const linkExtensions = get(message.body.link.$value).$extensions?.["hp.design/text"] || {};
const strongWeight = resolve(message.body.strongWeight.$value);
const listGap = px(resolve(message.body.list.gap.$value));
const listIndent = px(resolve(message.body.list.indent.$value));
const imageRadius = px(resolve(message.body.image.radius.$value));
const imageMarginY = px(resolve(message.body.image.marginY.$value));
const attachmentsGap = px(resolve(message.body.attachments.gap.$value));
const ctaMarginTop = px(resolve(message.cta.marginTop.$value));

const cardChrome = {
  bg: refPath(message.chrome.card.bg.$value),
  border: refPath(message.chrome.card.border.$value),
  radius: px(resolve(message.chrome.card.radius.$value)),
  padding: px(resolve(message.chrome.card.padding.$value)),
};

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// ---- Avatar, resolved from its own tokens (not retyped) — the SM size
// (32px) per the 2026-07-24 sender-row rebalance (base 40px read top-heavy
// next to one small text line) + one identity hue for the demo ----
const avatarRadius = px(resolve(avatar.radius.$value));
const avatarDiameter = px(resolve(avatar.size.sm.diameter.$value));
const avatarInitialsType = resolveToken(avatar.size.sm.initials);

// ---- Button primary, resolved from its own tokens (not retyped) — only the
// base-size recipe is needed for the CTA demo ----
const btnRadius = px(resolve(button.primary.radius.$value));
const btnSize = button.primary.size.base;
const btnHeight = px(resolve(btnSize.height.$value));
const btnPaddingX = px(resolve(btnSize.paddingX.$value));
const btnLabelType = resolveToken(get(btnSize.label.$value));

// ---- Attachment, resolved from its own tokens (not retyped) — a real,
// unmodified Attachment can sit in the body flow, same as Bubble's own slot ----
const attRadius = px(resolve(attachment.radius.$value));
const attPadding = px(resolve(attachment.padding.$value));
const attGap = px(resolve(attachment.gap.$value));
const attMediaSize = px(resolve(attachment.media.size.$value));
const attMediaRadius = px(resolve(attachment.media.radius.$value));
const attIconSize = px(resolve(attachment.media.iconSize.$value));
const attTitleType = resolveToken(attachment.title);
const attDescType = resolveToken(attachment.description);
const iconFile = fs.readFileSync(path.join(root, "assets/icons/material-filled/insert_drive_file.svg"), "utf8").replace("<svg ", '<svg class="attachment__icon" ');

// ---- synthetic image, same spirit as Avatar's own synthetic "photo" ----
function imgDataUri(a, b) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="480" height="220" fill="url(#g)"/><circle cx="380" cy="60" r="70" fill="rgba(255,255,255,0.18)"/><circle cx="90" cy="170" r="90" fill="rgba(255,255,255,0.12)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const heroImg = imgDataUri("#439afd", "#0468c4");

const css = `${rootVars}

.message { display: flex; flex-direction: column; gap: ${gap}; font-family: ${cv("family.sans")}; max-width: 640px; }
.message__sender { display: flex; align-items: center; gap: ${senderGap}; }
.message__sender-line { margin: 0; }
.message__name { color: ${cv(nameColor)}; ${typoCss(nameType)} }
.message__meta { color: ${cv("text.muted")}; ${typoCss(metaType)} }

.message__body { display: flex; flex-direction: column; gap: ${bodyGap}; }
.message__body p { margin: 0; color: ${cv("text.default")}; ${typoCss(paragraphType)} }
.message__body strong { font-weight: ${strongWeight}; }
.message__body ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: ${listGap}; }
.message__body li { padding-left: ${listIndent}; position: relative; color: ${cv("text.default")}; ${typoCss(paragraphType)} }
.message__body li::before { content: "•"; position: absolute; left: ${px(resolve("dim.1_5"))}; color: ${cv("text.muted")}; }
.message__body a { color: ${cv("text.primary")}; ${typoCss(linkType)} text-decoration: ${linkExtensions.textDecoration || "none"}; }
.message__body img { display: block; max-width: 100%; border-radius: ${imageRadius}; margin: ${imageMarginY} 0; }
.message__attachments { display: flex; flex-direction: column; gap: ${attachmentsGap}; }
.message__cta { margin-top: ${ctaMarginTop}; }

.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${attGap}; padding: ${attPadding}; border-radius: ${attRadius}; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; max-width: 320px; }
.attachment__media { flex-shrink: 0; width: ${attMediaSize}; height: ${attMediaSize}; border-radius: ${attMediaRadius}; display: flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; }
.attachment__icon { width: ${attIconSize}; height: ${attIconSize}; color: ${cv("icon.secondary")}; }
.attachment__content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.attachment__title { margin: 0; color: ${cv("text.default")}; ${typoCss(attTitleType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { margin: 0; color: ${cv("text.muted")}; ${typoCss(attDescType)} }

.message--card .message__body { background: ${cv(cardChrome.bg)}; border: 1px solid ${cv(cardChrome.border)}; border-radius: ${cardChrome.radius}; padding: ${cardChrome.padding}; }

.avatar { box-sizing: border-box; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: ${avatarRadius}; width: ${avatarDiameter}; height: ${avatarDiameter}; background: ${cv("avatar.blue.bg")}; user-select: none; }
.avatar__initials { color: ${cv("avatar.blue.text")}; text-transform: uppercase; ${typoCss(avatarInitialsType)} }

.btn { display: inline-flex; align-items: center; justify-content: center; height: ${btnHeight}; padding: 0 ${btnPaddingX}; border: none; border-radius: ${btnRadius}; background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; ${typoCss(btnLabelType)} cursor: pointer; }
.btn:hover { background: ${cv("fill.primaryHover")}; }`;

function avatarMarkup(initials = "AR") {
  return `<span class="avatar"><span class="avatar__initials">${initials}</span></span>`;
}

function attachmentMarkup(title, description) {
  return `<span class="attachment">
      <span class="attachment__media">${iconFile}</span>
      <span class="attachment__content">
        <span class="attachment__title">${title}</span>
        <span class="attachment__description">${description}</span>
      </span>
    </span>`;
}

function senderMarkup(name, meta, initials) {
  return `<div class="message__sender">
      ${avatarMarkup(initials)}
      <p class="message__sender-line"><span class="message__name">${name}</span><span class="message__meta"> -- ${meta}</span></p>
    </div>`;
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

// ---- Anatomy pieces ----
function anatomyStories() {
  const defs = [
    {
      title: "Sender row",
      html: `<div class="message">${senderMarkup("Alexander Robinson", "Dec 19, 2:54 PM")}</div>`,
      note: "Avatar (its own component, resolved not retyped — SM size, 32px) + one line: name (semibold, text.secondary) + \" -- \" + timestamp (muted). Rebalanced 2026-07-24: smaller avatar + gray name so the sender line stops competing with the body.",
    },
    {
      title: "Paragraph + inline emphasis",
      html: `<div class="message__body"><p>This compacted term allows you to earn up to <strong>4 units</strong> in just a few weeks.</p></div>`,
      note: "text-style.body-base, verbatim. <strong> is just weight.semibold — no second typography token.",
    },
    {
      title: "Subheading (same treatment, standalone)",
      html: `<div class="message__body"><p><strong>Important Details</strong></p><p><strong>Dates:</strong> December 19, 2025 – January 12, 2026</p></div>`,
      note: "The exact same bold-emphasis idea used two ways: a standalone paragraph reads as a subheading, a leading <strong> reads as a run-in label. One token, two usages.",
    },
    {
      title: "Bulleted links",
      html: `<div class="message__body"><ul><li><a href="#">Standards of Academic Progress</a></li><li><a href="#">Important Dates</a></li><li><a href="#">Scholarship Information</a></li></ul></div>`,
      note: "text-style.link-base + text.primary, dim.1_5 gap between items.",
    },
    {
      title: "Image",
      html: `<div class="message__body"><img src="${heroImg}" alt="" width="320" /></div>`,
      note: "radius.default corners, dim.2 vertical margin.",
    },
    {
      title: "Attachment(s)",
      html: `<div class="message__body"><p>Your requested transcript is attached below.</p><div class="message__attachments">${attachmentMarkup("Transcript-request.pdf", "PDF · 1.1 MB")}${attachmentMarkup("Instructions.docx", "DOCX · 42 KB")}</div></div>`,
      note: "One or more real, unmodified Attachments (resolved from attachment.tokens.json) — dim.1_5 gap between stacked ones, body.gap between the group and surrounding text, same rhythm Attachment already uses internally.",
    },
    {
      title: "CTA button",
      html: `<div class="message__body"><p>One or more of your Degree Planner courses is no longer offered.</p><button class="btn message__cta">Visit Degree Planner</button></div>`,
      note: "A real component.button (primary, base), resolved from button.tokens.json — only the dim.1 spacing above it belongs to Message.",
    },
  ];
  return defs.map((d) => storyCard(d.title, d.html, d.html, d.note)).join("\n");
}

// ---- Full composed example, chrome: none (the default, matches the live app) ----
const fullExample = `<div class="message">
      ${senderMarkup("Alexander Robinson", "Dec 19, 2:54 PM")}
      <div class="message__body">
        <p>Are you looking to stay on track or get ahead in your degree progress? California State University, San Bernardino is pleased to announce the upcoming <strong>Winter Intersession</strong>.</p>
        <p>This compacted term allows you to earn up to <strong>4 units</strong> in just a few weeks, helping you fulfill requirements between the Fall and Spring semesters.</p>
        <p><strong>Important Details</strong></p>
        <p><strong>Dates:</strong> December 19, 2025 – January 12, 2026</p>
        <p><strong>Format:</strong> Accelerated courses held during the winter break.</p>
        <p><strong>Eligibility:</strong> Open to current students and the general public.</p>
      </div>
    </div>`;
const fullExampleCode = `<div class="message">
  <div class="message__sender">…</div>
  <div class="message__body">
    <p>Are you looking to stay on track…</p>
    <p><strong>Important Details</strong></p>
    <p><strong>Dates:</strong> December 19, 2025 – January 12, 2026</p>
    …
  </div>
</div>`;

// ---- With an attachment, chrome: none ----
const attachmentExample = `<div class="message">
      ${senderMarkup("Betty Locherty", "Mar 01, 2:55 PM", "BL")}
      <div class="message__body">
        <p>Your <strong>Satisfactory Academic Progress</strong> appeal has been received. A copy of your submission is attached for your records.</p>
        <div class="message__attachments">
          ${attachmentMarkup("SAP-appeal-2026.pdf", "PDF · 640 KB")}
        </div>
      </div>
    </div>`;
const attachmentExampleCode = `<div class="message">
  <div class="message__sender">…</div>
  <div class="message__body">
    <p>Your Satisfactory Academic Progress appeal has been received…</p>
    <div class="message__attachments">
      <span class="attachment">…</span>
    </div>
  </div>
</div>`;

// ---- Optional card chrome ----
const cardExample = `<div class="message message--card">
      ${senderMarkup("Betty Locherty", "Mar 01, 2:55 PM", "BL")}
      <div class="message__body">
        <p>This notice provides information about the 2024-2025 financial aid process.</p>
      </div>
    </div>`;
const cardExampleCode = `<div class="message message--card">
  <div class="message__sender">…</div>
  <div class="message__body">…</div>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Message</title>
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

  .usage-preview { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; margin-bottom: 1rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("message")}
  </nav>
  <main>
    <h1>Message</h1>
    <p class="sub">tokens/components/message.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>The rich content type</b><span>Headings-as-bold-labels, mixed text, bulleted links, images, one or more file Attachments, one CTA button — the actual centerpiece of the whole Message/Bubble/Attachment family. This is the institution's formatted announcement, not a conversational reply (that's Bubble).</span></div>
      <div class="row"><b>Chrome: none by default</b><span>A plain block — no bubble shape, no border, no fill — matching the real live Message Center app exactly. The staff-mobile mockups show a white-bubble chrome for the same content; that's documented below as an optional <code class="tok">card</code> variant, not the default. The live product is the source of truth here.</span></div>
      <div class="row"><b>Not sender-based</b><span>Confirmed against the real screenshots: even a staff member's own short reply renders as a Bubble, not a Message. This component is for genuinely formatted/designed content, regardless of who's sending it.</span></div>
      <div class="row"><b>Reuses, doesn't rebuild</b><span>Sender avatar is a real Avatar (resolved from avatar.tokens.json). The CTA is a real Button primary (resolved from button.tokens.json). A body Attachment is a real, unmodified Attachment (resolved from attachment.tokens.json) — same one Bubble nests too. Message only owns the layout rhythm and body typography around them.</span></div>
      <div class="row"><b>One bold, two jobs</b><span>A subheading and an inline run-in label are the same treatment (weight.semibold on body-base) applied to a standalone paragraph vs. a leading &lt;strong&gt; — not two typography tokens.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Anatomy</h2>
    <p class="section-desc">Each piece in isolation.</p>
    <div class="story-grid">
      ${anatomyStories()}
    </div>

    <h2 class="big-section">Full example — chrome: none (default)</h2>
    <p class="section-desc">Composed exactly as the live Winter Intersession announcement renders.</p>
    <div class="usage-preview">${fullExample}</div>
    <pre class="code"><code>${esc(fullExampleCode)}</code></pre>

    <h2 class="big-section">With an attachment</h2>
    <p class="section-desc">A real, unmodified Attachment sitting in the body flow — e.g. a financial-aid notice with the submitted form attached.</p>
    <div class="usage-preview">${attachmentExample}</div>
    <pre class="code"><code>${esc(attachmentExampleCode)}</code></pre>

    <h2 class="big-section">Optional — chrome: card</h2>
    <p class="section-desc">The white-bubble treatment, reusing Card's own exact recipe — used by the Message Center thread view. The chrome wraps the body only: the sender row sits above the bubble, same anatomy as Bubble's own sender row. Not the component default.</p>
    <div class="usage-preview">${cardExample}</div>
    <pre class="code"><code>${esc(cardExampleCode)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/message.html"), html);
console.log("wrote docs/message.html");
