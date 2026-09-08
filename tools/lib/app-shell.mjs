// The student portal's app shell — page frame, 64px topbar, wordmark, and the
// Button-secondary recipe its actions use. Shared by every prototype screen in
// that product (Springboard, Explore Degrees, …).
//
// Extracted 2026-09-07 when the second portal screen was added. The Message
// Center's two builders duplicate their shell CSS between them and that has
// been carried as a known drift risk since v1; the designs *viewer* chrome was
// duplicated the same way until it moved to design-viewer.mjs. Rather than
// create a third instance of the same mistake, the shell moved here first.
// Same reasoning as nav.mjs and design-viewer.mjs: chrome that appears on more
// than one page gets exactly one definition.
//
// Everything resolves from the token files — the topbar's height is dim.16
// (declared, not summed: padding plus a 1px border can never land on the 4px
// grid, see the grid convention in logs/status.md), and the settings-style
// action is Button's secondary variant read straight out of button.tokens.json,
// including the Strong hover tier it needs for resting on gray.100.
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
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const button = load("tokens/components/button.tokens.json").component.button;

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
const cv = (p) => `var(${cssVarName(p)})`;
const refPath = (ref) => ref.replace(/[{}]/g, "");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

const secondary = {
  radius: px(resolve(button.secondary.radius.$value)),
  fill: refPath(button.secondary.state.default.fill.$value),
  label: refPath(button.secondary.state.default.label.$value),
  icon: refPath(button.secondary.state.default.icon.$value),
  hoverFill: refPath(button.secondary.state.hover.fill.$value),
  pressedFill: refPath(button.secondary.state.pressed.fill.$value),
  ringColor: refPath(button.secondary.state.focused.ringColor.$value),
  ringWidth: px(resolve(button.secondary.state.focused.ringWidth.$value)),
  ringOffset: px(resolve(button.secondary.state.focused.ringOffset.$value)),
  base: {
    height: px(resolve(button.secondary.size.base.height.$value)),
    iconSize: px(resolve(button.secondary.size.base.iconSize.$value)),
  },
  sm: {
    height: px(resolve(button.secondary.size.sm.height.$value)),
    paddingX: px(resolve(button.secondary.size.sm.paddingX.$value)),
    gap: px(resolve(button.secondary.size.sm.gap.$value)),
    label: resolveToken(button.secondary.size.sm.label),
  },
};

/** Token paths the shell CSS references — merge into the page's own colorPaths. */
export const SHELL_COLOR_PATHS = [
  "surface.page",
  "surface.default",
  "border.default",
  "border.focus",
  "text.default",
  secondary.fill,
  secondary.label,
  secondary.icon,
  secondary.hoverFill,
  secondary.pressedFill,
  secondary.ringColor,
];

/** The wordmark, with its own #090D19 text fill swapped for currentColor so it
 *  follows text.default — the same swap nav.mjs does; the blue mark stays fixed. */
export const LOGO_SVG = fs
  .readFileSync(path.join(root, "assets/highpoint-logo.svg"), "utf8")
  .replace(/fill="#090D19"/g, 'fill="currentColor"');

const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);

export const SHELL_TOPBAR_CSS = `/* ---- portal app shell (tools/lib/app-shell.mjs) ---- */
.app { min-height: 100%; display: flex; flex-direction: column; }
/* Exactly dim.16 (64px) tall, border included: everything lands on the 4px
   grid, and vertical padding + a 1px border can never total a multiple of 4
   (dim.3 + 40 + dim.3 + 1 = 65). So the height is declared and the hairline
   sits inside it (border-box), leaving a 63px content band with the 40px
   control optically centred. */
.app__topbar { position: sticky; top: 0; z-index: 1; height: ${px(resolve("dim.16"))}; display: flex; align-items: center; justify-content: space-between; gap: ${px(resolve("dim.3"))}; padding: 0 ${px(resolve("dim.4"))}; background: ${cv("surface.default")}; border-bottom: 1px solid ${cv("border.default")}; }
.app__logo { display: flex; align-items: center; color: ${cv("text.default")}; }
.app__logo svg { display: block; height: ${px(resolve("dim.6"))}; width: auto; }
@media (min-width: 768px) {
  /* match the content padding so the wordmark lines up with what's under it */
  .app__topbar { padding: 0 ${px(resolve("dim.6"))}; }
}

`;

/* The shell's own action button. Split from the topbar CSS so a page that
   already ships a full Button recipe (Explore Degrees needs primary and ghost
   as well) can take the topbar without a duplicate set of secondary rules. */
export const SHELL_BUTTON_CSS = `/* Button secondary — the shell's actions, resolved from button.tokens.json.
   Its icon colour is set explicitly: secondary's label (text.default) and icon
   (icon.default) are different values, so currentColor would be wrong. */
.btn { display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-family: inherit; border-radius: ${secondary.radius}; }
.btn--secondary { background: ${cv(secondary.fill)}; }
.btn--secondary.btn--base.btn--icon-only { width: ${secondary.base.height}; height: ${secondary.base.height}; padding: 0; }
.btn--secondary.btn--sm { height: ${secondary.sm.height}; padding: 0 ${secondary.sm.paddingX}; gap: ${secondary.sm.gap}; color: ${cv(secondary.label)}; ${typoCss(secondary.sm.label)} }
.btn--secondary .btn__icon { width: ${secondary.base.iconSize}; height: ${secondary.base.iconSize}; color: ${cv(secondary.icon)}; }
.btn--secondary:hover { background: ${cv(secondary.hoverFill)}; }
.btn--secondary:active { background: ${cv(secondary.pressedFill)}; }
.btn--secondary:focus-visible { outline: ${secondary.ringWidth} solid ${cv(secondary.ringColor)}; outline-offset: ${secondary.ringOffset}; }`;

/** Both halves — what a page wants unless it has its own Button recipe. */
export const SHELL_CSS = `${SHELL_TOPBAR_CSS}
${SHELL_BUTTON_CSS}`;

/** The topbar markup: wordmark left, actions right (defaults to Settings). */
export function shellTopbar({ actions } = {}) {
  const right =
    actions ??
    `<button class="btn btn--secondary btn--base btn--icon-only" type="button" aria-label="Settings">${icon("settings", "btn__icon")}</button>`;
  return `  <header class="app__topbar">
    <span class="app__logo">${LOGO_SVG}</span>
    ${right}
  </header>`;
}
