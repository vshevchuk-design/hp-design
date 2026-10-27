// Select + Listbox — the trigger field and the panel it opens, one definition
// for the Select and Listbox pages, Form, and every later field built on them
// (Combobox, MultiSelect…). Select is a real <button aria-haspopup="listbox">
// on Input's box model; the panel is a native popover with role="listbox".
//
// Consumer: SELECT_COLOR_PATHS into :root, LISTBOX_CSS (+ SELECT_CSS) into its
// sheet and SELECT_JS after the markup. Each .select-field fires a bubbling
// `selectchange` event (detail.value — a string, or an array when multiple).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

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
const lb = load("tokens/components/listbox.tokens.json").component.listbox;
const sel = load("tokens/components/select.tokens.json").component.select;
const search = load("tokens/components/search.tokens.json").component.search;
const badge = load("tokens/components/badge.tokens.json").component.badge;
const command = load("tokens/components/command.tokens.json").component.command;
const counter = load("tokens/components/counter.tokens.json").component.counter;
const checkbox = load("tokens/components/checkbox.tokens.json").component.checkbox;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`select: unresolved token ${ref}`);
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
const P = (ref) => px(resolveToken(get(ref)));
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const T = (node) => typoCss(resolveToken(node));
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const st = sel.state, cbS = checkbox.state;
const cnt = counter.onNeutral.state.inactive, cntSize = counter.size.sm;
const colorNodes = [
  st.default.bg, st.default.border, st.default.placeholder, st.default.value, st.default.icon, st.default.chevron, st.hover.bg, st.hover.border,
  st.focus.border, st.focus.label, st.open.border, st.open.label, st.populated.label, st.disabled.bg, st.disabled.border, st.disabled.placeholder, st.disabled.value, st.disabled.icon, st.disabled.chevron, st.disabled.label, st.error.border,
  lb.bg, lb.border, lb.divider, lb.state.default.text, lb.state.hover.bg, lb.state.selected.checkmark, lb.descriptionColor,
  badge.role.neutral.tint.bg, badge.role.neutral.tint.text, command.group.headingColor, cnt.bg, cnt.label,
  cbS.default.bg, cbS.default.border, cbS.checked.bg, cbS.checked.border, cbS.checked.icon,
];
export const SELECT_COLOR_PATHS = [...new Set([...colorNodes.map(refPath), "border.focus", "surface.dim", "icon.default", "text.default", "text.secondary", "text.muted", "text.primary"])];

const sh = resolveToken(lb.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const clearNode = get(lb.selectAllRow.clearAction.$value);
const clearDeco = clearNode.$extensions?.["hp.design/text"]?.textDecoration;
const hide = "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";

export const LISTBOX_CSS = `
.listbox { margin: 0; box-sizing: border-box; padding: ${D(lb.padding)}; border-radius: ${D(lb.radius)}; background: ${R(lb.bg)}; border: 1px solid ${R(lb.border)}; box-shadow: ${shadowCss}; font-family: ${cv("family.sans")}; min-width: 220px; }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(lb.gap)}; max-height: ${D(lb.maxHeight)}; overflow: auto; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; border: none; background: none; border-radius: ${D(lb.optionRadius)}; cursor: pointer; text-align: left; color: ${R(lb.state.default.text)}; font-family: inherit; ${T(lb.label)} }
.listbox__option:hover, .listbox__option:focus-visible { background: ${R(lb.state.hover.bg)}; outline: none; }
/* An option with a description + a trailing kind badge. The text stack takes
   the remaining width so a long programme name wraps instead of pushing the
   badge out of the panel. */
.listbox__stack { display: flex; flex-direction: column; gap: ${D(lb.stackGap)}; min-width: 0; flex: 1; }
.listbox__desc { color: ${R(lb.descriptionColor)}; ${T(lb.description)} }
.listbox__trailing { flex-shrink: 0; margin-left: ${D(lb.trailingGap)}; display: inline-flex; align-items: center; height: ${D(badge.size.sm.height)}; padding: 0 ${D(badge.size.sm.paddingX)}; border-radius: ${D(badge.radius)}; background: ${R(badge.role.neutral.tint.bg)}; color: ${R(badge.role.neutral.tint.text)}; ${T(badge.size.sm.label)} }
/* single-select: a trailing checkmark on the chosen option, no tint */
.listbox__checkmark { width: ${D(lb.checkmarkSize)}; height: ${D(lb.checkmarkSize)}; margin-left: auto; color: ${R(lb.state.selected.checkmark)}; flex-shrink: 0; }
.listbox__option[aria-selected="false"] .listbox__checkmark { visibility: hidden; }

/* multi-select: a real Checkbox marker per option (checkbox.tokens.json) */
.listbox__cb-option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${D(lb.optionGap)}; padding: ${D(lb.optionPaddingY)} ${D(lb.optionPaddingX)}; border-radius: ${D(lb.optionRadius)}; cursor: pointer; }
.listbox__cb-option:hover { background: ${R(lb.state.hover.bg)}; }
.listbox__cb-input { ${hide} }
.listbox__cb-box { box-sizing: border-box; width: ${D(lb.checkbox.box)}; height: ${D(lb.checkbox.box)}; border-radius: ${D(lb.checkbox.radius)}; border: ${D(lb.checkbox.borderWidth)} solid ${R(cbS.default.border)}; background: ${R(cbS.default.bg)}; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.listbox__cb-icon { width: ${D(checkbox.size.iconSize)}; height: ${D(checkbox.size.iconSize)}; display: none; color: ${R(cbS.checked.icon)}; }
.listbox__cb-input:checked ~ .listbox__cb-box, .listbox__option[aria-selected="true"] .listbox__cb-box { background: ${R(cbS.checked.bg)}; border-color: ${R(cbS.checked.border)}; }
.listbox__cb-input:checked ~ .listbox__cb-box .listbox__cb-icon, .listbox__option[aria-selected="true"] .listbox__cb-box .listbox__cb-icon { display: block; }
.listbox__cb-label { color: ${R(lb.state.default.text)}; font-family: inherit; ${T(lb.label)} }

.listbox__search-wrap { padding: ${P("dim.1")} ${P("dim.1")} ${D(lb.search.gapBelow)}; margin-bottom: ${P("dim.0_5")}; border-bottom: 1px solid ${R(lb.divider)}; }
.listbox__search { display: flex; align-items: center; box-sizing: border-box; height: ${D(search.size.sm.height)}; padding: 0 ${D(search.size.sm.paddingX)}; gap: ${D(search.size.sm.gap)}; border-radius: ${P("radius.default")}; background: ${cv("surface.dim")}; border: 1px solid ${R(lb.border)}; }
.listbox__search-icon { width: ${D(search.size.sm.iconSize)}; height: ${D(search.size.sm.iconSize)}; color: ${cv("icon.default")}; flex-shrink: 0; }
.listbox__search input { border: none; background: none; outline: none; width: 100%; color: ${cv("text.default")}; font-family: inherit; ${T(search.value)} }
.listbox__search input::placeholder { color: ${cv("text.muted")}; }

.listbox__select-all { display: flex; align-items: center; justify-content: space-between; gap: ${P("dim.2")}; padding: ${P("dim.1")} ${P("dim.2")}; }
.listbox__select-all-label { color: ${cv("text.secondary")}; margin: 0; ${T(lb.selectAllRow.label)} }
.listbox__clear { border: none; background: none; padding: 0; cursor: pointer; color: ${cv("text.primary")}; ${T(lb.selectAllRow.clearAction)}${clearDeco ? ` text-decoration: ${clearDeco};` : ""} }

/* groups ("Fruits", "Vegetables") — Command's group heading, a hairline between groups */
.listbox__group { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${D(lb.gap)}; }
.listbox__group-label { box-sizing: border-box; height: ${D(command.group.headingHeight)}; display: flex; align-items: center; padding: 0 ${D(lb.optionPaddingX)}; color: ${R(command.group.headingColor)}; ${T(command.group.heading)} }
.listbox__divider { height: 1px; margin: ${P("dim.1")} 0; background: ${R(lb.divider)}; }`;

const sizeCss = ["base", "sm", "lg"].map((k) => {
  const z = sel.size[k];
  const s = k === "base" ? ".select" : `.select--${k}`;
  const lines = [
    `${s} { height: ${D(z.height)}; padding: 0 ${D(z.paddingX)}; gap: ${D(z.gap)}; }`,
    `${s} .select__icon, ${s} .select__chevron { width: ${D(z.iconSize)}; height: ${D(z.iconSize)}; }`,
    `${s} .select__value { ${T(z.value)} }`,
  ];
  if (z.label) lines.push(`${s} .select__stack { gap: ${D(z.labelGap)}; }`, `${s} .select__label { ${T(z.label)} }`);
  return lines.join("\n");
}).join("\n");

export const SELECT_CSS = `
/* Select — the trigger. A real <button> on Input's box model; the value floats
   a 12px label above it once something is chosen (base/lg). */
.select-field { position: relative; display: block; min-width: 0; }
.select { box-sizing: border-box; display: flex; align-items: center; width: 100%; margin: 0; background: ${R(st.default.bg)}; border: 1px solid ${R(st.default.border)}; border-radius: ${D(sel.radius)}; font-family: ${cv("family.sans")}; text-align: left; cursor: pointer; }
${sizeCss}
.select__stack { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; }
.select__label { color: ${R(st.populated.label)}; white-space: nowrap; }
.select__value { display: flex; align-items: center; gap: ${P("dim.2")}; min-width: 0; color: ${R(st.default.value)}; }
.select__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select__icon { flex-shrink: 0; color: ${R(st.default.icon)}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${R(st.default.chevron)}; transition: transform 0.12s ease; }
/* nothing chosen: the label's text is the placeholder; sm never floats */
.select.is-placeholder .select__label, .select--sm .select__label { ${hide} }
.select.is-placeholder .select__value { color: ${R(st.default.placeholder)}; }
/* multiple: the first choice + a Counter for the rest ("Email  +2") */
.select__more { flex-shrink: 0; box-sizing: border-box; min-width: ${D(cntSize.minWidth)}; height: ${D(cntSize.height)}; padding: 0 ${D(cntSize.paddingX)}; display: inline-flex; align-items: center; justify-content: center; border-radius: ${D(counter.radius)}; background: ${R(cnt.bg)}; color: ${R(cnt.label)}; ${T(cntSize.label)} }
.select__more[hidden] { display: none; }
/* states */
.select:not(:disabled):hover { background: ${R(st.hover.bg)}; border-color: ${R(st.hover.border)}; }
.select:focus-visible { outline: none; border-color: ${R(st.focus.border)}; }
/* open — the list is showing: focus border, blue label, the chevron turns up */
.select[aria-expanded="true"], .select[aria-expanded="true"]:hover { border-color: ${R(st.open.border)}; }
.select[aria-expanded="true"] .select__label { color: ${R(st.open.label)}; }
.select[aria-expanded="true"] .select__chevron { transform: rotate(${st.open.chevronRotation.$value}deg); }
.select:disabled { background: ${R(st.disabled.bg)}; border-color: ${R(st.disabled.border)}; cursor: not-allowed; }
.select:disabled .select__value { color: ${R(st.disabled.value)}; }
.select:disabled.is-placeholder .select__value { color: ${R(st.disabled.placeholder)}; }
.select:disabled .select__label { color: ${R(st.disabled.label)}; }
.select:disabled .select__icon { color: ${R(st.disabled.icon)}; }
.select:disabled .select__chevron { color: ${R(st.disabled.chevron)}; }
.select[aria-invalid="true"], .select[aria-invalid="true"]:hover { border-color: ${R(st.error.border)}; }
/* the panel — Listbox, under the field, at least as wide as it */
.select__panel { margin: 0; }`;

const chevron = () => icon("expand_more", "select__chevron");
const check = () => icon("check", "listbox__checkmark");
const cbGlyph = () => icon("check", "listbox__cb-icon");

/** A Select. options: [{ label, value, group }] — consecutive options with the same `group` render under its heading.
 *  value: a value (single) or an array (multiple). */
export function selectHtml({ id, label, options, value = "", multiple = false, size = "base", icon: iconName = "", disabled = false, invalid = false, describedBy = "", panelWidth = "" }) {
  const chosen = new Set([].concat(value).filter(Boolean));
  const picked = options.filter((o) => chosen.has(o.value ?? o.label));
  const empty = picked.length === 0;
  const first = empty ? label : picked[0].label;
  const lid = `${id}-list`;
  const opt = (o, i) => {
    const v = o.value ?? o.label, on = chosen.has(v);
    const inner = multiple ? `<span class="listbox__cb-box">${cbGlyph()}</span><span class="listbox__cb-label">${o.label}</span>` : `<span>${o.label}</span>${check()}`;
    return `<li role="none"><button type="button" class="listbox__option" role="option" id="${id}-opt-${i}" aria-selected="${on}" data-value="${v}" tabindex="-1">${inner}</button></li>`;
  };
  // group consecutive options
  const blocks = [];
  options.forEach((o, i) => { const g = o.group || ""; if (!blocks.length || blocks[blocks.length - 1].g !== g) blocks.push({ g, items: [] }); blocks[blocks.length - 1].items.push([o, i]); });
  const body = blocks.map((b, bi) => b.g
    ? `${bi ? `<li role="none"><div class="listbox__divider" role="separator"></div></li>` : ""}<li role="none"><ul class="listbox__group" role="group" aria-labelledby="${id}-g${bi}"><li role="presentation" class="listbox__group-label" id="${id}-g${bi}">${b.g}</li>${b.items.map(([o, i]) => opt(o, i)).join("")}</ul></li>`
    : b.items.map(([o, i]) => opt(o, i)).join("")).join("");
  const cls = `select${size !== "base" ? ` select--${size}` : ""}${empty ? " is-placeholder" : ""}`;
  return `<div class="select-field" data-select${multiple ? " data-multiple" : ""} data-value="${[...chosen].join(",")}" data-label="${label}">
  <button type="button" class="${cls}" id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${lid}" aria-labelledby="${id}-label ${id}-text"${disabled ? " disabled" : ""}${invalid ? ' aria-invalid="true"' : ""}${describedBy ? ` aria-describedby="${describedBy}"` : ""}>${iconName ? icon(iconName, "select__icon") : ""}<span class="select__stack"><span class="select__label" id="${id}-label">${label}</span><span class="select__value"><span class="select__text" id="${id}-text">${first}</span><span class="select__more"${picked.length > 1 ? "" : " hidden"}>+${Math.max(picked.length - 1, 0)}</span></span></span>${chevron()}</button>
  <div class="listbox select__panel" id="${lid}" popover role="listbox" aria-labelledby="${id}-label"${multiple ? ' aria-multiselectable="true"' : ""}${panelWidth ? ` style="width:${panelWidth}"` : ""}><ul class="listbox__list" role="none">${body}</ul></div>
</div>`;
}

// Opens under the field (flips above when there's no room), at least as wide
// as it. Keyboard: ↓/↑/Enter/Space open; in the list ↑/↓/Home/End move, Enter
// or Space pick, Escape closes back to the field, Tab closes. Single-select
// closes on pick; multiple stays open and the field shows "first +N".
export const SELECT_JS = `(function () {
  var GAP = ${resolveToken(get("dim.1")).value};
  document.querySelectorAll("[data-select]").forEach(function (wrap) {
    if (wrap._hpsel) return; wrap._hpsel = true;
    var trigger = wrap.querySelector(".select"), panel = wrap.querySelector(".select__panel"), multiple = wrap.hasAttribute("data-multiple");
    var text = wrap.querySelector(".select__text"), more = wrap.querySelector(".select__more");
    // focus an option without scrolling the page; keep it in view inside a long list
    function go(el) { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest" }); }
    var opts = function () { return Array.prototype.slice.call(panel.querySelectorAll(".listbox__option")); };
    function place() {
      var r = trigger.getBoundingClientRect(); panel.style.position = "fixed"; panel.style.right = "auto"; panel.style.bottom = "auto"; panel.style.minWidth = r.width + "px";
      var h = panel.offsetHeight, top = r.bottom + GAP;
      if (top + h > window.innerHeight - 8 && r.top - GAP - h > 8) top = r.top - GAP - h;
      panel.style.top = top + "px"; panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
    }
    function open(focusWhich) {
      if (trigger.disabled) return;
      if (!panel.matches(":popover-open")) { panel.showPopover(); place(); }
      var list = opts(), sel = list.filter(function (o) { return o.getAttribute("aria-selected") === "true"; })[0];
      var target = focusWhich === "last" ? list[list.length - 1] : (sel || list[0]);
      go(target);
    }
    function close(refocus) { if (panel.matches(":popover-open")) panel.hidePopover(); if (refocus) trigger.focus(); }
    function sync() {
      var on = opts().filter(function (o) { return o.getAttribute("aria-selected") === "true"; });
      wrap.dataset.value = on.map(function (o) { return o.dataset.value; }).join(",");
      trigger.classList.toggle("is-placeholder", on.length === 0);
      text.textContent = on.length ? on[0].textContent : wrap.dataset.label;
      more.hidden = on.length < 2; more.textContent = "+" + Math.max(on.length - 1, 0);
      wrap.dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: { value: multiple ? on.map(function (o) { return o.dataset.value; }) : (on[0] ? on[0].dataset.value : "") } }));
    }
    function pick(o) {
      if (multiple) { o.setAttribute("aria-selected", String(o.getAttribute("aria-selected") !== "true")); sync(); return; }
      opts().forEach(function (x) { x.setAttribute("aria-selected", String(x === o)); });
      sync(); close(true);
    }
    panel.addEventListener("toggle", function (e) { trigger.setAttribute("aria-expanded", String(e.newState === "open")); });
    trigger.addEventListener("click", function () { if (panel.matches(":popover-open")) close(false); else open(); });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); open("last"); }
    });
    panel.addEventListener("click", function (e) { var o = e.target.closest(".listbox__option"); if (o) pick(o); });
    panel.addEventListener("keydown", function (e) {
      var list = opts(), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); go(list[i + 1] || list[i]); }
      else if (e.key === "ArrowUp") { e.preventDefault(); go(list[i - 1] || list[i]); }
      else if (e.key === "Home") { e.preventDefault(); go(list[0]); }
      else if (e.key === "End") { e.preventDefault(); go(list[list.length - 1]); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (list[i]) pick(list[i]); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") { close(false); }
    });
  });
})();`;
