**Mockup ready: History (student)**

The HTML mockup is attached: `advising-history.html`. It is also online, with a Download button: https://hp-design-brown.vercel.app/designs/cx-advising-history.html

The file has a PAGE note at the top, and a note before each part. The notes say which ui-next component to use, what data fills it, what each action does and what the user sees on failure, and how it changes on phone and tablet. The dark bar at the top switches between the states. It is mockup-only, so don't build it.

**States to check first**
- **Record open** — the note / appointment side panel (Sheet). This is where most of the design changes are.
- **Long note / Long summary** — the text scrolls under the Details. Details and the footer stay pinned, and the page behind doesn't scroll.
- **No Shows tab → the Education Plan without text** — an appointment with no note shows one grey line instead of an empty section.
- **Record without actions** — an appointment where both footer buttons are hidden, so there is no footer.
- **Many rows** — 50+ items in every list and tab, with long names, departments and reasons.
- **Phone (390px) and tablet (560–767px)** — cards instead of tables. Tablet cards have a date column on the left. Resize the window to see them.
- **Loading, Empty, No search results, Error loading, Record loading, Record error, Record not found, Download failed.**

**Design changes compared with the current build**
1. **Record panel (Sheet), redone.**
   - Header: a bold title, then a Badge. For a note it is the category. For an appointment it is the status — Completed (green), No show or Cancelled (grey) — followed by the department. No date and no link in the header.
   - Body: a text section ("Note", "Summary" or "Cancellation reason"). Then "Attachments", using the compact DS Attachment at most 320px wide, not stretched. Appointments also get "Reason for visit".
   - "Details" is a DefinitionList pinned above the footer. A row with no value is hidden, never shown as "—".
2. **Footer buttons.**
   - "Send Message" → **"Message advisor"**: primary, and its accessible name is "Message <full name>".
   - "Copy Link" → **"Copy note link"**: notes only. Appointments have no copy link.
3. **"Book again" (designer's proposal).** On appointments, it opens Scheduling with the same type and department already picked, as on the Scheduling past-appointment page. It is hidden when that type can't be booked any more.
4. **Appointments table.**
   - The Department column is removed. The appointment's department is a grey line under the department member.
   - "Created by" → **"Booked by"**. It shows "You", with the student's own avatar, when the student booked it.
   - The record panel shows both With and Booked by.
5. **Sorting** on every table column except Action Items → Comment. Default is newest first. Phone cards can't be re-sorted.
6. **Avatars everywhere.** That includes the department member, which currently has an icon, and the phone/tablet cards. Use the person's photo, or initials when there is none.
7. **Type.** Row titles are 14px semibold, and dates, departments and secondary text are grey. The current build has everything at one weight, which makes rows hard to scan.
8. **Long text.** A note subject is cut after 2 lines with "…". A department is cut to 1 line, with the full name in a Tooltip.
9. **Empty states** are the DS compact grey pill, for example "No notes yet" or "No missed appointments".
10. **The Notes search** has no visible label. This is an agreed exception, and the label is kept for screen readers. The field is disabled while the notes load.

**Open questions already answered**
- **Separate page or a panel?** Open the note / appointment in a side panel (Sheet) on this page.
- **Can action items be opened?** No. They are read only, and the comment is shown in full in the list.
- **Is the collapsed / expanded state of a section remembered?** No. All sections are open on every visit.
- **Show both "With" and "Booked by" on an appointment?** Yes, both, even when they are the same person.
- **Avatar and Attachment.** They aren't in the guide's ui-next list. Use the ones already on the live History page.
- **Book again.** Keep it, as a designer's proposal.

**Still open — for the developers** (the details are in the PAGE note)
1. Does ui-next Table have a stacked layout for phone width? If not, which component should the cards be?
2. What does Notes search match: subject, category, author, the note text?
3. When is "Message advisor" hidden? Which advisors can't be messaged? Should the button be hidden, or disabled with a reason?
4. Data sources for notes, action items, appointments, people's photos, and the two flags ("advisor can receive messages", "type can still be booked").
5. Confirm the exact ui-next names and props of Avatar and Attachment.
6. Can ErrorState be shown without "Try again" (for "Record not found")? If not, show the same text without ErrorState.

**Next step**
Build the page with your AI agent, following the Frontend Next Guide. The developer prompt is in section 06 of the Page Mockup Guide.
