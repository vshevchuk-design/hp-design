// Regenerates the `gray` ramp in tokens/primitives/color.tokens.json in place.
//
// Why a script and not a hand-edit: that file's own $description says the hex
// values must never be hand-edited, only regenerated from OKLCH — see
// tools/lib/oklch.mjs for how the (previously missing) generator was
// reconstructed and validated against the stored values.
//
// 2026-09-07: the ramp went from truly achromatic (c = 0 at every step) to a
// cool, blue-leaning neutral, on explicit user call ("мене харить сірий колір
// дуже… давай уведем його в синьоватий"). This REVERSES the original decision
// recorded in gray's own $description ("deliberately not tinted toward blue…
// so surfaces never read as accidentally brand-colored") — see decision-log.
//
// Two properties make this a safe, surgical change:
//   1. Lightness is untouched. Every step keeps its exact L, so the whole
//      contrast table barely moves (max Δ 0.06 on white) and every guarantee
//      the palette is built on still holds — step 500 ≥ 3:1 and step 600
//      ≥ 4.5:1 on white are asserted below, the build fails if they break.
//   2. Hue is 254 — the ramp already recorded that hue, and it is the brand
//      blue's own hue. So the neutral is now literally "the brand blue at a
//      fraction of its chroma", not a second, unrelated cool hue.
// The chroma arc peaks mid-ramp and tapers to near-nothing at the extremes,
// which is the shape every well-known cool-gray ramp uses: a flat chroma would
// make the pale surfaces read blue-tinted while leaving the dark text flat.
// See the CHROMA note below for how far the arc was pulled back after review.
// Run: node tools/gen-gray-ramp.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oklchToHex, contrastMeta } from "./lib/oklch.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, "tokens/primitives/color.tokens.json");

const HUE = 254;
// Round 2 (2026-09-07, same day): the first arc (peak 0.040) read "занадто
// сині". Halved across the pale end — which is what actually carries the tint
// on a screen full of surfaces and borders — and scaled the mid/dark end to
// ~75%, so text keeps a trace of temperature without going navy. The light
// steps now sit at chroma 0.002–0.008, i.e. barely-there: enough to kill the
// dead-gray flatness that started this, not enough to read as a colour.
const CHROMA = {
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

const raw = fs.readFileSync(file, "utf8");
const doc = JSON.parse(raw);
const gray = doc.color.gray;

const changes = [];
for (const [step, token] of Object.entries(gray)) {
  if (step.startsWith("$")) continue;
  if (!(step in CHROMA)) throw new Error(`gray.${step} has no chroma defined`);
  const oklch = token.$extensions["hp.design/oklch"];
  const { hex, clipped } = oklchToHex(oklch.l, CHROMA[step], HUE);
  if (clipped) throw new Error(`gray.${step} falls outside sRGB — pick a lower chroma`);
  changes.push([step, token.$value, hex]);
  token.$value = hex;
  oklch.c = CHROMA[step];
  oklch.h = HUE;
  token.$extensions["hp.design/contrast"] = contrastMeta(hex);
}

// The two promises the whole palette is documented on (color.$description:
// "Step 500 = brand/UI-safe (>=3:1 on white). Step 600 = AA text-safe
// (>=4.5:1 on white)"). Asserted, not assumed — adding chroma at a fixed
// OKLCH lightness does move WCAG luminance slightly.
const guarantees = [
  ["500", 3, gray["500"].$extensions["hp.design/contrast"].onWhite],
  ["600", 4.5, gray["600"].$extensions["hp.design/contrast"].onWhite],
];
for (const [step, min, actual] of guarantees) {
  if (actual < min) throw new Error(`gray.${step} is ${actual}:1 on white, needs ≥ ${min}:1`);
}

gray.$description =
  "Cool neutral — the brand blue's own hue (254) carried at a small fraction of its chroma, peaking at 0.030 mid-ramp and tapering to 0.002 at the pale end. Regenerate with tools/gen-gray-ramp.mjs, never by hand. This reverses the original 'truly achromatic (chroma 0), deliberately not tinted toward blue' call, on explicit user request 2026-09-07: at c=0 the neutrals read flatly, dead gray in product surfaces. Lightness was left untouched step-for-step, so every contrast guarantee the palette documents still holds (the generator asserts 500 ≥ 3:1 and 600 ≥ 4.5:1 on white before writing).";

// The file is exactly JSON.stringify(…, null, 2) with no trailing newline —
// match it byte-for-byte so the diff stays confined to the gray ramp.
fs.writeFileSync(file, JSON.stringify(doc, null, 2));

console.log(`gray ramp regenerated (hue ${HUE}, chroma ${CHROMA[25]} → ${Math.max(...Object.values(CHROMA))} → ${CHROMA[950]}):`);
for (const [step, from, to] of changes) console.log(`  ${step.padStart(3)}  ${from} → ${to}`);
console.log(`  guarantees: 500 = ${guarantees[0][2]}:1, 600 = ${guarantees[1][2]}:1 on white`);
