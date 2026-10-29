// Content for the release-notes email templates (Designs → Release Emails).
// Both releases are the real 10/09/2026 announcements, carried over item for
// item — only the structure changed. Inline markup in any body string:
// **bold** (a UI name the reader will look for) and `code` (a permission or a
// stored value). Ticket hrefs are placeholders until the tracker URL is known.
//
// Shape (what renderReleaseEmail() reads):
//   product, version, posted, author, headline, preheader, overview
//   links:    [{ label, href, primary? }]            — at most two, top of the email
//   notices:  [{ role: info|warning, lead, body }]   — above the sections; "Action needed" lives here
//   sections: [{ id, title, tag, blurb, intro?, notice?, groups: [{ title?, items: [{ title, tickets, body: [] }] }] }]
//   tag = a tag.* hue for the section's Badge; blurb = its one line in "In this release"

export const TICKET_URL = (id) => `https://support.highpoint.io/#ticket-${id}`;

export const SCHEDULE_BUILDER_26_3_0 = {
  product: "Schedule Builder",
  version: "26.3.0",
  posted: "Oct 9, 2026",
  author: "Jourdy Thro",
  headline: "Schedule Builder 26.3.0 is available",
  preheader: "PUM 39 compatibility, and the AI Assistant builds schedules for courses with open sections again.",
  overview:
    "This release delivers PUM 39 compatibility for Schedule Builder and resolves an issue that prevented the AI Assistant from building schedules for courses that had open sections.",
  links: [
    { label: "Installation guide", href: "https://support.highpoint.io/", primary: true },
    { label: "Documentation", href: "https://support.highpoint.io/" },
  ],
  notices: [],
  sections: [
    {
      id: "bug-fixes",
      title: "Bug fixes",
      tag: "gray",
      blurb: "The AI Assistant finds courses with open sections",
      groups: [
        {
          items: [
            {
              title: "Building schedules from the AI Assistant",
              area: "Chat Assistant",
              tickets: ["44379"],
              body: [
                "Resolved an issue where the AI Assistant reported courses as not found when asked to build schedules, even though the same courses had open sections in class search. The subject lookup also reported zero available classes for those courses.",
                "The assistant now matches catalog numbers independently of how they are stored, selects the course offering that has active classes in the requested term, and correctly reads subjects that contain a space, such as `POL SCI 1`. Subject lookups no longer report an available-class count that was never populated.",
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const DEGREE_AUDIT_WIZARD_1_3_7 = {
  product: "Degree Audit Wizard",
  version: "1.3.7",
  posted: "Oct 9, 2026",
  author: "Jourdy Thro",
  headline: "Degree Audit Wizard 1.3.7 is available",
  preheader: "Mostly about speed — plus one permission change to review before you update.",
  overview:
    "Degree Audit Wizard 1.3.7 is mostly about speed. Opening an audit, filtering the Audits list, saving a requirement, publishing, and running Preview Audit all do noticeably less work than before, and the difference shows most on large audits and at institutions with many of them. Elsewhere, adding a requirement line now starts where you would expect it to, the Retention Rate and Time to Degree reports define their cohorts and benchmarks more precisely, and a run of fixes clears up audits that went missing from the list, course share sets that lost rows, and dialogs that took keyboard focus away mid-word.",
  links: [
    { label: "Installation guide", href: "https://support.highpoint.io/", primary: true },
    { label: "Documentation", href: "https://support.highpoint.io/" },
  ],
  notices: [
    {
      role: "warning",
      lead: "Review before you update.",
      body: "Publishing an audit now requires `HPT_DAW_WRITE`. Anyone who holds only `HPT_DAW_READ` can no longer publish. Users with the **Highpoint DAW Full Access** role are unaffected.",
      href: "#enhancements",
      linkLabel: "See the change",
    },
  ],
  sections: [
    {
      id: "performance",
      title: "Performance",
      tag: "teal",
      blurb: "Audits, lists and publishing wait less",
      intro:
        "A broad performance pass runs through this release. Nothing changes about what you see — the same audits, the same share sets, the same figures — only how long you wait for them. Thanks to the University of Maryland Global Campus for partnering with us on this work.",
      groups: [
        {
          items: [
            {
              title: "Opening an audit and the Audits list",
              tickets: ["44555", "44557", "44559", "44562"],
              body: [
                "Opening an audit from the Audits list loaded the audit's data twice. It now loads once, and large audits open noticeably faster.",
                "The Audits list loads faster at institutions that have **Hide Audits Without Active Requirement Groups** turned on, and filtering the list by plan or sub-plan is faster at institutions with many audits. Both show the same audits as before.",
                "Degree Audit Wizard also combines the requests it sends when opening the Audits list, an audit, and the precondition and course criteria dialogs.",
              ],
            },
            {
              title: "Editing an audit",
              tickets: ["44561"],
              body: [
                "Adding a requirement with **Add Requirement**, saving a requirement in **Edit Requirement**, making a requirement active or inactive, and saving a requirement group's settings no longer reload the whole audit. Only the changed requirement group refreshes, so the page responds sooner after each save, most noticeably on large audits.",
              ],
            },
            {
              title: "Publishing and course share set usage",
              tickets: ["44559", "44560"],
              body: [
                "Publishing finds a plan-level or sub-plan audit faster at institutions with many audits, and **Course Sharing › View Usage** loads course share set details faster at institutions with many requirement groups. Both show the same results as before.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "enhancements",
      title: "Enhancements",
      tag: "green",
      blurb: "Requirement lines, and who can publish",
      groups: [
        {
          items: [
            {
              title: "Adding a requirement line starts as a Course Requirement",
              tickets: ["44207"],
              body: [
                "Adding a requirement line now starts as a Course Requirement, from a single button at the bottom of the line list. Other line types sit under **More Lines**, and the type can still be switched in the dialog before saving.",
              ],
            },
            {
              title: "Publishing an audit requires DAW write access",
              tickets: ["44558"],
              body: [
                "Publishing an audit now requires `HPT_DAW_WRITE`. A user who holds only `HPT_DAW_READ` can no longer publish, so review anyone you have given read-only access who is expected to publish. Users with the **Highpoint DAW Full Access** role are unaffected.",
                "Publishing an audit that has no warnings is also faster.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      tag: "blue",
      blurb: "Cohorts and benchmarks, defined more precisely",
      intro: "The reports introduced in 1.3.6 continue to be refined as they run against real institutional data.",
      notice: {
        role: "info",
        lead: "Figures will move.",
        body: "Two of the changes below alter what is counted, so Retention Rate and Time to Degree won't match what you saw in 1.3.6.",
      },
      groups: [
        {
          items: [
            {
              title: "Retention Rate measures the entering cohort by admit term",
              tickets: ["44264"],
              body: [
                "The Retention Rate report now always measures the entering cohort by admit term. The Anchor Mode control is removed, and Requirement Term becomes a filter that narrows that cohort to a catalog year. Cohort figures change accordingly.",
              ],
            },
            {
              title: "Terms Under/Over now has a benchmark you can see",
              tickets: ["44318"],
              body: [
                "On Time to Degree, Terms Under/Over is now measured against the terms the program's own calendar carries, so it no longer disagrees with % of Normal Time. A new **Terms Expected** column shows that benchmark, a caption states where Normal Years comes from, and Time to Graduate reads in years.",
              ],
            },
            {
              title: "Time to Degree plan filter lists only conferred plans",
              tickets: ["44320"],
              body: [
                "The Plan filter now lists only the plans carried by a conferred degree in the selected career, including second majors and minors, rather than every plan in the catalog. Changing the career clears a plan selection that no longer applies.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "bug-fixes",
      title: "Bug fixes",
      tag: "gray",
      blurb: "Missing audits, lost focus, phantom counts",
      groups: [
        {
          items: [
            {
              title: "Audits missing for requirement groups that are inactive in PeopleSoft",
              tickets: ["44700"],
              body: [
                "A requirement group marked inactive in PeopleSoft got no audit at all, or an audit that could not be opened. With **Hide Audits without Active requirement groups** off, these audits are now listed and open with their groups marked Inactive, and **Abandon Changes** no longer deletes them. Audits with active groups may also list terms from their inactive groups.",
              ],
            },
            {
              title: "No audit created when another institution has the same code",
              tickets: ["44573"],
              body: [
                "The Audits list did not create an audit for a plan, program, or career at one institution when another institution already had an audit with the same code and Term was left blank. Missing audits are added on the first search after the update.",
              ],
            },
            {
              title: "Published audit dropped terms after an unpublished group move",
              tickets: ["44699"],
              body: [
                "A published audit dropped terms, and was hidden by **Hide Audits without Active requirement groups**, when an unpublished change moved one of its requirement groups to a different academic structure. The affected term now shows as Unpublished, so the change can be published or abandoned.",
              ],
            },
            {
              title: "Preferences menu opened behind the column headers",
              tickets: ["44665"],
              body: [
                "On the Audits, Course Sharing, and Entity Groups pages, the Preferences (gear) menu opened behind the table's column headers, which hid the Institutions option for users with access to more than one institution.",
              ],
            },
            {
              title: "Description field lost focus after the first letter",
              tickets: ["44495"],
              body: [
                "Typing into a blank Description in the requirement group, requirement, and requirement line dialogs lost keyboard focus after the first letter. Focus now stays in the field.",
              ],
            },
            {
              title: "Keyboard focus jumped to the top of the requirement line dialog",
              tickets: ["44502"],
              body: [
                "Toggling an advanced-field checkbox or resetting a field moved keyboard focus to the top of the requirement line dialog. Focus now stays on the field.",
              ],
            },
          ],
        },
        {
          title: "Conditions and entity groups",
          items: [
            {
              title: "Phantom and missing condition counts on non-course requirement lines",
              tickets: ["44188", "43791"],
              body: [
                "After a non-course requirement line was added with no condition, a line in that session could show a condition belonging to a different line, or read **Conditions: 0** despite having one. Both are corrected, and stored condition data was never affected.",
              ],
            },
            {
              title: "Misleading entity group error when saving a condition",
              tickets: ["44212"],
              body: [
                "Entity group resolution is corrected for conditions that reference a group by only one of its identifiers. The message for an unresolved entity group now distinguishes a missing identifier from one that was not found, and names the identifier it looked up.",
              ],
            },
          ],
        },
      ],
    },
  ],
};
