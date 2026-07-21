# hp-design

Highpoint design system. DTCG-format JSON tokens (`tokens/`) are the source of truth; a generated static docs/storybook site (`docs/`) is the only consumer so far, deployed to Vercel from the repo root.

**Before doing anything else, read `logs/status.md`** — a maintained (not append-only) snapshot of exactly what's built, what conventions are locked in, and what's still open. `logs/decision-log.md` is the full append-only history underneath it (chronological, with the *why* behind each call) — read it when `status.md` isn't enough detail, not by default.

## Layering

`tokens/primitives/` → `tokens/semantic/` → `tokens/components/`. Never hardcode a color/dimension/font value anywhere below primitives — everything aliases via DTCG `{a.b.c}` refs.

## The component build pattern

Every component is: `tokens/components/X.tokens.json` + `tools/build-X-doc.mjs` → `docs/X.html`, wired into `tools/lib/nav.mjs` and `docs/index.html`. Run `node tools/build-X-doc.mjs` after any token edit (or loop over `tools/build-*.mjs` to rebuild everything — cheap, always do this before considering a change done).

Hard rules established over many rounds of fixing violations — see `logs/status.md` for the full list:
- All resolved colors become CSS custom properties prefixed `--tok-` (via `tools/lib/css-vars.mjs`) — never a literal hex in generated CSS. The prefix exists because a token var once collided with the docs chrome's own `--text-primary` and silently turned a whole page's text blue.
- The generated `<style>` block and the printed "copy this code" sample must be the exact same string — never hand-duplicate.
- When reusing another component's tokens (e.g. Tabs' counter reusing `counter.onNeutral`), resolve the real values from that token file — never retype a color-role name by hand. Caught real bugs from doing this wrong twice.
- Icon color needs its own explicit rule per state — don't rely on `currentColor` inheriting from the label unless you've checked they're actually the same token value.

## Verifying visually

The Browser preview tool is unreliable with `file://` URLs in this repo (treated as outside the sandbox's project root — stale snapshots, "no site open" errors). Workaround: `cd docs && python3 -m http.server 8743 &`, then preview `http://localhost:8743/X.html` instead. Kill the server when done.
