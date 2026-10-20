// CX → Browse Classes. From three saved copies of the live page (2026-10-15):
// the empty search, the results for 2027 Spring · Undergraduate · ACCT, and
// ACCT C2003's sections with section 2000 expanded. Everything ACCT below is
// verbatim from those copies — codes, descriptions (truncated at 30
// characters by the source system, kept as-is), the section row and its
// details. The other subjects and sections are sample data so the filters
// have something to return.

export const TERMS = ["2026 Fall", "2027 Spring", "2027 Summer"];
export const CAREERS = ["Undergraduate", "Graduate", "Non-Credit"];
export const SUBJECTS = [
  { code: "ACCT", name: "Accounting" },
  { code: "BIOL", name: "Biology" },
  { code: "ENGL", name: "English" },
  { code: "MATH", name: "Mathematics" },
  { code: "PSYC", name: "Psychology" },
];

// [subject, catalog number, description, career]
export const COURSES = [
  ["ACCT", "C2003", "Management Accounting for Busi", "Undergraduate"],
  ["ACCT", "100Y", "General Accounting Summer", "Undergraduate"],
  ["ACCT", "201", "Financial Accounting I", "Undergraduate"],
  ["ACCT", "202", "Financial Accounting II", "Undergraduate"],
  ["ACCT", "203", "Managerial Accounting I", "Undergraduate"],
  ["ACCT", "298", "Accounting Internship", "Undergraduate"],
  ["ACCT", "300", "External Reporting I", "Undergraduate"],
  ["ACCT", "1001", "Introduction to Accounting", "Undergraduate"],
  ["ACCT", "2003", "Management Accounting for Busi", "Undergraduate"],
  ["ACCT", "4000", "Financial Accounting", "Undergraduate"],
  ["ACCT", "4001", "International Accounting", "Undergraduate"],
  ["ACCT", "6100", "Advanced Auditing", "Graduate"],
  ["BIOL", "101", "General Biology", "Undergraduate"],
  ["BIOL", "101L", "General Biology Lab", "Undergraduate"],
  ["BIOL", "210", "Human Anatomy", "Undergraduate"],
  ["BIOL", "220", "Microbiology", "Undergraduate"],
  ["ENGL", "101", "Composition I", "Undergraduate"],
  ["ENGL", "102", "Composition II", "Undergraduate"],
  ["ENGL", "205", "Introduction to Creative Writ", "Undergraduate"],
  ["MATH", "140", "Introductory Statistics", "Undergraduate"],
  ["MATH", "151", "Calculus I", "Undergraduate"],
  ["MATH", "152", "Calculus II", "Undergraduate"],
  ["PSYC", "101", "Introduction to Psychology", "Undergraduate"],
  ["PSYC", "210", "Developmental Psychology", "Undergraduate"],
  ["PSYC", "6000", "Research Methods", "Graduate"],
];

// The one section the live copy expanded, verbatim.
export const ACCT_C2003_SECTION = {
  section: "2000", component: "LEC", classNumber: "1861", session: "12W", sessionName: "Twelve Week",
  days: "We", daysLong: "Wednesday", start: "1:00 pm", end: "3:30 pm", room: "Angel 105", instructor: "Syndi B. Forbes",
  status: "Open", seats: [30, 30], waitlist: [0, 0],
  career: "Undergraduate", units: "3 units", grading: "Graded",
  dates: "01/23/2027 - 05/07/2027", meets: "We 1:00PM - 3:30PM", mode: "In Person",
  campus: "Hacienda Campus - Test", location: "Hacienda", components: "Lecture Required",
  textbooks: "Textbooks to be determined",
  links: ["HighPoint - test"],
};

export const INSTRUCTORS = ["Syndi B. Forbes", "Marcus Webb", "Elena Ruiz", "Priya Natarajan", "Jonathan Rehm", "Staff"];
export const ROOMS = ["Angel 105", "Angel 210", "Science 110", "Science 204", "Humanities 214", "Online"];

// Actions on a section, in the live order (the row menu and the details).
export const SECTION_ACTIONS = ["Add to Cart", "Enroll", "Add to Planner", "Add to Wishlist", "Add to Schedule Builder", "View Deadlines", "Share"];

// The Assistant's suggested questions on this page, verbatim.
export const BROWSE_PROMPTS = [
  "What can you assist me with?",
  "What classes are being offered this term?",
  "Find me open classes in the Biology department.",
  "Which classes still have open seats?",
  "What days and times does a class meet?",
];

// ACCT 100Y's sections, verbatim from the live screens (2026-10-20). A
// section can meet on more than one pattern — section 1 has two meetings,
// each with its own days, times, room and instructors. The live app masks an
// unassigned room as "***"; the prototype shows it as TBA. "-" = no
// instructor assigned.
export const ACCT_100Y_SECTIONS = [
  {
    section: "1", component: "LEC", classNumber: "1832", session: "1", sessionName: "Regular Academic Session",
    meetings: [
      { days: "Mo", start: "10:00 am", end: "12:30 pm", room: "***", instructors: ["Trisha Tang", "Stanley Star"] },
      { days: "MoWeFr", start: "9:00 am", end: "9:50 am", room: "***", instructors: [] },
    ],
    status: "Open", seats: [50, 50], waitlist: [0, 0],
    career: "Undergraduate", units: "3 units", grading: "Graded",
    dates: "08/30/2026 - 12/12/2026", mode: "In Person", campus: "Hacienda Campus - Test", location: "Hacienda", components: "Lecture Required",
    textbooks: "Textbooks to be determined", links: ["HighPoint - test"],
  },
  {
    section: "2", component: "LEC", classNumber: "1833", session: "1", sessionName: "Regular Academic Session",
    meetings: [{ days: "MoWeFr", start: "10:30 am", end: "11:20 am", room: "***", instructors: [] }],
    status: "Open", seats: [49, 50], waitlist: [0, 0],
    career: "Undergraduate", units: "3 units", grading: "Graded", consent: "Department Consent Required",
    description: "This is a general accounting course that must be taken by first year accounting majors. Department permission is required to enroll in this course.",
    dates: "08/30/2026 - 12/12/2026", mode: "In Person", campus: "Hacienda Campus - Test", location: "Hacienda", components: "Lecture Required",
    textbooks: "Textbooks to be determined", links: ["HighPoint - test"],
  },
  {
    section: "3", component: "LEC", classNumber: "1834", session: "1", sessionName: "Regular Academic Session",
    meetings: [{ days: "MoWeFr", start: "7:30 am", end: "8:20 am", room: "***", instructors: ["Stanley Star"] }],
    status: "Open", seats: [49, 50], waitlist: [0, 0],
    career: "Undergraduate", units: "3 units", grading: "Graded",
    dates: "08/30/2026 - 12/12/2026", mode: "In Person", campus: "Hacienda Campus - Test", location: "Hacienda", components: "Lecture Required",
    textbooks: "Textbooks to be determined", links: ["HighPoint - test"],
  },
];
