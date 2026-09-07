// Generates the Springboard entry of the Designs pane (its own product):
//   docs/designs/springboard.html      — viewer page (shared chrome from
//     tools/lib/design-viewer.mjs: device tabs + Versions dropdown + iframe).
//   docs/designs/springboard-app.html  — the prototype itself.
//
// Deliberately a SCAFFOLD for now: the page, its nav entry and its version
// list exist, the app file is an empty shell carrying nothing but an
// EmptyState (resolved from empty-state.tokens.json). Springboard's own
// structure isn't defined yet — reference screens are still to come, and the
// no-speculative-builds rule applies to prototype pages as much as to
// components: inventing a layout here would have to be thrown away.
// Run: node tools/build-design-springboard.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const emptyState = load("tokens/components/empty-state.tokens.json").component.emptyState;

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
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// ---- EmptyState — the only component this shell needs so far ----
const esTextType = resolveToken(emptyState.text);
const esTextColor = refPath(emptyState.textColor.$value);
const esPillBg = refPath(emptyState.pill.bg.$value);
const esPillRadius = px(resolve(emptyState.pill.radius.$value));
const esPillPaddingX = px(resolve(emptyState.pill.paddingX.$value));
const esPillPaddingY = px(resolve(emptyState.pill.paddingY.$value));
const esPadding = px(resolve(emptyState.padding.$value));

const colorPaths = ["surface.page", "text.secondary", "bg.neutral"];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

const appCss = `${rootVars}

* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; }

.empty-state { box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: ${esPadding}; font-family: ${cv("family.sans")}; }
.empty-state__text { background: ${cv(esPillBg)}; color: ${cv(esTextColor)}; border-radius: ${esPillRadius}; padding: ${esPillPaddingY} ${esPillPaddingX}; ${typoCss(esTextType)} text-align: center; }`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Springboard</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
<div class="empty-state"><span class="empty-state__text">Springboard — layout not designed yet</span></div>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "springboard",
  title: "Springboard",
  heading: "Springboard",
  sub: "Scaffold only. The page, its nav entry and its version list are in place; the prototype itself is empty until the reference screens land — inventing a layout now would just be thrown away. Everything built here will follow the same discipline as the Message Center prototypes: strictly hp-design components, every recipe resolved from its own token file, with the <code>mc-</code>-style composition layer as the only bespoke CSS.",
  versions: [{ label: "v1", note: "current", file: "springboard-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/springboard-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/springboard.html"), viewerHtml);
console.log("wrote docs/designs/springboard-app.html");
console.log("wrote docs/designs/springboard.html");
