// Mirrors assets/ into docs/assets/ so Vercel (Root Directory: docs) can serve
// fonts/icons that live outside its deployment root. assets/ at repo root stays
// the source of truth — docs/assets/ is a generated copy, never hand-edited.
// Run: node tools/sync-docs-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "assets");
const dest = path.join(root, "docs/assets");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`synced ${src} -> ${dest}`);
