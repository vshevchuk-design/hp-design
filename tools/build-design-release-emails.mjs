// Generates the release-notes emails (Designs → Release Emails):
//   docs/designs/release-email-<slug>-app.html — the email itself, as sent
//     (table layout, inline styles; see tools/lib/release-email.mjs for why).
//   docs/designs/release-email-<slug>.html     — viewer page (shared chrome
//     from tools/lib/design-viewer.mjs; Mobile = how a phone client shows it).
// One template, one data object per release (tools/lib/release-email-data.mjs).
// A short release (one section) skips "In this release"; a long one gets it.
// Run: node tools/build-design-release-emails.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDesignViewer } from "./lib/design-viewer.mjs";
import { renderReleaseEmail, renderReleaseEmailText } from "./lib/release-email.mjs";
import { SCHEDULE_BUILDER_26_3_0, DEGREE_AUDIT_WIZARD_1_3_7, TICKET_URL } from "./lib/release-email-data.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const ANATOMY = `<b>Anatomy</b>, top to bottom: the logo (a PNG — Gmail and Outlook drop SVG) and a "Release notes" eyebrow on the page background; one white Card holding the product + version Badges, the headline, who released it and when, the overview, Installation guide (Button primary) + Documentation (secondary), and any warning Alert that needs action before updating; <b>In this release</b> — one row per section with its tag Badge, a one-line summary and a count (only when there's more than one section; the summary hides on a phone); then each section — a 4px bar in its tag colour, the heading, an optional intro and info Alert, and every change as a title, its area and ticket numbers, and the text. Footer with the subscription line and preferences. <b>Built for email, not the web</b>: tables, inline resolved colours (no CSS variables — mail clients drop them), px line-heights on the 4px grid, Sora where the client loads web fonts and Segoe UI / Helvetica / Arial where it doesn't. <b>Email guidelines it's checked against</b>: 600px max width, one column, fluid on a phone (card goes edge to edge); tables + inline styles only; buttons are Button lg (48px — a tap target ≥44px) built as table cells so Outlook draws them; every text pair passes WCAG AA 4.5:1 (primary button rests on blue.600 — white on blue.500 is 4.0:1; footer and counts use text.secondary, not text.muted); body text ≥14px, ~75 characters a line; a hidden preheader for the inbox preview line; logo is a PNG with alt text styled to read as the wordmark with images off, and a white halo so dark-mode clients that invert the background don't swallow it; <code>role="article"</code> + <code>lang="en"</code> + real h1–h3 for screen readers; a plain-text part (<code>release-email-*.txt</code>) to send alongside; the build fails past 90KB (Gmail clips at 102KB — this one is ~45KB); a notification-preferences link in every footer.`;

const RELEASES = [
  {
    key: "release-email-schedule-builder",
    slug: "schedule-builder",
    label: "Schedule Builder 26.3.0",
    rel: SCHEDULE_BUILDER_26_3_0,
    sub: `The short shape: one section, so no "In this release" table — headline, overview, the two links and the one fix. Content is the 10/09/26 announcement, restructured. ${ANATOMY}`,
  },
  {
    key: "release-email-degree-audit-wizard",
    slug: "degree-audit-wizard",
    label: "Degree Audit Wizard 1.3.7",
    rel: DEGREE_AUDIT_WIZARD_1_3_7,
    sub: `The long shape: four sections (Performance, Enhancements, Analytics, Bug fixes) with an "In this release" table up top. The permission change (<code>HPT_DAW_WRITE</code>) was buried mid-email under Enhancements — it's now a warning Alert right under the links, since it's the one thing an admin must act on before updating; Analytics' "figures will move" note is an info Alert. Content is the 10/09/2026 announcement, restructured. ${ANATOMY}`,
  },
];

fs.mkdirSync(path.join(root, "docs/designs"), { recursive: true });
for (const r of RELEASES) {
  const appFile = `release-email-${r.slug}-app.html`;
  const html = renderReleaseEmail(r.rel, { assetBase: "../../assets", ticketUrl: TICKET_URL });
  // Gmail clips a message over 102KB behind "View entire message" — fail the
  // build well before that (the long Degree Audit Wizard mail is ~45KB).
  const kb = Buffer.byteLength(html) / 1024;
  if (kb > 90) throw new Error(`${appFile}: ${kb.toFixed(0)}KB — Gmail clips at 102KB; split the release or trim`);
  fs.writeFileSync(path.join(root, "docs/designs", appFile), html);
  fs.writeFileSync(path.join(root, "docs/designs", appFile.replace(/-app\.html$/, ".txt")), renderReleaseEmailText(r.rel, { ticketUrl: TICKET_URL }));
  const viewer = renderDesignViewer({
    activeKey: r.key,
    title: r.label,
    heading: `Release email — ${r.label}`,
    sub: r.sub,
    versions: [{ label: "v1", note: "current", file: appFile }],
  });
  fs.writeFileSync(path.join(root, "docs/designs", `${r.key}.html`), viewer);
  console.log(`wrote docs/designs/${appFile}`);
  console.log(`wrote docs/designs/${r.key}.html`);
}
