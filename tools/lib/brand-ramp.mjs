// Brand ramp — re-exports the algorithm from exports/brand-ramp.js, the one
// source of truth (that file is also what developers take: plain JS, no
// dependencies). brandRampSource is the function's text, for pages that
// embed it in an inline <script>.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export { brandRamp } from "../../exports/brand-ramp.js";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const brandRampSource = fs
  .readFileSync(path.join(root, "exports/brand-ramp.js"), "utf8")
  .replace(/^[\s\S]*?export function brandRamp/, "function brandRamp");
