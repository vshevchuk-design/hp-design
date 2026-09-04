// Generates docs/logs.html — a blog-style changelog for the design system,
// sitting in the DS nav under Overview. Each post: a date, a type tag
// (New / Updated / Fixed / Prototype), a title, a short plain-English note on
// what changed, and link chips to the component/prototype pages it touched.
//
// TO ADD A POST: prepend an object to POSTS below (newest first). Fields:
//   date  "YYYY-MM-DD"
//   type  "new" | "updated" | "fixed" | "prototype"
//   title short headline
//   body  one or two sentences on what changed and why
//   links [{ label, href }]  pages to see it — component docs or prototypes
// Then run: node tools/build-logs-doc.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNav } from "./lib/nav.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// ---- the changelog, newest first ----
const POSTS = [
  {
    date: "2026-09-04",
    type: "prototype",
    title: "Staff Message Center → email-inbox console (Phase B)",
    body: "The staff prototype's split-pane chat is reworked into an email-inbox threads console: a persistent topbar (mail + department + a SplitButton \"New Message ▾\" + user avatar), and the thread list is now a full-width Table (Student / Subject & Message / Responsible / Expiration / Date), unread rows bold. Opening a thread is a full-page detail that keeps the topbar (Gmail-style). \"Responsible\" replaces the old Handled-by/Unassigned. Built on the new Table + SplitButton components; the compose dialog + AI panel + rich composer carry over. Next: the Group Message wizard, group fan-out, mobile row reflow, read receipts, and finer role logic.",
    links: [
      { label: "Staff Message Center", href: "designs/staff-message-center.html" },
      { label: "Table", href: "table.html" },
      { label: "SplitButton", href: "split-button.html" },
    ],
  },
  {
    date: "2026-09-04",
    type: "new",
    title: "Seven new components for the Message Center v3 redesign",
    body: "Foundation for the email-inbox rework: Table (the threads console — a div-grid with unread/read rows, sortable headers, selectable rows), AvatarGroup (overlapping stack + \"+N\"), Stepper (the group-message wizard 1→2), DatePicker (Select-style trigger + calendar popover, for message expiration), SplitButton (\"New Message ▾\" → opens a Menu), Stat (delivery-metric tiles), and Skeleton (loading placeholders). Built strictly on the existing tokens; the console rework consumes them next.",
    links: [
      { label: "Table", href: "table.html" },
      { label: "AvatarGroup", href: "avatar-group.html" },
      { label: "Stepper", href: "stepper.html" },
      { label: "DatePicker", href: "date-picker.html" },
      { label: "SplitButton", href: "split-button.html" },
      { label: "Stat", href: "stat.html" },
      { label: "Skeleton", href: "skeleton.html" },
    ],
  },
  {
    date: "2026-09-03",
    type: "new",
    title: "Chip gains an action variant",
    body: "A third kind alongside toggle and removable: an assist/suggestion chip — a real button that fires an action and returns to rest, no persistent state, with a trailing arrow. Chip's radius was already full, so it's a pill for free.",
    links: [{ label: "Chip", href: "chip.html" }],
  },
  {
    date: "2026-09-03",
    type: "prototype",
    title: "Staff Message Center: New Message + AI Writing Assist",
    body: "The staff inbox gets the student side's New-message entry point (mobile FAB / desktop topbar button) and a compose dialog — Department, Subject, a rich message editor, and Allow Replies + Expire Thread checkboxes. Beside it an AI Writing Assist panel (suggestion chips, a real chat, tone/length) that opens from compose and from the in-thread AI Assist button. On send it creates a real Inbox thread.",
    links: [
      { label: "Staff Message Center", href: "designs/staff-message-center.html" },
      { label: "Chip", href: "chip.html" },
      { label: "Checkbox", href: "checkbox.html" },
    ],
  },
  {
    date: "2026-08-06",
    type: "prototype",
    title: "Staff Message Center prototype",
    body: "The other side of the student app — the department inbox where staff answer incoming student threads. Rows lead with the student and carry Handled by / Unassigned / Awaiting reply / due-date states; Resolve really moves a thread to the Resolved tab; the reply composer is Composer's rich variant.",
    links: [{ label: "Staff Message Center", href: "designs/staff-message-center.html" }],
  },
  {
    date: "2026-08-03",
    type: "updated",
    title: "Attachment: a compact pre-send density",
    body: "Pre-send files in the composers now render as compact chips in one scrollable row (the Gmail-chip convention), while a sent message keeps the full done row inside the bubble.",
    links: [{ label: "Attachment", href: "attachment.html" }],
  },
  {
    date: "2026-07-31",
    type: "prototype",
    title: "Compose dialog for the Student Message Center",
    body: "A responsive New-message flow — a full-screen bottom sheet on mobile, a centered modal from 768px — with recipient policies (department only / members only / both) and a real thread created on Send.",
    links: [{ label: "Student Message Center", href: "designs/student-message-center.html" }],
  },
  {
    date: "2026-07-24",
    type: "prototype",
    title: "Designs explorer + Student Message Center",
    body: "The sidebar gains DS / Designs tabs; Designs is a prototype explorer with the first interactive product — the live student-facing Message Center, built strictly from design-system components.",
    links: [{ label: "Student Message Center", href: "designs/student-message-center.html" }],
  },
  {
    date: "2026-07-24",
    type: "new",
    title: "EmptyState and Toast",
    body: "Two small pieces the Message Center needed: EmptyState (a text-only placeholder pill for an empty area) and Toast (transient self-dismissing feedback, first consumer of the status roles).",
    links: [
      { label: "EmptyState", href: "empty-state.html" },
      { label: "Toast", href: "toast.html" },
    ],
  },
  {
    date: "2026-07-24",
    type: "updated",
    title: "ThreadListItem: full-bleed inbox redesign",
    body: "Collapsed to a single inbox-row shape with a required unread/read state pair, flat divider-separated rows, and a real per-row flag toggle. The old card/metadata shape was removed.",
    links: [{ label: "ThreadListItem", href: "thread-list-item.html" }],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Message / Bubble / Attachment family + Composer",
    body: "The messaging family landed as seven pieces — Badge, Chip, Attachment, Message, Bubble, ThreadListItem, Composer. The rich-vs-simple split is by content type, not sender: institution announcements are a rich Message, any short reply is a plain Bubble.",
    links: [
      { label: "Badge", href: "badge.html" },
      { label: "Chip", href: "chip.html" },
      { label: "Attachment", href: "attachment.html" },
      { label: "Message", href: "message.html" },
      { label: "Bubble", href: "bubble.html" },
      { label: "ThreadListItem", href: "thread-list-item.html" },
      { label: "Composer", href: "composer.html" },
    ],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Avatar",
    body: "A photo → initials → generic-icon fallback chain, sm/base/lg on the shared control-height grid, with a deterministic per-name fallback color from a new avatar palette.",
    links: [{ label: "Avatar", href: "avatar.html" }],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Overlay family: Tooltip, Popover, Drawer, Modal",
    body: "Built simplest to most complex, all native — Tooltip is pure CSS, the rest use the Popover API or dialog + showModal(). Focus-trap, Escape, outside-dismiss and top-layer stacking come from the browser. First use of the shadow tokens and surface.inverse.",
    links: [
      { label: "Tooltip", href: "tooltip.html" },
      { label: "Popover", href: "popover.html" },
      { label: "Drawer", href: "drawer.html" },
      { label: "Modal", href: "modal.html" },
    ],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Menu & Listbox (+ AlertDialog)",
    body: "The dropdown family on Popover's shell — Menu for one-shot actions, Listbox for selectable options (deliberately split by ARIA role). AlertDialog is a zero-new-token behavioral variant of Modal.",
    links: [
      { label: "Menu", href: "menu.html" },
      { label: "Listbox", href: "listbox.html" },
      { label: "Modal", href: "modal.html" },
    ],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Layout primitives: Box, Card, Grid",
    body: "Container and spacing-scale-only components — Box exposes surface/border/padding directly, Card is one opinionated content-grouping composition, Grid is display:grid + a gap scale.",
    links: [
      { label: "Box", href: "box.html" },
      { label: "Card", href: "card.html" },
      { label: "Grid", href: "grid.html" },
    ],
  },
  {
    date: "2026-07-22",
    type: "new",
    title: "Selection controls: Checkbox, Radio, Switch",
    body: "All three share the native-input-under-a-painted-visual pattern and the same fill.primary hover/checked language.",
    links: [
      { label: "Checkbox", href: "checkbox.html" },
      { label: "Radio", href: "radio.html" },
      { label: "Switch", href: "switch.html" },
    ],
  },
  {
    date: "2026-07-22",
    type: "updated",
    title: "Focus ring strengthened system-wide",
    body: "border.focus moved to blue.600 and the ring width to 4px, so keyboard focus reads as unambiguously the strongest state now that hover/pressed use fill.primary. Affects every component with a focus ring.",
    links: [{ label: "Semantic colors", href: "semantic-colors.html" }],
  },
  {
    date: "2026-07-21",
    type: "new",
    title: "Form fields and structure",
    body: "Input, Select, Search, Tabs, Pagination and Separator — the fill+border form-field convention gets locked in, and the shared BEM block + build-time size assertion pattern takes shape.",
    links: [
      { label: "Input", href: "input.html" },
      { label: "Select", href: "select.html" },
      { label: "Search", href: "search.html" },
      { label: "Tabs", href: "tabs.html" },
      { label: "Pagination", href: "pagination.html" },
      { label: "Separator", href: "separator.html" },
    ],
  },
  {
    date: "2026-07-20",
    type: "new",
    title: "Button & Counter — the first components",
    body: "The component layer opens, built strictly on the semantic tokens — three Button variants sharing one size grid, and Counter tuned to sit on a Button fill. Every doc page prints the exact generated CSS it renders.",
    links: [
      { label: "Button", href: "button.html" },
      { label: "Counter", href: "counter.html" },
    ],
  },
  {
    date: "2026-07-20",
    type: "new",
    title: "Foundations: Colors, Typography, Layout, Icons",
    body: "The token source of truth — OKLCH-anchored color ramps, semantic color roles, the Sora type scale, dimension/radius/z-index, and 136 Material icons — plus the storybook docs site itself.",
    links: [
      { label: "Colors", href: "colors.html" },
      { label: "Semantic colors", href: "semantic-colors.html" },
      { label: "Typography", href: "typography.html" },
      { label: "Layout", href: "layout.html" },
      { label: "Icons", href: "icons.html" },
    ],
  },
];

const TYPES = {
  new: { label: "New" },
  updated: { label: "Updated" },
  fixed: { label: "Fixed" },
  prototype: { label: "Prototype" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// group consecutive posts by date so a busy day reads as one dated block
const groups = [];
for (const post of POSTS) {
  const last = groups[groups.length - 1];
  if (last && last.date === post.date) last.posts.push(post);
  else groups.push({ date: post.date, posts: [post] });
}

function postCard(post) {
  const t = TYPES[post.type] || TYPES.updated;
  const links = post.links
    .map((l) => `<a class="log-link" href="${l.href}">${esc(l.label)}</a>`)
    .join("");
  return `<article class="log-post">
        <div class="log-post__head">
          <span class="log-tag log-tag--${post.type}">${t.label}</span>
          <h3 class="log-post__title">${esc(post.title)}</h3>
        </div>
        <p class="log-post__body">${esc(post.body)}</p>
        ${links ? `<div class="log-post__links">${links}</div>` : ""}
      </article>`;
}

const groupsHtml = groups
  .map(
    (g) => `<section class="log-group">
      <div class="log-group__date"><time datetime="${g.date}">${formatDate(g.date)}</time></div>
      <div class="log-group__posts">
        ${g.posts.map(postCard).join("\n        ")}
      </div>
    </section>`
  )
  .join("\n    ");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>hp-design — Logs</title>
<link rel="stylesheet" href="../assets/fonts/sora/sora.css" />
<style>
  :root {
    --bg-page: #f7f7f5; --bg-card: #ffffff; --bg-card-hover: #fbfbfa;
    --border: #e4e3df; --border-strong: #d2d1cb;
    --text-primary: #0e0e10; --text-secondary: #63625c; --text-muted: #918f87;
    --accent: #0468c4; --accent-bg: #eff6ff;
    --code-bg: #1e1e22; --code-text: #e4e3df;
    --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: -apple-system, "Segoe UI", system-ui, sans-serif;
    --tag-new-bg: #e7f6ed; --tag-new-fg: #1a7a44;
    --tag-updated-bg: #eff6ff; --tag-updated-fg: #0468c4;
    --tag-fixed-bg: #fdf3e3; --tag-fixed-fg: #96591a;
    --tag-prototype-bg: #f2ecfd; --tag-prototype-fg: #6d3fc4;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) {
      --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
      --border: #313035; --border-strong: #403f45;
      --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
      --accent: #5aa4ec; --accent-bg: #16283b;
      --code-bg: #0d0d0f; --code-text: #d7d6d2;
      --tag-new-bg: #123020; --tag-new-fg: #5cc98c;
      --tag-updated-bg: #16283b; --tag-updated-fg: #5aa4ec;
      --tag-fixed-bg: #33260f; --tag-fixed-fg: #d9a75a;
      --tag-prototype-bg: #251b3b; --tag-prototype-fg: #a98ae6;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg-page: #17171a; --bg-card: #1e1e22; --bg-card-hover: #232327;
    --border: #313035; --border-strong: #403f45;
    --text-primary: #f2f1ee; --text-secondary: #a7a5a0; --text-muted: #706e68;
    --accent: #5aa4ec; --accent-bg: #16283b;
    --code-bg: #0d0d0f; --code-text: #d7d6d2;
    --tag-new-bg: #123020; --tag-new-fg: #5cc98c;
    --tag-updated-bg: #16283b; --tag-updated-fg: #5aa4ec;
    --tag-fixed-bg: #33260f; --tag-fixed-fg: #d9a75a;
    --tag-prototype-bg: #251b3b; --tag-prototype-fg: #a98ae6;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-page); color: var(--text-primary); font-family: var(--sans); }
  .shell { display: flex; min-height: 100vh; }
  nav.side { width: 220px; flex-shrink: 0; border-right: 0.5px solid var(--border); padding: 1.5rem 1rem; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
  .navlink { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 13px; text-decoration: none; color: var(--text-primary); margin-bottom: 1px; }
  .navlink:hover { background: var(--bg-card-hover); }
  .navlink.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
  .nav-category { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 16px 8px 6px; }
  main { flex: 1; padding: 3rem 3rem 5rem; max-width: 900px; }

  h1 { font-size: 36px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.02em; font-family: var(--sans); }
  .sub { font-size: 14px; color: var(--text-secondary); margin: 0 0 3rem; max-width: 70ch; line-height: 1.6; }

  /* changelog: a date column on the left, post cards on the right */
  .log-group { display: grid; grid-template-columns: 120px 1fr; gap: 24px; padding-bottom: 2.5rem; }
  .log-group__date { position: sticky; top: 1.5rem; align-self: start; }
  .log-group__date time { font-size: 13px; font-weight: 600; color: var(--text-muted); font-family: var(--mono); }
  .log-group__posts { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .log-post { border: 0.5px solid var(--border); border-radius: 14px; background: var(--bg-card); padding: 20px 22px; }
  .log-post__head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
  .log-post__title { font-size: 16px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
  .log-post__body { font-size: 13.5px; color: var(--text-secondary); margin: 0; line-height: 1.65; }
  .log-post__links { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .log-link { font-size: 12px; text-decoration: none; color: var(--accent); background: var(--accent-bg); border-radius: 999px; padding: 4px 11px; white-space: nowrap; }
  .log-link:hover { text-decoration: underline; }
  .log-tag { flex-shrink: 0; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; padding: 3px 9px; }
  .log-tag--new { background: var(--tag-new-bg); color: var(--tag-new-fg); }
  .log-tag--updated { background: var(--tag-updated-bg); color: var(--tag-updated-fg); }
  .log-tag--fixed { background: var(--tag-fixed-bg); color: var(--tag-fixed-fg); }
  .log-tag--prototype { background: var(--tag-prototype-bg); color: var(--tag-prototype-fg); }

  @media (max-width: 680px) {
    .log-group { grid-template-columns: 1fr; gap: 10px; }
    .log-group__date { position: static; }
  }
</style>
</head>
<body>
<div class="shell">
  <nav class="side">
    ${renderNav("logs")}
  </nav>
  <main>
    <h1>Logs</h1>
    <p class="sub">Changelog for the design system — what changed, when, and where to see it. Each entry links to the component or prototype pages it touched. Newest first.</p>

    ${groupsHtml}
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "docs/logs.html"), html);
console.log("wrote docs/logs.html");
