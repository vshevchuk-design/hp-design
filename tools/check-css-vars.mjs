// Fails if any generated page references a `--tok-*` custom property it never
// defines. Run after a rebuild: node tools/check-css-vars.mjs
//
// Why this exists: every builder emits only the vars listed in its own
// `colorPaths` array, but the values themselves come from component token
// files. So repointing a component token at a NEW semantic role (e.g.
// button.secondary.hover → fill.neutralHoverStrong, 2026-09-07) silently
// produces `var(--tok-fill-neutral-hover-strong)` with nothing defining it —
// the property just resolves to nothing and the element loses its background,
// with no build error and no console warning. Exactly the class of bug the
// --tok- prefix convention was introduced to make visible; this makes it
// impossible to ship instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const docs = path.join(root, "docs");

const pages = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) pages.push(p);
  }
})(docs);

let failures = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const defined = new Set([...html.matchAll(/(--tok-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...html.matchAll(/var\((--tok-[a-z0-9-]+)/g)].map((m) => m[1]));
  // A name ending in "-" is a prefix built at runtime by prototype JS
  // (e.g. 'var(--tok-avatar-' + hue + '-bg)') — assert the family exists
  // rather than the literal, which would never be defined.
  const missing = [...used]
    .filter((v) => (v.endsWith("-") ? ![...defined].some((d) => d.startsWith(v)) : !defined.has(v)))
    .sort();
  if (missing.length) {
    failures++;
    console.error(`${path.relative(root, page)} — uses ${missing.length} undefined var(s):`);
    for (const v of missing) console.error(`    ${v}`);
  }
}

if (failures) {
  console.error(`\n${failures} page(s) reference undefined --tok- properties. Add the token path to that builder's colorPaths.`);
  process.exit(1);
}
console.log(`ok — ${pages.length} pages, every var(--tok-*) is defined on its own page`);
