# Page mockups — standing instructions (Step 1 of the Page Mockup Guide)

Source: the "Page Mockup Guide" artifact (https://claude.ai/artifact/MbQK7cPYuBJ78MycM4zCcL), step 01 "Set up once".
Status: **testing** (2026-11-13; guide text replaced with the updated version 2026-11-18 — adds ITEMS, phone notes, KEY SETTINGS). Every page mockup made in this repo follows these rules without the user pasting them again.
The user drives steps 2–6 by pasting each step's prompt; don't run ahead of them.

The guide's text is kept verbatim below. The local addendum after it records what hp-design decided where the guide is wrong or vague — the addendum wins.

---

You make HTML mockups of HighPoint pages. Developers rebuild each mockup as a real page with the @highpoint/ui-next component library, using an AI agent that reads the notes you put in the HTML. Follow these rules for every mockup.

THE FILE
- One self-contained .html file. Plain HTML and CSS. Tailwind may be loaded from https://cdn.tailwindcss.com/3.4.17. Use JavaScript only to switch between states.
- Match the look of the HighPoint design pages, for example https://hp-design-brown.vercel.app/docs/designs/cx-dashboard.html: Sora font, white cards on a light grey page, navy primary colour #081E3F, 8px rounded corners. Don't invent new colours.
- Use realistic sample data: names, IDs, terms, dates, amounts. No placeholder text.
- Put a bar at the top with one button per state (Default, Loading, Empty, Error, and any others the page needs). Mark it with <!-- mockup-only: state switcher, do not build -->.
- The page must work at phone width (390px).

THE PAGE NOTE
At the top of the file, before anything else:
<!--
PAGE: page name
FOR: who uses it (student, advisor, staff role)
PURPOSE: one sentence
URL: what the page address keeps, such as the selected term or search text
DATA: each set of data the page shows, and where it comes from if known
ACTIONS: everything the user can do on the page
ITEMS: for parts filled from data (form questions, list rows, cards), one line per kind of item: its component, what it shows, its rules and its messages, written for any item, not just the sample ones
OPEN QUESTIONS: anything not decided yet, including anything you wrote "not designed here" or "unknown" for. Never write "none" while something is undecided.
-->

THE ELEMENT NOTES
Put notes directly before each meaningful part of the page. Use only the lines that apply:
<!-- ui-next: ComponentName | settings, such as tone="success" or as="h2" -->
<!-- data: what fills it -->
<!-- action: what happens when it is used: what is saved or sent, and what the user sees after -->
<!-- state: when this part appears -->
<!-- rule: when it is shown, hidden or disabled, and any validation -->
<!-- phone: what changes below 768px wide (stacks, goes full width, is hidden) -->
Use only component names from the list below. If nothing fits, write <!-- ui-next: none | needs a new component: description -->.
Use only the settings listed under KEY SETTINGS. For anything else, describe the look in words (for example "amber, light fill") and the developer picks the setting. Don't make up setting names.

UI-NEXT COMPONENTS
- Page layout: TopBar, Breadcrumbs, DetailHeader, Card, DashboardWidget, CollapsiblePanel, Accordion, Tabs, SegmentedTabs (switches between panels on this page; not for links to other pages), Toolbar, Separator
- Text: Text (all text; give the heading level, such as as="h1"), DefinitionList, LabelValue, Stat, HtmlContent
- Actions: Button, AnchorButton (a link that looks like a button), IconButton, SplitButton, DropdownMenu, InfoButton, Tooltip
- Forms: Field (the label, hint and error around one input), TextInput, TextArea, NumberField, SearchField, SelectField, MultiSelectCombobox, Checkbox, CheckboxRow, CheckboxGroup (one question answered with several checkboxes), RadioGroupField (one question answered with one choice), RadioRow, Switch, SwitchRow, DateField, DateTimeField, TimePicker, FilterChip, ChipSelect
- Lists and tables: Table, TreeTable, SortHeader, TablePaginationControl, PillList
- Status: StatusBadge, Badge, CountBadge (a number on a tab or button), Pill, Alert (a coloured box with an icon), InlineAlert (one line of text, red for an error, no box), Banner, Progress, Stepper
- Windows: DialogWindow, ConfirmDialog, Sheet (side panel), Popover, toast (short message after an action; the app places it at the top centre, so don't describe its position)
- Page states: LoadingState (a spinner and a label; nothing goes inside it), SkeletonLine (grey placeholder lines; use them on their own for a skeleton), EmptyState, ErrorState (title, message and its own "Try again" button)
- Calendars: WeekSchedule, DayCalendar, Calendar
All components with examples: https://shared-ui-ee9e2e.pages.highpoint.io/storybook/?path=/story/ui-next-gallery--gallery

KEY SETTINGS
- Button, AnchorButton, IconButton: variant="primary | secondary | tint | outline | ghost | danger | link", size="sm | base | lg". An IconButton needs aria-label.
- Text: as="h1"…"h6" or "p".
- Alert: tone="info | success | warning | danger", title, detail (a smaller second line).
- InlineAlert: tone="error | status".
- Badge: tone="neutral | primary | success | warning | danger" or a colour (blue, amber, green, red, violet, teal…), appearance="tint | solid | outline", size="sm | base | lg".
- RadioGroupField: label, hint, error, required (draws the red *), optional (adds "(optional)").
- CheckboxGroup: label, hint, error, optional. It has no required mark: if a checkbox question can be required, say so in a rule note and add it to OPEN QUESTIONS.
- Field: label, hint, error, required, optional.
- ErrorState: title, message, onRetry (what "Try again" does).
- LoadingState: label.
- toast: variant="default | success | destructive", title, description.

RULES
- Anything that goes to another page is a link or an AnchorButton. Buttons only do things on this page.
- Every input has a visible label.
- One main heading per page; headings go in order.
- When parts are filled from data, the notes and messages must work for every item, not just the sample. For example, write "Enter your answer." rather than "Enter the other topic.", and give the error text for each kind of question (a choice question and a text question need different text).
- Developers don't copy your CSS. Anything that changes at phone width needs a phone note.
- For anything that saves automatically, say when it saves (on each change, after typing stops, when leaving the field) and what happens if the user submits or leaves the page while it is still saving.
- Write each message text once, in the note on the part that shows it. In the PAGE note, refer to the part instead of copying the text.
- Ask me when something is unclear instead of guessing, and add it to OPEN QUESTIONS.

---

## Local addendum (hp-design, wins over the text above)

- **Primary colour is NOT #081E3F.** That colour exists nowhere in hp-design. Use the DS: `fill.primary` = blue.500 **#077fec** (button fills, active tab, current page), `text.primary` / `border.focus` / hover = blue.600 **#0468c4**.
- **Copy the look from the real design page, not from memory.** Before styling a part, take its values (search, Select sm, table header, pagination, Counter, tabs, Badge, buttons, icons) from the matching hp-design design page (`docs/designs/*-app.html`, rendered) — hand-drawn lookalikes were rejected on the first try (wrong search icon, native `<select>`, grey table header).
- **Icons:** the DS's Material icon paths, not hand-drawn ones.
- **"Before anything else" vs publishing:** the page note sits right after `<head><meta charset>`. The artifact service wraps every page in its own skeleton anyway, so position doesn't affect rendering.
- **Ask before starting** (step 2 says so): don't fill gaps silently and park them in OPEN QUESTIONS — ask the user first, then record what's still unknown.
- Files live in `exports/page-mockups/<page>.html`.
- **Search fields get no visible label** (exception to "Every input has a visible label", user decision 2026-11-13): SearchField shows only the search icon + placeholder, as on the design pages; keep a screen-reader-only label and write a `rule:` note saying the missing label is on purpose. Every other input still gets a visible label.
- **EmptyState = the DS compact pill** (user decision 2026-11-13): one short line of text, `text.secondary` on `bg.neutral` #e6e8eb, radius full, padding 8px 16px, centred with 24px around it — as on the Message Center design pages ("No threads found"). No icon, no heading, no explanatory sentence.
- **Phone notes use the guide's 768px** (2026-11-18): table at 768px and wider; tablet cards 560–767px; phone cards below 560px (widths of the content area). Describe both tablet and phone in `phone:` notes.
- **Toast:** the app places it (top centre); don't describe its position. The mockup shows it top centre too.
- **Toolbar filters with a telling placeholder get no visible label** (user decision 2026-11-19, Advisors): a SelectField filter whose placeholder names what it filters ("All departments") has no visible label, like a search field — keep an accessible label and a `rule:` note.
- **Page layout like the design pages, not one big card** (user, 2026-11-19): tabs are SegmentedTabs on the page; search and filters sit on the same row as the tabs (right side on desktop, stacked under them on a phone); no separate count heading; the Card holds only the table; under the card the TablePaginationControl as ui-next draws it — "Rows per page" select on the left, "1–10 of 49" + page buttons on the right (user corrected 2026-11-19: never drop rows per page).
- **Sorted column header** looks as in the DS Table: header text stays grey; only the arrow changes (light grey → dark grey icon.default). Never black text or a blue arrow.

