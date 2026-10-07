// Wraps every :hover rule of a stylesheet in `@media (hover: hover)`.
//
// On a touch screen the browser keeps an element in :hover after it is tapped,
// until something else is tapped — so a toggle Chip tapped off, or a sort
// button tapped twice to open and close its menu, stays painted in its hover
// fill and reads as still selected. Hover is a pointer affordance; devices
// without one shouldn't get it at all. Applied to the generated CSS as a
// whole rather than rule by rule, so no recipe can forget it.
//
// Brace-depth parser over top-level chunks: a plain rule with :hover in its
// selector is wrapped; @media / @supports blocks are recursed into (a nested
// @media inside a conditional group is valid CSS); everything else passes
// through untouched. Assumes no braces inside comments or strings — true of
// every generated stylesheet in this repo.

function chunks(css) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        out.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  out.push(css.slice(start)); // trailing whitespace / comments
  return out;
}

export function hoverGuard(css) {
  return chunks(css)
    .map((chunk) => {
      const open = chunk.indexOf("{");
      if (open === -1) return chunk;
      const head = chunk.slice(0, open);
      // the selector is whatever follows the last comment in the head
      const selector = head.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      if (/^@(media|supports)\b/.test(selector)) {
        const body = chunk.slice(open + 1, chunk.lastIndexOf("}"));
        return `${head}{${hoverGuard(body)}}`;
      }
      if (selector.startsWith("@") || !/:hover\b/.test(selector)) return chunk;
      const lead = head.slice(0, head.length - head.trimStart().length);
      return `${lead}@media (hover: hover) { ${chunk.trim()} }`;
    })
    .join("");
}
