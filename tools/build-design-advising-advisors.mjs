// Designs → Advising → Advisors.
// The page mockup (exports/page-mockups/advising-advisors.html — the handoff file
// with the page note + ui-next notes) is the source; this copies it into
// docs/designs/ as the "app" file and wraps it in the design viewer.
// Edit the mockup, then re-run this.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "exports/page-mockups/advising-advisors.html");

const viewerHtml = renderDesignViewer({
  activeKey: "advising-advisors",
  title: "Advisors",
  heading: "Advisors",
  sub: `Where a student finds an advisor to contact or book. Two tabs — <b>My Advisors</b> (assigned advisors, with their role) and <b>Advisor Search</b> (every advisor; search by name or ID, filter by one or more departments). Each row: Avatar, name, departments (one line, cut with …), phone and email links, and an <b>Actions</b> menu whose items — <b>Send message</b>, <b>New appointment</b> (old scheduling) and <b>Schedule with this advisor</b> (new Scheduling → Book) — are each checked per advisor. A table on a wide screen, cards on a phone or tablet. Every state is a button in the dark bar on top (mockup-only). This is a <b>page mockup for developers</b>: the file carries a page note and <code>ui-next</code> notes before each part — use Download to hand it over.`,
  versions: [{ label: "v1", note: "page mockup with ui-next notes", file: "advising-advisors-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.copyFileSync(src, path.join(root, "docs/designs/advising-advisors-app.html"));
fs.writeFileSync(path.join(root, "docs/designs/advising-advisors.html"), viewerHtml);
console.log("wrote docs/designs/advising-advisors-app.html, advising-advisors.html");
