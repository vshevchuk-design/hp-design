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
// instructors, exams, appointments, drop-ins, workshops and friends are
// sample data. Days are 0–6 (Sun–Sat), times in minutes from midnight.

export const SCH_TODAY = "2026-10-29"; // a Thursday — the week the live screenshots show
export const SCH_NOW = 10 * 60 + 40;
export const SCH_TZ = "Pacific Time";
export const SCH_TERM = { name: "2026 Fall", start: "2026-08-30", end: "2026-12-12" };

const common = { career: "Undergraduate", session: "Regular Academic Session", grading: "Graded", mode: "In Person", campus: "Hacienda Campus", location: "Hacienda" };

export const SCH_CLASSES = [
  { ...common, code: "HISTORY 120", title: "American History", section: "1-LEC", classNumber: 1088, days: [1, 3, 5], start: 540, end: 590, units: "1.0", instructor: "Marcus Webb", room: "Angel 105" },
  { ...common, code: "ART 112", title: "History of World Art (As/Af)", section: "1-LEC", classNumber: 1093, days: [1, 3, 5], start: 600, end: 650, units: "3.0", instructor: "Elena Ruiz", room: "Fine Arts 120", waitlist: 3 },
  { ...common, code: "ART 111", title: "Introductory Art Seminar", section: "1-SEM", classNumber: 1091, days: [2, 4], start: 600, end: 680, units: "3.0", instructor: "Elena Ruiz", room: "Fine Arts 204" },
  { ...common, code: "ACCT 202", title: "Financial Accounting II", section: "100-LEC", classNumber: 1102, days: [2, 4], start: 600, end: 680, units: "3.0", instructor: "Syndi B. Forbes", room: "Business 210", waitlist: 6 },
  { ...common, code: "ACCT 201", title: "Financial Accounting I", section: "1001-LEC", classNumber: 1001, days: [1, 3, 5], start: 720, end: 770, units: "3.0", instructor: "Syndi B. Forbes", room: "Business 110", waitlist: 2 },
  { ...common, code: "MATH 211", title: "Math for Business Analysis", section: "1-LEC", classNumber: 1214, days: [1, 3, 5], start: 780, end: 830, units: "3.0", instructor: "Priya Natarajan", room: "Science 110" },
  { ...common, code: "DANCE 104", title: "Modern and Postmodern Practice", section: "1-LAB", classNumber: 1310, days: [1, 3, 5], start: 780, end: 830, units: "2.0", instructor: "Jonathan Rehm", room: "Studio B", waitlist: 4 },
  { ...common, code: "COMM 3", title: "Public Communication!", section: "1-LEC", classNumber: 1022, days: [1, 3, 5], start: 780, end: 830, units: "3.0", instructor: "Staff", room: "Humanities 214", waitlist: 1 },
  { ...common, code: "MATH 210", title: "Brief Calculus", section: "1000-LEC", classNumber: 1000, days: [1, 3, 5], start: 840, end: 890, units: "4.0", instructor: "Priya Natarajan", room: "Science 204" },
  // no meeting pattern — the live "Unscheduled" / "Other" row; instructor and room not set yet, as live
  { ...common, code: "BIOLOGY 115", title: "History and Theory of Biology", section: "1-LEC", classNumber: 1565, days: [], units: "3.0", instructor: "", room: "" },
  { ...common, code: "ART 532", title: "The Psychology of Art", section: "001-LEC", classNumber: 1532, days: [], units: "3.0", instructor: "", room: "", career: "Graduate", waitlist: 5 },
];

export const SCH_EXAMS = [
  { code: "MATH 210", title: "Brief Calculus", name: "Midterm", date: "2026-10-30", start: 900, end: 990, room: "Science 204" },
  { code: "HISTORY 120", title: "American History", name: "Midterm", date: "2026-11-02", start: 540, end: 590, room: "Angel 105" },
  { code: "MATH 211", title: "Math for Business Analysis", name: "Midterm", date: "2026-11-06", start: 780, end: 870, room: "Science 110" },
  { code: "HISTORY 120", title: "American History", name: "Final exam", date: "2026-12-07", start: 480, end: 600, room: "Angel 105" },
  { code: "ART 111", title: "Introductory Art Seminar", name: "Final critique", date: "2026-12-08", start: 600, end: 720, room: "Fine Arts 204" },
  { code: "MATH 211", title: "Math for Business Analysis", name: "Final exam", date: "2026-12-09", start: 780, end: 900, room: "Science 110" },
  { code: "MATH 210", title: "Brief Calculus", name: "Final exam", date: "2026-12-10", start: 840, end: 960, room: "Science 204" },
];

// ARM — the student's advising appointments (Scheduling's services and advisors)
export const SCH_APPOINTMENTS = [
  { service: "Academic Advising", dept: "Counseling", advisor: "Ava Robinson", date: "2026-10-12", start: 540, end: 600, format: "In person", where: "Student Services, Room 120", ref: "APT-20417", status: "Done" },
  { service: "Academic Advising", dept: "Counseling", advisor: "Ava Robinson", date: "2026-10-26", start: 930, end: 960, format: "In person", where: "Student Services, Room 120", ref: "APT-20581", status: "Done" },
  { service: "Financial Aid Advising", dept: "Financial Aid", advisor: "Caitlin Moore", date: "2026-10-29", start: 840, end: 870, format: "Video", where: "Zoom — link in your confirmation email", ref: "APT-20644" },
  { service: "Transfer Planning", dept: "Transfer Center", advisor: "Andy Hernandez", date: "2026-11-03", start: 690, end: 720, format: "Phone", where: "We call (555) 555-1234", ref: "APT-20702" },
  { service: "Career Counseling", dept: "Career and Talent Development", advisor: "Craig Millett", date: "2026-11-12", start: 900, end: 945, format: "In person", where: "Career Center", ref: "APT-20766" },
];

// ARM — drop-in visits the student joined or reserved
export const SCH_DROPINS = [
  { service: "Math Tutoring", dept: "Tutoring Center", date: "2026-10-29", start: 690, end: 720, where: "Learning Commons, Room 110", status: "Seat reserved" },
  { service: "Writing Center", dept: "Tutoring Center", date: "2026-10-20", start: 840, end: 870, where: "Learning Commons, Room 204", status: "Done" },
];

// ARM — registered workshops; sessions are generated weekly from `start`
export const SCH_WORKSHOPS = [
  { name: "Study Skills Bootcamp", dept: "Tutoring Center", day: 3, start: 960, end: 1050, first: "2026-10-07", count: 8, where: "Learning Commons, Room 110", format: "In person", organizer: "Denny Petersen" },
  { name: "Resume Writing Workshop", dept: "Career and Talent Development", day: 2, start: 930, end: 990, first: "2026-10-13", count: 6, where: "Zoom — link in your confirmation email", format: "Video", organizer: "Eric Lynch" },
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
// Scheduling's own (appointment violet, drop-in blue, workshop teal); wait list
// is amber like ARM's yellow triangle (CX drew it blue, which read as a drop-in).
export const SCH_TYPES = [
  { key: "class", label: "Classes", one: "Class", color: "green" },
  { key: "waitlist", label: "Wait list", one: "Wait list", color: "amber" },
  { key: "exam", label: "Exams", one: "Exam", color: "red" },
  { key: "appointment", label: "Appointments", one: "Appointment", color: "violet", arm: true },
  { key: "dropin", label: "Drop-ins", one: "Drop-in", color: "blue", arm: true },
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
