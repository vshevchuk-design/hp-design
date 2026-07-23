// Regenerates docs/semantic-colors.html from tokens/semantic/color.tokens.json
// (resolving aliases against tokens/primitives/color.tokens.json).
// Run: node tools/build-semantic-colors-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const primitives = JSON.parse(fs.readFileSync(path.join(root, "tokens/primitives/color.tokens.json"))).color;
const semantic = JSON.parse(fs.readFileSync(path.join(root, "tokens/semantic/color.tokens.json")));

function resolve(value, depth = 0) {
  if (depth > 5) throw new Error("alias too deep: " + value);
  if (typeof value !== "string" || !value.startsWith("{")) return value;
  const path_ = value.replace(/[{}]/g, "").split(".");
  let node;
  if (path_[0] === "color") {
    // path_.length === 2 for a flat primitive like {color.white}; 3 for a ramp step like {color.gray.25}
    node = path_.length === 2 ? primitives[path_[1]].$value : primitives[path_[1]][path_[2]].$value;
  } else node = semantic[path_[0]][path_[1]].$value;
  return resolve(node, depth + 1);
}

function textColorFor(hex) {
  if (hex.startsWith("rgba")) return "#141414";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? "#141414" : "#fdfdfd";
}

const groups = ["surface", "bg", "border", "text", "icon", "fill", "status", "avatar", "tag"];

// Most groups are flat (name.key -> a token with $value). "avatar" nests one
// level deeper (name.hue.bg / name.hue.text) for its 8-slot identity palette —
// walk down to whichever depth actually holds a $value instead of assuming flat.
function leaves(node, prefix) {
  if (node && typeof node === "object" && "$value" in node) return [[prefix, node]];
  return Object.entries(node)
    .filter(([k]) => !k.startsWith("$"))
    .flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function renderGroup(name) {
  const g = semantic[name];
  const rows = Object.entries(g)
    .filter(([k]) => !k.startsWith("$"))
    .flatMap(([key, tok]) => leaves(tok, key));
  return `
    <h3 class="sub-section">${name}</h3>
    <div class="legend"><div class="row"><span>${g.$description || ""}</span></div></div>
    <div class="swatch-grid">
      ${rows
        .map(([key, tok]) => {
          const hex = resolve(tok.$value);
          const color = textColorFor(hex);
          const isLiteral = typeof tok.$value === "string" && !tok.$value.startsWith("{");
          const aliasLabel = isLiteral ? "literal" : tok.$value.replace(/[{}]/g, "");
          const desc = tok.$description ? `<p class="tok-desc">${tok.$description}</p>` : "";
          return `<div class="tok-card" style="background:${hex};color:${color}">
        <code class="tok-name">${name}.${key}</code>
        <span class="tok-alias">${aliasLabel}</span>
        <span class="tok-hex">${hex}</span>
      </div>${desc ? `<div class="tok-desc-wrap">${desc}</div>` : ""}`;
        })
        .join("\n      ")}
    </div>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — semantic colors</title>
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, "Segoe UI", system-ui, sans-serif;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
      --border: #313035; --border-strong: #403f45;
      --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
      --accent: #5aa4ec; --accent-bg: #16283b;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .brand { font-size: 14px; font-weight: 600; margin: 0 0 2px 8px; }
  .brand-sub { font-size: 11.5px; color: var(--text-muted); margin: 0 0 1.5rem 8px; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .navlink.disabled { color: var(--text-muted); cursor: default; pointer-events: none; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  .tag { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border: 0.5px solid var(--border-strong); border-radius: 4px; padding: 1px 5px; }
  main { flex: 1; padding: 3rem 3rem 4rem; max-width: 1080px; }
  h1 { font-size: 22px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
  .sub { font-size: 13px; color: var(--text-secondary); margin: 0 0 2rem; }
  h3.sub-section { font-size: 15px; font-weight: 600; margin: 2.4rem 0 0.6rem; text-transform: lowercase; font-family: var(--mono); }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 10px 14px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 0.6rem; }
  .legend .row { display: flex; }
  .group-desc { font-size: 12px; color: var(--text-muted); margin: 0 0 0.8rem; }
  .swatch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .tok-card { border-radius: 10px; padding: 14px 14px 12px; min-height: 76px; display: flex; flex-direction: column; border: 0.5px solid rgba(0,0,0,0.08); }
  .tok-name { font-family: var(--mono); font-size: 12px; font-weight: 600; }
  .tok-alias { font-family: var(--mono); font-size: 10.5px; opacity: 0.75; margin-top: 8px; }
  .tok-hex { font-family: var(--mono); font-size: 10.5px; opacity: 0.85; margin-top: 1px; }
  .tok-desc-wrap { grid-column: 1 / -1; }
  .tok-desc { font-size: 11.5px; color: var(--text-muted); margin: -4px 0 4px; max-width: 70ch; }
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("semantic-colors")}
  </nav>
  <main>
    <h1>Semantic colors</h1>
    <p class="sub">tokens/semantic/color.tokens.json · aliases tokens/primitives/color.tokens.json · generated</p>
    ${groups.map(renderGroup).join("\n")}
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/semantic-colors.html"), html);
console.log("wrote docs/semantic-colors.html");
