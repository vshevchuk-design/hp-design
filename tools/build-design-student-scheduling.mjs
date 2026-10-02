// Generates the Student Scheduling screen (Scheduling):
//   docs/designs/student-scheduling.html      — viewer page (shared chrome from
//     tools/lib/design-viewer.mjs: device tabs + Versions dropdown + iframe).
//   docs/designs/student-scheduling-app.html  — the prototype itself.
//
// Deliberately a SCAFFOLD: it carries the portal's real app shell
// (tools/lib/app-shell.mjs) in its titled mode — the page name in the 64px
// topbar, settings on the right — and nothing else but an EmptyState. Its own
// layout is waiting on reference screens, same starting point as Springboard,
// Explore Degrees and Degree Progress: no-speculative-builds applies to prototype pages too.
//
// Workflow: this prototype is designed here on Vercel first, then carried
// into Figma once the layout settles.
// Run: node tools/build-design-student-scheduling.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRootVars, cssVarName } from "./lib/css-vars.mjs";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { SHELL_CSS, SHELL_COLOR_PATHS, shellTopbar } from "./lib/app-shell.mjs";

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

// ---- EmptyState — the only component this scaffold needs so far ----
const es = {
  textType: resolveToken(emptyState.text),
  textColor: refPath(emptyState.textColor.$value),
  pillBg: refPath(emptyState.pill.bg.$value),
  pillRadius: px(resolve(emptyState.pill.radius.$value)),
  pillPaddingX: px(resolve(emptyState.pill.paddingX.$value)),
  pillPaddingY: px(resolve(emptyState.pill.paddingY.$value)),
  padding: px(resolve(emptyState.padding.$value)),
};

const colorPaths = [...new Set([...SHELL_COLOR_PATHS, "text.secondary", "bg.neutral"])];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

const appCss = `${rootVars}

${SHELL_CSS}

* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: ${cv("surface.page")}; font-family: ${cv("family.sans")}; }

/* ss-* composition layer — just the body slot until the screen is designed */
.ss__main { flex: 1; width: 100%; max-width: 1400px; margin: 0 auto; display: flex; padding: ${px(resolve("dim.4"))}; }
@media (min-width: 768px) { .ss__main { padding: ${px(resolve("dim.6"))}; } }

.empty-state { box-sizing: border-box; width: 100%; display: flex; align-items: center; justify-content: center; padding: ${es.padding}; font-family: ${cv("family.sans")}; }
.empty-state__text { background: ${cv(es.pillBg)}; color: ${cv(es.textColor)}; border-radius: ${es.pillRadius}; padding: ${es.pillPaddingY} ${es.pillPaddingX}; ${typoCss(es.textType)} text-align: center; }`;

const appHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Student Scheduling</title>
<link rel="stylesheet" href="../../assets/fonts/sora/sora.css" />
<style>
${appCss}
</style>
</head>
<body>
<div class="app">
${shellTopbar({ title: "Student Scheduling" })}
  <main class="ss__main">
    <div class="empty-state"><span class="empty-state__text">Student Scheduling — layout not designed yet</span></div>
  </main>
</div>
</body>
</html>
`;

const viewerHtml = renderDesignViewer({
  activeKey: "student-scheduling",
  title: "Student Scheduling",
  heading: "Student Scheduling",
  sub: "The student's class scheduling screen — a scaffold for now. It already carries the portal's real app shell (<code>tools/lib/app-shell.mjs</code>, titled mode: the page name in the same 64px topbar the other portal screens use); the screen's own layout is waiting on reference screens. Everything built here will follow the same discipline as the other prototypes: strictly hp-design components, every recipe resolved from its own token file, with a small <code>ss-</code> composition layer as the only bespoke CSS.",
  versions: [{ label: "v1", note: "current", file: "student-scheduling-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling-app.html"), appHtml);
fs.writeFileSync(path.join(root, "docs/designs/student-scheduling.html"), viewerHtml);
console.log("wrote docs/designs/student-scheduling-app.html");
console.log("wrote docs/designs/student-scheduling.html");
