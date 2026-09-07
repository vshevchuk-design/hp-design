// Fails if a :hover or :active rule paints the same background as the element's
// resting state — i.e. an interaction that renders as nothing.
// Run after a rebuild: node tools/check-states.mjs
//
// Why this exists: on 2026-09-07 `fill.neutralHover` was retargeted from
// gray.200 to gray.100 (correct for the ~14 consumers that rest on white), but
// three controls in the prototypes REST on gray.100 — the secondary button, the
// segmented-tabs track, the toolbar's icon buttons. Their hover became exactly
// their resting fill: still a valid token, still a defined CSS variable, so
// `check-css-vars.mjs` was perfectly happy. The user found four dead hovers by
// hand ("у цих табів немає нормальних ховерів", "втф???"). This is the check
// that would have caught it in the build.
//
// It resolves both sides through the page's own `--tok-*` values, so it compares
// rendered colours, not token names — two different roles that happen to alias
// the same hex are exactly the failure being hunted.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const pages = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) pages.push(p);
  }
})(path.join(root, "docs"));

/** last simple selector in a descendant chain: ".a:hover .b" -> ".b" */
const leaf = (sel) => sel.trim().split(/\s+(?![^(]*\))/).pop();
/** drop the interaction pseudo-classes but keep structural ones */
const stripState = (sel) => sel.replace(/:(hover|active|focus-visible|focus-within|focus)\b/g, "");
/** ".btn--x:not(:disabled)" -> ".btn--x" — :not() never changes which element is matched */
const stripNot = (sel) => sel.replace(/:not\([^)]*\)/g, "");
const norm = (sel) => stripNot(stripState(sel)).replace(/\s+/g, " ").trim();

let failures = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const vars = new Map(
    [...html.matchAll(/(--tok-[a-z0-9-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim()])
  );
  const resolve = (value) => {
    const v = value.trim();
    const m = v.match(/^var\((--tok-[a-z0-9-]+)\)$/);
    return m ? vars.get(m[1]) ?? v : v;
  };

  // selector (normalised) -> last background declared for it at rest
  const rest = new Map();
  const states = [];
  for (const rule of html.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectorList = rule[1].trim();
    if (selectorList.startsWith("@") || selectorList.includes("keyframes")) continue;
    const bg = [...rule[2].matchAll(/(?<![a-z-])background(?:-color)?\s*:\s*([^;]+)/g)].pop();
    if (!bg) continue;
    // A disabled control is SUPPOSED to be inert — `.btn--primary:disabled:hover`
    // painting the resting fill is the correct behaviour, not a dead state.
    if (/:disabled\b|\[disabled\]|\[aria-disabled="true"\]/.test(selectorList)) continue;
    const isState = /:(hover|active)\b/.test(selectorList);
    for (const sel of selectorList.split(",")) {
      const key = norm(sel);
      if (!key) continue;
      if (isState) states.push({ sel: sel.trim(), key, value: bg[1].trim() });
      else rest.set(key, bg[1].trim());
    }
  }

  const dead = [];
  for (const s of states) {
    // exact normalised match first, then the leaf of a descendant chain
    const base = rest.has(s.key) ? rest.get(s.key) : rest.get(leaf(s.key));
    if (base === undefined) continue; // no declared resting background — nothing to be identical to
    const a = resolve(base);
    const b = resolve(s.value);
    if (a.toLowerCase() === b.toLowerCase()) dead.push(`${s.sel} → ${b} (identical to its resting background)`);
  }
  if (dead.length) {
    failures++;
    console.error(`${path.relative(root, page)} — ${dead.length} state(s) that render as nothing:`);
    for (const d of dead) console.error(`    ${d}`);
  }
}

if (failures) {
  console.error(
    `\n${failures} page(s) have a hover/active background equal to the resting one. If the control rests on gray.100, it needs the Strong tier (fill.neutralHoverStrong / fill.neutralActiveStrong), not the wash.`
  );
  process.exit(1);
}
console.log(`ok — ${pages.length} pages, no hover/active background is identical to its resting background`);
