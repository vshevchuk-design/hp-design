# Page mockups — standing instructions (Step 1 of the Page Mockup Guide)

Source: the "Page Mockup Guide" artifact (https://claude.ai/artifact/MbQK7cPYuBJ78MycM4zCcL), step 01 "Set up once".
Status: **testing** (2026-11-13). Every page mockup made in this repo follows these rules without the user pasting them again.
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
OPEN QUESTIONS: anything not decided yet
-->

THE ELEMENT NOTES
Put notes directly before each meaningful part of the page. Use only the lines that apply:
<!-- ui-next: ComponentName | settings, such as variant="secondary" or as="h2" -->
<!-- data: what fills it -->
<!-- action: what happens when it is used: what is saved or sent, and what the user sees after -->
<!-- state: when this part appears -->
<!-- rule: when it is shown, hidden or disabled, and any validation -->
Use only component names from the list below. If nothing fits, write <!-- ui-next: none | needs a new component: description -->.

UI-NEXT COMPONENTS
- Page layout: TopBar, Breadcrumbs, DetailHeader, Card, DashboardWidget, CollapsiblePanel, Accordion, Tabs, SegmentedTabs, Toolbar, Separator
- Text: Text (all text; give the heading level, such as as="h1"), DefinitionList, LabelValue, Stat, HtmlContent
- Actions: Button (variant primary, secondary, outline, ghost or danger), AnchorButton (a link that looks like a button), IconButton, SplitButton, DropdownMenu, InfoButton, Tooltip
- Forms: Field (the label, hint and error around one input), TextInput, TextArea, NumberField, SearchField, SelectField, MultiSelectCombobox, Checkbox, CheckboxRow, RadioGroupField, Switch, SwitchRow, DateField, DateTimeField, TimePicker, FilterChip, ChipSelect
- Lists and tables: Table, TreeTable, SortHeader, TablePaginationControl, PillList
- Status: StatusBadge, Badge, CountBadge, Pill, InlineAlert, Banner, Alert, Progress, Stepper
- Windows: DialogWindow, ConfirmDialog, Sheet (side panel), Popover, toast (short message after an action)
- Page states: LoadingState, EmptyState, ErrorState, SkeletonLine
- Calendars: WeekSchedule, DayCalendar, Calendar
All components with examples: https://shared-ui-ee9e2e.pages.highpoint.io/storybook/?path=/story/ui-next-gallery--gallery

RULES
- Anything that goes to another page is a link or an AnchorButton. Buttons only do things on this page.
- Every input has a visible label.
- One main heading per page; headings go in order.
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
