// Schedule — one calendar for CX and ARM. Sample data for the prototype
// (tools/build-design-schedule.mjs).
//
// The live app has two Schedule pages: CX's (Schedule in the main nav —
// classes only: enrolled + wait-listed, Week / Month / list, .ics, print,
// Filter by Friend) and ARM's (Advising → Schedule — Class Schedule, Class
// Exams, Wait List Classes, Appointments, Workshops, Mon–Fri week only).
// The class list is George Amalor's from the live screenshots (2026-10-31):
// green = enrolled (HISTORY 120, ART 111, MATH 211, MATH 210, BIOLOGY 115 —
// exactly ARM's "Class Schedule" set), blue = wait-listed (the rest). Rooms,
// instructors, exams, appointments, workshops and friends are
// sample data. Days are 0–6 (Sun–Sat), times in minutes from midnight.

export const SCH_TODAY = "2026-10-29"; // a Thursday — the week the live screenshots show
export const SCH_NOW = 10 * 60 + 40;
export const SCH_TZ = "Pacific Time";
export const SCH_TERM = { name: "2026 Fall", start: "2026-08-30", end: "2026-12-12" };

// The class panel's fields are the live CX class modal's (screenshots 2026-11-02:
// Information · Description · Details · Textbooks · Availability · Additional
// links, then View Deadlines). MATH 211 is the live one, verbatim; the rest
// is sample text in the same shape.
const common = { institution: "PeopleSoft University", career: "Undergraduate", session: "Regular Academic Session", grading: "Graded", mode: "In Person", campus: "Hacienda Campus", location: "Hacienda", topic: "", components: "Lecture Required", textbooks: "", links: ["HighPoint - test"] };

export const SCH_CLASSES = [
  { ...common, code: "HISTORY 120", title: "American History", section: "1-LEC", classNumber: 1088, days: [1, 3, 5], start: 540, end: 590, units: "1.0", instructor: "Marcus Webb", room: "Angel 105", description: "Survey of American history from colonial settlement to the present: the Revolution, the Constitution, expansion, the Civil War and Reconstruction, industrialization, and the United States as a world power.", seats: [24, 35], wait: [0, 10], status: "Open" },
  { ...common, code: "ART 112", title: "History of World Art (As/Af)", section: "1-LEC", classNumber: 1093, days: [1, 3, 5], start: 600, end: 650, units: "3.0", instructor: "Elena Ruiz", room: "Fine Arts 120", waitlist: 3, description: "Art and architecture of Asia and Africa from prehistory to the present, studied in their religious, political and social contexts.", seats: [0, 30], wait: [2, 10], status: "Wait list" },
  { ...common, code: "ART 111", title: "Introductory Art Seminar", section: "1-SEM", classNumber: 1091, days: [2, 4], start: 600, end: 680, units: "3.0", instructor: "Elena Ruiz", room: "Fine Arts 204", description: "A seminar introduction to looking at, talking about and writing about art. Weekly gallery visits and short critical responses.", seats: [6, 18], wait: [0, 5], status: "Open" },
  { ...common, code: "ACCT 202", title: "Financial Accounting II", section: "100-LEC", classNumber: 1102, days: [2, 4], start: 600, end: 680, units: "3.0", instructor: "Syndi B. Forbes", room: "Business 210", waitlist: 6, description: "Continuation of Financial Accounting I: long-term assets, liabilities, equity, the statement of cash flows and financial statement analysis.", seats: [0, 40], wait: [0, 10], status: "Closed" },
  { ...common, code: "ACCT 201", title: "Financial Accounting I", section: "1001-LEC", classNumber: 1001, days: [1, 3, 5], start: 720, end: 770, units: "3.0", instructor: "Syndi B. Forbes", room: "Business 110", waitlist: 2, description: "The accounting cycle and financial statements: recording transactions, adjusting entries, receivables, inventories and internal control.", seats: [0, 40], wait: [5, 15], status: "Wait list" },
  { ...common, code: "MATH 211", title: "Math for Business Analysis", section: "100-LEC", classNumber: 2184, days: [1, 3, 5], start: 780, end: 830, units: "3", instructor: "Staff", room: "", description: "Topics in business analysis, including: Lagrange multipliers, linear programming, linear algebra, intermediate probability, random variables, discrete distributions, and continuous distributions.", seats: [28, 30], wait: [0, 0], status: "Open" },
  { ...common, code: "DANCE 104", title: "Modern and Postmodern Practice", section: "1-LAB", classNumber: 1310, days: [1, 3, 5], start: 780, end: 830, units: "2.0", instructor: "Jonathan Rehm", room: "Studio B", waitlist: 4, description: "Studio practice in modern and postmodern dance techniques, with improvisation and short compositions. Comfortable clothing required.", seats: [0, 20], wait: [0, 6], status: "Closed" },
  { ...common, code: "COMM 3", title: "Public Communication!", section: "1-LEC", classNumber: 1022, days: [1, 3, 5], start: 780, end: 830, units: "3.0", instructor: "Staff", room: "Humanities 214", waitlist: 1, description: "Preparing and delivering informative and persuasive speeches; audience analysis, organization, evidence and delivery.", seats: [0, 25], wait: [3, 8], status: "Wait list" },
  { ...common, code: "MATH 210", title: "Brief Calculus", section: "1000-LEC", classNumber: 1000, days: [1, 3, 5], start: 840, end: 890, units: "4.0", instructor: "Priya Natarajan", room: "Science 204", description: "Differential and integral calculus of one variable with applications to business, economics and the life sciences.", seats: [11, 35], wait: [0, 10], status: "Open" },
  // no meeting pattern — the live "Unscheduled" / "Other" row; instructor and room not set yet, as live
  { ...common, code: "BIOLOGY 115", title: "History and Theory of Biology", section: "1-LEC", classNumber: 1565, days: [], units: "3.0", instructor: "", room: "", description: "How ideas about life changed from Aristotle to molecular biology: evolution, inheritance, the cell and the debates around them.", seats: [9, 30], wait: [0, 10], status: "Open" },
  { ...common, code: "ART 532", title: "The Psychology of Art", section: "001-LEC", classNumber: 1532, days: [], units: "3.0", instructor: "", room: "", career: "Graduate", waitlist: 5, description: "Graduate seminar on perception, emotion and meaning in the making and viewing of art.", seats: [0, 12], wait: [1, 5], status: "Wait list" },
];

// Academic Calendar Deadlines — the live modal behind View Deadlines (one set
// per session; Regular Academic Session's, verbatim). The live labels carry
// internal ids ("5206: Drop - Delete Record (MCO28)") — dropped here.
export const SCH_DEADLINES = {
  lastWaitlist: "2026-08-29",
  groups: [
    { title: "Drop", items: [
      { name: "Drop – delete record", date: "2026-11-25", text: "A class dropped on or before this date will be deleted from your academic record." },
      { name: "Drop – retain record", date: "2026-11-26", text: "A class dropped on or before this date will be retained on your academic record with a status of dropped." },
      { name: "Drop with penalty", date: "2026-11-27", text: "A class dropped on or before this date will appear on your transcript and a penalty grade will be assigned to the class." },
      { name: "Drop with greater penalty", date: "2026-11-28", text: "Last date to drop. A class dropped on or before this date will appear on your transcript and a severe penalty grade will be assigned to the class." },
    ] },
    { title: "Cancel & withdraw", items: [
      { name: "Cancel", date: "2026-08-29", text: "Classes within a session, canceled on or before this date will not appear on your transcript." },
      { name: "Withdraw without penalty", date: "2026-11-13", text: "Classes within a session, withdrawn on or before this date will not appear on your transcript." },
      { name: "Withdraw with penalty", date: "2026-11-29", text: "Classes within a session, withdrawn on or before this date will appear on your transcript and a penalty grade will be assigned to the classes." },
      { name: "Withdraw with greater penalty", date: "2026-11-29", text: "Last day to withdraw from a session. Classes within a session, withdrawn on or before this date will appear on your transcript and a severe penalty grade will be assigned to the classes." },
    ] },
  ],
};

export const SCH_EXAMS = [
  { code: "MATH 210", title: "Brief Calculus", name: "Midterm", date: "2026-10-30", start: 900, end: 990, room: "Science 204" },
  { code: "HISTORY 120", title: "American History", name: "Midterm", date: "2026-11-02", start: 540, end: 590, room: "Angel 105" },
  { code: "MATH 211", title: "Math for Business Analysis", name: "Midterm", date: "2026-11-06", start: 780, end: 870, room: "Science 110" },
  { code: "HISTORY 120", title: "American History", name: "Final exam", date: "2026-12-07", start: 480, end: 600, room: "Angel 105" },
  { code: "ART 111", title: "Introductory Art Seminar", name: "Final critique", date: "2026-12-08", start: 600, end: 720, room: "Fine Arts 204" },
  { code: "MATH 211", title: "Math for Business Analysis", name: "Final exam", date: "2026-12-09", start: 780, end: 900, room: "Science 110" },
  { code: "MATH 210", title: "Brief Calculus", name: "Final exam", date: "2026-12-10", start: 840, end: 960, room: "Science 204" },
];

// ARM — the student's advising appointments. The panel shows what
// Scheduling's appointment page shows (When · Duration · Advisor · Meeting ·
// Where · Reference, the advisor's questions, check-in, About this service,
// Reschedule / Cancel / Book again). `about` for Career Counseling is
// Scheduling's own (ss-data ABOUT); the rest are sample text.
export const SCH_APPOINTMENTS = [
  { service: "Academic Advising", dept: "Counseling", advisor: "Ava Robinson", date: "2026-10-12", start: 540, end: 600, format: "In person", where: "Student Services, Room 120", ref: "APT-20417", status: "Done",
    about: "Your term check-in: classes for next term, holds, and anything getting in the way." },
  { service: "Academic Advising", dept: "Counseling", advisor: "Ava Robinson", date: "2026-10-26", start: 930, end: 960, format: "In person", where: "Student Services, Room 120", ref: "APT-20581", status: "Done",
    about: "Your term check-in: classes for next term, holds, and anything getting in the way." },
  { service: "Financial Aid Advising", dept: "Financial Aid", advisor: "Caitlin Moore", date: "2026-10-29", start: 840, end: 870, format: "Video", where: "Zoom — the link is in your confirmation email", ref: "APT-20644",
    about: "Go over your aid package, what's still missing from your file, and how dropping a class would change your award.",
    questions: ["Have you submitted this year's FAFSA?", "Are you planning to drop any classes this term?"] },
  { service: "Transfer Planning", dept: "Transfer Center", advisor: "Andy Hernandez", date: "2026-11-03", start: 690, end: 720, format: "Phone", where: "We call you at (555) 555-1234", ref: "APT-20702",
    about: "Check which of your classes transfer to the schools you're applying to, and what's left to take." },
  { service: "Career Counseling", dept: "Career and Talent Development", advisor: "Craig Millett", date: "2026-11-12", start: 900, end: 945, format: "In person", where: "Career Center", ref: "APT-20766", about: null },
];
// check-in opens this long before an appointment (Scheduling's CHECKIN_MINUTES_BEFORE)
export const SCH_CHECKIN_BEFORE = 15;

// ARM — registered workshops; sessions are generated weekly from `start`
export const SCH_WORKSHOPS = [
  // `missed`: past session numbers the student didn't attend; `about` comes
  // from Scheduling's WORKSHOPS by name (build-design-schedule.mjs)
  { name: "Study Skills Bootcamp", dept: "Tutoring Center", day: 3, start: 960, end: 1050, first: "2026-10-07", count: 8, where: "Learning Commons, Room 110", format: "In person", organizer: "Denny Petersen", missed: [2] },
  { name: "Resume Writing Workshop", dept: "Career and Talent Development", day: 2, start: 930, end: 990, first: "2026-10-13", count: 6, where: "Zoom — the link is in your confirmation email", format: "Video", organizer: "Eric Lynch", missed: [] },
];

// CX — Filter by Friend: a friend's classes laid over yours
export const SCH_FRIENDS = [
  { id: "jordan", name: "Jordan Lee", classes: [
    { code: "ENGL 101", title: "Composition I", days: [1, 3], start: 540, end: 615, room: "Humanities 214" },
    { code: "MATH 211", title: "Math for Business Analysis", days: [1, 3, 5], start: 780, end: 830, room: "Science 110" },
    { code: "BIOL 101", title: "General Biology", days: [2, 4], start: 840, end: 915, room: "Science 204" },
  ] },
  { id: "mia", name: "Mia Chen", classes: [
    { code: "CS 110", title: "Intro to Programming", days: [2, 4], start: 540, end: 615, room: "Engineering 101" },
    { code: "ART 111", title: "Introductory Art Seminar", days: [2, 4], start: 600, end: 680, room: "Fine Arts 204" },
    { code: "PSYC 101", title: "General Psychology", days: [1, 3], start: 900, end: 975, room: "Liberal Arts 305" },
  ] },
];

// Event types, in filter order. `arm`: only exists where ARM is licensed.
// `color`: the Badge colour (badge.color.* tint/solid) the event wears —
// Scheduling's own (appointment violet, workshop teal); wait list is amber like
// ARM's yellow triangle. No drop-ins — removed on request (user, 2026-11-02).
export const SCH_TYPES = [
  { key: "class", label: "Classes", one: "Class", color: "green" },
  { key: "waitlist", label: "Wait list", one: "Wait list", color: "amber" },
  { key: "exam", label: "Exams", one: "Exam", color: "red" },
  { key: "appointment", label: "Appointments", one: "Appointment", color: "violet", arm: true },
  { key: "workshop", label: "Workshops", one: "Workshop", color: "teal", arm: true },
];

// The live Assistant's questions on the ARM Schedule page, verbatim.
export const SCH_PROMPTS = [
  "Ask about your advisees",
  "Show my advisees",
  "Find a student",
  "Show my upcoming appointments",
  "What action item types are available?",
];
