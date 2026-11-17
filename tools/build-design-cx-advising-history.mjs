// Designs → Advising → History.
// The page mockup (exports/page-mockups/advising-history.html — the handoff file
// with the page note + ui-next notes) is the source; this copies it into
// docs/designs/ as the "app" file and wraps it in the design viewer.
// Edit the mockup, then re-run this.
// The earlier History prototypes (v1–v4: table text 12 vs 14px, cards, table + cards)
// were removed on 2026-11-17 when the mockup replaced them — they're in git history.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "exports/page-mockups/advising-history.html");

const viewerHtml = renderDesignViewer({
  activeKey: "cx-advising-history",
  title: "History",
  heading: "History",
  sub: `The student's advising history: what their advisors recorded about them. Three collapsible sections — <b>Notes</b> (search, category Badge, author with Avatar), <b>Action Items</b> (read only, the comment in full) and <b>Appointments</b> (Summaries / No Shows / Cancellations tabs with counts) — each with rows per page and pagination. A table on a wide screen, cards on a phone or tablet. <b>View</b> (or tapping a card) opens the note or appointment in a side Sheet: the full text, then the advisor, department and date under it. Empty lists show a short grey pill. Every state is a button in the dark bar on top (mockup-only). This is a <b>page mockup for developers</b>: the file carries a page note and <code>ui-next</code> notes before each part — use Download to hand it over.`,
  versions: [{ label: "v1", note: "page mockup with ui-next notes", file: "cx-advising-history-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.copyFileSync(src, path.join(root, "docs/designs/cx-advising-history-app.html"));
fs.writeFileSync(path.join(root, "docs/designs/cx-advising-history.html"), viewerHtml);
console.log("wrote docs/designs/cx-advising-history-app.html, cx-advising-history.html");
