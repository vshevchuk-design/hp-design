// Shared chrome for every page in the Designs pane (the prototype explorer):
// docs chrome + the device bar (Mobile/Tablet/Desktop segmented Tabs + a
// Versions dropdown) + the iframe frame around a prototype app file.
//
// Extracted 2026-09-07 when the Versions dropdown was added: until then this
// whole block lived duplicated byte-for-byte inside both Message Center
// builders (a drift risk status.md had explicitly accepted for v1), and
// adding a third prototype page plus a new shared control to all of them
// would have meant three copies of the same markup. Same one-file-change
// reasoning as `nav.mjs`: a new control on every designs page belongs here.
//
// Everything visual is a real DS component, resolved from its own token file
// (never retyped): the device tabs are Tabs' segmented recipe, the Versions
// trigger is Select's closed trigger, its popover is Listbox's single-select
// panel — the same trigger+Listbox composition the prototypes themselves use.
//
// VERSIONS. `versions` is an ordered list of real prototype snapshots, newest
// first; the first entry is what loads. Each entry is
//   { label: "v1", note: "current", file: "springboard-app.html" }
// where `file` is relative to `docs/designs/`. The dropdown swaps the iframe's
// src and the "Open standalone" href — so a version is a real, viewable file,
// not a label. Convention for the next one: before starting a big rework, copy
// the current app file to `docs/designs/versions/<slug>-vN.html` and add an
// entry pointing at it, so the previous design stays comparable side by side.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./nav.mjs";
import { cssVarName, renderRootVars } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
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
const tabs = load("tokens/components/tabs.tokens.json").component.tabs;
const select = load("tokens/components/select.tokens.json").component.select;
const listbox = load("tokens/components/listbox.tokens.json").component.listbox;

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
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;

// ---- Tabs (segmented, base) — the device switch ----
const segTrackRadius = px(resolve(tabs.segmented.trackRadius.$value));
const segTrackPadding = px(resolve(tabs.segmented.trackPadding.$value));
const segPillRadius = px(resolve(tabs.segmented.pillRadius.$value));
const tabBase = {
  height: px(resolve(tabs.size.base.height.$value)),
  paddingX: px(resolve(tabs.size.base.paddingX.$value)),
};
const tabItemGap = px(resolve(tabs.item.gap.$value));
const tabItemLabel = resolveToken(tabs.item.label);
const tabActiveWeight = resolve(tabs.segmented.state.active.fontWeight.$value);

// ---- Select (base) — the Versions trigger. Single value line, no floating
// label: label+value stacked need Select's lg (48px) to fit, which would
// stand a head taller than the 40px device tabs sitting right beside it. The
// word "Version" is a chrome-level label in the bar instead. ----
const selectRadius = px(resolve(select.radius.$value));
const selectBase = {
  height: px(resolve(select.size.base.height.$value)),
  paddingX: px(resolve(select.size.base.paddingX.$value)),
  gap: px(resolve(select.size.base.gap.$value)),
  iconSize: px(resolve(select.size.base.iconSize.$value)),
  value: resolveToken(select.size.base.value),
};

// ---- Listbox — the Versions popover (single-select, trailing checkmark) ----
const lb = {
  radius: px(resolve(listbox.radius.$value)),
  optionRadius: px(resolve(listbox.optionRadius.$value)),
  padding: px(resolve(listbox.padding.$value)),
  gap: px(resolve(listbox.gap.$value)),
  optionPaddingX: px(resolve(listbox.optionPaddingX.$value)),
  optionPaddingY: px(resolve(listbox.optionPaddingY.$value)),
  optionGap: px(resolve(listbox.optionGap.$value)),
  checkmarkSize: px(resolve(listbox.checkmarkSize.$value)),
  label: resolveToken(listbox.label),
  shadow: resolveToken(listbox.shadow),
};
const shadowCss = (s) => `${px(s.offsetX)} ${px(s.offsetY)} ${px(s.blur)} ${px(s.spread)} ${s.color}`;
const lbShadowCss = Array.isArray(lb.shadow) ? lb.shadow.map(shadowCss).join(", ") : shadowCss(lb.shadow);

const colorPaths = [
  "surface.sunken", "surface.dim", "surface.default", "fill.neutralHover", "fill.primary",
  "text.secondary", "text.default", "icon.default", "border.default", "border.strong", "border.focus",
];
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, resolve(p)]), ["family.sans", `'${fontSans}', sans-serif`]]);

const iconOf = (name, cls) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" `);
const iconChevron = iconOf("expand_more", "select__chevron");
const iconCheck = iconOf("check", "listbox__checkmark");

const viewerCss = `${rootVars}

.tabs--segmented { display: inline-flex; align-items: center; gap: ${segTrackPadding}; background: ${cv("surface.sunken")}; border-radius: ${segTrackRadius}; padding: ${segTrackPadding}; }
.tab { display: inline-flex; align-items: center; justify-content: center; gap: ${tabItemGap}; border: none; background: transparent; cursor: pointer; white-space: nowrap; color: ${cv("text.secondary")}; font-family: ${cv("family.sans")}; ${typoCss(tabItemLabel)} }
.tab--base { height: ${tabBase.height}; padding: 0 ${tabBase.paddingX}; }
.tabs--segmented .tab { border-radius: ${segPillRadius}; }
.tabs--segmented .tab:not(.tab--active):hover { background: ${cv("fill.neutralHover")}; color: ${cv("text.default")}; }
.tabs--segmented .tab--active { background: ${cv("surface.default")}; color: ${cv("text.default")}; font-weight: ${tabActiveWeight}; }

/* Versions — Select's closed trigger + Listbox's single-select popover, the
   same composition the prototypes use for their own dropdowns */
.select { display: inline-flex; align-items: center; box-sizing: border-box; background: ${cv("surface.dim")}; border: 1px solid ${cv("border.default")}; border-radius: ${selectRadius}; font-family: ${cv("family.sans")}; cursor: pointer; text-align: left; }
.select--base { height: ${selectBase.height}; padding: 0 ${selectBase.paddingX}; gap: ${selectBase.gap}; }
.select--base .select__chevron { width: ${selectBase.iconSize}; height: ${selectBase.iconSize}; }
.select__chevron { flex-shrink: 0; margin-left: auto; color: ${cv("icon.default")}; }
.select__value { color: ${cv("text.default")}; ${typoCss(selectBase.value)} white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.select:hover { border-color: ${cv("border.strong")}; }
.select:focus-visible { outline: none; border-color: ${cv("border.focus")}; }
.listbox { margin: 0; box-sizing: border-box; padding: ${lb.padding}; border-radius: ${lb.radius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${lbShadowCss}; font-family: ${cv("family.sans")}; min-width: 220px; }
.listbox__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${lb.gap}; }
.listbox__option { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${lb.optionGap}; padding: ${lb.optionPaddingY} ${lb.optionPaddingX}; border: none; background: none; border-radius: ${lb.optionRadius}; cursor: pointer; text-align: left; color: ${cv("text.default")}; font-family: inherit; ${typoCss(lb.label)} }
.listbox__option:hover { background: ${cv("fill.neutralHover")}; }
.listbox__note { color: ${cv("text.secondary")}; }
.listbox__checkmark { width: ${lb.checkmarkSize}; height: ${lb.checkmarkSize}; margin-left: auto; color: ${cv("fill.primary")}; flex-shrink: 0; display: none; }
.listbox__option--selected .listbox__checkmark { display: block; }

.device-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 1rem; }
.device-bar__group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.device-bar__label { font-size: 13px; color: var(--text-secondary); }
.open-standalone { font-size: 13px; color: var(--accent); text-decoration: none; }
.open-standalone:hover { text-decoration: underline; }
.frame-wrap { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; justify-content: center; overflow-x: auto; }
.device { border: 1px solid ${cv("border.default")}; background: #fff; overflow: hidden; transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease; flex-shrink: 0; }
.device iframe { width: 100%; height: 100%; border: none; display: block; }
/* +2px compensates the frame's own 1px borders (border-box), so the iframe's
   INTERNAL viewport is exactly 375/768 — without it the tablet frame's inner
   width was 766px and the app's min-width:768 split-view media query never
   fired, leaving the tablet stuck in the one-pane mobile layout */
.device--mobile { width: 377px; height: 814px; max-height: 78vh; border-radius: 28px; }
.device--tablet { width: 770px; height: 1026px; max-height: 78vh; border-radius: 20px; }
.device--desktop { width: 100%; height: 78vh; border-radius: 12px; }`;

const viewerJs = `document.querySelectorAll(".device-bar .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".device-bar .tab").forEach((t) => {
      t.classList.toggle("tab--active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    var device = document.getElementById("device");
    device.className = "device device--" + tab.dataset.device;
  });
});

// Versions — the Listbox popover anchors under its own trigger (the native
// popover API gives the top layer and light dismissal, not the position),
// and picking a version really reloads the iframe + repoints "Open standalone"
(function () {
  var trigger = document.getElementById("viewer-version-trigger");
  var panel = document.getElementById("viewer-version-lb");
  if (!trigger || !panel) return;
  var value = document.getElementById("viewer-version-value");
  var frame = document.getElementById("device-frame");
  var standalone = document.getElementById("viewer-standalone");
  panel.addEventListener("toggle", function (e) {
    trigger.setAttribute("aria-expanded", e.newState === "open" ? "true" : "false");
    if (e.newState !== "open") return;
    var r = trigger.getBoundingClientRect();
    panel.style.position = "fixed";
    panel.style.margin = "0";
    panel.style.top = r.bottom + 4 + "px";
    panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
  });
  panel.querySelectorAll(".listbox__option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      panel.querySelectorAll(".listbox__option").forEach(function (o) {
        o.classList.toggle("listbox__option--selected", o === opt);
        o.setAttribute("aria-selected", o === opt ? "true" : "false");
      });
      value.textContent = opt.dataset.versionLabel;
      if (frame.getAttribute("src") !== opt.dataset.versionFile) frame.setAttribute("src", opt.dataset.versionFile);
      standalone.setAttribute("href", opt.dataset.versionFile);
      panel.hidePopover();
    });
  });
})();`;

// The docs chrome (page vars, sidebar, headings) — identical on every docs
// page; kept here so a designs page is a one-call build.
const DOCS_CHROME_CSS = `  :root {
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
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .brand { font-size: 14px; font-weight: 600; margin: 0 0 2px 8px; }
  .brand-sub { font-size: 11.5px; color: var(--text-muted); margin: 0 0 1.5rem 8px; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 3rem 3rem 4rem; max-width: 1400px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 2rem; max-width: 78ch; line-height: 1.6; }`;

/**
 * @param activeKey  nav key of this designs page (see DESIGN_PRODUCTS in nav.mjs)
 * @param title      <title> text after "hp-design — "
 * @param heading    <h1>
 * @param sub        intro paragraph (English, like every docs artifact)
 * @param versions   newest-first snapshots: { label, note?, file }; [0] loads
 */
export function renderDesignViewer({ activeKey, title, heading, sub, versions }) {
  if (!versions || !versions.length) throw new Error("renderDesignViewer: at least one version is required");
  const labelOf = (v) => (v.note ? `${v.label} · ${v.note}` : v.label);
  const current = versions[0];
  const options = versions
    .map(
      (v, i) => `        <li role="none"><button type="button" class="listbox__option${i === 0 ? " listbox__option--selected" : ""}" role="option" aria-selected="${i === 0 ? "true" : "false"}" data-version-file="${esc(v.file)}" data-version-label="${esc(labelOf(v))}">
          <span>${esc(v.label)}${v.note ? ` <span class="listbox__note">· ${esc(v.note)}</span>` : ""}</span>${iconCheck}
        </button></li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — ${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
<style>
${DOCS_CHROME_CSS}

  ${viewerCss}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav(activeKey, { basePath: "../" })}
  </nav>
  <main>
    <h1>${esc(heading)}</h1>
    <p class="sub">${sub}</p>

    <div class="device-bar">
      <div class="device-bar__group">
        <div class="tabs tabs--segmented tabs--base" role="tablist" aria-label="Preview viewport">
          <button class="tab tab--base tab--active" role="tab" aria-selected="true" data-device="mobile">Mobile</button>
          <button class="tab tab--base" role="tab" aria-selected="false" data-device="tablet">Tablet</button>
          <button class="tab tab--base" role="tab" aria-selected="false" data-device="desktop">Desktop</button>
        </div>
        <span class="device-bar__label">Version</span>
        <button class="select select--base" id="viewer-version-trigger" type="button" popovertarget="viewer-version-lb" aria-haspopup="listbox" aria-expanded="false" aria-label="Prototype version">
          <span class="select__value" id="viewer-version-value">${esc(labelOf(current))}</span>
          ${iconChevron}
        </button>
        <div class="listbox" id="viewer-version-lb" popover>
          <ul class="listbox__list" role="listbox" aria-label="Prototype version">
${options}
          </ul>
        </div>
      </div>
      <a class="open-standalone" id="viewer-standalone" href="${esc(current.file)}" target="_blank" rel="noopener">Open standalone ↗</a>
    </div>
    <div class="frame-wrap">
      <div class="device device--mobile" id="device">
        <iframe id="device-frame" src="${esc(current.file)}" title="${esc(heading)} prototype"></iframe>
      </div>
    </div>
  </main>
</div>
<script>
${viewerJs}
</script>
</body>
</html>
`;
}
