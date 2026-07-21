// Shared "dotted token path -> CSS custom property" convention, so a color
// token always maps to the same --var-name everywhere it's used (button.html,
// counter.html, and any component page added later) instead of each build
// script picking its own naming and baking in literal resolved hex.
//
// Prefixed with `tok-` deliberately: every docs page's own chrome (nav/card
// styling) declares its own `:root` with names like --text-primary/--border/
// --accent for its own reading-UI purposes, unrelated to the design system.
// tokens/semantic/color.tokens.json's `text.primary` role collided with the
// chrome's --text-primary literally — same name, two different meanings, and
// since both are `:root` blocks in the same <style> tag, the later one (the
// component CSS) silently overrode the chrome's near-black body text with the
// token's blue, turning all page text blue. The prefix makes that collision
// structurally impossible instead of relying on the two naming schemes never
// happening to pick the same word again.
export function cssVarName(dottedPath) {
  return (
    "--tok-" +
    dottedPath
      .split(".")
      .map((seg) => seg.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase())
      .join("-")
  );
}

// entries: [[dottedPath, resolvedCssValue], ...] -> a ":root { --x: ...; }" block.
export function renderRootVars(entries) {
  const lines = entries.map(([tokenPath, value]) => `  ${cssVarName(tokenPath)}: ${value};`);
  return `:root {\n${lines.join("\n")}\n}`;
}
