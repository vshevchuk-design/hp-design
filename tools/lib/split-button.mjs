// SplitButton — a Button with a chevron segment that opens a DropdownMenu of
// alternatives. Primary or Secondary. Shown on the Button page; one recipe
// for every consumer.
//
// Consumer: SPLIT_BUTTON_COLOR_PATHS into :root, SPLIT_BUTTON_CSS into its
// sheet, SPLIT_BUTTON_JS after the markup.
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
const sb = load("tokens/components/split-button.tokens.json").component.splitButton;
const menu = load("tokens/components/dropdown-menu.tokens.json").component.dropdownMenu;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`split-button: unresolved token ${ref}`);
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
const T = (node) => { const t = resolveToken(node); return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; };
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const sec = sb.secondary, ms = menu.state;
const colorNodes = [sb.fill, sb.fillHover, sb.fillActive, sb.text, sb.icon, sb.divider, sb.focus.ringColor, sec.fill, sec.fillHover, sec.fillActive, sec.text, sec.icon, sec.divider,
  menu.bg, menu.border, ms.default.text, ms.default.icon, ms.hover.bg];
export const SPLIT_BUTTON_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];

const sh = resolveToken(menu.shadow);
const mShadow = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const rad = D(sb.radius);

export const SPLIT_BUTTON_CSS = `
.split { display: inline-flex; align-items: stretch; height: ${D(sb.size.height)}; border-radius: ${rad}; font-family: var(${cssVarName("family.sans")}); }
.split__main, .split__chevron { border: none; margin: 0; cursor: pointer; display: inline-flex; align-items: center; font-family: inherit; }
.split__main { gap: ${D(sb.size.gap)}; padding: 0 ${D(sb.size.paddingX)}; border-radius: ${rad} 0 0 ${rad}; ${T(sb.size.label)} }
.split__chevron { justify-content: center; width: ${D(sb.size.chevronWidth)}; padding: 0; border-radius: 0 ${rad} ${rad} 0; }
.split__icon, .split__chevron-icon { width: ${D(sb.size.iconSize)}; height: ${D(sb.size.iconSize)}; flex-shrink: 0; }
.split__main:focus-visible, .split__chevron:focus-visible { outline: ${D(sb.focus.ringWidth)} solid ${R(sb.focus.ringColor)}; outline-offset: ${D(sb.focus.ringOffset)}; position: relative; z-index: 1; }
/* Primary */
.split--primary .split__main, .split--primary .split__chevron { background: ${R(sb.fill)}; color: ${R(sb.text)}; }
.split--primary .split__chevron { box-shadow: inset 1px 0 0 ${R(sb.divider)}; }
.split--primary .split__icon, .split--primary .split__chevron-icon { color: ${R(sb.icon)}; }
.split--primary .split__main:hover, .split--primary .split__chevron:hover { background: ${R(sb.fillHover)}; }
.split--primary .split__main:active, .split--primary .split__chevron:active, .split--primary .split__chevron[aria-expanded="true"] { background: ${R(sb.fillActive)}; }
/* Secondary */
.split--secondary .split__main, .split--secondary .split__chevron { background: ${R(sec.fill)}; color: ${R(sec.text)}; }
.split--secondary .split__chevron { box-shadow: inset 1px 0 0 ${R(sec.divider)}; }
.split--secondary .split__icon, .split--secondary .split__chevron-icon { color: ${R(sec.icon)}; }
.split--secondary .split__main:hover, .split--secondary .split__chevron:hover { background: ${R(sec.fillHover)}; }
.split--secondary .split__main:active, .split--secondary .split__chevron:active, .split--secondary .split__chevron[aria-expanded="true"] { background: ${R(sec.fillActive)}; }
/* the DropdownMenu the chevron opens — resolved from dropdown-menu.tokens.json */
.split__menu { margin: 0; box-sizing: border-box; padding: ${D(menu.padding)}; border-radius: ${D(menu.radius)}; background: ${R(menu.bg)}; border: 1px solid ${R(menu.border)}; box-shadow: ${mShadow}; min-width: 200px; font-family: var(${cssVarName("family.sans")}); }
.split__menu-item { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${D(menu.itemGap)}; height: ${D(menu.itemHeight)}; padding: 0 ${D(menu.itemPaddingX)}; border: none; background: none; border-radius: ${D(menu.itemRadius)}; cursor: pointer; text-align: left; color: ${R(ms.default.text)}; font-family: inherit; ${T(menu.label)} }
.split__menu-item:hover, .split__menu-item:focus-visible { background: ${R(ms.hover.bg)}; outline: none; }
.split__menu-icon { width: ${D(menu.iconSize)}; height: ${D(menu.iconSize)}; color: ${R(ms.default.icon)}; flex-shrink: 0; }`;

/** A SplitButton. items: [{ label, icon }] for its menu. */
export function splitButtonHtml({ id, label, icon: iconName = "", variant = "primary", items = [], menuLabel = "More options" }) {
  return `<div class="split split--${variant}">
  <button class="split__main" type="button">${iconName ? icon(iconName, "split__icon") : ""}${label}</button>
  <button class="split__chevron" type="button" popovertarget="${id}-menu" aria-label="${menuLabel}" aria-haspopup="menu" aria-expanded="false">${icon("expand_more", "split__chevron-icon")}</button>
</div>
<div class="split__menu" id="${id}-menu" popover role="menu">
  ${items.map((it) => `<button class="split__menu-item" role="menuitem" type="button">${it.icon ? icon(it.icon, "split__menu-icon") : ""}${it.label}</button>`).join("\n  ")}
</div>`;
}

// The menu opens under the chevron, its right edge on the button's right edge.
export const SPLIT_BUTTON_JS = `(function () {
  document.querySelectorAll(".split__chevron").forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute("popovertarget"));
    if (!menu || menu._hpsplit) return; menu._hpsplit = true;
    menu.addEventListener("toggle", function (e) {
      btn.setAttribute("aria-expanded", String(e.newState === "open"));
      if (e.newState !== "open") return;
      var r = btn.getBoundingClientRect();
      menu.style.position = "fixed"; menu.style.margin = "0"; menu.style.right = "auto"; menu.style.bottom = "auto";
      menu.style.top = (r.bottom + 4) + "px";
      menu.style.left = Math.max(8, r.right - menu.offsetWidth) + "px";
    });
    menu.addEventListener("click", function (e) { if (e.target.closest(".split__menu-item")) menu.hidePopover(); });
  });
})();`;
