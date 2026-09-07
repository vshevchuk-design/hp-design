// Fails if a generated page declares a size that isn't on the 4px grid.
// Run after a rebuild: node tools/check-grid.mjs
//
// Why this exists: the `dim.*` scale is already a 4px grid, so the *inputs* are
// almost always fine — what slips through is the *sum*. An app topbar built as
// `dim.3 padding + 40px control + dim.3 padding + 1px border` renders at 65px:
// every token on-grid, the result off it. That shipped once (2026-09-07) and
// was caught by eye, not by the build. This checker reads the generated CSS the
// way the user reads the page.
//
// It can't add up a box for you — that needs layout — so it does the half the
// build can do: flag hand-typed off-grid literals. For rendered box heights,
// the rule in status.md stands: declare the height (`height: dim.16`) and let
// the hairline sit inside it, then verify in the browser with
// `getBoundingClientRect().height % 4 === 0`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The `dim.*` scale's own 2px half-steps (dim.0_5/1_5/2_5/3_5). They are part
// of the scale on purpose — small gaps and hairline offsets — so they pass.
const HALF_STEPS = new Set([2, 6, 10, 14]);

// Documented deliberate exceptions, each with the reason it isn't a bug.
const ALLOWED = [
  {
    // status.md: "Fake keyboard: docs-only scaffolding (device mock,
    // non-tokenized geometry, token colours)" — it mimics an iOS keyboard, not
    // this design system, so its geometry is deliberately outside the scale.
    // Plain prefix, not /\.mc-kbd\b/ — `_` is a word character, so \b never
    // matches between "kbd" and "__row" and the element selectors slipped past.
    selector: /\.mc-kbd/,
    reason: "fake-keyboard scaffolding — documented non-tokenized device mock",
  },
];

// Only geometry that lands on the grid. Deliberately NOT font-size (the type
// scale is its own thing: 10/12/14/16/18/20…), not max-/min-width (those are
// layout literals and breakpoint compensations, e.g. the viewer's +2px iframe
// border fix), and not border-width/radius (1px hairlines, radius scale).
const PROPS = /(?<![a-z-])(?:height|width|gap|row-gap|column-gap|padding|padding-top|padding-right|padding-bottom|padding-left|margin|margin-top|margin-right|margin-bottom|margin-left)\s*:\s*([^;{}]+)/g;

// SCOPE: the prototype app files only — the real product surfaces, all of them
// token-driven. Deliberately NOT the component doc pages: their chrome
// (.navlink 7px, .legend 14/18px, .story 22px, .nav-tabs 3px …) is
// hand-written furniture that predates any of this and is not tokenized at
// all, so scanning it would bury real findings under ~9 known non-findings per
// page. Aligning that chrome to the scale is a standing offer to the user, not
// a silent to-do; when it happens, widen this glob to all of docs/.
const designs = path.join(root, "docs/designs");
const pages = fs
  .readdirSync(designs)
  .filter((f) => f.endsWith("-app.html"))
  .map((f) => path.join(designs, f));

let failures = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  // Rule-by-rule so a violation can be attributed to its selector, which is
  // what makes the allowlist above possible.
  const offenders = new Map();
  for (const rule of html.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim();
    const body = rule[2];
    if (ALLOWED.some((a) => a.selector.test(selector))) continue;
    for (const decl of body.matchAll(PROPS)) {
      for (const num of decl[1].matchAll(/(?<![\d.])(\d+)px/g)) {
        const v = Number(num[1]);
        if (v <= 2 || v % 4 === 0 || HALF_STEPS.has(v)) continue;
        const key = `${selector} — ${decl[0].trim()}`;
        offenders.set(key, (offenders.get(key) ?? 0) + 1);
      }
    }
  }
  if (offenders.size) {
    failures++;
    console.error(`${path.relative(root, page)} — ${offenders.size} off-grid declaration(s):`);
    for (const key of offenders.keys()) console.error(`    ${key}`);
  }
}

if (failures) {
  console.error(
    `\n${failures} page(s) declare sizes off the 4px grid. Use a dim.* step (or a 2px half-step for a small gap); if it is genuinely deliberate, add it to ALLOWED here with the reason.`
  );
  process.exit(1);
}
console.log(`ok — ${pages.length} pages, every declared size is on the 4px grid (or a documented exception)`);
