// Generates the second entry of the Designs pane (the prototype explorer):
//   docs/designs/staff-message-center.html      — viewer page: docs chrome +
//     Mobile/Tablet/Desktop device tabs around an iframe of the app below.
//   docs/designs/staff-message-center-app.html  — the interactive Staff
//     Message Center prototype: the OTHER side of the student app — the
//     department inbox where staff answer incoming student threads. Derived
//     2026-08-06 from build-design-student-message-center.mjs (same
//     component recipes, resolved from each component's own token file —
//     shared shell/CSS is duplicated between the two builders, a known
//     drift risk accepted for v1). Staff-side differences:
//     - rows lead with the STUDENT (avatar + name · department), and carry
//       Handled by / Unassigned state;
//     - Archived becomes RESOLVED (tab, scope badge, per-thread Resolve
//       action with a confirming toast);
//     - the reply composer is Composer's RICH variant (B/I/U toolbar +
//       Merge Tags + AI Assist + Allow Replies Switch + Expiration row +
//       labeled Send), auto-growing textarea, Enter-to-send;
//     - no New-message dialog / FAB in v1 — staff-initiated announcements
//       are a separate flow, deliberately deferred, not silently skipped.
// Run: node tools/build-design-staff-message-center.mjs
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
const swtch = load("tokens/components/switch.tokens.json").component.switch;
const separator = load("tokens/components/separator.tokens.json").component.separator;
const checkbox = load("tokens/components/checkbox.tokens.json").component.checkbox;
// MC v3 email-console components
const tableTok = load("tokens/components/table.tokens.json").component.table;
const splitBtn = load("tokens/components/split-button.tokens.json").component.splitButton;
const skeletonTok = load("tokens/components/skeleton.tokens.json").component.skeleton;
const avatarGroup = load("tokens/components/avatar-group.tokens.json").component.avatarGroup;
const stepperTok = load("tokens/components/stepper.tokens.json").component.stepper;
const datePickerTok = load("tokens/components/date-picker.tokens.json").component.datePicker;
const statTok = load("tokens/components/stat.tokens.json").component.stat;

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

// ---- Thread data — the staff side: SELF is the advisor answering the
// department inbox; rows lead with the STUDENT who started each thread ----
const SELF = { name: "Alexander Robinson", hue: hueOf("Alexander Robinson"), initials: initialsOf("Alexander Robinson") };

const identityNames = [
  "Academic Advising", "Office of the Registrar", "English Dept", "Financial Aid",
  "Alexander Robinson", "Ava Robinson", "Betty Locherty",
  // students — initials tier, no photos
  "George Amalor", "Cait Genatossio", "Maya Patel", "Diego Fernandez", "Lena Hoffman", "Tomas Novak",
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
  "bg.ai", "text.ai", "icon.ai", "fill.ai",
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
// rich composer toolbar (staff side)
const iconBold = iconOf("format_bold", "composer__icon");
const iconItalic = iconOf("format_italic", "composer__icon");
const iconUnderline = iconOf("format_underlined", "composer__icon");
const iconAi = iconOf("auto_awesome", "composer__icon");
const iconChevronRight = iconOf("chevron_right", "composer__icon");
const iconTag = iconOf("local_offer", "btn__icon");
const iconCloseAtt = iconOf("close", "attachment__action-glyph");
const iconSend = iconOf("send", "btn__icon");
const iconFile = iconOf("insert_drive_file", "attachment__icon");
// New message entry points + compose dialog
const iconCheckboxCheck = iconOf("check", "checkbox__icon");
// AI Writing Assist panel
const iconChipArrow = iconOf("arrow_forward", "chip__icon");
const iconAiSpark = iconOf("auto_awesome", "mc-ai__spark");
const iconAiTabSpark = iconOf("auto_awesome", "tab__icon");
const iconCopy = iconOf("content_copy", "btn__icon");
const iconReplace = iconOf("swap_horiz", "btn__icon");
const iconRegen = iconOf("refresh", "btn__icon");
const iconAiSend = iconOf("arrow_upward", "btn__icon");
const iconMiniChevron = iconOf("expand_more", "mc-ai__opt-chevron");
const iconHandleCollapse = iconOf("chevron_left", "mc-ai__handle-icon");
const iconHandleClose = iconOf("close", "mc-ai__handle-icon");

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
const inputLgHeight = px(resolve(input.size.lg.height.$value));
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
// shadow.sm flipped upward — the thread composer sits over the scrolling
// messages; a small top shadow makes it read as the layer they slide under
const composerShadow = resolve("shadow.sm");
const composerShadowCss = `0 -${px(composerShadow.offsetY)} ${px(composerShadow.blur)} ${px(composerShadow.spread)} ${composerShadow.color}`;

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
// compact — the pre-send chip density both composers use
const attCompactPaddingY = px(resolve(attachment.compact.paddingY.$value));
const attCompactPaddingX = px(resolve(attachment.compact.paddingX.$value));
const attCompactGap = px(resolve(attachment.compact.gap.$value));
const attCompactIconSize = px(resolve(attachment.compact.iconSize.$value));
const attCompactMaxWidth = px(resolve(attachment.compact.maxWidth.$value));
const attCompactRowGap = px(resolve(attachment.compact.rowGap.$value));

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
const compSettingsGap = px(resolve(composer.settings.gap.$value));

// ---- Switch (the rich composer's Allow Replies control), resolved from its own tokens ----
const swRadius = px(resolve(swtch.radius.$value));
const swTrackWidth = resolve(swtch.size.trackWidth.$value);
const swTrackHeight = resolve(swtch.size.trackHeight.$value);
const swThumb = resolve(swtch.size.thumb.$value);
const swInset = resolve(swtch.size.thumbInset.$value);
const swTravel = swTrackWidth.value - swThumb.value - 2 * swInset.value;

// ---- Checkbox (the compose dialog's Allow Replies + Expire Thread controls),
// resolved from its own token file — native <input> under a painted box, the
// same visually-hidden approach Switch/Radio use. Compose uses checkboxes
// (not the thread composer's Switch) per explicit request. ----
const cbBox = px(resolve(checkbox.size.box.$value));
const cbRadius = px(resolve(checkbox.radius.$value));
const cbBorderWidth = px(resolve(checkbox.size.borderWidth.$value));
const cbGap = px(resolve(checkbox.size.gap.$value));
const cbLabelType = resolveToken(get(checkbox.label.$value));
const cbIconSize = px(resolve("dim.4"));
const cbRingWidth = px(resolve(checkbox.state.focused.ringWidth.$value));
const cbRingOffset = px(resolve(checkbox.state.focused.ringOffset.$value));

// ---- Chip action variant (the AI panel's suggestion chips) — resolved from
// chip.tokens.json's own action node, the third kind added for this. ----
const chipAction = {
  bg: refPath(chip.action.default.bg.$value),
  border: refPath(chip.action.default.border.$value),
  text: refPath(chip.action.default.text.$value),
  icon: refPath(chip.action.default.icon.$value),
  hoverBorder: refPath(chip.action.hover.border.$value),
};

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
const headingSmType = resolveToken(get("{text-style.heading-sm}"));
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
/* action / assist chip (chip.tokens.json's own action node) — button-like,
   fires and returns to rest, trailing arrow; the AI panel's suggestion chips */
.chip--action { background: ${cv(chipAction.bg)}; border-color: ${cv(chipAction.border)}; color: ${cv(chipAction.text)}; }
.chip--action .chip__icon { color: ${cv(chipAction.icon)}; }
.chip--action:not(:disabled):hover { border-color: ${cv(chipAction.hoverBorder)}; }
.chip--action:focus-visible { outline: ${chipRingWidth} solid ${cv("border.focus")}; outline-offset: ${chipRingOffset}; }

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
.bubble { box-sizing: border-box; display: flex; flex-direction: column; gap: ${bubGap}; padding: ${bubPaddingY} ${bubPaddingX}; border-radius: ${bubRadius}; min-width: 0; max-width: 100%; }
.bubble p { margin: 0; ${typoCss(bubTextType)} white-space: pre-wrap; overflow-wrap: anywhere; } /* Shift+Enter produces real newlines; anywhere keeps unbroken runs inside the bubble */
/* attachments inside a bubble cap at the bubble's own width — the base
   attachment's 320px max otherwise pokes out of the 75%-capped row */
.bubble .message__attachments { max-width: 100%; min-width: 0; }
.bubble .attachment { max-width: 100%; }
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
/* rich variant (staff side) — toolbar + AI Assist + settings rows + labeled
   Send, all straight from Composer's own docs recipe */
.composer__toolbar { display: flex; align-items: center; gap: ${px(resolve("dim.1"))}; }
.composer__ai-assist { flex-shrink: 0; display: inline-flex; align-items: center; gap: ${px(resolve("dim.1"))}; height: ${btnGhostSmHeight}; padding: 0 ${px(resolve("dim.2"))}; border: 1px solid transparent; border-radius: ${px(resolve("radius.default"))}; background: ${cv("bg.ai")}; color: ${cv("text.ai")}; cursor: pointer; font-family: ${cv("family.sans")}; ${typoCss(btnGhostSmLabelType)} }
.composer__ai-assist .composer__icon { width: ${btnGhostSmIconSize}; height: ${btnGhostSmIconSize}; color: ${cv("icon.ai")}; }
.composer__ai-assist:hover { border-color: ${cv("fill.ai")}; }
.composer__settings { display: flex; flex-direction: column; gap: ${compSettingsGap}; }
.composer__settings-row { display: flex; align-items: center; justify-content: space-between; }
.composer__settings-label { color: ${cv("text.default")}; font-size: 13px; }
.composer__expiration-trigger { display: inline-flex; align-items: center; gap: 2px; border: none; background: transparent; padding: 0; cursor: pointer; color: ${cv("text.secondary")}; font-size: 13px; font-family: ${cv("family.sans")}; }
.composer__expiration-trigger .composer__icon { width: 16px; height: 16px; }
.composer--rich .composer__send { align-self: flex-end; }

.switch { display: inline-flex; align-items: center; cursor: pointer; }
.switch__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.switch__track { box-sizing: border-box; position: relative; flex-shrink: 0; width: ${px(swTrackWidth)}; height: ${px(swTrackHeight)}; border-radius: ${swRadius}; background: ${cv("border.default")}; }
.switch__thumb { position: absolute; top: ${px(swInset)}; left: ${px(swInset)}; width: ${px(swThumb)}; height: ${px(swThumb)}; border-radius: ${swRadius}; background: #fff; transform: translateX(0); }
.switch__input:checked ~ .switch__track { background: ${cv("fill.primary")}; }
.switch__input:checked ~ .switch__track .switch__thumb { transform: translateX(${swTravel}px); }
.switch__input:focus-visible ~ .switch__track { outline: 2px solid ${cv("border.focus")}; outline-offset: 2px; }

/* Checkbox — native <input> visually hidden, painted box repainted via
   :checked on the real sibling input (checkbox.tokens.json's own recipe) */
.checkbox { display: inline-flex; align-items: center; gap: ${cbGap}; cursor: pointer; font-family: ${cv("family.sans")}; }
.checkbox__input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.checkbox__box { box-sizing: border-box; flex-shrink: 0; width: ${cbBox}; height: ${cbBox}; border-radius: ${cbRadius}; border: ${cbBorderWidth} solid ${cv("border.default")}; background: ${cv("surface.default")}; display: inline-flex; align-items: center; justify-content: center; }
.checkbox__icon { width: ${cbIconSize}; height: ${cbIconSize}; color: ${cv("icon.onFill")}; display: none; }
.checkbox:hover .checkbox__box { border-color: ${cv("fill.primary")}; }
.checkbox__input:checked ~ .checkbox__box { background: ${cv("fill.primary")}; border-color: ${cv("fill.primary")}; }
.checkbox__input:checked ~ .checkbox__box .checkbox__icon { display: block; }
.checkbox__input:focus-visible ~ .checkbox__box { outline: ${cbRingWidth} solid ${cv("border.focus")}; outline-offset: ${cbRingOffset}; }
.checkbox__label { color: ${cv("text.default")}; ${typoCss(cbLabelType)} }

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
/* lg (48px) fixed height, NOT base 40 — the floating label + value stack
   must fit INSIDE the resting height, or the field visibly grows on focus */
.mc-field { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: ${inputLabelGap}; min-height: ${inputLgHeight}; padding: ${px(resolve("dim.1_5"))} ${inputPaddingX}; border: 1px solid ${cv("border.default")}; border-radius: ${inputRadius}; background: ${cv("surface.dim")}; cursor: text; flex-shrink: 0; }
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
/* pre-send attachments (both composers) — Attachment's COMPACT chip density
   (32px, inline icon, one text line, hugs content), chips in ONE nowrap row
   with horizontal overflow per the Gmail-chip / messenger-row convention;
   sent files still render as the full base done row inside the Bubble */
.mc-compose__atts, .composer__atts { display: flex; gap: ${attCompactRowGap}; overflow-x: auto; flex-shrink: 0; }
.mc-compose__atts[hidden], .composer__atts[hidden] { display: none; }
.attachment__action { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; border-radius: ${px(resolve("radius.default"))}; background: transparent; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.attachment__action:hover { background: ${cv("fill.neutralHover")}; }
.attachment__action:active { background: ${cv("fill.neutralActive")}; }
.attachment__action-glyph { width: 16px; height: 16px; display: block; }
.attachment--compact { padding: ${attCompactPaddingY} ${attCompactPaddingX}; gap: ${attCompactGap}; max-width: ${attCompactMaxWidth}; flex-shrink: 0; }
.attachment--compact .attachment__icon { width: ${attCompactIconSize}; height: ${attCompactIconSize}; color: ${cv("icon.secondary")}; flex-shrink: 0; }
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
  .mc-compose__title { flex: 1; text-align: left; }
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
/* v3: the topbar is PERSISTENT chrome (Gmail-style) — it stays across the
   list and the full-page thread detail; the list and detail swap under it */
.mc__topbar h1 { margin: 0; color: ${cv("text.default")}; ${typoCss(headingLgType)} }
.mc__brand { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; min-width: 0; }
.mc__brand-mark { flex-shrink: 0; width: 32px; height: 32px; border-radius: ${px(resolve("radius.default"))}; background: ${cv("fill.primary")}; display: inline-flex; align-items: center; justify-content: center; }
.mc__brand-mark svg { width: 18px; height: 18px; color: ${cv("icon.onFill")}; }
.mc__dept-badge { flex-shrink: 0; }
.mc__topbar-end { display: flex; align-items: center; gap: ${px(resolve("dim.3"))}; flex-shrink: 0; }
.mc__user { width: 32px; height: 32px; }
.mc__body { flex: 1; display: flex; min-height: 0; }

/* full-width views that swap (list <-> detail), not a split pane */
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
.mc-thread__composer { flex-shrink: 0; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; box-shadow: ${composerShadowCss}; position: relative; }
/* in-thread composer upgrades: pre-send attachments sit above the field as
   Attachment COMPACT chips (recipe + row container declared with the compose
   dialog's, in the component section); the field itself is a 1-row textarea
   auto-growing to ~5 lines (JS caps at 120px), icons pinned to the bottom
   edge as it grows */
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

/* ---- v3 console: the list is a full-width Table under the toolbar ---- */
.mc-rail__topbar { flex-wrap: wrap; }
.mc-rail__lists { padding: 0 ${px(resolve("dim.4"))} ${px(resolve("dim.4"))}; overflow-x: auto; }
.mc-table { margin: 0; }
.mc-thead { display: grid; }
/* detail is full-page: a Back link is always visible now, subject shares the
   action row, content is a centered reading column */
.mc-thread__scroll { align-items: center; }
.mc-thread__scroll > * { width: 100%; max-width: 820px; }
.mc-thread__composer { display: flex; justify-content: center; }
.mc-thread__composer > * { width: 100%; max-width: 820px; }
.mc-thread__subject { order: 1; width: auto; flex: 1; }
.mc-thread__actions { margin-left: 0; }

@media (max-width: 767px) {
  .mc-table { min-width: 620px; } /* horizontal-scroll fallback until the mobile row reflow lands */
  .mc-thread__scroll > *, .mc-thread__composer > * { max-width: none; }
}
@media (min-width: 768px) {
  .mc-topbar-new { display: inline-flex; }
  .mc-fab { display: none; }
  .mc-rail__lists { padding-bottom: ${px(resolve("dim.4"))}; }
}
@media (min-width: 1024px) {
  .mc__topbar { padding: ${px(resolve("dim.4"))} ${px(resolve("dim.6"))}; }
  .mc-rail__lists { padding-left: ${px(resolve("dim.6"))}; padding-right: ${px(resolve("dim.6"))}; }
  .mc-thread__bar { padding-left: ${px(resolve("dim.6"))}; padding-right: ${px(resolve("dim.6"))}; }
}`;

// ---- New Message compose (two-column form + AI panel) & AI Writing Assist
// panel. The form reuses the Select / mc-field / rich Composer / Checkbox
// recipes above; only the column layout, the checks row, the subject counter,
// the mobile Edit/AI tab toggle, and the AI panel are new here. The AI panel
// is a composition of Bubble (chat) + Chip's action variant (suggestions) +
// Button/Select — every piece a real component, resolved from its token file. ----
const composeAiCss = `.mc-compose__tabs { display: none; flex-shrink: 0; }
.mc-compose__tabs .tabs--segmented { width: 100%; }
.mc-compose__tabs .tab__icon { flex-shrink: 0; width: 15px; height: 15px; }
.mc-compose__cols { flex: 1; min-height: 0; display: flex; }
.mc-compose__main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
/* the AI column is itself a flex column so the panel inside can fill its
   height (scroll grows, composer pins to the bottom) at every breakpoint */
.mc-compose__ai { display: flex; flex-direction: column; min-height: 0; }
.mc-compose__lead { margin: 0; color: ${cv("text.secondary")}; ${typoCss(bodySmType)} }
.mc-compose__lead[hidden] { display: none; }
.mc-compose__editor { display: flex; flex-direction: column; gap: ${px(resolve("dim.1"))}; }
.mc-compose__editor .composer { gap: ${px(resolve("dim.2"))}; }
.mc-compose__editor .composer__field { align-items: flex-start; }
.mc-compose__editor .composer__input { display: block; resize: none; min-height: 132px; max-height: 300px; overflow-y: auto; }
.mc-compose__counter { align-self: flex-end; color: ${cv("text.muted")}; font-size: 12px; font-family: ${cv("family.sans")}; }
.mc-compose__checks { display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.2"))} ${px(resolve("dim.6"))}; padding-top: ${px(resolve("dim.1"))}; }
.mc-compose__footer .btn { flex: 1; }

.mc-ai { position: relative; display: flex; flex-direction: column; min-height: 0; height: 100%; background: ${cv("surface.default")}; }
.mc-ai__scroll { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: ${px(resolve("dim.4"))}; padding: ${px(resolve("dim.4"))}; }
/* the title lives INSIDE the scroll (no static header bar — vertical space is
   tight); centered, and it scrolls away with the conversation */
.mc-ai__title { display: flex; align-items: center; justify-content: center; gap: ${px(resolve("dim.1_5"))}; margin: 0; color: ${cv("text.secondary")}; ${typoCss(headingSmType)} }
.mc-ai__spark { flex-shrink: 0; width: 16px; height: 16px; color: ${cv("icon.ai")}; }
/* collapse / close — a round handle straddling the panel edge (the ref's
   handle on the divider), not a header bar */
.mc-ai__handle { position: absolute; top: ${px(resolve("dim.3"))}; z-index: 2; width: 28px; height: 28px; border-radius: ${px(resolve("radius.full"))}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${lbShadowCss}; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; }
.mc-ai__handle:hover { background: ${cv("fill.neutralHover")}; }
.mc-ai__handle-icon { width: 18px; height: 18px; display: block; }
.mc-ai__handle--collapse { left: -14px; }
.mc-ai__handle--close { right: ${px(resolve("dim.3"))}; }
/* suggestions sit at the bottom of the empty panel (ref), pushed down by an
   auto top margin until the first chat bubble appears */
.mc-ai__suggestions { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; margin-top: auto; }
.mc-ai__suggestions[hidden] { display: none; }
.mc-ai__suggestions-label { margin: 0; color: ${cv("text.muted")}; ${typoCss(labelSmType)}${labelSmExt.textTransform ? ` text-transform: ${labelSmExt.textTransform};` : ""}${labelSmExt.letterSpacing ? ` letter-spacing: ${labelSmExt.letterSpacing};` : ""} }
.mc-ai__suggestions-list { display: flex; flex-direction: column; align-items: flex-start; gap: ${px(resolve("dim.2"))}; }
/* Bubble runs full-width in the narrow AI panel (its own 75% chat cap would
   leave it hugging one edge here) */
.mc-ai .bubble-row { max-width: 100%; }
.mc-ai__msg { display: flex; flex-direction: column; gap: ${px(resolve("dim.1_5"))}; }
/* sender line — who wrote it (You / the AI) + the time; the sparkle marks the
   assistant's turn as AI-authored */
.mc-ai__msg-head { display: flex; align-items: center; gap: ${px(resolve("dim.1"))}; color: ${cv("text.secondary")}; font-size: 12px; font-weight: 600; }
.mc-ai__msg-head--self { justify-content: flex-end; }
.mc-ai__msg-head .mc-ai__spark { width: 14px; height: 14px; }
.mc-ai__msg-time { color: ${cv("text.muted")}; font-weight: 400; }
.mc-ai__msg-actions { display: flex; flex-wrap: wrap; gap: ${px(resolve("dim.1_5"))}; margin-top: ${px(resolve("dim.0_5"))}; }
.mc-ai__composer { flex-shrink: 0; margin: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} ${px(resolve("dim.4"))}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; background: ${cv("surface.dim")}; padding: ${px(resolve("dim.2"))}; display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.mc-ai__composer:focus-within { border-color: ${cv("border.focus")}; }
/* value text is 14px here (not the 16px Safari-zoom size the message body
   uses) — a secondary side-panel input, 16px read oversized */
.mc-ai__input { border: none; outline: none; background: transparent; resize: none; min-height: 40px; max-height: 120px; color: ${cv("text.default")}; font-size: ${px(resolve("size.base"))}; line-height: ${resolve("leading.normal")}; font-family: ${cv("family.sans")}; }
.mc-ai__input::placeholder { color: ${cv("text.muted")}; }
.mc-ai__controls { display: flex; align-items: center; gap: ${px(resolve("dim.1"))}; }
.mc-ai__opt-lb { min-width: 132px; }
.mc-ai__opt { display: inline-flex; align-items: center; gap: 2px; border: none; background: transparent; padding: ${px(resolve("dim.1"))} ${px(resolve("dim.1_5"))}; border-radius: ${px(resolve("radius.xs"))}; cursor: pointer; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; font-size: 13px; }
.mc-ai__opt b { color: ${cv("text.default")}; font-weight: 600; }
.mc-ai__opt:hover { background: ${cv("fill.neutralHover")}; }
.mc-ai__opt-chevron { width: 16px; height: 16px; color: ${cv("icon.muted")}; }
.mc-ai__send { margin-left: auto; flex-shrink: 0; }

/* standalone AI panel (opened from the in-thread AI Assist) — Modal's own
   surface/shadow, a right-docked sheet on desktop, full-screen on mobile */
.mc-ai-standalone { border: none; padding: 0; background: ${cv(mdBg)}; box-shadow: ${mdShadowCss}; font-family: ${cv("family.sans")}; }
.mc-ai-standalone:focus, .mc-ai-standalone:focus-visible { outline: none; }
.mc-ai-standalone[open] { display: flex; flex-direction: column; }
.mc-ai-standalone::backdrop { background: ${cv(mdOverlay)}; }
.mc-ai-standalone .mc-ai { height: 100%; }

@media (max-width: 767px) {
  .mc-compose__tabs { display: block; padding: ${px(resolve("dim.3"))} ${px(resolve("dim.4"))} 0; }
  .mc-compose__cols { flex-direction: column; }
  .mc-compose:not(.mc-compose--tab-ai) .mc-compose__ai { display: none; }
  .mc-compose--tab-ai .mc-compose__main { display: none; }
  .mc-compose__ai { flex: 1; min-height: 0; }
  .mc-ai { height: auto; flex: 1; }
  .mc-ai__handle--collapse { display: none; }
  .mc-compose__lead { display: none; }
  .mc-ai-standalone { position: fixed; inset: 0; margin: 0; width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
}
@media (min-width: 768px) {
  .mc-compose__cols { flex-direction: row; }
  .mc-compose__ai { width: 340px; flex-shrink: 0; border-left: 1px solid ${cv(mdDivider)}; }
  .mc-compose:not(.mc-compose--ai-open) .mc-compose__ai { display: none; }
  .mc-compose.mc-compose--ai-open { width: min(920px, calc(100vw - ${px(resolve("dim.8"))})); }
  .mc-ai-standalone { width: min(400px, calc(100vw - ${px(resolve("dim.8"))})); height: 100dvh; max-height: 100dvh; margin: 0 0 0 auto; border-radius: 0; }
}`;

// ---- MC v3 console component recipes (Table / SplitButton / Skeleton /
// AvatarGroup), resolved from each new component's token file ----
const tblHPadX = px(resolve(tableTok.header.paddingX.$value));
const tblHPadY = px(resolve(tableTok.header.paddingY.$value));
const tblHLabelNode = get(tableTok.header.label.$value);
const tblHLabel = resolveToken(tblHLabelNode);
const tblHLabelExt = tblHLabelNode.$extensions?.["hp.design/text"] || {};
const tblRPadX = px(resolve(tableTok.row.paddingX.$value));
const tblRPadY = px(resolve(tableTok.row.paddingY.$value));
const tblRowGap = px(resolve(tableTok.row.gap.$value));
const tblCellText = resolveToken(tableTok.cell.text);
const tblUnread = { weight: resolve(tableTok.state.unread.weight.$value), color: refPath(tableTok.state.unread.color.$value) };
const tblRead = { weight: resolve(tableTok.state.read.weight.$value), color: refPath(tableTok.state.read.color.$value) };
const sbH = px(resolve(splitBtn.size.height.$value));
const sbPadX = px(resolve(splitBtn.size.paddingX.$value));
const sbGap = px(resolve(splitBtn.size.gap.$value));
const sbIcon = px(resolve(splitBtn.size.iconSize.$value));
const sbLabel = resolveToken(get(splitBtn.size.label.$value));
const sbChevW = px(resolve(splitBtn.size.chevronWidth.$value));
const sbRadius = px(resolve(splitBtn.radius.$value));
const skBase = refPath(skeletonTok.base.$value);
const skHi = refPath(skeletonTok.highlight.$value);
const skRadius = px(resolve(skeletonTok.radius.$value));
const skLineH = px(resolve(skeletonTok.line.height.$value));
const avgBaseD = px(resolve(avatarGroup.size.base.diameter.$value));
const avgBaseOv = px(resolve(avatarGroup.size.base.overlap.$value));
const avgSmD = px(resolve(avatarGroup.size.sm.diameter.$value));
const avgSmOv = px(resolve(avatarGroup.size.sm.overlap.$value));
const avgRingW = px(resolve(avatarGroup.ring.width.$value));
const avgMoreLabel = resolveToken(avatarGroup.overflow.label);
// Stepper
const stC = stepperTok.circle, stState = stepperTok.state;
const stCircleSize = px(resolve(stC.size.$value)), stCircleLabel = resolveToken(stC.label), stCircleIcon = px(resolve(stC.iconSize.$value));
const stGap = px(resolve(stepperTok.gap.$value)), stConn = px(resolve(stepperTok.connector.thickness.$value)), stTextType = resolveToken(get(stepperTok.text.$value));
// DatePicker
const dpT = datePickerTok.trigger, dpP = datePickerTok.panel, dpHd = datePickerTok.header, dpWd = datePickerTok.weekday, dpDay = datePickerTok.day;
const dpTh = px(resolve(dpT.height.$value)), dpTpadX = px(resolve(dpT.paddingX.$value)), dpTgap = px(resolve(dpT.gap.$value)), dpTradius = px(resolve(dpT.radius.$value)), dpTvalue = resolveToken(get(dpT.value.$value)), dpTicon = px(resolve(dpT.iconSize.$value));
const dpPshadow = resolveToken(dpP.shadow); const dpPshadowCss = `${px(dpPshadow.offsetX)} ${px(dpPshadow.offsetY)} ${px(dpPshadow.blur)} ${px(dpPshadow.spread)} ${dpPshadow.color}`;
const dpPradius = px(resolve(dpP.radius.$value)), dpPpad = px(resolve(dpP.padding.$value)), dpHdLabel = resolveToken(get(dpHd.label.$value)), dpNavSize = px(resolve(dpHd.navSize.$value));
const dpWdNode = get(dpWd.label.$value); const dpWdLabel = resolveToken(dpWdNode); const dpWdExt = dpWdNode.$extensions?.["hp.design/text"] || {};
const dpDaySize = px(resolve(dpDay.size.$value)), dpDayRadius = px(resolve(dpDay.radius.$value)), dpDayLabel = resolveToken(get(dpDay.label.$value));
// Stat
const statValue = resolveToken(get(statTok.value.$value)), statLabel = resolveToken(get(statTok.label.$value));

const consoleCss = `/* ---- Table (threads console) ---- */
.mc-table { box-sizing: border-box; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve(tableTok.radius.$value))}; overflow: hidden; }
.mc-trow { display: grid; align-items: center; gap: ${tblRowGap}; padding: ${tblRPadY} ${tblRPadX}; border-bottom: 1px solid ${cv(refPath(tableTok.row.divider.$value))}; }
.mc-trow:last-child { border-bottom: none; }
.mc-thead { padding: ${tblHPadY} ${tblHPadX}; border-bottom: 1px solid ${cv(refPath(tableTok.header.divider.$value))}; }
.mc-th { color: ${cv(refPath(tableTok.header.labelColor.$value))}; ${typoCss(tblHLabel)}${tblHLabelExt.textTransform ? ` text-transform: ${tblHLabelExt.textTransform};` : ""}${tblHLabelExt.letterSpacing ? ` letter-spacing: ${tblHLabelExt.letterSpacing};` : ""} white-space: nowrap; min-width: 0; }
.mc-td { color: ${cv(refPath(tableTok.cell.textColor.$value))}; ${typoCss(tblCellText)} min-width: 0; }
.mc-td--muted { color: ${cv(refPath(tableTok.cell.mutedColor.$value))}; }
/* the row keeps its .thread-item-inbox JS hooks (state classes / data attrs /
   flag button / scope badge) — .mc-trow only restyles it as a grid table row,
   overriding the old flex list-row look */
.mc-trow { display: grid; align-items: center; cursor: pointer; }
.mc-trow.thread-item-inbox--read { background: ${cv("surface.default")}; } /* no gray read rows in a table */
.mc-trow:focus-visible { outline: 2px solid ${cv("border.focus")}; outline-offset: -2px; }
.mc-lead { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thread-item-inbox--unread .mc-lead { font-weight: ${tblUnread.weight}; color: ${cv(tblUnread.color)}; }
.thread-item-inbox--read .mc-lead { font-weight: ${tblRead.weight}; color: ${cv(tblRead.color)}; }
.mc-cellwrap { display: flex; align-items: center; gap: ${px(resolve("dim.2_5"))}; min-width: 0; }
.mc-cellstack { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.mc-td .badge { flex-shrink: 0; }
/* console column template — desktop: Student | Subject & Message | Responsible | Expiration | Date | flag */
.mc-console-cols { grid-template-columns: 1.6fr 2.4fr 1fr 0.9fr 0.7fr 28px; gap: ${tblRowGap}; padding: ${tblRPadY} ${tblRPadX}; }

/* ---- SplitButton ("New Message v") ---- */
.mc-split { display: inline-flex; align-items: stretch; height: ${sbH}; border-radius: ${sbRadius}; font-family: ${cv("family.sans")}; }
.mc-split__main, .mc-split__chevron { border: none; background: ${cv("fill.primary")}; color: ${cv("text.onFill")}; cursor: pointer; display: inline-flex; align-items: center; }
.mc-split__main { gap: ${sbGap}; padding: 0 ${sbPadX}; border-radius: ${sbRadius} 0 0 ${sbRadius}; ${typoCss(sbLabel)} white-space: nowrap; }
.mc-split__chevron { justify-content: center; width: ${sbChevW}; padding: 0; border-radius: 0 ${sbRadius} ${sbRadius} 0; border-left: 1px solid ${cv(refPath(splitBtn.divider.$value))}; }
.mc-split .btn__icon, .mc-split .split-icon { width: ${sbIcon}; height: ${sbIcon}; color: ${cv("icon.onFill")}; }
.mc-split__main:hover, .mc-split__chevron:hover { background: ${cv("fill.primaryHover")}; }
.mc-split__main:active, .mc-split__chevron:active { background: ${cv("fill.primaryActive")}; }
.mc-split__main:focus-visible, .mc-split__chevron:focus-visible { outline: ${px(resolve(splitBtn.focus.ringWidth.$value))} solid ${cv("border.focus")}; outline-offset: ${px(resolve(splitBtn.focus.ringOffset.$value))}; }

/* ---- Skeleton ---- */
.mc-skel { display: block; border-radius: ${skRadius}; background: ${cv(skBase)}; background-image: linear-gradient(90deg, ${cv(skBase)} 0, ${cv(skHi)} 40px, ${cv(skBase)} 80px); background-size: 600px 100%; background-repeat: no-repeat; animation: mc-skel-shimmer 1400ms linear infinite; }
.mc-skel--line { height: ${skLineH}; }
.mc-skel--circle { border-radius: ${px(resolve("radius.full"))}; }
@keyframes mc-skel-shimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
@media (prefers-reduced-motion: reduce) { .mc-skel { animation: none; } }

/* ---- AvatarGroup (group recipient stack) ---- */
.mc-avg { display: inline-flex; align-items: center; }
.mc-avg__item { box-sizing: border-box; position: relative; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; border-radius: ${px(resolve("radius.full"))}; border: 1px solid ${cv("border.default")}; box-shadow: 0 0 0 ${avgRingW} ${cv(refPath(avatarGroup.ring.color.$value))}; font-family: ${cv("family.sans")}; }
.mc-avg__item:not(:first-child) { margin-left: var(--avg-ov); }
.mc-avg__more { color: ${cv(refPath(avatarGroup.overflow.text.$value))}; background: ${cv(refPath(avatarGroup.overflow.bg.$value))}; ${typoCss(avgMoreLabel)} }
.mc-avg--base { --avg-ov: -${avgBaseOv}; }
.mc-avg--base .mc-avg__item { width: ${avgBaseD}; height: ${avgBaseD}; }
.mc-avg--sm { --avg-ov: -${avgSmOv}; }
.mc-avg--sm .mc-avg__item { width: ${avgSmD}; height: ${avgSmD}; }

/* ---- Stepper (group wizard) ---- */
.mc-step { display: flex; align-items: center; font-family: ${cv("family.sans")}; }
.mc-step__item { display: inline-flex; align-items: center; gap: ${stGap}; flex-shrink: 0; }
.mc-step__circle { box-sizing: border-box; flex-shrink: 0; width: ${stCircleSize}; height: ${stCircleSize}; border-radius: ${px(resolve("radius.full"))}; display: inline-flex; align-items: center; justify-content: center; ${typoCss(stCircleLabel)} }
.mc-step__check { width: ${stCircleIcon}; height: ${stCircleIcon}; display: none; }
.mc-step__label { ${typoCss(stTextType)} white-space: nowrap; }
.mc-step__connector { flex: 1; min-width: 24px; height: ${stConn}; background: ${cv(refPath(stepperTok.connector.color.$value))}; margin: 0 ${stGap}; }
.mc-step__connector--filled { background: ${cv(refPath(stepperTok.connector.completeColor.$value))}; }
.mc-step__item--inactive .mc-step__circle { background: ${cv(refPath(stState.inactive.circleBg.$value))}; color: ${cv(refPath(stState.inactive.circleText.$value))}; }
.mc-step__item--inactive .mc-step__label { color: ${cv(refPath(stState.inactive.labelColor.$value))}; }
.mc-step__item--active .mc-step__circle { background: ${cv(refPath(stState.active.circleBg.$value))}; color: ${cv(refPath(stState.active.circleText.$value))}; }
.mc-step__item--active .mc-step__label { color: ${cv(refPath(stState.active.labelColor.$value))}; }
.mc-step__item--complete .mc-step__circle { background: ${cv(refPath(stState.complete.circleBg.$value))}; color: ${cv(refPath(stState.complete.circleIcon.$value))}; }
.mc-step__item--complete .mc-step__label { color: ${cv(refPath(stState.complete.labelColor.$value))}; }
.mc-step__item--complete .mc-step__num { display: none; }
.mc-step__item--complete .mc-step__check { display: block; }

/* ---- DatePicker (expiration) ---- */
.mc-dp { display: inline-block; font-family: ${cv("family.sans")}; }
.mc-dp__trigger { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${dpTgap}; height: ${dpTh}; padding: 0 ${dpTpadX}; border-radius: ${dpTradius}; background: ${cv(refPath(dpT.bg.$value))}; border: 1px solid ${cv(refPath(dpT.border.$value))}; cursor: pointer; color: ${cv(refPath(dpT.valueColor.$value))}; ${typoCss(dpTvalue)} font-family: inherit; }
.mc-dp__trigger:hover { border-color: ${cv(refPath(dpT.borderHover.$value))}; }
.mc-dp__trigger:focus-visible { outline: none; border-color: ${cv(refPath(dpT.borderFocus.$value))}; }
.mc-dp__cal, .mc-dp__chev { width: ${dpTicon}; height: ${dpTicon}; color: ${cv(refPath(dpT.icon.$value))}; flex-shrink: 0; }
.mc-dp__chev { margin-left: auto; }
.mc-dp__panel { margin: 0; box-sizing: border-box; padding: ${dpPpad}; border-radius: ${dpPradius}; background: ${cv(refPath(dpP.bg.$value))}; border: 1px solid ${cv(refPath(dpP.border.$value))}; box-shadow: ${dpPshadowCss}; font-family: ${cv("family.sans")}; }
.mc-dp__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.mc-dp__month { ${typoCss(dpHdLabel)} color: ${cv(refPath(dpHd.labelColor.$value))}; }
.mc-dp__nav { width: ${dpNavSize}; height: ${dpNavSize}; display: inline-flex; align-items: center; justify-content: center; border: none; background: none; border-radius: ${px(resolve("radius.default"))}; cursor: pointer; color: ${cv(refPath(dpHd.navIcon.$value))}; }
.mc-dp__nav:hover { background: ${cv(refPath(dpHd.navHoverBg.$value))}; }
.mc-dp__nav svg { width: 20px; height: 20px; }
.mc-dp__grid { display: grid; grid-template-columns: repeat(7, ${dpDaySize}); gap: 2px; }
.mc-dp__wd { width: ${dpDaySize}; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: ${cv(refPath(dpWd.color.$value))}; ${typoCss(dpWdLabel)}${dpWdExt.textTransform ? ` text-transform: ${dpWdExt.textTransform};` : ""}${dpWdExt.letterSpacing ? ` letter-spacing: ${dpWdExt.letterSpacing};` : ""} }
.mc-dp__day { width: ${dpDaySize}; height: ${dpDaySize}; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; background: none; border-radius: ${dpDayRadius}; cursor: pointer; color: ${cv(refPath(dpDay.color.$value))}; ${typoCss(dpDayLabel)} font-family: inherit; }
.mc-dp__day:hover { background: ${cv(refPath(dpDay.hoverBg.$value))}; }
.mc-dp__day--outside { color: ${cv(refPath(dpDay.outsideColor.$value))}; }
.mc-dp__day--today { border-color: ${cv(refPath(dpDay.todayBorder.$value))}; }
.mc-dp__day--selected, .mc-dp__day--selected:hover { background: ${cv(refPath(dpDay.selectedBg.$value))}; color: ${cv(refPath(dpDay.selectedText.$value))}; border-color: ${cv(refPath(dpDay.selectedBg.$value))}; }

/* ---- Stat (group delivery tiles) ---- */
.mc-stat { box-sizing: border-box; display: flex; flex-direction: column; gap: ${px(resolve(statTok.gap.$value))}; padding: ${px(resolve(statTok.padding.$value))}; background: ${cv(refPath(statTok.surface.$value))}; border: 1px solid ${cv(refPath(statTok.border.$value))}; border-radius: ${px(resolve(statTok.radius.$value))}; }
.mc-stat__value { color: ${cv(refPath(statTok.valueColor.$value))}; ${typoCss(statValue)} }
.mc-stat__label { color: ${cv(refPath(statTok.labelColor.$value))}; ${typoCss(statLabel)} }
.mc-stat--success .mc-stat__value { color: ${cv(refPath(statTok.role.success.$value))}; }`;

const appCss = `${rootVars}

${componentCss}

${consoleCss}

${layoutCss}

${composeAiCss}`;

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
    id: "cait-minor", archived: false, unread: true, awaiting: true, replies: true,
    sender: "Cait Genatossio", handledBy: "Alexander Robinson",
    department: "Academic Advising", date: "08/05/2026", subject: "Minor Requirements Review",
    preview: "Could we also review the minor requirements before enrollment closes?",
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Cait Genatossio", meta: "Aug 05, 9:12 AM", text: "Hi! Could we also review the minor requirements before enrollment closes? I want to be sure the art history courses count." }),
    ],
  },
  {
    id: "maya-hold", archived: false, unread: true, awaiting: true, unassigned: true, replies: true,
    sender: "Maya Patel",
    department: "Academic Advising", date: "08/04/2026", subject: "Registration Hold Question",
    preview: "There is a hold on my account and I can't register for the fall term.",
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Maya Patel", meta: "Aug 04, 4:47 PM", text: "There is a hold on my account and I can't register for the fall term. Could you tell me what it is about?" }),
    ],
  },
  {
    id: "diego-transcript", archived: false, replies: true,
    sender: "Diego Fernandez", handledBy: "Ava Robinson",
    department: "Academic Advising", date: "08/03/2026", subject: "Transcript for Internship Application",
    preview: "My internship application needs an official transcript by next Friday.",
    expires: { label: "Due 08/10/2026", role: "warning" },
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Diego Fernandez", meta: "Aug 03, 11:20 AM", text: "My internship application needs an official transcript by next Friday. Attaching the offer letter for context.", attachmentHtml: attachmentMarkup("Internship-offer.pdf", "PDF · 420 KB") }),
    ],
  },
  {
    id: "george-reschedule", archived: false, replies: true, replied: true,
    sender: "George Amalor", handledBy: "Alexander Robinson",
    department: "Academic Advising", date: "07/31/2026", subject: "Reschedule Advising Appointment",
    preview: "Sure — I moved your appointment to Tuesday at 3 PM.",
    meta: { Department: "Academic Advising", Status: "Open", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "George Amalor", meta: "Jul 31, 8:02 AM", text: "Could we reschedule my advising appointment to next week?" }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jul 31, 9:15 AM", text: "Sure — I moved your appointment to Tuesday at 3 PM. Let me know if that works." }),
    ],
  },
  {
    id: "lena-waiver", archived: true, replies: true, replied: true,
    sender: "Lena Hoffman", handledBy: "Alexander Robinson",
    department: "English Dept", date: "07/18/2026", subject: "Prerequisite Waiver",
    preview: "Waiver approved — you are clear to enroll in ENG 340.",
    meta: { Department: "English Dept", Status: "Resolved", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Lena Hoffman", meta: "Jul 17, 2:30 PM", text: "I am requesting a prerequisite waiver for ENG 340 based on my transfer credits." }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jul 18, 10:05 AM", text: "Waiver approved — you are clear to enroll in ENG 340." }),
    ],
  },
  {
    id: "tomas-plan", archived: true, replies: true, replied: true,
    sender: "Tomas Novak", handledBy: "Ava Robinson",
    department: "Academic Advising", date: "06/30/2026", subject: "Study Plan Check-in",
    preview: "All set — see you at the fall check-in.",
    meta: { Department: "Academic Advising", Status: "Resolved", Institution: "PeopleSoft University" },
    content: [
      bubbleRow({ role: "other", name: "Tomas Novak", meta: "Jun 30, 3:12 PM", text: "Can we confirm my study plan is still on track after the schedule change?" }),
      bubbleRow({ role: "self", name: SELF.name, meta: "Jun 30, 3:40 PM", text: "All set — see you at the fall check-in." }),
    ],
  },
];

// Row is a <div role="button"> — it nests a real flag toggle <button>, and a
// real button can't nest another (same resolution as Attachment's idle shape).
// The scope badge (Inbox/Archived) is always in the DOM, shown via CSS only
// while searching, when both lists render as one combined result set.
// v3 table row — a grid of cells (Student / Subject & Message / Responsible /
// Expiration / Date / flag). Keeps every .thread-item-inbox JS hook (state
// classes, data attrs, the flag <button>, the .thread-item-inbox__scope badge
// inside .thread-item-inbox__expires) so applyFilter / bindRow / bindArchive
// keep working unchanged; only the inner layout became table cells.
function rowMarkup(t, idx) {
  // Responsible = whoever replied last (advisory), "–" when none — replaces the
  // old Handled by / Unassigned vocabulary per the real product
  const responsible = t.handledBy || "–";
  const exp = t.expires ? `<span class="badge badge--sm badge--role-${t.expires.role}">${t.expires.label}</span>` : `<span class="mc-td--muted">–</span>`;
  const scope = `<span class="badge badge--sm badge--role-${t.archived ? "neutral" : "primary"} thread-item-inbox__scope">${t.archived ? "Resolved" : "Inbox"}</span>`;
  return `<div class="thread-item-inbox mc-trow mc-console-cols thread-item-inbox--${t.unread ? "unread" : "read"}" role="button" tabindex="0" data-thread="${t.id}" data-idx="${idx}" data-subject="${esc(t.subject)}" data-department="${esc(t.department)}"${t.expires ? ` data-expires="${t.expires.role}"` : ""}>
        <div class="mc-td mc-cellwrap">${avatarMarkup(t.sender || t.department, "sm")}<span class="mc-cellstack"><span class="mc-lead">${t.sender || t.department}</span><span class="mc-td--muted" style="font-size:12px">${t.department}</span></span></div>
        <div class="mc-td mc-cellstack"><span class="mc-lead">${t.subject}</span><span class="mc-td--muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.preview}</span></div>
        <div class="mc-td mc-td--muted mc-col-responsible">${responsible}</div>
        <div class="mc-td mc-col-expiration thread-item-inbox__expires">${exp}${scope}</div>
        <div class="mc-td mc-td--muted" style="text-align:right;white-space:nowrap">${t.date}</div>
        <div class="mc-td"><button class="thread-item-inbox__flag-btn" type="button" aria-pressed="${t.flagged ? "true" : "false"}" aria-label="Flag thread">${iconFlagOutlined}${iconFlagFilled}</button></div>
      </div>`;
}

function switchMarkup(checked) {
  return `<label class="switch"><input type="checkbox" class="switch__input"${checked ? " checked" : ""} /><span class="switch__track"><span class="switch__thumb"></span></span></label>`;
}

// Checkbox — the compose dialog's Allow Replies + Expire Thread controls
// (real component, its own recipe; compose uses checkboxes per explicit
// request, unlike the thread composer's Switch)
function checkboxMarkup(label, { checked = false, id } = {}) {
  return `<label class="checkbox"><input type="checkbox" class="checkbox__input" id="${id}"${checked ? " checked" : ""} /><span class="checkbox__box">${iconCheckboxCheck}</span><span class="checkbox__label">${label}</span></label>`;
}

// ---- AI Writing Assist panel — a composition of real components: Chip's new
// action variant (suggestions), Bubble (chat), Button (send / copy / regen /
// collapse), plus small Tone/Length cyclers. Rendered twice (compose column +
// standalone overlay), so it's one template keyed by a prefix. ----
const AI_SUGGESTIONS = ["Registration reminder", "Missed appointment", "Check-in message", "Exam preparation", "Schedule meeting"];
const AI_TONES = ["Formal", "Friendly", "Concise"];
const AI_LENGTHS = ["Short", "Medium", "Long"];
function actionChipMarkup(label) {
  return `<button type="button" class="chip chip--base chip--action" data-ai-suggestion="${esc(label)}"><span class="chip__label">${label}</span>${iconChipArrow}</button>`;
}
// Tone / Length — real single-select dropdowns (Listbox popover), one per
// panel instance, IDs namespaced by the panel prefix so the two panels don't
// collide. Reuses Listbox's own recipe verbatim.
function aiOptMarkup(prefix, kind, options) {
  const cap = kind[0].toUpperCase() + kind.slice(1);
  const lbId = `${prefix}-${kind}-lb`;
  const opts = options
    .map((o, i) => `<li><button type="button" class="listbox__option${i === 0 ? " listbox__option--selected" : ""}" role="option" aria-selected="${i === 0 ? "true" : "false"}" data-val="${esc(o)}">${o}${iconCheckmark}</button></li>`)
    .join("\n            ");
  return `<button type="button" class="mc-ai__opt" data-ai-opt="${kind}" popovertarget="${lbId}" aria-haspopup="listbox">${cap}: <b>${options[0]}</b>${iconMiniChevron}</button>
        <div class="listbox mc-ai__opt-lb" id="${lbId}" popover>
          <ul class="listbox__list" role="listbox" aria-label="${cap}">
            ${opts}
          </ul>
        </div>`;
}
function aiPanelMarkup(prefix, headerAction = "") {
  return `<div class="mc-ai" data-ai="${prefix}">
      ${headerAction}
      <div class="mc-ai__scroll" data-ai-scroll>
        <p class="mc-ai__title">${iconAiSpark}AI Writing Assist</p>
        <div class="mc-ai__suggestions" data-ai-suggestions>
          <p class="mc-ai__suggestions-label">Suggestions</p>
          <div class="mc-ai__suggestions-list">
            ${AI_SUGGESTIONS.map(actionChipMarkup).join("\n            ")}
          </div>
        </div>
      </div>
      <div class="mc-ai__composer">
        <textarea class="mc-ai__input" data-ai-input rows="1" placeholder="Ask AI to write or improve a message..." aria-label="Ask AI to write or improve a message"></textarea>
        <div class="mc-ai__controls">
          ${aiOptMarkup(prefix, "tone", AI_TONES)}
          ${aiOptMarkup(prefix, "length", AI_LENGTHS)}
          <button type="button" class="btn btn--primary btn--sm btn--icon-only mc-ai__send" data-ai-send aria-label="Ask AI">${iconAiSend}</button>
        </div>
      </div>
    </div>`;
}
// the staff reply composer IS Composer's rich variant — its docs recipe
// verbatim (toolbar B/I/U + Merge Tags + AI Assist, field, Allow Replies
// Switch + Expiration row, labeled primary Send)
function richComposerMarkup(t) {
  const first = t.sender.split(" ")[0];
  return `<form class="composer composer--rich mc-composer" data-thread="${t.id}">
            <div class="composer__toolbar">
              <button type="button" class="composer__icon-btn" aria-label="Bold">${iconBold}</button>
              <button type="button" class="composer__icon-btn" aria-label="Italic">${iconItalic}</button>
              <button type="button" class="composer__icon-btn" aria-label="Underline">${iconUnderline}</button>
              <button type="button" class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button>
              <button type="button" class="composer__ai-assist">${iconAi}AI Assist</button>
            </div>
            <div class="composer__field">
              <textarea class="composer__input" rows="1" placeholder="Reply to ${first}..." aria-label="Reply to ${first}"></textarea>
            </div>
            <div class="composer__settings">
              <div class="composer__settings-row"><span class="composer__settings-label">Allow Replies</span>${switchMarkup(true)}</div>
              <div class="composer__settings-row"><span class="composer__settings-label">Expiration</span><button type="button" class="composer__expiration-trigger">Aug 15, 2026 ${iconChevronRight}</button></div>
            </div>
            <button type="submit" class="btn btn--primary btn--base composer__send">${iconSend}Send</button>
          </form>`;
}

function threadPane(t) {
  const resolveBtn = t.archived ? "" : `<button class="btn btn--secondary btn--sm mc-archive" type="button" data-thread="${t.id}">Resolve</button>`;
  const handled = t.handledBy
    ? `<span class="mc-thread__meta-line">Handled by ${t.handledBy}</span>`
    : `<span class="badge badge--sm badge--role-warning">Unassigned</span>`;
  return `<article class="mc-thread" data-thread="${t.id}" hidden>
        <header class="mc-thread__bar">
          <button class="btn btn--ghost btn--sm mc-thread__back" type="button">${iconBack}Back</button>
          <div class="mc-thread__actions">
            ${resolveBtn}
            <button class="btn btn--secondary btn--sm btn--icon-only mc-print" type="button" aria-label="Print thread">${iconPrint}</button>
          </div>
          <h2 class="mc-thread__subject">${t.subject}</h2>
          <div class="mc-thread__tags">
            <span class="mc-thread__meta-line">${t.sender} · ${t.department}</span>
            ${handled}
            ${t.awaiting ? `<span class="badge badge--sm badge--role-primary">Awaiting reply</span>` : ""}
            ${t.expires ? `<span class="badge badge--sm badge--role-${t.expires.role}">${t.expires.label}</span>` : ""}
            ${t.archived ? `<span class="badge badge--sm badge--role-neutral">Resolved</span>` : ""}
          </div>
        </header>
        <div class="mc-thread__scroll">
          ${t.content.join("\n          ")}
        </div>
        <footer class="mc-thread__composer">
          ${richComposerMarkup(t)}
        </footer>
      </article>`;
}

const inboxThreads = threads.filter((t) => !t.archived);
const archivedThreads = threads.filter((t) => t.archived);

// Department filter options — single-select: "All departments" or exactly one.
const departments = [...new Set(threads.map((t) => t.department))];


// ---- the appended-on-Send self bubble template, reused by the app script.
// Static sender markup is generated here at build time (same avatar recipe);
// the user's text is injected via textContent, never innerHTML. ----
const selfBubbleSender = `<div class="bubble-sender"><p class="bubble-sender__text"><span class="bubble-sender__name">${SELF.name}</span> <span class="bubble-sender__meta">-- Just now</span></p><span class="avatar avatar--${SELF.hue} avatar--sm" role="img" aria-label="${SELF.name}"><span class="avatar__initials">${SELF.initials}</span></span></div>`;

// ---- New Message compose dialog + Discard confirm + standalone AI panel.
// The department list is a little richer than the inbox's own two, so the
// compose picker reads like a real staff-side sender-department choice. ----
const composeDepartments = ["Academic Advising", "Student Records", "Financial Aid", "Office of the Registrar", "English Dept"];
// collapse / close as a round handle straddling the panel edge (per ref), not
// a full-width header bar
const composeCollapseAction = `<button type="button" class="mc-ai__handle mc-ai__handle--collapse" data-ai-collapse aria-label="Hide AI panel">${iconHandleCollapse}</button>`;
const composeCloseAction = `<button type="button" class="mc-ai__handle mc-ai__handle--close" data-ai-close aria-label="Close AI panel">${iconHandleClose}</button>`;

const composeMarkup = `<dialog class="mc-compose" id="mc-compose" aria-labelledby="mc-compose-title">
  <header class="mc-compose__header">
    <h2 class="mc-compose__title" id="mc-compose-title">New Message</h2>
    <button class="btn btn--ghost btn--sm btn--icon-only mc-compose__close" id="mc-compose-close" type="button" aria-label="Close">${iconCloseBtn}</button>
  </header>
  <div class="mc-compose__tabs">
    <div class="tabs tabs--segmented tabs--sm" role="tablist" aria-label="Compose mode">
      <button class="tab tab--sm tab--active" role="tab" aria-selected="true" data-ctab="edit" type="button">Edit message</button>
      <button class="tab tab--sm" role="tab" aria-selected="false" data-ctab="ai" type="button">${iconAiTabSpark}AI writing assist</button>
    </div>
  </div>
  <div class="mc-compose__cols">
    <div class="mc-compose__main">
      <div class="mc-compose__body">
        <p class="mc-compose__lead">Compose and send a new message on behalf of your department.</p>
        <button class="select select--base select--resting" id="mc-compose-dept" type="button" popovertarget="mc-compose-dept-lb">
          <span class="select__stack"><span class="select__label">Department</span><span class="select__value" id="mc-compose-dept-value">Department</span></span>
          ${iconChevronSelect}
        </button>
        <div class="listbox" id="mc-compose-dept-lb" popover>
          <ul class="listbox__list" role="listbox" aria-label="Department">
            ${composeDepartments.map((d) => `<li><button class="listbox__option" role="option" aria-selected="false" data-dept="${esc(d)}" type="button">${d}${iconCheckmark}</button></li>`).join("\n            ")}
          </ul>
        </div>
        <label class="mc-field">
          <span class="mc-field__label">Subject</span>
          <input class="mc-field__control" id="mc-compose-subject" maxlength="50" placeholder="Subject" aria-label="Subject" />
        </label>
        <span class="mc-compose__counter" id="mc-compose-counter">0/50</span>
        <div class="mc-compose__editor">
          <form class="composer composer--rich" onsubmit="return false">
            <div class="composer__toolbar">
              <button type="button" class="composer__icon-btn" aria-label="Bold">${iconBold}</button>
              <button type="button" class="composer__icon-btn" aria-label="Italic">${iconItalic}</button>
              <button type="button" class="composer__icon-btn" aria-label="Underline">${iconUnderline}</button>
              <button type="button" class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button>
              <button type="button" class="composer__ai-assist" id="mc-compose-ai-assist">${iconAi}AI Assist</button>
            </div>
            <div class="composer__field">
              <textarea class="composer__input" id="mc-compose-message" rows="1" placeholder="Write your message..." aria-label="Message"></textarea>
            </div>
          </form>
        </div>
        <div class="mc-compose__checks">
          ${checkboxMarkup("Allow Replies", { checked: true, id: "mc-compose-allow" })}
          ${checkboxMarkup("Expire Thread", { checked: false, id: "mc-compose-expire" })}
        </div>
      </div>
      <footer class="mc-compose__footer">
        <button class="btn btn--secondary btn--base" id="mc-compose-draft" type="button">Draft</button>
        <button class="btn btn--primary btn--base" id="mc-compose-send" type="button" disabled>Send Message</button>
      </footer>
    </div>
    <div class="mc-compose__ai">
      ${aiPanelMarkup("compose", composeCollapseAction)}
    </div>
  </div>
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
<dialog class="mc-ai-standalone" id="mc-ai-standalone" aria-label="AI Writing Assist">
  ${aiPanelMarkup("standalone", composeCloseAction)}
</dialog>`;

// ---- New Group Message wizard (Modal + Stepper): step 1 select students,
// step 2 message details (reuses Select/mc-field/rich Composer/Checkbox +
// the new DatePicker + AI Assist). Send fans out to a grouped card in Resolved. ----
const gwizStudents = [
  { id: "CX0001", name: "Cait Genatossio" }, { id: "CX0002", name: "Calam Xavier" },
  { id: "AA0367", name: "Allison Rao" }, { id: "AA0215", name: "Maya Okafor" },
  { id: "AA0007", name: "L Arcos" }, { id: "AA0412", name: "Dana Torres" },
];
const gwizCss = `.mc-gwiz { border: none; padding: 0; background: ${cv(mdBg)}; font-family: ${cv("family.sans")}; }
.mc-gwiz:focus, .mc-gwiz:focus-visible { outline: none; }
.mc-gwiz[open] { display: flex; flex-direction: column; }
.mc-gwiz::backdrop { background: ${cv(mdOverlay)}; }
.mc-gwiz__header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: ${px(resolve("dim.4"))} ${mdPadding} ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv(mdDivider)}; }
.mc-gwiz__title { margin: 0; color: ${cv(mdTitleColor)}; ${typoCss(mdTitleType)} }
.mc-gwiz__steps { flex-shrink: 0; padding: ${px(resolve("dim.4"))} ${mdPadding}; border-bottom: 1px solid ${cv(mdDivider)}; }
.mc-gwiz__body { flex: 1; min-height: 0; overflow-y: auto; padding: ${mdPadding}; }
.mc-gwiz__step[hidden] { display: none; }
.mc-gwiz__cols { display: grid; grid-template-columns: 1.3fr 1fr; gap: ${px(resolve("dim.4"))}; }
.mc-gwiz__hint { margin: 0 0 ${px(resolve("dim.2"))}; color: ${cv("text.secondary")}; ${typoCss(bodySmType)} }
.mc-gwiz__list { border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; overflow: hidden; margin-bottom: ${px(resolve("dim.4"))}; }
.mc-gwiz__srow { display: flex; align-items: center; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.2_5"))} ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv("border.default")}; }
.mc-gwiz__srow:last-child { border-bottom: none; }
.mc-gwiz__sid { color: ${cv("text.default")}; font-weight: 600; ${typoCss(bodySmType)} width: 64px; flex-shrink: 0; }
.mc-gwiz__sname { color: ${cv("text.secondary")}; ${typoCss(bodySmType)} flex: 1; min-width: 0; }
.mc-gwiz__add { border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; font-weight: 600; ${typoCss(bodySmType)} font-family: inherit; }
.mc-gwiz__srow--added .mc-gwiz__add { color: ${cv("text.success")}; cursor: default; }
.mc-gwiz__paste { display: flex; gap: ${px(resolve("dim.2"))}; }
.mc-gwiz__paste input { flex: 1; min-width: 0; box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; background: ${cv("surface.dim")}; color: ${cv("text.default")}; ${typoCss(inputValueType)} font-family: ${cv("family.sans")}; }
.mc-gwiz__selected { background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; padding: ${px(resolve("dim.3"))}; align-self: start; }
.mc-gwiz__sel-head { margin: 0 0 ${px(resolve("dim.2"))}; color: ${cv("text.default")}; font-weight: 600; ${typoCss(bodySmType)} }
.mc-gwiz__chips { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.mc-gwiz__chips:empty::after { content: "No selected students"; color: ${cv("text.muted")}; ${typoCss(bodySmType)} }
.mc-gwiz__chip { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; padding: ${px(resolve("dim.1_5"))} ${px(resolve("dim.2"))}; }
.mc-gwiz__chip b { color: ${cv("text.default")}; ${typoCss(bodySmType)} }
.mc-gwiz__chip span { color: ${cv("text.secondary")}; ${typoCss(bodySmType)} flex: 1; min-width: 0; }
.mc-gwiz__chip button { flex-shrink: 0; border: none; background: none; padding: 0; cursor: pointer; color: ${cv("icon.secondary")}; display: inline-flex; }
.mc-gwiz__chip button svg { width: 16px; height: 16px; }
.mc-gwiz__frow { display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.2_5"))} 0; border-bottom: 1px solid ${cv(mdDivider)}; }
.mc-gwiz__flabel { color: ${cv("text.muted")}; width: 56px; flex-shrink: 0; ${typoCss(bodySmType)} }
.mc-gwiz__fval { color: ${cv("text.default")}; ${typoCss(bodySmType)} flex: 1; }
.mc-gwiz__edit { margin-left: auto; border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; font-weight: 600; ${typoCss(bodySmType)} font-family: inherit; }
.mc-gwiz__body .mc-field, .mc-gwiz__body .mc-compose__editor { margin-top: ${px(resolve("dim.3"))}; }
.mc-gwiz__exp { display: flex; align-items: center; gap: ${px(resolve("dim.3"))}; margin-top: ${px(resolve("dim.3"))}; }
.mc-gwiz__exp-label { color: ${cv("text.default")}; ${typoCss(bodySmType)} }
.mc-gwiz__footer { flex-shrink: 0; display: flex; justify-content: space-between; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.4"))} ${mdPadding}; border-top: 1px solid ${cv(mdDivider)}; }
.mc-gwiz__footer-end { display: flex; gap: ${px(resolve("dim.2"))}; margin-left: auto; }
/* [hidden] loses to .btn's own display; re-assert it for the footer buttons */
.mc-gwiz__footer .btn[hidden] { display: none; }
.mc-gwiz__step[hidden] { display: none; }
@media (min-width: 768px) {
  .mc-gwiz { width: min(760px, calc(100vw - ${px(resolve("dim.8"))})); max-height: calc(100dvh - ${px(resolve("dim.16"))}); border-radius: ${mdRadius}; box-shadow: ${mdShadowCss}; }
}
@media (max-width: 767px) {
  .mc-gwiz { position: fixed; inset: 0; margin: 0; width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
  .mc-gwiz__cols { grid-template-columns: 1fr; }
}`;

const gwizStepMarkup = `<div class="mc-step">
      <div class="mc-step__item mc-step__item--active" data-step="1"><span class="mc-step__circle"><span class="mc-step__num">1</span>${iconOf("check", "mc-step__check")}</span><span class="mc-step__label">Select Students</span></div>
      <div class="mc-step__connector" id="mc-gwiz-conn"></div>
      <div class="mc-step__item mc-step__item--inactive" data-step="2"><span class="mc-step__circle"><span class="mc-step__num">2</span>${iconOf("check", "mc-step__check")}</span><span class="mc-step__label">Message Details</span></div>
    </div>`;

const gwizMarkup = `<dialog class="mc-gwiz" id="mc-gwiz" aria-labelledby="mc-gwiz-title">
  <header class="mc-gwiz__header">
    <h2 class="mc-gwiz__title" id="mc-gwiz-title">New Group Message</h2>
    <button class="btn btn--ghost btn--sm btn--icon-only" id="mc-gwiz-close" type="button" aria-label="Close">${iconCloseBtn}</button>
  </header>
  <div class="mc-gwiz__steps">${gwizStepMarkup}</div>
  <div class="mc-gwiz__body">
    <div class="mc-gwiz__step" data-panel="1">
      <div class="mc-gwiz__cols">
        <div>
          <p class="mc-gwiz__hint">Search active or leave-of-absence students by ID or name</p>
          <div class="search search--base" style="width:100%;margin-bottom:12px">${iconSearch}<input class="search__input" id="mc-gwiz-search" placeholder="Students" aria-label="Search students" /></div>
          <div class="mc-gwiz__list" id="mc-gwiz-list">
            ${gwizStudents.map((s) => `<div class="mc-gwiz__srow" data-id="${s.id}" data-name="${esc(s.name)}"><span class="mc-gwiz__sid">${s.id}</span><span class="mc-gwiz__sname">${s.name}</span><button class="mc-gwiz__add" type="button">+ Add</button></div>`).join("\n            ")}
          </div>
          <p class="mc-gwiz__hint">Or paste Student IDs separated by commas</p>
          <div class="mc-gwiz__paste"><input id="mc-gwiz-ids" placeholder="Ex. AA0001, AA0002" aria-label="Student IDs" /><button class="btn btn--secondary btn--sm" id="mc-gwiz-addids" type="button">Add IDs</button></div>
        </div>
        <div class="mc-gwiz__selected">
          <p class="mc-gwiz__sel-head">Selected · <span id="mc-gwiz-count">0</span></p>
          <div class="mc-gwiz__chips" id="mc-gwiz-chips"></div>
        </div>
      </div>
    </div>
    <div class="mc-gwiz__step" data-panel="2" hidden>
      <div class="mc-gwiz__frow"><span class="mc-gwiz__flabel">To</span><span class="mc-gwiz__fval" id="mc-gwiz-to">0 students selected</span><button class="mc-gwiz__edit" id="mc-gwiz-edit" type="button">Edit</button></div>
      <div class="mc-gwiz__frow"><span class="mc-gwiz__flabel">From</span><span class="mc-gwiz__fval">Academic Advising</span></div>
      <label class="mc-field">
        <span class="mc-field__label">Subject</span>
        <input class="mc-field__control" id="mc-gwiz-subject" maxlength="50" placeholder="Subject" aria-label="Subject" />
      </label>
      <div class="mc-compose__editor">
        <form class="composer composer--rich" onsubmit="return false">
          <div class="composer__toolbar">
            <button type="button" class="composer__icon-btn" aria-label="Bold">${iconBold}</button>
            <button type="button" class="composer__icon-btn" aria-label="Italic">${iconItalic}</button>
            <button type="button" class="composer__icon-btn" aria-label="Underline">${iconUnderline}</button>
            <button type="button" class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button>
            <button type="button" class="btn btn--ghost btn--sm">Hyperlinks</button>
            <button type="button" class="composer__ai-assist" id="mc-gwiz-ai">${iconAi}AI Assist</button>
          </div>
          <div class="composer__field">
            <textarea class="composer__input" id="mc-gwiz-message" rows="1" placeholder="Write your message..." aria-label="Message"></textarea>
          </div>
        </form>
      </div>
      <div class="mc-compose__checks">
        ${checkboxMarkup("Allow Replies", { checked: true, id: "mc-gwiz-allow" })}
        ${checkboxMarkup("Expire Thread", { checked: true, id: "mc-gwiz-expire" })}
      </div>
      <div class="mc-gwiz__exp">
        <span class="mc-gwiz__exp-label">Expiration</span>
        <div class="mc-dp" data-date="2026-08-15" id="mc-gwiz-dp">
          <button class="mc-dp__trigger" type="button" popovertarget="mc-gwiz-dp-panel" aria-haspopup="dialog">${iconOf("calendar_today", "mc-dp__cal")}<span class="mc-dp__value">Aug 15, 2026</span>${iconOf("expand_more", "mc-dp__chev")}</button>
          <div class="mc-dp__panel" id="mc-gwiz-dp-panel" popover role="dialog" aria-label="Choose a date">
            <div class="mc-dp__header">
              <button class="mc-dp__nav mc-dp__nav--prev" type="button" aria-label="Previous month">${iconOf("chevron_left", "")}</button>
              <span class="mc-dp__month">August 2026</span>
              <button class="mc-dp__nav mc-dp__nav--next" type="button" aria-label="Next month">${iconOf("chevron_right", "")}</button>
            </div>
            <div class="mc-dp__grid"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <footer class="mc-gwiz__footer">
    <button class="btn btn--secondary btn--base" id="mc-gwiz-cancel" type="button">Cancel</button>
    <div class="mc-gwiz__footer-end">
      <button class="btn btn--secondary btn--base" id="mc-gwiz-back" type="button" hidden>Back</button>
      <button class="btn btn--primary btn--base" id="mc-gwiz-next" type="button" disabled>Next</button>
      <button class="btn btn--primary btn--base" id="mc-gwiz-send" type="button" hidden>Send</button>
    </div>
  </footer>
</dialog>`;

// ---- Group detail: a broadcast's grouped card in Resolved opens a full-page
// group view (sent bubble + delivery Stat tiles + replies list + a recipients
// Drawer). A seeded group makes it visible without sending one. ----
const GROUP = {
  id: "grp-seed", n: 37, subject: "Fall registration opens Monday",
  body: "Hi {Preferred Name}, registration for the fall term opens on Monday, July 20. Reply here if you would like to review your remaining requirements first.",
  delivered: 37, seen: 24, replied: 6, date: "Jul 12",
};
const GROUP_RECIPIENTS = [
  { id: "CX0001", name: "Cait Adelson", status: "replied", reply: "Yes — can we go over my remaining requirements before Monday?" },
  { id: "CX0002", name: "Calam Xavier", status: "replied", reply: "Thanks! I already registered for my classes." },
  { id: "AA0215", name: "Maya Okafor", status: "seen" },
  { id: "AA0367", name: "Allison Rao", status: "seen" },
  { id: "AA0007", name: "L Arcos", status: "notseen" },
  { id: "AA0412", name: "Dana Torres", status: "notseen" },
];
const statusBadge = (s) => s === "replied" ? `<span class="badge badge--sm badge--role-success">Replied</span>` : s === "seen" ? `<span class="badge badge--sm badge--role-primary">Seen</span>` : `<span class="badge badge--sm badge--role-neutral">Not seen</span>`;

const groupCss = `.mc-group__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${px(resolve("dim.3"))}; }
.mc-group__replies-head { display: flex; align-items: center; justify-content: space-between; margin-top: ${px(resolve("dim.4"))}; margin-bottom: ${px(resolve("dim.2"))}; }
.mc-group__replies-head span { color: ${cv("text.muted")}; ${typoCss(labelSmType)}${labelSmExt.textTransform ? ` text-transform: ${labelSmExt.textTransform};` : ""}${labelSmExt.letterSpacing ? ` letter-spacing: ${labelSmExt.letterSpacing};` : ""} }
.mc-group__replies { display: flex; flex-direction: column; gap: ${px(resolve("dim.2"))}; }
.mc-group__reply { display: flex; align-items: center; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.3"))}; border: 1px solid ${cv("border.default")}; border-radius: ${px(resolve("radius.default"))}; background: ${cv("surface.default")}; }
.mc-group__reply-stack { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.mc-group__reply-name { color: ${cv("text.default")}; font-weight: 600; ${typoCss(bodySmType)} }
.mc-group__reply-text { color: ${cv("text.muted")}; ${typoCss(bodySmType)} overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-group__reply-link { color: ${cv("text.primary")}; ${typoCss(bodySmType)} flex-shrink: 0; }

/* recipients drawer — right-docked sheet (Modal surface), like the standalone AI */
.mc-recip { border: none; padding: 0; background: ${cv(mdBg)}; box-shadow: ${mdShadowCss}; font-family: ${cv("family.sans")}; }
.mc-recip[open] { display: flex; flex-direction: column; }
.mc-recip::backdrop { background: ${cv(mdOverlay)}; }
.mc-recip__header { flex-shrink: 0; display: flex; align-items: center; gap: ${px(resolve("dim.2"))}; flex-wrap: wrap; padding: ${px(resolve("dim.4"))} ${mdPadding} ${px(resolve("dim.3"))}; border-bottom: 1px solid ${cv(mdDivider)}; }
.mc-recip__title { margin: 0; color: ${cv(mdTitleColor)}; ${typoCss(mdTitleType)} }
.mc-recip__close { margin-left: auto; }
.mc-recip__chips { display: flex; gap: ${px(resolve("dim.2"))}; padding: ${px(resolve("dim.3"))} ${mdPadding}; flex-wrap: wrap; }
.mc-recip__search { padding: 0 ${mdPadding} ${px(resolve("dim.3"))}; }
.mc-recip__search .search { width: 100%; }
.mc-recip__list { flex: 1; min-height: 0; overflow-y: auto; padding: 0 ${px(resolve("dim.2"))} ${px(resolve("dim.4"))}; }
.mc-recip__row { display: flex; align-items: center; gap: ${px(resolve("dim.3"))}; padding: ${px(resolve("dim.2_5"))} ${px(resolve("dim.2"))}; border-radius: ${px(resolve("radius.default"))}; }
.mc-recip__row:hover { background: ${cv("surface.dim")}; }
.mc-recip__row[hidden] { display: none; }
.mc-recip__stack { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mc-recip__name { color: ${cv("text.default")}; ${typoCss(bodySmType)} }
.mc-recip__id { color: ${cv("text.muted")}; font-size: 12px; }
@media (min-width: 768px) {
  .mc-recip { width: min(420px, calc(100vw - ${px(resolve("dim.8"))})); height: 100dvh; max-height: 100dvh; margin: 0 0 0 auto; border-radius: 0; }
}
@media (max-width: 767px) {
  .mc-recip { position: fixed; inset: 0; margin: 0; width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; }
}`;

function groupAvatarStack(n) {
  const shown = GROUP_RECIPIENTS.slice(0, 3).map((r) => avatarMarkup(r.name, "sm").replace('class="avatar avatar--', 'class="mc-avg__item avatar--')).join("");
  const more = n > 3 ? `<span class="mc-avg__item mc-avg__more">+${n - 3}</span>` : "";
  return `<span class="mc-avg mc-avg--sm">${shown}${more}</span>`;
}
function groupCardMarkup(g) {
  return `<div class="thread-item-inbox mc-trow mc-console-cols mc-group-row thread-item-inbox--read" role="button" tabindex="0" data-thread="${g.id}" data-subject="${esc(g.subject)}" data-department="Academic Advising">
        <div class="mc-td mc-cellwrap">${groupAvatarStack(g.n)}<span class="mc-cellstack"><span class="mc-lead">${g.n} Students</span><span class="badge badge--sm badge--role-primary" style="width:fit-content">Group</span></span></div>
        <div class="mc-td mc-cellstack"><span class="mc-lead">${g.subject}</span><span class="mc-td--muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Seen ${g.seen} · Replied ${g.replied}</span></div>
        <div class="mc-td mc-td--muted mc-col-responsible">You</div>
        <div class="mc-td mc-col-expiration thread-item-inbox__expires"><span class="badge badge--sm badge--role-neutral">Expires Aug 15</span><span class="badge badge--sm badge--role-neutral thread-item-inbox__scope">Resolved</span></div>
        <div class="mc-td mc-td--muted" style="text-align:right;white-space:nowrap">${g.date}</div>
        <div class="mc-td"></div>
      </div>`;
}
function groupPaneMarkup(g) {
  const stat = (v, l, role) => `<div class="mc-stat${role ? ` mc-stat--${role}` : ""}"><span class="mc-stat__value">${v}</span><span class="mc-stat__label">${l}</span></div>`;
  const replies = GROUP_RECIPIENTS.filter((r) => r.status === "replied").map((r) => `<div class="mc-group__reply">${avatarMarkup(r.name, "sm")}<span class="mc-group__reply-stack"><span class="mc-group__reply-name">${r.name}</span><span class="mc-group__reply-text">${r.reply}</span></span><span class="mc-group__reply-link">In Inbox ›</span></div>`).join("");
  return `<article class="mc-thread mc-group" data-thread="${g.id}" hidden>
        <header class="mc-thread__bar">
          <button class="btn btn--ghost btn--sm mc-thread__back" type="button">${iconBack}Back</button>
          <div class="mc-thread__actions"><button class="btn btn--secondary btn--sm" id="mc-recip-open" type="button">See All ${g.n} Recipients</button></div>
          <h2 class="mc-thread__subject">${g.subject} <span class="badge badge--sm badge--role-neutral">Resolved</span></h2>
          <div class="mc-thread__tags"><span class="mc-thread__meta-line">Group Message · ${g.n} Students · Started by You · ${g.date}</span></div>
        </header>
        <div class="mc-thread__scroll">
          <div class="bubble-row bubble-row--self"><div class="bubble bubble--self bubble--tint"><p>${g.body}</p></div></div>
          <div class="mc-group__stats">${stat(g.delivered, "Delivered")}${stat(g.seen, "Seen")}${stat(g.replied, "Replied", "success")}</div>
          <div>
            <div class="mc-group__replies-head"><span>Replies · ${g.replied}</span></div>
            <div class="mc-group__replies">${replies}</div>
          </div>
        </div>
      </article>`;
}
const recipDrawerMarkup = `<dialog class="mc-recip" id="mc-recip" aria-labelledby="mc-recip-title">
  <div class="mc-recip__header">
    <h2 class="mc-recip__title" id="mc-recip-title">Recipients · ${GROUP.n}</h2>
    <button class="btn btn--ghost btn--sm btn--icon-only mc-recip__close" id="mc-recip-close" type="button" aria-label="Close">${iconCloseBtn}</button>
  </div>
  <div class="mc-recip__chips">
    <button class="chip chip--base mc-recip-chip" type="button" aria-pressed="true" data-status="all">All</button>
    <button class="chip chip--base mc-recip-chip" type="button" aria-pressed="false" data-status="replied">Replied · ${GROUP_RECIPIENTS.filter((r) => r.status === "replied").length}</button>
    <button class="chip chip--base mc-recip-chip" type="button" aria-pressed="false" data-status="seen">Seen</button>
    <button class="chip chip--base mc-recip-chip" type="button" aria-pressed="false" data-status="notseen">Not seen</button>
  </div>
  <div class="mc-recip__search"><div class="search search--base">${iconSearch}<input class="search__input" id="mc-recip-search" placeholder="Search recipients" aria-label="Search recipients" /></div></div>
  <div class="mc-recip__list" id="mc-recip-list">
    ${GROUP_RECIPIENTS.map((r) => `<div class="mc-recip__row" data-status="${r.status}" data-name="${esc(r.name)}" data-id="${r.id}">${avatarMarkup(r.name, "sm")}<span class="mc-recip__stack"><span class="mc-recip__name">${r.name}</span><span class="mc-recip__id">${r.id}</span></span>${statusBadge(r.status)}</div>`).join("\n    ")}
  </div>
</dialog>`;

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
      railEmptyText.textContent = "Search across Inbox and Resolved";
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
    // flag toggle — marks a thread important without opening it (group cards
    // have no flag; guard so bindRow doesn't throw and halt the rest of init)
    var flag = row.querySelector(".thread-item-inbox__flag-btn");
    if (flag) {
      flag.addEventListener("click", function (e) {
        e.stopPropagation();
        flag.setAttribute("aria-pressed", flag.getAttribute("aria-pressed") === "true" ? "false" : "true");
        if (filters.flagged) applyFilter();
      });
      flag.addEventListener("keydown", function (e) { e.stopPropagation(); });
    }
  }
  document.querySelectorAll(".thread-item-inbox").forEach(bindRow);


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

  // rich composer — Send appends a real self Bubble (tint). The field is a
  // 1-row textarea auto-growing to ~5 lines (Enter sends, Shift+Enter
  // breaks); toolbar/settings controls are display affordances in v1
  var SELF_SENDER = ${JSON.stringify(selfBubbleSender)};
  function bindComposer(form) {
    var input = form.querySelector(".composer__input");
    function grow() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }
    input.addEventListener("input", grow);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
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
      grow();
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
        scope.textContent = "Resolved";
        scope.classList.remove("badge--role-primary");
        scope.classList.add("badge--role-neutral");
        lists.archived.insertBefore(row, lists.archived.firstChild);
      }
      btn.closest(".mc-thread").querySelector(".mc-thread__tags").insertAdjacentHTML("beforeend", '<span class="badge badge--sm badge--role-neutral">Resolved</span>');
      btn.remove();
      closeThread();
      applyFilter();
      updateUnreadCounter();
      showToast("success", '"' + subject + '" resolved');
    });
  }
  document.querySelectorAll(".mc-archive").forEach(bindArchive);

  // Print
  function bindPrint(btn) {
    btn.addEventListener("click", function () { window.print(); });
  }
  document.querySelectorAll(".mc-print").forEach(bindPrint);


  // ===== New Message compose + AI Writing Assist =====

  // FAB — extended by default, collapses to icon-only while the list scrolls
  // down, re-extends on scroll up or near the top (mirrors the student side)
  var fab = document.getElementById("mc-new-fab");
  var railLists = document.querySelector(".mc-rail__lists");
  var lastListScroll = 0;
  railLists.addEventListener("scroll", function () {
    var y = railLists.scrollTop;
    if (y > lastListScroll && y > 40) fab.classList.add("mc-fab--collapsed");
    else if (y < lastListScroll - 4 || y <= 40) fab.classList.remove("mc-fab--collapsed");
    lastListScroll = y;
  }, { passive: true });

  var composeDlg = document.getElementById("mc-compose");
  var discardDlg = document.getElementById("mc-discard");
  var aiStandaloneDlg = document.getElementById("mc-ai-standalone");
  var composeDept = null;
  var composeDeptValue = document.getElementById("mc-compose-dept-value");
  var composeDeptTrigger = document.getElementById("mc-compose-dept");
  var composeDeptLb = document.getElementById("mc-compose-dept-lb");
  var composeSubject = document.getElementById("mc-compose-subject");
  var composeCounter = document.getElementById("mc-compose-counter");
  var composeMessage = document.getElementById("mc-compose-message");
  var composeSendBtn = document.getElementById("mc-compose-send");
  var composeAllow = document.getElementById("mc-compose-allow");
  var composeExpire = document.getElementById("mc-compose-expire");

  function validateCompose() {
    var ok = !!composeDept && composeSubject.value.trim() !== "" && composeMessage.value.trim() !== "";
    composeSendBtn.disabled = !ok;
  }
  function composeHasDraft() {
    return !!composeDept || composeSubject.value.trim() !== "" || composeMessage.value.trim() !== "";
  }

  // Subject — Input's floating label + a live char counter (composition text,
  // not a component); Message — the rich Composer textarea, auto-growing
  var subjectField = composeSubject.closest(".mc-field");
  function syncSubject() {
    subjectField.classList.toggle("mc-field--floated", document.activeElement === composeSubject || composeSubject.value.trim() !== "");
    composeCounter.textContent = composeSubject.value.length + "/50";
  }
  composeSubject.addEventListener("focus", syncSubject);
  composeSubject.addEventListener("blur", syncSubject);
  composeSubject.addEventListener("input", function () { syncSubject(); validateCompose(); });
  subjectField.addEventListener("click", function () { composeSubject.focus(); });
  function growMessage() {
    composeMessage.style.height = "auto";
    composeMessage.style.height = Math.min(composeMessage.scrollHeight, 300) + "px";
  }
  composeMessage.addEventListener("input", function () { growMessage(); validateCompose(); });

  // Select float model (Input's own): resting = placeholder only; the 12px
  // label floats in once a value exists
  function selectPopulate(trigger, valueEl, text) { trigger.classList.remove("select--resting"); valueEl.textContent = text; }
  function selectRest(trigger, valueEl, placeholder) { trigger.classList.add("select--resting"); valueEl.textContent = placeholder; }
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
      validateCompose();
    });
  });

  // compose mobile Edit / AI tabs
  composeDlg.querySelectorAll("[data-ctab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      composeDlg.querySelectorAll("[data-ctab]").forEach(function (t) {
        t.classList.toggle("tab--active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      composeDlg.classList.toggle("mc-compose--tab-ai", tab.dataset.ctab === "ai");
    });
  });
  function composeSetTab(which) {
    composeDlg.querySelectorAll("[data-ctab]").forEach(function (t) {
      var on = t.dataset.ctab === which;
      t.classList.toggle("tab--active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    composeDlg.classList.toggle("mc-compose--tab-ai", which === "ai");
  }
  // the compose toolbar's AI Assist TOGGLES the panel: on desktop expand /
  // collapse the AI column, on mobile switch to / back from the AI tab
  document.getElementById("mc-compose-ai-assist").addEventListener("click", function () {
    if (window.innerWidth < 768) {
      composeSetTab(composeDlg.classList.contains("mc-compose--tab-ai") ? "edit" : "ai");
    } else {
      var opened = composeDlg.classList.toggle("mc-compose--ai-open");
      if (opened) {
        var input = composeDlg.querySelector('.mc-ai[data-ai="compose"] [data-ai-input]');
        if (input) input.focus();
      }
    }
  });

  function resetCompose() {
    composeDept = null;
    selectRest(composeDeptTrigger, composeDeptValue, "Department");
    composeSubject.value = "";
    composeMessage.value = "";
    composeMessage.style.height = "auto";
    composeCounter.textContent = "0/50";
    composeAllow.checked = true;
    composeExpire.checked = false;
    subjectField.classList.remove("mc-field--floated");
    composeDeptLb.querySelectorAll(".listbox__option").forEach(function (o) {
      o.classList.remove("listbox__option--selected");
      o.setAttribute("aria-selected", "false");
    });
    // reset the AI panel back to its suggestions-only start
    var cpanel = composeDlg.querySelector('.mc-ai[data-ai="compose"]');
    resetAiPanel(cpanel);
    composeDlg.classList.remove("mc-compose--ai-open"); // collapsed by default
    composeDlg.classList.remove("mc-compose--tab-ai");
    composeDlg.querySelectorAll("[data-ctab]").forEach(function (t) {
      var isEdit = t.dataset.ctab === "edit";
      t.classList.toggle("tab--active", isEdit);
      t.setAttribute("aria-selected", isEdit ? "true" : "false");
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
  // SplitButton "New Message v" — the chevron opens a menu: New Message (single
  // compose) / New Group Message (the wizard)
  var newMenu = document.getElementById("mc-new-menu");
  if (newMenu) {
    newMenu.addEventListener("toggle", function (e) {
      if (e.newState === "open") {
        var r = document.querySelector(".mc-topbar-new").getBoundingClientRect();
        newMenu.style.position = "fixed"; newMenu.style.margin = "0";
        newMenu.style.top = (r.bottom + 4) + "px";
        newMenu.style.left = Math.max(8, r.right - newMenu.offsetWidth) + "px";
      }
    });
    var elSingle = document.getElementById("mc-new-single");
    if (elSingle) elSingle.addEventListener("click", function () { newMenu.hidePopover(); resetCompose(); composeDlg.showModal(); });
    var elGroup = document.getElementById("mc-new-group");
    if (elGroup) elGroup.addEventListener("click", function () { newMenu.hidePopover(); openGwiz(); });
  }
  document.getElementById("mc-compose-close").addEventListener("click", requestComposeClose);
  composeDlg.addEventListener("click", function (e) { if (e.target === composeDlg) requestComposeClose(); });
  composeDlg.addEventListener("cancel", function (e) {           // Escape
    if (composeHasDraft()) { e.preventDefault(); discardDlg.showModal(); }
  });
  discardDlg.addEventListener("cancel", function (e) { e.preventDefault(); }); // modal.alert
  document.getElementById("mc-discard-keep").addEventListener("click", function () { discardDlg.close(); });
  document.getElementById("mc-discard-discard").addEventListener("click", function () { discardDlg.close(); composeDlg.close(); });

  // ---- AI Writing Assist panel — bound for both instances (compose column +
  // standalone overlay). getTarget() returns the textarea a generated draft
  // gets inserted into. ----
  var AI_RESPONSES = ${JSON.stringify({
    "Registration reminder": ["Hi there, this is a friendly reminder that course registration for the upcoming term closes soon. Please log in to complete your enrollment, and reach out if any holds are getting in your way.", "Hello, registration is still open but closing shortly. Take a few minutes to finalize your courses so your seats aren't released."],
    "Missed appointment": ["Hi, I noticed we missed each other for today's appointment. No problem at all — let's find a new time. You can pick a slot that works for you here: [Insert link].", "Hello, it looks like today's meeting didn't happen. Would you like to reschedule? Send me a couple of times that suit you and I'll confirm."],
    "Check-in message": ["Hi, I'm checking in to see how the term is going so far. If anything has come up — academic or otherwise — I'm here to help. Let me know if you'd like to talk.", "Hello, just a quick check-in from Advising. How are your courses feeling this term? Happy to review your plan whenever you're ready."],
    "Exam preparation": ["Hi, with finals approaching I wanted to share a few resources to help you prepare. The tutoring center has extended hours, and I'm glad to review your study plan if that would help.", "Hello, exams are coming up soon. If you'd like help mapping out a study schedule or connecting with tutoring, just say the word."],
    "Schedule meeting": ["Hi, I'd like to invite you to schedule an appointment with Academic Advising to review your progress and discuss any questions. You can book a time here: [Insert link].", "Hello, could we set up a short meeting to go over your progress this term? Grab whichever slot works best: [Insert link]."],
    "_default": ["Here's a draft you can refine:\\n\\nHi there, I wanted to reach out regarding your recent request. Let me know if there's anything I can clarify — happy to help.", "Happy to help — here's an alternative you can edit to match your voice and add the specific details."],
  })};
  var AI_COPY_ICON = ${JSON.stringify(iconCopy)};
  var AI_REPLACE_ICON = ${JSON.stringify(iconReplace)};
  var AI_REGEN_ICON = ${JSON.stringify(iconRegen)};
  var AI_SPARK_ICON = ${JSON.stringify(iconAiSpark)};
  function nowTime() {
    var d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  function resetAiPanel(panel) {
    if (!panel) return;
    var scroll = panel.querySelector("[data-ai-scroll]");
    // strip any appended chat, keep the title + the suggestions block
    Array.prototype.slice.call(scroll.children).forEach(function (c) {
      if (!c.hasAttribute("data-ai-suggestions") && !c.classList.contains("mc-ai__title")) scroll.removeChild(c);
    });
    panel.querySelector("[data-ai-suggestions]").hidden = false;
    var input = panel.querySelector("[data-ai-input]");
    input.value = "";
    input.style.height = "auto";
    // reset Tone / Length back to their first option
    panel.querySelectorAll(".mc-ai__opt").forEach(function (opt) {
      var lb = document.getElementById(opt.getAttribute("popovertarget"));
      var first = lb.querySelector(".listbox__option");
      lb.querySelectorAll(".listbox__option").forEach(function (x) {
        x.classList.toggle("listbox__option--selected", x === first);
        x.setAttribute("aria-selected", x === first ? "true" : "false");
      });
      opt.querySelector("b").textContent = first.dataset.val;
    });
  }
  function bindAiPanel(panel, getTarget) {
    if (!panel) return;
    var scroll = panel.querySelector("[data-ai-scroll]");
    var suggestions = panel.querySelector("[data-ai-suggestions]");
    var input = panel.querySelector("[data-ai-input]");
    function respond(youText, respKey) {
      suggestions.hidden = true;
      var time = nowTime();
      var you = document.createElement("div");
      you.className = "bubble-row bubble-row--self";
      you.innerHTML = '<div class="mc-ai__msg-head mc-ai__msg-head--self"><span>You</span><span class="mc-ai__msg-time"></span></div><div class="bubble bubble--self bubble--tint"><p></p></div>';
      you.querySelector(".mc-ai__msg-time").textContent = "· " + time;
      you.querySelector("p").textContent = youText;
      scroll.appendChild(you);
      var variants = AI_RESPONSES[respKey] || AI_RESPONSES._default;
      var vi = 0;
      var asst = document.createElement("div");
      asst.className = "bubble-row bubble-row--other";
      asst.innerHTML = '<div class="mc-ai__msg">' +
        '<div class="mc-ai__msg-head">' + AI_SPARK_ICON + '<span>Assistant</span><span class="mc-ai__msg-time"></span></div>' +
        '<div class="bubble bubble--other"><p></p></div>' +
        '<div class="mc-ai__msg-actions">' +
        '<button type="button" class="btn btn--secondary btn--sm" data-ai-copy>' + AI_COPY_ICON + 'Copy</button>' +
        '<button type="button" class="btn btn--secondary btn--sm" data-ai-replace>' + AI_REPLACE_ICON + 'Replace message</button>' +
        '<button type="button" class="btn btn--secondary btn--sm btn--icon-only" data-ai-regen aria-label="Regenerate">' + AI_REGEN_ICON + '</button>' +
        '</div></div>';
      asst.querySelector(".mc-ai__msg-time").textContent = "· " + time;
      var p = asst.querySelector(".bubble p");
      p.textContent = variants[vi];
      scroll.appendChild(asst);
      scroll.scrollTop = scroll.scrollHeight;
      asst.querySelector("[data-ai-regen]").addEventListener("click", function () {
        vi = (vi + 1) % variants.length;
        p.textContent = variants[vi];
      });
      // Copy — puts the draft on the clipboard (best-effort in a sandbox)
      asst.querySelector("[data-ai-copy]").addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(p.textContent).catch(function () {});
        showToast("success", "Copied to clipboard");
      });
      // Replace message — drops the draft straight into the message textarea
      asst.querySelector("[data-ai-replace]").addEventListener("click", function () {
        var t = getTarget();
        if (t) { t.value = p.textContent; t.dispatchEvent(new Event("input", { bubbles: true })); }
        showToast("success", "Added to message");
      });
    }
    panel.querySelectorAll("[data-ai-suggestion]").forEach(function (chip) {
      chip.addEventListener("click", function () { respond("Write a " + chip.dataset.aiSuggestion.toLowerCase(), chip.dataset.aiSuggestion); });
    });
    function growInput() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
    input.addEventListener("input", growInput);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    function send() {
      var text = input.value.trim();
      if (!text) return;
      respond(text, text);
      input.value = "";
      growInput();
    }
    panel.querySelector("[data-ai-send]").addEventListener("click", send);
    // Tone / Length — real single-select Listbox dropdowns, anchored under the
    // trigger the same way the Department / filter listboxes are
    panel.querySelectorAll(".mc-ai__opt").forEach(function (opt) {
      var lb = document.getElementById(opt.getAttribute("popovertarget"));
      var b = opt.querySelector("b");
      lb.addEventListener("toggle", function (e) {
        if (e.newState === "open") {
          var r = opt.getBoundingClientRect();
          lb.style.position = "fixed";
          lb.style.margin = "0";
          // flip up when there isn't room below (these sit near the bottom of
          // the panel / mobile sheet)
          var below = r.bottom + 4;
          var flipUp = below + lb.offsetHeight + 8 > window.innerHeight;
          lb.style.top = (flipUp ? Math.max(8, r.top - lb.offsetHeight - 4) : below) + "px";
          lb.style.left = Math.max(8, Math.min(r.left, window.innerWidth - lb.offsetWidth - 8)) + "px";
        }
      });
      lb.querySelectorAll(".listbox__option").forEach(function (o) {
        o.addEventListener("click", function () {
          lb.querySelectorAll(".listbox__option").forEach(function (x) {
            x.classList.toggle("listbox__option--selected", x === o);
            x.setAttribute("aria-selected", x === o ? "true" : "false");
          });
          b.textContent = o.dataset.val;
          lb.hidePopover();
        });
      });
    });
    // header action — collapse (compose) or close (standalone)
    var collapse = panel.querySelector("[data-ai-collapse]");
    if (collapse) collapse.addEventListener("click", function () { composeDlg.classList.remove("mc-compose--ai-open"); });
    var close = panel.querySelector("[data-ai-close]");
    if (close) close.addEventListener("click", function () { aiStandaloneDlg.close(); });
  }
  bindAiPanel(composeDlg.querySelector('.mc-ai[data-ai="compose"]'), function () { return composeMessage; });
  // the standalone AI panel writes into whichever field last opened it — an
  // open thread's reply composer, or the group wizard's message field
  var currentAiTarget = null;
  bindAiPanel(aiStandaloneDlg.querySelector('.mc-ai[data-ai="standalone"]'), function () {
    if (currentAiTarget) return currentAiTarget;
    var pane = document.querySelector(".mc-thread:not([hidden])");
    return pane ? pane.querySelector(".mc-composer .composer__input") : null;
  });

  // in-thread AI Assist (Composer rich variant) opens the standalone panel —
  // wired on every existing thread and on Send-created ones
  function bindThreadAiAssist(btn) {
    btn.addEventListener("click", function () { currentAiTarget = null; aiStandaloneDlg.showModal(); });
  }
  document.querySelectorAll(".mc-composer .composer__ai-assist").forEach(bindThreadAiAssist);

  // ---- Send Message — creates a real outbound Inbox thread (a staff-initiated
  // message the student hasn't answered yet: Awaiting reply). Faithful to the
  // student side's send-creates-a-thread behaviour, staff-flavoured. ----
  var COMPOSE_PANE_SKELETON = ${JSON.stringify(`<header class="mc-thread__bar"><button class="btn btn--ghost btn--sm mc-thread__back" type="button">${iconBack}Back</button><div class="mc-thread__actions"><button class="btn btn--secondary btn--sm mc-archive" type="button">Resolve</button><button class="btn btn--secondary btn--sm btn--icon-only mc-print" type="button" aria-label="Print thread">${iconPrint}</button></div><h2 class="mc-thread__subject"></h2><div class="mc-thread__tags"><span class="mc-thread__meta-line"></span><span class="badge badge--sm badge--role-primary">Awaiting reply</span></div></header><div class="mc-thread__scroll"></div><footer class="mc-thread__composer"><form class="composer composer--rich mc-composer"><div class="composer__toolbar"><button type="button" class="composer__icon-btn" aria-label="Bold">${iconBold}</button><button type="button" class="composer__icon-btn" aria-label="Italic">${iconItalic}</button><button type="button" class="composer__icon-btn" aria-label="Underline">${iconUnderline}</button><button type="button" class="btn btn--ghost btn--sm">${iconTag}Merge Tags</button><button type="button" class="composer__ai-assist">${iconAi}AI Assist</button></div><div class="composer__field"><textarea class="composer__input" rows="1" placeholder="Reply..." aria-label="Reply"></textarea></div><div class="composer__settings"><div class="composer__settings-row"><span class="composer__settings-label">Allow Replies</span>${switchMarkup(true)}</div><div class="composer__settings-row"><span class="composer__settings-label">Expiration</span><button type="button" class="composer__expiration-trigger">Aug 15, 2026 ${iconChevronRight}</button></div></div><button type="submit" class="btn btn--primary btn--base composer__send">${iconSend}Send</button></form></footer>`)};
  var COMPOSE_ROW_SKELETON = ${JSON.stringify(`<div class="thread-item-inbox__main"><div class="thread-item-inbox__top"><span class="thread-item-inbox__identity"></span><span class="thread-item-inbox__time">Just now</span></div><div class="thread-item-inbox__subject"></div><div class="thread-item-inbox__preview-row"><span class="thread-item-inbox__preview"></span><button class="thread-item-inbox__flag-btn" type="button" aria-pressed="false" aria-label="Flag thread">${iconFlagOutlined}${iconFlagFilled}</button></div><div class="thread-item-inbox__expires"><span class="badge badge--sm badge--role-primary">Awaiting reply</span><span class="badge badge--sm badge--role-primary thread-item-inbox__scope">Inbox</span></div></div>`)};
  var DEPT_AVATARS = ${JSON.stringify(Object.fromEntries(composeDepartments.map((d) => [d, avatarMarkup(d, "sm")])))};

  var sentSeq = 0;
  composeSendBtn.addEventListener("click", function () {
    if (composeSendBtn.disabled) return;
    var text = composeMessage.value.trim();
    var subject = composeSubject.value.trim();
    var id = "sent-" + (++sentSeq);
    var identity = composeDept;

    var row = document.createElement("div");
    row.className = "thread-item-inbox thread-item-inbox--read";
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.dataset.thread = id;
    row.dataset.subject = subject;
    row.dataset.department = composeDept;
    row.innerHTML = (DEPT_AVATARS[composeDept] || "") + COMPOSE_ROW_SKELETON;
    row.querySelector(".thread-item-inbox__identity").textContent = identity;
    row.querySelector(".thread-item-inbox__subject").textContent = subject;
    row.querySelector(".thread-item-inbox__preview").textContent = "You: " + text;
    bindRow(row);
    lists.inbox.insertBefore(row, lists.inbox.firstChild);

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
    pane.querySelector(".mc-thread__scroll").appendChild(bubbleRowEl);
    bindBack(pane.querySelector(".mc-thread__back"));
    bindArchive(pane.querySelector(".mc-archive"));
    bindPrint(pane.querySelector(".mc-print"));
    bindComposer(pane.querySelector(".mc-composer"));
    bindThreadAiAssist(pane.querySelector(".composer__ai-assist"));
    document.querySelector(".mc__reading").appendChild(pane);

    composeDlg.close();
    applyFilter();
    updateUnreadCounter();
    showToast("success", "Message sent");
  });
  validateCompose();

  // ===== DatePicker (reusable calendar) =====
  var DP_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DP_WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  function bindDatePicker(dpEl) {
    var trigger = dpEl.querySelector(".mc-dp__trigger");
    var panel = dpEl.querySelector(".mc-dp__panel");
    var valEl = dpEl.querySelector(".mc-dp__value");
    var parts = (dpEl.dataset.date || "2026-08-15").split("-").map(Number);
    var sel = { y: parts[0], m: parts[1] - 1, d: parts[2] };
    var view = { y: sel.y, m: sel.m };
    var today = { y: 2026, m: 7, d: 8 };
    function render() {
      var first = new Date(view.y, view.m, 1).getDay();
      var days = new Date(view.y, view.m + 1, 0).getDate();
      var prevDays = new Date(view.y, view.m, 0).getDate();
      var cells = [];
      for (var i = 0; i < first; i++) cells.push({ d: prevDays - first + 1 + i, outside: true });
      for (var d = 1; d <= days; d++) cells.push({ d: d, outside: false });
      while (cells.length % 7 !== 0) cells.push({ d: cells.length - (first + days) + 1, outside: true });
      var grid = DP_WD.map(function (w) { return '<span class="mc-dp__wd">' + w + '</span>'; }).join("");
      cells.forEach(function (c) {
        var cls = ["mc-dp__day"];
        if (c.outside) cls.push("mc-dp__day--outside");
        else {
          if (view.y === today.y && view.m === today.m && c.d === today.d) cls.push("mc-dp__day--today");
          if (view.y === sel.y && view.m === sel.m && c.d === sel.d) cls.push("mc-dp__day--selected");
        }
        grid += '<button type="button" class="' + cls.join(" ") + '"' + (c.outside ? " disabled tabindex=-1" : "") + ' data-day="' + c.d + '">' + c.d + '</button>';
      });
      panel.querySelector(".mc-dp__month").textContent = DP_MONTHS[view.m] + " " + view.y;
      panel.querySelector(".mc-dp__grid").innerHTML = grid;
      panel.querySelectorAll(".mc-dp__day:not(.mc-dp__day--outside)").forEach(function (btn) {
        btn.addEventListener("click", function () {
          sel = { y: view.y, m: view.m, d: parseInt(btn.dataset.day, 10) };
          valEl.textContent = DP_MONTHS[sel.m].slice(0, 3) + " " + sel.d + ", " + sel.y;
          dpEl.dataset.date = sel.y + "-" + ("0" + (sel.m + 1)).slice(-2) + "-" + ("0" + sel.d).slice(-2);
          panel.hidePopover();
        });
      });
    }
    panel.querySelector(".mc-dp__nav--prev").addEventListener("click", function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } render(); });
    panel.querySelector(".mc-dp__nav--next").addEventListener("click", function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } render(); });
    panel.addEventListener("toggle", function (e) {
      if (e.newState === "open") {
        view = { y: sel.y, m: sel.m }; render();
        var r = trigger.getBoundingClientRect();
        panel.style.position = "fixed"; panel.style.margin = "0";
        panel.style.top = (r.bottom + 4) + "px";
        panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
      }
    });
    render();
  }
  document.querySelectorAll(".mc-dp").forEach(bindDatePicker);

  // ===== New Group Message wizard =====
  var gwizDlg = document.getElementById("mc-gwiz");
  var gwizSel = {}; // id -> name
  var GWIZ_NAMES = ${JSON.stringify(Object.fromEntries(gwizStudents.map((s) => [s.id, s.name])))};
  var gwizSearch = document.getElementById("mc-gwiz-search");
  var gwizChips = document.getElementById("mc-gwiz-chips");
  var gwizCountEl = document.getElementById("mc-gwiz-count");
  var gwizNext = document.getElementById("mc-gwiz-next");
  var gwizBack = document.getElementById("mc-gwiz-back");
  var gwizSend = document.getElementById("mc-gwiz-send");
  var gwizMessage = document.getElementById("mc-gwiz-message");
  var gwizSubject = document.getElementById("mc-gwiz-subject");
  var GWIZ_CLOSE_ICON = ${JSON.stringify(iconCloseAtt)};
  var AVG_HUES = ${JSON.stringify(usedHues)};

  function gwizCount() { return Object.keys(gwizSel).length; }
  function gwizRenderSelected() {
    gwizChips.innerHTML = Object.keys(gwizSel).map(function (id) {
      return '<div class="mc-gwiz__chip"><b>' + id + '</b><span>' + gwizSel[id] + '</span><button type="button" data-rm="' + id + '" aria-label="Remove">' + GWIZ_CLOSE_ICON + '</button></div>';
    }).join("");
    gwizChips.querySelectorAll("[data-rm]").forEach(function (b) {
      b.addEventListener("click", function () { delete gwizSel[b.dataset.rm]; syncGwizList(); gwizRenderSelected(); gwizSync(); });
    });
    gwizCountEl.textContent = gwizCount();
  }
  function syncGwizList() {
    document.querySelectorAll("#mc-gwiz-list .mc-gwiz__srow").forEach(function (row) {
      var added = !!gwizSel[row.dataset.id];
      row.classList.toggle("mc-gwiz__srow--added", added);
      row.querySelector(".mc-gwiz__add").textContent = added ? "✓ Added" : "+ Add";
    });
  }
  function gwizSync() {
    gwizNext.disabled = gwizCount() === 0;
    document.getElementById("mc-gwiz-to").textContent = gwizCount() + (gwizCount() === 1 ? " student selected" : " students selected");
  }
  document.querySelectorAll("#mc-gwiz-list .mc-gwiz__srow .mc-gwiz__add").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var row = btn.closest(".mc-gwiz__srow");
      if (gwizSel[row.dataset.id]) return;
      gwizSel[row.dataset.id] = row.dataset.name;
      syncGwizList(); gwizRenderSelected(); gwizSync();
    });
  });
  document.getElementById("mc-gwiz-addids").addEventListener("click", function () {
    var input = document.getElementById("mc-gwiz-ids");
    input.value.split(",").map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean).forEach(function (id) {
      if (!gwizSel[id]) gwizSel[id] = GWIZ_NAMES[id] || "Student " + id;
    });
    input.value = "";
    syncGwizList(); gwizRenderSelected(); gwizSync();
  });
  gwizSearch.addEventListener("input", function () {
    var q = gwizSearch.value.trim().toLowerCase();
    document.querySelectorAll("#mc-gwiz-list .mc-gwiz__srow").forEach(function (row) {
      row.style.display = (row.dataset.id + " " + row.dataset.name).toLowerCase().indexOf(q) === -1 ? "none" : "";
    });
  });
  function gwizStep(n) {
    document.querySelectorAll(".mc-gwiz__step").forEach(function (p) { p.hidden = p.dataset.panel !== String(n); });
    document.querySelectorAll(".mc-gwiz .mc-step__item").forEach(function (it) {
      var s = parseInt(it.dataset.step, 10);
      it.classList.toggle("mc-step__item--complete", s < n);
      it.classList.toggle("mc-step__item--active", s === n);
      it.classList.toggle("mc-step__item--inactive", s > n);
    });
    document.getElementById("mc-gwiz-conn").classList.toggle("mc-step__connector--filled", n > 1);
    gwizNext.hidden = n !== 1; gwizBack.hidden = n !== 2; gwizSend.hidden = n !== 2;
  }
  gwizNext.addEventListener("click", function () { if (gwizCount() > 0) gwizStep(2); });
  gwizBack.addEventListener("click", function () { gwizStep(1); });
  document.getElementById("mc-gwiz-edit").addEventListener("click", function () { gwizStep(1); });
  gwizMessage.addEventListener("input", function () { gwizMessage.style.height = "auto"; gwizMessage.style.height = Math.min(gwizMessage.scrollHeight, 220) + "px"; });
  document.getElementById("mc-gwiz-ai").addEventListener("click", function () { currentAiTarget = gwizMessage; aiStandaloneDlg.showModal(); });
  function openGwiz() {
    gwizSel = {}; gwizSearch.value = ""; gwizSubject.value = ""; gwizMessage.value = ""; gwizMessage.style.height = "auto";
    document.querySelectorAll("#mc-gwiz-list .mc-gwiz__srow").forEach(function (r) { r.style.display = ""; });
    syncGwizList(); gwizRenderSelected(); gwizSync(); gwizStep(1);
    gwizDlg.showModal();
  }
  document.getElementById("mc-gwiz-close").addEventListener("click", function () { gwizDlg.close(); });
  document.getElementById("mc-gwiz-cancel").addEventListener("click", function () { gwizDlg.close(); });
  gwizDlg.addEventListener("click", function (e) { if (e.target === gwizDlg) gwizDlg.close(); });

  // Send → fan-out: one grouped card in Resolved (a broadcast, not a
  // conversation). Child reply threads landing in Inbox are a follow-up.
  var gwizSeq = 0;
  gwizSend.addEventListener("click", function () {
    var ids = Object.keys(gwizSel);
    if (!ids.length) return;
    var subject = gwizSubject.value.trim() || "(No subject)";
    var n = ids.length;
    var shown = ids.slice(0, 3).map(function (id, i) {
      return '<span class="mc-avg__item avatar--' + AVG_HUES[i % AVG_HUES.length] + '" style="background:var(--tok-avatar-' + AVG_HUES[i % AVG_HUES.length] + '-bg)"><span class="avatar__initials" style="color:var(--tok-avatar-' + AVG_HUES[i % AVG_HUES.length] + '-text);font-size:11px;text-transform:uppercase">' + gwizSel[id].split(" ").map(function (w){return w[0];}).join("").slice(0,2) + '</span></span>';
    }).join("");
    var more = n > 3 ? '<span class="mc-avg__item mc-avg__more">+' + (n - 3) + '</span>' : "";
    var id = "grp-" + (++gwizSeq);
    var row = document.createElement("div");
    row.className = "thread-item-inbox mc-trow mc-console-cols thread-item-inbox--read";
    row.dataset.thread = id; row.dataset.subject = subject; row.dataset.department = "Academic Advising";
    row.innerHTML =
      '<div class="mc-td mc-cellwrap"><span class="mc-avg mc-avg--sm">' + shown + more + '</span><span class="mc-cellstack"><span class="mc-lead">' + n + ' Students</span><span class="badge badge--sm badge--role-primary" style="width:fit-content">Group</span></span></div>' +
      '<div class="mc-td mc-cellstack"><span class="mc-lead"></span><span class="mc-td--muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Seen 0 · Replied 0</span></div>' +
      '<div class="mc-td mc-td--muted mc-col-responsible">You</div>' +
      '<div class="mc-td mc-col-expiration thread-item-inbox__expires"><span class="mc-td--muted">–</span><span class="badge badge--sm badge--role-neutral thread-item-inbox__scope">Resolved</span></div>' +
      '<div class="mc-td mc-td--muted" style="text-align:right;white-space:nowrap">Just now</div>' +
      '<div class="mc-td"></div>';
    row.querySelector(".mc-td.mc-cellstack .mc-lead").textContent = subject;
    lists.archived.insertBefore(row, lists.archived.firstChild);
    gwizDlg.close();
    applyFilter();
    showToast("success", "Group message sent to " + n + " students");
  });

  // ===== Group detail + recipients drawer =====
  // A grouped card opens a full-page group view (if a matching pane exists);
  // "See All Recipients" opens the right-docked recipients Drawer.
  function bindGroupRow(row) {
    row.addEventListener("click", function () {
      var id = row.dataset.thread;
      if (!document.querySelector('.mc-thread[data-thread="' + id + '"]')) return;
      allRows().forEach(function (r) { r.classList.remove("thread-item-inbox--selected"); });
      row.classList.add("thread-item-inbox--selected");
      showPane(id);
      mc.classList.add("mc--thread-open");
    });
  }
  document.querySelectorAll(".mc-group-row").forEach(bindGroupRow);

  var recipDlg = document.getElementById("mc-recip");
  var recipOpen = document.getElementById("mc-recip-open");
  if (recipOpen) recipOpen.addEventListener("click", function () { recipDlg.showModal(); });
  document.getElementById("mc-recip-close").addEventListener("click", function () { recipDlg.close(); });
  recipDlg.addEventListener("click", function (e) { if (e.target === recipDlg) recipDlg.close(); });
  var recipStatus = "all";
  function recipFilter() {
    var q = document.getElementById("mc-recip-search").value.trim().toLowerCase();
    recipDlg.querySelectorAll(".mc-recip__row").forEach(function (r) {
      var okStatus = recipStatus === "all" || r.dataset.status === recipStatus;
      var okSearch = !q || (r.dataset.name + " " + r.dataset.id).toLowerCase().indexOf(q) !== -1;
      r.hidden = !(okStatus && okSearch);
    });
  }
  recipDlg.querySelectorAll(".mc-recip-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      recipDlg.querySelectorAll(".mc-recip-chip").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      recipStatus = chip.dataset.status;
      recipFilter();
    });
  });
  document.getElementById("mc-recip-search").addEventListener("input", recipFilter);

  applyFilter();
  updateUnreadCounter();
})();`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Staff Message Center — hp-design prototype</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
${gwizCss}
${groupCss}
</style>
</head>
<body>
<div class="mc">
  <header class="mc__topbar">
    <div class="mc__brand">
      <span class="mc__brand-mark">${iconOf("mail", "")}</span>
      <h1>Message Center</h1>
      <span class="badge badge--base badge--role-neutral mc__dept-badge">Academic Advising</span>
    </div>
    <div class="mc__topbar-end">
      <div class="mc-split mc-topbar-new">
        <button class="mc-split__main" id="mc-new-desktop" type="button">${iconOf("edit", "btn__icon")}New Message</button>
        <button class="mc-split__chevron" type="button" popovertarget="mc-new-menu" aria-haspopup="menu" aria-label="More send options">${iconOf("expand_more", "btn__icon")}</button>
      </div>
      <div class="listbox" id="mc-new-menu" popover>
        <ul class="listbox__list" role="menu" aria-label="New message">
          <li><button class="listbox__option" role="menuitem" type="button" id="mc-new-single">New Message</button></li>
          <li><button class="listbox__option" role="menuitem" type="button" id="mc-new-group">New Group Message</button></li>
        </ul>
      </div>
      ${avatarMarkup(SELF.name, "sm").replace('class="avatar', 'class="mc__user avatar')}
    </div>
  </header>
  <div class="mc__body">
    <aside class="mc__rail" aria-label="Thread list">
      <div class="mc-rail__topbar">
        <div class="tabs tabs--segmented tabs--sm" role="tablist">
          <button class="tab tab--sm tab--active" role="tab" aria-selected="true" data-tab="inbox">Inbox<span class="counter counter--sm counter--onNeutral counter--active" id="mc-unread-counter">${threads.filter((t) => !t.archived && t.unread).length}</span></button>
          <button class="tab tab--sm" role="tab" aria-selected="false" data-tab="archived">Resolved</button>
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
              <span class="listbox__cb-box">${iconCbCheck}</span><span class="listbox__cb-label">Due soon</span></label></li>
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
        <div class="mc-table">
          <div class="mc-thead mc-console-cols">
            <div class="mc-th">Student</div>
            <div class="mc-th">Subject &amp; Message</div>
            <div class="mc-th mc-col-responsible">Responsible</div>
            <div class="mc-th mc-col-expiration">Expiration</div>
            <div class="mc-th" style="text-align:right">Date</div>
            <div class="mc-th"></div>
          </div>
          <div class="mc-list" data-list="inbox">
            ${inboxThreads.map((t, i) => rowMarkup(t, i)).join("\n          ")}
          </div>
          <div class="mc-list" data-list="archived" hidden>
            ${groupCardMarkup(GROUP)}
            ${archivedThreads.map((t, i) => rowMarkup(t, inboxThreads.length + i)).join("\n          ")}
          </div>
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
      ${groupPaneMarkup(GROUP)}
    </section>
  </div>
</div>
${composeMarkup}
${gwizMarkup}
${recipDrawerMarkup}

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
<title>hp-design — Staff Message Center</title>
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
    ${renderNav("staff-message-center", { basePath: "../" })}
  </nav>
  <main>
    <h1>Staff Message Center</h1>
    <p class="sub">Interactive prototype, built strictly from hp-design components (every recipe resolved from its own token file) — the OTHER side of the Student Message Center: the department inbox where staff answer incoming student threads. Rows lead with the student and carry Handled by / Unassigned / Awaiting reply / due-date states; Resolve really moves a thread to the Resolved tab; the reply composer is Composer's rich variant (B/I/U, Merge Tags, AI Assist, Allow Replies, Expiration) and Send appends a real staff Bubble. New message is a floating action button on mobile / a topbar button on split views: a compose dialog (Department, Subject, rich message, Allow Replies + Expire Thread checkboxes) beside an AI Writing Assist panel — suggestion chips, a real chat, tone/length — that also opens standalone from the in-thread AI Assist.</p>

    <div class="device-bar">
      <div class="tabs tabs--segmented tabs--base" role="tablist" aria-label="Preview viewport">
        <button class="tab tab--base tab--active" role="tab" aria-selected="true" data-device="mobile">Mobile</button>
        <button class="tab tab--base" role="tab" aria-selected="false" data-device="tablet">Tablet</button>
        <button class="tab tab--base" role="tab" aria-selected="false" data-device="desktop">Desktop</button>
      </div>
      <a class="open-standalone" href="staff-message-center-app.html" target="_blank" rel="noopener">Open standalone ↗</a>
    </div>
    <div class="frame-wrap">
      <div class="device device--mobile" id="device">
        <iframe src="staff-message-center-app.html" title="Staff Message Center prototype"></iframe>
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
fs.writeFileSync(path.join(root, "docs/designs/staff-message-center-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/staff-message-center.html"), viewerHtml);
console.log("wrote docs/designs/staff-message-center-app.html");
console.log("wrote docs/designs/staff-message-center.html");
