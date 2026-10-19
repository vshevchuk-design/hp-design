// CX (HighPoint Campus Experience) — the staff/student app shell's content.
// The navigation is the live app's, item for item, read off a saved copy of
// its Dashboard (2026-10-15): every section, every nested link, in the live
// order. Icons are the live ones where Material has them (the live app uses
// Material Icons too).

export const CX_USER = { name: "Ava Robinson", initials: "AR" };

export const CX_NAV = [
  { key: "dashboard", label: "Dashboard", icon: "home" },
  {
    key: "advising", label: "Advising", icon: "signpost",
    children: [
      { key: "advising-advisors", label: "Advisors" },
      { key: "advising-appointments", label: "Appointments" },
      { key: "advising-dropins", label: "Drop-Ins" },
      { key: "advising-history", label: "History" },
      { key: "advising-schedule", label: "Schedule" },
      { key: "advising-scheduling", label: "Scheduling" },
    ],
  },
  {
    key: "advisor", label: "Advisor", icon: "meeting_room", count: 3,
    children: [
      { key: "advisor-action-items", label: "Action Items", count: 3 },
      { key: "advisor-appointments", label: "Appointments" },
      { key: "advisor-campaigns", label: "Appointment Campaigns" },
      { key: "advisor-dropins", label: "Drop-Ins" },
      { key: "advisor-progress", label: "Progress Reports" },
      { key: "advisor-lookup", label: "Student Lookup" },
      { key: "advisor-scheduling", label: "Scheduling" },
      { key: "advisor-settings", label: "User Settings" },
    ],
  },
  { key: "analytics", label: "Analytics", icon: "insert_chart" },
  {
    key: "arm-admin", label: "ARM Admin", icon: "room_preferences",
    children: [
      { key: "arm-automated", label: "Automated Assignment" },
      { key: "arm-dept-appointments", label: "Department Appointments" },
      { key: "arm-dept-settings", label: "Department Settings" },
      { key: "arm-global", label: "Global Settings" },
      { key: "arm-institution", label: "Institution Settings" },
      { key: "arm-manual", label: "Manual Assignment" },
      { key: "arm-progress", label: "Progress Reports" },
      { key: "arm-scheduling", label: "Scheduling" },
    ],
  },
  {
    key: "class-info", label: "Class Information", icon: "ballot",
    children: [
      { key: "class-browse", label: "Browse Classes" },
      { key: "class-catalog", label: "Course Catalog" },
      { key: "class-search", label: "Class Search" },
      { key: "class-wishlist", label: "Wishlist" },
      { key: "class-unified", label: "Unified Class Search" },
    ],
  },
  { key: "schedule", label: "Schedule", icon: "insert_invitation" },
  {
    key: "enrollment", label: "Enrollment", icon: "school",
    children: [
      { key: "enroll-planner", label: "Planner" },
      { key: "enroll-cart", label: "Shopping Cart" },
    ],
  },
  {
    key: "my-info", label: "My Information", icon: "info",
    children: [
      { key: "mc", label: "Message Center" },
      { key: "mc-v2", label: "Message Center v2" },
    ],
  },
  {
    key: "graduation", label: "Graduation Processing", icon: "playlist_add_check",
    children: [{ key: "grad-process", label: "Process Degrees" }],
  },
  { key: "friends", label: "Friends", icon: "insert_emoticon" },
  { key: "class-roster", label: "Class Roster", icon: "list_alt" },
  { key: "grade-roster", label: "Grade Roster", icon: "playlist_add_check" },
  { key: "advisees", label: "View Advisees", icon: "supervisor_account" },
  { key: "lookup", label: "Lookup Student", icon: "portrait" },
  { key: "staff-mc", label: "Staff Message Center", icon: "message" },
  { key: "staff-mc-v2", label: "Staff Message Center v2", icon: "message" },
  { key: "guest-ids", label: "Delete Temporary Guest IDs", icon: "launch" },
  { key: "feedback", label: "Manage Feedback", icon: "launch" },
  {
    key: "configuration", label: "Configuration", icon: "settings",
    children: [
      { key: "config-branding", label: "Application Branding" },
      { key: "config-dp-exceptions", label: "Setup Deg Progress Exceptions" },
      { key: "config-app", label: "Application Settings" },
      { key: "config-global", label: "Global Settings" },
    ],
  },
  {
    key: "public-links", label: "Public Links", icon: "language",
    children: [
      { key: "public-map", label: "Map" },
      { key: "public-news", label: "News" },
      { key: "public-full", label: "Full Site" },
    ],
  },
];

// ---------------- Dashboard ----------------
// The saved copy is from Wednesday, Oct 14 2026 — the prototype's "today".
export const CX_TODAY = "2026-10-14";
export const CX_TERM = "2026 Fall";

// Widgets per dashboard tab, in the live "Edit My Widgets" order. `off`:
// unticked in the live copy (View Advisees was the one). Descriptions are new
// — the live page had illustrations instead.
export const CX_WIDGETS = {
  academics: [
    { key: "today", label: "Today's Schedule", icon: "today", desc: "Your classes for one day, with rooms" },
    { key: "classes", label: "Class Schedule", icon: "insert_invitation", desc: "Everything you're enrolled in this term" },
    { key: "exams", label: "Student Exams", icon: "event_note", desc: "Your exam dates, times and rooms" },
  ],
  teaching: [
    { key: "teach-exams", label: "Teaching Exams", icon: "event_note", desc: "Exams for the classes you teach" },
    { key: "teach-schedule", label: "Teaching Schedule", icon: "list_alt", desc: "Your sections, times and enrolment" },
  ],
  advisor: [
    { key: "inbox", label: "Inbox", icon: "mail", desc: "Latest messages from your advisees" },
    { key: "appointments", label: "Appointments", icon: "insert_invitation", desc: "Who you're seeing today" },
    { key: "mc2", label: "Message Center v2", icon: "message", desc: "Unread count and a shortcut" },
    { key: "my-advisees", label: "My Advisees", icon: "supervisor_account", desc: "Your caseload at a glance" },
    { key: "view-advisees", label: "View Advisees", icon: "portrait", desc: "The full advisee list", off: true },
  ],
};
export const CX_TAB_LABEL = { academics: "Academics", teaching: "Teaching", advisor: "Advisor" };

// Sample content (the live copy's widgets were empty — "You have no classes
// on this day" / "You have no Exams" — so these are illustrative). Days are
// 0–6 (Sun–Sat), times in minutes.
export const CX_CLASSES = [
  { code: "ENGL 101", title: "Composition I", days: [1, 3], start: 540, end: 615, room: "Humanities Hall 214" },
  { code: "MATH 140", title: "Introductory Statistics", days: [1, 3], start: 780, end: 855, room: "Science Building 110" },
  { code: "HIST 110", title: "U.S. History to 1877", days: [2, 4], start: 630, end: 705, room: "Liberal Arts 305" },
  { code: "BIOL 101", title: "General Biology", days: [2, 4], start: 840, end: 915, room: "Science Building 204" },
  { code: "BIOL 101L", title: "General Biology Lab", days: [5], start: 540, end: 710, room: "Science Building 012" },
];
export const CX_EXAMS = [
  { code: "MATH 140", title: "Midterm", date: "2026-10-21", start: 780, end: 855, room: "Science Building 110" },
  { code: "HIST 110", title: "Midterm", date: "2026-10-22", start: 630, end: 705, room: "Liberal Arts 305" },
  { code: "ENGL 101", title: "Final exam", date: "2026-12-14", start: 540, end: 660, room: "Humanities Hall 214" },
];
export const CX_TEACHING = [
  { code: "COUN 100-02", title: "College Success", days: [2, 4], start: 540, end: 615, room: "Student Services 120", enrolled: 28, cap: 30 },
  { code: "COUN 120-01", title: "Career Planning", days: [3], start: 960, end: 1110, room: "Career Center", enrolled: 19, cap: 25 },
];
export const CX_TEACHING_EXAMS = [
  { code: "COUN 100-02", title: "Final exam", date: "2026-12-15", start: 540, end: 660, room: "Student Services 120" },
  { code: "COUN 120-01", title: "Final project due", date: "2026-12-16", start: 960, end: 1110, room: "Career Center" },
];
export const CX_INBOX = [
  { from: "Jordan Lee", subject: "Question about dropping MATH 140", when: "9:42 AM", unread: true },
  { from: "Priya Shah", subject: "Transfer plan — can we meet this week?", when: "Yesterday", unread: true },
  { from: "Office of the Registrar", subject: "Grade change deadline is Oct 30", when: "Mon", unread: false },
];
export const CX_ADVISOR_APPTS = [
  { min: 630, student: "Jordan Lee", service: "Ed Plan Review", format: "In person" },
  { min: 840, student: "Sam Ortiz", service: "Change of Major", format: "Phone" },
  { min: 930, student: "Mia Chen", service: "Career Counseling", format: "Video" },
];
export const CX_ADVISEES = { total: 42, holds: 5, notRegistered: 11 };
export const CX_ADVISEE_LIST = [
  { name: "Jordan Lee", program: "Psychology, AA", standing: "Good standing" },
  { name: "Priya Shah", program: "Business Administration, AS-T", standing: "Hold: transcript" },
  { name: "Sam Ortiz", program: "Undeclared", standing: "Not registered for Spring" },
  { name: "Mia Chen", program: "Computer Science, AS", standing: "Good standing" },
];
// The live Assistant's suggested questions, verbatim.
export const CX_ASSISTANT_PROMPTS = [
  "What can you assist me with?",
  "Do I have any holds on my account?",
  "What's on my to-do list?",
  "Who is my academic advisor?",
  "What's my current account balance?",
  "When does enrollment open for the next term?",
];
