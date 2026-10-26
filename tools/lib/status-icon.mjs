// Status Icon — done / todo / error as one 20px mark. One shared definition
// (CSS + markup) so the DS page, Accordion's stories and the Explore Degrees
// requirement rows render the same thing. Self-resolving like calendar.mjs:
// a consumer adds STATUS_ICON_COLOR_PATHS to its :root vars and STATUS_ICON_CSS
// to its sheet, then calls statusIcon("done").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const si = load("tokens/components/status-icon.tokens.json").component.statusIcon;

const refPath = (ref) => ref.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node.$value))})`;
const sizeNode = dim[refPath(si.size.$value).split(".")[1]].$value;
const size = `${sizeNode.value}${sizeNode.unit}`;

export const STATUS_KINDS = { done: "check", todo: "radio_button_unchecked", error: "error" };
export const STATUS_ICON_COLOR_PATHS = Object.keys(STATUS_KINDS).map((k) => refPath(si[k].color.$value));

export const STATUS_ICON_CSS = `
.status-icon { flex-shrink: 0; display: block; width: ${size}; height: ${size}; }
${Object.keys(STATUS_KINDS).map((k) => `.status-icon--${k} { color: ${R(si[k].color)}; }`).join("\n")}`;

const svg = (name) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8");

/** The icon's markup. Pass `label` when there's no visible text saying the same thing. */
export function statusIcon(kind, { label = "", extraClass = "" } = {}) {
  if (!STATUS_KINDS[kind]) throw new Error(`status-icon: unknown kind ${kind}`);
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return svg(STATUS_KINDS[kind]).replace("<svg ", `<svg class="status-icon status-icon--${kind}${extraClass ? ` ${extraClass}` : ""}" ${a11y} `);
}
