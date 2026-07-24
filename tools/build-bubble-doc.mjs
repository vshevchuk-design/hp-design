// Regenerates docs/bubble.html from tokens/components/bubble.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// The plain conversational reply — text ± one Attachment, nothing else.
// Deliberately split from Message by content type, not sender: even a staff
// member's own short reply is a Bubble. "self" (viewer's own message) vs.
// "other" (anyone else's) generalizes to both the student-facing desktop app
// and the staff-facing mobile mockups. self's default fill is a pale tint,
// matching the live desktop app, not the mobile mockup's solid blue — same
// "live product outranks mockup" precedent Message's own chrome default set.
// Sender row reuses the exact Avatar-based pattern Message's own sender row
// already established (resolved from avatar.tokens.json, not retyped), and
// a bubble can nest a real Attachment (resolved from attachment.tokens.json).
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-bubble-doc.mjs
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
const bubble = load("tokens/components/bubble.tokens.json").component.bubble;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;
const attachment = load("tokens/components/attachment.tokens.json").component.attachment;
const message = load("tokens/components/message.tokens.json").component.message;

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
  "bg.primary", "text.default", "text.secondary", "fill.primary", "text.onFill",
  "surface.default", "border.default", "text.muted",
  "avatar.blue.bg", "avatar.blue.text", "avatar.green.bg", "avatar.green.text",
  "surface.sunken", "icon.secondary",
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(bubble.radius.$value));
const paddingY = px(resolve(bubble.paddingY.$value));
const paddingX = px(resolve(bubble.paddingX.$value));
const bubbleGap = px(resolve(bubble.gap.$value));
const textType = resolveToken(get(bubble.text.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// ---- Avatar, resolved from its own tokens (not retyped) — same approach and
// same SM size as Message's own sender row (2026-07-24 rebalance), and the
// sender name color is Message's own sender.nameColor token, not retyped ----
const avatarRadius = px(resolve(avatar.radius.$value));
const avatarDiameter = px(resolve(avatar.size.sm.diameter.$value));
const avatarInitialsType = resolveToken(avatar.size.sm.initials);
const refPath = (ref) => ref.replace(/[{}]/g, "");
const senderNameColor = refPath(message.sender.nameColor.$value);

// ---- Attachment, resolved from its own tokens (not retyped) — for the
// nested-in-a-bubble story only ----
const attRadius = px(resolve(attachment.radius.$value));
const attPadding = px(resolve(attachment.padding.$value));
const attGap = px(resolve(attachment.gap.$value));
const attMediaSize = px(resolve(attachment.media.size.$value));
const attMediaRadius = px(resolve(attachment.media.radius.$value));
const attIconSize = px(resolve(attachment.media.iconSize.$value));
const attTitleType = resolveToken(attachment.title);
const attDescType = resolveToken(attachment.description);

const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconFile = iconOf("insert_drive_file", "attachment__icon");

const css = `${rootVars}

.bubble-row { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; max-width: 75%; font-family: ${cv("family.sans")}; }
.bubble-row--self { align-self: flex-end; align-items: flex-end; }
.bubble-row--other { align-self: flex-start; align-items: flex-start; }
.bubble-sender { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; }
.bubble-sender__text { margin: 0; font-size: 12px; }
.bubble-sender__name { color: ${cv(senderNameColor)}; font-weight: 600; }
.bubble-sender__meta { color: ${cv("text.muted")}; }

.avatar { box-sizing: border-box; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: ${avatarRadius}; width: ${avatarDiameter}; height: ${avatarDiameter}; user-select: none; }
.avatar__initials { text-transform: uppercase; ${typoCss(avatarInitialsType)} }
.avatar--blue { background: ${cv("avatar.blue.bg")}; }
.avatar--blue .avatar__initials { color: ${cv("avatar.blue.text")}; }
.avatar--green { background: ${cv("avatar.green.bg")}; }
.avatar--green .avatar__initials { color: ${cv("avatar.green.text")}; }

.bubble { box-sizing: border-box; display: flex; flex-direction: column; gap: ${bubbleGap}; padding: ${paddingY} ${paddingX}; border-radius: ${radius}; }
.bubble p { margin: 0; ${typoCss(textType)} }
.bubble--self.bubble--tint { background: ${cv("bg.primary")}; color: ${cv("text.default")}; }
.bubble--self.bubble--solid { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; }
.bubble--other { background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; color: ${cv("text.default")}; }

.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${attGap}; padding: ${attPadding}; border-radius: ${attRadius}; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; text-decoration: none; }
.attachment__media { flex-shrink: 0; width: ${attMediaSize}; height: ${attMediaSize}; border-radius: ${attMediaRadius}; display: flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; }
.attachment__icon { width: ${attIconSize}; height: ${attIconSize}; color: ${cv("icon.secondary")}; }
.attachment__content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.attachment__title { margin: 0; color: ${cv("text.default")}; ${typoCss(attTitleType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { margin: 0; color: ${cv("text.muted")}; ${typoCss(attDescType)} }`;

function avatarMarkup(hue, initials) {
  return `<span class="avatar avatar--${hue}"><span class="avatar__initials">${initials}</span></span>`;
}
function senderMarkup({ role, name, meta, hue, initials }) {
  const text = `<p class="bubble-sender__text"><span class="bubble-sender__name">${name}</span> <span class="bubble-sender__meta">-- ${meta}</span></p>`;
  const av = avatarMarkup(hue, initials);
  return `<div class="bubble-sender">${role === "self" ? text + av : av + text}</div>`;
}
function bubbleMarkup({ role, fill = "tint", text, attachmentHtml = "" }) {
  const classes = ["bubble", `bubble--${role}`];
  if (role === "self") classes.push(`bubble--${fill}`);
  return `<div class="${classes.join(" ")}">${text ? `<p>${text}</p>` : ""}${attachmentHtml}</div>`;
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

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

// ---- Roles ----
function roleStories() {
  const defs = [
    { title: "self — tint (default)", html: bubbleMarkup({ role: "self", fill: "tint", text: "Thanks for letting me know. I will submit it today." }), note: "bg.primary + text.default — matches the live desktop app's own reply bubble, not the mobile mockup's solid blue." },
    { title: "self — solid (secondary)", html: bubbleMarkup({ role: "self", fill: "solid", text: "Thanks for letting me know. I will submit it today." }), note: "fill.primary + text.onFill — the staff-mobile mockup's stronger look, available but not the default." },
    { title: "other", html: bubbleMarkup({ role: "other", text: "We are in the process of reviewing your request." }), note: "surface.default + border.default — literally Card's own recipe, one fixed look, no tint/solid axis." },
  ];
  return defs.map((d) => storyCard(d.title, `<div class="bubble-row bubble-row--${d.html.includes("bubble--self") ? "self" : "other"}">${d.html}</div>`, d.html, d.note)).join("\n");
}

// ---- With attachment ----
function attachmentStories() {
  const html = bubbleMarkup({ role: "self", fill: "tint", text: "Here's my ID.", attachmentHtml: attachmentMarkup("Photo-ID.jpg", "1.2 MB") });
  return storyCard(
    "Text + one Attachment",
    `<div class="bubble-row bubble-row--self">${html}</div>`,
    html,
    "At most one Attachment — a real, unmodified Attachment nested inside, no new tokens for the nesting itself."
  );
}

// ---- In context: a short thread, both roles with sender rows ----
const threadDemo = `<div style="display:flex; flex-direction:column; gap:16px;">
      <div class="bubble-row bubble-row--other">
        ${senderMarkup({ role: "other", name: "Ava Robinson", meta: "Mar 02, 1:05 PM", hue: "green", initials: "AR" })}
        ${bubbleMarkup({ role: "other", text: "Please submit your waiver request to Enrollment Services." })}
      </div>
      <div class="bubble-row bubble-row--self">
        ${senderMarkup({ role: "self", name: "George Amalor", meta: "Mar 02, 1:08 PM", hue: "blue", initials: "GA" })}
        ${bubbleMarkup({ role: "self", fill: "tint", text: "Thanks for letting me know. I will submit it today." })}
      </div>
    </div>`;
const threadCode = `<div class="bubble-row bubble-row--other">
  <div class="bubble-sender">…</div>
  <div class="bubble bubble--other"><p>Please submit your waiver request…</p></div>
</div>
<div class="bubble-row bubble-row--self">
  <div class="bubble-sender">…</div>
  <div class="bubble bubble--self bubble--tint"><p>Thanks for letting me know…</p></div>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Bubble</title>
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
  .story-preview { min-height: 56px; display: flex; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .usage-preview { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; margin-bottom: 1rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("bubble")}
  </nav>
  <main>
    <h1>Bubble</h1>
    <p class="sub">tokens/components/bubble.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>Deliberately small</b><span>Plain text ± one Attachment, nothing else — no headings, no images, no CTA. That richer content belongs to Message, split by content type, not sender: even a staff member's own short reply is a Bubble, confirmed against the real screenshots.</span></div>
      <div class="row"><b>self vs. other</b><span>Not a size ladder — "self" is the current viewer's own message (right-aligned), "other" is anyone else's (left-aligned). Generalizes to both the student-facing desktop app and the staff-facing mobile mockups.</span></div>
      <div class="row"><b>self: tint is the default</b><span>The live desktop app's own reply bubble is a pale tint (bg.primary), not the staff-mobile mockup's solid saturated blue. Solid (fill.primary) is documented as the secondary option — same "live product outranks mockup" precedent Message's own chrome default already set.</span></div>
      <div class="row"><b>other: one fixed look</b><span>surface.default + border.default — literally Card's own recipe, no tint/solid axis (that question only applied to self).</span></div>
      <div class="row"><b>radius.lg, not radius.default</b><span>16px, deliberately bigger than the 8px "ordinary control" radius — the same "signals a distinct surface" reasoning Modal/Popover's own larger radii already use.</span></div>
      <div class="row"><b>No own sender row</b><span>Sender avatar/name/timestamp reuse the exact Avatar-based pattern Message's own sender row established — not a second token file, same composition-not-duplication treatment as the plan's MessageThread.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Roles</h2>
    <p class="section-desc">self (tint default, solid secondary) vs. other.</p>
    <div class="story-grid">
      ${roleStories()}
    </div>

    <h2 class="big-section">With an Attachment</h2>
    <p class="section-desc">At most one — the real Attachment component, unmodified.</p>
    <div class="story-grid">
      ${attachmentStories()}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">A short exchange — sender row + bubble, both roles, matching the live Requirement Waiver Request thread.</p>
    <div class="usage-preview">${threadDemo}</div>
    <pre class="code"><code>${esc(threadCode)}</code></pre>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/bubble.html"), html);
console.log("wrote docs/bubble.html");
