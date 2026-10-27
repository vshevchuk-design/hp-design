// Toast — transient feedback floating top-centre. One line or two (title +
// description) and an optional action (Undo). A toast with an action shows a
// timer bar that drains over its life; every toast pauses while the pointer or
// focus is on it. The role icon
// is the shared StatusIcon. One definition for the Toast page and prototypes.
//
// Consumer: TOAST_COLOR_PATHS into :root, TOAST_CSS into its sheet (it
// includes StatusIcon's CSS), TOAST_JS — then showToast({...}).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";
import { STATUS_ICON_COLOR_PATHS, STATUS_ICON_CSS, statusIcon } from "./status-icon.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const t = load("tokens/components/toast.tokens.json").component.toast;
const button = load("tokens/components/button.tokens.json").component.button;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`toast: unresolved token ${ref}`);
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
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const T = (node) => { const x = resolveToken(node); return `font-weight: ${x.fontWeight}; font-size: ${px(x.fontSize)}; line-height: ${x.lineHeight};`; };

const tint = button.tint, ghost = button.ghost, sm = tint.size?.sm || button.primary.size.sm;
const colorNodes = [t.bg, t.border, t.labelColor, t.titleColor, t.descriptionColor, t.timer.color,
  tint.state.default.fill, tint.state.default.label, tint.state.hover.fill, tint.state.pressed.fill, ghost.state.focused.ringColor];
export const TOAST_COLOR_PATHS = [...new Set([...colorNodes.map(refPath), ...STATUS_ICON_COLOR_PATHS])];
export const TOAST_DURATIONS = { default: parseInt(t.duration.default.$value, 10), withAction: parseInt(t.duration.withAction.$value, 10) };

const sh = resolveToken(t.shadow);
const shadow = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const ring = `${D(ghost.state.focused.ringWidth)} solid ${R(ghost.state.focused.ringColor)}`;

export const TOAST_CSS = `
.toast { position: fixed; inset: auto; top: ${D(t.offsetTop)}; left: 50%; transform: translateX(-50%); margin: 0; box-sizing: border-box; max-width: min(${D(t.maxWidth)}, calc(100vw - 32px)); overflow: hidden; display: flex; align-items: flex-start; gap: ${D(t.gap)}; padding: ${D(t.paddingY)} ${D(t.paddingX)}; border-radius: ${D(t.radius)}; background: ${R(t.bg)}; border: none; box-shadow: inset 0 0 0 1px ${R(t.border)}, ${shadow}; font-family: var(${cssVarName("family.sans")}); }
.toast--static { position: relative; top: auto; left: auto; transform: none; }
.toast__icon { flex-shrink: 0; }
.toast__text { display: flex; flex-direction: column; gap: ${D(t.textGap)}; min-width: 0; padding-top: 0; }
.toast__label { margin: 0; color: ${R(t.labelColor)}; ${T(t.label)} line-height: ${D(t.labelLineHeight)}; }
.toast__title { margin: 0; color: ${R(t.titleColor)}; ${T(t.title)} line-height: ${D(t.textLineHeight)}; }
.toast__description { margin: 0; color: ${R(t.descriptionColor)}; ${T(t.description)} line-height: ${D(t.textLineHeight)}; }
/* one line: the icon and the label share a centre */
.toast:not(:has(.toast__description)) { align-items: center; }
.toast__actions { display: flex; align-items: center; gap: ${D(t.gap)}; margin-left: calc(${D(t.actionGap)} - ${D(t.gap)}); align-self: center; flex-shrink: 0; }
/* the action — Button tint sm */
.toast__action { box-sizing: border-box; height: ${D(sm.height)}; padding: 0 ${D(sm.paddingX)}; border: none; border-radius: ${D(button.primary.radius)}; background: ${R(tint.state.default.fill)}; color: ${R(tint.state.default.label)}; cursor: pointer; font-family: inherit; ${T(sm.label)} white-space: nowrap; }
.toast__action:hover { background: ${R(tint.state.hover.fill)}; }
.toast__action:active { background: ${R(tint.state.pressed.fill)}; }
.toast__action:focus-visible { outline: ${ring}; outline-offset: ${D(ghost.state.focused.ringOffset)}; }
/* the hairline is an inset shadow (inside the box), so heights are 12 + lines + 12 */
/* timer: the bar's animation is every toast's clock (pauses while hovered or focused);
   it is drawn only on a toast with an action — how long Undo stays */
.toast__timer { position: absolute; left: 0; right: 0; bottom: 0; height: ${D(t.timer.height)}; background: ${R(t.timer.color)}; transform-origin: left; animation: toast-timer var(--toast-duration, ${TOAST_DURATIONS.default}ms) linear forwards; }
.toast:hover .toast__timer, .toast:focus-within .toast__timer { animation-play-state: paused; }
.toast:not(:has(.toast__action)) .toast__timer { opacity: 0; }
@keyframes toast-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.toast--static .toast__timer { animation: none; transform: scaleX(0.6); }
/* entry */
.toast:popover-open { opacity: 1; translate: 0 0; transition: opacity 0.18s ease, translate 0.18s ease; }
@starting-style { .toast:popover-open { opacity: 0; translate: 0 -8px; } }
${STATUS_ICON_CSS}`;

const KIND = { info: "info", success: "success", warning: "warning", danger: "error" };

/** Static markup (for docs / Figma-like previews). */
export function toastHtml({ role = "success", title = "", text, action = "", timer = false, isStatic = false }) {
  const body = title
    ? `<div class="toast__text"><p class="toast__title">${title}</p>${text ? `<p class="toast__description">${text}</p>` : ""}</div>`
    : `<div class="toast__text"><p class="toast__label">${text}</p></div>`;
  const acts = action ? `<div class="toast__actions"><button class="toast__action" type="button">${action}</button></div>` : "";
  return `<div class="toast toast--${role}${isStatic ? " toast--static" : ""}" role="${role === "danger" ? "alert" : "status"}">${statusIcon(KIND[role], { extraClass: "toast__icon" })}${body}${acts}${timer ? '<span class="toast__timer" aria-hidden="true"></span>' : ""}</div>`;
}

// showToast({ role, title, text, action: { label, onClick }, duration }).
// popover="manual": top layer, no light-dismiss. One at a time — a new toast
// replaces the one showing. The clock pauses while hovered or focused, and an
// action toast gets the longer duration.
export const TOAST_JS = `(function () {
  var ICONS = ${JSON.stringify(Object.fromEntries(Object.entries(KIND).map(([r, k]) => [r, statusIcon(k, { extraClass: "toast__icon" })])))};
  var current = null;
  window.showToast = function (o) {
    if (current) current.dismiss();
    var role = o.role || "success", hasAction = !!o.action;
    var ms = o.duration || (hasAction ? ${TOAST_DURATIONS.withAction} : ${TOAST_DURATIONS.default});
    var t = document.createElement("div");
    t.className = "toast toast--" + role; t.setAttribute("popover", "manual"); t.setAttribute("role", role === "danger" ? "alert" : "status");
    t.style.setProperty("--toast-duration", ms + "ms");
    var text = document.createElement("div"); text.className = "toast__text";
    if (o.title) { var h = document.createElement("p"); h.className = "toast__title"; h.textContent = o.title; text.appendChild(h); if (o.text) { var d = document.createElement("p"); d.className = "toast__description"; d.textContent = o.text; text.appendChild(d); } }
    else { var l = document.createElement("p"); l.className = "toast__label"; l.textContent = o.text; text.appendChild(l); }
    t.innerHTML = ICONS[role]; t.appendChild(text);
    var acts = document.createElement("div"); acts.className = "toast__actions";
    if (hasAction) { var a = document.createElement("button"); a.type = "button"; a.className = "toast__action"; a.textContent = o.action.label; a.addEventListener("click", function () { o.action.onClick && o.action.onClick(); dismiss(); }); acts.appendChild(a); }
    if (acts.children.length) t.appendChild(acts);
    var bar = document.createElement("span"); bar.className = "toast__timer"; bar.setAttribute("aria-hidden", "true"); t.appendChild(bar);
    document.body.appendChild(t); t.showPopover();
    // the timer bar's animation is the clock: it pauses on hover/focus (CSS) and ends the toast
    function dismiss() { if (!t.isConnected) return; try { t.hidePopover(); } catch (e) {} t.remove(); if (current && current.el === t) current = null; }
    bar.addEventListener("animationend", dismiss);
    current = { el: t, dismiss: dismiss };
    return current;
  };
})();`;
