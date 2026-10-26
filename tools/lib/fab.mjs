// FAB — the floating action button, as one shared definition (CSS + markup).
// Used by docs/fab.html and the CX shell's Assistant button. Self-resolving like
// status-icon.mjs: colours and states come from Button primary's tokens, the
// shape / size / elevation / corner from fab.tokens.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const registry = {
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
};
const fab = load("tokens/components/fab.tokens.json").component.fab;
const pri = load("tokens/components/button.tokens.json").component.button.primary;

const refPath = (ref) => ref.replace(/[{}]/g, "");
const get = (ref) => refPath(ref).split(".").reduce((n, k) => n[k], registry);
const px = (d) => `${d.value}${d.unit}`;
// follow aliases down to the value (radius.full → dim.max → 9999px)
const val = (v) => (typeof v === "string" && v.startsWith("{") ? val(get(v).$value) : v);
const D = (node) => px(val(node.$value));
const R = (node) => `var(${cssVarName(refPath(node.$value))})`;
const sh = val(fab.shadow.$value);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;
const ring = pri.state.focused;

export const FAB_COLOR_PATHS = [pri.state.default.fill, pri.state.default.icon, pri.state.hover.fill, pri.state.pressed.fill, ring.ringColor].map((n) => refPath(n.$value));

export const FAB_CSS = `
.fab { box-sizing: border-box; width: ${D(fab.size)}; height: ${D(fab.size)}; margin: 0; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: ${D(fab.radius)}; background: ${R(pri.state.default.fill)}; color: ${R(pri.state.default.icon)}; box-shadow: ${shadowCss}; cursor: pointer; }
.fab:hover { background: ${R(pri.state.hover.fill)}; }
.fab:active { background: ${R(pri.state.pressed.fill)}; }
.fab:focus-visible { outline: ${D(ring.ringWidth)} solid ${R(ring.ringColor)}; outline-offset: ${D(ring.ringOffset)}; }
.fab__icon { width: ${D(fab.iconSize)}; height: ${D(fab.iconSize)}; flex-shrink: 0; }
/* pinned to the bottom-right corner of the viewport, clear of the iOS home bar */
.fab--fixed { position: fixed; right: ${D(fab.offset)}; bottom: calc(${D(fab.offset)} + env(safe-area-inset-bottom)); z-index: 7; }
@media (max-width: 767px) { .fab--fixed { right: ${D(fab.offsetPhone)}; bottom: calc(${D(fab.offsetPhone)} + env(safe-area-inset-bottom)); } }`;

const svg = (name) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8");

/** FAB markup. `label` is required — the button has no visible text. */
export function fabHtml({ icon, label, id = "", fixed = true, attrs = "" }) {
  if (!label) throw new Error("fab: label is required");
  return `<button class="fab${fixed ? " fab--fixed" : ""}"${id ? ` id="${id}"` : ""} type="button" aria-label="${label}" title="${label}"${attrs ? ` ${attrs}` : ""}>${svg(icon).replace("<svg ", '<svg class="fab__icon" aria-hidden="true" ')}</button>`;
}
