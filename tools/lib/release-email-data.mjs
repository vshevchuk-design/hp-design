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
//   sections: [{ id, title, tag, blurb, intro?, notice?, groups: [{ title?, items: [{ area?, title, tickets, body: [], credit? }] }] }]
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

// One item from the source email isn't here: "Rules Builder — External Course
// Creation During Rule Setup". Its text fell between the screenshots it was
// carried over from; add it once the original is at hand.
const IDEA = (who) => `Thanks to ${who} for this idea.`;
const REPORTED = (who) => `Thanks to ${who} for reporting this issue.`;

export const CAMPUS_EXPERIENCE_26_2_1 = {
  product: "Campus Experience",
  version: "26.2.1",
  posted: "Jul 27, 2026",
  author: "Jourdy Thro",
  headline: "Campus Experience 26.2.1 is available",
  preheader: "Rules Builder workflows, clearer class and enrollment details — and a USPS requirement to check before August 1.",
  overview:
    "This release expands Rules Builder workflows and organization matching, improves class and enrollment information across Campus Experience, adds new controls for transfer credit and shopping cart details, and resolves issues affecting acting-as widgets, course history, enrollment messages, migrations, and other CX pages.",
  links: [
    { label: "Installation guide", href: "https://support.highpoint.io/projects/technical-guides/wiki/Installation_Guide", primary: true },
    { label: "Documentation", href: "https://support.highpoint.io/projects/campus-experience/wiki" },
  ],
  notices: [
    {
      role: "warning",
      lead: "Check before August 1, 2026.",
      body: "If you use USPS Address Validation, keep a USPS Addresses API license and associate your CX API credentials with it. No code change is needed.",
      href: "#enhancements",
      linkLabel: "See the change",
    },
  ],
  sections: [
    {
      id: "enhancements",
      title: "Enhancements",
      tag: "green",
      blurb: "Rules Builder workflows, class and cart details",
      groups: [
        {
          items: [
            {
              area: "General",
              title: "Accessibility improvements",
              tickets: [],
              body: [
                "Improved expandable-row semantics so elements with the `row` role contain only cell-like children, helping screen readers interpret the content structure correctly.",
                "Hid decorative page headers from the accessibility tree to reduce unnecessary announcements and improve screen-reader clarity.",
              ],
            },
            {
              area: "Rules Builder",
              title: "Create School Courses workflow",
              tickets: [],
              body: [
                "Added a dedicated **Create School Courses** workflow for defining a sending school's course catalog independently of building a rule. The guided workflow is available from the **Create** menu and covers organization selection, transcript source-school matching, career and program criteria, effective dates, and a review of existing and new courses.",
                "The selected organization and source schools remain visible throughout the workflow. Missing External Subject Area values can be completed during review, input lengths align with PeopleSoft field limits, and a breadcrumb provides a clear path back.",
                "The initial count is now labeled **Transcript Rows** and includes an explanatory tooltip.",
              ],
            },
            {
              area: "Rules Builder",
              title: "External organizations and source schools",
              tickets: [],
              body: [
                "The manual rule editor now manages source schools and external organizations together in one **External Organizations** section. Each organization can have one or more transcript source-school names, and existing associations are pre-filled when a rule opens.",
                "Organizations can be added or removed, duplicate selections are prevented, and unassigned source schools are listed separately. Associations are saved when the rule is validated and saved.",
              ],
            },
            {
              area: "Rules Builder",
              title: "Organization selector",
              tickets: [],
              body: [
                "Replaced the blocking organization dialog with a searchable popover attached to the field. Selecting an organization adds it and closes the popover in one action. The selector supports keyboard navigation, disables organizations that are already attached, and remains responsive with large organization lists.",
              ],
            },
            {
              area: "Rules Builder",
              title: "Organization matching controls",
              tickets: [],
              body: [
                "Organization matching now uses **Loose**, **Balanced**, and **Strict** presets instead of exposing raw tuning values to most users. **Balanced** preserves the previous default behavior.",
                "Advanced settings include plain-language tooltips, and each result displays a **Confident**, **Probable**, or **Weak** confidence band alongside its score.",
              ],
            },
            {
              area: "Rules Builder",
              title: "Configurable start-of-time date",
              tickets: [],
              body: [
                "New external-course begin dates and the Create School Courses search and course-effective dates now default to the institution's configured start-of-time date. If no date is configured, Rules Builder uses the previous default.",
              ],
            },
            {
              area: "Rules Builder",
              title: "Performance improvements",
              tickets: [],
              body: [
                "Shared reference data, including lists of values and partition options, now loads once per session and is reused across Rules Builder screens. The rule preview-to-save workflow also prepares its data only once, reducing network traffic and improving responsiveness without changing behavior.",
              ],
            },
            {
              area: "Class Search",
              title: "Reserve capacity descriptions for combined sections",
              tickets: ["33149"],
              body: [
                "Reserve capacity descriptions now display with the Reserved Seats Open value for combined sections, matching the information available for regular sections. When a combined section has multiple reserve capacities, CX lists all descriptions followed by the total pooled number of reserved seats open. The updated display is available throughout class search and enrollment surfaces.",
              ],
              credit: IDEA("the Washington State Board for Community and Technical Colleges"),
            },
            {
              area: "Profile",
              title: "USPS Address API account requirements",
              tickets: ["43144"],
              body: [
                "Validated CX address validation against the USPS Addresses API account requirements taking effect August 1, 2026. The CX integration remains compatible without a code change. Institutions using USPS Address Validation must maintain a USPS Addresses API license and associate their CX API credentials with that license.",
              ],
            },
            {
              area: "Shopping Cart",
              title: "Instructor permission expiration date",
              tickets: ["16793"],
              body: [
                "Classes with a granted student-specific instructor permission now show the permission expiration date directly below **Granted**. The date is available in desktop, tablet, and phone views.",
              ],
              credit: IDEA("the University of Virginia"),
            },
            {
              area: "Transfer Credit",
              title: "Expand and collapse all",
              tickets: ["42162"],
              body: [
                "Added an **Expand All** control to the top of Transfer Credit so users can open all credit groups at once. The control changes to **Collapse All** when the groups are expanded.",
              ],
              credit: IDEA("California State University, Channel Islands"),
            },
          ],
        },
      ],
    },
    {
      id: "bug-fixes",
      title: "Bug fixes",
      tag: "gray",
      blurb: "Course history, widgets, messages, migrations",
      groups: [
        {
          items: [
            {
              area: "Application Settings",
              title: "Configuration table migration",
              tickets: ["42739"],
              body: [
                "Updated the CX DMS export bundle to include previously omitted Application Settings tables, so their configuration data is carried between PeopleSoft environments.",
              ],
              credit: REPORTED("Cerritos College"),
            },
            {
              area: "Course History",
              title: "Multiple sections of the same course",
              tickets: ["42803"],
              body: [
                "Course History now displays every distinct class section when a student takes multiple sections of the same course in one term, including different sessions or topics.",
              ],
              credit: REPORTED("the University of Maine System Central Office"),
            },
            {
              area: "Course History",
              title: "Transfer course details",
              tickets: ["43313"],
              body: ["Repeat Code and Requirement Designation values now populate in their Course History columns for transferred courses."],
              credit: REPORTED("the University of Wisconsin-Platteville"),
            },
            {
              area: "Dashboard",
              title: "Shopping Cart and Wait List career selection",
              tickets: ["42310"],
              body: [
                "Shopping Cart and Wait List widgets now fall back to an available career for the selected term when the session career does not match the student's enrollable career. Widget headers include the career description with the term, preventing misleading empty or not-authorized messages, particularly in Acting As mode.",
              ],
              credit: REPORTED("California State University, Channel Islands"),
            },
            {
              area: "Drop Classes and General Notifications",
              title: "User messages",
              tickets: ["43224"],
              body: [
                "Restored user-facing notifications in Drop Classes, Wait List, What If, Friends, Cumulative Borrowing, Report Other Aid, Student Permissions, Guest Users, and Degree Progress. For example, students who are not allowed to drop their last class now see the applicable explanation instead of a generic error. Developer diagnostic details are now shown only when error-message display is enabled.",
              ],
              credit: REPORTED("the University of Southern Mississippi"),
            },
            {
              area: "Enrollment Verification",
              title: "Undefined labels",
              tickets: ["43115"],
              body: ["Restored the report-option labels on Enrollment Verification that could display as `undefined` after upgrading to CX 26.1.2 or later."],
              credit: REPORTED("the University of Maine System Central Office"),
            },
            {
              area: "Grades",
              title: "Course numbers in print and PDF",
              tickets: ["43105"],
              body: ["Grades print and PDF output now includes each catalog number with its course subject, matching the on-screen class list."],
              credit: REPORTED("the University of North Carolina at Chapel Hill"),
            },
            {
              area: "Lookup Student",
              title: "Hyphenated last names",
              tickets: ["42792"],
              body: ["Name searches now return one result per student when the student's last name is hyphenated, instead of displaying a duplicate row."],
              credit: REPORTED("Boston University"),
            },
            {
              area: "Planner",
              title: "Zero-unit variable-credit courses",
              tickets: ["43222"],
              body: [
                "Students can now save zero units for courses whose variable-credit range includes zero. The **Edit** action remains available after saving so the units can be changed again.",
              ],
              credit: REPORTED("Duke University"),
            },
            {
              area: "Rules Builder",
              title: "Organization matching exact-match score",
              tickets: [],
              body: [
                "Corrected an issue where an exact match between an organization name and a transcript source-school name could receive a misleadingly low similarity score. Exact matches now receive a fully **Confident** score, and the similarity threshold is applied correctly when finding schools for an organization or organizations for a name.",
              ],
            },
          ],
        },
      ],
    },
  ],
};
