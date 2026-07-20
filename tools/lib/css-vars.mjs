// Shared "dotted token path -> CSS custom property" convention, so a color
// token always maps to the same --var-name everywhere it's used (button.html,
// counter.html, and any component page added later) instead of each build
// script picking its own naming and baking in literal resolved hex.
export function cssVarName(dottedPath) {
  return (
    "--" +
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
