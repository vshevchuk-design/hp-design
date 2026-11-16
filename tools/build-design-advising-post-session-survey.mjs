// Designs → Advising → Post-session Survey.
// The page mockup (exports/page-mockups/advising-post-session-survey.html — the
// handoff file with the page note + ui-next notes) is the source; this copies it
// into docs/designs/ as the "app" file and wraps it in the design viewer.
// Edit the mockup, then re-run this.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "exports/page-mockups/advising-post-session-survey.html");

const viewerHtml = renderDesignViewer({
  activeKey: "advising-post-session-survey",
  title: "Post-session Survey",
  heading: "Post-session Survey",
  sub: `The page a student opens from the survey email after an advising appointment: <b>Back to My schedule</b>, the survey's title and description, the appointment it's about (advisor, department, type, date), and the questions — single choice (RadioGroup), multiple choice (Checkbox, "Other" opens a text field), a short answer (TextInput) and a long one (TextArea). Required questions carry a red * and an amber Badge counts the ones left ("3 required left"); Submit with gaps shows each question's error. After Submit the same page shows the <b>Completed</b> view — a success Alert with the date and the student's answers, read only — and a toast. Opening a survey whose deadline passed shows <b>Closed</b>; a cancelled appointment shows <b>Unavailable</b> — an info Alert, no form. Every state is a button in the dark bar on top (mockup-only). This is a <b>page mockup for developers</b>: the file carries a page note and <code>ui-next</code> notes before each part — use Download to hand it over.`,
  versions: [{ label: "v1", note: "page mockup with ui-next notes", file: "advising-post-session-survey-app.html" }],
});

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
fs.copyFileSync(src, path.join(root, "docs/designs/advising-post-session-survey-app.html"));
fs.writeFileSync(path.join(root, "docs/designs/advising-post-session-survey.html"), viewerHtml);
console.log("wrote docs/designs/advising-post-session-survey-app.html, advising-post-session-survey.html");
