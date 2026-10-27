// Regenerates docs/dropdown-menu.html from tokens/components/dropdown-menu.tokens.json,
// resolving aliases back through semantic/*.tokens.json and primitives/*.tokens.json.
// Built on Popover's exact shell (native `popover` attribute, border+shadow.sm+
// radius.default, the same small positioning script) — Menu is a list of
// actions (role=menu/menuitem in a real port), not a Popover variant, same
// reasoning Modal/SlideOverPanel stayed separate files despite sharing <dialog>.
// The generated <style> block IS the code shown in the "CSS" section below —
// one source, so the live preview and the printed snippet can't drift apart.
// Run: node tools/build-dropdown-menu-doc.mjs
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
const shadowPrim = load("tokens/primitives/shadow.tokens.json").shadow;
const typo = load("tokens/primitives/typography.tokens.json");
const textStyle = load("tokens/primitives/text-styles.tokens.json")["text-style"];
const semantic = load("tokens/semantic/color.tokens.json");
const menu = load("tokens/components/dropdown-menu.tokens.json").component.dropdownMenu;

const registry = {
  color: colorPrim,
  dim,
  radius: radiusPrim,
  shadow: shadowPrim,
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
const cv = (tokenPath) => `var(${cssVarName(tokenPath)})`;

// Checkbox/radio items carry the real Checkbox and Radio; the group label is
// Command's group heading — all resolved from their own token files.
const checkbox = load("tokens/components/checkbox.tokens.json").component.checkbox;
const radio = load("tokens/components/radio.tokens.json").component.radio;
const command = load("tokens/components/command.tokens.json").component.command;
const refPath = (n) => n.$value.replace(/[{}]/g, "");
const cb = checkbox.state, rd = radio.state;
const markRoles = [cb.default.bg, cb.default.border, cb.hover.bg, cb.hover.border, cb.checked.bg, cb.checked.border, cb.checked.icon, cb.checkedHover.bg, cb.checkedHover.border, cb.disabled.bg, cb.disabled.border, cb.disabledChecked.bg, cb.disabledChecked.border, cb.disabledChecked.icon,
  rd.default.bg, rd.default.border, rd.hover.bg, rd.hover.border, rd.checked.bg, rd.checked.border, rd.checked.dot, rd.checkedHover.border, rd.checkedHover.dot, rd.disabled.bg, rd.disabled.border].map(refPath);
const headingRole = refPath(command.group.headingColor);

const colorPaths = [...new Set([
  "fill.neutralHoverStrong",
  "surface.default", "border.default", "border.focus", "text.default", "text.disabled", "text.danger",
  "icon.secondary", "icon.disabled", "icon.danger", "fill.neutral", "fill.neutralHover", "fill.neutralActive", "bg.danger",
  ...markRoles, headingRole,
])];
const colorValue = Object.fromEntries(colorPaths.map((p) => [p, resolve(p)]));
const fontSans = resolve("family.sans");
const rootVars = renderRootVars([...colorPaths.map((p) => [p, colorValue[p]]), ["family.sans", `'${fontSans}', sans-serif`]]);

const radius = px(resolve(menu.radius.$value));
const itemRadius = px(resolve(menu.itemRadius.$value));
const padding = px(resolve(menu.padding.$value));
const gap = px(resolve(menu.gap.$value));
const itemPaddingX = px(resolve(menu.itemPaddingX.$value));
const itemHeight = px(resolve(menu.itemHeight.$value));
const itemGap = px(resolve(menu.itemGap.$value));
const iconSize = px(resolve(menu.iconSize.$value));
const labelType = resolveToken(menu.label);
const shadow = resolveToken(menu.shadow);
const shadowCss = `${px(shadow.offsetX)} ${px(shadow.offsetY)} ${px(shadow.blur)} ${px(shadow.spread)} ${shadow.color}`;
const R = (n) => cv(refPath(n));
const cbBox = px(resolve(checkbox.size.box.$value)), cbIcon = px(resolve(checkbox.size.iconSize.$value)), cbBorder = px(resolve(checkbox.size.borderWidth.$value)), cbRadius = px(resolve(checkbox.radius.$value));
const rdCircle = px(resolve(radio.size.circle.$value)), rdDot = px(resolve(radio.size.dot.$value)), rdBorder = px(resolve(radio.size.borderWidth.$value));
const overlap = resolve(menu.submenu.overlap.$value).value;
const headingType = resolveToken(command.group.heading);
const headingHeight = px(resolve(command.group.headingHeight.$value));

function typoCss(t) {
  return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
}

const iconFile = (name, cls = "dropdown-menu__icon") => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const css = `${rootVars}

.dropdown-menu { margin: 0; box-sizing: border-box; padding: ${padding}; border-radius: ${radius}; background: ${cv("surface.default")}; border: 1px solid ${cv("border.default")}; box-shadow: ${shadowCss}; font-family: ${cv("family.sans")}; min-width: 180px; }
.dropdown-menu__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: ${gap}; }
.dropdown-menu__label { box-sizing: border-box; height: ${headingHeight}; display: flex; align-items: center; padding: 0 ${itemPaddingX}; color: ${cv(headingRole)}; ${typoCss(headingType)} }
.dropdown-menu__item { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: ${itemGap}; height: ${itemHeight}; padding: 0 ${itemPaddingX}; border: none; background: none; border-radius: ${itemRadius}; cursor: pointer; text-align: left; color: ${cv("text.default")}; font-family: inherit; ${typoCss(labelType)} }
.dropdown-menu__item:hover, .dropdown-menu__item:focus-visible { background: ${cv("fill.neutralHover")}; outline: none; }
/* a submenu trigger keeps the hover fill while its submenu is open */
.dropdown-menu__item[aria-expanded="true"] { background: ${cv("fill.neutralHover")}; }
.dropdown-menu__icon { width: ${iconSize}; height: ${iconSize}; flex-shrink: 0; color: ${cv("icon.secondary")}; }
.dropdown-menu__chevron { width: ${iconSize}; height: ${iconSize}; flex-shrink: 0; margin-left: auto; color: ${cv("icon.secondary")}; }
/* the real Checkbox / Radio — the row's hover drives their hover, as a label would */
.dropdown-menu__checkbox, .dropdown-menu__radio { box-sizing: border-box; flex-shrink: 0; display: grid; place-items: center; }
.dropdown-menu__checkbox { width: ${cbBox}; height: ${cbBox}; border-radius: ${cbRadius}; border: ${cbBorder} solid ${R(cb.default.border)}; background: ${R(cb.default.bg)}; }
.dropdown-menu__checkbox svg { width: ${cbIcon}; height: ${cbIcon}; color: ${R(cb.checked.icon)}; visibility: hidden; }
.dropdown-menu__item:hover .dropdown-menu__checkbox { border-color: ${R(cb.hover.border)}; background: ${R(cb.hover.bg)}; }
.dropdown-menu__item[aria-checked="true"] .dropdown-menu__checkbox { border-color: ${R(cb.checked.border)}; background: ${R(cb.checked.bg)}; }
.dropdown-menu__item[aria-checked="true"]:hover .dropdown-menu__checkbox { border-color: ${R(cb.checkedHover.border)}; background: ${R(cb.checkedHover.bg)}; }
.dropdown-menu__item[aria-checked="true"] .dropdown-menu__checkbox svg { visibility: visible; }
.dropdown-menu__radio { width: ${rdCircle}; height: ${rdCircle}; border-radius: 50%; border: ${rdBorder} solid ${R(rd.default.border)}; background: ${R(rd.default.bg)}; }
.dropdown-menu__radio::after { content: ""; width: ${rdDot}; height: ${rdDot}; border-radius: 50%; background: ${R(rd.checked.dot)}; visibility: hidden; }
.dropdown-menu__item:hover .dropdown-menu__radio { border-color: ${R(rd.hover.border)}; background: ${R(rd.hover.bg)}; }
.dropdown-menu__item[aria-checked="true"] .dropdown-menu__radio { border-color: ${R(rd.checked.border)}; background: ${R(rd.checked.bg)}; }
.dropdown-menu__item[aria-checked="true"] .dropdown-menu__radio::after { visibility: visible; }
.dropdown-menu__item[aria-checked="true"]:hover .dropdown-menu__radio { border-color: ${R(rd.checkedHover.border)}; }
.dropdown-menu__item[aria-checked="true"]:hover .dropdown-menu__radio::after { background: ${R(rd.checkedHover.dot)}; }
.dropdown-menu__item:disabled .dropdown-menu__checkbox { border-color: ${R(cb.disabled.border)}; background: ${R(cb.disabled.bg)}; }
.dropdown-menu__item:disabled[aria-checked="true"] .dropdown-menu__checkbox { border-color: ${R(cb.disabledChecked.border)}; background: ${R(cb.disabledChecked.bg)}; }
.dropdown-menu__item:disabled[aria-checked="true"] .dropdown-menu__checkbox svg { color: ${R(cb.disabledChecked.icon)}; }
.dropdown-menu__item:disabled .dropdown-menu__radio { border-color: ${R(rd.disabled.border)}; background: ${R(rd.disabled.bg)}; }
.dropdown-menu__item:disabled { color: ${cv("text.disabled")}; cursor: not-allowed; }
.dropdown-menu__item:disabled:hover { background: none; }
.dropdown-menu__item:disabled .dropdown-menu__icon { color: ${cv("icon.disabled")}; }
.dropdown-menu__item--destructive { color: ${cv("text.danger")}; }
.dropdown-menu__item--destructive .dropdown-menu__icon { color: ${cv("icon.danger")}; }
.dropdown-menu__item--destructive:hover, .dropdown-menu__item--destructive:focus-visible { background: ${cv("bg.danger")}; }
.dropdown-menu__divider { height: 1px; background: ${cv("border.default")}; margin: ${px(resolve("dim.0_5"))} ${px(resolve("dim.0"))}; }`;

function storyCard(title, liveHtml, codeHtml, note = "") {
  return `
      <div class="story">
        <h3>${title}</h3>
        <div class="story-preview">${liveHtml}</div>
        <pre class="code"><code>${esc(codeHtml)}</code></pre>
        ${note ? `<p class="story-note">${note}</p>` : ""}
      </div>`;
}

// One renderer for the live preview and the printed sample: `live` swaps the
// "…" placeholders for the real SVGs, everything else is the same string.
// Item spec: "divider" | { label, items } (a group) | { text, icon, destructive,
// disabled, check: bool (checkbox item), radio: bool (radio item), sub: { id, items } }.
function renderItems(items, live, depth) {
  const ind = "  ".repeat(depth);
  const svg = (name, cls) => (live ? iconFile(name, cls) : "…");
  return items.map((it, i) => {
    if (it === "divider") return `${ind}<li role="none"><div class="dropdown-menu__divider" role="separator"></div></li>`;
    if (it.items && !it.sub) {
      const gid = `${it.id}-label`;
      return `${ind}<li role="none">
${ind}  <div class="dropdown-menu__label" id="${gid}">${it.label}</div>
${ind}  <ul class="dropdown-menu__list" role="group" aria-labelledby="${gid}">
${renderItems(it.items, live, depth + 2)}
${ind}  </ul>
${ind}</li>`;
    }
    const cls = `dropdown-menu__item${it.destructive ? " dropdown-menu__item--destructive" : ""}`;
    if (it.check !== undefined) return `${ind}<li role="none"><button class="${cls}" role="menuitemcheckbox" aria-checked="${it.check}"><span class="dropdown-menu__checkbox" aria-hidden="true">${svg("check", "")}</span>${it.text}</button></li>`;
    if (it.radio !== undefined) return `${ind}<li role="none"><button class="${cls}" role="menuitemradio" aria-checked="${it.radio}"><span class="dropdown-menu__radio" aria-hidden="true"></span>${it.text}</button></li>`;
    const icon = it.icon ? svg(it.icon) : "";
    if (it.sub) return `${ind}<li role="none">
${ind}  <button class="${cls}" role="menuitem" aria-haspopup="menu" aria-expanded="false" data-submenu="${it.sub.id}">${icon}${it.text}${svg("chevron_right", "dropdown-menu__chevron")}</button>
${ind}  <div class="dropdown-menu" id="${it.sub.id}" popover role="menu" aria-label="${it.text}">
${ind}    <ul class="dropdown-menu__list" role="none">
${renderItems(it.sub.items, live, depth + 3)}
${ind}    </ul>
${ind}  </div>
${ind}</li>`;
    return `${ind}<li role="none"><button class="${cls}" role="menuitem"${it.disabled ? " disabled" : ""}>${icon}${it.text}</button></li>`;
  }).join("\n");
}
function menuHtml(id, trigger, items, live) {
  return `<button class="${live ? "ov-btn ov-btn--secondary" : "btn"}" popovertarget="${id}" aria-haspopup="menu">${trigger}</button>
<div class="dropdown-menu" id="${id}" popover role="menu" aria-label="${trigger}">
  <ul class="dropdown-menu__list" role="none">
${renderItems(items, live, 2)}
  </ul>
</div>`;
}
const story = (title, id, trigger, items, note) => storyCard(title, menuHtml(id, trigger, items, true), menuHtml(id, trigger, items, false), note);

const triggerGap = resolve("dim.2").value;
const positionScript = `document.querySelectorAll('[popovertarget]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panel = document.getElementById(trigger.getAttribute('popovertarget'));
    const rect = trigger.getBoundingClientRect();
    panel.style.top = (rect.bottom + ${triggerGap}) + 'px';
    panel.style.left = rect.left + 'px';
  });
});`;

// Plain items close the whole menu; checkbox and radio items change state and
// leave it open (Radix's behaviour), so several settings can be changed in one go.
const itemScript = `document.querySelectorAll('.dropdown-menu').forEach((menu) => {
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-menu__item');
    if (!item || item.disabled || item.closest('.dropdown-menu') !== menu) return;
    const role = item.getAttribute('role');
    if (role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (role === 'menuitemradio') {
      item.closest('[role="group"]').querySelectorAll('[role="menuitemradio"]').forEach((r) => r.setAttribute('aria-checked', String(r === item)));
    } else if (!item.hasAttribute('data-submenu')) {
      let top = menu;
      while (top.parentElement.closest('.dropdown-menu')) top = top.parentElement.closest('.dropdown-menu');
      top.hidePopover();
    }
  });
});`;

// The submenu is a popover nested inside its parent's DOM, so the browser
// treats it as a child: opening it keeps the parent open, closing the parent
// closes it. Opens on hover, click or →; ← (or hovering a sibling) closes it.
const submenuScript = `document.querySelectorAll('[data-submenu]').forEach((trigger) => {
  const sub = document.getElementById(trigger.dataset.submenu);
  const parent = trigger.closest('.dropdown-menu');
  const open = () => {
    if (sub.matches(':popover-open')) return;
    sub.showPopover();
    // beside the parent, overlapping its edge by the panel padding; flip left when there's no room
    const r = trigger.getBoundingClientRect(), p = parent.getBoundingClientRect(), w = sub.offsetWidth;
    let left = p.right - ${overlap};
    if (left + w > window.innerWidth - 8) left = p.left + ${overlap} - w;
    sub.style.left = left + 'px';
    sub.style.top = (r.top - ${resolve(menu.padding.$value).value} - 1) + 'px';
  };
  sub.addEventListener('toggle', (e) => trigger.setAttribute('aria-expanded', String(e.newState === 'open')));
  trigger.addEventListener('mouseenter', open);
  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); open(); sub.querySelector('.dropdown-menu__item').focus(); }
  });
  sub.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); sub.hidePopover(); trigger.focus(); }
  });
  parent.querySelectorAll('.dropdown-menu__item').forEach((item) => {
    if (item !== trigger && item.closest('.dropdown-menu') === parent) item.addEventListener('mouseenter', () => sub.matches(':popover-open') && sub.hidePopover());
  });
});`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — DropdownMenu</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
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
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
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
  .section-desc { font-size: 13.5px; color: var(--text-secondary); margin: -0.5rem 0 1.5rem; max-width: 68ch; line-height: 1.6; }

  .legend { font-size: 12.5px; color: var(--text-secondary); padding: 14px 18px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 10px; margin-bottom: 1rem; line-height: 1.6; }
  .legend .row { display: flex; gap: 14px; padding: 6px 0; border-bottom: 0.5px solid var(--border); }
  .legend .row:last-child { border-bottom: none; }
  .legend .row b { width: 150px; flex-shrink: 0; color: var(--text-primary); font-weight: 600; font-family: var(--mono); font-size: 11.5px; }
  code.tok { font-family: var(--mono); font-size: 12px; color: var(--accent); }

  pre.code { background: var(--code-bg); color: var(--code-text); border-radius: 10px; padding: 16px 18px; margin: 0; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; }
  pre.code code { font-family: inherit; }

  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px; }
  .story { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .story h3 { font-size: 14px; font-weight: 600; margin: 0; font-family: var(--mono); }
  .story-preview { min-height: 64px; display: flex; align-items: center; justify-content: center; padding: 12px 0; }
  .story-note { font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5; }

  .ov-btn { box-sizing: border-box; height: ${px(resolve("dim.10"))}; padding: 0 ${px(resolve("dim.3"))}; border-radius: ${px(resolve("radius.default"))}; border: none; cursor: pointer; font-family: var(--sans); ${typoCss(resolveToken(get("text-style.heading-base")))} }
  .ov-btn--secondary { background: ${cv("fill.neutral")}; color: ${cv("text.default")}; }
  /* Strong tier — this button rests on fill.neutral (gray.100), where the
   fill.neutralHover wash is the same colour and the hover shows nothing. */
.ov-btn--secondary:hover { background: ${cv("fill.neutralHoverStrong")}; }
  .ov-btn--secondary:active { background: ${cv("fill.neutralActive")}; }
  .ov-btn:focus-visible { outline: ${px(resolve("dim.1"))} solid ${cv("border.focus")}; outline-offset: ${px(resolve("dim.0_5"))}; }

  .placeholder-note { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); border: 0.5px dashed var(--border-strong); border-radius: 6px; padding: 4px 10px; margin-top: 1.5rem; }

  ${css}
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("dropdown-menu")}
  </nav>
  <main>
    <h1>DropdownMenu</h1>
    <p class="sub">tokens/components/dropdown-menu.tokens.json · generated — the CSS below is generated from the same resolved tokens driving every preview on this page, not hand-copied. Colors are CSS custom properties, not literal hex.</p>

    <div class="legend">
      <div class="row"><b>Not a Popover variant</b><span>Radix/Storybook's DropdownMenu (renamed from Menu 2026-10-26). Built on Popover's exact shell (native <code class="tok">popover</code> attribute, border+shadow.sm+radius.default, same positioning script) but kept as its own component — a list of actions has a different content/keyboard model than arbitrary Popover content, same reasoning Dialog/SlideOverPanel stayed separate despite sharing &lt;dialog&gt;.</span></div>
      <div class="row"><b>Not Listbox</b><span>Items here are things you <em>do</em> (Rename, Duplicate, Delete) or view settings that apply at once — a list of selectable <em>options</em> (checkboxes, single/multi-select) is <a href="listbox.html">Listbox</a>, a separate component with a different ARIA role (listbox/option vs. menu/menuitem).</span></div>
      <div class="row"><b>Group label</b><span>Heads a group ("Actions", "Sort order") — Command's group heading, resolved from <code class="tok">command.tokens.json</code>: <code class="tok">heading-sm</code> · <code class="tok">${headingRole}</code>, ${headingHeight} tall. Not clickable.</span></div>
      <div class="row"><b>Checkbox items</b><span><code class="tok">role="menuitemcheckbox"</code> — toggles a view setting (which columns show). The mark is the real <a href="checkbox.html">Checkbox</a> (${cbBox}, its own tokens), and hovering the row hovers it, as its label would. Several can be on; the menu stays open.</span></div>
      <div class="row"><b>Radio items</b><span><code class="tok">role="menuitemradio"</code> in a <code class="tok">role="group"</code> — one of a set (sort order). The mark is the real <a href="radio.html">Radio</a> (${rdCircle}, its own tokens). The menu stays open.</span></div>
      <div class="row"><b>vs. Listbox</b><span>A checkbox/radio item changes something <em>right away</em> (the table re-sorts). A value a form submits — a field showing what's chosen — is <a href="listbox.html">Listbox</a> inside Select.</span></div>
      <div class="row"><b>Submenu</b><span>An item with a trailing › opens a nested menu beside it — on hover, click or →; ← or hovering a sibling closes it. It overlaps the parent's edge by ${px(resolve(menu.submenu.overlap.$value))} so the pointer never crosses a gap, and flips to the left when there's no room. The trigger keeps its hover fill while open. A nested popover in the parent's DOM, so closing the parent closes it.</span></div>
      <div class="row"><b>Concentric radius</b><span>Panel is radius.default (8px), items are radius.xs (4px) — 8px outer minus the 4px outer padding, so a corner item's curve lines up with the panel's own curve instead of fighting it.</span></div>
      <div class="row"><b>Destructive item</b><span>text.danger/icon.danger at rest, and hovers into bg.danger (a pale red tint) instead of the usual fill.neutralHover — stays 'red' on hover rather than reverting to neutral gray.</span></div>
      <div class="row"><b>Keyboard</b><span>Roles are real (<code class="tok">menu</code> / <code class="tok">menuitem</code> / <code class="tok">menuitemcheckbox</code> / <code class="tok">menuitemradio</code>), Escape and outside-click are native, → / ← open and close a submenu. Not here: arrow-key roving focus and type-ahead — a real port adds them (Radix does).</span></div>
    </div>

    <h2 class="big-section">CSS</h2>
    <pre class="code"><code>${esc(css)}</code></pre>

    <h2 class="big-section">Positioning script</h2>
    <p class="section-desc">Identical to Popover's — same native popover attribute, same reasoning.</p>
    <pre class="code"><code>${esc(positionScript)}</code></pre>

    <h2 class="big-section">Content variants</h2>
    <p class="section-desc">Click to open for real.</p>
    <div class="story-grid">
      ${story("Default — label, icons, destructive", "dm-default", "Actions", [{ id: "dm-default-g", label: "Actions", items: [{ text: "Edit", icon: "edit" }, { text: "Duplicate", icon: "content_copy" }] }, "divider", { text: "Delete", icon: "delete", destructive: true }], "The divider sets the destructive item apart from the safe ones.")}
      ${story("Text only", "dm-text", "Options", [{ text: "Rename" }, { text: "Duplicate" }, { text: "Share" }])}
      ${story("Checkbox items", "dm-check", "View options", [{ id: "dm-check-g", label: "Toggle columns", items: [{ text: "Status", check: true }, { text: "Activity", check: false }, { text: "Last message", check: true }] }], "Click to toggle — the menu stays open so several columns can change in one go.")}
      ${story("Radio items", "dm-radio", "Sort by", [{ id: "dm-radio-g", label: "Sort order", items: [{ text: "Name", radio: true }, { text: "Date", radio: false }, { text: "Status", radio: false }] }], "One of the group; picking another moves the dot. Stays open.")}
      ${story("Submenu", "dm-sub", "More options", [{ text: "New file" }, { text: "Share", sub: { id: "dm-sub-share", items: [{ text: "Email" }, { text: "Message" }, "divider", { text: "Copy link" }] } }, "divider", { text: "Settings" }], "Hover or click Share, or focus it and press →. The submenu flips left near the right edge of the screen.")}
      ${story("Disabled item", "dm-disabled", "Actions", [{ text: "Rename", icon: "edit" }, { text: "Duplicate", icon: "content_copy", disabled: true }, "divider", { text: "Delete", icon: "delete", destructive: true }], "A disabled item keeps its icon/label faded and drops the hover background entirely.")}
    </div>

    <p class="placeholder-note">Every code sample on this page is printed from the same resolved token values driving the live previews above it — copy it directly, nothing here is hand-typed.</p>
  </main>
</div>
<script>${positionScript}</script>
<script>${itemScript}</script>
<script>${submenuScript}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/dropdown-menu.html"), html);
console.log("wrote docs/dropdown-menu.html");
