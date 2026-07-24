// Shared sidebar nav — single source of truth for every docs/*.html build script,
// so adding/moving a page (like splitting Components into per-component pages)
// is a one-file change instead of hand-editing every generator's copy-pasted block.
//
// Two panes, switched by the DS / Designs tabs at the top:
//   DS      — the design system itself (tokens + components), the original nav.
//   Designs — the prototype explorer: an accordion per product (Message Center
//             first), each holding its interactive prototype pages under
//             docs/designs/. The pane containing the active page is the one
//             shown on load; the tabs just toggle in-page, no navigation.
// The tab styles/script are emitted inline here so this stays a one-file
// change — the per-page chrome CSS in each build script doesn't know about it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Inlined (not <img>-linked) so it needs no basePath juggling and so the
// wordmark can follow the docs chrome's own text color in dark mode — the
// source asset's #090D19 text fill is swapped for currentColor at build time;
// the blue mark + white glyph stay fixed brand colors.
const NAV_ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const LOGO_SVG = fs
  .readFileSync(path.join(NAV_ROOT, "assets/highpoint-logo.svg"), "utf8")
  .replace(/fill="#090D19"/g, 'fill="currentColor"');

export const NAV_ITEMS = {
  overview: { label: "Overview", href: "index.html" },
  colors: { label: "Colors", href: "colors.html" },
  "semantic-colors": { label: "Semantic colors", href: "semantic-colors.html" },
  typography: { label: "Typography", href: "typography.html" },
  layout: { label: "Layout", href: "layout.html" },
  icons: { label: "Icons", href: "icons.html" },
  button: { label: "Button", href: "button.html" },
  counter: { label: "Counter", href: "counter.html" },
  input: { label: "Input", href: "input.html" },
  select: { label: "Select", href: "select.html" },
  search: { label: "Search", href: "search.html" },
  pagination: { label: "Pagination", href: "pagination.html" },
  separator: { label: "Separator", href: "separator.html" },
  tabs: { label: "Tabs", href: "tabs.html" },
  checkbox: { label: "Checkbox", href: "checkbox.html" },
  radio: { label: "Radio", href: "radio.html" },
  box: { label: "Box", href: "box.html" },
  card: { label: "Card", href: "card.html" },
  switch: { label: "Switch", href: "switch.html" },
  grid: { label: "Grid", href: "grid.html" },
  tooltip: { label: "Tooltip", href: "tooltip.html" },
  popover: { label: "Popover", href: "popover.html" },
  drawer: { label: "Drawer", href: "drawer.html" },
  modal: { label: "Modal", href: "modal.html" },
  menu: { label: "Menu", href: "menu.html" },
  listbox: { label: "Listbox", href: "listbox.html" },
  avatar: { label: "Avatar", href: "avatar.html" },
  badge: { label: "Badge", href: "badge.html" },
  chip: { label: "Chip", href: "chip.html" },
  attachment: { label: "Attachment", href: "attachment.html" },
  message: { label: "Message", href: "message.html" },
  bubble: { label: "Bubble", href: "bubble.html" },
  "thread-list-item": { label: "ThreadListItem", href: "thread-list-item.html" },
  composer: { label: "Composer", href: "composer.html" },
  "empty-state": { label: "EmptyState", href: "empty-state.html" },
  toast: { label: "Toast", href: "toast.html" },
};

// Products → prototype pages shown in the Designs pane. Keys are the
// activeKey a designs page passes to renderNav (e.g. "student-message-center").
export const DESIGN_PRODUCTS = {
  "message-center": {
    label: "Message Center",
    items: {
      "student-message-center": { label: "Student Message Center", href: "designs/student-message-center.html" },
    },
  },
};

const NAV_CHROME = `<style>
  .nav-logo { color: var(--text-primary); margin: 2px 0 16px 8px; }
  .nav-logo svg { display: block; }
  .nav-pane .brand { margin: 12px 0 10px 8px; }
  .nav-tabs { display: flex; gap: 3px; margin: 0 0 4px; padding: 3px; background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 9px; }
  .nav-tab { flex: 1; border: none; background: transparent; padding: 6px 0; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text-secondary); cursor: pointer; font-family: inherit; }
  .nav-tab:hover { background: var(--bg-card-hover); color: var(--text-primary); }
  .nav-tab.active { background: var(--accent-bg); color: var(--accent); }
  .nav-pane { display: none; }
  .nav-pane.active { display: block; }
  .nav-acc { margin: 0; }
  .nav-acc summary { list-style: none; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; user-select: none; }
  .nav-acc summary::-webkit-details-marker { display: none; }
  .nav-acc summary::after { content: ""; width: 5px; height: 5px; border-right: 1.5px solid var(--text-muted); border-bottom: 1.5px solid var(--text-muted); transform: rotate(-45deg); transition: transform 0.12s; }
  .nav-acc[open] summary::after { transform: rotate(45deg); }
</style>`;

const NAV_SCRIPT = `<script>
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".nav-pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === tab.dataset.pane));
    });
  });
</script>`;

export function renderNav(activeKey, { basePath = "" } = {}) {
  const link = (key) => {
    const item = NAV_ITEMS[key];
    return `<a class="navlink${key === activeKey ? " active" : ""}" href="${basePath}${item.href}">${item.label}</a>`;
  };
  const designsActive = Object.values(DESIGN_PRODUCTS).some((p) => Object.keys(p.items).includes(activeKey));
  const designsPane = Object.entries(DESIGN_PRODUCTS)
    .map(
      ([, product]) => `<details class="nav-acc" open>
      <summary>${product.label}</summary>
      ${Object.entries(product.items)
        .map(([key, item]) => `<a class="navlink${key === activeKey ? " active" : ""}" href="${basePath}${item.href}">${item.label}</a>`)
        .join("\n      ")}
    </details>`
    )
    .join("\n    ");
  return `${NAV_CHROME}
    <div class="nav-logo">${LOGO_SVG}</div>
    <div class="nav-tabs" role="tablist">
      <button class="nav-tab${designsActive ? "" : " active"}" data-pane="ds" type="button">DS</button>
      <button class="nav-tab${designsActive ? " active" : ""}" data-pane="designs" type="button">Designs</button>
    </div>
    <div class="nav-pane nav-pane--ds${designsActive ? "" : " active"}" data-pane="ds">
    <p class="brand">Design System</p>
    ${link("overview")}
    <p class="nav-category">Tokens</p>
    ${link("colors")}
    ${link("semantic-colors")}
    ${link("typography")}
    ${link("layout")}
    ${link("icons")}
    <p class="nav-category">Components</p>
    ${link("button")}
    ${link("counter")}
    ${link("input")}
    ${link("select")}
    ${link("search")}
    ${link("pagination")}
    ${link("separator")}
    ${link("tabs")}
    ${link("checkbox")}
    ${link("radio")}
    ${link("box")}
    ${link("card")}
    ${link("switch")}
    ${link("grid")}
    ${link("tooltip")}
    ${link("popover")}
    ${link("drawer")}
    ${link("modal")}
    ${link("menu")}
    ${link("listbox")}
    ${link("avatar")}
    ${link("badge")}
    ${link("chip")}
    ${link("attachment")}
    ${link("message")}
    ${link("bubble")}
    ${link("thread-list-item")}
    ${link("composer")}
    ${link("empty-state")}
    ${link("toast")}
    </div>
    <div class="nav-pane nav-pane--designs${designsActive ? " active" : ""}" data-pane="designs">
    <p class="brand">Design Prototypes</p>
    ${designsPane}
    </div>
    ${NAV_SCRIPT}`;
}
