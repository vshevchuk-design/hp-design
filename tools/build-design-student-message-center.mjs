// Generates the first entry of the Designs pane (the prototype explorer):
//   docs/designs/student-message-center.html      — viewer page: docs chrome +
//     Mobile/Tablet/Desktop device tabs (a real DS segmented Tabs, resolved
//     from tabs.tokens.json) around an iframe of the app below.
//   docs/designs/student-message-center-app.html  — the actual interactive
//     Student Message Center prototype: mobile-first, responsive, and built
//     STRICTLY from design-system components — every component recipe below
//     is resolved from that component's own token file (same discipline as
//     every build-*-doc.mjs), never retyped. The only non-component CSS is
//     the `mc-*` composition layer (panes, breakpoints, spacing), which is
//     the app-layout equivalent of a docs page's own chrome.
// Functional scope is the live student desktop app (Inbox/Archived tabs,
// search, sort, thread list, reading pane, simple composer) — the staff
// mobile mockups are visual direction only, their staff-side features
// (flags, Handled by, filters, resolve) are deliberately absent.
// Interactions are real: thread selection, tab switching, live search
// filtering, sorting via a Select-trigger + Listbox popover (the composition
// status.md already flagged as Select's natural next step), Send appends a
// real self Bubble, Archive really moves the thread to the Archived list.
// Run: node tools/build-design-student-message-center.mjs
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
const tabs = load("tokens/components/tabs.tokens.json").component.tabs;
const search = load("tokens/components/search.tokens.json").component.search;
const select = load("tokens/components/select.tokens.json").component.select;
const listbox = load("tokens/components/listbox.tokens.json").component.listbox;
const threadListItem = load("tokens/components/thread-list-item.tokens.json").component.threadListItem;
const badge = load("tokens/components/badge.tokens.json").component.badge;
const avatar = load("tokens/components/avatar.tokens.json").component.avatar;
const message = load("tokens/components/message.tokens.json").component.message;
const attachment = load("tokens/components/attachment.tokens.json").component.attachment;
const bubble = load("tokens/components/bubble.tokens.json").component.bubble;
const composer = load("tokens/components/composer.tokens.json").component.composer;
const button = load("tokens/components/button.tokens.json").component.button;
const separator = load("tokens/components/separator.tokens.json").component.separator;

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

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

// ---- Avatar identity-color logic — Avatar's own hash(name) % 8, verbatim ----
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

// ---- Thread data — content matches the live student Message Center app ----
const SELF = { name: "George Amalor", hue: hueOf("George Amalor"), initials: initialsOf("George Amalor") };

const identityNames = [
  "Academic Advising", "Office of the Registrar", "English Dept", "Financial Aid",
  "Alexander Robinson", "Ava Robinson", "Betty Locherty", SELF.name,
];
const usedHues = [...new Set(identityNames.map(hueOf))];

const colorPaths = [
  "surface.page", "surface.default", "surface.sunken",
  "border.default", "border.strong", "border.focus",
  "text.default", "text.secondary", "text.muted", "text.primary", "text.onFill",
  "icon.default", "icon.secondary", "icon.muted", "icon.onFill",
  "fill.primary", "fill.primaryHover", "fill.primaryActive",
  "fill.neutral", "fill.neutralHover", "fill.neutralActive",
  "bg.primary", "bg.warning", "text.warning", "bg.danger", "text.danger",
  ...usedHues.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

// ---- icons ----
const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconSearch = iconOf("search", "search__icon");
const iconClear = iconOf("close", "search__clear");
const iconChevronDown = iconOf("expand_more", "select__chevron");
const iconCheckmark = iconOf("check", "listbox__checkmark");
const iconBack = iconOf("arrow_back", "btn__icon");
const iconPrint = iconOf("print", "btn__icon");
const iconAttach = iconOf("attach_file", "composer__icon");
const iconSend = iconOf("send", "btn__icon");
const iconFile = iconOf("insert_drive_file", "attachment__icon");

// ================= component recipes, each resolved from its own token file =================

// ---- Tabs (underline, base) — Inbox / Archived ----
const tabItemGap = px(resolve(tabs.item.gap.$value));
const tabItemLabel = resolveToken(tabs.item.label);
const tabActiveWeight = resolve(tabs.segmented.state.active.fontWeight.$value);
const tabBase = { height: px(resolve(tabs.size.base.height.$value)), paddingX: px(resolve(tabs.size.base.paddingX.$value)) };
const tabUnderlineGap = px(resolve(tabs.underline.gap.$value));
const tabPillRadius = px(resolve(tabs.segmented.pillRadius.$value));

// ---- Search (base) — a real <input> carrying the component's own value typography ----
const searchRadius = px(resolve(search.radius.$value));
const searchValueType = resolveToken(search.value);
const searchBase = {
  height: px(resolve(search.size.base.height.$value)),
  paddingX: px(resolve(search.size.base.paddingX.$value)),
  gap: px(resolve(search.size.base.gap.$value)),
  iconSize: px(resolve(search.size.base.iconSize.$value)),
};

// ---- Select (base, floated label) — the Sort By trigger ----
const selectRadius = px(resolve(select.radius.$value));
const selBase = select.size.base;
const selectBase = {
  height: px(resolve(selBase.height.$value)),
  paddingX: px(resolve(selBase.paddingX.$value)),
  gap: px(resolve(selBase.gap.$value)),
  iconSize: px(resolve(selBase.iconSize.$value)),
  value: resolveToken(selBase.value),
  label: resolveToken(selBase.label),
  labelGap: px(resolve(selBase.labelGap.$value)),
};

// ---- Listbox (single-select) — the Sort By panel ----
const lbRadius = px(resolve(listbox.radius.$value));
const lbOptionRadius = px(resolve(listbox.optionRadius.$value));
const lbPadding = px(resolve(listbox.padding.$value));
const lbGap = px(resolve(listbox.gap.$value));
const lbOptionPaddingX = px(resolve(listbox.optionPaddingX.$value));
const lbOptionPaddingY = px(resolve(listbox.optionPaddingY.$value));
const lbOptionGap = px(resolve(listbox.optionGap.$value));
const lbCheckmarkSize = px(resolve(listbox.checkmarkSize.$value));
const lbLabelType = resolveToken(listbox.label);
const lbShadow = resolveToken(listbox.shadow);
const lbShadowCss = `${px(lbShadow.offsetX)} ${px(lbShadow.offsetY)} ${px(lbShadow.blur)} ${px(lbShadow.spread)} ${lbShadow.color}`;

// ---- ThreadListItem (inbox shape, 2026-07-24 full-bleed redesign:
// flat divider-separated rows + required unread/read state pair) ----
const tliPadding = px(resolve(threadListItem.padding.$value));
const tliSubjectType = resolveToken(get(threadListItem.subject.$value));
const tliRingWidth = px(resolve(threadListItem.state.focused.ringWidth.$value));
const inbox = threadListItem.inbox;
const inboxAvatarGap = px(resolve(inbox.avatarGap.$value));
const inboxLineGap = px(resolve(inbox.lineGap.$value));
const inboxIdentityType = resolveToken(inbox.identity);
const inboxTimeType = resolveToken(inbox.time);
const inboxPreviewType = resolveToken(get(inbox.preview.$value));
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

// ---- Badge (sm, warning/danger tint) — Expires values ----
const badgeRadius = px(resolve(badge.radius.$value));
const badgeSm = badge.size.sm;
const badgeHeight = px(resolve(badgeSm.height.$value));
const badgePaddingX = px(resolve(badgeSm.paddingX.$value));
const badgeLabelType = resolveToken(badgeSm.label);
const badgeTint = (role) => ({ bg: refPath(badge.role[role].tint.bg.$value), text: refPath(badge.role[role].tint.text.$value) });
const badgeWarningTint = badgeTint("warning");
const badgeDangerTint = badgeTint("danger");

// ---- Avatar (base for list rows, sm for sender rows — the 2026-07-24
// sender-row rebalance: 40px next to one small text line read top-heavy) ----
const avatarRadius = px(resolve(avatar.radius.$value));
const avatarDiameter = px(resolve(avatar.size.base.diameter.$value));
const avatarInitialsType = resolveToken(avatar.size.base.initials);
const avatarSmDiameter = px(resolve(avatar.size.sm.diameter.$value));
const avatarSmInitialsType = resolveToken(avatar.size.sm.initials);

// ---- Message ----
const msgGap = px(resolve(message.gap.$value));
const msgSenderGap = px(resolve(message.sender.gap.$value));
const msgNameType = resolveToken(message.sender.name);
const msgNameColor = refPath(message.sender.nameColor.$value);
const msgMetaType = resolveToken(message.sender.meta);
// chrome: card — used for institution messages in the thread view per
// explicit 2026-07-24 feedback (a chromeless message floating on the page
// read oddly); Card's own recipe via Message's chrome.card tokens.
const msgCard = {
  bg: refPath(message.chrome.card.bg.$value),
  border: refPath(message.chrome.card.border.$value),
  radius: px(resolve(message.chrome.card.radius.$value)),
  padding: px(resolve(message.chrome.card.padding.$value)),
};
const msgBodyGap = px(resolve(message.body.gap.$value));
const msgParagraphType = resolveToken(get(message.body.paragraph.$value));
const msgLinkType = resolveToken(get(message.body.link.$value));
// resolveToken() silently drops $extensions (documented gap) — fetch the
// link's textDecoration straight from the referenced text-style node.
const msgLinkExtensions = get(message.body.link.$value).$extensions?.["hp.design/text"] || {};
const msgStrongWeight = resolve(message.body.strongWeight.$value);
const msgListGap = px(resolve(message.body.list.gap.$value));
const msgListIndent = px(resolve(message.body.list.indent.$value));
const msgAttachmentsGap = px(resolve(message.body.attachments.gap.$value));
const msgCtaMarginTop = px(resolve(message.cta.marginTop.$value));

// ---- Attachment (icon media, done shape lives inside message/bubble body here) ----
const attRadius = px(resolve(attachment.radius.$value));
const attPadding = px(resolve(attachment.padding.$value));
const attGap = px(resolve(attachment.gap.$value));
const attMediaSize = px(resolve(attachment.media.size.$value));
const attMediaRadius = px(resolve(attachment.media.radius.$value));
const attIconSize = px(resolve(attachment.media.iconSize.$value));
const attTitleType = resolveToken(attachment.title);
const attDescType = resolveToken(attachment.description);

// ---- Bubble ----
const bubRadius = px(resolve(bubble.radius.$value));
const bubPaddingY = px(resolve(bubble.paddingY.$value));
const bubPaddingX = px(resolve(bubble.paddingX.$value));
const bubGap = px(resolve(bubble.gap.$value));
const bubTextType = resolveToken(get(bubble.text.$value));

// ---- Composer (simple) ----
const compRadius = px(resolve(composer.radius.$value));
const compFieldPadding = px(resolve(composer.field.padding.$value));
const compFieldGap = px(resolve(composer.field.gap.$value));
const compInputType = resolveToken(composer.input);
const compIconBtnSize = px(resolve(composer.iconButton.size.$value));
const compIconBtnIconSize = px(resolve(composer.iconButton.iconSize.$value));

// ---- Button (primary sm icon-only · secondary base/icon-only · ghost base icon-only) ----
const btnRadius = px(resolve(button.primary.radius.$value));
const btnPrimSm = button.primary.size.sm;
const btnPrimSmHeight = px(resolve(btnPrimSm.height.$value));
const btnPrimSmIconSize = px(resolve(btnPrimSm.iconSize.$value));
const btnSecBase = button.secondary.size.base;
const btnSecHeight = px(resolve(btnSecBase.height.$value));
const btnSecPaddingX = px(resolve(btnSecBase.paddingX.$value));
const btnSecGap = px(resolve(btnSecBase.gap.$value));
const btnSecIconSize = px(resolve(btnSecBase.iconSize.$value));
const btnSecLabelType = resolveToken(get(btnSecBase.label.$value));
const btnGhostBase = button.ghost.size.base;
const btnGhostHeight = px(resolve(btnGhostBase.height.$value));
const btnGhostIconSize = px(resolve(btnGhostBase.iconSize.$value));
const btnRingWidth = px(resolve(button.primary.state.focused.ringWidth.$value));
const btnRingOffset = px(resolve(button.primary.state.focused.ringOffset.$value));

// ---- Separator + THREADS label ----
const separatorColor = refPath(separator.color.$value);
const labelSmNode = get("{text-style.label-sm}");
const labelSmType = resolveToken(labelSmNode);
const labelSmExt = labelSmNode.$extensions?.["hp.design/text"] || {};
const titleXlType = resolveToken(get("{text-style.title-xl}"));
const title2xlType = resolveToken(get("{text-style.title-2xl}"));
const bodySmType = resolveToken(get("{text-style.body-sm}"));

// ================= app CSS =================

const componentCss = `/* ---- component recipes, resolved from each component's own token file ---- */
.tabs--underline { display: flex; align-items: stretch; gap: ${tabUnderlineGap}; border-bottom: 1px solid ${cv("border.default")}; }
.tab { display: inline-flex; align-items: center; justify-content: center; gap: ${tabItemGap}; border: none; background: transparent; cursor: pointer; white-space: nowrap; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; ${typoCss(tabItemLabel)} }
.tab--base { height: ${tabBase.height}; padding: 0 ${tabBase.paddingX}; }
.tabs--underline .tab { flex: 1; border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: ${tabPillRadius} ${tabPillRadius} 0 0; }
.tabs--underline .tab:not(.tab--active):hover { background: ${cv("fill.neutralHover")}; color: ${cv("text.default")}; }
.tabs--underline .tab--active { color: ${cv("text.default")}; font-weight: ${tabActiveWeight}; border-bottom-color: ${cv("border.focus")}; }

.search { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; border-radius: ${searchRadius}; font-family: ${cv("family.sans")}; cursor: text; }
.search--base { height: ${searchBase.height}; padding: 0 ${searchBase.paddingX}; gap: ${searchBase.gap}; }
.search--base .search__icon, .search--base .search__clear { width: ${searchBase.iconSize}; height: ${searchBase.iconSize}; }
.search__icon { flex-shrink: 0; color: ${cv("icon.default")}; }
.search__clear { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; cursor: pointer; border: none; background: none; padding: 0; }
.search__clear[hidden] { display: none; }
.search__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${cv("text.default")}; font-family: ${cv("family.sans")}; ${typoCss(searchValueType)} }
.search__input::placeholder { color: ${cv("text.muted")}; }
.search:hover { border-color: ${cv("border.strong")}; }
.search:focus-within { border-color: ${cv("border.focus")}; }

.select { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; border-radius: ${selectRadius}; font-family: ${cv("family.sans")}; cursor: pointer; text-align: left; }
.select--base { height: ${selectBase.height}; padding: 0 ${selectBase.paddingX}; gap: ${selectBase.gap}; }
.select--base .select__chevron { width: ${selectBase.iconSize}; height: ${selectBase.iconSize}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; }
.select__stack { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; gap: ${selectBase.labelGap}; }
.select__label { color: ${cv("text.muted")}; ${typoCss(selectBase.label)} }
.select__value { color: ${cv("text.default")}; ${typoCss(selectBase.value)} }
.select:hover { border-color: ${cv("border.strong")}; }
.select:focus-visible { outline: none; border-color: ${cv("border.focus")}; }

.listbox { margin: 0; box-sizing: border-box; padding: ${lbPadding}; border-radius: ${lbRadius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${lbShadowCss}; font-family: ${cv("family.sans")}; min-width: 200px; }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${lbGap}; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${lbOptionGap}; padding: ${lbOptionPaddingY} ${lbOptionPaddingX}; border: none; background: none; border-radius: ${lbOptionRadius}; cursor: pointer; text-align: left; color: ${cv("text.default")}; font-family: inherit; ${typoCss(lbLabelType)} }
.listbox__option:hover { background: ${cv("fill.neutralHover")}; }
.listbox__checkmark { width: ${lbCheckmarkSize}; height: ${lbCheckmarkSize}; margin-left: auto; color: ${cv("fill.primary")}; flex-shrink: 0; display: none; }
.listbox__option--selected .listbox__checkmark { display: block; }

.thread-list { display: flex; flex-direction: column; }
.thread-item-inbox { box-sizing: border-box; width: 100%; text-align: left; appearance: none; cursor: pointer; display: flex; align-items: flex-start; gap: ${inboxAvatarGap}; padding: ${tliPadding}; border: none; border-bottom: 1px solid ${cv(inboxList.divider)}; font-family: ${cv("family.sans")}; }
.thread-item-inbox__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: ${inboxLineGap}; }
.thread-item-inbox__top { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item-inbox__identity { ${typoCss(inboxIdentityType)} }
.thread-item-inbox__time { flex-shrink: 0; color: ${cv("text.muted")}; ${typoCss(inboxTimeType)} }
.thread-item-inbox__subject { ${typoCss(tliSubjectType)} }
.thread-item-inbox__preview { color: ${cv("text.muted")}; ${typoCss(inboxPreviewType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.thread-item-inbox__expires { margin-top: ${px(resolve("dim.0_5"))}; }
${inboxStateCss("unread")}
${inboxStateCss("read")}
.thread-item-inbox:not(.thread-item-inbox--selected):hover { background: ${cv(inboxList.hoverBg)}; }
.thread-item-inbox:not(.thread-item-inbox--selected):active { background: ${cv(inboxList.activeBg)}; }
.thread-item-inbox:focus-visible { outline: ${tliRingWidth} solid ${cv("border.focus")}; outline-offset: -${tliRingWidth}; }
.thread-item-inbox--selected { background: ${cv("bg.primary")}; }

.badge { box-sizing: border-box; display: inline-flex; align-items: center; border-radius: ${badgeRadius}; height: ${badgeHeight}; padding: 0 ${badgePaddingX}; ${typoCss(badgeLabelType)} white-space: nowrap; }
.badge--role-warning { background: ${cv(badgeWarningTint.bg)}; color: ${cv(badgeWarningTint.text)}; }
.badge--role-danger { background: ${cv(badgeDangerTint.bg)}; color: ${cv(badgeDangerTint.text)}; }

.avatar { box-sizing: border-box; position: relative; display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; overflow: hidden; border-radius: ${avatarRadius}; width: ${avatarDiameter}; height: ${avatarDiameter}; font-family: ${cv("family.sans")}; user-select: none; }
.avatar__initials { text-transform: uppercase; ${typoCss(avatarInitialsType)} }
.avatar--sm { width: ${avatarSmDiameter}; height: ${avatarSmDiameter}; }
.avatar--sm .avatar__initials { ${typoCss(avatarSmInitialsType)} }
${usedHues.map((h) => `.avatar--${h} { background: ${cv(`avatar.${h}.bg`)}; }\n.avatar--${h} .avatar__initials { color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}

.message { display: flex; flex-direction: column; gap: ${msgGap}; font-family: ${cv("family.sans")}; max-width: 640px; }
.message__sender { display: flex; align-items: center; gap: ${msgSenderGap}; }
.message__sender-line { margin: 0; }
.message__name { color: ${cv(msgNameColor)}; ${typoCss(msgNameType)} }
.message__meta { color: ${cv("text.muted")}; ${typoCss(msgMetaType)} }
.message--card { background: ${cv(msgCard.bg)}; border: 1px solid ${cv(msgCard.border)}; border-radius: ${msgCard.radius}; padding: ${msgCard.padding}; }
.message__body { display: flex; flex-direction: column; gap: ${msgBodyGap}; }
.message__body p { margin: 0; color: ${cv("text.default")}; ${typoCss(msgParagraphType)} }
.message__body strong { font-weight: ${msgStrongWeight}; }
.message__body ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: ${msgListGap}; }
.message__body li { padding-left: ${msgListIndent}; position: relative; color: ${cv("text.default")}; ${typoCss(msgParagraphType)} }
.message__body li::before { content: "•"; position: absolute; left: ${px(resolve("dim.1_5"))}; color: ${cv("text.muted")}; }
.message__body a { color: ${cv("text.primary")}; ${typoCss(msgLinkType)} text-decoration: ${msgLinkExtensions.textDecoration || "none"}; }
.message__attachments { display: flex; flex-direction: column; gap: ${msgAttachmentsGap}; }
.message__cta { margin-top: ${msgCtaMarginTop}; align-self: flex-start; }

.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${attGap}; padding: ${attPadding}; border-radius: ${attRadius}; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; max-width: 320px; text-decoration: none; }
.attachment__media { flex-shrink: 0; width: ${attMediaSize}; height: ${attMediaSize}; border-radius: ${attMediaRadius}; display: flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; }
.attachment__icon { width: ${attIconSize}; height: ${attIconSize}; color: ${cv("icon.secondary")}; }
.attachment__content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.attachment__title { margin: 0; color: ${cv("text.default")}; ${typoCss(attTitleType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { margin: 0; color: ${cv("text.muted")}; ${typoCss(attDescType)} }

.bubble-row { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; max-width: 75%; font-family: ${cv("family.sans")}; }
.bubble-row--self { align-self: flex-end; align-items: flex-end; }
.bubble-row--other { align-self: flex-start; align-items: flex-start; }
.bubble-sender { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; }
.bubble-sender__text { margin: 0; font-size: 12px; }
.bubble-sender__name { color: ${cv(msgNameColor)}; font-weight: 600; }
.bubble-sender__meta { color: ${cv("text.muted")}; }
.bubble { box-sizing: border-box; display: flex; flex-direction: column; gap: ${bubGap}; padding: ${bubPaddingY} ${bubPaddingX}; border-radius: ${bubRadius}; }
.bubble p { margin: 0; ${typoCss(bubTextType)} }
.bubble--self.bubble--tint { background: ${cv("bg.primary")}; color: ${cv("text.default")}; }
.bubble--other { background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; color: ${cv("text.default")}; }

.composer { display: flex; flex-direction: column; gap: ${compFieldGap}; font-family: ${cv("family.sans")}; }
.composer__field { display: flex; align-items: center; gap: ${compFieldGap}; padding: ${compFieldPadding}; border-radius: ${compRadius}; background: ${cv("surface.sunken")}; border: 1px solid ${cv("border.default")}; }
.composer__field:hover { border-color: ${cv("border.strong")}; }
.composer__field:focus-within { border-color: ${cv("border.focus")}; }
.composer__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${cv("text.default")}; ${typoCss(compInputType)} font-family: ${cv("family.sans")}; }
.composer__input::placeholder { color: ${cv("text.muted")}; }
.composer__icon-btn { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${compIconBtnSize}; height: ${compIconBtnSize}; border: none; border-radius: ${px(resolve("radius.default"))}; background: transparent; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.composer__icon-btn .composer__icon { width: ${compIconBtnIconSize}; height: ${compIconBtnIconSize}; display: block; }
.composer__icon-btn:hover { background: ${cv("fill.neutralHover")}; }
.composer__icon-btn:active { background: ${cv("fill.neutralActive")}; }

.btn { display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-family: ${cv("family.sans")}; border-radius: ${btnRadius}; }
.btn:focus-visible { outline: ${btnRingWidth} solid ${cv("border.focus")}; outline-offset: ${btnRingOffset}; }
.btn__icon { flex-shrink: 0; }
.btn--primary { background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; }
.btn--primary:hover { background: ${cv("fill.primaryHover")}; }
.btn--primary:active { background: ${cv("fill.primaryActive")}; }
.btn--primary .btn__icon { color: ${cv("icon.onFill")}; }
.btn--primary.btn--sm.btn--icon-only { width: ${btnPrimSmHeight}; height: ${btnPrimSmHeight}; padding: 0; }
.btn--primary.btn--sm.btn--icon-only .btn__icon { width: ${btnPrimSmIconSize}; height: ${btnPrimSmIconSize}; }
.btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
.btn--secondary:hover { background: ${cv("fill.neutralHover")}; }
.btn--secondary:active { background: ${cv("fill.neutralActive")}; }
.btn--secondary .btn__icon { color: ${cv("icon.default")}; }
.btn--secondary.btn--base { height: ${btnSecHeight}; padding: 0 ${btnSecPaddingX}; gap: ${btnSecGap}; ${typoCss(btnSecLabelType)} }
.btn--secondary.btn--base .btn__icon { width: ${btnSecIconSize}; height: ${btnSecIconSize}; }
.btn--secondary.btn--base.btn--icon-only { width: ${btnSecHeight}; padding: 0; }
.btn--ghost { background: transparent; color: ${cv("text.secondary")}; }
.btn--ghost .btn__icon { color: ${cv("icon.secondary")}; }
.btn--ghost:hover { background: ${cv("fill.neutralHover")}; }
.btn--ghost:active { background: ${cv("fill.neutralActive")}; }
.btn--ghost.btn--base.btn--icon-only { width: ${btnGhostHeight}; height: ${btnGhostHeight}; padding: 0; }
.btn--ghost.btn--base.btn--icon-only .btn__icon { width: ${btnGhostIconSize}; height: ${btnGhostIconSize}; }

.separator { border: none; border-top: 1px solid ${cv(separatorColor)}; margin: 0; }`;

// ---- the mc-* composition layer: app shell, panes, breakpoints — mobile-first ----
const layoutCss = `/* ---- mc-* composition layer (app shell) — mobile-first, 768px / 1024px structural breakpoints (not tokenized, same call as Grid) ---- */
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; color: ${cv("text.default")}; }
.mc { height: 100dvh; display: flex; flex-direction: column; }
.mc__topbar { flex-shrink: 0; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.mc__topbar h1 { margin: 0; color: ${cv("text.default")}; ${typoCss(titleXlType)} }
.mc__body { flex: 1; display: flex; min-height: 0; }

.mc__rail { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.mc__reading { display: none; flex: 1; min-width: 0; flex-direction: column; min-height: 0; }
.mc--thread-open .mc__rail { display: none; }
.mc--thread-open .mc__reading { display: flex; }

.mc-rail__tabs { padding: ${px(resolve("dim.2"))} ${px(resolve("dim.4"))} 0; }
.mc-rail__controls { display: flex; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; }
.mc-rail__controls .search { flex: 1; min-width: 0; }
.mc-rail__controls .select { flex-shrink: 0; min-width: 120px; }
.mc-rail__count { padding: 0 ${px(resolve("dim.4"))}; display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.mc-count { color: ${cv("text.muted")}; ${typoCss(labelSmType)}${labelSmExt.textTransform ? ` text-transform: ${labelSmExt.textTransform};` : ""}${labelSmExt.letterSpacing ? ` letter-spacing: ${labelSmExt.letterSpacing};` : ""} }
.mc-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.mc-list[hidden] { display: none; }

.mc-empty { flex: 1; display: flex; align-items: center; justify-content: center; }
.mc-empty[hidden] { display: none; }
.mc-empty p { margin: 0; color: ${cv("text.muted")}; ${typoCss(title2xlType)} }
.mc-thread { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.mc-thread[hidden] { display: none; }
.mc-thread__bar { flex-shrink: 0; display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.mc-thread__subject { flex: 1; min-width: 0; margin: 0; color: ${cv("text.default")}; ${typoCss(titleXlType)} }
.mc-thread__actions { display: flex; gap: ${px(resolve("dim.2"))}; }
.mc-thread__meta { flex-shrink: 0; display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.2"))} ${px(resolve("dim.8"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; border-bottom: 1px solid ${cv("border.default")}; }
.mc-thread__meta-item { display: flex; flex-direction: column; gap: 2px; }
.mc-thread__meta-label { color: ${cv("text.muted")}; ${typoCss(labelSmType)}${labelSmExt.textTransform ? ` text-transform: ${labelSmExt.textTransform};` : ""} }
.mc-thread__meta-value { color: ${cv("text.default")}; ${typoCss(bodySmType)} }
.mc-thread__scroll { flex: 1; overflow-y: auto; padding: ${px(resolve("dim.4"))}; display: flex; flex-direction: column; gap: ${px(resolve("dim.6"))}; }
.mc-thread__composer { flex-shrink: 0; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} ${px(resolve("dim.4"))}; }

@media (min-width: 768px) {
  .mc__rail, .mc--thread-open .mc__rail { display: flex; flex: none; width: 320px; border-right: 1px solid ${cv("border.default")}; }
  .mc__reading { display: flex; }
  .mc-thread__back { display: none; }
}
@media (min-width: 1024px) {
  .mc__rail, .mc--thread-open .mc__rail { width: 380px; }
  .mc__topbar { padding: ${px(resolve("dim.4"))} ${px(resolve("dim.6"))}; }
  .mc-thread__bar, .mc-thread__meta { padding-left: ${px(resolve("dim.6"))}; padding-right: ${px(resolve("dim.6"))}; }
  .mc-thread__scroll { padding: ${px(resolve("dim.6"))}; }
  .mc-thread__composer { padding: ${px(resolve("dim.4"))} ${px(resolve("dim.6"))} ${px(resolve("dim.6"))}; }
}`;

const appCss = `${rootVars}

${componentCss}

${layoutCss}`;

// ================= markup builders =================

function avatarMarkup(name, size = "base") {
  const hue = hueOf(name);
  return `<span class="avatar avatar--${hue}${size === "sm" ? " avatar--sm" : ""}" role="img" aria-label="${name}"><span class="avatar__initials">${initialsOf(name)}</span></span>`;
}
function attachmentMarkup(title, description) {
  return `<a class="attachment" href="#" download>
              <span class="attachment__media">${iconFile}</span>
              <span class="attachment__content">
                <span class="attachment__title">${title}</span>
                <span class="attachment__description">${description}</span>
              </span>
            </a>`;
}
function messageSender(name, meta) {
  return `<div class="message__sender">
            ${avatarMarkup(name, "sm")}
            <p class="message__sender-line"><span class="message__name">${name}</span><span class="message__meta"> -- ${meta}</span></p>
          </div>`;
}
// Institution messages render with the card chrome (white bubble) in the
// thread view — explicit 2026-07-24 call, see message.chrome.card's own
// $description.
function messageMarkup(sender, meta, bodyHtml) {
  return `<div class="message message--card">
          ${messageSender(sender, meta)}
          <div class="message__body">
            ${bodyHtml}
          </div>
        </div>`;
}
function bubbleRow({ role, name, meta, text, attachmentHtml = "" }) {
  const senderText = `<p class="bubble-sender__text"><span class="bubble-sender__name">${name}</span> <span class="bubble-sender__meta">-- ${meta}</span></p>`;
  const av = avatarMarkup(name, "sm");
  const sender = `<div class="bubble-sender">${role === "self" ? senderText + av : av + senderText}</div>`;
  const fillClass = role === "self" ? " bubble--tint" : "";
  return `<div class="bubble-row bubble-row--${role}">
          ${sender}
          <div class="bubble bubble--${role}${fillClass}">${text ? `<p>${text}</p>` : ""}${attachmentHtml}</div>
        </div>`;
}

// ---- thread data ----
const threads = [
  {
    id: "winter", archived: false, unread: true,
    department: "Academic Advising", date: "12/19/2025", subject: "Winter Intersession",
    preview: "Are you looking to stay on track or get ahead in your degree progress?",
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Alexander Robinson", "Dec 19, 2:54 PM", `<p>Are you looking to stay on track or get ahead in your degree progress? California State University, San Bernardino is pleased to announce the upcoming <strong>Winter Intersession</strong>.</p>
            <p>This compacted term allows you to earn up to <strong>4 units</strong> in just a few weeks, helping you fulfill requirements between the Fall and Spring semesters.</p>
            <p><strong>Important Details</strong></p>
            <p><strong>Dates:</strong> December 19, 2025 – January 12, 2026</p>
            <p><strong>Format:</strong> Accelerated courses held during the winter break.</p>
            <p><strong>Eligibility:</strong> Open to current CSUSB students and the general public.</p>
            <p><strong>Why Consider Winter Intersession?</strong></p>
            <p><strong>Fast-Track Success:</strong> Complete a full 3 or 4-unit course in less than a month.</p>
            <p><strong>Focus Your Energy:</strong> Focus intensely on a single challenging subject without the distraction of a full course load.</p>
            <p><strong>Lighten Your Spring:</strong> Reduce your unit load for the upcoming Spring semester.</p>`),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jul 22, 5:42 AM", text: "Thank you — I will look into registering for the Winter term." }),
    ],
  },
  {
    id: "hello", archived: false, unread: true,
    department: "Academic Advising", date: "12/18/2025", subject: "Hello World",
    preview: "This is a test announcement from Academic Advising.",
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Alexander Robinson", "Dec 18, 11:02 AM", `<p>Hello World! This is a test announcement from <strong>Academic Advising</strong>. No action is required on your part.</p>`),
    ],
  },
  {
    id: "registrar", archived: false,
    department: "Office of the Registrar", date: "12/18/2025", subject: "Office of the Registrar Message",
    preview: "Your requested transcript is attached below.",
    meta: { Department: "Office of the Registrar", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Betty Locherty", "Dec 18, 9:15 AM", `<p>Your requested transcript is attached below. Please review it and let us know if anything looks incorrect.</p>
            <div class="message__attachments">
              ${attachmentMarkup("Transcript-request.pdf", "PDF · 1.1 MB")}
            </div>`),
    ],
  },
  {
    id: "waiver", archived: false,
    department: "English Dept", date: "03/02/2024", subject: "Requirement Waiver Request",
    preview: "Please submit your waiver request to Enrollment Services.",
    meta: { Department: "English Dept", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Ava Robinson", meta: "Mar 02, 1:05 PM", text: "Please submit your waiver request to Enrollment Services." }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Mar 02, 1:08 PM", text: "Thanks for letting me know. I will submit it today.", attachmentHtml: attachmentMarkup("Photo-ID.jpg", "1.2 MB") }),
    ],
  },
  {
    id: "pell", archived: false,
    department: "Financial Aid", date: "03/01/2024", subject: "Close to Pell Lifetime Limits",
    preview: "You are approaching the lifetime limit of Federal Pell Grant.",
    expires: { label: "Expires 03/01/2027", role: "warning" },
    meta: { Regarding: "Your Financial Aid", Department: "Financial Aid", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Betty Locherty", "Mar 01, 2:55 PM", `<p>Our records indicate you are approaching the lifetime limit of <strong>Federal Pell Grant</strong> funding (600%).</p>
            <p><strong>What this means:</strong> Once you reach the limit, you will no longer be eligible to receive Pell Grant funds at any institution.</p>
            <ul>
              <li><a href="#">Standards of Academic Progress</a></li>
              <li><a href="#">Important Dates</a></li>
              <li><a href="#">Scholarship Information</a></li>
            </ul>
            <button class="btn btn--secondary btn--base message__cta" type="button">Visit Financial Aid</button>`),
    ],
  },
  {
    id: "important", archived: false,
    department: "Financial Aid", date: "02/27/2024", subject: "Important Information",
    preview: "This notice provides information about the 2024-2025 financial aid process.",
    meta: { Regarding: "ISIR - General Information", Department: "Financial Aid", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Betty Locherty", "Feb 27, 8:40 AM", `<p>This notice provides information about the <strong>2024-2025</strong> financial aid process.</p>
            <p>Please make sure your FAFSA information is up to date and review the resources below.</p>
            <ul>
              <li><a href="#">FAFSA Updates</a></li>
              <li><a href="#">Verification Checklist</a></li>
            </ul>`),
    ],
  },
  {
    id: "outreach", archived: true,
    department: "Academic Advising", date: "07/08/2025", subject: "Advisement Outreach",
    preview: "Thank you for the details about the upcoming term.",
    expires: { label: "Expired Jul 10", role: "danger" },
    meta: { Department: "Academic Advising", Status: "Closed", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Alexander Robinson", "Jul 08, 10:20 AM", `<p>We are reaching out to schedule your advisement appointment for the upcoming term. This thread has expired — please start a new one if you still need assistance.</p>`),
    ],
  },
  {
    id: "study", archived: true,
    department: "Academic Advising", date: "06/30/2025", subject: "Study Session",
    preview: "That works for me — I can make that time.",
    meta: { Department: "Academic Advising", Status: "Closed", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Alexander Robinson", meta: "Jun 30, 3:12 PM", text: "We are hosting a study session on Thursday at 4 PM in the library, room 204." }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jun 30, 3:20 PM", text: "That works for me — I can make that time." }),
    ],
  },
];

function rowMarkup(t, idx) {
  const expires = t.expires ? `<div class="thread-item-inbox__expires"><span class="badge badge--role-${t.expires.role}">${t.expires.label}</span></div>` : "";
  return `<button class="thread-item-inbox thread-item-inbox--${t.unread ? "unread" : "read"}" data-thread="${t.id}" data-idx="${idx}" data-subject="${esc(t.subject)}" data-department="${esc(t.department)}">
        ${avatarMarkup(t.department)}
        <div class="thread-item-inbox__main">
          <div class="thread-item-inbox__top">
            <span class="thread-item-inbox__identity">${t.department}</span>
            <span class="thread-item-inbox__time">${t.date}</span>
          </div>
          <div class="thread-item-inbox__subject">${t.subject}</div>
          <div class="thread-item-inbox__preview">${t.preview}</div>
          ${expires}
        </div>
      </button>`;
}

function threadPane(t) {
  const metaItems = Object.entries(t.meta)
    .map(([label, value]) => `<div class="mc-thread__meta-item"><span class="mc-thread__meta-label">${label}</span><span class="mc-thread__meta-value">${value}</span></div>`)
    .join("\n          ");
  const archiveBtn = t.archived ? "" : `<button class="btn btn--secondary btn--base mc-archive" type="button" data-thread="${t.id}">Archive</button>`;
  return `<article class="mc-thread" data-thread="${t.id}" hidden>
        <header class="mc-thread__bar">
          <button class="btn btn--ghost btn--base btn--icon-only mc-thread__back" type="button" aria-label="Back to thread list">${iconBack}</button>
          <h2 class="mc-thread__subject">${t.subject}</h2>
          <div class="mc-thread__actions">
            ${archiveBtn}
            <button class="btn btn--secondary btn--base btn--icon-only mc-print" type="button" aria-label="Print thread">${iconPrint}</button>
          </div>
        </header>
        <div class="mc-thread__meta">
          ${metaItems}
        </div>
        <div class="mc-thread__scroll">
          ${t.content.join("\n          ")}
        </div>
        <footer class="mc-thread__composer">
          <form class="composer composer--simple mc-composer" data-thread="${t.id}">
            <div class="composer__field">
              <input class="composer__input" placeholder="Write a message..." aria-label="Write a message" />
              <button type="button" class="composer__icon-btn" aria-label="Attach file">${iconAttach}</button>
              <button type="submit" class="btn btn--primary btn--sm btn--icon-only" aria-label="Send">${iconSend}</button>
            </div>
          </form>
        </footer>
      </article>`;
}

const inboxThreads = threads.filter((t) => !t.archived);
const archivedThreads = threads.filter((t) => t.archived);

const sortOptions = [
  { key: "idx", label: "Date" },
  { key: "subject", label: "Subject" },
  { key: "department", label: "Department" },
];

// ---- the appended-on-Send self bubble template, reused by the app script.
// Static sender markup is generated here at build time (same avatar recipe);
// the user's text is injected via textContent, never innerHTML. ----
const selfBubbleSender = `<div class="bubble-sender"><p class="bubble-sender__text"><span class="bubble-sender__name">${SELF.name}</span> <span class="bubble-sender__meta">-- Just now</span></p><span class="avatar avatar--${SELF.hue} avatar--sm" role="img" aria-label="${SELF.name}"><span class="avatar__initials">${SELF.initials}</span></span></div>`;

const appJs = `(function () {
  var mc = document.querySelector(".mc");
  var empty = document.getElementById("mc-empty");
  var panes = document.querySelectorAll(".mc-thread");
  var lists = { inbox: document.querySelector('[data-list="inbox"]'), archived: document.querySelector('[data-list="archived"]') };
  var countEl = document.getElementById("mc-count");
  var searchInput = document.getElementById("mc-search-input");
  var searchClear = document.getElementById("mc-search-clear");
  var activeList = "inbox";

  function rows(listKey) {
    return Array.prototype.slice.call(lists[listKey].querySelectorAll(".thread-item-inbox"));
  }
  function updateCount() {
    var visible = rows(activeList).filter(function (r) { return !r.hidden; }).length;
    countEl.textContent = visible + (visible === 1 ? " THREAD" : " THREADS");
  }
  function showPane(id) {
    panes.forEach(function (p) { p.hidden = p.dataset.thread !== id; });
    empty.hidden = !!id;
    if (!id) empty.hidden = false;
  }
  function closeThread() {
    mc.classList.remove("mc--thread-open");
    showPane(null);
    rows("inbox").concat(rows("archived")).forEach(function (r) { r.classList.remove("thread-item-inbox--selected"); });
  }

  // thread selection — single-select across both lists; opening a thread
  // also marks it read (removes the unread state), the real product behavior
  document.querySelectorAll(".thread-item-inbox").forEach(function (row) {
    row.addEventListener("click", function () {
      rows("inbox").concat(rows("archived")).forEach(function (r) { r.classList.remove("thread-item-inbox--selected"); });
      row.classList.remove("thread-item-inbox--unread");
      row.classList.add("thread-item-inbox--read", "thread-item-inbox--selected");
      showPane(row.dataset.thread);
      mc.classList.add("mc--thread-open");
    });
  });

  // back (mobile only)
  document.querySelectorAll(".mc-thread__back").forEach(function (btn) {
    btn.addEventListener("click", function () { mc.classList.remove("mc--thread-open"); });
  });

  // Inbox / Archived tabs
  document.querySelectorAll(".mc-rail__tabs .tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".mc-rail__tabs .tab").forEach(function (t) {
        t.classList.toggle("tab--active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      activeList = tab.dataset.tab;
      lists.inbox.hidden = activeList !== "inbox";
      lists.archived.hidden = activeList !== "archived";
      applyFilter();
    });
  });

  // live search filter
  function applyFilter() {
    var q = searchInput.value.trim().toLowerCase();
    ["inbox", "archived"].forEach(function (key) {
      rows(key).forEach(function (r) {
        r.hidden = q !== "" && r.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
    searchClear.hidden = q === "";
    updateCount();
  }
  searchInput.addEventListener("input", applyFilter);
  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    applyFilter();
    searchInput.focus();
  });

  // Sort By — Select trigger + Listbox popover
  var sortTrigger = document.getElementById("mc-sort-trigger");
  var sortListbox = document.getElementById("mc-sort-listbox");
  var sortValue = document.getElementById("mc-sort-value");
  sortListbox.addEventListener("toggle", function (e) {
    if (e.newState === "open") {
      var r = sortTrigger.getBoundingClientRect();
      sortListbox.style.position = "fixed";
      sortListbox.style.margin = "0";
      sortListbox.style.top = r.bottom + 4 + "px";
      sortListbox.style.left = Math.max(8, r.right - sortListbox.offsetWidth) + "px";
    }
  });
  function sortLists(key) {
    ["inbox", "archived"].forEach(function (listKey) {
      var list = lists[listKey];
      var sorted = rows(listKey).sort(function (a, b) {
        if (key === "idx") return Number(a.dataset.idx) - Number(b.dataset.idx);
        return a.dataset[key].localeCompare(b.dataset[key]);
      });
      sorted.forEach(function (r) { list.appendChild(r); });
    });
  }
  sortListbox.querySelectorAll(".listbox__option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      sortListbox.querySelectorAll(".listbox__option").forEach(function (o) {
        o.classList.toggle("listbox__option--selected", o === opt);
        o.setAttribute("aria-selected", o === opt ? "true" : "false");
      });
      sortValue.textContent = opt.dataset.label;
      sortLists(opt.dataset.key);
      sortListbox.hidePopover();
    });
  });

  // composer — Send appends a real self Bubble (tint, the default)
  var SELF_SENDER = ${JSON.stringify(selfBubbleSender)};
  document.querySelectorAll(".mc-composer").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector(".composer__input");
      var text = input.value.trim();
      if (!text) return;
      var scroll = form.closest(".mc-thread").querySelector(".mc-thread__scroll");
      var row = document.createElement("div");
      row.className = "bubble-row bubble-row--self";
      row.innerHTML = SELF_SENDER + '<div class="bubble bubble--self bubble--tint"><p></p></div>';
      row.querySelector(".bubble p").textContent = text;
      scroll.appendChild(row);
      scroll.scrollTop = scroll.scrollHeight;
      input.value = "";
      input.focus();
    });
  });

  // Archive — really moves the thread's row to the Archived list
  document.querySelectorAll(".mc-archive").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.thread;
      var row = lists.inbox.querySelector('[data-thread="' + id + '"]');
      if (row) {
        row.classList.remove("thread-item-inbox--selected");
        lists.archived.insertBefore(row, lists.archived.firstChild);
      }
      btn.remove();
      closeThread();
      applyFilter();
    });
  });

  // Print
  document.querySelectorAll(".mc-print").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });

  updateCount();
})();`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Student Message Center — hp-design prototype</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
<div class="mc">
  <header class="mc__topbar"><h1>Message Center</h1></header>
  <div class="mc__body">
    <aside class="mc__rail" aria-label="Thread list">
      <div class="mc-rail__tabs">
        <div class="tabs tabs--underline tabs--base" role="tablist">
          <button class="tab tab--base tab--active" role="tab" aria-selected="true" data-tab="inbox">Inbox</button>
          <button class="tab tab--base" role="tab" aria-selected="false" data-tab="archived">Archived</button>
        </div>
      </div>
      <div class="mc-rail__controls">
        <div class="search search--base">
          ${iconSearch}
          <input class="search__input" id="mc-search-input" placeholder="Search" aria-label="Search threads" />
          <button class="search__clear" id="mc-search-clear" type="button" aria-label="Clear search" hidden>${iconClear.replace('<svg class="search__clear" ', '<svg ')}</button>
        </div>
        <button class="select select--base" id="mc-sort-trigger" type="button" popovertarget="mc-sort-listbox">
          <span class="select__stack"><span class="select__label">Sort By</span><span class="select__value" id="mc-sort-value">Date</span></span>
          ${iconChevronDown}
        </button>
        <div class="listbox" id="mc-sort-listbox" popover>
          <ul class="listbox__list" role="listbox" aria-label="Sort threads by">
            ${sortOptions.map((o, i) => `<li><button class="listbox__option${i === 0 ? " listbox__option--selected" : ""}" role="option" aria-selected="${i === 0}" data-key="${o.key}" data-label="${o.label}" type="button">${o.label}${iconCheckmark}</button></li>`).join("\n            ")}
          </ul>
        </div>
      </div>
      <div class="mc-rail__count">
        <span class="mc-count" id="mc-count">${inboxThreads.length} THREADS</span>
        <hr class="separator" />
      </div>
      <div class="mc-list" data-list="inbox">
        ${inboxThreads.map((t, i) => rowMarkup(t, i)).join("\n        ")}
      </div>
      <div class="mc-list" data-list="archived" hidden>
        ${archivedThreads.map((t, i) => rowMarkup(t, inboxThreads.length + i)).join("\n        ")}
      </div>
    </aside>
    <section class="mc__reading" aria-label="Thread">
      <div class="mc-empty" id="mc-empty"><p>Choose a Thread</p></div>
      ${threads.map((t) => threadPane(t)).join("\n      ")}
    </section>
  </div>
</div>
<script>
${appJs}
</script>
</body>
</html>
`;

// ================= viewer page (docs chrome + device tabs + iframe) =================

// Device tabs are a real DS segmented Tabs — resolved from tabs.tokens.json.
const segTrackRadius = px(resolve(tabs.segmented.trackRadius.$value));
const segTrackPadding = px(resolve(tabs.segmented.trackPadding.$value));
const segPillRadius = px(resolve(tabs.segmented.pillRadius.$value));
const viewerColorPaths = ["surface.sunken", "surface.default", "fill.neutralHover", "text.secondary", "text.default", "border.default", "border.focus"];
const viewerRootVars = renderRootVars([...viewerColorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

const viewerCss = `${viewerRootVars}

.tabs--segmented { display: inline-flex; align-items: center; gap: ${segTrackPadding}; background: ${cv("surface.sunken")}; border-radius: ${segTrackRadius}; padding: ${segTrackPadding}; }
.tab { display: inline-flex; align-items: center; justify-content: center; gap: ${tabItemGap}; border: none; background: transparent; cursor: pointer; white-space: nowrap; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; ${typoCss(tabItemLabel)} }
.tab--base { height: ${tabBase.height}; padding: 0 ${tabBase.paddingX}; }
.tabs--segmented .tab { border-radius: ${segPillRadius}; }
.tabs--segmented .tab:not(.tab--active):hover { background: ${cv("fill.neutralHover")}; color: ${cv("text.default")}; }
.tabs--segmented .tab--active { background: ${cv("surface.default")}; color: ${cv("text.default")}; font-weight: ${tabActiveWeight}; }

.device-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 1rem; }
.open-standalone { font-size: 13px; color: var(--accent); text-decoration: none; }
.open-standalone:hover { text-decoration: underline; }
.frame-wrap { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; justify-content: center; overflow-x: auto; }
.device { border: 1px solid ${cv("border.default")}; background: #fff; overflow: hidden; transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease; flex-shrink: 0; }
.device iframe { width: 100%; height: 100%; border: none; display: block; }
.device--mobile { width: 375px; height: 812px; max-height: 78vh; border-radius: 28px; }
.device--tablet { width: 768px; height: 1024px; max-height: 78vh; border-radius: 20px; }
.device--desktop { width: 100%; height: 78vh; border-radius: 12px; }`;

const viewerJs = `document.querySelectorAll(".device-bar .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".device-bar .tab").forEach((t) => {
      t.classList.toggle("tab--active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    var device = document.getElementById("device");
    device.className = "device device--" + tab.dataset.device;
  });
});`;

const viewerHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Student Message Center</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
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
  main { flex: 1; padding: 3rem 3rem 4rem; max-width: 1400px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2rem; max-width: 78ch; line-height: 1.6; }

  ${viewerCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("student-message-center", { basePath: "../" })}
  </nav>
  <main>
    <h1>Student Message Center</h1>
    <p class="sub">Interactive prototype, built strictly from hp-design components (every recipe resolved from its own token file) — mobile-first, responsive. Click a thread, switch Inbox/Archived, search, sort, send a reply, archive a thread — all real. Staff-side features (flags, Handled by, filters) are deliberately absent: this is the student app.</p>

    <div class="device-bar">
      <div class="tabs tabs--segmented tabs--base" role="tablist" aria-label="Preview viewport">
        <button class="tab tab--base tab--active" role="tab" aria-selected="true" data-device="mobile">Mobile</button>
        <button class="tab tab--base" role="tab" aria-selected="false" data-device="tablet">Tablet</button>
        <button class="tab tab--base" role="tab" aria-selected="false" data-device="desktop">Desktop</button>
      </div>
      <a class="open-standalone" href="student-message-center-app.html" target="_blank" rel="noopener">Open standalone ↗</a>
    </div>
    <div class="frame-wrap">
      <div class="device device--mobile" id="device">
        <iframe src="student-message-center-app.html" title="Student Message Center prototype"></iframe>
      </div>
    </div>
  </main>
</div>
<script>
${viewerJs}
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/student-message-center-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/student-message-center.html"), viewerHtml);
console.log("wrote docs/designs/student-message-center-app.html");
console.log("wrote docs/designs/student-message-center.html");
