// OKLCH → sRGB + WCAG contrast helpers.
//
// The primitive ramps in tokens/primitives/color.tokens.json were generated in
// OKLCH (every step carries its own `hp.design/oklch` L/C/H in $extensions) and
// that file's own $description forbids hand-editing the hex values: "regenerate
// from the OKLCH source script if the palette changes". That script was never in
// the repo — this module is it, reconstructed and verified against the file it
// is supposed to have produced: feeding the stored L/C/H back through
// `oklchToHex` reproduces 96 of the 120 stored hexes exactly, and the 24 misses
// are all high-chroma steps (blue/red/green 500–800) off by one unit in a single
// channel, i.e. gamut-mapping/rounding differences at the sRGB boundary. Low- and
// zero-chroma steps — the whole gray ramp — round-trip exactly, so this is safe
// to regenerate neutrals with and NOT safe to blindly re-run over the saturated
// ramps (it would churn those hexes by ±1).
//
// INK_LUMINANCE is the reference the stored `hp.design/contrast.onInk` numbers
// were computed against. The ink colour itself isn't recorded anywhere, so it
// was recovered by least-squares fitting a single luminance across all 120
// stored ratios: 0.003450 (rmse 0.0030, worst single deviation 0.005 — i.e.
// within the rounding of the stored 2-decimal values). Reuse it so regenerated
// metadata stays consistent with the rest of the file rather than drifting to a
// second, slightly different "ink".
export const INK_LUMINANCE = 0.00345;

/** OKLCH (L 0–1, C, H degrees) → { hex, clipped } in sRGB. */
export function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const encoded = linear.map((v) => {
    const c = Math.min(1, Math.max(0, v));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  });
  return {
    hex: "#" + encoded.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join(""),
    // true = the requested colour fell outside sRGB and got clamped, so the
    // returned hex is no longer the colour that was asked for
    clipped: linear.some((v) => v < -0.0005 || v > 1.0005),
  };
}

/** WCAG 2.x relative luminance of a #rrggbb string. */
export function relativeLuminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two relative luminances. */
export const contrastRatio = (y1, y2) => (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);

export const WHITE_LUMINANCE = 1;

/** The two ratios stored per step in `hp.design/contrast`, rounded as stored. */
export function contrastMeta(hex) {
  const y = relativeLuminance(hex);
  return {
    onWhite: Math.round(contrastRatio(y, WHITE_LUMINANCE) * 100) / 100,
    onInk: Math.round(contrastRatio(y, INK_LUMINANCE) * 100) / 100,
  };
}
