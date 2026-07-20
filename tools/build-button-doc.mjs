// Regenerates docs/button.html from tokens/components/button.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Colors are emitted as CSS custom properties (:root { --fill-primary: ...; })
// and every rule below references var(--x) — never a literal hex — so the
// printed CSS is real, retheme-able code, not a frozen snapshot of today's values.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-button-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));

const colorPrim = load("tokens/primitives/color.tokens.json").color;
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const radiusPrim = load("tokens/primitives/radius.tokens.json").radius;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const button = load("tokens/components/button.tokens.json").component.button;
const counter = load("tokens/components/counter.tokens.json").component.counter;

const registry = {
  color: colorPrim,
  dim,
  radius: radiusPrim,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": textStyle,
  ...semantic,
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
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- color tokens this page actually uses, as CSS custom properties ----
// (`cv` = "css var" — returns var(--x); shares the exact same name-mangling
// as the :root block below, via cssVarName, so they can't drift apart.)
const colorPaths = ["fill.primary", "fill.primaryHover", "fill.primaryActive", "fill.disabled", "text.onFill", "text.disabled", "border.focus", "color.white", "text.primary"];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans"); // e.g. "Sora" — was previously hand-typed as a literal 'Sora' string in the CSS below instead of coming from this token
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

// ---- resolve button.primary (dimensions stay literal px — only color is themeable here) ----
const btnRadius = px(resolve(button.primary.radius.$value));
const sizes = ["sm", "base", "lg"].map((key) => {
  const s = button.primary.size[key];
  return {
    key,
    height: resolve(s.height.$value),
    paddingX: resolve(s.paddingX.$value),
    gap: resolve(s.gap.$value),
    iconSize: resolve(s.iconSize.$value),
    label: resolveToken(get(s.label.$value)),
  };
});
const focusWidth = resolve(button.primary.state.focused.ringWidth.$value);
const focusOffset = resolve(button.primary.state.focused.ringOffset.$value);

// ---- resolve counter.onFill (needed for the icon+text+counter variant) ----
const counterRadius = px(resolve(counter.onFill.radius.$value));
const counterSizes = ["sm", "base", "lg"].map((key) => {
  const s = counter.onFill.size[key];
  return { key, height: resolve(s.height.$value), minWidth: resolve(s.minWidth.$value), paddingX: resolve(s.paddingX.$value), label: resolveToken(s.label) };
});

// ---- icons (placeholders for the preview only) ----
const iconAdd = fs.readFileSync(path.join(root, "assets/icons/material-filled/add.svg"), "utf8").replace("<svg ", '<svg class="btn-primary__icon" ');
const iconArrow = fs.readFileSync(path.join(root, "assets/icons/material-filled/arrow_forward.svg"), "utf8").replace("<svg ", '<svg class="btn-primary__icon" ');

// var(--bg-card) here is this docs page's own card background, not a design
// token — the ring's inner box-shadow has to match whatever surface the button
// actually sits on, which is inherently contextual. Called out explicitly in
// the printed comment below so nobody copies --bg-card expecting it to exist.
const ringShadow = `box-shadow: 0 0 0 ${px(focusOffset)} var(--bg-card) /* substitute your own surface color */, 0 0 0 calc(${px(focusOffset)} + ${px(focusWidth)}) ${cv("border.focus")};`;

// ---- the actual stylesheet — printed as code AND used to render the live preview ----
const css = `${rootVars}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-family: ${cv("family.sans")};
  background: ${cv("fill.primary")};
  color: ${cv("text.onFill")};
}
.btn-primary__icon { flex-shrink: 0; }
.btn-primary:not(:disabled):hover { background: ${cv("fill.primaryHover")}; }
.btn-primary:not(:disabled):active { background: ${cv("fill.primaryActive")}; }
.btn-primary:not(:disabled):focus-visible { outline: none; ${ringShadow} }
.btn-primary:disabled { background: ${cv("fill.disabled")}; color: ${cv("text.disabled")}; cursor: not-allowed; }

${sizes
  .map(
    (s) => `.btn-primary--${s.key} {
  height: ${px(s.height)};
  padding: 0 ${px(s.paddingX)};
  gap: ${px(s.gap)};
  border-radius: ${btnRadius};
  font-weight: ${s.label.fontWeight};
  font-size: ${px(s.label.fontSize)};
  line-height: ${s.label.lineHeight};
}
.btn-primary--${s.key}.btn-primary--icon-only { width: ${px(s.height)}; padding: 0; }
.btn-primary--${s.key} .btn-primary__icon { width: ${px(s.iconSize)}; height: ${px(s.iconSize)}; }`
  )
  .join("\n\n")}

.counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
  font-family: ${cv("family.sans")};
  font-weight: 700;
  border-radius: ${counterRadius};
}
${counterSizes
  .map(
    (cs) => `.counter--${cs.key} { height: ${px(cs.height)}; min-width: ${px(cs.minWidth)}; padding: 0 ${px(cs.paddingX)}; font-size: ${px(cs.label.fontSize)}; line-height: ${cs.label.lineHeight}; }`
  )
  .join("\n")}
.counter--inactive { background: ${cv("fill.primaryActive")}; color: ${cv("text.onFill")}; }`;

// ---- markup builders: `live` uses real inline SVGs (for the rendered preview), `code` uses a short placeholder comment (for the printed snippet — a full path data dump isn't useful as a code sample) ----
function content(kind, live) {
  const ic = (svg, name) => (live ? svg : `<svg class="btn-primary__icon"><!-- icon: ${name} --></svg>`);
  switch (kind) {
    case "text":
      return "Label";
    case "icon-left":
      return `${ic(iconAdd, "add")}\n  Label`;
    case "icon-only":
      return ic(iconAdd, "add");
    case "icon-both":
      return `${ic(iconAdd, "add")}\n  Label\n  ${ic(iconArrow, "arrow_forward")}`;
    case "counter":
      return `${ic(iconAdd, "add")}\n  Label\n  <span class="counter counter--${"__SIZE__"} counter--inactive">3</span>`;
  }
}
function markup(size, kind, live) {
  const classes = ["btn-primary", `btn-primary--${size}`];
  if (kind === "icon-only") classes.push("btn-primary--icon-only");
  const attrs = kind === "icon-only" ? ' aria-label="Icon only"' : "";
  const inner = content(kind, live).replace("__SIZE__", size);
  return live
    ? `<button class="${classes.join(" ")}"${attrs}>${inner}</button>`
    : `<button class="${classes.join(" ")}"${attrs}>\n  ${inner}\n</button>`;
}

const variants = [
  { key: "text", label: "Text only" },
  { key: "icon-left", label: "Icon left + text" },
  { key: "icon-only", label: "Icon only (square)" },
  { key: "icon-both", label: "Icon left + text + icon right" },
  { key: "counter", label: "Icon left + text + counter right" },
];

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

const sizeStories = sizes
  .map((s) => storyCard(`${s.key} — ${px(s.height)}`, markup(s.key, "icon-left", true), markup(s.key, "icon-left", false)))
  .join("\n");

const variantStories = variants
  .map((vr) => storyCard(vr.label, markup("base", vr.key, true), markup("base", vr.key, false), vr.key === "icon-only" ? "Square — width equals height, no horizontal padding. Needs an <code>aria-label</code> since there's no visible text." : ""))
  .join("\n");

const stateSnippets = {
  default: `.btn-primary {\n  background: ${cv("fill.primary")};\n}`,
  hover: `.btn-primary:hover {\n  background: ${cv("fill.primaryHover")};\n}`,
  pressed: `.btn-primary:active {\n  background: ${cv("fill.primaryActive")};\n}`,
  focused: `.btn-primary:focus-visible {\n  outline: none;\n  ${ringShadow}\n}`,
  disabled: `.btn-primary:disabled {\n  background: ${cv("fill.disabled")};\n  color: ${cv("text.disabled")};\n}`,
};
function stateStory(name, extraStyle, disabled) {
  const html = `<button class="btn-primary btn-primary--base"${disabled ? " disabled" : ""} style="${extraStyle}">${iconAdd}\n    Label</button>`;
  return storyCard(name, html, stateSnippets[name]);
}
const stateStories = [
  stateStory("default", ""),
  stateStory("hover", `background:${cv("fill.primaryHover")}`),
  stateStory("pressed", `background:${cv("fill.primaryActive")}`),
  stateStory("focused", ringShadow),
  stateStory("disabled", "", true),
].join("\n");

const html = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Button</title>
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df;
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
      --code-bg: #0d0d0f; --code-text: #d7d6d2;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; }
  .brand { font-size: 14px; font-weight: 600; margin: 0 0 2px 8px; }
  .brand-sub { font-size: 11.5px; color: var(--text-muted); margin: 0 0 1.5rem 8px; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.75rem 0 1.75rem; max-width: 68ch; line-height: 1.6; }

  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); }
  .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 150px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }

  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; }
  pre.code code { font-family: inherit; }

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 64px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .story-note code.tok { font-size: 11px; }

  .placeholder-note { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); border: 0.5px dashed var(--border-strong); border-radius: 6px; padding: 4px 10px; margin-top: 1.5rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("button")}
  </nav>
  <main>
    <h1>Button</h1>
    <p class="sub">tokens/components/button.tokens.json · Primary variant · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, not hand-copied. Colors are CSS custom properties (<code class="tok">var(--fill-primary)</code> etc.), not literal hex — retune a token, regenerate, and every rule that references it updates together.</p>

    <div class="legend">
      <div class="row"><b>Sizes</b><span>sm 32px / base 40px (default) / lg 48px. paddingX and iconSize scale with height on the same 4px grid the size step itself moves on; the 8px icon↔label gap is flat at every size, per spec.</span></div>
      <div class="row"><b>Icon size</b><span>16 / 20 / 24px — resolves to exactly 50% of button height at every size, which is why it self-scales instead of needing separate tuning as more sizes get added later.</span></div>
      <div class="row"><b>Icon-only</b><span>Square (width = height), no paddingX/gap — the icon centers directly in the box.</span></div>
      <div class="row"><b>Radius</b><span>radius.default (8px) at every size — constant, doesn't scale with height, so the corner reads the same across sm/base/lg.</span></div>
      <div class="row"><b>States</b><span>default → fill.primary · hover → fill.primaryHover · pressed → fill.primaryActive · focused → additive 2px ring (border.focus) with 2px offset, composes on top of any of the three · disabled → fill.disabled + text.disabled + icon.disabled.</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <p class="section-desc">One <code class="tok">:root</code> block of color custom properties, then one base <code class="tok">.btn-primary</code> class, a <code class="tok">--sm/--base/--lg</code> size modifier, and an <code class="tok">--icon-only</code> modifier for the square variant. States are plain pseudo-classes, not separate classes. Dimensions (height/padding/gap/font-size) stay literal px in the size modifiers — those are baked layout decisions per size, not values a consumer re-themes at runtime the way colors are.</p>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Sizes</h2>
    <p class="section-desc">Size and content variant are independent — any of the 5 variants below works at any of these 3 sizes. Shown here with the icon-left+text variant as the reference.</p>
    <div class="story-grid">
      ${sizeStories}
    </div>

    <h2 class="big-section">Content variants</h2>
    <p class="section-desc">All 5 at base (40px) size. Icons shown (add / arrow_forward) are stand-ins for preview only — the real icon per button is decided when a concrete use case is composed, same as the icons page's own "not yet used" placeholders. Counter details: <a href="counter.html">counter.html</a>.</p>
    <div class="story-grid">
      ${variantStories}
    </div>

    <h2 class="big-section">States</h2>
    <p class="section-desc">Base size, icon-left+text variant. Default/hover/pressed/focused are one shared markup with different pseudo-classes applied — disabled is the one real attribute (<code class="tok">disabled</code>) that also flips the label/icon color and drops the cursor.</p>
    <div class="story-grid">
      ${stateStories}
    </div>

    <p class="placeholder-note">Every code sample on this page is printed from the same resolved token values driving the live previews above it — copy it directly, nothing here is hand-typed.</p>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/button.html"), html);
console.log("wrote docs/button.html");
