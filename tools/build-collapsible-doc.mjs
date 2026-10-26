// Regenerates docs/collapsible.html from tokens/components/collapsible.tokens.json.
// One region a trigger shows or hides. The recipe lives in tools/lib/collapsible.mjs.
// Run: node tools/build-collapsible-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";
import { cssVarName, renderRootVars } from "./lib/css-vars.mjs";
import { COLLAPSIBLE_CSS, COLLAPSIBLE_JS, collapsibleHtml } from "./lib/collapsible.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p)));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = { color: load("tokens/primitives/color.tokens.json").color, dim: load("tokens/primitives/dimension.tokens.json").dim, radius: load("tokens/primitives/radius.tokens.json").radius, family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking, "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"], ...load("tokens/semantic/color.tokens.json") };
function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const resolve = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cv = (p) => `var(${cssVarName(p)})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// the trigger IS Button ghost sm — its CSS resolved from button.tokens.json
const ghost = load("tokens/components/button.tokens.json").component.button.ghost;
const role = (n) => n.$value.replace(/[{}]/g, "");
const sm = ghost.size.sm;
const colorPaths = [...new Set([role(ghost.state.default.label), role(ghost.state.default.icon), role(ghost.state.hover.fill), role(ghost.state.pressed.fill), role(ghost.state.focused.ringColor), "text.default", "text.secondary", "border.default", "surface.default"])];
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${resolve("family.sans")}', sans-serif`]]);
const css = `${rootVars}
/* Button ghost sm (see button.html) */
.btn { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; white-space: nowrap; font-family: ${cv("family.sans")}; }
.btn--sm { height: ${px(resolve(sm.height.$value))}; padding: 0 ${px(resolve(sm.paddingX.$value))}; gap: ${px(resolve(sm.gap.$value))}; border-radius: ${px(resolve(ghost.radius.$value))}; ${typoCss(resolve(sm.label.$value.replace(/[{}]/g, "")))} }
.btn--ghost { background: transparent; color: ${cv(role(ghost.state.default.label))}; }
.btn--ghost .btn__icon { color: ${cv(role(ghost.state.default.icon))}; }
.btn--ghost:hover { background: ${cv(role(ghost.state.hover.fill))}; }
.btn--ghost:active { background: ${cv(role(ghost.state.pressed.fill))}; }
.btn--ghost:focus-visible { outline: ${px(resolve(ghost.state.focused.ringWidth.$value))} solid ${cv(role(ghost.state.focused.ringColor))}; outline-offset: ${px(resolve(ghost.state.focused.ringOffset.$value))}; }
${COLLAPSIBLE_CSS}`;
const demoCss = `
.col-demo { max-width: 420px; font-family: ${cv("family.sans")}; }
.col-list { list-style: none; margin: 0; padding: 0; }
.col-list li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid ${cv("border.default")}; color: ${cv("text.default")}; ${typoCss(resolve("text-style.body-sm"))} white-space: nowrap; }
.col-list span { color: ${cv("text.secondary")}; }
.col-text { margin: 0; color: ${cv("text.secondary")}; ${typoCss(resolve("text-style.body-base"))} }`;

const dates = ["Tue, Sep 15", "Tue, Sep 22", "Tue, Sep 29", "Tue, Oct 6", "Tue, Oct 13", "Tue, Oct 20", "Tue, Oct 27", "Tue, Nov 3"];
const li = (d, i) => `<li>Session ${i + 1} · ${d}<span>3:00 – 4:00 PM</span></li>`;
const listStory = collapsibleHtml({ id: "col-sessions", visible: `<ul class="col-list">${dates.slice(0, 3).map(li).join("")}</ul>`, hidden: `<ul class="col-list">${dates.slice(3).map((d, i) => li(d, i + 3)).join("")}</ul>`, more: `Show all ${dates.length} sessions`, less: "Show fewer" });
const readMore = collapsibleHtml({ id: "col-read", clamp: true, contentTag: "p", hidden: `<span class="col-text">This workshop covers the study habits that make the biggest difference in your first year: taking notes you will actually reuse, planning a realistic study week around classes and work, and preparing for finals without cramming. Each session builds on the one before, so try to come to all four. Bring a laptop or a notebook — whichever you take notes with in class. The Learning Commons is on the second floor of the library, next to the writing center.</span>`, more: "Read more", less: "Show less" });
const filters = collapsibleHtml({ id: "col-filters", visible: `<p class="col-text">Department · Term · Status</p>`, hidden: `<p class="col-text">Instructor · Campus · Meeting days · Credits · Seats available</p>`, more: "More filters", less: "Fewer filters" });

const story = (title, live, note) => `<div class="story"><h3>${title}</h3><div class="story-preview"><div class="col-demo">${live}</div></div><p class="story-note">${note}</p></div>`;
const sample = `<div class="collapsible" id="sessions" data-collapsible>
  <ul>…the first 3 sessions — always visible…</ul>
  <ul class="collapsible__content" id="sessions-content" hidden="until-found">…the other 5…</ul>
  <button class="btn btn--ghost btn--sm collapsible__trigger" aria-expanded="false" aria-controls="sessions-content"
          data-more="Show all 8 sessions" data-less="Show fewer">
    <span class="collapsible__label">Show all 8 sessions</span>…expand_more (class="collapsible__chevron")…
  </button>
</div>
<!-- Read more: .collapsible--clamp, the text itself is .collapsible__content (no hidden attribute) -->`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Collapsible</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root { --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa; --border: #e4e3df; --border-strong: #d2d1cb; --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87; --accent: #0468c4; --accent-bg: #eff6ff; --code-bg: #1e1e22; --code-text: #e4e3df; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; --sans: -apple-system, "Segoe UI", system-ui, sans-serif; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:where(:not([data-theme="light"])) { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327; --border: #313035; --border-strong: #403f45; --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68; --accent: #5aa4ec; --accent-bg: #16283b; --code-bg: #0d0d0f; --code-text: #d7d6d2; color-scheme: dark; }
  * { box-sizing: border-box; } body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); } .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 4rem 4rem 6rem; max-width: 1120px; min-width: 0; }
  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2.5rem; }
  h2.big-section { font-size: 24px; font-weight: 700; margin: 5.5rem 0 1.5rem; letter-spacing: -0.01em; padding-top: 2.5rem; border-top: 1px solid var(--border); }
  h2.big-section:first-of-type { margin-top: 3rem; padding-top: 0; border-top: none; }
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }
  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); } .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 90px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }
  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; } pre.code code { font-family: inherit; }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
  .story-grid--wide { grid-template-columns: 1fr; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 22px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { padding: 8px 0; overflow-x: auto; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .cal-out { font-family: var(--mono); font-size: 11.5px; color: var(--text-secondary); margin: 12px 0 0; min-height: 1.5em; }
  @media (max-width: 760px) { .shell { display: block; } nav.side { display: none; } main { padding: 2rem 16px 4rem; } }
  ${css}
  ${demoCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">${renderNav("collapsible")}</nav>
  <main>
    <h1>Collapsible</h1>
    <p class="sub">tokens/components/collapsible.tokens.json · generated — one part of something that a trigger shows or hides: “Show all 8 sessions” / “Show fewer”, “Read more” / “Show less”. For a list of rows that each open on their own, use <a href="accordion.html">Accordion</a>.</p>

    <div class="legend">
      <div class="row"><b>Trigger</b><span>Button ghost sm with a trailing chevron that turns over when open, pulled left by its own padding so its label lines up with the content above it.</span></div>
      <div class="row"><b>Label</b><span>Says what is hidden — “Show all 8 sessions”, not “Show more” — and flips to “Show fewer” / “Show less” when open. <code class="tok">aria-expanded</code> + <code class="tok">aria-controls</code>.</span></div>
      <div class="row"><b>Hidden part</b><span><code class="tok">hidden="until-found"</code>: out of sight, but find-in-page still reaches it and opens it.</span></div>
      <div class="row"><b>Read more</b><span><code class="tok">.collapsible--clamp</code> cuts one block of text to 3 lines; the trigger appears only when the text is actually longer.</span></div>
      <div class="row"><b>vs Accordion</b><span>Accordion = many rows, each with its own header that opens it. Collapsible = one hidden part; what stays visible is whatever you put above it.</span></div>
    </div>

    <h2 class="big-section">Stories</h2>
    <div class="story-grid">
      ${story("List — show all", listStory, "The first 3 sessions always show; the trigger names how many there are.")}
      ${story("Read more", readMore, "Clamped to 3 lines; resize the window narrower or wider — the trigger only appears while the text overflows.")}
      ${story("More filters", filters, "Any block can be the hidden part, not only list items.")}
    </div>

    <h2 class="big-section">Markup</h2>
    <pre class="code"><code>${esc(sample)}</code></pre>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>
  </main>
</div>
<script>
${COLLAPSIBLE_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/collapsible.html"), html);
console.log("wrote docs/collapsible.html");
