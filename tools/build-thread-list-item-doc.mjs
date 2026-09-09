// Regenerates docs/thread-list-item.html from tokens/components/thread-list-item.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// The Message Center thread-list row — the INBOX shape is the only shape
// since 2026-07-24 (the original card/metadata-row shape, built on Card's
// interactive shell, was removed per explicit request once the full-bleed
// inbox redesign fully replaced it; see decision-log for its history).
// Full-bleed flat rows + divider, required unread/read states, a real
// per-thread flag toggle, optional Expires badge. Badge and Avatar are
// resolved from their own token files, never retyped.
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
const badge = load("tokens/components/badge.tokens.json").component.badge;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;

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

// ---- Avatar identity-color logic — Avatar's own hash(name) % 8, verbatim,
// fed department names ----
const AVATAR_HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}
function hueOf(name) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_HUES[sum % AVATAR_HUES.length];
}
// every identity the demos render — departments AND person senders (mixed
// sender support); the avatar hue vars for each must land in colorPaths
const inboxIdentities = ["Academic Advising", "Financial Aid", "Office of the Registrar", "English Dept", "Ava Robinson", "Alexander Robinson", "Betty Locherty"];
const usedHues = [...new Set(inboxIdentities.map(hueOf))];

const colorPaths = [
  "surface.default", "surface.dim", "border.default", "text.default", "text.secondary", "icon.muted", "text.muted",
  "fill.primary", "fill.neutralHover", "fill.neutralActive", "bg.primary", "border.focus", "icon.warning",
  "bg.danger", "text.danger", "bg.warning", "text.warning", "bg.neutral", "bg.success", "text.success",
  ...usedHues.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const padding = px(resolve(threadListItem.padding.$value));
const subjectType = resolveToken(get(threadListItem.subject.$value));
const selectedBg = refPath(threadListItem.state.selected.bg.$value);
const ringWidth = px(resolve(threadListItem.state.focused.ringWidth.$value));

const inbox = threadListItem.inbox;
const inboxAvatarGap = px(resolve(inbox.avatarGap.$value));
const inboxLineGap = px(resolve(inbox.lineGap.$value));
const inboxIdentityType = resolveToken(inbox.identity);
const inboxTimeType = resolveToken(inbox.time);
const inboxPreviewType = resolveToken(get(inbox.preview.$value));
const inboxFlagSize = px(resolve(inbox.flag.iconSize.$value));
const inboxList = {
  divider: refPath(inbox.list.divider.$value),
  hoverBg: refPath(inbox.list.hoverBg.$value),
  activeBg: refPath(inbox.list.activeBg.$value),
};
const inboxStateCss = (key) => {
  const s = inbox[key];
  return `.thread-item-inbox--${key} { background: ${cv(refPath(s.bg.$value))}; }
.thread-item-inbox--${key} .thread-item-inbox__identity { color: ${cv(refPath(s.identityColor.$value))}; font-weight: ${resolve(s.identityWeight.$value)}; }
.thread-item-inbox--${key} .thread-item-inbox__subject { color: ${cv(refPath(s.subjectColor.$value))}; font-weight: ${resolve(s.subjectWeight.$value)}; }
.thread-item-inbox--${key} .thread-item-inbox__preview { color: ${cv(refPath(s.previewColor.$value))}; }`;
};

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// Flag is a real toggle: both glyphs always in the DOM, shown/hidden via CSS
// off the button's aria-pressed — the Checkbox render-all-glyphs rule.
const iconReplied = fs.readFileSync(path.join(root, "assets/icons/material-filled/reply.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__replied" ');
const iconFlagOutlined = fs.readFileSync(path.join(root, "assets/icons/material-outlined/flag.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__flag-outlined" ');
const iconFlagFilled = fs.readFileSync(path.join(root, "assets/icons/material-filled/flag.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__flag-filled" ');
const flagButton = (flagged) => `<button class="thread-item-inbox__flag-btn" type="button" aria-pressed="${flagged}" aria-label="Flag thread">${iconFlagOutlined}${iconFlagFilled}</button>`;

// ---- Badge, resolved from its own tokens (not retyped) — sm size, tint roles ----
const badgeRadius = px(resolve(badge.radius.$value));
const badgeSm = badge.size.sm;
const badgeHeight = px(resolve(badgeSm.height.$value));
const badgePaddingX = px(resolve(badgeSm.paddingX.$value));
const badgeLabelType = resolveToken(badgeSm.label);
const badgeTint = (role) => ({ bg: refPath(badge.role[role].tint.bg.$value), text: refPath(badge.role[role].tint.text.$value) });
const badgeDangerTint = badgeTint("danger");
const badgeSuccessTint = badgeTint("success");
const badgeWarningTint = badgeTint("warning");
const badgeNeutralTint = badgeTint("neutral");

// ---- Avatar, resolved from its own tokens (not retyped) — SM size (32px)
// since 2026-07-24 feedback, matching the sender-row rebalance ----
const avatarRadius = px(resolve(avatar.radius.$value));
const avatarSm = avatar.size.sm;
const avatarDiameter = px(resolve(avatarSm.diameter.$value));
const avatarInitialsType = resolveToken(avatarSm.initials);

const css = `${rootVars}

.thread-list { display: flex; flex-direction: column; }
.thread-item-inbox { box-sizing: border-box; width: 100%; text-align: left; appearance: none; cursor: pointer; display: flex; align-items: flex-start; gap: ${inboxAvatarGap}; padding: ${padding}; border: none; border-bottom: 1px solid ${cv(inboxList.divider)}; font-family: ${cv("family.sans")}; }
.thread-item-inbox[hidden] { display: none; }
.thread-item-inbox__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: ${inboxLineGap}; }
.thread-item-inbox__top { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item-inbox__identity { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${typoCss(inboxIdentityType)} }
.thread-item-inbox__time { flex-shrink: 0; color: ${cv(refPath(inbox.timeColor.$value))}; ${typoCss(inboxTimeType)} }
.thread-item-inbox__subject { ${typoCss(subjectType)} }
.thread-item-inbox__preview-row { display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item-inbox__preview { flex: 1; min-width: 0; ${typoCss(inboxPreviewType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.thread-item-inbox__replied { flex-shrink: 0; width: ${px(resolve(inbox.replied.iconSize.$value))}; height: ${px(resolve(inbox.replied.iconSize.$value))}; color: ${cv(refPath(inbox.replied.color.$value))}; }
.thread-item-inbox__flag-btn { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border: none; background: none; padding: ${px(resolve("dim.1"))}; margin: -${px(resolve("dim.1"))} 0; border-radius: ${px(resolve("radius.xs"))}; cursor: pointer; color: ${cv(refPath(inbox.flag.color.$value))}; }
.thread-item-inbox__flag-btn svg { width: ${inboxFlagSize}; height: ${inboxFlagSize}; display: block; }
.thread-item-inbox__flag-btn:hover { background: ${cv("fill.neutralHover")}; }
.thread-item-inbox__flag-btn:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: 0; }
.thread-item-inbox__flag-btn .thread-item-inbox__flag-filled { display: none; color: ${cv(refPath(inbox.flag.flaggedColor.$value))}; }
.thread-item-inbox__flag-btn[aria-pressed="true"] .thread-item-inbox__flag-outlined { display: none; }
.thread-item-inbox__flag-btn[aria-pressed="true"] .thread-item-inbox__flag-filled { display: block; }
.thread-item-inbox__expires { margin-top: ${px(resolve("dim.0_5"))}; display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.1"))}; }

${inboxStateCss("unread")}
${inboxStateCss("read")}

.thread-item-inbox:not(.thread-item-inbox--selected):hover { background: ${cv(inboxList.hoverBg)}; }
.thread-item-inbox:not(.thread-item-inbox--selected):active { background: ${cv(inboxList.activeBg)}; }
.thread-item-inbox:focus-visible { outline: ${ringWidth} solid ${cv("border.focus")}; outline-offset: -${ringWidth}; }
.thread-item-inbox--selected { background: ${cv(selectedBg)}; }

.badge { box-sizing: border-box; display: inline-flex; align-items: center; border-radius: ${badgeRadius}; height: ${badgeHeight}; padding: 0 ${badgePaddingX}; ${typoCss(badgeLabelType)} white-space: nowrap; }
.badge--role-danger { background: ${cv(badgeDangerTint.bg)}; color: ${cv(badgeDangerTint.text)}; }
.badge--role-warning { background: ${cv(badgeWarningTint.bg)}; color: ${cv(badgeWarningTint.text)}; }
.badge--role-neutral { background: ${cv(badgeNeutralTint.bg)}; color: ${cv(badgeNeutralTint.text)}; }
.badge--role-success { background: ${cv(badgeSuccessTint.bg)}; color: ${cv(badgeSuccessTint.text)}; }

.avatar { box-sizing: border-box; position: relative; display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; overflow: hidden; border-radius: ${avatarRadius}; width: ${avatarDiameter}; height: ${avatarDiameter}; font-family: ${cv("family.sans")}; user-select: none; }
.avatar__initials { text-transform: uppercase; ${typoCss(avatarInitialsType)} }
${usedHues.map((h) => `.avatar--${h} { background: ${cv(`avatar.${h}.bg`)}; }\n.avatar--${h} .avatar__initials { color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}`;

function inboxAvatarMarkup(department) {
  const hue = hueOf(department);
  return `<span class="avatar avatar--${hue}" role="img" aria-label="${department}"><span class="avatar__initials">${initialsOf(department)}</span></span>`;
}
function expiresBadge(label, role) {
  return `<span class="badge badge--role-${role}">${label}</span>`;
}
// The row is a <div role="button"> (not a <button>) — it contains a genuinely
// interactive child (the flag toggle), and a real button can't nest another
// one; same resolution Attachment's idle shape uses.
function threadInboxItemMarkup({ department, sender, time, subject, preview, expires, state = "read", selected = false, flagged = false, replies = false, replied = false }) {
  const identity = sender ? `${sender} · ${department}` : department;
  return `<div class="thread-item-inbox thread-item-inbox--${state}${selected ? " thread-item-inbox--selected" : ""}" role="button" tabindex="0">
      ${inboxAvatarMarkup(sender || department)}
      <div class="thread-item-inbox__main">
        <div class="thread-item-inbox__top">
          <span class="thread-item-inbox__identity">${identity}</span>
          <span class="thread-item-inbox__time">${time}</span>
        </div>
        <div class="thread-item-inbox__subject">${subject}</div>
        <div class="thread-item-inbox__preview-row">
          <span class="thread-item-inbox__preview">${preview}</span>
          ${replied && state !== "unread" ? iconReplied : ""}
          ${flagButton(flagged)}
        </div>
        ${expires || replies ? `<div class="thread-item-inbox__expires">${replies ? `<span class="badge badge--role-success">Replies open</span>` : ""}${expires || ""}</div>` : ""}
      </div>
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

// ---- Stories — every row is either unread or read, never neither ----
function inboxStories() {
  const defs = [
    {
      title: "unread",
      html: threadInboxItemMarkup({ department: "Academic Advising", time: "3:56 PM", subject: "Question about fall registration", preview: "Hi Alexander, I wanted to check whether …", state: "unread" }),
      note: "surface.default bg, identity/subject at weight.semibold in text.default, preview text.secondary — whiter and higher-contrast than read.",
    },
    {
      title: "read",
      html: threadInboxItemMarkup({ department: "Academic Advising", time: "3:56 PM", subject: "Question about fall registration", preview: "Hi Alexander, I wanted to check whether …", state: "read" }),
      note: "surface.dim bg (a semantic role added for exactly this — one step lighter than sunken), identity/subject at weight.normal in text.secondary, preview text.muted.",
    },
    {
      title: "selected",
      html: threadInboxItemMarkup({ department: "Academic Advising", time: "3:56 PM", subject: "Question about fall registration", preview: "Hi Alexander, I wanted to check whether …", state: "read", selected: true }),
      note: "state.selected.bg (bg.primary), applied persistently — the thread currently open in the reading pane, 'as if permanently pressed'.",
    },
    {
      title: "mixed sender (person · department)",
      html: threadInboxItemMarkup({ sender: "Ava Robinson", department: "English Dept", time: "1:05 PM", subject: "Requirement Waiver Request", preview: "Please submit your waiver request to Enr…", state: "unread", replies: true }),
      note: "When the sender is a person, the identity line reads 'Person · Department' in ONE uniform style — the suffix inherits the identity's color/weight in every state (a v1 muted suffix read as a second font inside the line and was removed same day). The avatar keys off the person. Announcements keep the department alone. 2026-07-26 client feedback: department-only senders felt impersonal.",
    },
    {
      title: "replyable",
      html: threadInboxItemMarkup({ department: "Office of the Registrar", time: "9:15 AM", subject: "Office of the Registrar Message", preview: "Your requested transcript is attached bel…", state: "read", replies: true }),
      note: "A real Badge (sm, success tint — pale green bg, active green text) labeled \"Replied\" on the preview line = this thread accepts replies; absence = announcement / replies closed. v2: replaced the muted reply icon, which read gray and unclear. The preview simply crops a little earlier to make room.",
    },
    {
      title: "flagged",
      html: threadInboxItemMarkup({ department: "Financial Aid", time: "Jul 10", subject: "Course withdrawal deadline", preview: "Hey Alex, I did alright on my quiz b…", state: "unread", flagged: true }),
      note: "The flag is a real per-thread toggle (click it — it works, and doesn't open the row): outlined flag in icon.muted when off, filled flag in icon.warning when on. Both glyphs always in the DOM, swapped via aria-pressed.",
    },
    {
      title: "with Expires (warning)",
      html: threadInboxItemMarkup({ department: "Financial Aid", time: "Jul 10", subject: "Course withdrawal deadline", preview: "Hey Alex, I did alright on my quiz b…", state: "unread", expires: expiresBadge("Expires Jul 20", "warning") }),
      note: "Expires sits on its own row, left-aligned under the preview text — moved here from the live app's right-aligned column next to the timestamp.",
    },
    {
      title: "with Expires (expired)",
      html: threadInboxItemMarkup({ department: "Academic Advising", time: "Jul 8", subject: "Advisement Outreach", preview: "Thank you for the details about the…", state: "read", expires: expiresBadge("Expired Jul 10", "danger") }),
    },
  ];
  return defs.map((d) => storyCard(d.title, `<div class="thread-list">${d.html}</div>`, d.html, d.note || "")).join("\n");
}

// ---- In context — a real single-select, full-bleed list. Clicking a row
// selects it AND marks it read (the real product behavior). ----
const inboxListDemo = `<div class="thread-list thread-item-inbox-demo" style="max-width:400px; border:1px solid var(${cssVarName(inboxList.divider)}); border-bottom:none;">
      ${threadInboxItemMarkup({ sender: "Alexander Robinson", department: "Academic Advising", time: "3:56 PM", subject: "Question about fall registration", preview: "Hi, I wanted to check whether there is …", state: "unread", replies: true })}
      ${threadInboxItemMarkup({ department: "Academic Advising", time: "11:20 AM", subject: "Satisfactory Academic Progress Plan", preview: "Okay I will contact my advisor soon. Tha…", state: "unread" })}
      ${threadInboxItemMarkup({ sender: "Betty Locherty", department: "Financial Aid", time: "Jul 10", subject: "Course withdrawal deadline", preview: "Hey Alex, I did alright on my quiz b…", state: "read", selected: true, flagged: true, replies: true, expires: expiresBadge("Expires Jul 20", "warning") })}
      ${threadInboxItemMarkup({ department: "Academic Advising", time: "Jul 8", subject: "Advisement Outreach", preview: "Thank you for the details about the…", state: "read", expires: expiresBadge("Expired Jul 10", "danger") })}
      ${threadInboxItemMarkup({ department: "Academic Advising", time: "Jun 30", subject: "Study Session", preview: "That works for me — I can make th…", state: "read", expires: expiresBadge("Expires Sep 30", "neutral") })}
    </div>`;
const inboxListDemoCode = `<div class="thread-list">
  <div class="thread-item-inbox thread-item-inbox--unread" role="button" tabindex="0">
    …
    <button class="thread-item-inbox__flag-btn" aria-pressed="false" aria-label="Flag thread">
      <!-- icon: flag (outlined) --><!-- icon: flag (filled) -->
    </button>
    …
  </div>
  <div class="thread-item-inbox thread-item-inbox--read thread-item-inbox--selected" role="button" tabindex="0">…</div>
  …
</div>
<script>
  // flag toggles without opening the row; row click selects + marks read
  document.querySelectorAll(".thread-item-inbox__flag-btn").forEach((flag) => {
    flag.addEventListener("click", (e) => {
      e.stopPropagation();
      flag.setAttribute("aria-pressed", flag.getAttribute("aria-pressed") === "true" ? "false" : "true");
    });
  });
  document.querySelectorAll(".thread-item-inbox").forEach((row) => {
    row.addEventListener("click", () => {
      row.parentElement.querySelectorAll(".thread-item-inbox").forEach((b) => b.classList.remove("thread-item-inbox--selected"));
      row.classList.remove("thread-item-inbox--unread");
      row.classList.add("thread-item-inbox--read", "thread-item-inbox--selected");
    });
  });
</script>`;
const js = `// every flag on the page is a real toggle; stopPropagation keeps a flag
// click from also selecting/reading the row it sits in
document.querySelectorAll(".thread-item-inbox__flag-btn").forEach((flag) => {
  flag.addEventListener("click", (e) => {
    e.stopPropagation();
    flag.setAttribute("aria-pressed", flag.getAttribute("aria-pressed") === "true" ? "false" : "true");
  });
});
document.querySelectorAll(".thread-item-inbox-demo .thread-item-inbox").forEach((row) => {
  const activate = () => {
    row.parentElement.querySelectorAll(".thread-item-inbox").forEach((b) => b.classList.remove("thread-item-inbox--selected"));
    row.classList.remove("thread-item-inbox--unread");
    row.classList.add("thread-item-inbox--read", "thread-item-inbox--selected");
  };
  row.addEventListener("click", activate);
  // role="button" divs don't get Enter/Space for free the way a real <button> does
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — ThreadListItem</title>
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
    <p class="sub">tokens/components/thread-list-item.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, nothing hand-copied. Click a row in "In context" — real single-select that also marks the row read; click a flag — a real toggle.</p>

    <div class="legend">
      <div class="row"><b>One shape now</b><span>The inbox row (avatar + department identity + timestamp + subject + preview + flag + optional Expires) is the component's only shape — the original card/metadata-row shape was removed 2026-07-24 once this redesign fully replaced it. See decision-log for its history.</span></div>
      <div class="row"><b>Full-bleed list</b><span>Flat rows separated by a 1px divider — no radius, no own border, no gaps between rows; the list fills its rail edge to edge. Hover/pressed use the ghost fill.neutralHover/fill.neutralActive progression; selected is the persistent state.selected.bg fill.</span></div>
      <div class="row"><b>unread / read</b><span>Every row is in exactly one of two states: <code class="tok">unread</code> (surface.default bg, semibold text.default identity/subject, text.secondary preview) or <code class="tok">read</code> (surface.dim bg — a semantic role added for exactly this — normal-weight text.secondary identity/subject, text.muted preview). Clicking a row in the demo marks it read for real.</span></div>
      <div class="row"><b>Flag toggle</b><span>A real per-thread importance toggle: outlined <code class="tok">icon.muted</code> flag when off, filled <code class="tok">icon.warning</code> flag when on, swapped via aria-pressed. Because the row nests an interactive element, the row itself is a <code class="tok">&lt;div role="button" tabindex="0"&gt;</code> — a real &lt;button&gt; can't nest another one, the same resolution Attachment's idle shape uses.</span></div>
      <div class="row"><b>Mixed sender</b><span>A thread's sender is a department (announcements) OR a person — "Ava Robinson · English Dept", one uniform identity style across the whole line (the suffix inherits the name's color and weight in every state; a v1 muted suffix read as a second font). The Avatar keys off whichever name leads. Added 2026-07-26 — department-only senders read impersonal.</span></div>
      <div class="row"><b>Reply indicator</b><span>A real Badge (sm, <code class="tok">role=success</code> tint) labeled "Replied" on the preview line marks threads that accept replies (absence = replies closed) — users want to know before opening. Inside the thread view the same fact shows as the Composer being replaced by a quiet closed-replies pill.</span></div>
      <div class="row"><b>Identity avatar</b><span>A real Avatar (sm, resolved from avatar.tokens.json), keyed off the leading sender name (person or department) — Avatar's own hash(name) % 8 identity-color logic.</span></div>
      <div class="row"><b>Expires uses Badge</b><span>A real Badge (sm, tint) on its own left-aligned row under the preview — warning (soon), danger (expired) or neutral (far-off, excluded from "expires soon" filters).</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">JS</h2>
    <p class="section-desc">Flag toggles + click-to-select-and-mark-read for the demo below.</p>
    <pre class="code"><code>${esc(js)}</code></pre>

    <h2 class="big-section">States</h2>
    <p class="section-desc">unread / read / selected / flagged / with Expires.</p>
    <div class="story-grid">
      ${inboxStories()}
    </div>

    <h2 class="big-section">In context</h2>
    <p class="section-desc">A real, single-select inbox list — click any row to select it and mark it read; click a flag to toggle it.</p>
    <div class="usage-preview">${inboxListDemo}</div>
    <pre class="code"><code>${esc(inboxListDemoCode)}</code></pre>
  </main>
</div>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/thread-list-item.html"), html);
console.log("wrote docs/thread-list-item.html");
