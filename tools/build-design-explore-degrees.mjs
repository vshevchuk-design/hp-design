// Generates the Explore Degrees screen of the student portal:
//   docs/designs/explore-degrees.html      — viewer page (shared chrome from
//     tools/lib/design-viewer.mjs: device tabs + Versions dropdown + iframe).
//   docs/designs/explore-degrees-app.html  — the prototype itself.
//
// The public "Explore Your Degree" wizard behind the Springboard's own tile: a
// no-login estimator that takes a programme, a start term and any prior college
// credits, then reports what transfers and what's left of the degree. Four steps
// plus a results screen, built strictly from hp-design components — every recipe
// resolved from its own token file.
//
// Split across four modules because one file carrying five screens of fixtures,
// ~700 lines of recipes, the markup and the state machine was unreadable:
//   lib/ed-data.mjs    — content and fixtures
//   lib/ed-css.mjs     — component recipes + the `ed-*` composition layer
//   lib/ed-markup.mjs  — the static skeleton of all five screens
//   lib/ed-app.mjs     — the state machine that fills it in
//
// This screen wears the portal's app shell (lib/app-shell.mjs) — the same
// wordmark-and-settings header as the Springboard. A first cut copied the
// reference's bespoke header ("Explore Your Degree · PeopleSoft University" +
// "No account needed") and reasoned that a public flow shouldn't carry
// logged-in chrome; the user's call is that the school switcher only exists in
// their demo environment and never will in the product, and that this screen
// should look like every other one. So: normal header, and the school is gone
// from the header, from step 1 and from the review summary.
// Run: node tools/build-design-explore-degrees.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { edCss, ED_COLOR_PATHS } from "./lib/ed-css.mjs";
// Only the topbar half of the shell: this page ships its own full Button
// recipe (it needs primary and ghost too), so a second copy of the shell's
// secondary-button rules would be dead weight.
import { SHELL_TOPBAR_CSS, SHELL_COLOR_PATHS } from "./lib/app-shell.mjs";
import { edMarkup, edSchoolBlockTemplate } from "./lib/ed-markup.mjs";
import { edAppJs } from "./lib/ed-app.mjs";
import { PROGRAMS, TERM_YEARS, PREV_SCHOOLS } from "./lib/ed-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};

// Every component this wizard uses, loaded once and handed to the CSS module.
const comp = (name) => load(`tokens/components/${name}.tokens.json`).component;
const tokens = {
  ...comp("stepper"), ...comp("choice-tile"), ...comp("card"), ...comp("alert"),
  ...comp("accordion"), ...comp("progress"), ...comp("spinner"), ...comp("badge"),
  ...comp("chip"), ...comp("listbox"), ...comp("table"), ...comp("button"),
  ...comp("input"), ...comp("select"), ...comp("search"), ...comp("empty-state"),
  ...comp("avatar"),
};

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  return node;
}
function resolveValue(v) {
  if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v));
  return v;
}
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) {
    const out = {};
    for (const [k, sub] of Object.entries(v)) out[k] = resolveValue(sub);
    return out;
  }
  if (v && typeof v === "object" && "value" in v) return v;
  return resolveValue(v);
}
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;
const refPath = (ref) => ref.replace(/[{}]/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
// text-style.*'s textTransform/textDecoration live in $extensions, which
// resolveToken() silently drops — the trap that has bitten three times.
const textExt = (styleRef) => (get(styleRef).$extensions || {})["hp.design/text"] || {};
const icon = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);

// ---- Avatar's identity logic, verbatim: same 8 hues, same modulo, so a
// programme's mark is the same colour on the tile, in the pick card and in the
// combo chip. Duplicated into the client script too (see ed-app.mjs) because
// the browser has to recolour marks the build never saw.
const AVATAR_HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
// Avatar's initials rule, with one addition for programme names: only words
// that START with a letter count. Avatar was written for people, where every
// word is a name; "Art (BFA)" took the "(" of "(BFA)" and rendered "A(".
const initialsOf = (name) => {
  const words = name.trim().split(/\s+/).filter((w) => /^[a-z]/i.test(w));
  const p = words.length ? words : [name.trim()];
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
};
const hueOf = (name) => {
  let s = 0;
  for (const c of name) s += c.charCodeAt(0);
  return AVATAR_HUES[s % AVATAR_HUES.length];
};

const helpers = { tokens, resolve, resolveToken, cv, px, refPath, typoCss, textExt, get, esc, icon, initialsOf, hueOf };

// Every hue the marks can land on — programmes, focus areas and the term years.
const usedHues = [...new Set([
  ...AVATAR_HUES,
  ...TERM_YEARS.map((y) => y.hue),
])];
const colorPaths = [...new Set([
  ...ED_COLOR_PATHS,
  ...SHELL_COLOR_PATHS,
  ...usedHues.flatMap((h) => [`avatar.${h}.bg`, `avatar.${h}.text`]),
])];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

// The marker hues + the two credit answers' marks: a composition on top of
// Avatar's palette (pastel 100/600 tints — saturated 500s made fifty squares
// fight each other) and the success/neutral fills for yes/no.
const hueCss = `${usedHues.map((h) => `.ed-hue--${h} { background: ${cv(`avatar.${h}.bg`)}; color: ${cv(`avatar.${h}.text`)}; }`).join("\n")}
.ed-mark--yes { background: ${cv("fill.success")}; color: ${cv("icon.onFill")}; }
.ed-mark--no { background: ${cv("fill.neutral")}; color: ${cv("icon.secondary")}; }`;

const appCss = `${rootVars}
${SHELL_TOPBAR_CSS}
${edCss(helpers)}
${hueCss}`;

// The per-school block is templated in the markup module and instantiated by
// the client script, so the template string crosses into JS as data.
const appJs = edAppJs(helpers).replace('"__TEMPLATE__"', JSON.stringify(edSchoolBlockTemplate(helpers)));

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Explore Your Degree</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
${edMarkup(helpers)}
<script>
${appJs}
</script>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "explore-degrees",
  title: "Explore Degrees",
  heading: "Explore Degrees",
  sub: `The public <b>Explore Your Degree</b> wizard behind the Springboard's own tile — a no-login estimator: pick a programme, a start term and any prior college credits, and it reports what transfers and what's left. Four steps plus results, everything interactive. <b>All the branches are real:</b> focus areas appear only for majors that have them (try Psychology), Yes/No on prior credits, N previous schools, and the AI transcript reader runs its full path — the first file is rejected with the reference's own message ("a photograph of a house and pool"), the second imports ten classes. Two endings too: pick <b>Riverside Community College</b> to get the "we couldn't check your credits online" fallback, and answer <b>No, starting fresh</b> to see the results with no transfer tab at all. It wears the portal's normal header — no login is needed to use this, but that is a fact about access, not a reason to give the screen different chrome; the school switcher in the reference only exists in a demo environment and is gone here. A prototype switch on the results screen turns the school's Degree Planner on and off; results are always rendered and the planner is a button, never a redirect, since a redirect would discard both the estimate and the print path. Built from ${PROGRAMS.length} programmes and ${PREV_SCHOOLS.length} previous schools of sample data.`,
  versions: [{ label: "v1", note: "current", file: "explore-degrees-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/explore-degrees-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/explore-degrees.html"), viewerHtml);
console.log("wrote docs/designs/explore-degrees-app.html");
console.log("wrote docs/designs/explore-degrees.html");
