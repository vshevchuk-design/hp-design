// Owns every generated step in tokens/primitives/color.tokens.json.
// Run: node tools/gen-color-ramps.mjs
//
// That file's own $description forbids hand-editing its hex values — they must
// be regenerated from OKLCH. tools/lib/oklch.mjs is that (previously missing)
// generator, reconstructed and validated against the file it produced; read its
// header before touching anything here, especially the note that its converter
// differs from the original by ±1 unit on high-chroma steps at the sRGB gamut
// edge. That's why this script only ever writes the steps it explicitly owns
// and leaves every other stored hex byte-identical, instead of regenerating all
// 120 and churning a third of them.
//
// What it owns, and why (all four are recorded in the decision log):
//   1. GRAY_CHROMA — the whole gray ramp. Went from truly achromatic to a cool
//      neutral on 2026-09-07 (explicit user call), reversing gray's original
//      "deliberately not tinted toward blue" decision.
//   2. LIGHT_END — green and teal's steps 25–200. Their light end sat at ~3x
//      the rest of the palette's chroma, so teal-100 rendered near-pure cyan
//      (#88fffe) next to pale siblings like blue-100. User: "сотий teal дуже
//      вибивається порівняно з іншими".
//   3. BROWN — the whole ramp. Brown and orange were indistinguishable
//      ("орендж і браун тупо однакові"): only 8° of hue apart (50 vs 42) AND
//      near-identical chroma. Needed both hue (→58) and chroma (→70%); see the
//      BROWN_HUE note below for why either one alone provably can't do it.
//   4. STEP_150 — a new step in every ramp. 100→200 was a visibly harsh jump
//      (the lightness deltas accelerate across the light end: .015, .04, .07),
//      so 150 splits the biggest one into two .035s.
//
// LIGHT_END and BROWN both come from one measurement rather than taste: the
// five well-behaved ramps (blue/red/orange/violet/magenta) all place their
// light steps at the same fraction of their OWN 300-step chroma —
// 25: 0.057x, 50: 0.113x, 100: 0.264x, 200: 0.557x (median). Applying that
// profile to a ramp's existing C300 keeps each ramp's own character and its
// own 200→300 progression (~1.8x, matching the family) while putting every
// ramp's light end on the same footing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oklchToHex, contrastMeta } from "./lib/oklch.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, "tokens/primitives/color.tokens.json");

// ---- 1. gray: the full ramp ----
const GRAY_HUE = 254; // the brand blue's own hue — the neutral IS the brand blue at a fraction of its chroma
// Round 2 (2026-09-07, same day): the first arc (peak 0.040) read "занадто
// сині". Halved across the pale end — which is what actually carries the tint
// on a screen full of surfaces and borders — and scaled the mid/dark end to
// ~75%, so text keeps a trace of temperature without going navy. The light
// steps now sit at chroma 0.002–0.008, i.e. barely-there: enough to kill the
// dead-gray flatness that started this, not enough to read as a colour.
const GRAY_CHROMA = {
  25: 0.002,
  50: 0.003,
  100: 0.005,
  200: 0.008,
  300: 0.016,
  400: 0.024,
  500: 0.028,
  600: 0.03,
  700: 0.028,
  800: 0.026,
  900: 0.022,
  950: 0.02,
};

// ---- 2. light-end chroma, from the family profile x each ramp's own C300 ----
const LIGHT_END_PROFILE = { 25: 0.057, 50: 0.113, 100: 0.264, 200: 0.557 };
const RETUNE_LIGHT_END = ["green", "teal"];

// ---- 3. brown: the whole ramp, hue AND chroma ----
// First attempt fixed chroma only and left the hue at 50, on the theory that
// low saturation is what makes a colour read brown. Rendered side by side with
// orange, that was not enough: at the pale end a low-chroma orange and a
// low-chroma brown are both just off-white, so 100/150/200 still matched.
// Hue alone can't fix it either — brown sits in the 26° corridor between
// orange (42) and amber (68), so any brown hue is within ~13° of one of them,
// while the palette's own comfortable gap is ~18-22°.
// What works is BOTH, verified against both neighbours: hue 58 (16° off
// orange, 10° off amber) plus chroma at 70% of the previous curve. The pale
// steps land on warm greige (#f1e5dd) instead of peach (orange's #ffe1d5),
// amber stays clear of it by carrying ~2.5x the chroma at every light step,
// and 300-500 read as muted tan (#d4ab8d → #9d775b) rather than terracotta.
// Net effect: brown behaves like a warm-neutral family at the light end and a
// true brown from 300 down — the same shape Radix's sand/bronze scales use.
const BROWN_HUE = 58;
const BROWN_CHROMA = {
  25: 0.004,
  50: 0.007,
  100: 0.017,
  200: 0.035,
  300: 0.063,
  400: 0.063,
  500: 0.063,
  600: 0.063,
  700: 0.063,
  800: 0.06,
  900: 0.056,
  950: 0.045,
};

// ---- 4. the new step ----
const STEP_150 = { step: "150", l: 0.895, after: "100" };

const raw = fs.readFileSync(file, "utf8");
const doc = JSON.parse(raw);
const color = doc.color;
const oklchOf = (ramp, step) => color[ramp][step].$extensions["hp.design/oklch"];

const changes = [];
function setStep(ramp, step, { l, c, h }) {
  const { hex, clipped } = oklchToHex(l, c, h);
  if (clipped) throw new Error(`${ramp}.${step} (L${l} C${c} H${h}) falls outside sRGB`);
  const before = color[ramp][step]?.$value ?? null;
  color[ramp][step] = {
    $type: "color",
    $value: hex,
    $extensions: { "hp.design/oklch": { l, c, h }, "hp.design/contrast": contrastMeta(hex) },
  };
  if (before !== hex) changes.push([ramp, step, before, hex]);
}

// 1. gray
for (const [step, c] of Object.entries(GRAY_CHROMA)) {
  setStep("gray", step, { l: oklchOf("gray", step).l, c, h: GRAY_HUE });
}

// 2. green / teal light ends
for (const ramp of RETUNE_LIGHT_END) {
  const c300 = oklchOf(ramp, "300").c;
  const hue = oklchOf(ramp, "300").h;
  for (const [step, factor] of Object.entries(LIGHT_END_PROFILE)) {
    const c = Math.round(factor * c300 * 1000) / 1000;
    setStep(ramp, step, { l: oklchOf(ramp, step).l, c, h: hue });
  }
}

// 3. brown, end to end
for (const [step, c] of Object.entries(BROWN_CHROMA)) {
  setStep("brown", step, { l: oklchOf("brown", step).l, c, h: BROWN_HUE });
}

// 4. step 150 everywhere — chroma is the GEOMETRIC mean of its neighbours, not
// the arithmetic one: chroma grows roughly geometrically across the light end
// (~2x per step), so an arithmetic midpoint would sit visibly too high and the
// new step would read closer to 200 than to 100. Runs last, so the ramps
// retuned above interpolate their NEW neighbours.
const ramps = Object.keys(color).filter((k) => !k.startsWith("$") && k !== "white");
for (const ramp of ramps) {
  const lo = oklchOf(ramp, "100");
  const hi = oklchOf(ramp, "200");
  const c = Math.round(Math.sqrt(lo.c * hi.c) * 1000) / 1000;
  setStep(ramp, STEP_150.step, { l: STEP_150.l, c, h: lo.h });
  // keep JSON key order readable: 25, 50, 100, 150, 200, …
  const reordered = {};
  for (const [k, v] of Object.entries(color[ramp])) {
    if (k === STEP_150.step) continue;
    reordered[k] = v;
    if (k === STEP_150.after) reordered[STEP_150.step] = color[ramp][STEP_150.step];
  }
  color[ramp] = reordered;
}

// The promises the palette is documented on (color.$description: "Step 500 =
// brand/UI-safe (>=3:1 on white). Step 600 = AA text-safe (>=4.5:1 on white)").
// Asserted for every ramp, not assumed — changing chroma at a fixed OKLCH
// lightness does move WCAG luminance.
for (const ramp of ramps) {
  for (const [step, min] of [["500", 3], ["600", 4.5]]) {
    const actual = color[ramp][step].$extensions["hp.design/contrast"].onWhite;
    if (actual < min) throw new Error(`${ramp}.${step} is ${actual}:1 on white, needs ≥ ${min}:1`);
  }
}

color.gray.$description =
  "Cool neutral — the brand blue's own hue (254) carried at a small fraction of its chroma, peaking at 0.030 mid-ramp and tapering to 0.002 at the pale end. Regenerate with tools/gen-color-ramps.mjs, never by hand. This reverses the original 'truly achromatic (chroma 0), deliberately not tinted toward blue' call, on explicit user request 2026-09-07: at c=0 the neutrals read flatly, dead gray in product surfaces. Lightness was left untouched step-for-step, so every contrast guarantee the palette documents still holds (the generator asserts 500 ≥ 3:1 and 600 ≥ 4.5:1 on white before writing).";
color.green.$description =
  "Light end (25–200) retuned 2026-09-07 to the palette-wide profile — it had been sitting at ~2.7x the family's chroma, so green-100 read as a vivid mint next to pale siblings like blue-100. Steps 300–950 untouched.";
color.teal.$description =
  "Light end (25–200) retuned 2026-09-07 to the palette-wide profile. teal-100 was #88fffe — effectively pure cyan, the single most out-of-family swatch in the palette (chroma 0.107 where the family profile wants 0.034). Steps 300–950 untouched.";
color.brown.$description =
  "Rebuilt end to end 2026-09-07 because brown and orange were indistinguishable. Two changes, both needed: hue 50 → 58 (16° off orange, 10° off amber — brown sits in a narrow 26° corridor between them, so hue alone could never separate it) and chroma cut to 70% of the old curve. Chroma alone was tried first and failed at the pale end, where a low-chroma orange and a low-chroma brown are both just off-white. The result behaves as a warm-neutral family at the light end (greige, #f1e5dd at 100, against orange's peach #ffe1d5) and a true muted brown from 300 down — the shape Radix's sand/bronze scales use. Amber stays clear of it by carrying ~2.5x the chroma at every light step. Regenerate with tools/gen-color-ramps.mjs.";

// The file is exactly JSON.stringify(…, null, 2) with no trailing newline —
// match it byte-for-byte so the diff stays confined to the generated steps.
fs.writeFileSync(file, JSON.stringify(doc, null, 2));

const added = changes.filter(([, , before]) => before === null);
const edited = changes.filter(([, , before]) => before !== null);
console.log(`added ${added.length} step(s):`);
for (const [ramp, step, , hex] of added) console.log(`  ${ramp}.${step} = ${hex}`);
console.log(`changed ${edited.length} step(s):`);
for (const [ramp, step, before, hex] of edited) console.log(`  ${ramp}.${step}  ${before} → ${hex}`);
