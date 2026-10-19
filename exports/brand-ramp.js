// brand-ramp.js — a full 13-step primary palette from one institution colour.
// hp-design (HighPoint design system). No dependencies; runs in the browser and Node.
//
// Usage:
//   import { brandRamp } from "./brand-ramp.js";
//   const r = brandRamp("#7a0019");
//   r.anchor        // "800" — the step the colour sits nearest (by OKLCH lightness)
//   r.steps         // { "25": "#…", "50": "#…", … "950": "#…" } — the anchor step IS the input colour
//   r.brand.onText  // "#ffffff" or "#121921" — the text colour that reads on the brand colour
//   r.checks        // contrast of the text-carrying steps (white on 500/600, 600/700 on white)
//
// How it works (OKLCH):
//   1. Find the anchor: the step whose lightness is nearest the input colour.
//   2. Build the other twelve on hp-design's fixed skeleton:
//      · LIGHTNESS per step is fixed and the same for every hue
//        (25 → 0.985 … 500 → 0.600 … 950 → 0.212) — so contrast doesn't depend on the school's colour;
//      · HUE is the input's, constant along the ramp;
//      · CHROMA follows the palette's profile (relative to step 500), scaled to the input's
//        saturation, and each step is clamped into the sRGB gamut.
//   Feeding it hp-design's own blue/red 500 rebuilds those ramps to within 1–3 units per channel.
//
// Semantic roles stay on fixed steps (fill.primary = 500, text.primary = 600 …); the exact brand
// colour (r.brand.hex) is for surfaces that should wear it whatever its lightness (sidebar, logo).

export function brandRamp(hex) {
  var STEPS = ["25", "50", "100", "150", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  var L = { "25": 0.985, "50": 0.970, "100": 0.930, "150": 0.895, "200": 0.860, "300": 0.770, "400": 0.680, "500": 0.600, "600": 0.520, "700": 0.440, "800": 0.360, "900": 0.290, "950": 0.212 };
  var PROFILE = { "25": 0.039, "50": 0.076, "100": 0.180, "150": 0.255, "200": 0.370, "300": 0.665, "400": 0.999, "500": 1, "600": 0.997, "700": 0.873, "800": 0.722, "900": 0.584, "950": 0.428 };

  function lin(x) { return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
  function gam(x) { return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }
  function toOklch(h) {
    var r = lin(parseInt(h.slice(1, 3), 16) / 255), g = lin(parseInt(h.slice(3, 5), 16) / 255), b = lin(parseInt(h.slice(5, 7), 16) / 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var Lk = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: Lk, C: Math.hypot(A, B), H: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
  }
  function toLinear(Lk, C, H) {
    var a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
    var l = Math.pow(Lk + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(Lk - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(Lk - 0.0894841775 * a - 1.2914855480 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  function inGamut(rgb) { return rgb.every(function (v) { return v >= -1e-4 && v <= 1 + 1e-4; }); }
  // the most chroma sRGB can show at this lightness and hue
  function maxChroma(Lk, H) { var lo = 0, hi = 0.4; for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2; if (inGamut(toLinear(Lk, mid, H))) lo = mid; else hi = mid; } return lo; }
  function toHex(Lk, C, H) {
    return "#" + toLinear(Lk, C, H).map(function (v) { var x = Math.round(Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, v))))) * 255); return (x < 16 ? "0" : "") + x.toString(16); }).join("");
  }
  function luminance(h) { var c = [1, 3, 5].map(function (i) { return lin(parseInt(h.slice(i, i + 2), 16) / 255); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  var brand = toOklch(hex.toLowerCase());
  // the step whose lightness the brand colour sits nearest
  var anchor = STEPS.reduce(function (best, s) { return Math.abs(L[s] - brand.L) < Math.abs(L[best] - brand.L) ? s : best; }, "500");
  // Read the brand's saturation as "the 500-level saturation of its ramp":
  // the profile, interpolated at the brand's own lightness, says how far
  // below the peak a colour that light sits.
  var ordered = STEPS.slice().sort(function (a, b) { return L[a] - L[b]; });
  function profileAt(Lk) {
    if (Lk <= L["950"]) return PROFILE["950"];
    if (Lk >= L["25"]) return PROFILE["25"];
    for (var i = 0; i < ordered.length - 1; i++) {
      var a = ordered[i], b = ordered[i + 1];
      if (Lk >= L[a] && Lk <= L[b]) { var t = (Lk - L[a]) / (L[b] - L[a]); return PROFILE[a] + t * (PROFILE[b] - PROFILE[a]); }
    }
    return 1;
  }
  var peak = brand.C / profileAt(brand.L);
  // achromatic input (a gray "brand") stays gray; keep a hue so it's stable
  var H = brand.C < 0.005 ? 254 : brand.H;
  var steps = {}, clipped = {};
  STEPS.forEach(function (s) {
    var want = peak * PROFILE[s], max = maxChroma(L[s], H) * 0.98;
    clipped[s] = want > max;
    steps[s] = toHex(L[s], Math.min(want, max), H);
  });
  // Step 1 was finding the anchor; the brand colour itself takes that step
  // exactly — the institution sees its own colour in the ramp, the other
  // twelve are built around it.
  steps[anchor] = hex.toLowerCase();
  clipped[anchor] = false;
  var onBrand = contrast(hex, "#ffffff") >= contrast(hex, "#121921") ? "#ffffff" : "#121921";
  return {
    input: hex, oklch: brand, anchor: anchor, steps: steps, clipped: clipped,
    brand: { hex: hex, onText: onBrand, contrast: contrast(hex, onBrand) },
    checks: {
      // the roles that carry text — fixed steps, so these hold for any hue
      whiteOn500: contrast(steps["500"], "#ffffff"),
      whiteOn600: contrast(steps["600"], "#ffffff"),
      text600OnWhite: contrast(steps["600"], "#ffffff"),
      text700OnWhite: contrast(steps["700"], "#ffffff")
    },
    contrast: contrast
  };
}
