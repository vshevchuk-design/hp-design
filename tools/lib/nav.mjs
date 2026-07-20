// Shared sidebar nav — single source of truth for every docs/*.html build script,
// so adding/moving a page (like splitting Components into per-component pages)
// is a one-file change instead of hand-editing every generator's copy-pasted block.
export const NAV_ITEMS = {
  overview: { label: "Overview", href: "index.html" },
  colors: { label: "Colors", href: "colors.html" },
  "semantic-colors": { label: "Semantic colors", href: "semantic-colors.html" },
  typography: { label: "Typography", href: "typography.html" },
  layout: { label: "Layout", href: "layout.html" },
  icons: { label: "Icons", href: "icons.html" },
  button: { label: "Button", href: "button.html" },
  counter: { label: "Counter", href: "counter.html" },
};

export function renderNav(activeKey) {
  const link = (key) => {
    const item = NAV_ITEMS[key];
    return `<a class="navlink${key === activeKey ? " active" : ""}" href="${item.href}">${item.label}</a>`;
  };
  return `<p class="brand">hp-design</p>
    <p class="brand-sub">Highpoint design system</p>
    ${link("overview")}
    <p class="nav-category">Tokens</p>
    ${link("colors")}
    ${link("semantic-colors")}
    ${link("typography")}
    ${link("layout")}
    ${link("icons")}
    <p class="nav-category">Components</p>
    ${link("button")}
    ${link("counter")}`;
}
