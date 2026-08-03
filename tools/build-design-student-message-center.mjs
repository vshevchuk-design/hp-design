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
const listbox = load("tokens/components/listbox.tokens.json").component.listbox;
const chip = load("tokens/components/chip.tokens.json").component.chip;
const counter = load("tokens/components/counter.tokens.json").component.counter;
const emptyState = load("tokens/components/empty-state.tokens.json").component.emptyState;
const toast = load("tokens/components/toast.tokens.json").component.toast;
const select = load("tokens/components/select.tokens.json").component.select;
const input = load("tokens/components/input.tokens.json").component.input;
const modal = load("tokens/components/modal.tokens.json").component.modal;
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
  // compose-only staff (recipient picker rows) — initials tier, no photos
  "Maria Santos", "James Mori",
];
const usedHues = [...new Set(identityNames.map(hueOf))];

const colorPaths = [
  "surface.page", "surface.default", "surface.sunken", "surface.dim",
  "border.default", "border.strong", "border.focus",
  "text.default", "text.secondary", "text.muted", "text.primary", "text.onFill",
  "icon.default", "icon.secondary", "icon.muted", "icon.onFill", "icon.primary", "icon.warning",
  "fill.primary", "fill.primaryHover", "fill.primaryActive",
  "fill.neutral", "fill.neutralHover", "fill.neutralActive",
  "bg.primary", "bg.neutral", "bg.warning", "text.warning", "bg.danger", "text.danger", "bg.success", "text.success", "status.success", "surface.overlay",
  "fill.danger", "fill.dangerHover", "fill.disabled", "text.disabled", "icon.disabled", "surface.disabled",
  ...usedHues.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

// ---- icons ----
const iconOf = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconSearch = iconOf("search", "search__icon");
const iconSearchBtn = iconOf("search", "btn__icon");
const iconClear = iconOf("close", "search__clear");
const iconChevronDown = iconOf("expand_more", "chip__icon");
const iconFilter = iconOf("filter_list", "chip__icon");
const iconEdit = iconOf("edit", "btn__icon");
const iconChevronSelect = iconOf("expand_more", "select__chevron");
const iconCloseBtn = iconOf("close", "btn__icon");
const iconCheckmark = iconOf("check", "listbox__checkmark");
const iconCbCheck = iconOf("check", "listbox__cb-icon");
const iconReplied = fs.readFileSync(path.join(root, "assets/icons/material-filled/reply.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__replied" ');
const iconFlagOutlined = fs.readFileSync(path.join(root, "assets/icons/material-outlined/flag.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__flag-outlined" ');
const iconFlagFilled = fs.readFileSync(path.join(root, "assets/icons/material-filled/flag.svg"), "utf8").replace("<svg ", '<svg class="thread-item-inbox__flag-filled" ');

const iconBack = iconOf("arrow_back", "btn__icon");
const iconPrint = iconOf("print", "btn__icon");
const iconAttach = iconOf("attach_file", "composer__icon");
const iconAttachBtn = iconOf("attach_file", "btn__icon");
const iconSend = iconOf("send", "btn__icon");
const iconFile = iconOf("insert_drive_file", "attachment__icon");

// ================= component recipes, each resolved from its own token file =================

// ---- Tabs (underline, base) — Inbox / Archived ----
const tabItemGap = px(resolve(tabs.item.gap.$value));
const tabItemLabel = resolveToken(tabs.item.label);
const tabActiveWeight = resolve(tabs.segmented.state.active.fontWeight.$value);
const tabBase = { height: px(resolve(tabs.size.base.height.$value)), paddingX: px(resolve(tabs.size.base.paddingX.$value)) };
const tabSm = { height: px(resolve(tabs.size.sm.height.$value)), paddingX: px(resolve(tabs.size.sm.paddingX.$value)) };
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

// ---- Tabs (segmented, base) — replaced the underline pair 2026-07-24 per
// explicit feedback ("tabs in a block"), matching the staff-mockup reference ----
const segTrackRadiusApp = px(resolve(tabs.segmented.trackRadius.$value));
const segTrackPaddingApp = px(resolve(tabs.segmented.trackPadding.$value));
const segPillRadiusApp = px(resolve(tabs.segmented.pillRadius.$value));

// ---- Counter (sm, onNeutral) — unread count on the Inbox tab, resolved
// from counter.tokens.json exactly the way tabs' own docs page does. sm to
// match the sm tabs (2026-07-24: tab item 32px + 4px track padding = the
// requested 40px total track height) ----
const counterRadius = px(resolve(counter.radius.$value));
const counterSm = {
  height: px(resolve(counter.size.sm.height.$value)),
  minWidth: px(resolve(counter.size.sm.minWidth.$value)),
  paddingX: px(resolve(counter.size.sm.paddingX.$value)),
  label: resolveToken(counter.size.sm.label),
};

// ---- Toast — resolved from its own token file (built 2026-07-24, with the
// archive confirmation here as its driving use case) ----
const toastRadius = px(resolve(toast.radius.$value));
const toastPaddingX = px(resolve(toast.paddingX.$value));
const toastPaddingY = px(resolve(toast.paddingY.$value));
const toastGap = px(resolve(toast.gap.$value));
const toastOffsetTop = px(resolve(toast.offsetTop.$value));
const toastIconSize = px(resolve(toast.iconSize.$value));
const toastLabelType = resolveToken(get(toast.label.$value));
const toastLabelColor = refPath(toast.labelColor.$value);
const toastShadow = resolveToken(toast.shadow);
const toastShadowCss = `${px(toastShadow.offsetX)} ${px(toastShadow.offsetY)} ${px(toastShadow.blur)} ${px(toastShadow.spread)} ${toastShadow.color}`;
const toastSuccessIconPath = refPath(toast.role.success.icon.$value);
const iconToastSuccess = fs.readFileSync(path.join(root, "assets/icons/material-filled/check_circle.svg"), "utf8").replace("<svg ", '<svg class="toast__icon" ');

// ---- Select (base) — the compose dialog's Department trigger; the same
// closed-trigger + Listbox composition Sort By pioneered ----
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
// Select's disabled state — the compose To trigger sits disabled until a
// department is chosen; resolved from select.tokens.json's own state node
const selectDisabled = {
  bg: refPath(select.state.disabled.bg.$value),
  border: refPath(select.state.disabled.border.$value),
  value: refPath(select.state.disabled.value.$value),
  label: refPath(select.state.disabled.label.$value),
  chevron: refPath(select.state.disabled.chevron.$value),
};

// ---- Input (base) — compose subject + message fields (the message field is
// a textarea carrying the same recipe; its min-height is a layout literal) ----
const inputRadius = px(resolve(input.radius.$value));
const inputBase = input.size.base;
const inputHeight = px(resolve(inputBase.height.$value));
const inputPaddingX = px(resolve(inputBase.paddingX.$value));
const inputValueType = resolveToken(inputBase.value);
// Input's floating label — the compose Subject/Message fields carry the
// component's own resting/focus/populated state model (label hidden while
// resting, floated in at 12px on focus or once populated)
const inputLabelType = resolveToken(inputBase.label);
const inputLabelGap = px(resolve(inputBase.labelGap.$value));
const inputFocusLabelColor = refPath(input.state.focus.label.$value);
const inputPopulatedLabelColor = refPath(input.state.populated.label.$value);

// ---- Modal — the compose dialog shell, resolved from modal.tokens.json ----
const mdWidth = px(resolve(modal.width.$value));
const mdRadius = px(resolve(modal.radius.$value));
const mdPadding = px(resolve(modal.padding.$value));
const mdGap = px(resolve(modal.gap.$value));
const mdBg = refPath(modal.bg.$value);
const mdOverlay = refPath(modal.overlay.$value);
const mdDivider = refPath(modal.divider.$value);
const mdTitleType = resolveToken(get(modal.title.$value));
const mdTitleColor = refPath(modal.titleColor.$value);
const mdShadow = resolveToken(modal.shadow);
const mdShadowCss = `${px(mdShadow.offsetX)} ${px(mdShadow.offsetY)} ${px(mdShadow.blur)} ${px(mdShadow.spread)} ${mdShadow.color}`;
const mdBodyType = resolveToken(get(modal.body.$value));
const mdBodyColor = refPath(modal.bodyColor.$value);

// ---- Button primary base (topbar New message) + lg (mobile FAB) ----
const btnPrimBase = button.primary.size.base;
const btnPrimBaseHeight = px(resolve(btnPrimBase.height.$value));
const btnPrimBasePaddingX = px(resolve(btnPrimBase.paddingX.$value));
const btnPrimBaseGap = px(resolve(btnPrimBase.gap.$value));
const btnPrimBaseIconSize = px(resolve(btnPrimBase.iconSize.$value));
const btnPrimBaseLabelType = resolveToken(get(btnPrimBase.label.$value));
const btnPrimLg = button.primary.size.lg;
const btnPrimLgHeight = px(resolve(btnPrimLg.height.$value));
const btnPrimLgPaddingX = px(resolve(btnPrimLg.paddingX.$value));
const btnPrimLgGap = px(resolve(btnPrimLg.gap.$value));
const btnPrimLgIconSize = px(resolve(btnPrimLg.iconSize.$value));
const btnPrimLgLabelType = resolveToken(get(btnPrimLg.label.$value));
const fabShadow = resolve("shadow.md");
const fabShadowCss = `${px(fabShadow.offsetX)} ${px(fabShadow.offsetY)} ${px(fabShadow.blur)} ${px(fabShadow.spread)} ${fabShadow.color}`;

// ---- EmptyState — resolved from its own token file (built 2026-07-24 for
// exactly this prototype's three empty surfaces) ----
const esTextType = resolveToken(get(emptyState.text.$value));
const esTextColor = refPath(emptyState.textColor.$value);
const esPillBg = refPath(emptyState.pill.bg.$value);
const esPillRadius = px(resolve(emptyState.pill.radius.$value));
const esPillPaddingX = px(resolve(emptyState.pill.paddingX.$value));
const esPillPaddingY = px(resolve(emptyState.pill.paddingY.$value));
const esPadding = px(resolve(emptyState.padding.$value));
const counterOnNeutral = {
  inactiveBg: refPath(counter.onNeutral.state.inactive.bg.$value),
  inactiveLabel: refPath(counter.onNeutral.state.inactive.label.$value),
  activeBg: refPath(counter.onNeutral.state.active.bg.$value),
  activeLabel: refPath(counter.onNeutral.state.active.label.$value),
};

// ---- Chip (base, toggle) — the filter row (Unread / Expires soon / Flagged)
// replaced Sort By 2026-07-24. The Department filter is a "dropdown chip":
// Chip as the trigger (checkedOutline when a department is active — the same
// aggregate/trigger semantics Chip's own "Filters · 3" case established) +
// the same single-select Listbox panel Sort By used. A composition, not a
// new component — Select+Listbox in Chip's clothes. ----
const chipRadius = px(resolve(chip.radius.$value));
const chipBase = {
  height: px(resolve(chip.size.base.height.$value)),
  paddingX: px(resolve(chip.size.base.paddingX.$value)),
  gap: px(resolve(chip.size.base.gap.$value)),
  iconSize: px(resolve(chip.size.base.iconSize.$value)),
  label: resolveToken(chip.size.base.label),
};
const chipToggle = {
  bg: refPath(chip.toggle.default.bg.$value),
  border: refPath(chip.toggle.default.border.$value),
  text: refPath(chip.toggle.default.text.$value),
  icon: refPath(chip.toggle.default.icon.$value),
  hoverBorder: refPath(chip.toggle.hover.border.$value),
  checkedBg: refPath(chip.toggle.checked.bg.$value),
  checkedText: refPath(chip.toggle.checked.text.$value),
  checkedHoverBg: refPath(chip.toggle.checkedHover.bg.$value),
  coBg: refPath(chip.toggle.checkedOutline.bg.$value),
  coBorder: refPath(chip.toggle.checkedOutline.border.$value),
  coText: refPath(chip.toggle.checkedOutline.text.$value),
  coIcon: refPath(chip.toggle.checkedOutline.icon.$value),
};
const chipRingWidth = px(resolve(chip.focus.ringWidth.$value));
const chipRingOffset = px(resolve(chip.focus.ringOffset.$value));

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
const lbCbBox = px(resolve(listbox.checkbox.box.$value));
const lbCbRadius = px(resolve(listbox.checkbox.radius.$value));
const lbCbBorderWidth = px(resolve(listbox.checkbox.borderWidth.$value));
const lbShadow = resolveToken(listbox.shadow);
const lbShadowCss = `${px(lbShadow.offsetX)} ${px(lbShadow.offsetY)} ${px(lbShadow.blur)} ${px(lbShadow.spread)} ${lbShadow.color}`;

// ---- ThreadListItem (inbox shape, 2026-07-24 full-bleed redesign:
// flat divider-separated rows + required unread/read state pair) ----
const tliPadding = px(resolve(threadListItem.padding.$value));
const tliSubjectType = resolveToken(get(threadListItem.subject.$value));
const tliRingWidth = px(resolve(threadListItem.state.focused.ringWidth.$value));
const tliSelectedBg = refPath(threadListItem.state.selected.bg.$value);
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
const badgeNeutralTint = badgeTint("neutral");
const badgePrimaryTint = badgeTint("primary");
const badgeSuccessTint = badgeTint("success");

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
const btnPrimSmPaddingX = px(resolve(btnPrimSm.paddingX.$value));
const btnPrimSmLabelType = resolveToken(get(btnPrimSm.label.$value));
// primary disabled — the compose Send button sits disabled until the form
// is valid; resolved from Button's own state tokens
const btnPrimDisabled = {
  fill: refPath(button.primary.state.disabled.fill.$value),
  label: refPath(button.primary.state.disabled.label.$value),
  icon: refPath(button.primary.state.disabled.icon.$value),
};
const btnSecBase = button.secondary.size.base;
const btnSecHeight = px(resolve(btnSecBase.height.$value));
const btnSecPaddingX = px(resolve(btnSecBase.paddingX.$value));
const btnSecGap = px(resolve(btnSecBase.gap.$value));
const btnSecIconSize = px(resolve(btnSecBase.iconSize.$value));
const btnSecLabelType = resolveToken(get(btnSecBase.label.$value));
const btnSecSm = button.secondary.size.sm;
const btnSecSmHeight = px(resolve(btnSecSm.height.$value));
const btnSecSmPaddingX = px(resolve(btnSecSm.paddingX.$value));
const btnSecSmIconSize = px(resolve(btnSecSm.iconSize.$value));
const btnSecSmLabelType = resolveToken(get(btnSecSm.label.$value));
const btnGhostBase = button.ghost.size.base;
const btnGhostHeight = px(resolve(btnGhostBase.height.$value));
const btnGhostIconSize = px(resolve(btnGhostBase.iconSize.$value));
const btnGhostBasePaddingX = px(resolve(btnGhostBase.paddingX.$value));
const btnGhostBaseGap = px(resolve(btnGhostBase.gap.$value));
const btnGhostBaseLabelType = resolveToken(get(btnGhostBase.label.$value));
const btnGhostSm = button.ghost.size.sm;
const btnGhostSmHeight = px(resolve(btnGhostSm.height.$value));
const btnGhostSmPaddingX = px(resolve(btnGhostSm.paddingX.$value));
const btnGhostSmGap = px(resolve(btnGhostSm.gap.$value));
const btnGhostSmIconSize = px(resolve(btnGhostSm.iconSize.$value));
const btnGhostSmLabelType = resolveToken(get(btnGhostSm.label.$value));
const btnRingWidth = px(resolve(button.primary.state.focused.ringWidth.$value));
const btnRingOffset = px(resolve(button.primary.state.focused.ringOffset.$value));

// ---- Separator + THREADS label ----
const separatorColor = refPath(separator.color.$value);
const labelSmNode = get("{text-style.label-sm}");
const labelSmType = resolveToken(labelSmNode);
const labelSmExt = labelSmNode.$extensions?.["hp.design/text"] || {};
const titleXlType = resolveToken(get("{text-style.title-xl}"));
const headingLgType = resolveToken(get("{text-style.heading-lg}"));
const bodySmType = resolveToken(get("{text-style.body-sm}"));
// link-base for the search "Close" label — $extensions fetched directly from
// the node, since resolveToken() drops them (documented gap)
const linkBaseNode = get("{text-style.link-base}");
const linkBaseType = resolveToken(linkBaseNode);
const linkBaseExt = linkBaseNode.$extensions?.["hp.design/text"] || {};

// ================= app CSS =================

const componentCss = `/* ---- component recipes, resolved from each component's own token file ---- */
.tabs--segmented { display: flex; align-items: center; gap: ${segTrackPaddingApp}; background: ${cv("surface.sunken")}; border-radius: ${segTrackRadiusApp}; padding: ${segTrackPaddingApp}; }
.tab { display: inline-flex; align-items: center; justify-content: center; gap: ${tabItemGap}; border: none; background: transparent; cursor: pointer; white-space: nowrap; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; ${typoCss(tabItemLabel)} }
.tab--sm { height: ${tabSm.height}; padding: 0 ${tabSm.paddingX}; }
.tabs--segmented .tab { flex: 1; border-radius: ${segPillRadiusApp}; }
.tabs--segmented .tab:not(.tab--active):hover { background: ${cv("fill.neutralHover")}; color: ${cv("text.default")}; }
.tabs--segmented .tab--active { background: ${cv("surface.default")}; color: ${cv("text.default")}; font-weight: ${tabActiveWeight}; }

.counter { display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; font-family: ${cv("family.sans")}; font-weight: ${counterSm.label.fontWeight}; border-radius: ${counterRadius}; }
.counter[hidden] { display: none; }
.counter--sm { height: ${counterSm.height}; min-width: ${counterSm.minWidth}; padding: 0 ${counterSm.paddingX}; font-size: ${px(counterSm.label.fontSize)}; line-height: ${counterSm.label.lineHeight}; }
.counter--onNeutral.counter--inactive { background: ${cv(counterOnNeutral.inactiveBg)}; color: ${cv(counterOnNeutral.inactiveLabel)}; }
.counter--onNeutral.counter--active { background: ${cv(counterOnNeutral.activeBg)}; color: ${cv(counterOnNeutral.activeLabel)}; }

.chip { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: ${chipBase.gap}; height: ${chipBase.height}; padding: 0 ${chipBase.paddingX}; border-radius: ${chipRadius}; background: ${cv(chipToggle.bg)}; border: 1px solid ${cv(chipToggle.border)}; color: ${cv(chipToggle.text)}; cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: ${cv("family.sans")}; ${typoCss(chipBase.label)} }
.chip .chip__icon { width: ${chipBase.iconSize}; height: ${chipBase.iconSize}; color: ${cv(chipToggle.icon)}; }
.chip:not([aria-pressed="true"]):not(.chip--checked-outline):hover { border-color: ${cv(chipToggle.hoverBorder)}; }
.chip[aria-pressed="true"] { background: ${cv(chipToggle.checkedBg)}; border-color: ${cv(chipToggle.checkedBg)}; color: ${cv(chipToggle.checkedText)}; }
.chip[aria-pressed="true"]:hover { background: ${cv(chipToggle.checkedHoverBg)}; border-color: ${cv(chipToggle.checkedHoverBg)}; }
.chip--checked-outline { background: ${cv(chipToggle.coBg)}; border-color: ${cv(chipToggle.coBorder)}; color: ${cv(chipToggle.coText)}; }
.chip--checked-outline .chip__icon { color: ${cv(chipToggle.coIcon)}; }
.chip:focus-visible { outline: ${chipRingWidth} solid ${cv("border.focus")}; outline-offset: ${chipRingOffset}; }
/* dropdown-chip with a picked value can outgrow the rail — it shrinks
   instead, and the value truncates with an ellipsis (the chevron stays) */
.chip--dropdown { flex-shrink: 1; min-width: 0; max-width: 100%; }
.chip--dropdown .chip__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.search { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; border-radius: ${searchRadius}; font-family: ${cv("family.sans")}; cursor: text; }
.search--base { height: ${searchBase.height}; padding: 0 ${searchBase.paddingX}; gap: ${searchBase.gap}; }
.search--base .search__icon, .search--base .search__clear { width: ${searchBase.iconSize}; height: ${searchBase.iconSize}; }
.search__icon { flex-shrink: 0; color: ${cv("icon.default")}; }
.search__clear { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; cursor: pointer; border: none; background: none; padding: 0; }
.search__clear[hidden] { display: none; }
.search__input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: ${cv("text.default")}; font-family: ${cv("family.sans")}; ${typoCss(searchValueType)} }
.search__input::placeholder { color: ${cv("text.muted")}; }
.search:hover { border-color: ${cv("border.strong")}; }
.search:focus-within { border-color: ${cv("border.focus")}; }

.listbox { margin: 0; box-sizing: border-box; padding: ${lbPadding}; border-radius: ${lbRadius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${lbShadowCss}; font-family: ${cv("family.sans")}; min-width: 200px; }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${lbGap}; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${lbOptionGap}; padding: ${lbOptionPaddingY} ${lbOptionPaddingX}; border: none; background: none; border-radius: ${lbOptionRadius}; cursor: pointer; text-align: left; color: ${cv("text.default")}; font-family: inherit; ${typoCss(lbLabelType)} }
.listbox__option:hover { background: ${cv("fill.neutralHover")}; }
.listbox__checkmark { width: ${lbCheckmarkSize}; height: ${lbCheckmarkSize}; margin-left: auto; color: ${cv("fill.primary")}; flex-shrink: 0; display: none; }
.listbox__option--selected .listbox__checkmark { display: block; }
.listbox__cb-option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${lbOptionGap}; padding: ${lbOptionPaddingY} ${lbOptionPaddingX}; border-radius: ${lbOptionRadius}; cursor: pointer; }
.listbox__cb-option:hover { background: ${cv("fill.neutralHover")}; }
.listbox__cb-input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.listbox__cb-box { box-sizing: border-box; width: ${lbCbBox}; height: ${lbCbBox}; border-radius: ${lbCbRadius}; border: ${lbCbBorderWidth} solid ${cv("border.default")}; background: ${cv("surface.default")}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.listbox__cb-icon { width: ${px(resolve("dim.4"))}; height: ${px(resolve("dim.4"))}; display: none; }
.listbox__cb-input:checked ~ .listbox__cb-box { background: ${cv("fill.primary")}; border-color: ${cv("fill.primary")}; }
.listbox__cb-input:checked ~ .listbox__cb-box .listbox__cb-icon { display: block; color: ${cv("icon.onFill")}; }
.listbox__cb-label { color: ${cv("text.default")}; ${typoCss(lbLabelType)} }

.thread-list { display: flex; flex-direction: column; }
.thread-item-inbox { box-sizing: border-box; width: 100%; text-align: left; appearance: none; cursor: pointer; display: flex; align-items: flex-start; gap: ${inboxAvatarGap}; padding: ${tliPadding}; border: none; border-bottom: 1px solid ${cv(inboxList.divider)}; font-family: ${cv("family.sans")}; }
.thread-item-inbox__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: ${inboxLineGap}; }
.thread-item-inbox__top { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item-inbox__identity { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; ${typoCss(inboxIdentityType)} }
.thread-item-inbox__time { flex-shrink: 0; color: ${cv("text.muted")}; ${typoCss(inboxTimeType)} }
.thread-item-inbox__subject { ${typoCss(tliSubjectType)} }
.thread-item-inbox__preview-row { display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.2"))}; }
.thread-item-inbox__preview { flex: 1; min-width: 0; color: ${cv("text.muted")}; ${typoCss(inboxPreviewType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.thread-item-inbox__replied { flex-shrink: 0; width: ${px(resolve(inbox.replied.iconSize.$value))}; height: ${px(resolve(inbox.replied.iconSize.$value))}; color: ${cv(refPath(inbox.replied.color.$value))}; }
.thread-item-inbox[hidden] { display: none; }
.thread-item-inbox__flag-btn { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border: none; background: none; padding: ${px(resolve("dim.1"))}; margin: -${px(resolve("dim.1"))} 0; border-radius: ${px(resolve("radius.xs"))}; cursor: pointer; color: ${cv(refPath(inbox.flag.color.$value))}; }
.thread-item-inbox__flag-btn svg { width: ${px(resolve(inbox.flag.iconSize.$value))}; height: ${px(resolve(inbox.flag.iconSize.$value))}; display: block; }
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
.thread-item-inbox:focus-visible { outline: ${tliRingWidth} solid ${cv("border.focus")}; outline-offset: -${tliRingWidth}; }
.thread-item-inbox--selected { background: ${cv(tliSelectedBg)}; }

.badge { box-sizing: border-box; display: inline-flex; align-items: center; border-radius: ${badgeRadius}; white-space: nowrap; }
.badge--sm { height: ${badgeHeight}; padding: 0 ${badgePaddingX}; ${typoCss(badgeLabelType)} }
.badge--role-warning { background: ${cv(badgeWarningTint.bg)}; color: ${cv(badgeWarningTint.text)}; }
.badge--role-danger { background: ${cv(badgeDangerTint.bg)}; color: ${cv(badgeDangerTint.text)}; }
.badge--role-neutral { background: ${cv(badgeNeutralTint.bg)}; color: ${cv(badgeNeutralTint.text)}; }
.badge--role-primary { background: ${cv(badgePrimaryTint.bg)}; color: ${cv(badgePrimaryTint.text)}; }
.badge--role-success { background: ${cv(badgeSuccessTint.bg)}; color: ${cv(badgeSuccessTint.text)}; }

.avatar { box-sizing: border-box; position: relative; display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; overflow: hidden; border-radius: ${avatarRadius}; width: ${avatarDiameter}; height: ${avatarDiameter}; border: 1px solid ${cv("border.default")}; font-family: ${cv("family.sans")}; user-select: none; }
.avatar__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar__initials { text-transform: uppercase; ${typoCss(avatarInitialsType)} }
.avatar--sm { width: ${avatarSmDiameter}; height: ${avatarSmDiameter}; }
.avatar--sm .avatar__initials { ${typoCss(avatarSmInitialsType)} }
${usedHues.map((h) => `.avatar--${h} { background: ${cv(`avatar.${h}.bg`)}; }\n.avatar--${h} .avatar__initials { color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}

.message { display: flex; flex-direction: column; gap: ${msgGap}; font-family: ${cv("family.sans")}; max-width: 640px; }
.message__sender { display: flex; align-items: center; gap: ${msgSenderGap}; }
.message__sender-line { margin: 0; }
.message__name { color: ${cv(msgNameColor)}; ${typoCss(msgNameType)} }
.message__meta { color: ${cv("text.muted")}; ${typoCss(msgMetaType)} }
.message--card .message__body { background: ${cv(msgCard.bg)}; border: 1px solid ${cv(msgCard.border)}; border-radius: ${msgCard.radius}; padding: ${msgCard.padding}; }
.message__body { display: flex; flex-direction: column; gap: ${msgBodyGap}; }
.message__body p { margin: 0; color: ${cv("text.default")}; ${typoCss(msgParagraphType)} }
.message__body strong { font-weight: ${msgStrongWeight}; }
.message__body ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: ${msgListGap}; }
.message__body li { padding-left: ${msgListIndent}; position: relative; color: ${cv("text.default")}; ${typoCss(msgParagraphType)} }
.message__body li::before { content: "•"; position: absolute; left: ${px(resolve("dim.1_5"))}; color: ${cv("text.muted")}; }
.message__body a { color: ${cv("text.primary")}; ${typoCss(msgLinkType)} text-decoration: ${msgLinkExtensions.textDecoration || "none"}; }
/* an Attachment's done shape IS an <a download> — keep the body-link
   underline/color off it, its own title/description styles apply instead */
.message__body a.attachment { text-decoration: none; }
.message__attachments { display: flex; flex-direction: column; gap: ${msgAttachmentsGap}; }
.message__cta { margin-top: ${msgCtaMarginTop}; align-self: flex-start; }

.attachment { box-sizing: border-box; display: flex; align-items: center; gap: ${attGap}; padding: ${attPadding}; border-radius: ${attRadius}; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; max-width: 320px; text-decoration: none; }
.attachment__media { flex-shrink: 0; width: ${attMediaSize}; height: ${attMediaSize}; border-radius: ${attMediaRadius}; display: flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; }
.attachment__icon { width: ${attIconSize}; height: ${attIconSize}; color: ${cv("icon.secondary")}; }
.attachment__content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.attachment__title { margin: 0; color: ${cv("text.default")}; ${typoCss(attTitleType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.attachment__description { margin: 0; color: ${cv("text.muted")}; ${typoCss(attDescType)} }

.bubble-row { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; max-width: 75%; font-family: ${cv("family.sans")}; }
.bubble-row--self { align-self: flex-end; align-items: flex-end; }
.bubble-row--other { align-self: flex-start; align-items: flex-start; }
.bubble-sender { display: flex; align-items: center; gap: ${msgSenderGap}; }
.bubble-sender__text { margin: 0; }
.bubble-sender__name { color: ${cv(msgNameColor)}; ${typoCss(msgNameType)} }
.bubble-sender__meta { color: ${cv("text.muted")}; ${typoCss(msgMetaType)} }
.bubble { box-sizing: border-box; display: flex; flex-direction: column; gap: ${bubGap}; padding: ${bubPaddingY} ${bubPaddingX}; border-radius: ${bubRadius}; }
.bubble p { margin: 0; ${typoCss(bubTextType)} white-space: pre-wrap; } /* the composer's Shift+Enter produces real newlines */
.bubble--self.bubble--tint { background: ${cv("bg.primary")}; color: ${cv("text.default")}; }
.bubble--other { background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; color: ${cv("text.default")}; }

.composer { display: flex; flex-direction: column; gap: ${compFieldGap}; font-family: ${cv("family.sans")}; }
.composer__field { display: flex; align-items: center; gap: ${compFieldGap}; padding: ${compFieldPadding}; border-radius: ${compRadius}; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; }
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
.btn--secondary.btn--sm { height: ${btnSecSmHeight}; padding: 0 ${btnSecSmPaddingX}; ${typoCss(btnSecSmLabelType)} }
.btn--secondary.btn--sm .btn__icon { width: ${btnSecSmIconSize}; height: ${btnSecSmIconSize}; }
.btn--secondary.btn--sm.btn--icon-only { width: ${btnSecSmHeight}; padding: 0; }
.btn--ghost { background: transparent; color: ${cv("text.secondary")}; }
.btn--ghost .btn__icon { color: ${cv("icon.secondary")}; }
.btn--ghost:hover { background: ${cv("fill.neutralHover")}; }
.btn--ghost:active { background: ${cv("fill.neutralActive")}; }
.btn--ghost.btn--base { height: ${btnGhostHeight}; padding: 0 ${btnGhostBasePaddingX}; gap: ${btnGhostBaseGap}; ${typoCss(btnGhostBaseLabelType)} }
.btn--ghost.btn--base.btn--icon-only { width: ${btnGhostHeight}; height: ${btnGhostHeight}; padding: 0; }
.btn--ghost.btn--base.btn--icon-only .btn__icon { width: ${btnGhostIconSize}; height: ${btnGhostIconSize}; }
.btn--ghost.btn--sm { height: ${btnGhostSmHeight}; padding: 0 ${btnGhostSmPaddingX}; gap: ${btnGhostSmGap}; ${typoCss(btnGhostSmLabelType)} }
.btn--ghost.btn--sm .btn__icon { width: ${btnGhostSmIconSize}; height: ${btnGhostSmIconSize}; }

.separator { border: none; border-top: 1px solid ${cv(separatorColor)}; margin: 0; }

.btn--primary.btn--base { height: ${btnPrimBaseHeight}; padding: 0 ${btnPrimBasePaddingX}; gap: ${btnPrimBaseGap}; ${typoCss(btnPrimBaseLabelType)} }
.btn--primary.btn--base .btn__icon { width: ${btnPrimBaseIconSize}; height: ${btnPrimBaseIconSize}; }
.btn--primary.btn--sm { height: ${btnPrimSmHeight}; padding: 0 ${btnPrimSmPaddingX}; ${typoCss(btnPrimSmLabelType)} }
.btn--primary:disabled { background: ${cv(btnPrimDisabled.fill)}; color: ${cv(btnPrimDisabled.label)}; cursor: default; }
.btn--primary:disabled:hover, .btn--primary:disabled:active { background: ${cv(btnPrimDisabled.fill)}; }
.btn--primary:disabled .btn__icon { color: ${cv(btnPrimDisabled.icon)}; }
/* danger action — the same fill.danger recipe Modal's own footer actions
   use (button.tokens.json has no danger variant; this is Modal's recipe) */
.btn--danger { background: ${cv("fill.danger")}; color: ${cv("text.onFill")}; }
.btn--danger:hover { background: ${cv("fill.dangerHover")}; }
.btn--danger.btn--base { height: ${btnPrimBaseHeight}; padding: 0 ${btnPrimBasePaddingX}; gap: ${btnPrimBaseGap}; ${typoCss(btnPrimBaseLabelType)} }
.btn--primary.btn--lg { height: ${btnPrimLgHeight}; padding: 0 ${btnPrimLgPaddingX}; gap: ${btnPrimLgGap}; ${typoCss(btnPrimLgLabelType)} }
.btn--primary.btn--lg .btn__icon { width: ${btnPrimLgIconSize}; height: ${btnPrimLgIconSize}; }
.btn--ghost.btn--sm.btn--icon-only { width: ${btnGhostSmHeight}; padding: 0; }

.select { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; border-radius: ${selectRadius}; font-family: ${cv("family.sans")}; cursor: pointer; text-align: left; }
.select--base { height: ${selectBase.height}; padding: 0 ${selectBase.paddingX}; gap: ${selectBase.gap}; }
.select--base .select__chevron { width: ${selectBase.iconSize}; height: ${selectBase.iconSize}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; }
.select__stack { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; gap: ${selectBase.labelGap}; }
.select__label { color: ${cv("text.muted")}; ${typoCss(selectBase.label)} }
.select__value { color: ${cv("text.default")}; ${typoCss(selectBase.value)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.select:hover { border-color: ${cv("border.strong")}; }
.select:focus-visible { outline: none; border-color: ${cv("border.focus")}; }

/* compose dialog — one native <dialog>, two responsive shells around the
   same content. Under the 768px split breakpoint it is a full-screen
   bottom-sheet takeover (the keyboard owns half the viewport on a phone —
   Cancel/Send live in the header, always within reach; slide-up entry);
   from 768px it is Modal's centered recipe. The split-view width is a
   560px composition literal, not modal.width's 384px — the recipient
   list rows need the room (same layout-literal call as the textarea
   min-height). Subject/Message carry Input's recipe including its
   floating label (resting = placeholder only; focus/populated float the
   12px label in — Input's own state model). */
.mc-compose { border: none; padding: 0; background: ${cv(mdBg)}; font-family: ${cv("family.sans")}; }
.mc-compose:focus, .mc-compose:focus-visible { outline: none; } /* Chrome focuses the dialog itself on showModal() — a ring around the whole surface reads broken */
.mc-compose[open] { display: flex; flex-direction: column; }
.mc-compose::backdrop { background: ${cv(mdOverlay)}; }
.mc-compose__header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; border-bottom: 1px solid ${cv(mdDivider)}; }
.mc-compose__title { margin: 0; color: ${cv(mdTitleColor)}; ${typoCss(mdTitleType)} }
/* mobile-first compact spacing (explicit user call — the takeover felt too
   airy); split views restore Modal's own padding/gap below */
.mc-compose__body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.4"))}; }
.mc-compose__body .select { display: flex; width: 100%; flex-shrink: 0; }
/* Subject / Message — Input's anatomy on real editable controls */
.mc-field { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: ${inputLabelGap}; min-height: ${inputHeight}; padding: ${px(resolve("dim.1_5"))} ${inputPaddingX}; border: 1px solid ${cv("border.default")}; border-radius: ${inputRadius}; background: ${cv("surface.dim")}; cursor: text; flex-shrink: 0; }
.mc-field:hover { border-color: ${cv("border.strong")}; }
.mc-field:focus-within { border-color: ${cv("border.focus")}; }
.mc-field__label { display: none; color: ${cv(inputPopulatedLabelColor)}; ${typoCss(inputLabelType)} }
.mc-field--floated .mc-field__label { display: block; }
.mc-field:focus-within .mc-field__label { color: ${cv(inputFocusLabelColor)}; }
.mc-field__control { border: none; outline: none; background: transparent; padding: 0; width: 100%; color: ${cv("text.default")}; ${typoCss(inputValueType)} font-family: ${cv("family.sans")}; }
.mc-field__control::placeholder { color: ${cv("text.muted")}; }
.mc-field--area { min-height: 140px; justify-content: flex-start; }
.mc-field--area .mc-field__control { resize: none; flex: 1; min-height: 104px; }
/* To — a second Select, always present, disabled until a department is
   chosen (Select's own disabled state tokens, resolved). Its Listbox
   popover holds the chosen department's allowed recipients per its policy:
   the department itself first (department-only / "both"), then members —
   real Avatar + name/role rows, away members disabled with a neutral away
   Badge. Same trigger + popover composition as the Department select. */
/* Select resting state — Input's own float model: before a value exists the
   trigger shows ONLY the placeholder (the field's name) at value size; the
   12px label appears only once populated. The permanent label+placeholder
   stack read as a wireframe. */
.select--resting .select__label { display: none; }
.select--resting .select__value { color: ${cv(refPath(select.state.default.placeholder.$value))}; }
.select:disabled { background: ${cv(selectDisabled.bg)}; border-color: ${cv(selectDisabled.border)}; cursor: default; }
.select:disabled .select__label { color: ${cv(selectDisabled.label)}; }
.select:disabled .select__value { color: ${cv(selectDisabled.value)}; }
.select:disabled .select__chevron { color: ${cv(selectDisabled.chevron)}; }
#mc-compose-to-lb .listbox__list[hidden] { display: none; }
.mc-to-option { align-items: center; }
.mc-to-option:disabled { cursor: default; }
.mc-to-option:disabled:hover { background: transparent; }
.mc-to-option__stack { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; text-align: left; }
.mc-to-option__name { color: ${cv("text.default")}; ${typoCss(lbLabelType)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-to-option__role { color: ${cv("text.muted")}; ${typoCss(msgMetaType)} }
.mc-to-option:disabled .mc-to-option__name, .mc-to-option:disabled .mc-to-option__role { color: ${cv("text.disabled")}; }
.mc-to-option:disabled .avatar { filter: grayscale(1); opacity: 0.6; }
.mc-to-option .badge { flex-shrink: 0; }
.mc-compose__hint { color: ${cv("text.muted")}; ${typoCss(msgMetaType)} }
.mc-compose__hint[hidden] { display: none; }
/* compose attachments — the Attachment component's idle shape (a div with a
   real remove button), added via the ghost Attach-file button; on Send the
   files render in the new thread as Attachment's done shape in the Bubble */
.mc-compose__atts { display: flex; flex-direction: column; gap: ${msgAttachmentsGap}; flex-shrink: 0; }
.mc-compose__atts[hidden] { display: none; }
.mc-compose__att { max-width: none; }
.mc-compose__att .attachment__content { flex: 1; min-width: 0; }
.mc-att-remove { margin-left: auto; flex-shrink: 0; }
.mc-compose__attach-btn { align-self: flex-start; flex-shrink: 0; }
.mc-compose__footer { flex-shrink: 0; display: flex; justify-content: flex-end; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.4"))} ${mdPadding}; border-top: 1px solid ${cv(mdDivider)}; }
/* fake keyboard — docs-only scaffolding, NOT a DS component (a device mock,
   same non-tokenized call as the viewer's phone frame): docked under the
   body while a text field is focused on the takeover, so the layout's
   reason (Send in the header, above the keyboard) is visible in the
   prototype. Neutral token colours; key geometry is literal. */
.mc-kbd { display: none; }
@media (max-width: 767px) {
  .mc-compose { position: fixed; inset: 0; margin: 0; width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
  .mc-compose__close, .mc-compose__footer { display: none; }
  .mc-compose__title { flex: 1; text-align: center; }
  .mc-compose[open] { transform: translateY(0); transition: transform 0.25s ease; }
  @starting-style { .mc-compose[open] { transform: translateY(100vh); } }
  .mc-compose--kbd .mc-kbd, .mc-thread--kbd .mc-kbd { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; padding: 8px 3px 20px; background: ${cv("surface.sunken")}; border-top: 1px solid ${cv("border.default")}; }
  .mc-kbd__row { display: flex; gap: 5px; justify-content: center; }
  .mc-kbd__key { flex: 1; max-width: 34px; height: 40px; display: inline-flex; align-items: center; justify-content: center; background: ${cv("surface.default")}; border-radius: 6px; box-shadow: 0 1px 0 ${cv("border.strong")}; color: ${cv("text.default")}; font-size: 15px; }
  .mc-kbd__key--wide { max-width: 44px; color: ${cv("text.secondary")}; font-size: 12px; }
  .mc-kbd__key--space { flex: 5; max-width: none; }
  .mc-kbd__key--return { flex: 2; max-width: none; background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; font-size: 13px; }
}
@media (min-width: 768px) {
  .mc-compose { width: min(560px, calc(100vw - ${px(resolve("dim.8"))})); max-height: calc(100dvh - ${px(resolve("dim.16"))}); border-radius: ${mdRadius}; box-shadow: ${mdShadowCss}; }
  .mc-compose__cancel-m, .mc-compose__send-m { display: none; }
  .mc-compose__header { padding: ${px(resolve("dim.4"))} ${mdPadding}; }
  .mc-compose__body { padding: ${mdPadding}; gap: ${mdGap}; }
  .mc-compose[open] { opacity: 1; transform: translateY(0); transition: opacity 0.18s ease, transform 0.18s ease; }
  @starting-style { .mc-compose[open] { opacity: 0; transform: translateY(8px); } }
}

/* discard confirmation — modal.alert's behavioral variant: identical Modal
   surface, but no header close, Escape and outside-click disabled — the
   footer actions are the only way out. Danger = Modal's fill.danger recipe. */
.mc-confirm { border: none; padding: 0; width: ${mdWidth}; max-width: calc(100vw - ${px(resolve("dim.8"))}); border-radius: ${mdRadius}; background: ${cv(mdBg)}; box-shadow: ${mdShadowCss}; font-family: ${cv("family.sans")}; }
.mc-confirm::backdrop { background: ${cv(mdOverlay)}; }
.mc-confirm__body { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; padding: ${mdPadding}; }
.mc-confirm__title { margin: 0; color: ${cv(mdTitleColor)}; ${typoCss(mdTitleType)} }
.mc-confirm__text { margin: 0; color: ${cv(mdBodyColor)}; ${typoCss(mdBodyType)} }
.mc-confirm__footer { display: flex; justify-content: flex-end; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.4"))} ${mdPadding}; border-top: 1px solid ${cv(mdDivider)}; }
.mc-confirm[open] { opacity: 1; transform: translateY(0); transition: opacity 0.18s ease, transform 0.18s ease; }
@starting-style {
  .mc-confirm[open] { opacity: 0; transform: translateY(8px); }
}

.empty-state { box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: ${esPadding}; font-family: ${cv("family.sans")}; }
.empty-state__text { background: ${cv(esPillBg)}; color: ${cv(esTextColor)}; border-radius: ${esPillRadius}; padding: ${esPillPaddingY} ${esPillPaddingX}; ${typoCss(esTextType)} text-align: center; }

.toast { position: fixed; inset: auto; top: ${toastOffsetTop}; left: 50%; transform: translateX(-50%); margin: 0; box-sizing: border-box; display: flex; align-items: center; gap: ${toastGap}; padding: ${toastPaddingY} ${toastPaddingX}; border-radius: ${toastRadius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${toastShadowCss}; font-family: ${cv("family.sans")}; }
.toast__icon { flex-shrink: 0; width: ${toastIconSize}; height: ${toastIconSize}; }
.toast__label { color: ${cv(toastLabelColor)}; ${typoCss(toastLabelType)} white-space: nowrap; }
.toast--success .toast__icon { color: ${cv(toastSuccessIconPath)}; }
.toast:popover-open { opacity: 1; translate: 0 0; transition: opacity 0.18s ease, translate 0.18s ease; }
@starting-style {
  .toast:popover-open { opacity: 0; translate: 0 -8px; }
}`;

// ---- the mc-* composition layer: app shell, panes, breakpoints — mobile-first ----
const layoutCss = `/* ---- mc-* composition layer (app shell) — mobile-first, 768px / 1024px structural breakpoints (not tokenized, same call as Grid) ---- */
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; color: ${cv("text.default")}; }
.mc { height: 100dvh; display: flex; flex-direction: column; }
.mc__topbar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
/* New message entry point: floating pill over the list on mobile, a regular
   topbar button on every split view (>=768) */
.mc-topbar-new { display: none; }
.mc-fab { position: absolute; right: ${px(resolve("dim.4"))}; bottom: ${px(resolve("dim.4"))}; border-radius: ${px(resolve("radius.full"))}; box-shadow: ${fabShadowCss}; transition: padding 0.25s ease, gap 0.25s ease; }
/* extended-FAB convention: the label collapses away while the list scrolls
   down and comes back on any scroll up or near the top. NO explicit width
   anywhere — width isn't animatable from auto, so the collapsed circle's
   size must EMERGE from the animated properties (label max-width → 0 +
   padding/gap tween): collapsed side padding = (height − iconSize) / 2,
   which lands the pill at exactly Button's icon-only width-equals-height
   circle at the end of the tween. */
.mc-fab__label { max-width: 130px; opacity: 1; overflow: hidden; white-space: nowrap; transition: max-width 0.25s ease, opacity 0.2s ease; }
.mc-fab.mc-fab--collapsed { padding: 0 ${(parseInt(btnPrimLgHeight) - parseInt(btnPrimLgIconSize)) / 2}px; gap: 0; }
.mc-fab.mc-fab--collapsed .mc-fab__label { max-width: 0; opacity: 0; }
/* on mobile an open thread takes the whole screen — the app's own
   "Message Center" topbar leaves, the thread bar (Back …) is the header */
.mc--thread-open .mc__topbar { display: none; }
.mc__topbar h1 { margin: 0; color: ${cv("text.default")}; ${typoCss(titleXlType)} }
.mc__body { flex: 1; display: flex; min-height: 0; }

.mc__rail { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.mc__reading { display: none; flex: 1; min-width: 0; flex-direction: column; min-height: 0; }
.mc--thread-open .mc__rail { display: none; }
.mc--thread-open .mc__reading { display: flex; }

.mc-rail__topbar { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} 0; }
.mc-rail__topbar .tabs--segmented { flex: 1; }
.mc-rail__topbar .search { flex: 1; display: none; }
.mc--search-open .mc-rail__topbar .tabs--segmented, .mc--search-open .mc-search-open-btn { display: none; }
.mc--search-open .mc-rail__topbar .search { display: flex; }
/* with the chips row gone in search mode, the topbar provides the breathing
   room below the field itself */
.mc--search-open .mc-rail__topbar { padding-bottom: ${px(resolve("dim.3"))}; }
.mc-search-close { display: none; flex-shrink: 0; border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; font-family: ${cv("family.sans")}; ${typoCss(linkBaseType)}${linkBaseExt.textDecoration ? ` text-decoration: ${linkBaseExt.textDecoration};` : ""} }
.mc--search-open .mc-search-close { display: inline-flex; }
.mc-rail__chips { display: flex; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; }
/* One filter surface at EVERY width (2026-07-29 — the inline toggle chips
   are gone entirely): the "Filters · N" dropdown-chip + the Department chip.
   Unread / Expires soon are Inbox-only, so Archived hides those OPTIONS
   inside the listbox; search is global, so the whole row leaves while open. */
.mc.mc--archived #mc-filters-listbox [data-filter-option="unread"], .mc.mc--archived #mc-filters-listbox [data-filter-option="expires"] { display: none; }
.mc--search-open .mc-rail__chips { display: none; }
.mc-rail__count { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.mc-count { padding: 0 ${px(resolve("dim.4"))}; color: ${cv("text.muted")}; ${typoCss(labelSmType)}${labelSmExt.textTransform ? ` text-transform: ${labelSmExt.textTransform};` : ""}${labelSmExt.letterSpacing ? ` letter-spacing: ${labelSmExt.letterSpacing};` : ""} }
/* one shared scroll container for both lists — during a search they render
   stacked as a single combined result set, not two half-height panes each
   with its own scrollbar */
.mc-rail__lists { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; }
/* mobile: room to scroll the last row clear of the floating New message pill */
.mc-rail__lists { padding-bottom: 72px; }
.mc-list { display: flex; flex-direction: column; }
.mc-list[hidden] { display: none; }
.mc-rail__count[hidden] { display: none; }
.mc-rail__empty { flex: 1; display: flex; }
.mc-rail__empty[hidden] { display: none; }

.mc-empty { flex: 1; display: flex; }
.mc-empty[hidden] { display: none; }
.mc-thread { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.mc-thread[hidden] { display: none; }
/* mobile-first thread header: [Back … actions] row, then the subject, then
   the Department/Institution tag pills; the bar's own bottom border is the
   separator under the tags. Desktop reflows via order — back hides, subject
   shares the row with the actions. */
.mc-thread__bar { flex-shrink: 0; display: flex; flex-wrap: wrap; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.mc-thread__back { order: 1; }
.mc-thread__actions { order: 2; margin-left: auto; display: flex; gap: ${px(resolve("dim.2"))}; }
.mc-thread__subject { order: 3; width: 100%; min-width: 0; margin: 0; color: ${cv("text.default")}; ${typoCss(headingLgType)} }
/* department · institution as one plain 12px line (pills lasted one round —
   too much visual weight for what is quiet context), followed by real Badges
   (base size) for the thread's Expires and Archived states. The row wraps
   when tight — never a horizontal scroll that would clip a badge mid-word */
.mc-thread__tags { order: 4; width: 100%; display: flex; align-items: center; flex-wrap: wrap; gap: ${px(resolve("dim.1_5"))} ${px(resolve("dim.2"))}; }
.mc-thread__meta-line { color: ${cv("text.secondary")}; ${typoCss(bodySmType)} }
.mc-thread__scroll { flex: 1; overflow-y: auto; padding: ${px(resolve("dim.4"))}; display: flex; flex-direction: column; gap: ${px(resolve("dim.6"))}; }
.mc-thread__composer { flex-shrink: 0; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} ${px(resolve("dim.4"))}; }
/* in-thread composer upgrades: pre-send attachments stack above the field
   (Attachment idle shape, same as the compose dialog); the field itself is a
   1-row textarea auto-growing to ~5 lines (JS caps at 120px), icons pinned
   to the bottom edge as it grows */
.composer__atts { display: flex; flex-direction: column; gap: ${msgAttachmentsGap}; }
.composer__atts[hidden] { display: none; }
.mc-composer .composer__field { align-items: flex-end; }
.mc-composer .composer__input { display: block; resize: none; max-height: 120px; overflow-y: auto; }
/* replies closed: the Composer's slot holds EmptyState's quiet pill instead */
.mc-thread__composer--closed { display: flex; justify-content: center; }

/* search-scope badges (Inbox/Archived) — declared here, after the component
   recipes, so their display:none outranks .badge's own display in the
   cascade; visible only while a search query is active */
.thread-item-inbox__expires .thread-item-inbox__scope { display: none; }
.mc--searching .thread-item-inbox__expires .thread-item-inbox__scope { display: inline-flex; }
.thread-item-inbox__expires--scope-only { display: none; }
.mc--searching .thread-item-inbox__expires--scope-only { display: flex; }

@media (min-width: 768px) {
  .mc__rail, .mc--thread-open .mc__rail { display: flex; flex: none; width: 320px; border-right: 1px solid ${cv("border.default")}; }
  .mc__reading { display: flex; }
  .mc--thread-open .mc__topbar { display: flex; }
  .mc-topbar-new { display: inline-flex; }
  .mc-fab { display: none; }
  .mc-rail__lists { padding-bottom: 0; }
  .mc-thread__back { display: none; }
  /* subject shares the row with the actions on every split view — a long
     subject simply wraps to a second line instead of dropping below the
     buttons (an actions-only top row read as a hole on the tablet) */
  .mc-thread__subject { order: 1; width: auto; flex: 1; }
  .mc-thread__actions { margin-left: 0; }
}
@media (min-width: 1024px) {
  .mc__rail, .mc--thread-open .mc__rail { width: 380px; }
  .mc__topbar { padding: ${px(resolve("dim.4"))} ${px(resolve("dim.6"))}; }
  .mc-thread__bar { padding-left: ${px(resolve("dim.6"))}; padding-right: ${px(resolve("dim.6"))}; }
  .mc-thread__scroll { padding: ${px(resolve("dim.6"))}; }
  .mc-thread__composer { padding: ${px(resolve("dim.4"))} ${px(resolve("dim.6"))} ${px(resolve("dim.6"))}; }
}`;

const appCss = `${rootVars}

${componentCss}

${layoutCss}`;

// ================= markup builders =================

// Real photos for the three recurring people (assets/avatars/, 128px) —
// Avatar's own photo tier (top of its photo → initials → icon fallback
// chain); departments and everyone else stay on the initials tier.
const AVATAR_PHOTOS = {
  "Alexander Robinson": "../../assets/avatars/alexander-robinson.jpg",
  "Betty Locherty": "../../assets/avatars/betty-locherty.jpg",
  "Ava Robinson": "../../assets/avatars/ava-robinson.jpg",
};
function avatarMarkup(name, size = "base") {
  const hue = hueOf(name);
  const photo = AVATAR_PHOTOS[name];
  const inner = photo
    ? `<img class="avatar__img" src="${photo}" alt="" />`
    : `<span class="avatar__initials">${initialsOf(name)}</span>`;
  return `<span class="avatar avatar--${hue}${size === "sm" ? " avatar--sm" : ""}" role="img" aria-label="${name}">${inner}</span>`;
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
    id: "winter", archived: false, unread: true, replies: true, replied: true,
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
    id: "registrar", archived: false, sender: "Betty Locherty", replies: true,
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
    id: "fafsa", archived: false, sender: "Betty Locherty", replies: true,
    department: "Financial Aid", date: "07/20/2026", subject: "FAFSA Verification Documents",
    preview: "Please upload the requested verification documents before the deadline.",
    expires: { label: "Expires 08/01/2026", role: "warning" },
    meta: { Regarding: "Verification", Department: "Financial Aid", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Betty Locherty", "Jul 20, 10:05 AM", `<p>Your FAFSA has been selected for <strong>verification</strong>. Please upload the requested documents before <strong>August 1, 2026</strong> — this thread expires soon.</p>`),
    ],
  },
  {
    id: "advising-appt", archived: false, sender: "Alexander Robinson",
    department: "Academic Advising", date: "07/05/2026", subject: "Advising Appointment Confirmation",
    preview: "Your appointment window has passed — please rebook if still needed.",
    expires: { label: "Expired 07/10/2026", role: "danger" },
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Alexander Robinson", "Jul 05, 9:30 AM", `<p>This is a confirmation for your advising appointment window. The window has now <strong>passed</strong> — please start a new thread to rebook if you still need an appointment.</p>`),
    ],
  },
  {
    id: "transcript-ready", archived: false, unread: true,
    department: "Office of the Registrar", date: "07/18/2026", subject: "Transcript Ready for Pickup",
    preview: "Your official transcript is ready at the Registrar's front desk.",
    expires: { label: "Expires 12/31/2027", role: "neutral" },
    meta: { Department: "Office of the Registrar", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      messageMarkup("Betty Locherty", "Jul 18, 3:40 PM", `<p>Your official transcript is ready for pickup at the Registrar's front desk. Bring a <strong>photo ID</strong>. This notice stays available until the end of 2027 — no rush.</p>`),
    ],
  },
  {
    id: "waiver", archived: false, sender: "Ava Robinson", replies: true, replied: true,
    department: "English Dept", date: "03/02/2024", subject: "Requirement Waiver Request",
    preview: "Please submit your waiver request to Enrollment Services.",
    meta: { Department: "English Dept", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Ava Robinson", meta: "Mar 02, 1:05 PM", text: "Please submit your waiver request to Enrollment Services." }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Mar 02, 1:08 PM", text: "Thanks for letting me know. I will submit it today.", attachmentHtml: attachmentMarkup("Photo-ID.jpg", "1.2 MB") }),
    ],
  },
  {
    id: "pell", archived: false, flagged: true,
    department: "Financial Aid", date: "03/01/2024", subject: "Close to Pell Lifetime Limits",
    preview: "You are approaching the lifetime limit of Federal Pell Grant.",
    expires: { label: "Expires 03/01/2027", role: "neutral" },
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
    id: "study", archived: true, sender: "Alexander Robinson", replies: true, replied: true,
    department: "Academic Advising", date: "06/30/2025", subject: "Study Session",
    preview: "That works for me — I can make that time.",
    meta: { Department: "Academic Advising", Status: "Closed", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Alexander Robinson", meta: "Jun 30, 3:12 PM", text: "We are hosting a study session on Thursday at 4 PM in the library, room 204." }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jun 30, 3:20 PM", text: "That works for me — I can make that time." }),
    ],
  },
];

// Row is a <div role="button"> — it nests a real flag toggle <button>, and a
// real button can't nest another (same resolution as Attachment's idle shape).
// The scope badge (Inbox/Archived) is always in the DOM, shown via CSS only
// while searching, when both lists render as one combined result set.
function rowMarkup(t, idx) {
  const badges = [
    t.replies ? `<span class="badge badge--sm badge--role-success">Replies open</span>` : "",
    t.expires ? `<span class="badge badge--sm badge--role-${t.expires.role}">${t.expires.label}</span>` : "",
    `<span class="badge badge--sm badge--role-${t.archived ? "neutral" : "primary"} thread-item-inbox__scope">${t.archived ? "Archived" : "Inbox"}</span>`,
  ].join("");
  const identity = t.sender ? `${t.sender} · ${t.department}` : t.department;
  return `<div class="thread-item-inbox thread-item-inbox--${t.unread ? "unread" : "read"}" role="button" tabindex="0" data-thread="${t.id}" data-idx="${idx}" data-subject="${esc(t.subject)}" data-department="${esc(t.department)}"${t.expires ? ` data-expires="${t.expires.role}"` : ""}>
        ${avatarMarkup(t.sender || t.department, "sm")}
        <div class="thread-item-inbox__main">
          <div class="thread-item-inbox__top">
            <span class="thread-item-inbox__identity">${identity}</span>
            <span class="thread-item-inbox__time">${t.date}</span>
          </div>
          <div class="thread-item-inbox__subject">${t.subject}</div>
          <div class="thread-item-inbox__preview-row">
            <span class="thread-item-inbox__preview">${t.preview}</span>
            ${t.replied && !t.unread ? iconReplied : ""}
            <button class="thread-item-inbox__flag-btn" type="button" aria-pressed="${t.flagged ? "true" : "false"}" aria-label="Flag thread">${iconFlagOutlined}${iconFlagFilled}</button>
          </div>
          <div class="thread-item-inbox__expires${t.expires || t.replies ? "" : " thread-item-inbox__expires--scope-only"}">${badges}</div>
        </div>
      </div>`;
}

function threadPane(t) {
  const archiveBtn = t.archived ? "" : `<button class="btn btn--secondary btn--sm mc-archive" type="button" data-thread="${t.id}">Archive</button>`;
  return `<article class="mc-thread" data-thread="${t.id}" hidden>
        <header class="mc-thread__bar">
          <button class="btn btn--ghost btn--sm mc-thread__back" type="button">${iconBack}Back</button>
          <div class="mc-thread__actions">
            ${archiveBtn}
            <button class="btn btn--secondary btn--sm btn--icon-only mc-print" type="button" aria-label="Print thread">${iconPrint}</button>
          </div>
          <h2 class="mc-thread__subject">${t.subject}</h2>
          <div class="mc-thread__tags">
            <span class="mc-thread__meta-line">${t.department} · ${t.meta.Institution}</span>
            ${t.expires ? `<span class="badge badge--sm badge--role-${t.expires.role}">${t.expires.label}</span>` : ""}
            ${t.archived ? `<span class="badge badge--sm badge--role-neutral">Archived</span>` : ""}
          </div>
        </header>
        <div class="mc-thread__scroll">
          ${t.content.join("\n          ")}
        </div>
        <footer class="mc-thread__composer${t.replies ? "" : " mc-thread__composer--closed"}">
          ${t.replies
            ? `<form class="composer composer--simple mc-composer" data-thread="${t.id}">
            <div class="composer__atts" hidden></div>
            <div class="composer__field">
              <textarea class="composer__input" rows="1" placeholder="Write a message..." aria-label="Write a message"></textarea>
              <button type="button" class="composer__icon-btn mc-composer-attach" aria-label="Attach file">${iconAttach}</button>
              <button type="submit" class="btn btn--primary btn--sm btn--icon-only" aria-label="Send">${iconSend}</button>
            </div>
          </form>`
            : `<span class="empty-state__text">This thread doesn't accept replies</span>`}
        </footer>
        ${t.replies ? composeKbd : ""}
      </article>`;
}

const inboxThreads = threads.filter((t) => !t.archived);
const archivedThreads = threads.filter((t) => t.archived);

// Department filter options — single-select: "All departments" or exactly one.
const departments = [...new Set(threads.map((t) => t.department))];

// ---- compose recipient policies — the Department Settings model: an admin
// decides whether students may start a conversation with the department
// only, with individual members only, or with both; members additionally
// carry their own availability. The student never sees the policy itself —
// only what the To block renders (nothing / a member list / department +
// members). ----
const composePolicies = {
  "Office of the Registrar": { policy: "department" },
  "Academic Advising": {
    policy: "both",
    members: [
      { name: "Alexander Robinson", role: "Academic Advisor" },
      { name: "Maria Santos", role: "Academic Advisor", away: "Away until Aug 12" },
    ],
  },
  "Financial Aid": {
    policy: "members",
    members: [
      { name: "Betty Locherty", role: "Financial Aid Counselor" },
      { name: "James Mori", role: "Financial Aid Counselor" },
    ],
  },
  // members-only with everyone away — the compose flow's honest dead end
  "English Dept": {
    policy: "members",
    members: [{ name: "Ava Robinson", role: "Department Coordinator", away: "Away until Aug 4" }],
  },
};

function toOptionMarkup({ avatarName, displayName, role, away, value, selected }) {
  const trailing = away
    ? `<span class="badge badge--sm badge--role-neutral">${away}</span>`
    : iconCheckmark;
  return `<button type="button" class="listbox__option mc-to-option${selected ? " listbox__option--selected" : ""}" role="option" aria-selected="${selected ? "true" : "false"}" data-recipient="${esc(value)}" data-display="${esc(displayName)}"${selected ? ' data-default="true"' : ""}${away ? " disabled" : ""}>
              ${avatarMarkup(avatarName, "sm")}
              <span class="mc-to-option__stack"><span class="mc-to-option__name">${displayName}</span><span class="mc-to-option__role">${role}</span></span>
              ${trailing}
            </button>`;
}
// one option group per department inside the single To listbox popover; the
// department itself is the FIRST option (department-only / "both" policies,
// preselected), members follow, away members disabled
function toGroupMarkup(deptName) {
  const cfg = composePolicies[deptName] || { policy: "department" };
  const rows = [];
  if (cfg.policy !== "members") {
    rows.push(toOptionMarkup({
      avatarName: deptName, displayName: `${deptName} (department)`,
      role: "Fastest response — routed to available staff", value: "", selected: true,
    }));
  }
  (cfg.members || []).forEach((m) => rows.push(toOptionMarkup({
    avatarName: m.name, displayName: m.name, role: m.role, away: m.away, value: m.name, selected: false,
  })));
  return `<ul class="listbox__list" role="listbox" aria-label="Recipient" data-to-dept="${esc(deptName)}" hidden>
          ${rows.map((r) => `<li>${r}</li>`).join("\n          ")}
        </ul>`;
}
const composeToGroups = departments.map(toGroupMarkup).join("\n        ");
// per-department hint under the To select — ONLY the all-away dead end gets
// one (it explains why Send can't enable); an away member needs no prose,
// its disabled row + away Badge already say it (explicit user call)
const composeToHints = departments.map((deptName) => {
  const cfg = composePolicies[deptName] || {};
  const members = cfg.members || [];
  if (cfg.policy === "members" && members.every((m) => m.away)) {
    return `<span class="mc-compose__hint" data-to-dept="${esc(deptName)}" hidden>No one at ${deptName} is available right now — please try again later.</span>`;
  }
  return "";
}).filter(Boolean).join("\n    ");

// fake keyboard — docs-only scaffolding (device mock), see the CSS note
const kbdKey = (k, cls = "") => `<span class="mc-kbd__key${cls}">${k}</span>`;
const kbdRow = (inner) => `<div class="mc-kbd__row">${inner}</div>`;
const composeKbd = `<div class="mc-kbd" aria-hidden="true">
  ${kbdRow("QWERTYUIOP".split("").map((k) => kbdKey(k)).join(""))}
  ${kbdRow("ASDFGHJKL".split("").map((k) => kbdKey(k)).join(""))}
  ${kbdRow(kbdKey("⇧", " mc-kbd__key--wide") + "ZXCVBNM".split("").map((k) => kbdKey(k)).join("") + kbdKey("⌫", " mc-kbd__key--wide"))}
  ${kbdRow(kbdKey("123", " mc-kbd__key--wide") + kbdKey("space", " mc-kbd__key--space") + kbdKey("return", " mc-kbd__key--return"))}
</div>`;

// runtime avatar lookup for the thread row/pane a Send creates — build-time
// Avatar recipe (photo → initials tier), keyed by every possible recipient
const composeAvatarMap = {};
departments.forEach((d) => { composeAvatarMap[d] = avatarMarkup(d, "sm"); });
Object.values(composePolicies).forEach((cfg) =>
  (cfg.members || []).forEach((m) => { composeAvatarMap[m.name] = avatarMarkup(m.name, "sm"); }));

// ---- the appended-on-Send self bubble template, reused by the app script.
// Static sender markup is generated here at build time (same avatar recipe);
// the user's text is injected via textContent, never innerHTML. ----
const selfBubbleSender = `<div class="bubble-sender"><p class="bubble-sender__text"><span class="bubble-sender__name">${SELF.name}</span> <span class="bubble-sender__meta">-- Just now</span></p><span class="avatar avatar--${SELF.hue} avatar--sm" role="img" aria-label="${SELF.name}"><span class="avatar__initials">${SELF.initials}</span></span></div>`;

const appJs = `(function () {
  var mc = document.querySelector(".mc");
  var empty = document.getElementById("mc-empty");
  // live query — Send creates new panes at runtime
  function panes() { return document.querySelectorAll(".mc-thread"); }
  var lists = { inbox: document.querySelector('[data-list="inbox"]'), archived: document.querySelector('[data-list="archived"]') };
  var countEl = document.getElementById("mc-count");
  var searchInput = document.getElementById("mc-search-input");
  var searchClear = document.getElementById("mc-search-clear");
  var unreadCounter = document.getElementById("mc-unread-counter");
  var activeList = "inbox";
  var filters = { unread: false, expires: false, flagged: false };
  var dept = null;

  function rows(listKey) {
    return Array.prototype.slice.call(lists[listKey].querySelectorAll(".thread-item-inbox"));
  }
  function allRows() {
    return rows("inbox").concat(rows("archived"));
  }
  function rowMatches(r) {
    var q = searchInput.value.trim().toLowerCase();
    if (q && r.textContent.toLowerCase().indexOf(q) === -1) return false;
    if (filters.unread && !r.classList.contains("thread-item-inbox--unread")) return false;
    // "Expires soon" = soon (warning) or already expired (danger); a far-off
    // neutral expiry deliberately doesn't count
    if (filters.expires && r.dataset.expires !== "warning" && r.dataset.expires !== "danger") return false;
    if (filters.flagged && r.querySelector(".thread-item-inbox__flag-btn").getAttribute("aria-pressed") !== "true") return false;
    if (dept && r.dataset.department !== dept) return false;
    return true;
  }
  // While searching, the tab split is suspended: both lists show as one
  // combined result set and every row reveals its Inbox/Archived scope badge.
  // The rail's EmptyState covers two cases: search open with no query yet
  // (lists fully replaced by a hint) and zero matching rows.
  var railEmpty = document.getElementById("mc-rail-empty");
  var railEmptyText = document.getElementById("mc-rail-empty-text");
  var countWrap = document.querySelector(".mc-rail__count");
  function applyFilter() {
    var searchOpen = mc.classList.contains("mc--search-open");
    var searching = searchInput.value.trim() !== "";
    mc.classList.toggle("mc--searching", searching);
    if (searchOpen && !searching) {
      lists.inbox.hidden = true;
      lists.archived.hidden = true;
      countWrap.hidden = true;
      railEmpty.hidden = false;
      railEmptyText.textContent = "Search across Inbox and Archived";
      return;
    }
    countWrap.hidden = false;
    lists.inbox.hidden = searching ? false : activeList !== "inbox";
    lists.archived.hidden = searching ? false : activeList !== "archived";
    allRows().forEach(function (r) { r.hidden = !rowMatches(r); });
    var visible = allRows().filter(function (r) { return !r.hidden && !r.closest(".mc-list").hidden; }).length;
    countEl.textContent = visible + (visible === 1 ? " THREAD" : " THREADS");
    railEmpty.hidden = visible !== 0;
    railEmptyText.textContent = searching ? "No threads found" : "No threads match the filters";
  }
  function updateUnreadCounter() {
    var n = rows("inbox").filter(function (r) { return r.classList.contains("thread-item-inbox--unread"); }).length;
    unreadCounter.textContent = n;
    unreadCounter.hidden = n === 0;
  }
  function showPane(id) {
    panes().forEach(function (p) { p.hidden = p.dataset.thread !== id; });
    empty.hidden = !!id;
    if (!id) empty.hidden = false;
  }
  function closeThread() {
    mc.classList.remove("mc--thread-open");
    showPane(null);
    rows("inbox").concat(rows("archived")).forEach(function (r) { r.classList.remove("thread-item-inbox--selected"); });
  }

  // thread selection — single-select across both lists; opening a thread
  // also marks it read (removes the unread state), the real product behavior.
  // Rows are role="button" divs (they nest the flag toggle), so Enter/Space
  // need wiring by hand — a real <button> would have given them for free.
  function bindRow(row) {
    function activate() {
      allRows().forEach(function (r) { r.classList.remove("thread-item-inbox--selected"); });
      row.classList.remove("thread-item-inbox--unread");
      row.classList.add("thread-item-inbox--read", "thread-item-inbox--selected");
      showPane(row.dataset.thread);
      mc.classList.add("mc--thread-open");
      updateUnreadCounter();
      if (filters.unread) applyFilter();
    }
    row.addEventListener("click", activate);
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
    // flag toggle — marks a thread important without opening it
    var flag = row.querySelector(".thread-item-inbox__flag-btn");
    flag.addEventListener("click", function (e) {
      e.stopPropagation();
      flag.setAttribute("aria-pressed", flag.getAttribute("aria-pressed") === "true" ? "false" : "true");
      if (filters.flagged) applyFilter();
    });
    flag.addEventListener("keydown", function (e) { e.stopPropagation(); });
  }
  document.querySelectorAll(".thread-item-inbox").forEach(bindRow);

  // FAB — extended by default; collapses to icon-only while the thread list
  // scrolls down, re-extends on scroll up or near the top (the list is the
  // scroll container, not the window)
  var fab = document.getElementById("mc-new-fab");
  var railLists = document.querySelector(".mc-rail__lists");
  var lastListScroll = 0;
  railLists.addEventListener("scroll", function () {
    var y = railLists.scrollTop;
    if (y > lastListScroll && y > 40) fab.classList.add("mc-fab--collapsed");
    else if (y < lastListScroll - 4 || y <= 40) fab.classList.remove("mc-fab--collapsed");
    lastListScroll = y;
  }, { passive: true });

  // back (mobile only)
  function bindBack(btn) {
    btn.addEventListener("click", function () { mc.classList.remove("mc--thread-open"); });
  }
  document.querySelectorAll(".mc-thread__back").forEach(bindBack);

  // Inbox / Archived tabs — the unread Counter also swaps its onNeutral
  // active/inactive surface with the tab it sits on, same as Tabs' own docs
  document.querySelectorAll(".mc-rail__topbar .tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".mc-rail__topbar .tab").forEach(function (t) {
        t.classList.toggle("tab--active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      activeList = tab.dataset.tab;
      unreadCounter.classList.toggle("counter--active", activeList === "inbox");
      unreadCounter.classList.toggle("counter--inactive", activeList !== "inbox");
      // Unread/Expires soon are Inbox-only concepts — hidden on Archived,
      // and reset so they can't keep filtering invisibly
      mc.classList.toggle("mc--archived", activeList === "archived");
      if (activeList === "archived") resetChipFilters(["unread", "expires"]);
      applyFilter();
    });
  });

  // resets some/all chip filters so a hidden chip can't keep filtering
  // invisibly (used when switching to Archived and when opening search)
  function resetChipFilters(keys) {
    keys.forEach(function (key) {
      var cb = document.querySelector('#mc-filters-listbox [data-filter-key="' + key + '"]');
      if (cb) cb.checked = false;
      filters[key] = false;
    });
    if (typeof updateFiltersChip === "function") updateFiltersChip();
  }
  function resetDeptFilter() {
    dept = null;
    document.getElementById("mc-dept-label").textContent = "Department";
    document.getElementById("mc-dept-chip").classList.remove("chip--checked-outline");
    document.querySelectorAll("#mc-dept-listbox .listbox__option").forEach(function (o, i) {
      o.classList.toggle("listbox__option--selected", i === 0);
      o.setAttribute("aria-selected", i === 0 ? "true" : "false");
    });
  }

  // search is an icon button beside the tabs; opening it swaps the tabs for
  // the expanded field and retires the whole filter row (search is global —
  // chips don't apply). The in-field × only CLEARS and only shows once
  // populated (Search's own convention); the blue "Close" label beside the
  // field is the one way out. Escape closes too.
  var searchOpenBtn = document.querySelector(".mc-search-open-btn");
  var searchCloseBtn = document.getElementById("mc-search-close");
  function closeSearch() {
    mc.classList.remove("mc--search-open");
    searchInput.value = "";
    searchClear.hidden = true;
    applyFilter();
  }
  searchOpenBtn.addEventListener("click", function () {
    mc.classList.add("mc--search-open");
    resetChipFilters(["unread", "expires", "flagged"]);
    resetDeptFilter();
    applyFilter();
    searchInput.focus();
  });
  searchCloseBtn.addEventListener("click", closeSearch);
  searchInput.addEventListener("input", function () {
    searchClear.hidden = searchInput.value.trim() === "";
    applyFilter();
  });
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSearch();
  });
  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    searchClear.hidden = true;
    applyFilter();
    searchInput.focus();
  });

  // filter chips — Unread / Expires soon / Flagged, freely combinable (AND).
  // On mobile the three toggles live inside the "Filters · N" dropdown-chip
  // (multi-select Listbox with real Checkbox markers); both surfaces drive
  // the same filters object and stay in sync across viewport changes.
  var filtersChip = document.getElementById("mc-filters-chip");
  var filtersCount = document.getElementById("mc-filters-count");
  var filtersListbox = document.getElementById("mc-filters-listbox");
  function updateFiltersChip() {
    var n = ["unread", "expires", "flagged"].filter(function (k) { return filters[k]; }).length;
    filtersCount.textContent = n;
    filtersCount.hidden = n === 0;
    filtersChip.classList.toggle("chip--checked-outline", n > 0);
  }
  function setFilter(key, on) {
    filters[key] = on;
    var cb = document.querySelector('#mc-filters-listbox [data-filter-key="' + key + '"]');
    if (cb) cb.checked = on;
    updateFiltersChip();
  }
  filtersListbox.addEventListener("toggle", function (e) {
    if (e.newState === "open") {
      var r = filtersChip.getBoundingClientRect();
      filtersListbox.style.position = "fixed";
      filtersListbox.style.margin = "0";
      filtersListbox.style.top = r.bottom + 4 + "px";
      filtersListbox.style.left = Math.max(8, Math.min(r.left, window.innerWidth - filtersListbox.offsetWidth - 8)) + "px";
    }
  });
  filtersListbox.querySelectorAll(".listbox__cb-input").forEach(function (cb) {
    cb.addEventListener("change", function () {
      setFilter(cb.dataset.filterKey, cb.checked);
      applyFilter();
    });
  });

  // Department — a dropdown chip: Chip trigger + single-select Listbox popover
  var deptChip = document.getElementById("mc-dept-chip");
  var deptLabel = document.getElementById("mc-dept-label");
  var deptListbox = document.getElementById("mc-dept-listbox");
  deptListbox.addEventListener("toggle", function (e) {
    if (e.newState === "open") {
      var r = deptChip.getBoundingClientRect();
      deptListbox.style.position = "fixed";
      deptListbox.style.margin = "0";
      deptListbox.style.top = r.bottom + 4 + "px";
      deptListbox.style.left = Math.max(8, Math.min(r.left, window.innerWidth - deptListbox.offsetWidth - 8)) + "px";
    }
  });
  deptListbox.querySelectorAll(".listbox__option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      deptListbox.querySelectorAll(".listbox__option").forEach(function (o) {
        o.classList.toggle("listbox__option--selected", o === opt);
        o.setAttribute("aria-selected", o === opt ? "true" : "false");
      });
      dept = opt.dataset.dept || null;
      deptLabel.textContent = dept || "Department";
      deptChip.classList.toggle("chip--checked-outline", !!dept);
      deptListbox.hidePopover();
      applyFilter();
    });
  });

  // composer — Send appends a real self Bubble (tint). The field is a 1-row
  // textarea auto-growing to ~5 lines (Enter sends, Shift+Enter breaks); the
  // attach button stacks Attachment idle rows above the field and they ride
  // into the sent Bubble as the done shape; focusing the field docks the
  // fake keyboard under the composer on the mobile takeover. (FAKE_FILES /
  // ATT_* templates are shared with the compose dialog, defined below —
  // handlers only dereference them at event time, so order is safe.)
  var SELF_SENDER = ${JSON.stringify(selfBubbleSender)};
  function bindComposer(form) {
    var input = form.querySelector(".composer__input");
    var attsWrap = form.querySelector(".composer__atts");
    var atts = [];
    function renderAtts() {
      attsWrap.innerHTML = "";
      atts.forEach(function (file, i) {
        var el = attachmentNode(ATT_IDLE, file);
        el.querySelector(".mc-att-remove").addEventListener("click", function () {
          atts.splice(i, 1);
          renderAtts();
        });
        attsWrap.appendChild(el);
      });
      attsWrap.hidden = atts.length === 0;
    }
    form.querySelector(".mc-composer-attach").addEventListener("click", function () {
      atts.push(FAKE_FILES[atts.length % FAKE_FILES.length]);
      renderAtts();
    });
    function grow() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }
    input.addEventListener("input", grow);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    input.addEventListener("focus", function () { form.closest(".mc-thread").classList.add("mc-thread--kbd"); });
    input.addEventListener("blur", function () { form.closest(".mc-thread").classList.remove("mc-thread--kbd"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text && !atts.length) return;
      var scroll = form.closest(".mc-thread").querySelector(".mc-thread__scroll");
      var row = document.createElement("div");
      row.className = "bubble-row bubble-row--self";
      row.innerHTML = SELF_SENDER + '<div class="bubble bubble--self bubble--tint"></div>';
      var bubble = row.querySelector(".bubble");
      if (text) {
        var p = document.createElement("p");
        p.textContent = text;
        bubble.appendChild(p);
      }
      if (atts.length) {
        var wrap = document.createElement("div");
        wrap.className = "message__attachments";
        atts.forEach(function (file) { wrap.appendChild(attachmentNode(ATT_DONE, file)); });
        bubble.appendChild(wrap);
      }
      scroll.appendChild(row);
      scroll.scrollTop = scroll.scrollHeight;
      input.value = "";
      grow();
      atts = [];
      renderAtts();
      input.focus();
    });
  }
  document.querySelectorAll(".mc-composer").forEach(bindComposer);

  // Toast — popover="manual": free top-layer, no light-dismiss; a toast
  // leaves on its own timer (the real component, resolved from its tokens)
  var TOAST_SUCCESS_ICON = ${JSON.stringify(iconToastSuccess)};
  function showToast(role, text, duration) {
    var t = document.createElement("div");
    t.className = "toast toast--" + role;
    t.setAttribute("popover", "manual");
    t.setAttribute("role", role === "danger" ? "alert" : "status");
    t.innerHTML = TOAST_SUCCESS_ICON + '<span class="toast__label"></span>';
    t.querySelector(".toast__label").textContent = text;
    document.body.appendChild(t);
    t.showPopover();
    setTimeout(function () { t.hidePopover(); t.remove(); }, duration || 3200);
  }

  // Archive — really moves the thread's row to the Archived list (flips the
  // row's search-scope badge to match its new home) and confirms with a toast
  function bindArchive(btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.thread;
      var row = lists.inbox.querySelector('[data-thread="' + id + '"]');
      var subject = "";
      if (row) {
        subject = row.dataset.subject;
        row.classList.remove("thread-item-inbox--selected");
        var scope = row.querySelector(".thread-item-inbox__scope");
        scope.textContent = "Archived";
        scope.classList.remove("badge--role-primary");
        scope.classList.add("badge--role-neutral");
        lists.archived.insertBefore(row, lists.archived.firstChild);
      }
      btn.closest(".mc-thread").querySelector(".mc-thread__tags").insertAdjacentHTML("beforeend", '<span class="badge badge--sm badge--role-neutral">Archived</span>');
      btn.remove();
      closeThread();
      applyFilter();
      updateUnreadCounter();
      showToast("success", '"' + subject + '" archived');
    });
  }
  document.querySelectorAll(".mc-archive").forEach(bindArchive);

  // Print
  function bindPrint(btn) {
    btn.addEventListener("click", function () { window.print(); });
  }
  document.querySelectorAll(".mc-print").forEach(bindPrint);

  // New message — FAB (mobile) / topbar button (split views) opens the
  // compose dialog: a full-screen bottom sheet under 768px (Cancel/Send in
  // the header, within reach above the keyboard), Modal's centered recipe on
  // split views. The department's policy decides what the To block shows
  // (nothing / member list / department + members). Send is disabled until
  // recipient + message are valid, and creates a REAL thread: a row on top
  // of Inbox with a "You: …" preview and an Awaiting reply badge (a sent
  // message starts a live conversation — it does NOT go to Archived), plus
  // a real reading pane (self Bubble + open composer). Closing with a draft
  // routes through the Discard confirmation (modal.alert behavior).
  var composeDlg = document.getElementById("mc-compose");
  var discardDlg = document.getElementById("mc-discard");
  var composeDept = null;
  var composeRecipient = null; // "" = the department itself, else the member's name
  var composeDeptValue = document.getElementById("mc-compose-dept-value");
  var composeDeptTrigger = document.getElementById("mc-compose-dept");
  var composeDeptLb = document.getElementById("mc-compose-dept-lb");
  var composeSubject = document.getElementById("mc-compose-subject");
  var composeMessage = document.getElementById("mc-compose-message");
  var composeSendBtns = [document.getElementById("mc-compose-send"), document.getElementById("mc-compose-send-m")];
  var composeToTrigger = document.getElementById("mc-compose-to");
  var composeToValue = document.getElementById("mc-compose-to-value");
  var composeToLb = document.getElementById("mc-compose-to-lb");
  var composeToGroups = Array.prototype.slice.call(composeToLb.querySelectorAll(".listbox__list"));
  var composeToHints = Array.prototype.slice.call(document.querySelectorAll(".mc-compose__hint"));
  var composeAtts = [];
  var composeAttsWrap = document.getElementById("mc-compose-atts");
  var COMPOSE_AVATARS = ${JSON.stringify(composeAvatarMap)};

  function activeToGroup() {
    return composeToGroups.filter(function (g) { return g.dataset.toDept === composeDept; })[0] || null;
  }
  // composeRecipient: null = nothing chosen; "" = the department itself;
  // otherwise the member's name. An all-away members-only department never
  // gets a selectable option, so it stays null and Send stays disabled.
  function composeRecipientOk() {
    return !!composeDept && composeRecipient !== null;
  }
  function validateCompose() {
    var ok = composeRecipientOk() && composeMessage.value.trim() !== "";
    composeSendBtns.forEach(function (b) { b.disabled = !ok; });
  }
  function composeHasDraft() {
    return !!composeDept || composeSubject.value.trim() !== "" || composeMessage.value.trim() !== "" || composeAtts.length > 0;
  }

  // floating label — Input's own state model: resting shows the placeholder
  // at value size, focus/populated float the 12px label in
  [composeSubject, composeMessage].forEach(function (control) {
    var field = control.closest(".mc-field");
    function sync() {
      field.classList.toggle("mc-field--floated", document.activeElement === control || control.value.trim() !== "");
    }
    control.addEventListener("focus", sync);
    control.addEventListener("blur", sync);
    control.addEventListener("input", function () { sync(); validateCompose(); });
  });
  document.querySelectorAll(".mc-field").forEach(function (field) {
    field.addEventListener("click", function () { field.querySelector(".mc-field__control").focus(); });
  });

  // Select float model (Input's own): resting = placeholder only at value
  // size; the 12px label floats in only once a value exists
  function selectPopulate(trigger, valueEl, text) {
    trigger.classList.remove("select--resting");
    valueEl.textContent = text;
  }
  function selectRest(trigger, valueEl, placeholder) {
    trigger.classList.add("select--resting");
    valueEl.textContent = placeholder;
  }
  function setRecipientFromOption(opt) {
    composeRecipient = opt.dataset.recipient;
    selectPopulate(composeToTrigger, composeToValue, opt.dataset.display);
  }
  // To listbox popover — same trigger-anchored positioning as the Department one
  composeToLb.addEventListener("toggle", function (e) {
    if (e.newState === "open") {
      var r = composeToTrigger.getBoundingClientRect();
      composeToLb.style.position = "fixed";
      composeToLb.style.margin = "0";
      composeToLb.style.top = r.bottom + 4 + "px";
      composeToLb.style.left = r.left + "px";
      composeToLb.style.minWidth = r.width + "px";
    }
  });
  composeToGroups.forEach(function (group) {
    group.querySelectorAll(".mc-to-option:not([disabled])").forEach(function (opt) {
      opt.addEventListener("click", function () {
        group.querySelectorAll(".mc-to-option").forEach(function (o) {
          o.classList.toggle("listbox__option--selected", o === opt);
          o.setAttribute("aria-selected", o === opt ? "true" : "false");
        });
        setRecipientFromOption(opt);
        composeToLb.hidePopover();
        validateCompose();
      });
    });
  });

  // attachments — Attachment's idle shape rows under the Message field; the
  // ghost Attach-file button adds one (prototype fakes the file itself)
  var FAKE_FILES = [["IMG_2043.jpg", "1.8 MB"], ["Transcript-request.pdf", "PDF · 1.1 MB"], ["Enrollment-form.pdf", "PDF · 640 KB"]];
  var ATT_IDLE = ${JSON.stringify(`<div class="attachment mc-compose__att"><span class="attachment__media">${iconFile}</span><span class="attachment__content"><span class="attachment__title"></span><span class="attachment__description"></span></span><button class="btn btn--ghost btn--sm btn--icon-only mc-att-remove" type="button" aria-label="Remove attachment">${iconCloseBtn}</button></div>`)};
  var ATT_DONE = ${JSON.stringify(`<a class="attachment" href="#" download><span class="attachment__media">${iconFile}</span><span class="attachment__content"><span class="attachment__title"></span><span class="attachment__description"></span></span></a>`)};
  function attachmentNode(skeleton, file) {
    var host = document.createElement("div");
    host.innerHTML = skeleton;
    var el = host.firstChild;
    el.querySelector(".attachment__title").textContent = file[0];
    el.querySelector(".attachment__description").textContent = file[1];
    return el;
  }
  function renderComposeAtts() {
    composeAttsWrap.innerHTML = "";
    composeAtts.forEach(function (file, i) {
      var el = attachmentNode(ATT_IDLE, file);
      el.querySelector(".mc-att-remove").addEventListener("click", function () {
        composeAtts.splice(i, 1);
        renderComposeAtts();
      });
      composeAttsWrap.appendChild(el);
    });
    composeAttsWrap.hidden = composeAtts.length === 0;
  }
  document.getElementById("mc-compose-attach").addEventListener("click", function () {
    composeAtts.push(FAKE_FILES[composeAtts.length % FAKE_FILES.length]);
    renderComposeAtts();
  });

  // fake keyboard — shown while a text field is focused (mobile takeover only)
  composeDlg.addEventListener("focusin", function (e) {
    composeDlg.classList.toggle("mc-compose--kbd", !!e.target.closest(".mc-field"));
  });
  composeDlg.addEventListener("focusout", function () {
    composeDlg.classList.remove("mc-compose--kbd");
  });

  function resetCompose() {
    composeDept = null;
    composeRecipient = null;
    selectRest(composeDeptTrigger, composeDeptValue, "Department");
    selectRest(composeToTrigger, composeToValue, "To");
    composeToTrigger.disabled = true;
    composeSubject.value = "";
    composeMessage.value = "";
    composeAtts = [];
    renderComposeAtts();
    composeDlg.classList.remove("mc-compose--kbd");
    document.querySelectorAll(".mc-field").forEach(function (f) { f.classList.remove("mc-field--floated"); });
    composeDeptLb.querySelectorAll(".listbox__option").forEach(function (o) {
      o.classList.remove("listbox__option--selected");
      o.setAttribute("aria-selected", "false");
    });
    composeToHints.forEach(function (h) { h.hidden = true; });
    composeToGroups.forEach(function (g) {
      g.hidden = true;
      g.querySelectorAll(".mc-to-option").forEach(function (o) {
        var def = o.dataset.default === "true";
        o.classList.toggle("listbox__option--selected", def);
        o.setAttribute("aria-selected", def ? "true" : "false");
      });
    });
    validateCompose();
  }
  function requestComposeClose() {
    if (composeHasDraft()) discardDlg.showModal();
    else composeDlg.close();
  }

  ["mc-new-fab", "mc-new-desktop"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () { resetCompose(); composeDlg.showModal(); });
  });
  ["mc-compose-cancel", "mc-compose-cancel-m", "mc-compose-close"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", requestComposeClose);
  });
  composeDlg.addEventListener("click", function (e) {
    if (e.target === composeDlg) requestComposeClose();
  });
  composeDlg.addEventListener("cancel", function (e) {           // Escape
    if (composeHasDraft()) { e.preventDefault(); discardDlg.showModal(); }
  });
  // modal.alert behavior: Escape disabled, footer actions are the only way out
  discardDlg.addEventListener("cancel", function (e) { e.preventDefault(); });
  document.getElementById("mc-discard-keep").addEventListener("click", function () { discardDlg.close(); });
  document.getElementById("mc-discard-discard").addEventListener("click", function () {
    discardDlg.close();
    composeDlg.close();
  });

  composeDeptLb.addEventListener("toggle", function (e) {
    if (e.newState === "open") {
      var r = composeDeptTrigger.getBoundingClientRect();
      composeDeptLb.style.position = "fixed";
      composeDeptLb.style.margin = "0";
      composeDeptLb.style.top = r.bottom + 4 + "px";
      composeDeptLb.style.left = r.left + "px";
      composeDeptLb.style.minWidth = r.width + "px";
    }
  });
  composeDeptLb.querySelectorAll(".listbox__option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      composeDeptLb.querySelectorAll(".listbox__option").forEach(function (o) {
        o.classList.toggle("listbox__option--selected", o === opt);
        o.setAttribute("aria-selected", o === opt ? "true" : "false");
      });
      composeDept = opt.dataset.dept;
      selectPopulate(composeDeptTrigger, composeDeptValue, composeDept);
      composeDeptLb.hidePopover();
      // the To select wakes up scoped to this department's policy: its group
      // shows, the department option (when the policy has one) is preselected
      composeRecipient = null;
      selectRest(composeToTrigger, composeToValue, "To");
      composeToTrigger.disabled = false;
      composeToGroups.forEach(function (g) { g.hidden = g.dataset.toDept !== composeDept; });
      composeToHints.forEach(function (h) { h.hidden = h.dataset.toDept !== composeDept; });
      var group = activeToGroup();
      if (group) {
        var preset = group.querySelector(".listbox__option--selected");
        if (preset) setRecipientFromOption(preset);
      }
      validateCompose();
    });
  });

  var COMPOSE_ROW_SKELETON = ${JSON.stringify(`<div class="thread-item-inbox__main"><div class="thread-item-inbox__top"><span class="thread-item-inbox__identity"></span><span class="thread-item-inbox__time">Just now</span></div><div class="thread-item-inbox__subject"></div><div class="thread-item-inbox__preview-row"><span class="thread-item-inbox__preview"></span><button class="thread-item-inbox__flag-btn" type="button" aria-pressed="false" aria-label="Flag thread">${iconFlagOutlined}${iconFlagFilled}</button></div><div class="thread-item-inbox__expires"><span class="badge badge--sm badge--role-primary">Awaiting reply</span><span class="badge badge--sm badge--role-primary thread-item-inbox__scope">Inbox</span></div></div>`)};
  var COMPOSE_PANE_SKELETON = ${JSON.stringify(`<header class="mc-thread__bar"><button class="btn btn--ghost btn--sm mc-thread__back" type="button">${iconBack}Back</button><div class="mc-thread__actions"><button class="btn btn--secondary btn--sm mc-archive" type="button">Archive</button><button class="btn btn--secondary btn--sm btn--icon-only mc-print" type="button" aria-label="Print thread">${iconPrint}</button></div><h2 class="mc-thread__subject"></h2><div class="mc-thread__tags"><span class="mc-thread__meta-line"></span><span class="badge badge--sm badge--role-primary">Awaiting reply</span></div></header><div class="mc-thread__scroll"></div><footer class="mc-thread__composer"><form class="composer composer--simple mc-composer"><div class="composer__atts" hidden></div><div class="composer__field"><textarea class="composer__input" rows="1" placeholder="Write a message..." aria-label="Write a message"></textarea><button type="button" class="composer__icon-btn mc-composer-attach" aria-label="Attach file">${iconAttach}</button><button type="submit" class="btn btn--primary btn--sm btn--icon-only" aria-label="Send">${iconSend}</button></div></form></footer>${composeKbd}`)};

  composeSendBtns.forEach(function (sendBtn) {
    sendBtn.addEventListener("click", function () {
      var member = composeRecipient || null;
      var text = composeMessage.value.trim();
      var subject = composeSubject.value.trim() || "(No subject)";
      var identity = member ? member + " · " + composeDept : composeDept;
      var id = "sent-" + Date.now();

      // Inbox row — read (it's the student's own message), Awaiting reply
      var row = document.createElement("div");
      row.className = "thread-item-inbox thread-item-inbox--read";
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      row.dataset.thread = id;
      row.dataset.subject = subject;
      row.dataset.department = composeDept;
      row.innerHTML = COMPOSE_AVATARS[member || composeDept] + COMPOSE_ROW_SKELETON;
      row.querySelector(".thread-item-inbox__identity").textContent = identity;
      row.querySelector(".thread-item-inbox__subject").textContent = subject;
      row.querySelector(".thread-item-inbox__preview").textContent = "You: " + text;
      bindRow(row);
      lists.inbox.insertBefore(row, lists.inbox.firstChild);

      // reading pane — the sent message as a self Bubble + an open composer
      var pane = document.createElement("article");
      pane.className = "mc-thread";
      pane.dataset.thread = id;
      pane.hidden = true;
      pane.innerHTML = COMPOSE_PANE_SKELETON;
      pane.querySelector(".mc-thread__subject").textContent = subject;
      pane.querySelector(".mc-thread__meta-line").textContent = identity + " · PeopleSoft University";
      pane.querySelector(".mc-archive").dataset.thread = id;
      var bubbleRowEl = document.createElement("div");
      bubbleRowEl.className = "bubble-row bubble-row--self";
      bubbleRowEl.innerHTML = SELF_SENDER + '<div class="bubble bubble--self bubble--tint"><p></p></div>';
      bubbleRowEl.querySelector(".bubble p").textContent = text;
      // attached files ride along as Attachment's done shape inside the bubble
      if (composeAtts.length) {
        var attsWrap = document.createElement("div");
        attsWrap.className = "message__attachments";
        composeAtts.forEach(function (file) { attsWrap.appendChild(attachmentNode(ATT_DONE, file)); });
        bubbleRowEl.querySelector(".bubble").appendChild(attsWrap);
      }
      pane.querySelector(".mc-thread__scroll").appendChild(bubbleRowEl);
      bindBack(pane.querySelector(".mc-thread__back"));
      bindArchive(pane.querySelector(".mc-archive"));
      bindPrint(pane.querySelector(".mc-print"));
      bindComposer(pane.querySelector(".mc-composer"));
      document.querySelector(".mc__reading").appendChild(pane);

      composeDlg.close();
      applyFilter();
      showToast("success", "Message sent to " + (member || composeDept));
    });
  });
  validateCompose();

  applyFilter();
  updateUnreadCounter();
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
  <header class="mc__topbar"><h1>Message Center</h1><button class="btn btn--primary btn--base mc-topbar-new" id="mc-new-desktop" type="button">${iconEdit}New message</button></header>
  <div class="mc__body">
    <aside class="mc__rail" aria-label="Thread list">
      <div class="mc-rail__topbar">
        <div class="tabs tabs--segmented tabs--sm" role="tablist">
          <button class="tab tab--sm tab--active" role="tab" aria-selected="true" data-tab="inbox">Inbox<span class="counter counter--sm counter--onNeutral counter--active" id="mc-unread-counter">${threads.filter((t) => !t.archived && t.unread).length}</span></button>
          <button class="tab tab--sm" role="tab" aria-selected="false" data-tab="archived">Archived</button>
        </div>
        <button class="btn btn--secondary btn--base btn--icon-only mc-search-open-btn" type="button" aria-label="Search threads">${iconSearchBtn}</button>
        <div class="search search--base">
          ${iconSearch}
          <input class="search__input" id="mc-search-input" placeholder="Search all threads" aria-label="Search all threads" />
          <button class="search__clear" id="mc-search-clear" type="button" aria-label="Clear search" hidden>${iconClear.replace('<svg class="search__clear" ', '<svg ')}</button>
        </div>
        <button class="mc-search-close" id="mc-search-close" type="button">Close</button>
      </div>
      <div class="mc-rail__chips">
        <button class="chip chip--base mc-filters-chip" id="mc-filters-chip" type="button" popovertarget="mc-filters-listbox" aria-haspopup="listbox">${iconFilter}<span>Filters</span><span class="counter counter--sm counter--onNeutral counter--inactive" id="mc-filters-count" hidden>0</span>${iconChevronDown}</button>
        <div class="listbox" id="mc-filters-listbox" popover>
          <ul class="listbox__list" aria-label="Filters">
            <li data-filter-option="unread"><label class="listbox__cb-option" for="mc-fopt-unread"><input type="checkbox" class="listbox__cb-input" id="mc-fopt-unread" data-filter-key="unread" />
              <span class="listbox__cb-box">${iconCbCheck}</span><span class="listbox__cb-label">Unread</span></label></li>
            <li data-filter-option="expires"><label class="listbox__cb-option" for="mc-fopt-expires"><input type="checkbox" class="listbox__cb-input" id="mc-fopt-expires" data-filter-key="expires" />
              <span class="listbox__cb-box">${iconCbCheck}</span><span class="listbox__cb-label">Expires soon</span></label></li>
            <li data-filter-option="flagged"><label class="listbox__cb-option" for="mc-fopt-flagged"><input type="checkbox" class="listbox__cb-input" id="mc-fopt-flagged" data-filter-key="flagged" />
              <span class="listbox__cb-box">${iconCbCheck}</span><span class="listbox__cb-label">Flagged</span></label></li>
          </ul>
        </div>
        <button class="chip chip--base chip--dropdown" type="button" id="mc-dept-chip" popovertarget="mc-dept-listbox" aria-haspopup="listbox"><span class="chip__label" id="mc-dept-label">Department</span>${iconChevronDown}</button>
        <div class="listbox" id="mc-dept-listbox" popover>
          <ul class="listbox__list" role="listbox" aria-label="Filter by department">
            <li><button class="listbox__option listbox__option--selected" role="option" aria-selected="true" data-dept="" type="button">All departments${iconCheckmark}</button></li>
            ${departments.map((d) => `<li><button class="listbox__option" role="option" aria-selected="false" data-dept="${esc(d)}" type="button">${d}${iconCheckmark}</button></li>`).join("\n            ")}
          </ul>
        </div>
      </div>
      <div class="mc-rail__count">
        <span class="mc-count" id="mc-count">${inboxThreads.length} THREADS</span>
        <hr class="separator" />
      </div>
      <div class="mc-rail__lists">
        <div class="mc-list" data-list="inbox">
          ${inboxThreads.map((t, i) => rowMarkup(t, i)).join("\n        ")}
        </div>
        <div class="mc-list" data-list="archived" hidden>
          ${archivedThreads.map((t, i) => rowMarkup(t, inboxThreads.length + i)).join("\n        ")}
        </div>
        <div class="mc-rail__empty" id="mc-rail-empty" hidden>
          <div class="empty-state"><span class="empty-state__text" id="mc-rail-empty-text">No threads found</span></div>
        </div>
      </div>
      <button class="btn btn--primary btn--lg mc-fab" id="mc-new-fab" type="button">${iconEdit}<span class="mc-fab__label">New message</span></button>
    </aside>
    <section class="mc__reading" aria-label="Thread">
      <div class="mc-empty" id="mc-empty"><div class="empty-state"><span class="empty-state__text">Choose a Thread</span></div></div>
      ${threads.map((t) => threadPane(t)).join("\n      ")}
    </section>
  </div>
</div>
<dialog class="mc-compose" id="mc-compose" aria-labelledby="mc-compose-title">
  <header class="mc-compose__header">
    <button class="btn btn--ghost btn--base mc-compose__cancel-m" id="mc-compose-cancel-m" type="button">Cancel</button>
    <h2 class="mc-compose__title" id="mc-compose-title">New message</h2>
    <button class="btn btn--primary btn--base mc-compose__send-m" id="mc-compose-send-m" type="button" disabled>Send</button>
    <button class="btn btn--ghost btn--sm btn--icon-only mc-compose__close" id="mc-compose-close" type="button" aria-label="Close">${iconCloseBtn}</button>
  </header>
  <div class="mc-compose__body">
    <button class="select select--base select--resting" id="mc-compose-dept" type="button" popovertarget="mc-compose-dept-lb">
      <span class="select__stack"><span class="select__label">Department</span><span class="select__value" id="mc-compose-dept-value">Department</span></span>
      ${iconChevronSelect}
    </button>
    <div class="listbox" id="mc-compose-dept-lb" popover>
      <ul class="listbox__list" role="listbox" aria-label="Department">
        ${departments.map((d) => `<li><button class="listbox__option" role="option" aria-selected="false" data-dept="${esc(d)}" type="button">${d}${iconCheckmark}</button></li>`).join("\n        ")}
      </ul>
    </div>
    <button class="select select--base select--resting" id="mc-compose-to" type="button" popovertarget="mc-compose-to-lb" disabled>
      <span class="select__stack"><span class="select__label">To</span><span class="select__value" id="mc-compose-to-value">To</span></span>
      ${iconChevronSelect}
    </button>
    <div class="listbox" id="mc-compose-to-lb" popover>
        ${composeToGroups}
    </div>
    ${composeToHints}
    <label class="mc-field">
      <span class="mc-field__label">Subject</span>
      <input class="mc-field__control" id="mc-compose-subject" placeholder="Subject (optional)" aria-label="Subject" />
    </label>
    <label class="mc-field mc-field--area">
      <span class="mc-field__label">Message</span>
      <textarea class="mc-field__control" id="mc-compose-message" placeholder="Write your message..." aria-label="Message"></textarea>
    </label>
    <div class="mc-compose__atts" id="mc-compose-atts" hidden></div>
    <button class="btn btn--ghost btn--sm mc-compose__attach-btn" id="mc-compose-attach" type="button">${iconAttachBtn}Attach file</button>
  </div>
  <footer class="mc-compose__footer">
    <button class="btn btn--secondary btn--base" id="mc-compose-cancel" type="button">Cancel</button>
    <button class="btn btn--primary btn--base" id="mc-compose-send" type="button" disabled>Send</button>
  </footer>
  ${composeKbd}
</dialog>
<dialog class="mc-confirm" id="mc-discard" aria-labelledby="mc-discard-title">
  <div class="mc-confirm__body">
    <h2 class="mc-confirm__title" id="mc-discard-title">Discard draft?</h2>
    <p class="mc-confirm__text">Your message hasn't been sent — it will be lost if you close now.</p>
  </div>
  <footer class="mc-confirm__footer">
    <button class="btn btn--secondary btn--base" id="mc-discard-keep" type="button">Keep editing</button>
    <button class="btn btn--danger btn--base" id="mc-discard-discard" type="button">Discard</button>
  </footer>
</dialog>
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
/* +2px compensates the frame's own 1px borders (border-box), so the iframe's
   INTERNAL viewport is exactly 375/768 — without it the tablet frame's inner
   width was 766px and the app's min-width:768 split-view media query never
   fired, leaving the tablet stuck in the one-pane mobile layout */
.device--mobile { width: 377px; height: 814px; max-height: 78vh; border-radius: 28px; }
.device--tablet { width: 770px; height: 1026px; max-height: 78vh; border-radius: 20px; }
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
    <p class="sub">Interactive prototype, built strictly from hp-design components (every recipe resolved from its own token file) — mobile-first, responsive. Click a thread, switch Inbox/Archived, search, sort, send a reply, archive a thread — all real. New message is a full-screen bottom sheet on mobile and a centered modal on tablet/desktop; the chosen department's settings decide who the student can write to (department only / members only / both, with per-member availability), and Send starts a real Inbox thread with an Awaiting reply badge. Staff-side features (flags, Handled by, filters) are deliberately absent: this is the student app.</p>

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
