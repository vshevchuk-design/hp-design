// Content and fixtures for the Student Scheduling prototype.
//
// The service catalogue is the live app's (names, durations, drop-in status,
// the departments that offer each one), padded out to the 29 the reference's
// "Showing 1–10 of 29" reports. Availability is generated, not hand-listed:
// a deterministic hash of service × date, so every reload shows the same week
// and the client script can regenerate any week without shipping a table.

export const DEPARTMENTS = [
  "Academic Advising",
  "Admissions & Records",
  "Career and Talent Development",
  "Counseling",
  "English Dept",
  "Grad - Admissions",
  "Liberal Arts",
  "Office of the Registrar",
  "Student Mentoring",
  "Tutoring Center",
];

// Where an in-person meeting happens, per department — what the reference's
// confirm drawer reported as "Location".
export const LOCATIONS = {
  "Academic Advising": "Advising Center, Student Services Building",
  "Admissions & Records": "Admissions Office, Student Services Building",
  "Career and Talent Development": "Career Center, Library 2nd floor",
  Counseling: "Counseling Center, Student Services Building",
  "English Dept": "Humanities Hall, Room 214",
  "Grad - Admissions": "Graduate Office, Admin Building",
  "Liberal Arts": "Humanities Hall, Room 102",
  "Office of the Registrar": "Registrar, Admin Building",
  "Student Mentoring": "Student Union, Room 3",
  "Tutoring Center": "Learning Commons, Library 1st floor",
};

// drop: "none" = by appointment only · "open" = drop-in open right now ·
// "available" = offers drop-in, not open at the moment.
export const SERVICES = [
  { name: "Academic Difficulty", minutes: 45, drop: "none", depts: ["Counseling"], noSlots: true },
  { name: "Academic Probation", minutes: 30, drop: "open", depts: ["Counseling"] },
  { name: "Assessment / Placement", minutes: 30, drop: "open", depts: ["Admissions & Records"] },
  { name: "Career Counseling", minutes: 60, drop: "none", depts: ["Career and Talent Development", "Counseling"] },
  { name: "Change of Major", minutes: 60, drop: "none", depts: ["Academic Advising"] },
  { name: "Comprehensive Ed Plan", minutes: 60, drop: "open", depts: ["Counseling"] },
  { name: "Degree Planning", minutes: 30, drop: "available", depts: ["English Dept", "Liberal Arts", "Office of the Registrar"] },
  { name: "Ed Plan Review", minutes: 30, drop: "open", depts: ["Counseling"] },
  { name: "Education Plan", minutes: 30, drop: "none", depts: ["Academic Advising"] },
  { name: "EOPS Appointment", minutes: 45, drop: "open", depts: ["Counseling"] },
  { name: "Financial Aid Petition", minutes: 30, drop: "available", depts: ["Office of the Registrar"] },
  { name: "Graduation", minutes: 15, drop: "available", depts: ["Liberal Arts", "Office of the Registrar"] },
  { name: "Graduate Admissions Review", minutes: 45, drop: "none", depts: ["Grad - Admissions"] },
  { name: "Internship Planning", minutes: 30, drop: "none", depts: ["Career and Talent Development"] },
  { name: "Major Exploration", minutes: 45, drop: "none", depts: ["Academic Advising", "Liberal Arts"] },
  { name: "Math Tutoring", minutes: 30, drop: "open", depts: ["Tutoring Center"] },
  { name: "Mentor Check-In", minutes: 30, drop: "none", depts: ["Student Mentoring"] },
  { name: "New Student Orientation", minutes: 60, drop: "none", depts: ["Admissions & Records"] },
  { name: "Peer Mentoring", minutes: 30, drop: "available", depts: ["Student Mentoring"] },
  { name: "Personal Counseling", minutes: 45, drop: "none", depts: ["Counseling"] },
  { name: "Readmission", minutes: 30, drop: "none", depts: ["Admissions & Records"] },
  { name: "Records Request", minutes: 15, drop: "available", depts: ["Office of the Registrar"] },
  { name: "Resume Review", minutes: 30, drop: "open", depts: ["Career and Talent Development"] },
  { name: "Scholarship Advising", minutes: 30, drop: "none", depts: ["Academic Advising"] },
  { name: "Study Skills", minutes: 45, drop: "none", depts: ["Tutoring Center"] },
  { name: "Transcript Evaluation", minutes: 30, drop: "none", depts: ["Office of the Registrar", "Admissions & Records"] },
  { name: "Transfer Planning", minutes: 60, drop: "none", depts: ["Academic Advising", "Counseling"] },
  { name: "Veterans Services", minutes: 45, drop: "none", depts: ["Counseling"] },
  { name: "Writing Center", minutes: 30, drop: "open", depts: ["Tutoring Center", "English Dept"] },
];

export const ADVISORS = [
  "Alexander Robinson",
  "Andy Hernandez",
  "Ava Robinson",
  "Caitlin Moore",
  "Craig Millett",
  "Denny Petersen",
  "Eric Lynch",
  "George Amalor",
  "Jonathan Rehm",
  "Priya Natarajan",
];

// The prototype's "today" — the reference screens were taken on Friday,
// October 2, and the week strip starts there.
export const TODAY = "2026-10-02";
export const WEEKS_AHEAD = 3;
export const TIME_ZONE = "EEST";

export const SECTIONS = ["Browse", "Appointments", "Drop-Ins", "Workshops", "Reserve a Seat", "Calendar"];

// The prototype's "now" on TODAY — 10:20 AM, so the 10:30 appointment below
// is inside its check-in window (opens 15 minutes before).
export const NOW_MINUTES = 10 * 60 + 20;
export const CHECKIN_MINUTES_BEFORE = 15;
// The student's own number, for phone appointments ("we'll call you at…").
export const STUDENT_PHONE = "(555) 555-1234";

// What each service is for — the details page's "About this service".
export const ABOUT = {
  "Change of Major": "Talk through switching majors: what transfers, what changes in your plan, and how long it adds.",
  "Comprehensive Ed Plan": "Build a full semester-by-semester education plan to your degree or transfer goal.",
  "Ed Plan Review": "A short check of your existing education plan — after a change, or once a year.",
  "Career Counseling": "Explore careers that fit your interests, and the programs that lead there.",
  "Degree Planning": "Map the requirements left for your degree and the order to take them in.",
  "Financial Aid Petition": "Get help preparing a petition to restore or extend your financial aid.",
  "Transcript Evaluation": "Have transcripts from other schools evaluated for credit here.",
};

// Seed appointments. status: upcoming | completed | noshow | cancelled.
// questions: what the advisor asked to be answered before the meeting — the
// live app's unexplained "Answer Questions" button.
export const APPOINTMENTS = [
  { id: "a1", ref: "5098", service: "Ed Plan Review", dept: "Counseling", date: "2026-10-02", min: 10 * 60 + 30, advisor: "Caitlin Moore", format: "inPerson", status: "upcoming" },
  { id: "a2", ref: "5121", service: "Change of Major", dept: "Academic Advising", date: "2026-10-07", min: 14 * 60, advisor: "Ava Robinson", format: "phone", status: "upcoming",
    questions: ["Which major are you thinking of switching to, and why?", "Have you already taken any classes toward it?"] },
  { id: "a3", ref: "5140", service: "Career Counseling", dept: "Career and Talent Development", date: "2026-10-12", min: 11 * 60 + 30, advisor: "Eric Lynch", format: "video", status: "upcoming" },
  { id: "a4", ref: "4301", service: "Comprehensive Ed Plan", dept: "Counseling", date: "2026-09-28", min: 9 * 60, advisor: "George Amalor", format: "inPerson", status: "completed" },
  { id: "a5", ref: "4122", service: "Degree Planning", dept: "English Dept", date: "2026-09-15", min: 15 * 60 + 15, advisor: "Ava Robinson", format: "inPerson", status: "noshow" },
  { id: "a6", ref: "3987", service: "Financial Aid Petition", dept: "Office of the Registrar", date: "2026-08-20", min: 13 * 60, advisor: "Jonathan Rehm", format: "phone", status: "completed" },
  { id: "a7", ref: "4410", service: "Transcript Evaluation", dept: "Office of the Registrar", date: "2026-09-30", min: 10 * 60, advisor: "Priya Natarajan", format: "video", status: "cancelled" },
];

// ---------------- v6: Book (one catalogue) ----------------
// v6 folds the six live tabs into two: Book and My schedule.
export const SECTIONS_V6 = ["Book", "My schedule"];

// Drop-in hours for the services that offer them (drop "open" / "available"
// above) — one desk per service, at its first department. Open now: until
// `until`; not open yet: opens later today at `opens`, and a seat can be
// reserved before then. waiting = students already in the queue.
export const DROPIN_HOURS = {
  "Academic Probation": { until: 16 * 60, waiting: 2 },
  "Assessment / Placement": { until: 15 * 60, waiting: 0 },
  "Comprehensive Ed Plan": { until: 22 * 60, waiting: 4 },
  "Ed Plan Review": { until: 22 * 60, waiting: 1 },
  "EOPS Appointment": { until: 17 * 60, waiting: 3 },
  "Math Tutoring": { until: 20 * 60, waiting: 5 },
  "Resume Review": { until: 14 * 60, waiting: 1 },
  "Writing Center": { until: 19 * 60, waiting: 2 },
  "Degree Planning": { opens: 13 * 60, until: 17 * 60 },
  "Financial Aid Petition": { opens: 14 * 60, until: 16 * 60 },
  Graduation: { opens: 15 * 60, until: 18 * 60 },
  "Peer Mentoring": { opens: 18 * 60, until: 21 * 60 },
  "Records Request": { opens: 13 * 60 + 30, until: 16 * 60 },
};
// A drop-in visit takes about this long per student ahead of you.
export const DROPIN_MINUTES_PER_STUDENT = 8;

// Workshops. A workshop has one or more schedules (the live app's
// "Schedule 1/2/3" carousel); a schedule is a weekly pattern — days[] of
// [weekday 0–6, start minute] — from `start`, `count` sessions long.
// mode "series": you register for every session of one schedule.
// mode "single": each session is its own date — you register for one.
// seats/taken per schedule (series) or takenBy[] per session (single).
export const WORKSHOPS = [
  {
    id: "w1", name: "Study Skills Bootcamp", dept: "Tutoring Center", mode: "series", minutes: 90,
    about: "Eight short sessions on note-taking, reading for retention, planning your week and preparing for exams. Bring a current syllabus.",
    schedules: [
      { id: "w1a", days: [[1, 600], [3, 600]], start: "2026-10-05", count: 8, format: "inPerson", room: "Learning Commons, Room 110", organizer: "Denny Petersen", seats: 24, taken: 12 },
    ],
  },
  {
    id: "w2", name: "Resume Writing Workshop", dept: "Career and Talent Development", mode: "series", minutes: 60,
    about: "Turn your experience into a one-page resume that gets read. You leave with a finished draft and a reviewer's notes on it.",
    schedules: [
      { id: "w2a", days: [[2, 600], [4, 840], [6, 600]], start: "2026-10-06", count: 6, format: "video", organizer: "Eric Lynch", seats: 20, taken: 17 },
      { id: "w2b", days: [[1, 960], [3, 960]], start: "2026-10-12", count: 4, format: "inPerson", room: "Career Center, Library 2nd floor", organizer: "Ava Robinson", seats: 15, taken: 5 },
      { id: "w2c", days: [[5, 540]], start: "2026-10-09", count: 3, format: "inPerson", room: "Career Center, Library 2nd floor", organizer: "Caitlin Moore", seats: 12, taken: 12 },
    ],
  },
  {
    id: "w3", name: "Interview Prep", dept: "Career and Talent Development", mode: "single", minutes: 90,
    about: "One evening of mock interviews in small groups — common questions, how to answer them, and feedback on how you came across.",
    schedules: [
      { id: "w3a", days: [[3, 780]], start: "2026-10-07", count: 5, format: "inPerson", room: "Career Center, Library 2nd floor", organizer: "Eric Lynch", seats: 10, takenBy: [10, 7, 4, 1, 0] },
    ],
  },
  {
    id: "w4", name: "College Writing Lab", dept: "English Dept", course: "ENGL 101", mode: "series", minutes: 60,
    about: "Guided writing time alongside ENGL 101: thesis statements, structure, citations, revision. A tutor reads a page of your draft each week.",
    schedules: [
      { id: "w4a", days: [[2, 780], [4, 780]], start: "2026-10-06", count: 10, format: "inPerson", room: "Humanities Hall, Room 214", organizer: "Jonathan Rehm", seats: 18, taken: 9 },
      { id: "w4b", days: [[3, 1080]], start: "2026-10-07", count: 5, format: "video", organizer: "Priya Natarajan", seats: 25, taken: 11 },
    ],
  },
  {
    id: "w5", name: "Financial Literacy 101", dept: "Academic Advising", mode: "series", minutes: 60,
    about: "Budgeting on a student income, how aid and loans actually work, and building credit without debt — six evenings, online.",
    schedules: [
      { id: "w5a", days: [[4, 1020]], start: "2026-10-08", count: 6, format: "video", organizer: "Andy Hernandez", seats: 40, taken: 22 },
    ],
  },
  {
    id: "w6", name: "Transfer Application Night", dept: "Counseling", mode: "single", minutes: 120,
    about: "University representatives walk through this year's transfer applications and personal-insight questions, then answer yours.",
    schedules: [
      { id: "w6a", days: [[4, 1080]], start: "2026-10-15", count: 1, format: "inPerson", room: "Student Union, Main Hall", organizer: "George Amalor", seats: 60, takenBy: [31] },
    ],
  },
  // Already registered (seed `reg`): attendance for the sessions that have
  // happened, the organizer's notes after some of them (text + files), and
  // materials for the whole workshop. w8 is in progress — its 6th session is
  // today at 1:00 PM; w9 finished in September. Workshops whose last session
  // is past stay out of Book.
  {
    id: "w8", name: "First-Year Success Seminar", dept: "Academic Advising", mode: "series", minutes: 60,
    about: "Ten sessions through your first term: campus resources, study habits, planning your schedule, and a mentor to check in with.",
    schedules: [
      { id: "w8a", days: [[2, 780], [5, 780]], start: "2026-09-15", count: 10, format: "inPerson", room: "Student Services Building, Room 120", organizer: "Caitlin Moore", seats: 30, taken: 24 },
    ],
    materials: [
      { name: "Seminar syllabus.pdf", meta: "PDF · 240 KB" },
      { name: "Semester planner.xlsx", meta: "XLSX · 36 KB" },
    ],
    reg: {
      sched: 0,
      attendance: ["attended", "attended", "missed", "attended", "attended"],
      notes: {
        0: { text: "Thanks for coming to the first session! The syllabus and the goal-setting worksheet we started are attached — finish the worksheet before Friday.", files: [{ name: "Seminar syllabus.pdf", meta: "PDF · 240 KB" }, { name: "Goal-setting worksheet.docx", meta: "DOCX · 58 KB" }] },
        2: { text: "We walked through campus resources — tutoring, counseling, the career center. Since you missed it, the slides are attached.", files: [{ name: "Campus resources.pdf", meta: "PDF · 1.1 MB" }] },
        4: { text: "Good discussion on weekly study schedules. No homework this week — bring your planner on Friday." },
      },
    },
  },
  {
    id: "w9", name: "Library Research Basics", dept: "Tutoring Center", mode: "series", minutes: 60,
    about: "Three sessions on finding, judging and citing sources with the library's databases.",
    schedules: [
      { id: "w9a", days: [[2, 900], [4, 900]], start: "2026-09-08", count: 3, format: "inPerson", room: "Library, Room 204", organizer: "Priya Natarajan", seats: 20, taken: 14 },
    ],
    reg: {
      sched: 0,
      attendance: ["attended", "attended", "attended"],
      notes: {
        2: { text: "You finished all three sessions — your certificate is attached. Nice work!", files: [{ name: "Certificate of completion.pdf", meta: "PDF · 90 KB" }] },
      },
    },
  },
  {
    id: "w7", name: "Time Management Essentials", dept: "Student Mentoring", mode: "series", minutes: 45,
    about: "Four sessions on planning a semester, a week and a day — with a mentor checking in between them.",
    schedules: [
      { id: "w7a", days: [[2, 720]], start: "2026-10-06", count: 4, format: "inPerson", room: "Student Union, Room 3", organizer: "Craig Millett", seats: 16, taken: 16 },
    ],
  },
];
